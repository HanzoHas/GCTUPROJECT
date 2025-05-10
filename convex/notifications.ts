import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { Id } from "./_generated/dataModel";

// Get user notifications
export const getNotifications = query({
  args: {
    sessionToken: sessionTokenValidator,
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    const limit = args.limit || 50;
    const onlyUnread = args.onlyUnread || false;
    
    // Build the query based on parameters
    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", userId))
      .order("desc");
    
    // Filter for unread if specified
    if (onlyUnread) {
      notificationsQuery = notificationsQuery.filter(q => q.eq(q.field("read"), false));
    }
    
    // Execute query with limit
    const notifications = await notificationsQuery.take(limit);
    
    return notifications.map(notification => ({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      timestamp: notification.timestamp,
      read: notification.read,
      sourceId: notification.sourceId,
      sourceType: notification.sourceType,
    }));
  },
});

// Mark notification as read
export const markNotificationAsRead = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    // Get the notification
    const notification = await ctx.db.get(args.notificationId);
    
    // Check if notification exists and belongs to the user
    if (!notification) {
      throw new ConvexError("Notification not found");
    }
    
    if (notification.userId.toString() !== userId.toString()) {
      throw new ConvexError("Unauthorized access to notification");
    }
    
    // Mark as read
    await ctx.db.patch(args.notificationId, { read: true });
    
    return { success: true };
  },
});

// Mark all notifications as read
export const markAllNotificationsAsRead = mutation({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    // Get all unread notifications for the user
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    
    // Mark each as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }
    
    return { success: true };
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    // Count unread notifications
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    
    return unreadNotifications.length;
  },
});

// Create notification (internal function to be called by other API functions)
export const createNotification = mutation({
  args: {
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
    title: v.string(),
    content: v.string(),
    sourceId: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    
    // Check notification settings if they exist
    if (user.notificationSettings) {
      // If notifications are disabled, don't create
      if (!user.notificationSettings.enabled) {
        return { success: false, reason: "Notifications disabled" };
      }
      
      // Check specific notification type settings
      switch(args.type) {
        case "message":
          if (!user.notificationSettings.newMessages) {
            return { success: false, reason: "Message notifications disabled" };
          }
          break;
        case "mention":
          if (!user.notificationSettings.mentions) {
            return { success: false, reason: "Mention notifications disabled" };
          }
          break;
        case "groupInvite":
          if (!user.notificationSettings.groupInvites) {
            return { success: false, reason: "Group invite notifications disabled" };
          }
          break;
        case "announcement":
          if (!user.notificationSettings.announcements) {
            return { success: false, reason: "Announcement notifications disabled" };
          }
          break;
      }
    }
    
    // Create the notification
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      content: args.content,
      timestamp: Date.now(),
      read: false,
      sourceId: args.sourceId,
      sourceType: args.sourceType,
      callData: args.callData,
    });
    
    return { success: true, notificationId };
  },
});

// Send a call notification to a user
export const sendCallNotification = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    targetUserId: v.string(),
    callType: v.union(v.literal("audio"), v.literal("video")),
    roomId: v.string(),
    callerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    try {
      console.log("Received targetUserId:", args.targetUserId);
      
      // Skip attempting to normalize if ID is empty
      if (!args.targetUserId || args.targetUserId.trim() === '') {
        throw new ConvexError("Invalid or empty target user ID");
      }
      
      // First try to normalize the ID to ensure it's in the correct format
      let targetUserId;
      try {
        targetUserId = ctx.db.normalizeId("users", args.targetUserId);
      } catch (error) {
        console.log("Could not normalize ID:", args.targetUserId);
      }
      
      // If we have a normalized ID, try to get the user directly
      let targetUser = null;
      if (targetUserId) {
        targetUser = await ctx.db.get(targetUserId);
      }
      
      // If direct lookup failed, try querying
      if (!targetUser) {
        console.log("Direct lookup failed, trying query");
        
        // Try looking up by _id
        const targetUserById = await ctx.db
          .query("users")
          .filter(q => q.eq(q.field("_id"), args.targetUserId))
          .first();
          
        if (targetUserById) {
          targetUser = targetUserById;
        } else {
          // Try looking up by username
          const targetUserByUsername = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("username"), args.targetUserId))
            .first();
            
          if (targetUserByUsername) {
            targetUser = targetUserByUsername;
          }
        }
      }
      
      // Final check - we need a valid user
      if (!targetUser) {
        console.log("No user found for ID:", args.targetUserId);
        throw new ConvexError("Target user not found");
      }
      
      console.log("Found target user:", targetUser._id);
      
      // Create notification content based on call type
      const callType = args.callType === "video" ? "Video" : "Audio";
      const callerName = args.callerName || (user?.username || "User");
      
      // Add notification with type assertions to satisfy TypeScript
      const notificationId = await ctx.db.insert("notifications", {
        userId: targetUser._id,
        // Type must be one of the allowed values in the schema
        type: "call" as any,
        title: `Incoming ${callType} Call`,
        content: `${callerName} is calling you`,
        timestamp: Date.now(),
        read: false,
        sourceId: args.roomId,
        // SourceType must be one of the allowed values in the schema
        sourceType: "call" as any,
        callData: {
          callType: args.callType,
          roomId: args.roomId,
          callerName: callerName
        },
      });
      
      return { success: true, notificationId };
    } catch (error) {
      console.error("Error sending call notification:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to send call notification");
    }
  },
}); 