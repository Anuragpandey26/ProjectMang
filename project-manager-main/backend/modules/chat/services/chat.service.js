import Chat from "../models/chat.js";
import Project from "../../project/models/project.js";
import Workspace from "../../workspace/models/workspace.js";
import activityLogService from "../../../services/activity-log.service.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";

class ChatService {
  /**
   * Validate if a user is a member of a resource (Project or Workspace)
   */
  async validateMembership(resourceType, resourceId, userId) {
    let resource;
    if (resourceType === "Project") {
      resource = await Project.findById(resourceId);
      if (!resource) throw new AppError("Project not found", 404);
      
      const isMember = resource.members.some(
        (member) => member.user.toString() === userId.toString()
      );
      if (!isMember) throw new AppError("You are not a member of this project", 403);
    } else if (resourceType === "Workspace") {
      resource = await Workspace.findById(resourceId);
      if (!resource) throw new AppError("Workspace not found", 404);
      
      const isMember = resource.members.some(
        (member) => member.user.toString() === userId.toString()
      );
      if (!isMember) throw new AppError("You are not a member of this workspace", 403);
    } else {
      throw new AppError("Invalid resource type", 400);
    }
    return resource;
  }

  /**
   * Send a new message
   */
  async sendMessage(userId, chatData) {
    const { resourceType, resourceId, message } = chatData;
    
    // Validate resource and membership
    await this.validateMembership(resourceType, resourceId, userId);

    const newMessage = await Chat.create({
      resourceType,
      resourceId,
      sender: userId,
      message,
    });

    await activityLogService.recordActivity(userId, "sent_message", resourceType, resourceId, {
      description: `sent a message: ${message.substring(0, 50) + (message.length > 50 ? "..." : "")}`,
    });

    return await Chat.findById(newMessage._id).populate("sender", "name profilePicture");
  }

  /**
   * Get messages for a specific resource
   */
  async getMessages(userId, resourceType, resourceId) {
    // Validate resource and membership
    await this.validateMembership(resourceType, resourceId, userId);

    return await Chat.find({ resourceType, resourceId })
      .populate("sender", "name profilePicture")
      .sort({ createdAt: 1 });
  }
}

export default new ChatService();
