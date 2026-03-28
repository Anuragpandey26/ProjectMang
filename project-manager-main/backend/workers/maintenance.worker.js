import { Worker } from "bullmq";
import redisService from "../services/redis.service.js";
import tokenService from "../services/token.service.js";
import workspaceService from "../modules/workspace/services/workspace.service.js";

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
    console.warn("[MaintenanceWorker] Skipped (Redis not available).");
    return null;
  }

  maintenanceWorker = new Worker(
    "maintenance",
    async (job) => {
      console.log(
        `[MaintenanceWorker] Processing job "${job.name}" (ID: ${job.id})`
      );

      switch (job.name) {
        case "cleanup-tokens": {
          const deletedCount = await tokenService.cleanupExpiredTokens();
          console.log(
            `[MaintenanceWorker] Removed ${deletedCount} expired/revoked tokens.`
          );
          return { deletedTokens: deletedCount };
        }

        case "cleanup-invitations": {
          const deletedCount = await workspaceService.cleanupOldInvitations();
          if (deletedCount > 0) {
            console.log(
              `[MaintenanceWorker] Purged ${deletedCount} stale invitations.`
            );
          }
          return { deletedInvitations: deletedCount };
        }

        default:
          console.warn(
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
    console.log(`[MaintenanceWorker] Job "${job.name}" completed:`, result);
  });

  maintenanceWorker.on("failed", (job, err) => {
    console.error(
      `[MaintenanceWorker] Job "${job?.name}" failed:`,
      err.message
    );
  });

  maintenanceWorker.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") {
      console.error("[MaintenanceWorker] Worker error:", err.message);
    }
  });

  console.log("[MaintenanceWorker] Started and listening for jobs.");
  return maintenanceWorker;
}

export async function stopMaintenanceWorker() {
  if (maintenanceWorker) {
    await maintenanceWorker.close();
    maintenanceWorker = null;
    console.log("[MaintenanceWorker] Worker stopped.");
  }
}
