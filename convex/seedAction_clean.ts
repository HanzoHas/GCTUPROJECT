import { action } from "./_generated/server";
// Removed api import to avoid circular dependencies
import { Id } from "./_generated/dataModel";
import { hashPassword } from "./utils/auth";

export const seedDatabase = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; stats: { users: number; channels: number; posts: number } }> => {
    console.log("🌱 Starting database seeding...");

    // Seed functionality temporarily disabled due to circular dependencies
    // This can be re-implemented later with a different architecture
    console.log("Seed functionality temporarily disabled");
    return { 
      success: false, 
      message: "Seed functionality temporarily disabled",
      stats: {
        users: 0,
        channels: 0,
        posts: 0
      }
    };
  },
});
