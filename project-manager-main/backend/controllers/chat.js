import Chat from "../models/chat.js";
import Project from "../models/project.js";
import Workspace from "../models/workspace.js";
import { recordActivity } from "../libs/index.js";

const sendMessage = async (req, res) => {
  try {
    const { resourceType, resourceId, message } = req.body;

    let resource;
    if (resourceType === "Project") {
      resource = await Project.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Project not found" });
      }
      const isMember = resource.members.some(
        (member) => member.user.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this project" });
      }
    } else if (resourceType === "Workspace") {
      resource = await Workspace.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      const isMember = resource.members.some(
        (member) => member.user.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this workspace" });
      }
    } else {
      return res.status(400).json({ message: "Invalid resource type" });
    }

    const newMessage = await Chat.create({
      resourceType,
      resourceId,
      sender: req.user._id,
      message,
    });

    await recordActivity(req.user._id, "sent_message", resourceType, resourceId, {
      description: `sent a message: ${message.substring(0, 50) + (message.length > 50 ? "..." : "")}`,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessages = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;

    let resource;
    if (resourceType === "Project") {
      resource = await Project.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Project not found" });
      }
      const isMember = resource.members.some(
        (member) => member.user.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this project" });
      }
    } else if (resourceType === "Workspace") {
      resource = await Workspace.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      const isMember = resource.members.some(
        (member) => member.user.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this workspace" });
      }
    } else {
      return res.status(400).json({ message: "Invalid resource type" });
    }

    const messages = await Chat.find({ resourceType, resourceId })
      .populate("sender", "name profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { sendMessage, getMessages };