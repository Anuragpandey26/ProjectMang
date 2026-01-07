export class WorkspaceDTO {
  constructor(workspace) {
    this.id = workspace._id;
    this.name = workspace.name;
    this.description = workspace.description;
    this.color = workspace.color;
    this.owner = workspace.owner;
    this.members = workspace.members;
    this.createdAt = workspace.createdAt;
    this.updatedAt = workspace.updatedAt;
  }
}

export class CreateWorkspaceDTO {
  constructor(name, description, color) {
    this.name = name;
    this.description = description;
    this.color = color;
  }
}

export class InviteMemberDTO {
  constructor(email, role) {
    this.email = email;
    this.role = role;
  }
}
