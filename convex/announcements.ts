import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
// import { api } from "./_generated/api"; // Commented out to avoid circular dependencies
import { uploadMediaSync, deleteMediaSync } from "./utils/mediaWrapper";

// Create a new announcement (admin only)
export const createAnnouncement = mutation({
  args: {
    sessionToken: sessionTokenValidator,
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
    const { title, content, type } = args;

    // Only admins can create announcements
    if (!user.isAdmin) {
      throw new ConvexError("Only administrators can create announcements");
    }

    if (title.trim().length === 0) {
      throw new ConvexError("Announcement title cannot be empty");
    }

    // Process media content if needed
    let finalContent = content;
    if (type !== "text" && content.startsWith("data:")) {
      // Temporarily disable media upload to avoid circular dependencies
      // TODO: Implement direct Cloudinary upload or use external action
      finalContent = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop";
    }

    // Create the announcement
    const announcementId = await ctx.db.insert("announcements", {
      authorId: userId,
      title,
      content: finalContent,
      type,
      timestamp: Date.now(),
    });

    return { announcementId };
  },
});

// Get all announcements with pagination
export const getAnnouncements = query({
  args: {
    sessionToken: v.optional(sessionTokenValidator),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp for pagination
  },
  handler: async (ctx, args) => {
    // Check for authentication if sessionToken is provided
    if (args.sessionToken) {
      await getAuthenticatedUser(ctx, args.sessionToken);
    }
    
    const { limit = 20, before } = args;

    // Query announcements with pagination
    let announcementsQuery = ctx.db.query("announcements").withIndex("by_timestamp");
      
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
        
        // Check if author is a user document with the expected fields
        const authorInfo = {
          id: author?._id || "unknown",
          name: "Unknown",
          avatar: undefined as string | undefined,
        };
        
        // Only access user fields if this is a user document
        if (author && '_id' in author && 'username' in author) {
          authorInfo.name = author.username;
          authorInfo.avatar = author.profilePicture;
        }
        
        return {
          id: announcement._id,
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          timestamp: announcement.timestamp,
          author: authorInfo,
        };
      })
    );

    return processedAnnouncements;
  },
});

// Get a single announcement by ID
export const getAnnouncementById = query({
  args: {
    sessionToken: sessionTokenValidator,
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx, args.sessionToken);
    const { announcementId } = args;

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) {
      throw new ConvexError("Announcement not found");
    }

    const author = await ctx.db.get(announcement.authorId);
    return {
      id: announcement._id,
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
  },
});

// Delete an announcement (admin only)
export const deleteAnnouncement = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { announcementId } = args;

    // Only admins can delete announcements
    if (!user.isAdmin) {
      throw new ConvexError("Only administrators can delete announcements");
    }

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) {
      throw new ConvexError("Announcement not found");
    }

    // Only the author or super admins can delete
    if (announcement.authorId !== userId && !user.isAdmin) {
      throw new ConvexError("You don't have permission to delete this announcement");
    }

    // If the announcement contains media, we could delete it from Cloudinary here
    // but for simplicity, we'll just delete the announcement record

    await ctx.db.delete(announcementId);

    return { success: true };
  },
});

// Update an announcement (admin only, author only)
export const updateAnnouncement = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    announcementId: v.id("announcements"),
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

    // Only admins can update announcements
    if (!user.isAdmin) {
      throw new ConvexError("Only administrators can update announcements");
    }

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) {
      throw new ConvexError("Announcement not found");
    }

    // Only the author can update
    if (announcement.authorId !== userId) {
      throw new ConvexError("You can only update your own announcements");
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
      // If type is changing or staying non-text and content starts with data:, process through Cloudinary
      if (
        (type !== undefined && type !== "text" && content.startsWith("data:")) ||
        (type === undefined && announcement.type !== "text" && content.startsWith("data:"))
      ) {
        // Temporarily disable media upload to avoid circular dependencies
        // TODO: Implement direct Cloudinary upload or use external action
        updates.content = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop";
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