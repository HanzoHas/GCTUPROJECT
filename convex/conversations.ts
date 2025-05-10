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

    // Get full conversation details
    const conversations = await Promise.all(
      conversationIds.map(async (id) => {
        const conversation = await ctx.db.get(id);
        if (!conversation) return null;

        // Get other members for direct conversations
        let otherMember = null;
        if (!conversation.isGroup) {
          const members = await ctx.db
          .query("conversationMembers")
            .withIndex("by_conversation", (q) => q.eq("conversationId", id))
            .filter((q) => q.neq(q.field("userId"), userId))
              .first();
              
          if (members) {
            otherMember = await ctx.db.get(members.userId);
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
      })
    );

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