import { ROLE_PERMISSIONS } from "./role-permissions.js";
import { ROLE_HIERARCHY } from "./roles.js";
import Workspace from "../modules/workspace/models/workspace.js";
import Project from "../modules/project/models/project.js";

class RBACService {
  /**
   * Check if a role has a specific permission
   * @param {string} role - User's role
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(role, permission) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if user has permission in workspace context
   * @param {string} userId - User ID
   * @param {string} workspaceId - Workspace ID
   * @param {string} permission - Permission to check
   * @returns {Promise<boolean>}
   */
  async hasWorkspacePermission(userId, workspaceId, permission) {
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return false;
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!member) {
      return false;
    }

    return this.hasPermission(member.role, permission);
  }

  /**
   * Check if user has permission in project context
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {string} permission - Permission to check
   * @returns {Promise<boolean>}
   */
  async hasProjectPermission(userId, projectId, permission) {
    const project = await Project.findById(projectId).populate("workspace");
    
    if (!project) {
      return false;
    }

    // Check workspace membership first
    const workspace = project.workspace;
    const workspaceMember = workspace.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!workspaceMember) {
      return false;
    }

    // Check if user has specific project role
    const projectMember = project.members?.find(
      (m) => m.user.toString() === userId.toString()
    );

    // Use project role if exists, otherwise use workspace role
    const role = projectMember ? projectMember.role : workspaceMember.role;

    return this.hasPermission(role, permission);
  }

  /**
   * Get user's role in workspace
   * @param {string} userId - User ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<string|null>}
   */
  async getUserWorkspaceRole(userId, workspaceId) {
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return null;
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    return member ? member.role : null;
  }

  /**
   * Get user's role in project
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Promise<string|null>}
   */
  async getUserProjectRole(userId, projectId) {
    const project = await Project.findById(projectId).populate("workspace");
    
    if (!project) {
      return null;
    }

    const projectMember = project.members?.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (projectMember) {
      return projectMember.role;
    }

    // Fallback to workspace role
    const workspace = project.workspace;
    const workspaceMember = workspace.members.find(
      (m) => m.user.toString() === userId.toString()
    );

    return workspaceMember ? workspaceMember.role : null;
  }

  /**
   * Check if role1 is higher than role2 in hierarchy
   * @param {string} role1 - First role
   * @param {string} role2 - Second role
   * @returns {boolean}
   */
  isRoleHigher(role1, role2) {
    const level1 = ROLE_HIERARCHY[role1] || 0;
    const level2 = ROLE_HIERARCHY[role2] || 0;
    return level1 > level2;
  }

  /**
   * Check if user can manage another user (based on role hierarchy)
   * @param {string} managerRole - Manager's role
   * @param {string} targetRole - Target user's role
   * @returns {boolean}
   */
  canManageRole(managerRole, targetRole) {
    return this.isRoleHigher(managerRole, targetRole);
  }

  /**
   * Get all permissions for a role
   * @param {string} role - Role name
   * @returns {Array<string>}
   */
  getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user is workspace owner
   * @param {string} userId - User ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<boolean>}
   */
  async isWorkspaceOwner(userId, workspaceId) {
    const workspace = await Workspace.findById(workspaceId);
    return workspace?.owner.toString() === userId.toString();
  }

  /**
   * Check if user is project creator
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Promise<boolean>}
   */
  async isProjectCreator(userId, projectId) {
    const project = await Project.findById(projectId);
    return project?.createdBy.toString() === userId.toString();
  }
}

export default new RBACService();
