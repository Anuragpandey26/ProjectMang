import notificationService from "../services/notification.service.js";
import asyncHandler from "../../../middleware/async-handler.js";

/**
 * Get current user's notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await notificationService.getUserNotifications(
    req.user._id,
    parseInt(page) || 1,
    parseInt(limit) || 20
  );
  res.status(200).json(data);
});

/**
 * Mark a notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id, req.user._id);
  res.status(200).json(notification);
});

/**
 * Mark all as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res.status(200).json({ message: "All notifications marked as read" });
});

export { getNotifications, markAsRead, markAllAsRead };
