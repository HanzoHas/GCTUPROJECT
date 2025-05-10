import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Get user profile
export const getProfile = query({
  args: {
    sessionToken: sessionTokenValidator,
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user first
    const { user: currentUser, userId: currentUserId } = await getAuthenticatedUser(
      ctx,
      args.sessionToken
    );

    // If userId is provided, get that user's profile, otherwise get current user's profile
    const targetUserId = args.userId || currentUserId.toString();
    
    // Convert to Convex ID type
    const targetUserIdTyped = targetUserId as unknown as Id<"users">;

    // Check for blocked users
    if (
      args.userId &&
      currentUser.blockedUsers.includes(args.userId)
    ) {
      throw new ConvexError("You have blocked this user");
    }

    const user = await ctx.db.get(targetUserIdTyped);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if target user has blocked current user
    if (user.blockedUsers.includes(currentUserId.toString())) {
      throw new ConvexError("You cannot view this profile");
    }

    // Get online status
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", targetUserIdTyped))
      .first();

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      status: user.status,
      isOnline: presence?.isOnline || false,
      lastSeen: presence?.lastSeen,
      isBlocked: currentUser.blockedUsers.includes(targetUserId),
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    username: v.optional(v.string()),
    profilePicture: v.optional(v.string()), // Base64 encoded image
    status: v.optional(
      v.union(
        v.literal("Available"),
        v.literal("Busy"),
        v.literal("In class"),
        v.literal("Offline")
      )
    ),
    notificationSettings: v.optional(v.object({
      enabled: v.boolean(),
      newMessages: v.boolean(),
      mentions: v.boolean(),
      groupInvites: v.boolean(),
      announcements: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(
      ctx,
      args.sessionToken
    );

    const updates: Record<string, any> = {};
    const activityDescriptions: string[] = [];

    // Username update
    if (args.username && args.username !== user.username) {
      // Check if username is taken - handle the optional username param
      const username = args.username;
      
      const existingUsername = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();

      if (existingUsername) {
        throw new ConvexError("This username is already taken");
      }

      updates.username = username;
      activityDescriptions.push(`Updated username to ${username}`);
    }

    // Handle profile picture upload if provided
    if (args.profilePicture && args.profilePicture.startsWith('data:')) {
      const uploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
        base64Data: args.profilePicture,
        folder: 'chatter-school-connect/profile-pictures'
      });
      
      updates.profilePicture = uploadResult.url;
      // Add a version number for cache-busting
      updates.profilePictureVersion = (user.profilePictureVersion || 0) + 1;
      activityDescriptions.push("Updated profile picture");
    }

    // Status update
    if (args.status) {
      updates.status = args.status;
      activityDescriptions.push(`Changed status to ${args.status}`);

      // Also update presence
      const presence = await ctx.db
        .query("presence")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (presence) {
        await ctx.db.patch(presence._id, {
          isOnline: args.status !== "Offline",
          lastSeen: Date.now(),
        });
      }
    }

    // Notification settings update
    if (args.notificationSettings) {
      updates.notificationSettings = args.notificationSettings;
      activityDescriptions.push("Updated notification settings");
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
      
      // Log activity for profile update
      if (activityDescriptions.length > 0) {
        await ctx.runMutation(api.activities.createActivity, {
          userId,
          type: "profileUpdate",
          description: activityDescriptions.join(", "),
          relatedEntityId: userId.toString(),
          relatedEntityType: "user"
        });
      }
    }

    return { success: true };
  },
});

// Block a user
export const blockUser = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(
      ctx,
      args.sessionToken
    );

    // Convert string ID to Convex ID type
    const targetUserIdTyped = args.targetUserId as unknown as Id<"users">;
    
    // Get target user
    const targetUser = await ctx.db.get(targetUserIdTyped);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    // Add to blocked users if not already blocked
    if (!user.blockedUsers.includes(args.targetUserId)) {
      await ctx.db.patch(userId, {
        blockedUsers: [...user.blockedUsers, args.targetUserId],
      });
    }

    return { success: true };
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(
      ctx,
      args.sessionToken
    );

    // Remove from blocked users
    await ctx.db.patch(userId, {
      blockedUsers: user.blockedUsers.filter(id => id !== args.targetUserId),
    });

    return { success: true };
  },
});

// Toggle visibility (hide/unhide from search)
export const toggleVisibility = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    isHidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);

    await ctx.db.patch(userId, {
      isHidden: args.isHidden,
    });

    return { success: true };
  },
});

// Search users by username
export const searchUsers = query({
  args: {
    sessionToken: sessionTokenValidator,
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const { user: currentUser, userId: currentUserId } = await getAuthenticatedUser(
      ctx,
      args.sessionToken
    );

    if (args.query.length < 3) {
      throw new ConvexError("Search query must be at least 3 characters");
    }

    // Use search index
    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_by_username", (q) =>
        q.search("username", args.query)
      )
      .collect();

    // Filter out:
    // 1. Current user
    // 2. Blocked users
    // 3. Users who have blocked the current user
    // 4. Hidden users
    const filteredUsers = users.filter(
      (user) =>
        user._id !== currentUserId &&
        !currentUser.blockedUsers.includes(user._id) &&
        !user.blockedUsers.includes(currentUserId) &&
        !user.isHidden
    );

    return filteredUsers.map((user) => ({
      id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
    }));
  },
}); 

// Set a user as a lecturer (admin only)
export const setUserAsLecturer = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    targetUserId: v.id("users"),
    isLecturer: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { targetUserId, isLecturer } = args;

    // Only admins can set lecturer status
    if (!user.isAdmin) {
      throw new ConvexError("Only administrators can change lecturer status");
    }

    // Get the target user
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    // Update the lecturer status
    await ctx.db.patch(targetUserId, { isLecturer });

    return { success: true };
  },
});

// Get all lecturers
export const getLecturers = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Only admins can get the list of all lecturers
    if (!user.isAdmin) {
      throw new ConvexError("Only administrators can view the list of lecturers");
    }

    // Get all users with lecturer role
    const lecturers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isLecturer"), true))
      .collect();

    return lecturers.map(lecturer => ({
      id: lecturer._id,
      username: lecturer.username,
      email: lecturer.email,
      profilePicture: lecturer.profilePicture,
      status: lecturer.status,
    }));
  },
});

// Check if current user is a lecturer
export const isCurrentUserLecturer = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await getAuthenticatedUser(ctx, args.sessionToken);
    return !!user.isLecturer;
  },
});

// Manually set current user as lecturer (temporary fix)
export const setCurrentUserAsLecturer = mutation({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    // Update user directly to be a lecturer
    await ctx.db.patch(userId, { isLecturer: true });
    
    return { success: true };
  },
});

// Subscribe to user status
export const subscribeToUserStatus = query({
  args: {
    sessionToken: sessionTokenValidator,
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate the requesting user
    const { user, userId } = await getAuthenticatedUser(
      ctx,
      args.sessionToken
    );

    // Convert all string IDs to Convex ID type
    const userIdsTyped = args.userIds.map(id => id as unknown as Id<"users">);
    
    // Get users and their statuses
    const userStatuses = await Promise.all(
      userIdsTyped.map(async (id) => {
        try {
          const targetUser = await ctx.db.get(id);
          
          // Skip if user not found or has blocked the current user
          if (!targetUser || targetUser.blockedUsers.includes(userId.toString())) {
            return null;
          }
          
          // Get presence information
          const presence = await ctx.db
            .query("presence")
            .withIndex("by_user", (q) => q.eq("userId", id))
            .first();
            
          // Get user settings to check if they want to show online status
          const settings = await ctx.db
            .query("settings")
            .withIndex("by_user", (q) => q.eq("userId", id))
            .first();
            
          const showOnlineStatus = settings ? settings.onlineStatus : true;
          
          return {
            userId: targetUser._id,
            username: targetUser.username,
            status: targetUser.status,
            isOnline: showOnlineStatus ? (presence?.isOnline || false) : false,
            lastSeen: showOnlineStatus ? presence?.lastSeen : null,
          };
        } catch (error) {
          return null;
        }
      })
    );
    
    // Filter out null values (users that weren't found or blocked the requestor)
    return userStatuses.filter(status => status !== null);
  },
}); 