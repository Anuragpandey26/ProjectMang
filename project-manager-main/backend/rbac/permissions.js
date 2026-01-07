// Define all permissions in the system
export const PERMISSIONS = {
  // Workspace permissions
  WORKSPACE_CREATE: "workspace:create",
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",
  WORKSPACE_INVITE: "workspace:invite",
  WORKSPACE_REMOVE_MEMBER: "workspace:remove_member",
  WORKSPACE_MANAGE_ROLES: "workspace:manage_roles",

  // Project permissions
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_ARCHIVE: "project:archive",
  PROJECT_MANAGE_MEMBERS: "project:manage_members",

  // Task permissions
  TASK_CREATE: "task:create",
  TASK_READ: "task:read",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_ASSIGN: "task:assign",
  TASK_COMMENT: "task:comment",
  TASK_UPDATE_STATUS: "task:update_status",

  // Chat permissions
  CHAT_READ: "chat:read",
  CHAT_SEND: "chat:send",
  CHAT_DELETE: "chat:delete",

  // User permissions
  USER_READ: "user:read",
  USER_UPDATE_SELF: "user:update_self",
  USER_DELETE_SELF: "user:delete_self",
};

export default PERMISSIONS;
