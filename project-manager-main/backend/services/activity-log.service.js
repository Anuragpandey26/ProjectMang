import ActivityLog from "../modules/task/models/activity.js";

class ActivityLogService {
  /**
   * Record user activity
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} resourceType - Type of resource (Task, Project, Workspace)
   * @param {string} resourceId - Resource ID
   * @param {object} details - Additional details
   * @returns {Promise<void>}
   */
  async recordActivity(userId, action, resourceType, resourceId, details) {
    try {
      await ActivityLog.create({
        user: userId,
        action,
        resourceType,
        resourceId,
        details,
      });
    } catch (error) {
      console.error("Failed to record activity:", error);
    }
  }

  /**
   * Get activity logs for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<Array>}
   */
  async getUserActivities(userId, limit = 50) {
    try {
      return await ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("user", "name email");
    } catch (error) {
      console.error("Failed to get user activities:", error);
      return [];
    }
  }

  /**
   * Get activity logs for a resource
   * @param {string} resourceType - Type of resource
   * @param {string} resourceId - Resource ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<Array>}
   */
  async getResourceActivities(resourceType, resourceId, limit = 50) {
    try {
      return await ActivityLog.find({ resourceType, resourceId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("user", "name email");
    } catch (error) {
      console.error("Failed to get resource activities:", error);
      return [];
    }
  }
}

export default new ActivityLogService();
