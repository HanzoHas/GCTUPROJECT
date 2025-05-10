import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create a new subchannel for a study channel
export const createSubchannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
    name: v.string(),
    description: v.optional(v.string()),
    studentGroups: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId, name, description, studentGroups = [] } = args;

    // Get the channel to verify ownership
    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner or admin can create subchannels
    if (channel.lecturerId.toString() !== userId.toString() && !user.isAdmin) {
      throw new ConvexError("You don't have permission to create subchannels for this channel");
    }

    if (name.trim().length === 0) {
      throw new ConvexError("Subchannel name cannot be empty");
    }

    // Create the subchannel
    const subchannelId = await ctx.db.insert("studySubchannels", {
      channelId,
      name,
      description,
      studentGroups,
      createdAt: Date.now(),
    });

    return { subchannelId };
  },
});

// Get all subchannels for a channel
export const getChannelSubchannels = query({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId } = args;

    // Get all subchannels for the channel
    const subchannels = await ctx.db
      .query("studySubchannels")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    return subchannels;
  },
});

// Get a single subchannel by ID
export const getSubchannelById = query({
  args: {
    sessionToken: sessionTokenValidator,
    subchannelId: v.id("studySubchannels"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.sessionToken);
    const { subchannelId } = args;

    const subchannel = await ctx.db.get(subchannelId);
    if (!subchannel) {
      throw new ConvexError("Subchannel not found");
    }

    return subchannel;
  },
});

// Update a subchannel
export const updateSubchannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    subchannelId: v.id("studySubchannels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    studentGroups: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { subchannelId, name, description, studentGroups } = args;

    const subchannel = await ctx.db.get(subchannelId);
    if (!subchannel) {
      throw new ConvexError("Subchannel not found");
    }

    // Get the channel to verify ownership
    const channel = await ctx.db.get(subchannel.channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner or admin can update subchannels
    if (channel.lecturerId.toString() !== userId.toString() && !user.isAdmin) {
      throw new ConvexError("You don't have permission to update this subchannel");
    }

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new ConvexError("Subchannel name cannot be empty");
      }
      updates.name = name;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (studentGroups !== undefined) {
      updates.studentGroups = studentGroups;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(subchannelId, updates);
    }

    return { success: true };
  },
});

// Delete a subchannel
export const deleteSubchannel = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    subchannelId: v.id("studySubchannels"),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { subchannelId } = args;

    const subchannel = await ctx.db.get(subchannelId);
    if (!subchannel) {
      throw new ConvexError("Subchannel not found");
    }

    // Get the channel to verify ownership
    const channel = await ctx.db.get(subchannel.channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner or admin can delete subchannels
    if (channel.lecturerId.toString() !== userId.toString() && !user.isAdmin) {
      throw new ConvexError("You don't have permission to delete this subchannel");
    }

    // Update channel members who were assigned to this subchannel
    const members = await ctx.db
      .query("channelMembers")
      .withIndex("by_subchannel", (q) => q.eq("subchannelId", subchannelId))
      .collect();

    for (const member of members) {
      await ctx.db.patch(member._id, { subchannelId: undefined });
    }

    // Delete all announcements for this subchannel
    const announcements = await ctx.db
      .query("channelAnnouncements")
      .withIndex("by_subchannel", (q) => q.eq("subchannelId", subchannelId))
      .collect();

    for (const announcement of announcements) {
      await ctx.db.delete(announcement._id);
    }

    // Delete the subchannel
    await ctx.db.delete(subchannelId);

    return { success: true };
  },
});

// Get all subchannels a user is assigned to
export const getUserSubchannels = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Get all channel memberships with subchannels
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get the subchannel details for memberships with subchannels
    const subchannelMemberships = memberships.filter(m => m.subchannelId);
    const subchannels = await Promise.all(
      subchannelMemberships.map(async (membership) => {
        if (!membership.subchannelId) return null;
        
        const subchannel = await ctx.db.get(membership.subchannelId);
        if (!subchannel) return null;
        
        const channel = await ctx.db.get(membership.channelId);
        if (!channel) return null;
        
        return {
          ...subchannel,
          channel: {
            id: channel._id,
            name: channel.name,
          },
        };
      })
    );

    return subchannels.filter(Boolean);
  },
}); 