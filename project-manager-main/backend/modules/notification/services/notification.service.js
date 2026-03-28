import Notification from "../models/notification.js";
import { getIO } from "../../../services/socket.service.js";

/**
 * Notification Service
 * Handles in-app alerts and real-time delivery
 */
class NotificationService {
  /**
   * Create and deliver a notification
   */
  async createNotification(data) {
    const { recipient, sender, type, title, message, resourceId, resourceType } = data;

    // 1. Save to database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      resourceId,
      resourceType,
    });

    // 2. Populate sender details for the UI
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "name profilePicture")
      .lean();

    // 3. Emit real-time event via Socket.io
    try {
      const io = getIO();
      // Emit specifically to the recipient's private room
      io.to(`user:${recipient.toString()}`).emit("new_notification", populatedNotification);
    } catch (error) {
      console.warn("Socket.io not available for real-time notification:", error.message);
    }

    return populatedNotification;
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    return {
      notifications,
      total,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}

export default new NotificationService();
