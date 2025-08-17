import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { api } from "./_generated/api";

// Create a new channel announcement (lecturer only)
export const createChannelAnnouncement = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
    subchannelId: v.optional(v.id("studySubchannels")),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId, subchannelId, title, content, type } = args;

    // Get the channel to verify ownership
    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only channel owner (lecturer) or admin can create announcements
    if (channel.lecturerId.toString() !== userId.toString() && !user.isAdmin) {
      throw new ConvexError("Only the channel lecturer can create announcements");
    }

    // Validate subchannel if provided
    if (subchannelId) {
      const subchannel = await ctx.db.get(subchannelId);
      if (!subchannel || subchannel.channelId.toString() !== channelId.toString()) {
        throw new ConvexError("Subchannel not found or doesn't belong to this channel");
      }
    }

    if (title.trim().length === 0) {
      throw new ConvexError("Announcement title cannot be empty");
    }

    // Process media content if needed
    let finalContent = content;
    if (type !== "text" && content.startsWith("data:")) {
      // For now, just store the base64 data directly
      // Media upload will be handled by the frontend or a separate process
      finalContent = content;
    }

    // Create the announcement
    const announcementId = await ctx.db.insert("channelAnnouncements", {
      channelId,
      subchannelId,
      authorId: userId,
      title,
      content: finalContent,
      type,
      timestamp: Date.now(),
    });

    // Notify channel members about the announcement
    const members = await ctx.db
      .query("channelMembers")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();

    // If targeting a specific subchannel, only notify members of that subchannel
    const membersToNotify = subchannelId 
      ? members.filter(m => m.subchannelId?.toString() === subchannelId.toString())
      : members;

    for (const member of membersToNotify) {
      if (member.userId.toString() === userId.toString()) continue; // Don't notify the author
      
      await ctx.db.insert("notifications", {
        userId: member.userId,
        type: "announcement",
        read: false,
        title: "New Channel Announcement",
        content: `New announcement in ${channel.name}: ${title}`,
        timestamp: Date.now(),
        sourceId: announcementId.toString(),
        sourceType: "announcement",
      });
    }

    return { announcementId };
  },
});

// Get channel announcements with pagination
export const getChannelAnnouncements = query({
  args: {
    sessionToken: sessionTokenValidator,
    channelId: v.id("studyChannels"),
    subchannelId: v.optional(v.id("studySubchannels")),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp for pagination
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.sessionToken);
    const { channelId, subchannelId, limit = 10, before } = args;
    
    // Verify the channel exists
    const channel = await ctx.db.get(channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Build the query
    let announcementsQuery;
    
    if (subchannelId) {
      // Get announcements for specific subchannel
      announcementsQuery = ctx.db
        .query("channelAnnouncements")
        .withIndex("by_subchannel", (q) => q.eq("subchannelId", subchannelId));
    } else {
      // Get announcements for entire channel (excluding subchannel-specific ones)
      announcementsQuery = ctx.db
        .query("channelAnnouncements")
        .withIndex("by_channel", (q) => q.eq("channelId", channelId))
        .filter((q) => q.eq(q.field("subchannelId"), undefined));
    }
      
    // Apply timestamp filter if provided
    if (before) {
      announcementsQuery = announcementsQuery.filter(q => 
        q.lt(q.field("timestamp"), before)
      );
    }
    
    // Apply sorting and limit
    const announcements = await announcementsQuery.order("desc").take(limit);

    // Fetch author information for each announcement
    const processedAnnouncements = await Promise.all(
      announcements.map(async (announcement) => {
        const author = await ctx.db.get(announcement.authorId);
        
        return {
          id: announcement._id,
          channelId: announcement.channelId,
          subchannelId: announcement.subchannelId,
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          timestamp: announcement.timestamp,
          author: {
            id: author?._id || "unknown",
            name: author?.username || "Unknown",
            avatar: author?.profilePicture,
          },
        };
      })
    );

    return processedAnnouncements;
  },
});

// Delete a channel announcement
export const deleteChannelAnnouncement = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    announcementId: v.id("channelAnnouncements"),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { announcementId } = args;

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) {
      throw new ConvexError("Announcement not found");
    }

    // Get the channel to verify ownership
    const channel = await ctx.db.get(announcement.channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only the announcement author, channel owner, or admin can delete
    if (announcement.authorId.toString() !== userId.toString() && 
        channel.lecturerId.toString() !== userId.toString() && 
        !user.isAdmin) {
      throw new ConvexError("You don't have permission to delete this announcement");
    }

    // Delete the announcement
    await ctx.db.delete(announcementId);

    return { success: true };
  },
});

// Update a channel announcement
export const updateChannelAnnouncement = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    announcementId: v.id("channelAnnouncements"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("video"),
        v.literal("audio")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { announcementId, title, content, type } = args;

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) {
      throw new ConvexError("Announcement not found");
    }

    // Get the channel to verify ownership
    const channel = await ctx.db.get(announcement.channelId);
    if (!channel) {
      throw new ConvexError("Channel not found");
    }

    // Only the announcement author, channel owner, or admin can update
    if (announcement.authorId.toString() !== userId.toString() && 
        channel.lecturerId.toString() !== userId.toString() && 
        !user.isAdmin) {
      throw new ConvexError("You don't have permission to update this announcement");
    }

    const updates: Record<string, any> = {};

    if (title !== undefined) {
      if (title.trim().length === 0) {
        throw new ConvexError("Announcement title cannot be empty");
      }
      updates.title = title;
    }

    // Process content update if provided
    if (content !== undefined) {
      // If type is changing or staying non-text and content starts with data:, process through media handler
      if (
        (type !== undefined && type !== "text" && content.startsWith("data:")) ||
        (type === undefined && announcement.type !== "text" && content.startsWith("data:"))
      ) {
        // For now, just store the base64 data directly
        // Media upload will be handled by the frontend or a separate process
        updates.content = content;
      } else {
        updates.content = content;
      }
    }

    // Update type if provided
    if (type !== undefined) {
      updates.type = type;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(announcementId, updates);
    }

    return { success: true };
  },
}); 