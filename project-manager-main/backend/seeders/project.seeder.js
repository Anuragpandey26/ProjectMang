import { faker } from "@faker-js/faker";
import Project from "../modules/project/models/project.js";

export const seedProjects = async (workspaces, users) => {
  try {
    console.log("[Seeder] Seeding projects...");

    const projects = [];
    const statuses = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
    const tags = [
      "frontend",
      "backend",
      "design",
      "marketing",
      "research",
      "development",
      "testing",
      "deployment",
      "urgent",
      "feature",
    ];

    // Create 30 projects
    for (let i = 0; i < 30; i++) {
      const workspace = faker.helpers.arrayElement(workspaces);
      const workspaceMembers = workspace.members.map((m) => m.user);
      const creator = faker.helpers.arrayElement(workspaceMembers);
      const projectMemberCount = faker.number.int({ min: 2, max: 8 });
      const projectMembers = faker.helpers.arrayElements(
        workspaceMembers,
        projectMemberCount
      );

      const members = projectMembers.map((userId) => ({
        user: userId,
        role: faker.helpers.arrayElement(["manager", "contributor", "viewer"]),
      }));

      const startDate = faker.date.past({ years: 1 });
      const dueDate = faker.date.future({ years: 1, refDate: startDate });

      projects.push({
        title: faker.company.buzzPhrase(),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(statuses),
        startDate: startDate,
        dueDate: dueDate,
        tags: faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 4 })).join(","),
        workspace: workspace._id,
        createdBy: creator,
        members: members,
      });
    }

    const createdProjects = await Project.insertMany(projects);
    console.log(`[Seeder] Created ${createdProjects.length} projects`);
    return createdProjects;
  } catch (error) {
    console.error("[Seeder] Error seeding projects:", error.message);
    throw error;
  }
};
