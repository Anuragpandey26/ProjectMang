import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import User from "../modules/auth/models/user.js";

export const seedUsers = async () => {
  try {
    console.log("[Seeder] Seeding users...");

    const users = [];
    const password = await bcrypt.hash("Password123!", 10);

    // Create 30 users
    for (let i = 0; i < 30; i++) {
      users.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: password,
        profilePicture: faker.image.avatar(),
        isEmailVerified: true,
        lastLogin: faker.date.recent({ days: 30 }),
      });
    }

    // Add a demo admin user
    users.unshift({
      name: "Admin User",
      email: "admin@catalyst.app",
      password: password,
      profilePicture: faker.image.avatar(),
      isEmailVerified: true,
      lastLogin: new Date(),
    });

    const createdUsers = await User.insertMany(users);
    console.log(`[Seeder] Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("[Seeder] Error seeding users:", error.message);
    throw error;
  }
};
