import projectService from "../services/project.service.js";
import asyncHandler from "../../../middleware/async-handler.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";

/**
 * Handle project creation
 */
const createProject = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const project = await projectService.createProject(workspaceId, req.body, req.user._id);
  res.status(201).json(project);
});

/**
 * Handle fetching project details
 */
const getProjectDetails = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await projectService.getProjectDetails(projectId, req.user._id);
  res.status(200).json(project);
});

/**
 * Handle fetching project tasks
 */
const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const data = await projectService.getProjectTasks(projectId, req.user._id);
  res.status(200).json(data);
});

/**
 * Handle project attachment upload
 */
const addProjectAttachment = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!req.file) throw new AppError("No file uploaded", 400);
  const project = await projectService.addAttachment(projectId, req.file, req.user._id);
  res.status(201).json(project);
});

/**
 * Handle attachment removal
 */
const removeProjectAttachment = asyncHandler(async (req, res) => {
  const { projectId, attachmentId } = req.params;
  const project = await projectService.removeAttachment(projectId, attachmentId, req.user._id);
  res.status(200).json(project);
});

export { 
  createProject, 
  getProjectDetails, 
  getProjectTasks,
  addProjectAttachment,
  removeProjectAttachment
};
