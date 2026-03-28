import { Queue } from "bullmq";
import redisService from "./redis.service.js";
import logger from "./logger.service.js";

/**
 * QueueService - Centralized BullMQ Queue Manager
 *
 * Redis-dependent: If Redis is not available, all methods are no-ops.
 * This allows the app to function without Redis (emails sent synchronously,
 * cron jobs handled by node-cron fallback).
 */

/** @type {Map<string, Queue>} Registry of active queues */
const queues = new Map();

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: {
    age: 24 * 60 * 60,
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60,
  },
};

class QueueService {
  constructor() {
    this.enabled = false;
  }

  /**
   * Initialize all application queues.
   * Skips silently if Redis is not available.
   */
  init() {
    const connection = redisService.getClient();
    if (!connection) {
      logger.warn("[QueueService] BullMQ queues skipped (Redis not available).");
      this.enabled = false;
      return;
    }

    this._registerQueue("email", connection);
    this._registerQueue("maintenance", connection);

    this.enabled = true;
    logger.info(`[QueueService] BullMQ queues initialized: ${[...queues.keys()].join(", ")}`);
  }

  /**
   * Check if the queue system is active.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * @private
   */
  _registerQueue(name, connection) {
    if (queues.has(name)) return;

    const queue = new Queue(name, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });

    // Handle queue errors gracefully (don't crash)
    queue.on("error", (err) => {
      logger.error(`[QueueService] Queue "${name}" error: ${err.message}`);
    });

    queues.set(name, queue);
  }

  /**
   * Add a job to a queue. Returns null if queues are disabled.
   */
  async addJob(queueName, jobName, data, opts = {}) {
    if (!this.enabled) return null;

    const queue = queues.get(queueName);
    if (!queue) {
      logger.warn(`[QueueService] Queue "${queueName}" not found.`);
      return null;
    }

    const job = await queue.add(jobName, data, opts);
    logger.info(
      `[QueueService] Job "${jobName}" added to "${queueName}" queue (ID: ${job.id})`
    );
    return job;
  }

  /**
   * Schedule a repeatable job. No-op if queues are disabled.
   */
  async addRepeatableJob(queueName, jobName, data = {}, repeatOpts = {}) {
    if (!this.enabled) return null;

    const queue = queues.get(queueName);
    if (!queue) {
      logger.warn(`[QueueService] Queue "${queueName}" not found.`);
      return null;
    }

    const job = await queue.add(jobName, data, {
      repeat: repeatOpts,
      ...DEFAULT_JOB_OPTIONS,
    });

    logger.info(
      `[QueueService] Repeatable job "${jobName}" scheduled on "${queueName}" queue`
    );
    return job;
  }

  /**
   * Get a queue instance by name.
   */
  getQueue(name) {
    return queues.get(name);
  }

  /**
   * Gracefully close all queues.
   */
  async closeAll() {
    for (const [name, queue] of queues) {
      await queue.close();
      logger.info(`[QueueService] Queue "${name}" closed.`);
    }
    queues.clear();
    this.enabled = false;
  }
}

export default new QueueService();
