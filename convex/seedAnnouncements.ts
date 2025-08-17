import { mutation } from "./_generated/server";
import { v } from "convex/values";

// 20 Real announcements with actual images for main system
const MAIN_ANNOUNCEMENTS = [
  {
    title: "🎓 Fall 2024 Registration Now Open",
    content: "Registration for Fall 2024 semester is now open! Don't miss out on popular courses. Priority registration ends September 15th.\n\n📋 Registration Portal: https://student.university.edu/registration\n📚 Course Catalog: https://catalog.university.edu",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop"
  },
  {
    title: "🔬 New Science Lab Equipment Installed",
    content: "Our chemistry and physics labs have been upgraded with state-of-the-art equipment! New spectrometers, microscopes, and safety systems are now available.\n\n🧪 Lab Schedule: https://labs.university.edu/schedule\n🔬 Equipment Guide: https://labs.university.edu/equipment",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=400&fit=crop"
  },
  {
    title: "📚 Library Extended Hours During Finals",
    content: "The main library will be open 24/7 starting December 1st through December 20th. Study rooms available for reservation.\n\n📖 Reserve Study Rooms: https://library.university.edu/rooms\n☕ Café Hours: 6 AM - 2 AM",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
  }
];

function getRandomDate(daysBack: number): number {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysBack);
  return now - (randomDays * 24 * 60 * 60 * 1000);
}

export const seedMainAnnouncements = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("📢 Starting main announcements seeding...");

    // Get admin user directly from database
    const adminUser = await ctx.db.query("users")
      .filter(q => q.eq(q.field("email"), "admin@university.edu"))
      .first();
    
    if (!adminUser) {
      throw new Error("Admin user not found. Please run main seed first.");
    }

    // Create announcements directly
    for (let i = 0; i < MAIN_ANNOUNCEMENTS.length; i++) {
      const announcement = MAIN_ANNOUNCEMENTS[i];
      
      await ctx.db.insert("announcements", {
        title: announcement.title,
        content: announcement.content,
        authorId: adminUser._id,
        timestamp: getRandomDate(60),
        type: announcement.image ? "image" : "text"
      });
    }

    console.log(`📢 Created ${MAIN_ANNOUNCEMENTS.length} main system announcements`);
    
    return {
      success: true,
      message: `Created ${MAIN_ANNOUNCEMENTS.length} main announcements`
    };
  },
});
