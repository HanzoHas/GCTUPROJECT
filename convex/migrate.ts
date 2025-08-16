import { internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Migration function to create conversations for existing subchannels
export const createConversationsForSubchannels = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { db } = ctx;
    console.log("Starting migration: creating conversations for existing subchannels...");

    try {
      // Get all existing subchannels
      const subchannels = await db.query("studySubchannels").collect();
      console.log(`Found ${subchannels.length} subchannels`);

      let conversationsCreated = 0;
      let conversationsSkipped = 0;

      for (const subchannel of subchannels) {
        // Get the channel for this subchannel
        const channel = await db.get(subchannel.channelId);
        if (!channel) {
          console.log(`Skipping subchannel ${subchannel._id} - channel not found`);
          continue;
        }

        // Check if conversation already exists for this subchannel
        const expectedConversationName = `${subchannel.name} - ${channel.name}`;
        const existingConversation = await db
          .query("conversations")
          .filter((q) => q.eq(q.field("name"), expectedConversationName))
          .first();

        if (existingConversation) {
          console.log(`Conversation already exists for ${subchannel.name} in ${channel.name}`);
          conversationsSkipped++;
          continue;
        }

        // Create conversation for this subchannel
        const conversationId = await db.insert("conversations", {
          creatorId: channel.lecturerId, // Use the channel lecturer as creator
          isPrivate: false,
          type: "group" as const,
          isGroup: true,
          name: expectedConversationName,
          isActive: true
        });

        console.log(`Created conversation for ${subchannel.name} in ${channel.name}: ${conversationId}`);
        conversationsCreated++;
      }

      console.log(`Migration completed successfully!`);
      console.log(`- Conversations created: ${conversationsCreated}`);
      console.log(`- Conversations skipped (already existed): ${conversationsSkipped}`);
      console.log(`- Total subchannels processed: ${subchannels.length}`);
      
      return {
        success: true,
        conversationsCreated,
        conversationsSkipped,
        totalSubchannels: subchannels.length
      };
      
    } catch (error) {
      console.error("Error during migration:", error);
      throw error;
    }
  },
});

// Migration function to add all users as members of subchannel conversations
export const addUsersToConversations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { db } = ctx;
    console.log("Starting migration: adding users to subchannel conversations...");

    try {
      // Get all users
      const users = await db.query("users").collect();
      console.log(`Found ${users.length} users`);

      // Get all conversations (subchannel conversations)
      const conversations = await db
        .query("conversations")
        .filter((q) => q.eq(q.field("type"), "group"))
        .collect();
      console.log(`Found ${conversations.length} group conversations`);

      let membershipsCreated = 0;
      let membershipsSkipped = 0;

      for (const conversation of conversations) {
        for (const user of users) {
          // Check if user is already a member
          const existingMembership = await db
            .query("conversationMembers")
            .withIndex("by_conversation_and_user", (q) =>
              q.eq("conversationId", conversation._id).eq("userId", user._id)
            )
            .first();

          if (existingMembership) {
            membershipsSkipped++;
            continue;
          }

          // Add user as conversation member
          await db.insert("conversationMembers", {
            conversationId: conversation._id,
            userId: user._id,
            isAdmin: user.isLecturer || user.isAdmin, // Lecturers and admins are admins
            isMuted: false,
            joinedAt: Date.now(),
            isActive: true,
          });

          membershipsCreated++;
        }
      }

      console.log(`Migration completed successfully!`);
      console.log(`- Memberships created: ${membershipsCreated}`);
      console.log(`- Memberships skipped (already existed): ${membershipsSkipped}`);
      console.log(`- Total users: ${users.length}`);
      console.log(`- Total conversations: ${conversations.length}`);
      
      return {
        success: true,
        membershipsCreated,
        membershipsSkipped,
        totalUsers: users.length,
        totalConversations: conversations.length
      };
      
    } catch (error) {
      console.error("Error during migration:", error);
      throw error;
    }
  },
});
