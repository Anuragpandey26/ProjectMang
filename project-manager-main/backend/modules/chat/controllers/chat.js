import chatService from "../services/chat.service.js";
import asyncHandler from "../../../middleware/async-handler.js";

/**
 * Handle sending a chat message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const newMessage = await chatService.sendMessage(req.user._id, req.body);
  res.status(201).json(newMessage);
});

/**
 * Handle fetching messages for a specific resource
 */
const getMessages = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.params;
  const messages = await chatService.getMessages(req.user._id, resourceType, resourceId);
  res.status(200).json(messages);
});

export { sendMessage, getMessages };