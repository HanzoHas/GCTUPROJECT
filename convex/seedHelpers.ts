import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper mutations for seeding database
export const insertUser = mutation({
  args: {
    email: v.string(),
    username: v.string(),
    passwordHash: v.string(),
    status: v.union(v.literal("Available"), v.literal("Busy"), v.literal("In class"), v.literal("Offline")),
    isAdmin: v.boolean(),
    isLecturer: v.optional(v.boolean()),
    profilePicture: v.optional(v.string()),
    profilePictureVersion: v.optional(v.number()),
    blockedUsers: v.array(v.id("users")),
    isHidden: v.boolean(),
    notificationSettings: v.object({
      enabled: v.boolean(),
      newMessages: v.boolean(),
      mentions: v.boolean(),
      groupInvites: v.boolean(),
      announcements: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", args);
    
    // Create email verification record for the user
    await ctx.db.insert("verificationCodes", {
      email: args.email,
      username: args.username,
      passwordHash: args.passwordHash,
      verified: true,
      code: "SEEDED",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    
    return userId;
  },
});

export const insertChannel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    lecturerId: v.id("users"),
    level: v.optional(v.union(
      v.literal("100"),
      v.literal("200"), 
      v.literal("300")
    )),
    createdAt: v.number(),
    isHidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("studyChannels", args);
  },
});

export const insertSubchannel = mutation({
  args: {
    channelId: v.id("studyChannels"),
    name: v.string(),
    description: v.optional(v.string()),
    studentGroups: v.array(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("studySubchannels", args);
  },
});

export const insertConversation = mutation({
  args: {
    name: v.string(),
    isGroup: v.boolean(),
    creatorId: v.id("users"),
    type: v.union(v.literal("direct"), v.literal("group")),
    isActive: v.boolean(),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", args);
  },
});

export const insertMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    senderId: v.id("users"),
    timestamp: v.number(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
    isDeleted: v.boolean(),
    isEdited: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", args);
  },
});

export const insertChannelAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    channelId: v.id("studyChannels"),
    subchannelId: v.optional(v.id("studySubchannels")),
    authorId: v.id("users"),
    timestamp: v.number(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("channelAnnouncements", args);
  },
});

export const insertAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    timestamp: v.number(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("announcements", args);
  },
});

export const insertPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
    upvotes: v.number(),
    commentCount: v.number(),
    tags: v.array(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", args);
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getAllSubchannels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("studySubchannels").collect();
  },
});

export const getAllConversations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("conversations").collect();
  },
});


export const insertComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    authorId: v.id("users"),
    authorUsername: v.string(),
    authorProfilePicture: v.optional(v.string()),
    createdAt: v.number(),
    upvotes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", args);
  },
});

export const insertSettings = mutation({
  args: {
    userId: v.id("users"),
    theme: v.union(v.literal("light"), v.literal("dark")),
    fontSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    chatBackground: v.union(v.literal("default"), v.literal("gradient1"), v.literal("gradient2")),
    notificationsEnabled: v.boolean(),
    soundEnabled: v.boolean(),
    notificationSettings: v.object({
      newMessages: v.boolean(),
      mentions: v.boolean(),
      groupInvites: v.boolean(),
      announcements: v.boolean(),
    }),
    readReceipts: v.boolean(),
    typingIndicators: v.boolean(),
    onlineStatus: v.boolean(),
    contactPreference: v.union(v.literal("everyone"), v.literal("friends"), v.literal("nobody")),
    language: v.string(),
    timeFormat: v.union(v.literal("12h"), v.literal("24h")),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("settings", args);
  },
});

export const getChannelById = query({
  args: { channelId: v.id("studyChannels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.channelId);
  },
});

export const getAllConversationMembers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("conversationMembers").collect();
  },
});

export const insertConversationMember = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isAdmin: v.boolean(),
    isMuted: v.boolean(),
    joinedAt: v.number(),
    isActive: v.boolean(),
    lastReadAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversationMembers", args);
  },
});

export const getAllChannels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("studyChannels").collect();
  },
});

export const updateChannelVisibility = mutation({
  args: {
    channelId: v.id("studyChannels"),
    isHidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.channelId, { isHidden: args.isHidden });
    return { success: true };
  },
});
