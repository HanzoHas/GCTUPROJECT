import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { Id } from "./_generated/dataModel";

// Create a direct conversation
export const createDirectConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { otherUserId } = args;

    // Check if conversation already exists
    const existingConversation = await ctx.db
      .query("conversations")
      .withIndex("by_type", (q) => q.eq("type", "direct"))
      .filter((q) => 
        q.eq(q.field("members"), [userId, otherUserId]) ||
        q.eq(q.field("members"), [otherUserId, userId])
      )
      .first();

    if (existingConversation) {
      return { conversationId: existingConversation._id };
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      name: "",
      isGroup: false,
      creatorId: userId,
      type: "direct",
      members: [userId, otherUserId],
      isActive: true,
    });

    // Add members to conversation
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      isAdmin: true,
      isMuted: false,
      joinedAt: Date.now(),
      isActive: true,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: otherUserId,
      isAdmin: false,
      isMuted: false,
      joinedAt: Date.now(),
      isActive: true,
    });

    return { conversationId };
  },
});

// Get user's conversations
export const getUserConversations = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Get all conversations where user is a member
    const memberRecords = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const conversationIds = memberRecords.map((record) => record.conversationId);

    // Batch fetch all conversations
    const conversationPromises = conversationIds.map(id => ctx.db.get(id));
    const conversationResults = await Promise.all(conversationPromises);
    
    // Filter out subchannel conversations (they contain " - " pattern)
    const filteredConversations = conversationResults.filter(conv => {
      if (!conv) return false;
      
      // Filter out subchannel conversations that follow the pattern "SubchannelName - ChannelName"
      if (conv.name && conv.name.includes(" - ") && conv.isGroup) {
        console.log(`Filtering out subchannel conversation: ${conv.name}`);
        return false;
      }
      
      return true;
    });
    
    // Batch fetch all conversation members for direct conversations
    const directConversationIds = filteredConversations
      .filter(conv => conv && !conv.isGroup)
      .map(conv => conv!._id);
      
    const otherMemberPromises = directConversationIds.map(id => 
      ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", id))
        .filter((q) => q.neq(q.field("userId"), userId))
        .first()
    );
    const otherMemberRecords = await Promise.all(otherMemberPromises);
    
    // Batch fetch user details for other members
    const otherUserIds = otherMemberRecords.filter(Boolean).map(record => record!.userId);
    const otherUserPromises = otherUserIds.map(id => ctx.db.get(id));
    const otherUsers = await Promise.all(otherUserPromises);
    
    // Create mapping for quick lookup
    const otherUserMap: Record<string, any> = {};
    otherUsers.forEach((user, index) => {
      if (user) {
        otherUserMap[otherUserIds[index].toString()] = user;
      }
    });

    // Process conversations with cached data
    const conversations = filteredConversations.map((conversation, index) => {
      if (!conversation) return null;
      
      let otherMember = null;
      if (!conversation.isGroup) {
        const memberRecord = otherMemberRecords.find(record => 
          record && record.conversationId.toString() === conversation._id.toString()
        );
        if (memberRecord) {
          otherMember = otherUserMap[memberRecord.userId.toString()] || null;
        }
      }

      return {
        id: conversation._id,
        name: conversation.name || (otherMember?.username || ""),
        avatar: conversation.avatar || otherMember?.profilePicture,
        isGroup: conversation.isGroup,
        type: conversation.type,
        lastMessageId: conversation.lastMessageId,
        lastMessageTimestamp: conversation.lastMessageTimestamp,
        isActive: conversation.isActive,
        otherMember: otherMember ? {
          id: otherMember._id,
          username: otherMember.username,
          profilePicture: otherMember.profilePicture,
          status: otherMember.status,
        } : null,
      };
    });

    return conversations.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

// Get conversation details
export const getConversation = query({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Check if user is a member
    const memberRecord = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId)
          .eq("userId", userId)
      )
      .first();

    if (!memberRecord) {
      throw new ConvexError("Not a member of this conversation");
    }

    // Get all members
    const memberRecords = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    const members = await Promise.all(
      memberRecords.map(async (record) => {
        const user = await ctx.db.get(record.userId);
        return {
          id: user?._id,
          username: user?.username,
          profilePicture: user?.profilePicture,
          status: user?.status,
          isAdmin: record.isAdmin,
          isMuted: record.isMuted,
          joinedAt: record.joinedAt,
        };
      })
    );

    return {
      id: conversation._id,
      name: conversation.name,
      avatar: conversation.avatar,
      isGroup: conversation.isGroup,
      type: conversation.type,
      wallpaper: conversation.wallpaper,
      isPrivate: conversation.isPrivate,
      lastMessageId: conversation.lastMessageId,
      lastMessageTimestamp: conversation.lastMessageTimestamp,
      isActive: conversation.isActive,
      members,
    };
  },
});

// Update conversation
export const updateConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    wallpaper: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, name, avatar, wallpaper } = args;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Check if user is a member
    const memberRecord = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId)
          .eq("userId", userId)
      )
      .first();

    if (!memberRecord) {
      throw new ConvexError("Not authorized to update this conversation");
    }

    // Update conversation
    await ctx.db.patch(conversationId, {
      name,
      avatar,
      wallpaper,
    });

    return { success: true };
  },
});

// Delete conversation
export const deleteConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Check if user is a member
    const memberRecord = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId)
          .eq("userId", userId)
      )
      .first();

    if (!memberRecord) {
      throw new ConvexError("Not authorized to delete this conversation");
    }

    // Delete conversation
    await ctx.db.delete(conversationId);

    return { success: true };
  },
});

// Get conversation for a specific subchannel
export const getConversationBySubchannel = query({
  args: {
    sessionToken: sessionTokenValidator,
    subchannelId: v.id("studySubchannels"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { subchannelId } = args;

    // Get the subchannel details
    const subchannel = await ctx.db.get(subchannelId);
    if (!subchannel) {
      throw new ConvexError("Subchannel not found");
    }

    // Get the channel details
    const channel = await ctx.db.get(subchannel.channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Find the conversation by name pattern (created in seed script)
    // The seed script creates conversations with pattern: "${subchannelName} - ${channelName}"
    const expectedConversationName = `${subchannel.name} - ${channel.name}`;
    console.log(`Looking for subchannel conversation: ${expectedConversationName} for user ${userId}`);
    
    let conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("name"), expectedConversationName))
      .first();

    // If not found with exact match, try to find by partial match (more flexible)
    if (!conversation) {
      console.log(`Exact match not found, trying flexible search...`);
      const conversations = await ctx.db
        .query("conversations")
        .filter((q) => q.eq(q.field("type"), "group"))
        .collect();
      
      // Look for a conversation that contains both subchannel and channel names
      conversation = conversations.find(conv => 
        conv.name && 
        conv.name.toLowerCase().includes(subchannel.name.toLowerCase()) &&
        conv.name.toLowerCase().includes(channel.name.toLowerCase())
      ) || null;
      
      if (conversation) {
        console.log(`Found conversation via flexible search: ${conversation.name}`);
      }
    } else {
      console.log(`Found conversation via exact match: ${conversation.name}`);
    }

    if (!conversation) {
      console.log(`No conversation found for subchannel: ${subchannel.name} in channel: ${channel.name}`);
      throw new ConvexError("Conversation not found for this subchannel");
    }
    
    // Check if user is a member of this conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversation._id).eq("userId", userId)
      )
      .first();
      
    console.log(`User ${userId} membership in conversation ${conversation.name}: ${membership ? 'MEMBER' : 'NOT MEMBER'}`);
    
    if (!membership) {
      console.log(`User ${userId} is not a member of conversation ${conversation._id} (${conversation.name})`);
      throw new ConvexError("You are not a member of this subchannel conversation");
    }

    return {
      conversationId: conversation._id,
      name: conversation.name,
      type: conversation.type,
      isGroup: conversation.isGroup,
    };
  },
}); 