import express from "express";
import { validateRequest } from "zod-express-middleware";
import { sendMessage, getMessages } from "./controllers/chat.js";
import authMiddleware from "../../middleware/auth-middleware.js";
import { sendMessageSchema, getMessagesSchema } from "../../dto/chat.dto.js";

const router = express.Router();

router.post(
    "/send",
    authMiddleware,
    validateRequest({
        body: sendMessageSchema,
    }),
    sendMessage
);

router.get(
    "/:resourceType/:resourceId",
    authMiddleware,
    validateRequest({
        params: getMessagesSchema,
    }),
    getMessages
);

export default router;
