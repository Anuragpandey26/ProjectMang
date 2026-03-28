import { faker } from "@faker-js/faker";
import Chat from "../modules/chat/models/chat.js";

export const seedChats = async (projects, workspaces, users) => {
  try {
    console.log("[Seeder] Seeding chat messages...");

    const messages = [];

    // Create 20 project messages
    for (let i = 0; i < 20; i++) {
      const project = faker.helpers.arrayElement(projects);
      const projectMembers = project.members.map((m) => m.user);
      const sender = faker.helpers.arrayElement(projectMembers);

      messages.push({
        sender: sender,
        message: faker.lorem.sentence(),
        resourceType: "Project",
        resourceId: project._id,
        createdAt: faker.date.recent({ days: 30 }),
      });
    }

    // Create 20 workspace messages
    for (let i = 0; i < 20; i++) {
      const workspace = faker.helpers.arrayElement(workspaces);
      const workspaceMembers = workspace.members.map((m) => m.user);
      const sender = faker.helpers.arrayElement(workspaceMembers);

      messages.push({
        sender: sender,
        message: faker.lorem.sentence(),
        resourceType: "Workspace",
        resourceId: workspace._id,
        createdAt: faker.date.recent({ days: 30 }),
      });
    }

    const createdMessages = await Chat.insertMany(messages);
    console.log(`[Seeder] Created ${createdMessages.length} chat messages`);
    return createdMessages;
  } catch (error) {
    console.error("[Seeder] Error seeding chat messages:", error.message);
    throw error;
  }
};
