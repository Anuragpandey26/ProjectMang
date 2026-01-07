import rbacService from "../rbac/rbac.service.js";
import { AppError } from "../error-handlers/global.error-handler.js";

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission
 * @param {string} context - Context type: 'workspace' or 'project'
 * @param {string} paramName - Parameter name containing resource ID
 */
export const requirePermission = (permission, context = null, paramName = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;

      // If no context, check global permission (not implemented yet)
      if (!context) {
        throw new AppError("Permission check requires context", 500);
      }

      let hasPermission = false;

      if (context === "workspace") {
        const workspaceId = req.params[paramName || "workspaceId"];
        
        if (!workspaceId) {
          throw new AppError("Workspace ID not found in request", 400);
        }

        hasPermission = await rbacService.hasWorkspacePermission(
          userId,
          workspaceId,
          permission
        );
      } else if (context === "project") {
        const projectId = req.params[paramName || "projectId"];
        
        if (!projectId) {
          throw new AppError("Project ID not found in request", 400);
        }

        hasPermission = await rbacService.hasProjectPermission(
          userId,
          projectId,
          permission
        );
      }

      if (!hasPermission) {
        throw new AppError("You don't have permission to perform this action", 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the required roles in workspace
 * @param {Array<string>} roles - Required roles
 */
export const requireWorkspaceRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const workspaceId = req.params.workspaceId;

      if (!workspaceId) {
        throw new AppError("Workspace ID not found in request", 400);
      }

      const userRole = await rbacService.getUserWorkspaceRole(userId, workspaceId);

      if (!userRole || !roles.includes(userRole)) {
        throw new AppError(
          `Access denied. Required role: ${roles.join(" or ")}`,
          403
        );
      }

      // Attach role to request for later use
      req.userWorkspaceRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the required roles in project
 * @param {Array<string>} roles - Required roles
 */
export const requireProjectRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const projectId = req.params.projectId;

      if (!projectId) {
        throw new AppError("Project ID not found in request", 400);
      }

      const userRole = await rbacService.getUserProjectRole(userId, projectId);

      if (!userRole || !roles.includes(userRole)) {
        throw new AppError(
          `Access denied. Required role: ${roles.join(" or ")}`,
          403
        );
      }

      // Attach role to request for later use
      req.userProjectRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is workspace owner
 */
export const requireWorkspaceOwner = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const workspaceId = req.params.workspaceId;

    if (!workspaceId) {
      throw new AppError("Workspace ID not found in request", 400);
    }

    const isOwner = await rbacService.isWorkspaceOwner(userId, workspaceId);

    if (!isOwner) {
      throw new AppError("Only workspace owner can perform this action", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to attach user's workspace role to request
 */
export const attachWorkspaceRole = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const workspaceId = req.params.workspaceId;

    if (workspaceId) {
      const userRole = await rbacService.getUserWorkspaceRole(userId, workspaceId);
      req.userWorkspaceRole = userRole;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to attach user's project role to request
 */
export const attachProjectRole = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const projectId = req.params.projectId;

    if (projectId) {
      const userRole = await rbacService.getUserProjectRole(userId, projectId);
      req.userProjectRole = userRole;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  requirePermission,
  requireWorkspaceRole,
  requireProjectRole,
  requireWorkspaceOwner,
  attachWorkspaceRole,
  attachProjectRole,
};
