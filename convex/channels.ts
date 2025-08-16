import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create a new study channel (lecturer only)
export const createChannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    name: v.string(),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    type: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    allowedStudentGroups: v.optional(v.array(v.string())),
    createdByStudent: v.optional(v.boolean()),
    members: v.optional(v.array(v.string())),
    level: v.optional(v.union(v.literal("100"), v.literal("200"), v.literal("300"))),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { name, description, avatar, members, level } = args;

    // Allow admin users to create channels
    // For non-admin users, require lecturer permission
    if (!user.isAdmin && !user.isLecturer) {
      throw new ConvexError("Only lecturers and admins can create study channels");
    }

    if (name.trim().length === 0) {
      throw new ConvexError("Channel name cannot be empty");
    }

    // Create the channel with only the fields in the schema
    const channelId = await ctx.db.insert("studyChannels", {
      name,
      description,
      lecturerId: userId,
      avatar,
      createdAt: Date.now(),
      level,
    });

    // Add the creator as a member of the channel
    await ctx.db.insert("channelMembers", {
      userId,
      channelId,
      joinedAt: Date.now(),
    });

    // Add members if provided
    if (members && members.length > 0) {
      for (const memberIdStr of members) {
        try {
          // Convert string ID to proper Convex ID
          const memberId = ctx.db.normalizeId("users", memberIdStr);
          if (memberId) {
            await ctx.db.insert("channelMembers", {
              userId: memberId,
              channelId,
              joinedAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to add member:", memberIdStr);
        }
      }
    }

    return { channelId };
  },
});

// Get channels for a lecturer
export const getLecturerChannels = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Only lecturers and admins can access lecturer channels
    if (!user.isLecturer && !user.isAdmin) {
      throw new ConvexError("Only lecturers can access lecturer channels");
    }

    // Query channels
    const channels = await ctx.db
      .query("studyChannels")
      .withIndex("by_lecturer", (q) => q.eq("lecturerId", userId))
      .collect();

    return channels;
  },
});

// Get a single channel by ID
export const getChannelById = query({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId } = args;

    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Add lecturer info
    const lecturer = await ctx.db.get(channel.lecturerId);
    return {
      ...channel,
      lecturer: {
        id: lecturer?._id || "unknown",
        name: lecturer?.username || "Unknown",
        avatar: lecturer?.profilePicture,
      },
    };
  },
});

// Update a channel (lecturer only - must be the owner)
export const updateChannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    type: v.optional(v.string()),
    position: v.optional(v.number()),
    isPrivate: v.optional(v.boolean()),
    allowedStudentGroups: v.optional(v.array(v.string())),
    members: v.optional(v.array(v.string())),
    level: v.optional(v.union(v.literal("100"), v.literal("200"), v.literal("300"))),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId, name, description, avatar, type, position, isPrivate, allowedStudentGroups, members, level } = args;

    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner or admin can update
    if (channel.lecturerId.toString() !== userId.toString() && !user.isAdmin) {
      throw new ConvexError("You don't have permission to update this channel");
    }

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new ConvexError("Channel name cannot be empty");
      }
      updates.name = name;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (avatar !== undefined) {
      updates.avatar = avatar;
    }
    
    if (type !== undefined) {
      updates.type = type;
    }
    
    if (position !== undefined) {
      updates.position = position;
    }
    
    if (isPrivate !== undefined) {
      updates.isPrivate = isPrivate;
    }
    
    if (allowedStudentGroups !== undefined) {
      updates.allowedStudentGroups = allowedStudentGroups;
    }
    
    if (level !== undefined) {
      updates.level = level;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(channelId, updates);
    }
    
    // Update members if provided
    if (members !== undefined && Array.isArray(members)) {
      // Get current members
      const currentMembers = await ctx.db
        .query("channelMembers")
        .withIndex("by_channel", q => q.eq("channelId", channelId))
        .collect();
      
      const currentMemberIds = currentMembers.map(m => m.userId.toString());
      const newMemberIds = members.map(m => m.toString());
      
      // Remove members that are no longer in the list
      for (const member of currentMembers) {
        if (!newMemberIds.includes(member.userId.toString())) {
          await ctx.db.delete(member._id);
        }
      }
      
      // Add new members
      for (const memberIdStr of newMemberIds) {
        if (!currentMemberIds.includes(memberIdStr)) {
          try {
            // Convert string ID to proper Convex ID
            const memberId = ctx.db.normalizeId("users", memberIdStr);
            if (memberId) {
              await ctx.db.insert("channelMembers", {
                userId: memberId,
                channelId,
                joinedAt: Date.now(),
              });
            }
          } catch (error) {
            console.error("Failed to add member:", memberIdStr);
          }
        }
      }
    }

    return { success: true };
  },
});

// Delete a channel (lecturer only - must be the owner)
export const deleteChannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId } = args;

    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner or admin can delete
    if (channel.lecturerId.toString() !== userId.toString() && !user.isAdmin) {
      throw new ConvexError("You don't have permission to delete this channel");
    }

    // Delete all subchannels for this channel
    const subchannels = await ctx.db
      .query("studySubchannels")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    for (const subchannel of subchannels) {
      await ctx.db.delete(subchannel._id);
    }

    // Delete all channel members
    const members = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all channel announcements
    const announcements = await ctx.db
      .query("channelAnnouncements")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    for (const announcement of announcements) {
      await ctx.db.delete(announcement._id);
    }

    // Delete the channel
    await ctx.db.delete(channelId);

    return { success: true };
  },
});

// Get all channels a user is a member of, plus all admin-created channels
export const getUserChannels = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId, user } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Get all channels (all users should be able to see channels)
    const allChannels = await ctx.db.query("studyChannels").collect();
    
    // If the user is an admin or lecturer, they should see all channels
    // Otherwise, get the channels the user is a member of
    let userChannelIds: Id<"studyChannels">[] = [];
    if (!user.isAdmin && !user.isLecturer) {
      // Get all channel memberships
      const memberships = await ctx.db
        .query("channelMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      // Add user's personal channels to the list
      userChannelIds = memberships.map((m) => m.channelId);
    }

    // Get the channel details
    const channels = await Promise.all(
      allChannels.map(async (channel) => {
        // Skip if the user is not a member of a private channel
        // and is not an admin/lecturer
        if (!user.isAdmin && !user.isLecturer && 
            !userChannelIds.some(id => id.toString() === channel._id.toString())) {
          // Check if the channel is created by the current user
          if (channel.lecturerId.toString() !== userId.toString()) {
            return null;
          }
        }
        
        const lecturer = await ctx.db.get(channel.lecturerId);
        return {
          ...channel,
          lecturer: {
            id: lecturer?._id || "unknown",
            name: lecturer?.username || "Unknown",
            avatar: lecturer?.profilePicture,
          },
        };
      })
    );

    return channels.filter(Boolean);
  },
});

// Add a user to a channel
export const addChannelMember = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
    userId: v.id("users"),
    subchannelId: v.optional(v.id("studySubchannels")),
  },
  handler: async (ctx, args) => {
    const { user, userId: currentUserId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId, userId: targetUserId, subchannelId } = args;

    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Permission check removed to allow anyone to join channels

    // Check if subchannel exists (if provided)
    if (subchannelId) {
      const subchannel = await ctx.db.get(subchannelId);
      if (!subchannel || subchannel.channelId.toString() !== channelId.toString()) {
        throw new ConvexError("Subchannel not found or doesn't belong to this channel");
      }
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", channelId).eq("userId", targetUserId)
      )
      .first();

    if (existingMembership) {
      // If already a member, update the subchannel if provided
      if (subchannelId) {
        await ctx.db.patch(existingMembership._id, { subchannelId });
      }
    } else {
      // If not a member, add them
      await ctx.db.insert("channelMembers", {
        userId: targetUserId,
        channelId,
        subchannelId,
        joinedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Remove a user from a channel
export const removeChannelMember = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user, userId: currentUserId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId, userId: targetUserId } = args;

    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner or admin can remove members
    if (channel.lecturerId.toString() !== currentUserId.toString() && !user.isAdmin) {
      throw new ConvexError("You don't have permission to remove members from this channel");
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", channelId).eq("userId", targetUserId)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }

    return { success: true };
  },
});

// Join a channel (self-join for any user)
export const joinChannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId } = args;

    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel_user", (q) => 
        q.eq("channelId", channelId).eq("userId", userId)
      )
      .first();

    if (existingMembership) {
      return { success: true, message: "Already a member of this channel" };
    }

    // Add the user as a member
    await ctx.db.insert("channelMembers", {
      userId,
      channelId,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get channels by level
export const getChannelsByLevel = query({
  args: {
    sessionToken: sessionTokenValidator,
    level: v.optional(v.union(v.literal("100"), v.literal("200"), v.literal("300"))),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.sessionToken);
    const { level } = args;

    // Get only visible channels that user is a member of
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    
    // Get user's channel memberships
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const memberChannelIds = memberships.map(m => m.channelId);
    
    // Get channels user is a member of
    const memberChannels = await Promise.all(
      memberChannelIds.map(id => ctx.db.get(id))
    );
    
    const validChannels = memberChannels.filter((channel): channel is NonNullable<typeof channel> => channel !== null);
    
    // Filter by level if provided
    const filteredChannels = level 
      ? validChannels.filter(channel => channel.level === level)
      : validChannels;

    // Add lecturer info
    const channelsWithDetails = await Promise.all(
      filteredChannels.map(async (channel) => {
        const lecturer = await ctx.db.get(channel.lecturerId);
        return {
          ...channel,
          lecturer: {
            id: lecturer?._id || "unknown",
            name: lecturer?.username || "Unknown",
            avatar: lecturer?.profilePicture,
          }
        };
      })
    );
    
    return channelsWithDetails;
  },
}); 
