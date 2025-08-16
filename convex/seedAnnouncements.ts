import { action } from "./_generated/server";
import { api } from "./_generated/api";
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
  },
  {
    title: "🏆 Student Research Symposium 2024",
    content: "Present your research at our annual symposium! Cash prizes for top presentations. Abstract submissions due November 30th.\n\n🎯 Submit Abstract: https://research.university.edu/symposium\n💰 Prizes: $1000, $500, $250",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop"
  },
  {
    title: "🌟 New Mental Health Resources Available",
    content: "Free counseling services, stress management workshops, and peer support groups now available. Your mental health matters!\n\n🧠 Counseling Center: https://counseling.university.edu\n📞 Crisis Hotline: (555) 123-HELP",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop"
  },
  {
    title: "💻 Campus WiFi Upgrade Complete",
    content: "Enjoy faster internet speeds across campus! New WiFi 6 infrastructure provides 10x faster speeds and better reliability.\n\n📶 Network: UniversitySecure\n🔧 Tech Support: https://it.university.edu/wifi",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop"
  },
  {
    title: "🍕 New Food Trucks on Campus",
    content: "Five new food trucks have joined our campus dining options! From tacos to bubble tea, enjoy diverse cuisines between classes.\n\n🌮 Food Truck Schedule: https://dining.university.edu/trucks\n⭐ Rate Your Favorites: https://dining.university.edu/reviews",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop"
  },
  {
    title: "🚌 Free Campus Shuttle Service",
    content: "New shuttle service connects all campus buildings and nearby apartments. Runs every 15 minutes from 7 AM to 11 PM.\n\n🗺️ Route Map: https://transportation.university.edu/shuttle\n📱 Live Tracking: Download CampusRide app",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop"
  },
  {
    title: "🎨 Student Art Exhibition Opening",
    content: "Showcase of student artwork from all departments opens this Friday! Reception with refreshments at 6 PM in the Student Center.\n\n🖼️ Gallery Hours: Mon-Fri 9 AM-8 PM\n🎭 Artist Reception: Friday 6-8 PM",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop"
  },
  {
    title: "⚡ Campus Sustainability Initiative",
    content: "Join our carbon-neutral campus goal! New solar panels, recycling programs, and bike-sharing stations now available.\n\n♻️ Recycling Guide: https://sustainability.university.edu/recycle\n🚲 Bike Share: https://bikes.university.edu",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop"
  },
  {
    title: "🏀 Basketball Season Tickets Available",
    content: "Get your season tickets for our championship basketball team! Student discounts available. First game November 15th.\n\n🎫 Buy Tickets: https://athletics.university.edu/tickets\n📅 Schedule: https://athletics.university.edu/basketball",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop"
  },
  {
    title: "💼 Career Fair Next Week",
    content: "100+ employers will be on campus! Bring your resume and dress professionally. Tech, healthcare, finance, and more industries represented.\n\n👔 Career Fair: Wednesday 10 AM-4 PM, Student Center\n📄 Resume Review: https://career.university.edu/resume",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop"
  },
  {
    title: "🌍 Study Abroad Information Session",
    content: "Explore opportunities to study in Europe, Asia, and South America! Financial aid available for qualified students.\n\n✈️ Info Session: Thursday 7 PM, Room 205\n🌎 Programs: https://studyabroad.university.edu",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop"
  },
  {
    title: "🔒 Campus Security Updates",
    content: "New emergency alert system and additional security cameras installed. Download the SafeCampus app for instant notifications.\n\n📱 SafeCampus App: Available on App Store/Google Play\n🚨 Emergency: Call (555) 123-SAFE",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop"
  },
  {
    title: "🎵 Spring Concert Auditions",
    content: "Auditions for the spring concert are open to all students! Showcase your musical talents in our annual performance.\n\n🎤 Auditions: December 1-3, Music Building\n🎼 Sign Up: https://music.university.edu/auditions",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop"
  },
  {
    title: "🏊 New Aquatic Center Opening",
    content: "State-of-the-art swimming pool and fitness center opens next month! Olympic-size pool, hot tub, and modern gym equipment.\n\n🏊‍♀️ Pool Hours: 6 AM-10 PM daily\n💪 Gym Membership: https://recreation.university.edu/membership",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop"
  },
  {
    title: "📖 Free Textbook Lending Program",
    content: "Borrow textbooks for free! New program helps students save money on expensive course materials. Limited quantities available.\n\n📚 Browse Catalog: https://textbooks.university.edu\n⏰ Loan Period: Full semester",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop"
  },
  {
    title: "🌺 Campus Garden Project",
    content: "Help beautify our campus! Volunteer for the community garden project. Fresh vegetables will be donated to the local food bank.\n\n🌱 Volunteer: Saturdays 9 AM-12 PM\n📧 Sign Up: garden@university.edu",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop"
  },
  {
    title: "🎯 Entrepreneurship Competition",
    content: "$10,000 prize for the best business plan! Open to all students. Mentorship and workshops provided throughout the competition.\n\n💡 Submit Idea: https://entrepreneurship.university.edu/compete\n📅 Deadline: January 15th",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop"
  },
  {
    title: "🎪 Welcome Week Activities",
    content: "Join us for Welcome Week! Club fair, movie nights, game tournaments, and free pizza. Perfect opportunity to make new friends!\n\n🎉 Schedule: https://studentlife.university.edu/welcome\n🍕 Free Food: Daily 12-2 PM, Quad",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop"
  }
];

function getRandomDate(daysBack: number): number {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysBack);
  return now - (randomDays * 24 * 60 * 60 * 1000);
}

export const seedMainAnnouncements = action({
  args: {},
  handler: async (ctx) => {
    console.log("📢 Starting main announcements seeding...");

    // Create 20 main system announcements using helper
    for (let i = 0; i < MAIN_ANNOUNCEMENTS.length; i++) {
      const announcement = MAIN_ANNOUNCEMENTS[i];
      
      // Use a helper to get admin user ID
      const users = await ctx.runQuery(api.seedHelpers.getAllUsers, {});
      const adminUser = users.find((u: any) => u.email === "admin@university.edu");
      if (!adminUser) {
        throw new Error("Admin user not found. Please run main seed first.");
      }
      
      await ctx.runMutation(api.seedHelpers.insertAnnouncement, {
        title: announcement.title,
        content: announcement.content,
        authorId: adminUser._id,
        timestamp: getRandomDate(60),
        type: announcement.image ? "image" : "text"
      });
    }

    console.log(`📢 Created ${MAIN_ANNOUNCEMENTS.length} main system announcements with images`);
    
    return {
      success: true,
      message: `Created ${MAIN_ANNOUNCEMENTS.length} main announcements`
    };
  },
});
