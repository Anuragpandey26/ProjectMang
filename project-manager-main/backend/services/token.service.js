import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../modules/auth/models/refresh-token.js";
import BlacklistedToken from "../modules/auth/models/blacklisted-token.js";
import { AppError } from "../error-handlers/global.error-handler.js";
import redisService from "./redis.service.js";

// Redis key prefix for blacklisted tokens
const BLACKLIST_PREFIX = "bl:";

// Validate JWT_SECRET at module load time
if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables",
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(
  process.env.REFRESH_TOKEN_EXPIRY?.replace("d", "") || "7",
  10
);
const REFRESH_TOKEN_BYTES = 48;

class TokenService {
  /**
   * Get secure cookie options for refresh tokens
   */
  getCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    const secureCookies = process.env.SECURE_COOKIES === "true";

    return {
      httpOnly: true,
      secure: secureCookies || isProd,
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      signed: true,
    };
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(userId, additionalPayload = {}) {
    const payload = {
      sub: userId,
      type: "access",
      ...additionalPayload,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Create a refresh token for a user and store its hashed version in the DB.
   */
  async createRefreshTokenForUser(userId, deviceInfo = {}) {
    const raw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo,
    });

    return raw;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(userId, deviceInfo = {}) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = await this.createRefreshTokenForUser(userId, deviceInfo);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type !== "access") {
        throw new AppError("Invalid token type", 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Access token expired", 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid access token", 401);
      }
      throw error;
    }
  }

  /**
   * Blacklist an access token.
   * Stores in both Redis (for fast O(1) lookups) and MongoDB (as fallback).
   */
  async blacklistAccessToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return;

      const expiresAt = new Date(decoded.exp * 1000);
      const tokenHash = this.hashToken(token);

      // Calculate remaining TTL in seconds
      const ttlSeconds = Math.max(
        Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        0
      );

      // Store in Redis with auto-expiry (no manual cleanup needed)
      try {
        const redis = redisService.getClient();
        await redis.setex(`${BLACKLIST_PREFIX}${tokenHash}`, ttlSeconds, "1");
      } catch (redisErr) {
        console.warn("[TokenService] Redis blacklist write failed, relying on MongoDB:", redisErr.message);
      }

      // Also persist in MongoDB as a durable fallback
      await BlacklistedToken.create({
        token: tokenHash,
        expiresAt,
      });
    } catch (error) {
      console.error("Failed to blacklist token:", error);
    }
  }

  /**
   * Check if an access token is blacklisted.
   * Redis first (O(1), ~0.1ms), MongoDB fallback (O(log n), ~5-20ms).
   */
  async isTokenBlacklisted(token) {
    const tokenHash = this.hashToken(token);

    // 1. Check Redis (fast path)
    try {
      const redis = redisService.getClient();
      const exists = await redis.exists(`${BLACKLIST_PREFIX}${tokenHash}`);
      if (exists) return true;
    } catch (redisErr) {
      console.warn("[TokenService] Redis blacklist check failed, falling back to MongoDB:", redisErr.message);
    }

    // 2. Fallback to MongoDB
    const blacklisted = await BlacklistedToken.findOne({ token: tokenHash });
    return !!blacklisted;
  }

  /**
   * Consumes a refresh token (verifies and revokes it).
   * Implements Automatic Reuse Detection (ARD) for security breach mitigation.
   */
  async consumeRefreshToken(rawToken, deviceInfo = {}) {
    const tokenHash = this.hashToken(rawToken);

    // Look for the token regardless of revoked status to detect reuse
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      throw new AppError("Refresh token not found", 401);
    }

    // --- REUSE DETECTION (BREACH MITIGATION) ---
    if (storedToken.revoked) {
      console.warn(`[SECURITY BREACH] Revoked token reuse detected for user ${storedToken.userId}. Revoking all sessions.`);
      await this.revokeAllUserTokens(storedToken.userId);
      throw new AppError("Refresh token has already been used. All sessions revoked for security.", 401);
    }

    // --- EXPIRY CHECK ---
    if (storedToken.expiresAt < new Date()) {
      storedToken.revoked = true;
      await storedToken.save();
      throw new AppError("Refresh token expired", 401);
    }

    // --- FINGERPRINT CHECK ---
    if (deviceInfo.userAgent && storedToken.deviceInfo.userAgent !== deviceInfo.userAgent) {
      console.warn(`[SECURITY ALERT] Fingerprint mismatch for user ${storedToken.userId}. Possible hijack attempt.`);
      storedToken.revoked = true;
      await storedToken.save();
      throw new AppError("Security alert: Device fingerprint mismatch.", 401);
    }

    // Revoke it to prevent reuse (Rotation)
    storedToken.revoked = true;
    await storedToken.save();

    return storedToken.userId.toString();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, deviceInfo = {}) {
    const userId = await this.consumeRefreshToken(refreshToken, deviceInfo);

    // Generate new token pair
    return await this.generateTokenPair(userId, deviceInfo);
  }

  /**
   * Revokes refresh tokens matching a given raw token.
   */
  async revokeRefreshToken(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    await RefreshToken.updateMany(
      { tokenHash },
      { revoked: true }
    );
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany({ userId }, { revoked: true });
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId) {
    return await RefreshToken.find({
      userId,
      revoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select("deviceInfo createdAt expiresAt")
      .sort({ createdAt: -1 });
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const result = await RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { revoked: true, createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, 
      ],
    });

    return result.deletedCount;
  }

  /**
   * Helper to hash raw tokens
   */
  hashToken(raw) {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}

export default new TokenService();
