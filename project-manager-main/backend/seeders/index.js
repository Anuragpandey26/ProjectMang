import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedUsers } from "./user.seeder.js";
import { seedWorkspaces } from "./workspace.seeder.js";
import { seedProjects } from "./project.seeder.js";
import { seedTasks } from "./task.seeder.js";
import { seedChats } from "./chat.seeder.js";
import { seedActivities } from "./activity.seeder.js";
import logger from "../services/logger.service.js";

// Models
import User from "../modules/auth/models/user.js";
import Workspace from "../modules/workspace/models/workspace.js";
import Project from "../modules/project/models/project.js";
import Task from "../modules/task/models/task.js";
import Chat from "../modules/chat/models/chat.js";
import ActivityLog from "../modules/task/models/activity.js";

dotenv.config();

const clearDatabase = async () => {
  logger.info("[Seeder] Clearing existing data...");
  await User.deleteMany({});
  await Workspace.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  await Chat.deleteMany({});
  await ActivityLog.deleteMany({});
  logger.info("[Seeder] Database cleared");
};

const seedDatabase = async () => {
  try {
    logger.info("[Seeder] Starting database seeding...\n");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("[Seeder] Connected to MongoDB\n");

    // Clear existing data
    await clearDatabase();
    logger.info("");

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
    logger.info("");

    logger.info("[Seeder] Database seeding completed successfully!");
    logger.info("\n[Seeder] Summary:");
    logger.info(`   - Users: ${users.length}`);
    logger.info(`   - Workspaces: ${workspaces.length}`);
    logger.info(`   - Projects: ${projects.length}`);
    logger.info(`   - Tasks: ${tasks.length}`);
    logger.info(`   - Chat Messages: ${chats.length}`);
    logger.info(`   - Activity Logs: ${activities.length}`);
    logger.info("\n[Seeder] Demo Login:");
    logger.info("   Email: admin@catalyst.app");
    logger.info("   Password: Password123!");

    process.exit(0);
  } catch (error) {
    logger.error("[Seeder] Error seeding database:", error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
