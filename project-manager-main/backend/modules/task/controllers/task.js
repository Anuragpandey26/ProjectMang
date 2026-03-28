import taskService from "../services/task.service.js";
import asyncHandler from "../../../middleware/async-handler.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";

/**
 * Handle task creation
 */
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const task = await taskService.createTask(projectId, req.body, req.user._id);
  res.status(201).json(task);
});

/**
 * Handle fetching task details
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const data = await taskService.getTaskById(taskId);
  res.status(200).json(data);
});

/**
 * Handle task title update
 */
const updateTaskTitle = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;
  const task = await taskService.updateTaskTitle(taskId, title, req.user._id);
  res.status(200).json(task);
});

/**
 * Handle task description update
 */
const updateTaskDescription = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { description } = req.body;
  const task = await taskService.updateTaskFields(taskId, { description }, req.user._id);
  res.status(200).json(task);
});

/**
 * Handle task status update
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const task = await taskService.updateTaskStatus(taskId, status, req.user._id);
  res.status(200).json(task);
});

/**
 * Handle task assignees update
 */
const updateTaskAssignees = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { assignees } = req.body;
  const task = await taskService.updateTaskFields(taskId, { assignees }, req.user._id);
  res.status(200).json(task);
});

/**
 * Handle task priority update
 */
const updateTaskPriority = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { priority } = req.body;
  const task = await taskService.updateTaskFields(taskId, { priority }, req.user._id);
  res.status(200).json(task);
});

/**
 * Handle subtask creation
 */
const addSubTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title } = req.body;
  const task = await taskService.addSubTask(taskId, title, req.user._id);
  res.status(201).json(task);
});

// Note: I skipped updateSubTask in service for brevity, adding it now
const updateSubTask = asyncHandler(async (req, res) => {
    const { taskId, subTaskId } = req.params;
    const { completed } = req.body;
    const task = await taskService.updateTaskFields(taskId, {}, req.user._id); // Just for check
    const subTask = task.subtasks.find(s => s._id.toString() === subTaskId);
    if (subTask) {
        subTask.completed = completed;
        await task.save();
    }
    res.status(200).json(task);
});

/**
 * Get activity logs
 */
const getActivityByResourceId = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;
  const activity = await taskService.getActivityByResourceId(resourceId);
  res.status(200).json(activity);
});

/**
 * Get task comments
 */
const getCommentsByTaskId = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const comments = await taskService.getCommentsByTaskId(taskId);
  res.status(200).json(comments);
});

/**
 * Handle adding a comment
 */
const addComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;
  const comment = await taskService.addComment(taskId, text, req.user._id);
  res.status(201).json(comment);
});

/**
 * Handle task watching
 */
const watchTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await taskService.watchTask(taskId, req.user._id);
  res.status(200).json(task);
});

/**
 * Handle archiving/achieving task
 */
const achievedTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await taskService.toggleArchiveTask(taskId, req.user._id);
  res.status(200).json(task);
});

/**
 * Get current user's tasks
 */
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getMyTasks(req.user._id);
  res.status(200).json(tasks);
});

/**
 * Handle time logging
 */
const logTaskTime = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await taskService.logTaskTime(taskId, req.body, req.user._id);
  res.status(201).json(task);
});

/**
 * Handle task attachment upload
 */
const addTaskAttachment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  if (!req.file) throw new AppError("No file uploaded", 400);
  const task = await taskService.addAttachment(taskId, req.file, req.user._id);
  res.status(201).json(task);
});

/**
 * Handle attachment removal
 */
const removeTaskAttachment = asyncHandler(async (req, res) => {
  const { taskId, attachmentId } = req.params;
  const task = await taskService.removeAttachment(taskId, attachmentId, req.user._id);
  res.status(200).json(task);
});

export {
  createTask,
  getTaskById,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskStatus,
  updateTaskAssignees,
  updateTaskPriority,
  addSubTask,
  updateSubTask,
  getActivityByResourceId,
  getCommentsByTaskId,
  addComment,
  watchTask,
  achievedTask,
  getMyTasks,
  logTaskTime,
  addTaskAttachment,
  removeTaskAttachment,
};