export class TaskDTO {
  constructor(task) {
    this.id = task._id;
    this.title = task.title;
    this.description = task.description;
    this.status = task.status;
    this.priority = task.priority;
    this.dueDate = task.dueDate;
    this.assignees = task.assignees;
    this.project = task.project;
    this.createdBy = task.createdBy;
    this.watchers = task.watchers;
    this.isAchieved = task.isAchieved;
    this.subTasks = task.subTasks;
    this.createdAt = task.createdAt;
    this.updatedAt = task.updatedAt;
  }
}

export class CreateTaskDTO {
  constructor(title, description, status, priority, dueDate, assignees) {
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.dueDate = dueDate;
    this.assignees = assignees;
  }
}

export class TimeLogDTO {
  constructor(hours, description) {
    this.hours = hours;
    this.description = description;
  }
}
