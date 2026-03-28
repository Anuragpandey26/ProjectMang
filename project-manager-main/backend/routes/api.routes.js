import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/auth/user.routes.js";
import workspaceRoutes from "../modules/workspace/routes.js";
import projectRoutes from "../modules/project/routes.js";
import taskRoutes from "../modules/task/routes.js";
import chatRoutes from "../modules/chat/routes.js";
import healthRoutes from "./health.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import searchRoutes from "./search.routes.js";
import { authLimiter } from "../middleware/rate-limiter.middleware.js";

const router = express.Router();

// Health check routes (no auth required)
router.use("/health", healthRoutes);

router.use("/auth", authLimiter, authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search", searchRoutes);

export default router;
