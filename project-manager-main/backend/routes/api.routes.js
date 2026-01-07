import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/auth/user.routes.js";
import workspaceRoutes from "../modules/workspace/routes.js";
import projectRoutes from "../modules/project/routes.js";
import taskRoutes from "../modules/task/routes.js";
import chatRoutes from "../modules/chat/routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);

export default router;
