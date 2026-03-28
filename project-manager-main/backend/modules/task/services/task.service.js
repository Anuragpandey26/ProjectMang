import activityLogService from "../../../services/activity-log.service.js";
import ActivityLog from "../models/activity.js";
import Comment from "../models/comment.js";
import Project from "../../project/models/project.js";
import Task from "../models/task.js";
import Workspace from "../../workspace/models/workspace.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";
import storageService from "../../../services/storage.service.js";
import notificationService from "../../notification/services/notification.service.js";
import User from "../../auth/models/user.js";

class TaskService {
  /**
   * Create a new task
   */
  async createTask(projectId, taskData, userId) {
    const { title, description, status, priority, dueDate, assignees } = taskData;

    const project = await Project.findById(projectId);
    if (!project) throw new AppError("Project not found", 404);

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) throw new AppError("Workspace not found", 404);

    const isMember = workspace.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this workspace", 403);

    const newTask = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignees,
      project: projectId,
      createdBy: userId,
    });

    // Notify assignees
    if (assignees && assignees.length > 0) {
      const creator = await User.findById(userId);
      for (const assigneeId of assignees) {
        if (assigneeId.toString() !== userId.toString()) {
          await notificationService.createNotification({
            recipient: assigneeId,
            sender: userId,
            type: "task_assigned",
            title: "New Task Assigned",
            message: `${creator.name} assigned you to the task "${title}"`,
            resourceId: newTask._id,
            resourceType: "Task",
          });
        }
      }
    }

    project.tasks.push(newTask._id);
    await project.save();

    return newTask;
  }

  /**
   * Get task details by ID
   */
  async getTaskById(taskId) {
    const task = await Task.findById(taskId)
      .populate("assignees", "name profilePicture")
      .populate("watchers", "name profilePicture")
      .populate("timeEntries.user", "name profilePicture");

    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name profilePicture"
    );

    return { task, project };
  }

  /**
   * Update task title
   */
  async updateTaskTitle(taskId, title, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const oldTitle = task.title;
    task.title = title;
    await task.save();

    await activityLogService.recordActivity(userId, "updated_task", "Task", taskId, {
      description: `updated task title from ${oldTitle} to ${title}`,
    });

    return task;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await activityLogService.recordActivity(userId, "updated_task", "Task", taskId, {
      description: `updated task status from ${oldStatus} to ${status}`,
    });

    return task;
  }

  // ... (Other update methods would go here, following the same pattern)
  
  /**
   * Add a subtask
   */
  async addSubTask(taskId, title, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const newSubTask = { title, completed: false };
    task.subtasks.push(newSubTask);
    await task.save();

    await activityLogService.recordActivity(userId, "created_subtask", "Task", taskId, {
      description: `created subtask ${title}`,
    });

    return task;
  }

  /**
   * Add a comment
   */
  async addComment(taskId, text, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const newComment = await Comment.create({
      text,
      task: taskId,
      author: userId,
    });

    task.comments.push(newComment._id);
    await task.save();

    await activityLogService.recordActivity(userId, "added_comment", "Task", taskId, {
      description: `added comment ${text.substring(0, 50) + (text.length > 50 ? "..." : "")}`,
    });

    // Handle @mentions in comments
    const mentions = text.match(/@(\w+)/g);
    if (mentions) {
      const creator = await User.findById(userId);
      for (const mention of mentions) {
        const username = mention.substring(1);
        const mentionedUser = await User.findOne({ name: new RegExp(`^${username}$`, "i") });
        
        if (mentionedUser && mentionedUser._id.toString() !== userId.toString()) {
          await notificationService.createNotification({
            recipient: mentionedUser._id,
            sender: userId,
            type: "task_comment_mention",
            title: "Mentioned in Comment",
            message: `${creator.name} mentioned you in task "${task.title}"`,
            resourceId: taskId,
            resourceType: "Task",
          });
        }
      }
    }

    return newComment;
  }

  /**
   * Get activity logs for a resource
   */
  async getActivityByResourceId(resourceId) {
    return await ActivityLog.find({ resourceId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });
  }

  /**
   * Get comments for a task
   */
  async getCommentsByTaskId(taskId) {
    return await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });
  }

  /**
   * Toggle task watching
   */
  async watchTask(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const isWatching = task.watchers.includes(userId);
    if (!isWatching) {
      task.watchers.push(userId);
    } else {
      task.watchers = task.watchers.filter(
        (watcher) => watcher.toString() !== userId.toString()
      );
    }

    await task.save();

    await activityLogService.recordActivity(userId, "updated_task", "Task", taskId, {
      description: `${isWatching ? "stopped watching" : "started watching"} task ${task.title}`,
    });

    return task;
  }

  /**
   * Toggle archived status
   */
  async toggleArchiveTask(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const isArchived = task.isArchived;
    task.isArchived = !isArchived;
    await task.save();

    await activityLogService.recordActivity(userId, "updated_task", "Task", taskId, {
      description: `${isArchived ? "unarchived" : "archived"} task ${task.title}`,
    });

    return task;
  }

  /**
   * Get tasks assigned to me
   */
  async getMyTasks(userId) {
    return await Task.find({ assignees: { $in: [userId] } })
      .populate("project", "title workspace")
      .sort({ createdAt: -1 });
  }

  /**
   * Log time on a task
   */
  async logTaskTime(taskId, timeData, userId) {
    const { hours, description } = timeData;

    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const newTimeEntry = {
      user: userId,
      hours,
      description,
      loggedAt: new Date(),
    };

    task.timeEntries.push(newTimeEntry);
    task.actualHours = (task.actualHours || 0) + hours;
    await task.save();

    await activityLogService.recordActivity(userId, "logged_time", "Task", taskId, {
      description: `logged ${hours} hours on task ${task.title}`,
    });

    return task;
  }

  // Simplified update logic for other fields
  async updateTaskFields(taskId, updates, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    Object.keys(updates).forEach(key => {
      task[key] = updates[key];
    });

    await task.save();
    return task;
  }

  /**
   * Add attachment to task
   */
  async addAttachment(taskId, file, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    // Upload to Cloudinary via StorageService
    const result = await storageService.upload(
      file.buffer,
      file.originalname,
      "tasks"
    );

    const newAttachment = {
      fileName: file.originalname,
      fileUrl: result.url,
      publicId: result.publicId, // Store for deletion
      fileType: result.type,
      fileSize: result.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    task.attachments.push(newAttachment);
    await task.save();

    await activityLogService.recordActivity(userId, "updated_task", "Task", taskId, {
      description: `uploaded attachment ${file.originalname}`,
    });

    return task;
  }

  /**
   * Remove attachment from task
   */
  async removeAttachment(taskId, attachmentId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError("Task not found", 404);

    const project = await Project.findById(task.project);
    if (!project) throw new AppError("Project not found", 404);

    const isMember = project.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this project", 403);

    const attachmentIndex = task.attachments.findIndex(
      (a) => a._id.toString() === attachmentId.toString()
    );
    if (attachmentIndex === -1) throw new AppError("Attachment not found", 404);

    const attachment = task.attachments[attachmentIndex];

    // Delete from Cloudinary
    await storageService.delete(attachment.publicId);

    // Remove from MongoDB
    task.attachments.splice(attachmentIndex, 1);
    await task.save();

    await activityLogService.recordActivity(userId, "updated_task", "Task", taskId, {
      description: `removed attachment ${attachment.fileName}`,
    });

    return task;
  }
}

export default new TaskService();
