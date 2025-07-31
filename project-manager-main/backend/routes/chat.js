import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { sendMessage, getMessages } from "../controllers/chat.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();

router.post(
  "/send",
  authMiddleware,
  validateRequest({
    body: z.object({
      resourceType: z.enum(["Project", "Workspace"]),
      resourceId: z.string(),
      message: z.string().min(1, "Message is required"),
    }),
  }),
  sendMessage
);

router.get(
  "/:resourceType/:resourceId",
  authMiddleware,
  validateRequest({
    params: z.object({
      resourceType: z.enum(["Project", "Workspace"]),
      resourceId: z.string(),
    }),
  }),
  getMessages
);

export default router;