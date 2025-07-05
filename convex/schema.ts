import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    username: v.string(),
    passwordHash: v.string(),
    profilePicture: v.optional(v.string()),
    profilePictureVersion: v.optional(v.number()),
    status: v.union(
      v.literal("Available"),
      v.literal("Busy"), 
      v.literal("In class"),
      v.literal("Offline")
    ),
    isAdmin: v.boolean(),
    isLecturer: v.optional(v.boolean()),
    blockedUsers: v.array(v.string()),
    isHidden: v.boolean(),
    notificationSettings: v.optional(v.object({
      enabled: v.boolean(),
      newMessages: v.boolean(),
      mentions: v.boolean(),
      groupInvites: v.boolean(),
      announcements: v.boolean(),
    })),
  })
  .index("by_email", ["email"])
  .index("by_username", ["username"])
  .searchIndex("search_by_username", {
    searchField: "username",
  }),

  // Conversations (1:1 and group chats)
  conversations: defineTable({
    name: v.string(),
    avatar: v.optional(v.string()),
    isGroup: v.boolean(),
    creatorId: v.string(), // User ID of creator
    wallpaper: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTimestamp: v.optional(v.number()),
    type: v.optional(v.union(v.literal("direct"), v.literal("group"))),
    isActive: v.optional(v.boolean()),
    members: v.optional(v.array(v.id("users"))),
  })
  .index("by_creator", ["creatorId"])
  .index("by_type", ["type"]),

  // Conversation members
  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isAdmin: v.boolean(),
    isMuted: v.boolean(),
    joinedAt: v.number(),
    lastReadMessageId: v.optional(v.id("messages")),
    isActive: v.optional(v.boolean()),
    lastReadAt: v.optional(v.number()),
  })
  .index("by_conversation", ["conversationId"])
  .index("by_user", ["userId"])
  .index("by_conversation_and_user", ["conversationId", "userId"]),

  // Join requests for private groups
  joinRequests: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    requestedAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  })
  .index("by_conversation", ["conversationId"])
  .index("by_user", ["userId"])
  .index("by_conversation_user_status", ["conversationId", "userId", "status"]),

  // Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    timestamp: v.number(),
    replyToId: v.optional(v.id("messages")),
    isDeleted: v.boolean(),
    isEdited: v.boolean(),
  })
  .index("by_conversation", ["conversationId"])
  .index("by_conversation_timestamp", ["conversationId", "timestamp"]),

  // Message read receipts
  readReceipts: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    readAt: v.number(),
  })
  .index("by_message", ["messageId"])
  .index("by_user_message", ["userId", "messageId"]),

  // Message reactions
  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
    timestamp: v.number(),
  })
  .index("by_message", ["messageId"])
  .index("by_user_message", ["userId", "messageId"]),

  // Typing indicators
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    timestamp: v.number(),
  })
  .index("by_conversation", ["conversationId"])
  .index("by_conversation_user", ["conversationId", "userId"]),

  // Announcements
  announcements: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    timestamp: v.number(),
  })
  .index("by_timestamp", ["timestamp"])
  .index("by_author", ["authorId"]),

  // User sessions
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
  .index("by_token", ["token"])
  .index("by_user", ["userId"]),

  // User presence
  presence: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),
    isOnline: v.boolean(),
  }).index("by_user", ["userId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"), 
    type: v.union(
      v.literal("message"),
      v.literal("mention"),
      v.literal("groupInvite"),
      v.literal("announcement"),
      v.literal("groupJoinRequest"),
      v.literal("groupJoinApproved"),
      v.literal("call")
    ),
    read: v.boolean(),
    title: v.string(),
    content: v.string(),
    timestamp: v.number(),
    sourceId: v.optional(v.string()), // ID of related entity (conversation, message, etc.)
    sourceType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("message"),
      v.literal("announcement"),
      v.literal("joinRequest"),
      v.literal("call")
    )),
    callData: v.optional(v.object({
      callType: v.union(v.literal("audio"), v.literal("video")),
      roomId: v.string(),
      callerName: v.string()
    })),
  })
  .index("by_user", ["userId"])
  .index("by_user_read", ["userId", "read"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // User activity
  userActivity: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("joinedGroup"),
      v.literal("startedConversation"),
      v.literal("profileUpdate"),
      v.literal("custom")
    ),
    description: v.string(),
    timestamp: v.number(),
    relatedEntityId: v.optional(v.string()), // ID of related entity
    relatedEntityType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("user"),
      v.literal("announcement")
    )),
  })
  .index("by_user", ["userId"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // Temporary table to store media upload results
  tempUploadResults: defineTable({
    taskId: v.string(),
    url: v.string(),
    publicId: v.string(),
    resourceType: v.string(),
    format: v.string(),
    timestamp: v.number(),
  }).index("by_taskId", ["taskId"]),

  // User settings
  settings: defineTable({
    userId: v.id("users"),
    // Appearance
    theme: v.union(v.literal("light"), v.literal("dark")),
    fontSize: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
    chatBackground: v.union(v.literal("default"), v.literal("gradient1"), v.literal("gradient2")),
    
    // Notifications
    notificationsEnabled: v.boolean(),
    soundEnabled: v.boolean(),
    notificationSettings: v.object({
      newMessages: v.boolean(),
      mentions: v.boolean(),
      groupInvites: v.boolean(),
      announcements: v.boolean(),
    }),
    
    // Privacy
    readReceipts: v.boolean(),
    typingIndicators: v.boolean(),
    onlineStatus: v.boolean(),
    contactPreference: v.union(v.literal("everyone"), v.literal("friends"), v.literal("nobody")),
    
    // Language
    language: v.string(),
    timeFormat: v.union(v.literal("12h"), v.literal("24h")),
    
    createdAt: v.string(),
    updatedAt: v.string(),
  })
  .index("by_user", ["userId"]),

  posts: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    createdAt: v.number(),
    upvotes: v.number(),
    commentCount: v.number(),
    tags: v.array(v.string()),
    image: v.optional(v.string()),
  }).index("by_author", ["authorId"])
    .index("by_post_creation_time", ["createdAt"]),

  comments: defineTable({
    postId: v.id("posts"),
    content: v.string(),
    authorId: v.id("users"),
    authorUsername: v.string(),
    authorProfilePicture: v.optional(v.string()),
    createdAt: v.number(),
    upvotes: v.number(),
  }).index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_comment_creation_time", ["createdAt"]),

  // Post likes - tracks who has liked each post
  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    timestamp: v.number(),
  }).index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_user", ["postId", "userId"]),
    
  // Comment likes - tracks who has liked each comment
  commentLikes: defineTable({
    commentId: v.id("comments"),
    userId: v.id("users"),
    timestamp: v.number(),
  }).index("by_comment", ["commentId"])
    .index("by_user", ["userId"])
    .index("by_comment_user", ["commentId", "userId"]),

  // Study Channels
  studyChannels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    lecturerId: v.id("users"), // The lecturer who manages this channel
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    level: v.optional(v.union(
      v.literal("100"),
      v.literal("200"), 
      v.literal("300")
    )),
  })
  .index("by_lecturer", ["lecturerId"])
  .index("by_level", ["level"]),

  // Study Subchannels
  studySubchannels: defineTable({
    channelId: v.id("studyChannels"),
    name: v.string(),
    description: v.optional(v.string()),
    studentGroups: v.array(v.string()), // Names/identifiers of student groups
    createdAt: v.number(),
  })
  .index("by_channel", ["channelId"]),

  // Channel Members - students assigned to channels/subchannels
  channelMembers: defineTable({
    userId: v.id("users"),
    channelId: v.id("studyChannels"),
    subchannelId: v.optional(v.id("studySubchannels")),
    joinedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_channel", ["channelId"])
  .index("by_subchannel", ["subchannelId"])
  .index("by_channel_user", ["channelId", "userId"]),

  // Channel Announcements - specifically for study channels
  channelAnnouncements: defineTable({
    channelId: v.id("studyChannels"),
    subchannelId: v.optional(v.id("studySubchannels")),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    timestamp: v.number(),
  })
  .index("by_channel", ["channelId"])
  .index("by_subchannel", ["subchannelId"])
  .index("by_channel_timestamp", ["channelId", "timestamp"])
  .index("by_subchannel_timestamp", ["subchannelId", "timestamp"]),

  verificationCodes: defineTable({
    email: v.string(),
    username: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    code: v.string(),
    expiresAt: v.number(), // timestamp
    verified: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_code", ["code"]),
}); 
