import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "./controllers/notification.js";
import authMiddleware from "../../middleware/auth-middleware.js";

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET /api-v1/notifications
router.get("/", getNotifications);

// PATCH /api-v1/notifications/:id/read
router.patch("/:id/read", markAsRead);

// POST /api-v1/notifications/read-all
router.post("/read-all", markAllAsRead);

export default router;
