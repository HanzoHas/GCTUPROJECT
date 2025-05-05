import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { api } from "./_generated/api";

// Send a message
export const sendMessage = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, content, type, replyToId } = args;

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Process media content if present
    let finalContent = content;
    let attachments = [];
    
    if (type !== "text" && content.startsWith("data:")) {
      // Directly call the uploadMediaSync function which handles Cloudinary upload
      const uploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
        base64Data: content,
        folder: `chatter-school-connect/messages/${type}`
      });
      
      finalContent = uploadResult.url;
    }

    // If it's a reply, verify the message exists and is in the same conversation
    if (replyToId) {
      const replyMessage = await ctx.db.get(replyToId);
      if (!replyMessage) {
        throw new ConvexError("Reply message not found");
      }
      if (replyMessage.conversationId !== conversationId) {
        throw new ConvexError("Cannot reply to a message from a different conversation");
      }
    }

    const timestamp = Date.now();

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId: userId,
      content: finalContent,
      type,
      timestamp,
      replyToId,
      isDeleted: false,
      isEdited: false,
    });

    // Mark as read by the sender
    await ctx.db.insert("readReceipts", {
      messageId,
      userId,
      readAt: timestamp,
    });

    // Update conversation with last message info
    await ctx.db.patch(conversationId, {
      lastMessageId: messageId,
      lastMessageTimestamp: timestamp,
    });

    // Clear typing indicator for sender
    const typingIndicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (typingIndicator) {
      await ctx.db.delete(typingIndicator._id);
    }

    return { messageId };
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { messageId, content } = args;

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new ConvexError("You can only edit your own messages");
    }

    // Check if message type is text (can only edit text messages)
    if (message.type !== "text") {
      throw new ConvexError("You can only edit text messages");
    }

    // Update the message
    await ctx.db.patch(messageId, {
      content,
      isEdited: true,
    });

    return { success: true };
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { messageId } = args;

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      // Check if user is admin of the group
      const conversation = await ctx.db.get(message.conversationId);
      if (!conversation) {
        throw new ConvexError("Conversation not found");
      }

      const membership = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation_and_user", (q) =>
          q.eq("conversationId", message.conversationId).eq("userId", userId)
        )
        .first();

      if (!membership || !membership.isAdmin) {
        throw new ConvexError(
          "You can only delete your own messages or as an admin"
        );
      }
    }

    // Soft delete the message
    await ctx.db.patch(messageId, {
      isDeleted: true,
      content: "This message has been deleted",
    });

    return { success: true };
  },
});

// Mark message as read
export const markAsRead = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { messageId } = args;

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", message.conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Check if already read
    const existingReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", userId).eq("messageId", messageId)
      )
      .first();

    if (!existingReceipt) {
      // Insert read receipt
      await ctx.db.insert("readReceipts", {
        messageId,
        userId,
        readAt: Date.now(),
      });
    }

    // Update the last read message for this conversation
    await ctx.db.patch(membership._id, {
      lastReadMessageId: messageId,
    });

    return { success: true };
  },
});

// React to message
export const reactToMessage = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { messageId, emoji } = args;

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError("Message not found");
    }

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", message.conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Check if already reacted with this emoji
    const existingReaction = await ctx.db
      .query("messageReactions")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", userId).eq("messageId", messageId)
      )
      .filter((q) => q.eq(q.field("emoji"), emoji))
      .first();

    if (existingReaction) {
      // Remove reaction
      await ctx.db.delete(existingReaction._id);
      return { action: "removed" };
    } else {
      // Add reaction
      await ctx.db.insert("messageReactions", {
        messageId,
        userId,
        emoji,
        timestamp: Date.now(),
      });
      return { action: "added" };
    }
  },
});

// Set typing indicator
export const setTypingIndicator = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Get existing typing indicator
    const existingIndicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    // Create or update typing indicator
    if (existingIndicator) {
      await ctx.db.patch(existingIndicator._id, {
        timestamp: Date.now(),
      });
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId,
        userId,
        timestamp: Date.now(),
      });
    }

    return { success: true };
  },
});

// Clear typing indicator
export const clearTypingIndicator = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Get existing typing indicator
    const existingIndicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    // Remove typing indicator if it exists
    if (existingIndicator) {
      await ctx.db.delete(existingIndicator._id);
    }

    return { success: true };
  },
});

// Get messages with pagination
export const getMessages = query({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp for pagination
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, limit = 50, before } = args;

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Query messages with pagination
    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", conversationId)
      );
      
    // Apply timestamp filter if before is provided
    if (before) {
      messagesQuery = messagesQuery.filter(q => 
        q.lt(q.field("timestamp"), before)
      );
    }
    
    // Get messages with pagination
    const messages = await messagesQuery.order("asc").take(limit);

    // Get message IDs and sender IDs
    const messageIds = messages.map(m => m._id);
    const senderIds = [...new Set(messages.map(m => m.senderId))];

    // Get read receipts for these messages
    const readReceipts = await ctx.db
      .query("readReceipts")
      .collect();
    
    // Filter read receipts for our messages
    const relevantReadReceipts = readReceipts.filter(r => 
      messageIds.some(id => id.toString() === r.messageId.toString())
    );
    
    // Get reactions for these messages
    const reactions = await ctx.db
      .query("messageReactions")
      .collect();
      
    // Filter reactions for our messages
    const relevantReactions = reactions.filter(r => 
      messageIds.some(id => id.toString() === r.messageId.toString())
    );

    // Get user info for all involved users
    const users = await Promise.all(
      senderIds.map(async (id) => {
        try {
          return await ctx.db.get(id);
        } catch (e) {
          return null;
        }
      })
    );
    
    // Create a map of user ID to user object
    const userMap: Record<string, any> = {};
    users.filter(Boolean).forEach(u => {
      if (u) userMap[u._id.toString()] = u;
    });

    // Process messages with additional data
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = userMap[message.senderId.toString()];
        
        // Check if message is read by anyone else
        const isRead = relevantReadReceipts.some(
          r => r.messageId.toString() === message._id.toString() && 
               r.userId.toString() !== message.senderId.toString()
        );

        // Get reactions for this message
        const messageReactions = relevantReactions
          .filter(r => r.messageId.toString() === message._id.toString())
          .map(r => {
            const reactionUser = userMap[r.userId.toString()];
            return {
              userId: r.userId.toString(),
              username: reactionUser && 'username' in reactionUser ? 
                reactionUser.username : "Unknown",
              emoji: r.emoji,
            };
          });

        // Handle reply to another message
        let replyTo = undefined;
        if (message.replyToId) {
          try {
            const replyMessage = await ctx.db.get(message.replyToId);
            if (replyMessage) {
              const replySender = await ctx.db.get(replyMessage.senderId);
              
              // Safely access message and sender properties
              replyTo = {
                id: replyMessage._id,
                content: 'content' in replyMessage ? replyMessage.content : "[Content Unavailable]",
                senderId: replyMessage.senderId.toString(),
                senderName: replySender && 'username' in replySender ? 
                  replySender.username : "Unknown",
              };
            }
          } catch (e) {
            // Reply message not found or inaccessible
          }
        }

        // Map message data to frontend format
        const messageData = {
          id: message._id.toString(),
          content: message.content,
          senderId: message.senderId,
          senderName: sender ? sender.username : 'Unknown',
          senderPicture: sender && 'profilePicture' in sender ? sender.profilePicture : undefined,
          senderPictureVersion: sender && 'profilePictureVersion' in sender ? sender.profilePictureVersion : 1,
          type: message.type,
          timestamp: message.timestamp,
          isRead,
          replyTo,
          reactions: messageReactions,
          isEdited: message.isEdited,
          isDeleted: message.isDeleted,
        };

        return messageData;
      })
    );

    return processedMessages;
  },
});

// Get typing indicators for a conversation
export const getTypingIndicators = query({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    // Check if user is member of conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Get typing indicators that are less than 10 seconds old
    const tenSecondsAgo = Date.now() - 10000;
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .filter((q) => q.gt(q.field("timestamp"), tenSecondsAgo))
      .filter((q) => q.neq(q.field("userId"), userId)) // Exclude current user
      .collect();

    // Get user info for each typing indicator
    const typingUsers = await Promise.all(
      typingIndicators.map(async (indicator) => {
        const user = await ctx.db.get(indicator.userId);
        return {
          userId: indicator.userId,
          username: user?.username || "Unknown",
        };
      })
    );

    return typingUsers;
  },
}); 