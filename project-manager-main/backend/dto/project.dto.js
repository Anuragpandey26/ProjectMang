export class ProjectDTO {
  constructor(project) {
    this.id = project._id;
    this.title = project.title;
    this.description = project.description;
    this.status = project.status;
    this.startDate = project.startDate;
    this.dueDate = project.dueDate;
    this.tags = project.tags;
    this.members = project.members;
    this.workspace = project.workspace;
    this.createdBy = project.createdBy;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
  }
}

export class CreateProjectDTO {
  constructor(title, description, status, startDate, dueDate, tags, members) {
    this.title = title;
    this.description = description;
    this.status = status;
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.tags = tags;
    this.members = members;
  }
}
