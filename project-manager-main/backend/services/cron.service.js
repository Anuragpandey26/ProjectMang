import cron from "node-cron";
import queueService from "./queue.service.js";
import tokenService from "./token.service.js";
import workspaceService from "../modules/workspace/services/workspace.service.js";

/**
 * CronService - Schedules background maintenance tasks
 *
 * Strategy:
 * - If Redis/BullMQ is available → uses BullMQ repeatable jobs (persistent, single-instance).
 * - If Redis is unavailable → falls back to node-cron (in-process, works everywhere).
 */
class CronService {
  /**
   * Initialize maintenance job scheduling.
   */
  async init() {
    if (queueService.isEnabled()) {
      await this._initBullMQ();
    } else {
      this._initNodeCron();
    }
  }

  /**
   * BullMQ mode: Jobs are persistent, retry-capable, and single-instance safe.
   * @private
   */
  async _initBullMQ() {
    console.log("[CronService] Scheduling maintenance jobs via BullMQ...");

    await queueService.addRepeatableJob(
      "maintenance",
      "cleanup-tokens",
      {},
      { pattern: "0 0 * * *" }
    );

    await queueService.addRepeatableJob(
      "maintenance",
      "cleanup-invitations",
      {},
      { pattern: "0 * * * *" }
    );

    console.log("[CronService] BullMQ repeatable jobs scheduled.");
  }

  /**
   * node-cron fallback: Works without Redis (in-process scheduling).
   * @private
   */
  _initNodeCron() {
    console.log("[CronService] Scheduling maintenance jobs via node-cron (fallback)...");

    // Token Cleanup: Every midnight
    cron.schedule("0 0 * * *", async () => {
      try {
        console.log("[Cron] Starting security token cleanup...");
        const deletedCount = await tokenService.cleanupExpiredTokens();
        console.log(`[Cron] Removed ${deletedCount} expired/revoked tokens.`);
      } catch (error) {
        console.error("[Cron] Token cleanup error:", error);
      }
    });

    // Invitation Cleanup: Every hour
    cron.schedule("0 * * * *", async () => {
      try {
        console.log("[Cron] Checking for stale invitations...");
        const deletedCount = await workspaceService.cleanupOldInvitations();
        if (deletedCount > 0) {
          console.log(`[Cron] Purged ${deletedCount} stale invitations.`);
        }
      } catch (error) {
        console.error("[Cron] Invitation cleanup error:", error);
      }
    });

    console.log("[CronService] node-cron jobs scheduled (fallback mode).");
  }
}

export default new CronService();
