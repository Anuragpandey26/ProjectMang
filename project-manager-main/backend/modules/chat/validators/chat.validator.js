import { z } from "zod";

export const sendMessageSchema = z.object({
  resourceType: z.enum(["Project", "Workspace"]),
  resourceId: z.string(),
  message: z.string().min(1, "Message is required"),
});

export const getMessagesSchema = z.object({
  resourceType: z.enum(["Project", "Workspace"]),
  resourceId: z.string(),
});
