import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { Id } from "./_generated/dataModel";

// Get user activities
export const getUserActivities = query({
  args: {
    sessionToken: sessionTokenValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    const limit = args.limit || 10;
    
    // Get activities sorted by timestamp (newest first)
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    
    // Return formatted results
    return activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp,
      relatedEntityId: activity.relatedEntityId,
      relatedEntityType: activity.relatedEntityType,
    }));
  },
});

// Create user activity (internal function to be called by other API functions)
export const createActivity = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("joinedGroup"),
      v.literal("startedConversation"),
      v.literal("profileUpdate"),
      v.literal("custom")
    ),
    description: v.string(),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("user"),
      v.literal("announcement")
    )),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    
    // Create the activity
    const activityId = await ctx.db.insert("userActivity", {
      userId: args.userId,
      type: args.type,
      description: args.description,
      timestamp: Date.now(),
      relatedEntityId: args.relatedEntityId,
      relatedEntityType: args.relatedEntityType,
    });
    
    return { success: true, activityId };
  },
}); 