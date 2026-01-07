import { faker } from "@faker-js/faker";
import ActivityLog from "../modules/task/models/activity.js";

export const seedActivities = async (users, tasks, projects, workspaces) => {
  try {
    console.log("🌱 Seeding activity logs...");

    const activities = [];
    // Valid enum values from ActivityLog model
    const actions = [
      "created_task",
      "updated_task",
      "created_subtask",
      "updated_subtask",
      "completed_task",
      "created_project",
      "updated_project",
      "completed_project",
      "created_workspace",
      "updated_workspace",
      "added_comment",
      "added_member",
      "removed_member",
      "joined_workspace",
      "transferred_workspace_ownership",
      "added_attachment",
      "logged_time",
      "sent_message",
    ];

    // Create 30 activities
    for (let i = 0; i < 30; i++) {
      const user = faker.helpers.arrayElement(users);
      const action = faker.helpers.arrayElement(actions);
      
      let resourceType, resourceId;
      
      if (action.includes("task")) {
        resourceType = "Task";
        resourceId = faker.helpers.arrayElement(tasks)._id;
      } else if (action.includes("project")) {
        resourceType = "Project";
        resourceId = faker.helpers.arrayElement(projects)._id;
      } else if (action.includes("workspace")) {
        resourceType = "Workspace";
        resourceId = faker.helpers.arrayElement(workspaces)._id;
      } else {
        resourceType = faker.helpers.arrayElement(["Task", "Project", "Workspace"]);
        resourceId = faker.helpers.arrayElement([
          ...tasks.map(t => t._id),
          ...projects.map(p => p._id),
          ...workspaces.map(w => w._id)
        ]);
      }

      activities.push({
        user: user._id,
        action: action,
        resourceType: resourceType,
        resourceId: resourceId,
        details: {
          description: faker.lorem.sentence(),
        },
        createdAt: faker.date.recent({ days: 30 }),
      });
    }

    const createdActivities = await ActivityLog.insertMany(activities);
    console.log(`✅ Created ${createdActivities.length} activity logs`);
    return createdActivities;
  } catch (error) {
    console.error("❌ Error seeding activity logs:", error.message);
    throw error;
  }
};
