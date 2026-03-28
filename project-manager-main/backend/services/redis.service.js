import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "./logger.service.js";

dotenv.config();

/**
 * RedisService - Singleton Redis connection manager (OPTIONAL)
 *
 * Redis is optional. When unavailable:
 * - Rate limiting falls back to in-memory store.
 * - Token blacklist falls back to MongoDB-only.
 * - BullMQ queues/workers are not started.
 * - Cron jobs fall back to node-cron via CronService.
 *
 * When available:
 * - All features use Redis for speed and scalability.
 */
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Attempt to connect to Redis.
   * Returns true if connected, false if Redis is unavailable.
   * NEVER throws — the app continues without Redis.
   */
  async connect() {
    if (this.client && this.isConnected) return true;

    return new Promise((resolve) => {
      const config = {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        maxRetriesPerRequest: null, // Required by BullMQ
        lazyConnect: true, // Don't connect automatically — we'll do it manually
        retryStrategy: (times) => {
          if (times > 3) {
            // Stop retrying after 3 attempts during startup
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      };

      if (process.env.REDIS_PASSWORD) {
        config.password = process.env.REDIS_PASSWORD;
      }

      this.client = new Redis(config);

      // Suppress error events so they don't crash the process
      this.client.on("error", () => {
        // Silently handled — isConnected stays false
      });

      this.client.on("connect", () => {
        this.isConnected = true;
      });

      this.client.on("close", () => {
        this.isConnected = false;
      });

      // Try to connect with a timeout
      const timeout = setTimeout(() => {
        this.isConnected = false;
        this.client.disconnect(false);
        this.client = null;
        console.warn("[Redis] Not available — running without it (using fallbacks).");
        resolve(false);
      }, 3000); // 3-second timeout

      this.client
        .connect()
        .then(() => {
          clearTimeout(timeout);
          this.isConnected = true;
          logger.info("[Redis] Connected successfully.");
          resolve(true);
        })
        .catch(() => {
          clearTimeout(timeout);
          this.isConnected = false;
          this.client.disconnect(false);
          this.client = null;
          logger.warn("[Redis] Not available - running without it (using fallbacks).");
          resolve(false);
        });
    });
  }

  /**
   * Check if Redis is currently available.
   */
  isAvailable() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get the raw ioredis client instance.
   * Returns null if Redis is not available.
   */
  getClient() {
    if (!this.isAvailable()) return null;
    return this.client;
  }

  /**
   * Create a duplicate connection (required by BullMQ for workers).
   * Returns null if Redis is not available.
   */
  createDuplicateConnection() {
    if (!this.isAvailable()) return null;
    return this.client.duplicate();
  }

  // ─── Cache Utilities (all return gracefully if Redis is down) ─────────

  /**
   * Set a value in Redis cache with optional TTL.
   * No-op if Redis is unavailable.
   */
  async set(key, value, ttlSeconds = null) {
    if (!this.isAvailable()) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      // Silently fail — caller has its own fallback
    }
  }

  /**
   * Get a value from Redis cache.
   * Returns null if Redis is unavailable.
   */
  async get(key) {
    if (!this.isAvailable()) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch {
      return null;
    }
  }

  /**
   * Delete a key from Redis.
   * No-op if Redis is unavailable.
   */
  async del(key) {
    if (!this.isAvailable()) return;
    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }

  /**
   * Check if a key exists in Redis.
   * Returns false if Redis is unavailable.
   */
  async exists(key) {
    if (!this.isAvailable()) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  // ─── Health Check ─────────────────────────────────────────────────────

  async ping() {
    if (!this.isAvailable()) return false;
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  /**
   * Gracefully close the Redis connection.
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Already disconnected
      }
      this.client = null;
      this.isConnected = false;
      logger.info("[Redis] Disconnected gracefully.");
    }
  }
}

export default new RedisService();
