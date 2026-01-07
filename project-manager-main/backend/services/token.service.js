import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../modules/auth/models/refresh-token.js";
import { AppError } from "../error-handlers/global.error-handler.js";

class TokenService {
  /**
   * Generate access token (short-lived)
   * @param {string} userId - User ID
   * @param {object} additionalPayload - Additional data to include in token
   * @returns {string} Access token
   */
  generateAccessToken(userId, additionalPayload = {}) {
    const payload = {
      userId,
      type: "access",
      ...additionalPayload,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m", // 15 minutes
    });
  }

  /**
   * Generate refresh token (long-lived)
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   */
  generateRefreshToken(userId) {
    const payload = {
      userId,
      type: "refresh",
      tokenId: crypto.randomBytes(32).toString("hex"),
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d", // 7 days
    });
  }

  /**
   * Generate both access and refresh tokens
   * @param {string} userId - User ID
   * @param {object} deviceInfo - Device information
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async generateTokenPair(userId, deviceInfo = {}) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Decode to get expiry
    const decoded = jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);

    // Store refresh token in database
    await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt,
      deviceInfo,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify access token
   * @param {string} token - Access token
   * @returns {object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
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
   * Verify refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<object>} Decoded token payload
   */
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      if (decoded.type !== "refresh") {
        throw new AppError("Invalid token type", 401);
      }

      // Check if token exists in database and is not revoked
      const storedToken = await RefreshToken.findOne({
        token,
        isRevoked: false,
      });

      if (!storedToken) {
        throw new AppError("Refresh token not found or revoked", 401);
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        throw new AppError("Refresh token expired", 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Refresh token expired", 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid refresh token", 401);
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {object} deviceInfo - Device information
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async refreshAccessToken(refreshToken, deviceInfo = {}) {
    const decoded = await this.verifyRefreshToken(refreshToken);

    // Revoke old refresh token
    await RefreshToken.updateOne(
      { token: refreshToken },
      { isRevoked: true }
    );

    // Generate new token pair
    return await this.generateTokenPair(decoded.userId, deviceInfo);
  }

  /**
   * Revoke refresh token (logout)
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async revokeRefreshToken(token) {
    await RefreshToken.updateOne({ token }, { isRevoked: true });
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserActiveSessions(userId) {
    return await RefreshToken.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .select("deviceInfo createdAt expiresAt")
      .sort({ createdAt: -1 });
  }

  /**
   * Clean up expired tokens (can be run as a cron job)
   * @returns {Promise<number>} Number of deleted tokens
   */
  async cleanupExpiredTokens() {
    const result = await RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isRevoked: true, createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Delete revoked tokens older than 30 days
      ],
    });

    return result.deletedCount;
  }
}

export default new TokenService();
