import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// For password hashing
import * as bcrypt from "bcryptjs";

// Seed function to populate the database
export default internalMutation(async (ctx: any): Promise<void> => {
  const { db } = ctx;
  console.log("Starting database seeding...");

  // Define helper functions inside the mutation scope
  // Create demo admin user
  async function createDemoAdmin(): Promise<Id<"users">> {
    // Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);
    
    // Create admin user
    const adminId = await db.insert("users", {
      email: "demo_admin@example.com",
      username: "DemoAdmin",
      passwordHash,
      profilePicture: "https://ui-avatars.com/api/?name=Demo+Admin&background=random",
      status: "Available",
      isAdmin: true,
      isLecturer: true,
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
    
    // Create presence record
    await db.insert("presence", {
      userId: adminId,
      lastSeen: Date.now(),
      isOnline: true,
    });
    
    console.log("Created demo admin user");
    return adminId;
  }
  
  // Create additional users
  async function createUsers(count: number): Promise<Id<"users">[]> {
    const userIds: Id<"users">[] = [];
    const roles = ["Student", "Lecturer"];
    const statuses = ["Available", "Busy", "In class", "Offline"] as const;
    const names = [
      "John Smith", "Emma Johnson", "Michael Brown", "Olivia Davis", "William Wilson",
      "Sophia Martinez", "James Anderson", "Isabella Taylor", "Benjamin Thomas", "Mia Hernandez",
      "Jacob Moore", "Charlotte Jackson", "Ethan White", "Amelia Harris", "Alexander Martin",
      "Abigail Thompson", "Daniel Garcia", "Emily Robinson", "Matthew Lewis", "Elizabeth Walker"
    ];
    
    // Hash a common password for all users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);
    
    for (let i = 0; i < count; i++) {
      const name = names[i % names.length];
      const nameParts = name.split(" ");
      const username = `${nameParts[0].toLowerCase()}${nameParts[1].charAt(0).toLowerCase()}${Math.floor(Math.random() * 100)}`;
      const email = `${username}@example.com`;
      const isLecturer = roles[Math.floor(Math.random() * roles.length)] === "Lecturer";
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const userId = await db.insert("users", {
        email,
        username,
        passwordHash,
        profilePicture: `https://ui-avatars.com/api/?name=${nameParts[0]}+${nameParts[1]}&background=random`,
        status,
        isAdmin: false,
        isLecturer,
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
      
      // Create presence record
      await db.insert("presence", {
        userId,
        lastSeen: Date.now(),
        isOnline: Math.random() > 0.3, // 70% chance of being online
      });
      
      userIds.push(userId);
    }
    
    console.log(`Created ${count} additional users`);
    return userIds;
  }
  
  // Create study channels and subchannels
  async function createChannelsAndSubchannels(
    adminId: Id<"users">,
    userIds: Id<"users">[]
  ): Promise<{ channelIds: Id<"studyChannels">[], subchannelIds: Id<"studySubchannels">[] }> {
    const channelIds: Id<"studyChannels">[] = [];
    const subchannelIds: Id<"studySubchannels">[] = [];
    
    const channelNames = [
      "Physics 101", "Math Study Group", "Computer Science Fundamentals",
      "Biology Lab", "Chemistry Research", "Engineering Principles",
      "Literature Analysis", "History Studies"
    ];
    
    const subchannelNames = [
      "General Chat", "Homework Help", "Exam Prep",
      "Lab Reports", "Study Materials", "Project Collaboration"
    ];
    
    // Get lecturer IDs
    const lecturerIds = [adminId];
    for (const userId of userIds) {
      const user = await db.get(userId);
      if (user?.isLecturer) {
        lecturerIds.push(userId);
      }
    }
    
    // Create channels
    for (let i = 0; i < channelNames.length; i++) {
      const lecturerId = lecturerIds[i % lecturerIds.length];
      const level = ["100", "200", "300"][Math.floor(Math.random() * 3)] as "100" | "200" | "300";
      
      const channelId = await db.insert("studyChannels", {
        name: channelNames[i],
        description: `A study channel for ${channelNames[i]}`,
        lecturerId,
        avatar: `https://ui-avatars.com/api/?name=${channelNames[i].replace(/ /g, "+")}&background=random`,
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
        level,
      });
      
      channelIds.push(channelId);
      
      // Create subchannels for this channel
      const numSubchannels = 3 + Math.floor(Math.random() * 4); // 3-6 subchannels
      for (let j = 0; j < numSubchannels; j++) {
        const subchannelId = await db.insert("studySubchannels", {
          channelId,
          name: subchannelNames[j % subchannelNames.length],
          description: `${subchannelNames[j % subchannelNames.length]} for ${channelNames[i]}`,
          studentGroups: [`Group ${j + 1}`],
          createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
        });
        
        subchannelIds.push(subchannelId);
      }
    }
    
    console.log(`Created ${channelIds.length} channels and ${subchannelIds.length} subchannels`);
    return { channelIds, subchannelIds };
  }
  
  // Add members to channels
  async function addMembersToChannels(
    channelIds: Id<"studyChannels">[],
    userIds: Id<"users">[]
  ): Promise<void> {
    // Add each user to 2-4 random channels
    for (const userId of userIds) {
      // Randomly select 2-4 channels
      const numChannels = 2 + Math.floor(Math.random() * 3);
      const selectedChannelIndices = new Set<number>();
      
      while (selectedChannelIndices.size < numChannels && selectedChannelIndices.size < channelIds.length) {
        const randomIndex = Math.floor(Math.random() * channelIds.length);
        selectedChannelIndices.add(randomIndex);
      }
      
      // Add user to selected channels
      for (const index of selectedChannelIndices) {
        const channelId = channelIds[index];
        
        await db.insert("channelMembers", {
          channelId,
          userId,
          joinedAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
        });
      }
    }
    
    console.log("Added members to channels");
  }
  
  // Create messages in subchannels
  async function createMessages(
    messageSubchannelIds: Id<"studySubchannels">[],
    messageUserIds: Id<"users">[]
  ): Promise<void> {
    const messageContents = [
      "Has anyone started the assignment yet?",
      "When is the next lecture?",
      "Can someone explain the concept from today's class?",
      "I'm having trouble with question 3, any hints?",
      "Here are my notes from the lecture",
      "Does anyone want to form a study group for the exam?",
      "The professor mentioned an important point about this topic",
      "I found a great resource for this subject",
      "Is the lab report due tomorrow or next week?",
      "What chapters will be covered in the midterm?"
    ];
    
    const mediaUrls = [
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      "https://images.unsplash.com/photo-1629752187687-3d3c7ea3a21b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80",
      "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ];
    
    // For each subchannel, create 5-15 messages
    for (const subchannelId of messageSubchannelIds) {
      const numMessages = 5 + Math.floor(Math.random() * 11);
      const messageIds: Id<"messages">[] = [];
      
      // Get the channel ID for this subchannel
      const subchannel = await db.get(subchannelId);
      if (!subchannel) continue;
      
      // Get members of this channel
      const members = await db
        .query("channelMembers")
        .withIndex("by_channel", (q: any) => q.eq("channelId", subchannel.channelId))
        .collect();
      
      const memberUserIds = members.map((member: any) => member.userId);
      
      // If no members, skip this subchannel
      if (memberUserIds.length === 0) continue;
      
      // Create messages
      for (let i = 0; i < numMessages; i++) {
        const authorId = memberUserIds[Math.floor(Math.random() * memberUserIds.length)];
        const content = messageContents[Math.floor(Math.random() * messageContents.length)];
        const hasMedia = Math.random() < 0.3; // 30% chance of having media
        const isReply = i > 0 && Math.random() < 0.4; // 40% chance of being a reply to a previous message, but not for the first message
        
        // Define media type at the top level
        type MediaItem = {
          type: "image" | "video" | "audio";
          url: string;
        };
        
        let media: MediaItem[] = [];
        if (hasMedia) {
          const mediaUrl = mediaUrls[Math.floor(Math.random() * mediaUrls.length)];
          media = [{
            type: "image" as const,
            url: mediaUrl,
          }];
        }
        
        const messageData: any = {
          subchannelId,
          authorId,
          content,
          media,
          createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
          updatedAt: null,
          isEdited: false,
          isDeleted: false,
          replyTo: isReply ? messageIds[Math.floor(Math.random() * messageIds.length)] : null,
        };
        
        const messageId = await db.insert("messages", messageData);
        messageIds.push(messageId);
        
        // Add read receipts for some users
        for (const userId of memberUserIds) {
          if (Math.random() < 0.7) { // 70% chance of having read the message
            await db.insert("readReceipts", {
              messageId,
              userId,
              readAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in the last 7 days
            });
          }
        
        // Add reactions to some messages
        if (Math.random() < 0.4) { // 40% chance of having reactions
          const reactions: Record<string, string[]> = {};
          const emojis = ["👍", "❤️", "😂", "🎉", "🤔"];
          const numReactions = 1 + Math.floor(Math.random() * 3); // 1-3 reaction types
          
          for (let j = 0; j < numReactions; j++) {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const numUsers = 1 + Math.floor(Math.random() * 3); // 1-3 users per reaction
            const reactingUserIds: Id<"users">[] = [];
            
            for (let k = 0; k < numUsers; k++) {
              const userId = memberUserIds[Math.floor(Math.random() * memberUserIds.length)];
              if (!reactingUserIds.includes(userId)) {
                reactingUserIds.push(userId);
              }
            }
            
            reactions[emoji] = reactingUserIds;
          }
          
          // Instead of directly patching reactions to the message
          // Create individual message reactions
          for (const emoji in reactions) {
            for (const userId of reactions[emoji]) {
              // Convert string userId to Id<"users"> by querying the user first
              const user = await db.get(userId as Id<"users">);
              if (!user) continue;
              
              await db.insert("messageReactions", {
                messageId,
                userId: userId as Id<"users">,
                emoji,
                timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in the last 7 days
              });
            }
          }
        }
      }
    }
    
    console.log("Created messages in subchannels");
  }
  
  // Create announcements
  async function createAnnouncements(
    announcementSubchannelIds: Id<"studySubchannels">[],
    adminId: Id<"users">
  ): Promise<void> {
    const announcementTitles = [
      "Important Course Update",
      "Exam Schedule Released",
      "Assignment Deadline Extended",
      "Guest Lecture Announcement",
      "Study Resources Available"
    ];
    
    const announcementContents = [
      "Please note that the course syllabus has been updated. Check the new version on the course website.",
      "The final exam schedule has been released. Our exam will be on Monday, December 12th at 10:00 AM in Room 301.",
      "Due to multiple requests, the deadline for Assignment 3 has been extended to Friday, November 18th at 11:59 PM.",
      "We will have a guest lecture by Dr. Jane Smith, an expert in the field, on Thursday at our regular class time.",
      "Additional study resources for the midterm have been uploaded to the course website. Make sure to review them before the exam."
    ];
    
    // Create 1-3 announcements for each subchannel
    for (const subchannelId of announcementSubchannelIds) {
      // Only create announcements for some subchannels
      if (Math.random() < 0.7) { // 70% chance of having announcements
        const numAnnouncements = 1 + Math.floor(Math.random() * 3); // 1-3 announcements
        
        // Get the channel ID for this subchannel
        const subchannel = await db.get(subchannelId);
        if (!subchannel) continue;
        
        for (let i = 0; i < numAnnouncements; i++) {
          const titleIndex = Math.floor(Math.random() * announcementTitles.length);
          const title = announcementTitles[titleIndex];
          const content = announcementContents[titleIndex];
          
          await db.insert("channelAnnouncements", {
            channelId: subchannel.channelId,
            authorId: adminId,
            title,
            content,
            type: "text",
            timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
          });
        }
      }
    }
    
    console.log("Created announcements");
  }
  
  // Create global posts and comments
  async function createPostsAndComments(
    userIds: Id<"users">[]
  ): Promise<void> {
    const postTitles = [
      "Tips for Effective Studying",
      "Looking for Study Partners",
      "Best Resources for Learning Programming",
      "How to Balance School and Work",
      "Recommended Books for Computer Science",
      "Preparing for Graduate School Applications",
      "Internship Opportunities for Summer",
      "Note-Taking Strategies That Work",
      "Dealing with Academic Stress",
      "Campus Events This Week"
    ];
    
    const postContents = [
      "I've found that using the Pomodoro technique (25 minutes of focused work followed by a 5-minute break) has significantly improved my productivity. What study techniques work for you?",
      "I'm looking for study partners for the upcoming calculus exam. Anyone interested in forming a study group? We could meet at the library or online.",
      "For those learning programming, I highly recommend resources like freeCodeCamp, Codecademy, and LeetCode. What resources have you found helpful?",
      "Balancing school and work can be challenging. I've found that creating a detailed schedule and sticking to it helps me manage my time effectively. Any other tips?",
      "I'm looking for book recommendations for computer science students. So far, 'Clean Code' by Robert C. Martin and 'Introduction to Algorithms' by Cormen et al. have been invaluable.",
      "For those considering graduate school, start preparing early! Research programs, take the GRE if required, and reach out to potential advisors. Anyone else in the application process?",
      "I just found out about several internship opportunities for computer science students. Companies like Google, Microsoft, and local startups are accepting applications now. Don't miss the deadlines!",
      "I've tried various note-taking methods and found that the Cornell method works best for me. It helps organize information and makes review easier. What methods do you use?",
      "Academic stress is real, but there are ways to manage it. Regular exercise, sufficient sleep, and mindfulness practices have helped me. The university counseling center also offers great resources.",
      "There are several interesting events happening on campus this week, including a tech talk on Wednesday and a career fair on Friday. Check the university calendar for details!"
    ];
    
    const commentContents = [
      "Great post! Thanks for sharing.",
      "I completely agree with your points.",
      "This was really helpful information.",
      "I've had a similar experience.",
      "Could you provide more details about this?",
      "I have a different perspective on this topic.",
      "Has anyone else tried this approach?",
      "I'm going to try implementing these suggestions.",
      "This is exactly what I needed to hear today.",
      "Are there any additional resources you'd recommend?"
    ];
    
    const tags = [
      "Study Tips", "Academics", "Technology", "Career", "Campus Life",
      "Research", "Networking", "Self-Care", "Resources", "Events"
    ];
    
    const mediaUrls = [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1073&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
    ];
    
    // Create 10 global posts
    for (let i = 0; i < 10; i++) {
      // Select a random author
      const authorId = userIds[Math.floor(Math.random() * userIds.length)];
      
      // Select a random title and content
      const titleIndex = Math.floor(Math.random() * postTitles.length);
      const title = postTitles[titleIndex];
      const content = postContents[titleIndex];
      
      // Select 1-3 random tags
      const numTags = 1 + Math.floor(Math.random() * 3);
      const selectedTags: string[] = [];
      for (let j = 0; j < numTags; j++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!selectedTags.includes(tag)) {
          selectedTags.push(tag);
        }
      }
      
      // Decide if the post has an image
      const hasImage = Math.random() < 0.5; // 50% chance of having an image
      let imageUrl = undefined;
      if (hasImage) {
        imageUrl = mediaUrls[Math.floor(Math.random() * mediaUrls.length)];
      }
      
      // Create the post
      const postId = await db.insert("posts", {
        authorId,
        title,
        content,
        tags: selectedTags,
        image: imageUrl,
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
        upvotes: 0,
        commentCount: 0,
      });
      
      // Add upvotes to the post
      const numUpvotes = Math.floor(Math.random() * 20); // 0-19 upvotes
      const upvoterIds: Id<"users">[] = [];
      
      for (let j = 0; j < numUpvotes; j++) {
        const upvoterId = userIds[Math.floor(Math.random() * userIds.length)];
        if (!upvoterIds.includes(upvoterId) && upvoterId !== authorId) {
          upvoterIds.push(upvoterId);
          
          await db.insert("postLikes", {
            postId,
            userId: upvoterId,
            timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
          });
        }
      }
      
      // Update post upvote count
      await db.patch(postId, { upvotes: upvoterIds.length });
      
      // Add comments to the post
      const numComments = Math.floor(Math.random() * 5); // 0-4 comments
      let commentCount = 0;
      
      for (let j = 0; j < numComments; j++) {
        const commentAuthorId = userIds[Math.floor(Math.random() * userIds.length)];
        const commentContent = commentContents[Math.floor(Math.random() * commentContents.length)];
        
        // Get author info for the comment
        const commentAuthor = await db.get(commentAuthorId);
        if (!commentAuthor) continue;
        
        const commentId = await db.insert("comments", {
          postId,
          authorId: commentAuthorId,
          authorUsername: commentAuthor.username,
          authorProfilePicture: commentAuthor.profilePicture,
          content: commentContent,
          createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
          upvotes: 0,
        });
        
        commentCount++;
        
        // Add upvotes to the comment
        const numCommentUpvotes = Math.floor(Math.random() * 5); // 0-4 upvotes
        const commentUpvoterIds: Id<"users">[] = [];
        
        for (let k = 0; k < numCommentUpvotes; k++) {
          const upvoterId = userIds[Math.floor(Math.random() * userIds.length)];
          if (!commentUpvoterIds.includes(upvoterId) && upvoterId !== commentAuthorId) {
            commentUpvoterIds.push(upvoterId);
            
            await db.insert("commentLikes", {
              commentId,
              userId: upvoterId,
              timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in the last 30 days
            });
          }
        }
        
        // Update comment upvote count
        await db.patch(commentId, { upvotes: commentUpvoterIds.length });
      }
      
      // Update post comment count
      await db.patch(postId, { commentCount });
    }
    
    console.log("Created global posts and comments");
  }
  
  // Execute the seeding functions
  const demoAdminId = await createDemoAdmin();
  const userIds = await createUsers(15);
  const { channelIds, subchannelIds } = await createChannelsAndSubchannels(demoAdminId, userIds);
  await addMembersToChannels(channelIds, userIds);
  await createMessages(subchannelIds, [...userIds, demoAdminId]);
  await createAnnouncements(subchannelIds, demoAdminId);
  await createPostsAndComments([...userIds, demoAdminId]);
  
  console.log("Database seeding completed successfully!");
}});