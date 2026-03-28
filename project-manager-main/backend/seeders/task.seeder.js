import { faker } from "@faker-js/faker";
import Task from "../modules/task/models/task.js";

export const seedTasks = async (projects, users) => {
  try {
    console.log("[Seeder] Seeding tasks...");

    const tasks = [];
    const statuses = ["To Do", "In Progress", "Done"];
    const priorities = ["Low", "Medium", "High"];

    // Create 30 tasks
    for (let i = 0; i < 30; i++) {
      const project = faker.helpers.arrayElement(projects);
      const projectMembers = project.members.map((m) => m.user);
      const creator = faker.helpers.arrayElement(projectMembers);
      const assigneeCount = faker.number.int({ min: 1, max: 3 });
      const assignees = faker.helpers.arrayElements(projectMembers, assigneeCount);

      const dueDate = faker.date.future({ years: 1 });
      const status = faker.helpers.arrayElement(statuses);
      const isAchieved = status === "Done" ? faker.datatype.boolean() : false;

      // Create subtasks
      const subTaskCount = faker.number.int({ min: 0, max: 5 });
      const subTasks = [];
      for (let j = 0; j < subTaskCount; j++) {
        subTasks.push({
          title: faker.hacker.phrase(),
          isCompleted: faker.datatype.boolean(),
        });
      }

      // Create time logs
      const timeLogCount = faker.number.int({ min: 0, max: 5 });
      const timeLogs = [];
      for (let k = 0; k < timeLogCount; k++) {
        timeLogs.push({
          user: faker.helpers.arrayElement(assignees),
          hours: faker.number.float({ min: 0.5, max: 8, precision: 0.5 }),
          description: faker.lorem.sentence(),
          loggedAt: faker.date.recent({ days: 30 }),
        });
      }

      tasks.push({
        title: faker.hacker.phrase(),
        description: faker.lorem.paragraph(),
        status: status,
        priority: faker.helpers.arrayElement(priorities),
        dueDate: dueDate,
        assignees: assignees,
        project: project._id,
        createdBy: creator,
        watchers: faker.helpers.arrayElements(projectMembers, faker.number.int({ min: 0, max: 3 })),
        isAchieved: isAchieved,
        subTasks: subTasks,
        timeLogs: timeLogs,
      });
    }

    const createdTasks = await Task.insertMany(tasks);
    console.log(`[Seeder] Created ${createdTasks.length} tasks`);
    return createdTasks;
  } catch (error) {
    console.error("[Seeder] Error seeding tasks:", error.message);
    throw error;
  }
};
