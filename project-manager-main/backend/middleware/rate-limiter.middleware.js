import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisService from "../services/redis.service.js";

/**
 * Rate Limiter Middleware - Redis-backed rate limiting
 *
 * Uses Redis as the store so rate limit counters are:
 * - Shared across all server instances (horizontal scaling)
 * - Persistent across server restarts
 * - Automatically cleaned up via Redis TTL
 *
 * Falls back gracefully to in-memory if Redis is unavailable.
 */

/**
 * Create a Redis-backed rate limit store.
 * Returns undefined if Redis isn't connected (express-rate-limit falls back to memory).
 * @param {string} prefix - Unique prefix for this limiter's Redis keys
 * @returns {RedisStore | undefined}
 */
function createRedisStore(prefix) {
  const client = redisService.getClient();
  if (!client) {
    console.warn(
      `[RateLimiter] Redis not available for "${prefix}" limiter. Using in-memory store.`
    );
    return undefined;
  }

  try {
    return new RedisStore({
      sendCommand: (...args) => client.call(...args),
      prefix: `rl:${prefix}:`,
    });
  } catch {
    console.warn(
      `[RateLimiter] Failed to create Redis store for "${prefix}". Using in-memory store.`
    );
    return undefined;
  }
}

/**
 * Global Rate Limiter
 * Standard protection for the entire API to prevent DDoS and general abuse.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: createRedisStore("global"),
});

/**
 * Auth Rate Limiter
 * Strict protection for login and registration to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per 15 minutes
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth"),
});

/**
 * Email Rate Limiter
 * Very strict protection for password resets and email verifications to prevent
 * spamming third-party email providers (like Resend).
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email-related requests per hour
  message: {
    message: "Too many email requests, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("email"),
});
