import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { hashPassword } from "./utils/auth";

// Helper functions
function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysAgo: number): number {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysAgo);
  return now - (randomDays * 24 * 60 * 60 * 1000);
}

// Sample data arrays
const FIRST_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack",
  "Kate", "Liam", "Maya", "Noah", "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tara"
] as const;

const LAST_NAMES = [
  "Anderson", "Brown", "Clark", "Davis", "Evans", "Fisher", "Garcia", "Harris", "Johnson", "King",
  "Lee", "Miller", "Nelson", "Parker", "Quinn", "Roberts", "Smith", "Taylor", "Wilson", "Young"
] as const;

const STATUSES = ["Available", "Busy", "In class", "Offline"] as const;

const PROFILE_PICTURES = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
] as const;

const STUDY_CHANNELS = [
  { name: "Computer Science 101", description: "Introduction to Programming and Algorithms", level: "100" },
  { name: "Mathematics 201", description: "Calculus and Linear Algebra", level: "200" },
  { name: "Physics 150", description: "General Physics with Lab", level: "100" },
  { name: "Chemistry 110", description: "General Chemistry Fundamentals", level: "100" },
  { name: "Biology 202", description: "Molecular Biology and Genetics", level: "200" },
  { name: "Engineering 303", description: "Systems Design and Analysis", level: "300" },
  { name: "Statistics 201", description: "Data Analysis and Probability", level: "200" },
  { name: "Literature 101", description: "Introduction to World Literature", level: "100" }
] as const;

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; stats: { users: number; channels: number; posts: number } }> => {
    console.log("🌱 Starting database seeding...");

    try {
      // Create demo admin user
      const adminPasswordHash = await hashPassword("123456");
      const adminId = await ctx.db.insert("users", {
        email: "admin@university.edu",
        username: "demo_admin",
        passwordHash: adminPasswordHash,
        status: "Available",
        isAdmin: true,
        isLecturer: true,
        profilePicture: getRandomElement(PROFILE_PICTURES),
        profilePictureVersion: 1,
        blockedUsers: [],
        isHidden: false,
        notificationSettings: {
          enabled: true,
          newMessages: true,
          mentions: true,
          groupInvites: true,
          announcements: true,
        },
      });
      
      // Create email verification record for admin
      await ctx.db.insert("verificationCodes", {
        email: "admin@university.edu",
        username: "demo_admin",
        passwordHash: adminPasswordHash,
        verified: true,
        code: "SEEDED",
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });

      // Create demo users
      const userIds: Id<"users">[] = [adminId];
      for (let i = 0; i < 6; i++) {
        const firstName = getRandomElement(FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
        const email = `${username}@student.edu`;
        const passwordHash = await hashPassword("password123");

        const userId = await ctx.db.insert("users", {
          email,
          username,
          passwordHash,
          status: getRandomElement(STATUSES),
          isAdmin: false,
          isLecturer: false,
          profilePicture: getRandomElement(PROFILE_PICTURES),
          profilePictureVersion: 1,
          blockedUsers: [],
          isHidden: false,
          notificationSettings: {
            enabled: true,
            newMessages: true,
            mentions: true,
            groupInvites: true,
            announcements: true,
          },
        });
        
        // Create email verification record
        await ctx.db.insert("verificationCodes", {
          email,
          username,
          passwordHash,
          verified: true,
          code: "SEEDED",
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        });
        userIds.push(userId);
      }

      // Create study channels
      const channelIds: Id<"studyChannels">[] = [];
      for (const channelData of STUDY_CHANNELS) {
        const channelId = await ctx.db.insert("studyChannels", {
          name: channelData.name,
          description: channelData.description,
          lecturerId: adminId,
          level: channelData.level as "100" | "200" | "300",
          createdAt: Date.now(),
          isHidden: false,
        });
        channelIds.push(channelId);
      }

      console.log("✅ Database seeding completed successfully!");
      console.log("🔑 Demo admin credentials:");
      console.log("   Email: admin@university.edu");
      console.log("   Password: 123456");

      return {
        success: true,
        message: "Database seeded successfully",
        stats: {
          users: userIds.length,
          channels: channelIds.length,
          posts: 0
        }
      };

    } catch (error) {
      console.error("❌ Seeding failed:", error);
      throw error;
    }
  },
});
