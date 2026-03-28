import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedUsers } from "./user.seeder.js";
import { seedWorkspaces } from "./workspace.seeder.js";
import { seedProjects } from "./project.seeder.js";
import { seedTasks } from "./task.seeder.js";
import { seedChats } from "./chat.seeder.js";
import { seedActivities } from "./activity.seeder.js";

// Models
import User from "../modules/auth/models/user.js";
import Workspace from "../modules/workspace/models/workspace.js";
import Project from "../modules/project/models/project.js";
import Task from "../modules/task/models/task.js";
import Chat from "../modules/chat/models/chat.js";
import ActivityLog from "../modules/task/models/activity.js";

dotenv.config();

const clearDatabase = async () => {
  console.log("[Seeder] Clearing existing data...");
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  await Chat.deleteMany({});
  await ActivityLog.deleteMany({});
  console.log("[Seeder] Database cleared");
};

const seedDatabase = async () => {
  try {
    console.log("[Seeder] Starting database seeding...\n");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[Seeder] Connected to MongoDB\n");

    // Clear existing data
    await clearDatabase();
    console.log("");

    // Seed in order (respecting dependencies)
    const users = await seedUsers();
    console.log("");

    const workspaces = await seedWorkspaces(users);
    console.log("");

    const projects = await seedProjects(workspaces, users);
    console.log("");

    const tasks = await seedTasks(projects, users);
    console.log("");

    const chats = await seedChats(projects, workspaces, users);
    console.log("");

    const activities = await seedActivities(users, tasks, projects, workspaces);
    console.log("");

    console.log("[Seeder] Database seeding completed successfully!");
    console.log("\n[Seeder] Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Workspaces: ${workspaces.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Tasks: ${tasks.length}`);
    console.log(`   - Chat Messages: ${chats.length}`);
    console.log(`   - Activity Logs: ${activities.length}`);
    console.log("\n[Seeder] Demo Login:");
    console.log("   Email: admin@catalyst.app");
    console.log("   Password: Password123!");

    process.exit(0);
  } catch (error) {
    console.error("[Seeder] Error seeding database:", error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
