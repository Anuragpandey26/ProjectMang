// Define all roles in the system
export const ROLES = {
  // System-wide roles
  SUPER_ADMIN: "super_admin",
  USER: "user",

  // Workspace roles
  WORKSPACE_OWNER: "owner",
  WORKSPACE_ADMIN: "admin",
  WORKSPACE_MEMBER: "member",
  WORKSPACE_VIEWER: "viewer",

  // Project roles
  PROJECT_MANAGER: "manager",
  PROJECT_CONTRIBUTOR: "contributor",
  PROJECT_VIEWER: "viewer",
};

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  
  // Workspace hierarchy
  [ROLES.WORKSPACE_OWNER]: 40,
  [ROLES.WORKSPACE_ADMIN]: 30,
  [ROLES.WORKSPACE_MEMBER]: 20,
  [ROLES.WORKSPACE_VIEWER]: 10,

  // Project hierarchy
  [ROLES.PROJECT_MANAGER]: 30,
  [ROLES.PROJECT_CONTRIBUTOR]: 20,
  [ROLES.PROJECT_VIEWER]: 10,

  [ROLES.USER]: 1,
};

export default ROLES;
