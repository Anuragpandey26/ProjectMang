import { Worker } from "bullmq";
import redisService from "../services/redis.service.js";
import resendAdapter from "../adapters/email/resend.adapter.js";
import logger from "../services/logger.service.js";

/**
 * Email Worker - Processes jobs from the "email" queue.
 *
 * Only starts if Redis is available. If not, emails are sent
 * synchronously via the EmailService fallback.
 */

let emailWorker = null;

/**
 * Initialize the email worker.
 * Returns null silently if Redis is not available.
 */
export function startEmailWorker() {
  const connection = redisService.createDuplicateConnection();
  if (!connection) {
    logger.warn("[EmailWorker] Skipped (Redis not available).");
    return null;
  }

  emailWorker = new Worker(
    "email",
    async (job) => {
      const { to, subject, html } = job.data;

      logger.info(
        `[EmailWorker] Processing job "${job.name}" (ID: ${job.id}) -> ${to}`
      );

      const success = await resendAdapter.sendEmail(to, subject, html);

      if (!success) {
        throw new Error(`Failed to send email to ${to}`);
      }

      logger.info(
        `[EmailWorker] Job "${job.name}" (ID: ${job.id}) completed.`
      );

      return { sent: true, to, subject };
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  emailWorker.on("completed", (job, result) => {
    logger.info(`[EmailWorker] Job "${job.name}" completed -> ${result.to}`);
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(
      `[EmailWorker] Job "${job?.name}" (ID: ${job?.id}) failed after ${job?.attemptsMade} attempts: ${err.message}`
    );
  });

  emailWorker.on("error", (err) => {
    // Don't log connection errors — Redis service already handles that
    if (err.code !== "ECONNREFUSED") {
      console.error("[EmailWorker] Worker error:", err.message);
    }
  });

  logger.info("[EmailWorker] Started and listening for jobs.");
  return emailWorker;
}

export async function stopEmailWorker() {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    logger.info("[EmailWorker] Worker stopped.");
  }
}
