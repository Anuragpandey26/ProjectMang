import Workspace from "../../workspace/models/workspace.js";
import Project from "../models/project.js";
import Task from "../../task/models/task.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";
import storageService from "../../../services/storage.service.js";
import activityLogService from "../../../services/activity-log.service.js";
import notificationService from "../../notification/services/notification.service.js";
import User from "../../auth/models/user.js";

class ProjectService {
  /**
   * Create a new project within a workspace
   */
  async createProject(workspaceId, projectData, userId) {
    const { title, description, status, startDate, dueDate, tags, members } = projectData;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new AppError("Workspace not found", 404);
    }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AppError("You are not a member of this workspace", 403);
    }

    const tagArray = tags ? (typeof tags === 'string' ? tags.split(",") : tags) : [];

    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members,
      createdBy: userId,
    });

    workspace.projects.push(newProject._id);
    await workspace.save();

    // Notify project members
    if (members && members.length > 0) {
      const creator = await User.findById(userId);
      for (const member of members) {
        if (member.user.toString() !== userId.toString()) {
          await notificationService.createNotification({
            recipient: member.user,
            sender: userId,
            type: "project_invitation",
            title: "Added to Project",
            message: `${creator.name} added you to the project "${title}"`,
            resourceId: newProject._id,
            resourceType: "Project",
          });
        }
      }
    }

    return newProject;
  }

  /**
   * Get project details
   */
  async getProjectDetails(projectId, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AppError("You are not a member of this project", 403);
    }

    return project;
  }

  /**
   * Get tasks associated with a project
   */
  async getProjectTasks(projectId, userId) {
    const project = await Project.findById(projectId).populate("members.user");

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const isMember = project.members.some(
      (member) => member.user._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AppError("You are not a member of this project", 403);
    }

    const tasks = await Task.find({
      project: projectId,
      isArchived: false,
    })
      .populate("assignees", "name profilePicture")
      .sort({ createdAt: -1 });

    return {
      project,
      tasks,
    };
  }

  /**
   * Add attachment to project
   */
  async addAttachment(projectId, file, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    // Upload to Cloudinary via StorageService
    const result = await storageService.upload(
      file.buffer,
      file.originalname,
      "projects"
    );

    const newAttachment = {
      fileName: file.originalname,
      fileUrl: result.url,
      publicId: result.publicId,
      fileType: result.type,
      fileSize: result.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    project.attachments.push(newAttachment);
    await project.save();

    await activityLogService.recordActivity(userId, "updated_project", "Project", projectId, {
      description: `uploaded attachment ${file.originalname}`,
    });

    return project;
  }

  /**
   * Remove attachment from project
   */
  async removeAttachment(projectId, attachmentId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const attachmentIndex = project.attachments.findIndex(
      (a) => a._id.toString() === attachmentId.toString()
    );
    if (attachmentIndex === -1) throw new AppError("Attachment not found", 404);

    const attachment = project.attachments[attachmentIndex];

    // Delete from Cloudinary
    await storageService.delete(attachment.publicId);

    // Remove from MongoDB
    project.attachments.splice(attachmentIndex, 1);
    await project.save();

    await activityLogService.recordActivity(userId, "updated_project", "Project", projectId, {
      description: `removed attachment ${attachment.fileName}`,
    });

    return project;
  }
}

export default new ProjectService();
