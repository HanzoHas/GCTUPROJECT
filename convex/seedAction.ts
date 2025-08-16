import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { hashPassword } from "./utils/auth";

// Available API modules
const {
  seedHelpers
} = api;

// Helper functions
function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysAgo: number): number {
  const now = Date.now();
  const daysInMs = daysAgo * 24 * 60 * 60 * 1000;
  return now - Math.random() * daysInMs;
}

// Sample data with realistic links and images
const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Casey", "Riley", "Jamie", "Morgan", "Quinn",
  "Avery", "Peyton", "Blake", "Cameron", "Drew", "Emery", "Finley", "Harper"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"
];

const PROFILE_PICTURES = [
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face"
];

const STATUSES = ["Available", "Busy", "In class", "Offline"] as const;

const STUDY_CHANNELS = [
  { name: "Computer Science 101", description: "Introduction to Programming and Algorithms", level: "100" },
  { name: "Mathematics 201", description: "Calculus and Linear Algebra", level: "200" },
  { name: "Physics 301", description: "Advanced Quantum Mechanics", level: "300" },
  { name: "Chemistry 102", description: "Organic Chemistry Fundamentals", level: "100" },
  { name: "Biology 202", description: "Molecular Biology and Genetics", level: "200" },
  { name: "Engineering 303", description: "Systems Design and Analysis", level: "300" },
  { name: "Statistics 201", description: "Data Analysis and Probability", level: "200" },
  { name: "Literature 101", description: "Introduction to World Literature", level: "100" }
];

const DEMO_ANNOUNCEMENTS = [
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

const TRENDING_POSTS = [
  {
    title: "🚀 Best Programming Resources for Beginners",
    content: `Just compiled a list of the best free programming resources that helped me land my internship at Google! 

**Free Courses:**
• https://www.freecodecamp.org/ - Full stack web development
• https://cs50.harvard.edu/ - Harvard's intro to computer science
• https://www.codecademy.com/ - Interactive coding lessons

**Practice Platforms:**
• https://leetcode.com/ - Coding interview prep
• https://www.hackerrank.com/ - Programming challenges
• https://codepen.io/ - Front-end practice

**YouTube Channels:**
• Traversy Media - Web development tutorials
• The Net Ninja - Modern JavaScript frameworks
• Programming with Mosh - Clean, professional tutorials

What resources helped you the most? Drop your favorites below! 👇`,
    tags: ["programming", "resources", "beginner", "coding"],
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop"
  },
  {
    title: "📚 Study Tips That Actually Work",
    content: `After 3 years of trial and error, here are the study methods that actually improved my GPA from 2.8 to 3.9:

**1. Active Recall** 🧠
Instead of re-reading notes, test yourself constantly. Use flashcards or explain concepts out loud.

**2. Pomodoro Technique** ⏰
25 minutes focused study + 5 minute break. Game changer for maintaining concentration.

**3. Study Groups** 👥
Teaching others forces you to truly understand the material. Plus it's more fun!

**4. Past Exams** 📝
Always practice with previous years' exams. Professors often reuse question formats.

**5. Sleep > All-nighters** 😴
I used to pull all-nighters. Now I prioritize 7-8 hours of sleep and my performance improved dramatically.

What study methods work best for you? Share your tips! 💭`,
    tags: ["study-tips", "productivity", "academic", "college-life"],
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop"
  },
  {
    title: "💼 Internship Application Timeline & Tips",
    content: `Got 5 internship offers this year! Here's my timeline and what worked:

**September-October:** Research companies
• Use LinkedIn, Glassdoor, company websites
• Attend career fairs and info sessions
• Network with alumni in your field

**November-December:** Applications
• Tailor each resume and cover letter
• Apply to 50-100 positions (seriously!)
• Use job boards: Indeed, LinkedIn, company sites

**January-March:** Interview prep
• Practice coding problems daily (for tech)
• Prepare behavioral questions (STAR method)
• Do mock interviews with career center

**Key Tips:**
✅ Apply early - many programs have rolling admissions
✅ Follow up after applications
✅ Prepare for technical AND behavioral questions
✅ Send thank you emails after interviews

**Resources:**
• https://www.glassdoor.com/ - Company reviews & salaries
• https://www.pramp.com/ - Free mock interviews
• https://www.cracking-the-coding-interview.com/ - Interview prep book

Starting early is everything! Good luck everyone! 🍀`,
    tags: ["internships", "career", "job-search", "professional"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
  },
  {
    title: "🏠 Off-Campus Housing Guide",
    content: `Moving off-campus next year? Here's everything I wish I knew:

**Budget Breakdown (per month):**
• Rent: $400-800 (depending on location)
• Utilities: $50-100 (electric, water, internet)
• Groceries: $200-300
• Transportation: $30-50

**Best Neighborhoods:**
🏘️ **University District** - Walking distance, pricier
🚌 **Riverside** - Cheaper, good bus routes  
🚗 **Suburban** - Need car, more space

**Apartment Hunting Tips:**
• Start looking in January for August move-in
• Visit in person, don't just trust photos
• Read lease carefully (subletting rules, pet policy)
• Check for hidden fees (parking, gym, etc.)

**Red Flags to Avoid:**
❌ No written lease
❌ Pressure to sign immediately  
❌ Landlord won't show you the actual unit
❌ Too good to be true pricing

**Useful Websites:**
• https://www.apartments.com/
• https://www.zillow.com/rentals/
• Facebook Marketplace
• University housing board

Anyone have specific questions about the process? Happy to help! 🏡`,
    tags: ["housing", "off-campus", "apartment", "student-life"],
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop"
  },
  {
    title: "🍕 Best Food Spots Near Campus (Budget Edition)",
    content: `Broke college student's guide to eating well without breaking the bank! 💸

**Under $5:**
🌮 **Taco Bell** - $5 cravings box is unbeatable
🍕 **Little Caesars** - $5 hot-n-ready pizza
🥪 **Subway** - Daily deals and student discount
☕ **Campus Coffee** - $3 breakfast burritos

**$5-10:**
🍔 **Five Guys** - Expensive but worth it occasionally  
🍜 **Pho Saigon** - Huge bowls, great for sharing
🌯 **Chipotle** - Use the app for rewards
🍗 **Raising Cane's** - Best chicken fingers ever

**Grocery Hacks:**
• Shop at Aldi for basics (so cheap!)
• Buy generic brands (same quality, half price)
• Meal prep on Sundays
• Use student discounts at Target/Walmart

**Free Food Events:**
• Club meetings (always have pizza)
• Study sessions during finals
• Career fair booths
• Religious organizations (they feed everyone!)

**Money-Saving Apps:**
• Honey - Automatic coupon codes
• Rakuten - Cash back on purchases  
• GasBuddy - Find cheapest gas prices

What are your favorite cheap eats? Drop recommendations! 🤤`,
    tags: ["food", "budget", "student-life", "money-saving"],
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400&fit=crop"
  }
];

const MESSAGE_TEMPLATES = [
  "Has anyone started working on the assignment yet?",
  "I'm having trouble with question 3. Can someone help?",
  "The lecture notes have been updated with this week's material.",
  "Don't forget about the quiz tomorrow!",
  "Can someone explain the concept from today's class?",
  "I found this resource helpful: https://www.khanacademy.org/computing/computer-programming",
  "Check out this tutorial: https://www.codecademy.com/learn/introduction-to-javascript",
  "Great explanation here: https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  "Let's schedule a study group for the exam.",
  "Thanks for your help everyone!",
  "Here's a useful video: https://www.youtube.com/watch?v=W6NZfCO5SIk",
  "Found this GitHub repo with examples: https://github.com/microsoft/TypeScript",
  "Stack Overflow discussion: https://stackoverflow.com/questions/tagged/javascript",
  "Free course on Coursera: https://www.coursera.org/learn/machine-learning",
  "Documentation link: https://docs.python.org/3/tutorial/",
  "Interactive coding practice: https://leetcode.com/problemset/all/",
  "Great blog post: https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
  "Cheat sheet: https://devhints.io/react"
];

const ANNOUNCEMENT_TITLES = [
  "📚 Important Update: Assignment Deadline Extended",
  "🎓 New Study Material Available",
  "⚠️ Class Cancellation Notice",
  "👨‍🏫 Upcoming Guest Lecture",
  "📅 Exam Schedule Update",
  "💻 New Programming Resources Added",
  "🔗 Useful Links for This Week's Topic"
];

const POST_TITLES = [
  "🚀 Best Practices for Remote Learning",
  "👥 Study Group Forming for CS101",
  "🤝 Looking for Project Partners",
  "🏫 Campus Resources You Should Know About",
  "⏰ Time Management Tips for Students",
  "📖 Free Programming Resources Collection",
  "💼 Interview Preparation Guide",
  "🌟 Open Source Projects to Contribute To",
  "🎯 Career Fair Tips and Tricks",
  "📝 Internship Application Deadlines"
];

const POST_CONTENTS = [
  `🚀 **Free Programming Resources Collection**

• https://www.freecodecamp.org/ - Free coding bootcamp with certificates
• https://www.codecademy.com/ - Interactive learning platform
• https://github.com/public-apis/public-apis - Collection of useful APIs
• https://www.w3schools.com/ - Web development tutorials
• https://developer.mozilla.org/ - Comprehensive web docs

What are your favorite learning resources? Drop them in the comments! 👇`,

  `📚 **Study Materials for This Week**

Just discovered this incredible tutorial series:
https://www.youtube.com/playlist?list=PLWKjhJtqVAbleDe3_ZA8h3AO2rXar-q2V

It covers everything from basics to advanced topics. The explanations are crystal clear and the examples are practical. Highly recommend checking it out!

Also found these useful resources:
• https://www.geeksforgeeks.org/ - Algorithm explanations
• https://visualgo.net/ - Algorithm visualizations`,

  `🤝 **Looking for Study Partners!**

We're forming study groups for:
📊 Data Structures & Algorithms
💻 Web Development Projects  
🤖 Machine Learning Basics
🎨 UI/UX Design Principles

Useful practice sites:
• https://leetcode.com/ - Coding challenges
• https://codepen.io/ - Frontend practice
• https://kaggle.com/ - Data science competitions

DM me if you're interested in joining! 📩`,

  `💡 **Career Advice Thread**

Share your internship experiences and tips here! 

Helpful resources for job hunting:
• https://www.glassdoor.com/ - Company reviews and salaries
• https://www.linkedin.com/learning/ - Professional development courses
• https://github.com/ - Showcase your projects
• https://stackoverflow.com/ - Build your developer reputation

What's the best career advice you've received? 🤔`,

  `🔧 **Development Tools & Resources**

Essential tools every developer should know:

**Code Editors:**
• https://code.visualstudio.com/ - VS Code (most popular)
• https://www.jetbrains.com/idea/ - IntelliJ IDEA

**Version Control:**
• https://git-scm.com/ - Git documentation
• https://github.com/ - Code hosting

**Learning Platforms:**
• https://www.udemy.com/ - Comprehensive courses
• https://www.pluralsight.com/ - Tech skills platform

What tools do you swear by? 🛠️`
];

const COMMENT_TEMPLATES = [
  "Great post! I completely agree with your points.",
  "Thanks for sharing this information, really helpful!",
  "I have a different perspective on this topic...",
  "This was exactly what I was looking for, thanks!",
  "Can you provide more details about the implementation?",
  "Here's another resource I found useful: https://www.freecodecamp.org/",
  "I recommend checking out: https://www.coursera.org/learn/machine-learning",
  "Similar discussion here: https://www.reddit.com/r/programming/",
  "Great tutorial on this topic: https://www.w3schools.com/",
  "Official documentation: https://docs.python.org/3/",
  "YouTube explanation: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "Stack Overflow thread: https://stackoverflow.com/questions/tagged/javascript"
];

type Level = "100" | "200" | "300";
type Theme = "light" | "dark";
type FontSize = "small" | "medium" | "large";
type ChatBackground = "default" | "gradient1" | "gradient2";
type ContactPreference = "everyone" | "friends" | "nobody";
type TimeFormat = "12h" | "24h";

export const seedDatabase = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; stats: { users: number; channels: number; posts: number } }> => {
    console.log("🌱 Starting database seeding...");

    // Hash passwords using the same function as auth system
    const adminPasswordHash = hashPassword("123456");
    const userPasswordHash = hashPassword("password123");

    // Create demo admin account with school email
    const adminId = await ctx.runMutation(seedHelpers.insertUser, {
      email: "admin@university.edu", // Use school domain
      username: "demo_admin",
      passwordHash: adminPasswordHash,
      status: "Available",
      isAdmin: true,
      isLecturer: true,
      profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      blockedUsers: [],
      isHidden: false,
      notificationSettings: {
        enabled: true,
        newMessages: true,
        mentions: true,
        groupInvites: true,
        announcements: true,
      }
    });

    console.log("👤 Created demo admin account");

    // Create 15 additional users with realistic profiles
    const userIds: Id<"users">[] = [adminId];
    for (let i = 0; i < 15; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${getRandomNumber(10, 99)}`;
      const email = `${username}@example.com`;
      const status = getRandomElement(STATUSES);
      const isLecturer = Math.random() < 0.3; // 30% chance of being a lecturer
      
      const userId = await ctx.runMutation(seedHelpers.insertUser, {
        email,
        username,
        passwordHash: userPasswordHash,
        status,
        isAdmin: false,
        isLecturer,
        profilePicture: getRandomElement(PROFILE_PICTURES),
        blockedUsers: [],
        isHidden: false,
        notificationSettings: {
          enabled: true,
          newMessages: true,
          mentions: true,
          groupInvites: true,
          announcements: true,
        }
      });
      
      userIds.push(userId);
    }

    console.log(`👥 Created ${userIds.length - 1} additional users`);

    // Create study channels
    const channelIds = [];
    const numChannels = getRandomNumber(6, 8);
    
    for (let i = 0; i < numChannels; i++) {
      const channel = STUDY_CHANNELS[i % STUDY_CHANNELS.length];
      
      // Find lecturers from our user list
      const lecturerIds = userIds.slice(1).filter(() => Math.random() < 0.3);
      const lecturerId: Id<"users"> = lecturerIds.length > 0 ? getRandomElement(lecturerIds) : adminId;
      
      const channelId = await ctx.runMutation(seedHelpers.insertChannel, {
        name: channel.name,
        description: channel.description,
        lecturerId,
        level: channel.level as Level,
        createdAt: getRandomDate(60),
        isHidden: true // Make main channels hidden by default
      });
      
      channelIds.push(channelId);
    }

    console.log(`📚 Created ${channelIds.length} study channels`);

    // Create subchannels and populate with data
    for (const channelId of channelIds) {
      // Get channel details for naming convention
      const channel = await ctx.runQuery(seedHelpers.getChannelById, { channelId });
      const channelName = channel?.name || "Unknown Channel";
      
      const numSubchannels = getRandomNumber(3, 6);
      
      for (let i = 0; i < numSubchannels; i++) {
        const subchannelName = `Section ${String.fromCharCode(65 + i)}`;
        
        const subchannelId = await ctx.runMutation(seedHelpers.insertSubchannel, {
          channelId,
          name: subchannelName,
          description: `${subchannelName} for collaborative learning and discussions`,
          studentGroups: [`Group ${String.fromCharCode(65 + i)}`],
          createdAt: getRandomDate(45)
        });

        // Create conversation for this subchannel using proper naming convention
        const conversationName = `${subchannelName} - ${channelName}`;
        const conversationId = await ctx.runMutation(seedHelpers.insertConversation, {
          name: conversationName,
          isGroup: true,
          creatorId: adminId,
          type: "group",
          isActive: true,
          members: userIds
        });

        // Add 50-150 messages with realistic content and links
        const numMessages = getRandomNumber(50, 150);
        for (let j = 0; j < numMessages; j++) {
          const authorId = getRandomElement(userIds);
          const content = getRandomElement(MESSAGE_TEMPLATES);
          
          await ctx.runMutation(seedHelpers.insertMessage, {
            conversationId,
            content,
            senderId: authorId,
            timestamp: getRandomDate(30),
            type: "text",
            isDeleted: false,
            isEdited: false
          });
        }

        // Add 3 announcements to this subchannel
        for (let j = 0; j < 3; j++) {
          const title = getRandomElement(ANNOUNCEMENT_TITLES);
          const announcementContents = [
            `📢 This is an important announcement regarding ${subchannelName}. Please check the course materials for updates.\n\n🔗 Course materials: https://www.example-lms.com/courses/cs101\n📖 Textbook resources: https://www.pearson.com/`,
            `⚠️ Reminder: Assignment due next week!\n\n📝 Submission portal: https://www.gradescope.com/\n💡 Help resources: https://www.chegg.com/study\n📚 Library access: https://www.jstor.org/`,
            `🎓 Guest lecture scheduled for next Friday!\n\n👨‍💼 Speaker: Industry Expert from Google\n🔗 Zoom link: https://zoom.us/j/123456789\n📅 Calendar invite: https://calendar.google.com/`
          ];
          const content = getRandomElement(announcementContents);
          
          await ctx.runMutation(seedHelpers.insertChannelAnnouncement, {
            title,
            content,
            channelId,
            subchannelId,
            authorId: adminId,
            timestamp: getRandomDate(30),
            type: "text"
          });
        }
      }
    }

    console.log("💬 Created subchannels with messages and announcements");

    // Create posts
    const postIds = [];
    for (let i = 0; i < 10; i++) {
      const title = getRandomElement(POST_TITLES);
      const content = getRandomElement(POST_CONTENTS);
      const authorId = getRandomElement(userIds);
      const postId = await ctx.runMutation(seedHelpers.insertPost, {
        title,
        content,
        authorId,
        createdAt: getRandomDate(30),
        upvotes: getRandomNumber(15, 150),
        commentCount: getRandomNumber(5, 25),
        tags: ["general", "discussion"],
        image: undefined
      });
      postIds.push(postId);
    }

    console.log(`📝 Created ${postIds.length} posts`);

    // Create comments
    for (const postId of postIds) {
      const numComments = getRandomNumber(5, 15);
      for (let i = 0; i < numComments; i++) {
        const authorId = getRandomElement(userIds);
        const content = getRandomElement(COMMENT_TEMPLATES);
        const author = await ctx.runQuery(seedHelpers.getUser, { userId: authorId });
        await ctx.runMutation(seedHelpers.insertComment, {
          postId,
          content,
          authorId,
          authorUsername: author?.username || "Unknown",
          authorProfilePicture: author?.profilePicture,
          createdAt: getRandomDate(30),
          upvotes: getRandomNumber(0, 20)
        });
      }
    }

    console.log("💬 Created comments for posts");

    // Create user settings for all users
    for (const userId of userIds) {
      const theme = getRandomElement<Theme>(["light", "dark"]);
      const fontSize = getRandomElement<FontSize>(["small", "medium", "large"]);
      const chatBackground = getRandomElement<ChatBackground>(["default", "gradient1", "gradient2"]);
      const contactPreference = getRandomElement<ContactPreference>(["everyone", "friends", "nobody"]);
      const timeFormat = getRandomElement<TimeFormat>(["12h", "24h"]);
      
      await ctx.runMutation(seedHelpers.insertSettings, {
        userId,
        theme,
        fontSize,
        chatBackground,
        notificationsEnabled: true,
        soundEnabled: true,
        notificationSettings: {
          newMessages: true,
          mentions: true,
          groupInvites: true,
          announcements: true,
        },
        readReceipts: true,
        typingIndicators: true,
        onlineStatus: true,
        contactPreference,
        language: "en",
        timeFormat,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log("⚙️ Created user settings for all users");
    console.log("✅ Database seeding completed successfully!");
    console.log("🔑 Demo admin credentials:");
    console.log("   Email: admin@university.edu");
    console.log("   Password: 123456");
    
    return { 
      success: true, 
      message: "Database seeded with realistic data including links and images!",
      stats: {
        users: userIds.length,
        channels: channelIds.length,
        posts: postIds.length
      }
    };
  },
});
