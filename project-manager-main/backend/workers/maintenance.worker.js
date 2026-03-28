import { Worker } from "bullmq";
import redisService from "../services/redis.service.js";
import tokenService from "../services/token.service.js";
import workspaceService from "../modules/workspace/services/workspace.service.js";
import logger from "../services/logger.service.js";

/**
 * Maintenance Worker - Processes scheduled maintenance jobs.
 *
 * Only starts if Redis is available. If not, CronService falls back
 * to node-cron for scheduling.
 */

let maintenanceWorker = null;

/**
 * Initialize the maintenance worker.
 * Returns null silently if Redis is not available.
 */
export function startMaintenanceWorker() {
  const connection = redisService.createDuplicateConnection();
  if (!connection) {
    logger.warn("[MaintenanceWorker] Skipped (Redis not available).");
    return null;
  }

  maintenanceWorker = new Worker(
    "maintenance",
    async (job) => {
      logger.info(
        `[MaintenanceWorker] Processing job "${job.name}" (ID: ${job.id})`
      );

      switch (job.name) {
        case "cleanup-tokens": {
          const deletedCount = await tokenService.cleanupExpiredTokens();
          logger.info(
            `[MaintenanceWorker] Removed ${deletedCount} expired/revoked tokens.`
          );
          return { deletedTokens: deletedCount };
        }

        case "cleanup-invitations": {
          const deletedCount = await workspaceService.cleanupOldInvitations();
          if (deletedCount > 0) {
            logger.info(
              `[MaintenanceWorker] Purged ${deletedCount} stale invitations.`
            );
          }
          return { deletedInvitations: deletedCount };
        }

        default:
          logger.warn(
            `[MaintenanceWorker] Unknown job name: "${job.name}". Skipping.`
          );
          return { skipped: true };
      }
    },
    {
      connection,
      concurrency: 1,
    }
  );

  maintenanceWorker.on("completed", (job, result) => {
    logger.info(`[MaintenanceWorker] Job "${job.name}" completed:`, result);
  });

  maintenanceWorker.on("failed", (job, err) => {
    logger.error(
      `[MaintenanceWorker] Job "${job?.name}" failed: ${err.message}`
    );
  });

  maintenanceWorker.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      logger.error(`[MaintenanceWorker] Worker error: ${err.message}`);
    }
  });

  logger.info("[MaintenanceWorker] Started and listening for jobs.");
  return maintenanceWorker;
}

export async function stopMaintenanceWorker() {
  if (maintenanceWorker) {
    await maintenanceWorker.close();
    maintenanceWorker = null;
    logger.info("[MaintenanceWorker] Worker stopped.");
  }
}
