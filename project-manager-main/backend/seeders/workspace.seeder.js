import { faker } from "@faker-js/faker";
import Workspace from "../modules/workspace/models/workspace.js";

export const seedWorkspaces = async (users) => {
  try {
    console.log("🌱 Seeding workspaces...");

    const workspaces = [];
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B739",
      "#52B788",
    ];

    // Create 25 workspaces
    for (let i = 0; i < 25; i++) {
      const owner = faker.helpers.arrayElement(users);
      const memberCount = faker.number.int({ min: 2, max: 10 });
      const workspaceMembers = faker.helpers.arrayElements(users, memberCount);

      const members = workspaceMembers.map((user) => ({
        user: user._id,
        role: user._id.equals(owner._id)
          ? "owner"
          : faker.helpers.arrayElement(["admin", "member", "viewer"]),
        joinedAt: faker.date.past({ years: 1 }),
      }));

      // Ensure owner is in members
      if (!members.some((m) => m.user.equals(owner._id))) {
        members.push({
          user: owner._id,
          role: "owner",
          joinedAt: faker.date.past({ years: 1 }),
        });
      }

      workspaces.push({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        color: faker.helpers.arrayElement(colors),
        owner: owner._id,
        members: members,
      });
    }

    const createdWorkspaces = await Workspace.insertMany(workspaces);
    console.log(`✅ Created ${createdWorkspaces.length} workspaces`);
    return createdWorkspaces;
  } catch (error) {
    console.error("❌ Error seeding workspaces:", error.message);
    throw error;
  }
};
