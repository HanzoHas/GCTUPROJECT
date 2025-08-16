import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import bcrypt from "bcryptjs";

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

    // Hash passwords using bcrypt (allowed in actions)
    const adminPasswordHash = await bcrypt.hash("123456", 10);
    const userPasswordHash = await bcrypt.hash("password123", 10);

    // Create demo admin account with profile picture
    const adminId: string = await ctx.runMutation(internal.dbMutations.insertUser, {
      email: "demo_admin@example.com",
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
    const userIds: string[] = [adminId];
    for (let i = 0; i < 15; i++) {
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${getRandomNumber(10, 99)}`;
      const email = `${username}@example.com`;
      const status = getRandomElement(STATUSES);
      const isLecturer = Math.random() < 0.3; // 30% chance of being a lecturer
      
      const userId = await ctx.runMutation(internal.dbMutations.insertUser, {
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
      const lecturerId = lecturerIds.length > 0 ? getRandomElement(lecturerIds) : adminId;
      
      const channelId = await ctx.runMutation(internal.dbMutations.insertChannel, {
        name: channel.name,
        description: channel.description,
        lecturerId,
        level: channel.level as Level,
        createdAt: getRandomDate(60)
      });
      
      channelIds.push(channelId);
    }

    console.log(`📚 Created ${channelIds.length} study channels`);

    // Create subchannels and populate with data
    for (const channelId of channelIds) {
      const numSubchannels = getRandomNumber(3, 6);
      
      for (let i = 0; i < numSubchannels; i++) {
        const subchannelName = `Section ${String.fromCharCode(65 + i)}`;
        
        const subchannelId = await ctx.runMutation(internal.dbMutations.insertSubchannel, {
          channelId,
          name: subchannelName,
          description: `${subchannelName} for collaborative learning and discussions`,
          studentGroups: [`Group ${String.fromCharCode(65 + i)}`],
          createdAt: getRandomDate(45)
        });

        // Create conversation for this subchannel
        const conversationId = await ctx.runMutation(internal.dbMutations.insertConversation, {
          name: subchannelName,
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
          
          await ctx.runMutation(internal.dbMutations.insertMessage, {
            conversationId,
            content,
            senderId: authorId,
            timestamp: getRandomDate(30),
            type: "text"
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
          
          await ctx.runMutation(internal.dbMutations.insertAnnouncement, {
            title,
            content,
            authorId: adminId,
            timestamp: getRandomDate(30),
            type: "text"
          });
        }
      }
    }

    console.log("💬 Created subchannels with messages and announcements");

    // Create 10 global posts with rich content and comments
    for (let i = 0; i < 10; i++) {
      const authorId = getRandomElement(userIds);
      const title = getRandomElement(POST_TITLES);
      const content = getRandomElement(POST_CONTENTS);
      
      const postId = await ctx.runMutation(internal.dbMutations.insertPost, {
        title,
        content,
        authorId,
        createdAt: getRandomDate(15),
        upvotes: getRandomNumber(0, 25),
        commentCount: 0,
        tags: [`tag${getRandomNumber(1, 5)}`, `category${getRandomNumber(1, 3)}`]
      });

      // Add 2-6 comments per post with links
      const numComments = getRandomNumber(2, 6);
      for (let j = 0; j < numComments; j++) {
        const commentAuthorId = getRandomElement(userIds);
        const commentContent = getRandomElement(COMMENT_TEMPLATES);
        
        // Get author info for comment
        const author = await ctx.runQuery(internal.dbMutations.getUser, { userId: commentAuthorId });
        
        await ctx.runMutation(internal.dbMutations.insertComment, {
          postId,
          content: commentContent,
          authorId: commentAuthorId,
          authorUsername: author?.username || "Unknown User",
          authorProfilePicture: author?.profilePicture || "",
          createdAt: getRandomDate(10),
          upvotes: getRandomNumber(0, 8)
        });
      }

      // Update comment count
      await ctx.runMutation(internal.dbMutations.updatePost, {
        id: postId,
        commentCount: numComments
      });
    }

    console.log("📝 Created 10 global posts with comments");

    // Create user settings for all users
    for (const userId of userIds) {
      const theme = getRandomElement<Theme>(["light", "dark"]);
      const fontSize = getRandomElement<FontSize>(["small", "medium", "large"]);
      const chatBackground = getRandomElement<ChatBackground>(["default", "gradient1", "gradient2"]);
      const contactPreference = getRandomElement<ContactPreference>(["everyone", "friends", "nobody"]);
      const timeFormat = getRandomElement<TimeFormat>(["12h", "24h"]);
      
      await ctx.runMutation(internal.dbMutations.insertSettings, {
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
    console.log("   Email: demo_admin@example.com");
    console.log("   Password: 123456");
    
    return { 
      success: true, 
      message: "Database seeded with realistic data including links and images!",
      stats: {
        users: userIds.length,
        channels: channelIds.length,
        posts: 10
      }
    };
  },
});
