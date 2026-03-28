import workspaceService from "../services/workspace.service.js";
import asyncHandler from "../../../middleware/async-handler.js";

/**
 * Handle workspace creation
 */
const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(req.body, req.user._id);
  res.status(201).json(workspace);
});

/**
 * Handle fetching all workspaces for user
 */
const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getWorkspaces(req.user._id);
  res.status(200).json(workspaces);
});

/**
 * Handle fetching workspace details
 */
const getWorkspaceDetails = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const workspace = await workspaceService.getWorkspaceDetails(workspaceId);
  res.status(200).json(workspace);
});

/**
 * Handle fetching workspace projects
 */
const getWorkspaceProjects = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const data = await workspaceService.getWorkspaceProjects(workspaceId, req.user._id);
  res.status(200).json(data);
});

/**
 * Handle fetching workspace statistics
 */
const getWorkspaceStats = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const stats = await workspaceService.getWorkspaceStats(workspaceId, req.user._id);
  res.status(200).json(stats);
});

/**
 * Handle inviting a user to a workspace
 */
const inviteUserToWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const result = await workspaceService.inviteUser(workspaceId, req.body, req.user._id);
  res.status(200).json(result);
});

/**
 * Handle joining a workspace (invite token generated internally)
 * This was `acceptGenerateInvite` in the original but seems to be a simple "join".
 */
const acceptGenerateInvite = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const result = await workspaceService.acceptInviteByWorkspaceId(workspaceId, req.user._id);
  res.status(200).json(result);
});

/**
 * Handle accepting an invitation by token
 */
const acceptInviteByToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await workspaceService.acceptInvite(token);
  res.status(200).json(result);
});

export {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDetails,
  getWorkspaceProjects,
  getWorkspaceStats,
  inviteUserToWorkspace,
  acceptGenerateInvite,
  acceptInviteByToken,
};

