import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { CloudinaryUploadResult } from "./utils/mediaUpload";

// Type for return value of createGroupConversation
interface CreateGroupResult {
  conversationId: Id<"conversations">;
}

interface DirectConversationResult {
  conversationId: Id<"conversations">;
  isNew: boolean;
}

// Create a one-on-one conversation
export const createOneOnOneConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { otherUserId } = args;

    // Convert string ID to Convex ID
    const otherUserIdTyped = otherUserId as unknown as Id<"users">;

    // Check if otherUser exists
    const otherUser = await ctx.db.get(otherUserIdTyped);
    if (!otherUser) {
      throw new ConvexError("User not found");
    }

    // Check if users have blocked each other
    if (user.blockedUsers.includes(otherUserId)) {
      throw new ConvexError("You have blocked this user");
    }
    if (otherUser.blockedUsers.includes(userId)) {
      throw new ConvexError("This user has blocked you");
    }

    // Check if a conversation already exists between these users
    const existingMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const otherUserMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", otherUserIdTyped))
      .collect();

    // Find conversations where both users are members
    const userConversationIds = existingMembers.map((m) => m.conversationId);
    const commonConversations = otherUserMembers.filter((m) =>
      userConversationIds.includes(m.conversationId)
    );

    // Check if there's already a one-on-one chat
    for (const membership of commonConversations) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (conversation && !conversation.isGroup) {
        return { conversationId: conversation._id };
      }
    }

    // Create a new conversation
    const name = `${user.username} & ${otherUser.username}`;
    const conversationId = await ctx.db.insert("conversations", {
      name,
      isGroup: false,
      creatorId: userId,
      lastMessageTimestamp: Date.now(),
    });

    // Add both users as members
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      isAdmin: true,
      isMuted: false,
      joinedAt: Date.now(),
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: otherUserIdTyped,
      isAdmin: false,
      isMuted: false,
      joinedAt: Date.now(),
    });

    return { conversationId };
  },
});

// Create a group conversation
export const createGroupConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    name: v.string(),
    isPrivate: v.boolean(),
    initialMemberIds: v.array(v.string()),
    avatar: v.optional(v.string()), // Base64 image
    wallpaper: v.optional(v.string()), // Base64 image
  },
  handler: async (ctx, args): Promise<CreateGroupResult> => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { name, isPrivate, initialMemberIds, avatar, wallpaper } = args;

    if (name.trim().length === 0) {
      throw new ConvexError("Group name cannot be empty");
    }

    // Check if all users exist
    for (const memberId of initialMemberIds) {
      // Convert string ID to Convex ID type
      const memberIdTyped = memberId as unknown as Id<"users">;
      const member = await ctx.db.get(memberIdTyped);
      if (!member) {
        throw new ConvexError(`User ${memberId} not found`);
      }
    }

    // Process media if provided
    let avatarUrl: string | undefined = undefined;
    let wallpaperUrl: string | undefined = undefined;

    if (avatar && avatar.startsWith("data:")) {
      const uploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
        base64Data: avatar,
        folder: "chatter-school-connect/group-avatars"
      });
      avatarUrl = uploadResult.url;
    }

    if (wallpaper && wallpaper.startsWith("data:")) {
      const uploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
        base64Data: wallpaper,
        folder: "chatter-school-connect/group-wallpapers"
      });
      wallpaperUrl = uploadResult.url;
    }

    // Create conversation
    const conversationId: Id<"conversations"> = await ctx.db.insert("conversations", {
      name,
      avatar: avatarUrl,
      wallpaper: wallpaperUrl,
      isGroup: true,
      creatorId: userId,
      isPrivate,
      lastMessageTimestamp: Date.now(),
    });

    // Add creator as admin
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      isAdmin: true,
      isMuted: false,
      joinedAt: Date.now(),
    });

    // Add initial members
    for (const memberId of initialMemberIds) {
      if (memberId !== userId) {
        // Convert string ID to Convex ID type
        const memberIdTyped = memberId as unknown as Id<"users">;
        
        await ctx.db.insert("conversationMembers", {
          conversationId,
          userId: memberIdTyped,
          isAdmin: false,
          isMuted: false,
          joinedAt: Date.now(),
        });
      }
    }

    return { conversationId };
  },
});

// Get user conversations
export const getUserConversations = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Get all conversations the user is a member of
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (memberships.length === 0) {
      return [];
    }

    const conversationIds = memberships.map((m) => m.conversationId);
    
    // Get all conversations
    const conversations = await Promise.all(
      conversationIds.map(async (id) => await ctx.db.get(id))
    );

    // Process conversations with additional info
    const processedConversations = await Promise.all(
      conversations.filter(Boolean).map(async (conversation) => {
        // Get all members
        const allMembers = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation!._id))
          .collect();

        // Get user info for each member
        const members = await Promise.all(
          allMembers.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            
            if (!user) return null;
            
            // Get online status
            const presence = await ctx.db
              .query("presence")
              .withIndex("by_user", (q) => q.eq("userId", member.userId))
              .first();
              
            return {
              id: user._id,
              username: user.username,
              avatar: user.profilePicture,
              isAdmin: member.isAdmin,
              status: user.status,
              isOnline: presence?.isOnline || false,
            };
          })
        );

        // Get last message
        let lastMessage = null;
        if (conversation!.lastMessageId) {
          const message = await ctx.db.get(conversation!.lastMessageId);
          if (message) {
            const sender = await ctx.db.get(message.senderId);
            lastMessage = {
              id: message._id,
              content: message.content,
              type: message.type,
              timestamp: message.timestamp,
              senderId: message.senderId,
              senderName: sender?.username || "Unknown",
            };
          }
        }

        // Count unread messages
        let unreadCount = 0;
        const userMembership = allMembers.find(m => m.userId === userId);
        
        if (userMembership) {
          const lastReadMessageId = userMembership.lastReadMessageId;
          
          if (lastReadMessageId) {
            const lastReadMessage = await ctx.db.get(lastReadMessageId);
            
            if (lastReadMessage) {
              // Count messages newer than lastReadMessage
              const newerMessages = await ctx.db
                .query("messages")
                .withIndex("by_conversation_timestamp", (q) => 
                  q.eq("conversationId", conversation!._id)
                   .gt("timestamp", lastReadMessage.timestamp)
                )
                .filter(q => q.neq(q.field("senderId"), userId)) // Don't count own messages
                .collect();
                
              unreadCount = newerMessages.length;
            }
          } else {
            // No last read message, count all messages except user's own
            const allMessages = await ctx.db
              .query("messages")
              .withIndex("by_conversation", (q) => 
                q.eq("conversationId", conversation!._id)
              )
              .filter(q => q.neq(q.field("senderId"), userId))
              .collect();
              
            unreadCount = allMessages.length;
          }
        }

        // Get typing indicators
        const tenSecondsAgo = Date.now() - 10000;
        const typingIndicators = await ctx.db
          .query("typingIndicators")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation!._id))
          .filter((q) => q.gt(q.field("timestamp"), tenSecondsAgo))
          .filter((q) => q.neq(q.field("userId"), userId)) // Exclude current user
          .collect();

        let typing = undefined;
        if (typingIndicators.length > 0) {
          const typingUser = await ctx.db.get(typingIndicators[0].userId);
          typing = typingUser?.username;
        }

        return {
          id: conversation!._id,
          name: conversation!.name,
          avatar: conversation!.avatar,
          wallpaper: conversation!.wallpaper,
          isGroup: conversation!.isGroup,
          members: members.filter(Boolean),
          lastMessage,
          unreadCount,
          typing,
          isPrivate: conversation!.isPrivate,
        };
      })
    );

    // Sort by last message timestamp (newest first)
    return processedConversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });
  },
});

// Get conversation details
export const getConversationDetails = query({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    // Check if conversation exists
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Get all members
    const allMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();

    // Get user info for each member
    const members = await Promise.all(
      allMembers.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null;
        
        // Get online status
        const presence = await ctx.db
          .query("presence")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .first();
          
        return {
          id: user._id,
          username: user.username,
          avatar: user.profilePicture,
          isAdmin: member.isAdmin,
          isMuted: member.isMuted,
          status: user.status,
          isOnline: presence?.isOnline || false,
          joinedAt: member.joinedAt,
        };
      })
    );

    // Get join requests if it's a private group
    const joinRequests: Array<{
      id: Id<"joinRequests">;
      userId: Id<"users">;
      username: string;
      requestedAt: number;
    }> = [];
    
    if (conversation.isGroup && conversation.isPrivate) {
      // Check if user is admin (only admins can see join requests)
      if (membership.isAdmin) {
        const requests = await ctx.db
          .query("joinRequests")
          // Use the correct index structure or filter
          .filter(q => 
            q.eq(q.field("conversationId"), conversationId) && 
            q.eq(q.field("status"), "pending")
          )
          .collect();

        // Populate the join requests with user info
        for (const request of requests) {
          const user = await ctx.db.get(request.userId);
          joinRequests.push({
            id: request._id,
            userId: request.userId,
            username: user?.username || "Unknown",
            requestedAt: request.requestedAt,
          });
        }
      }
    }

    return {
      id: conversation._id,
      name: conversation.name,
      avatar: conversation.avatar,
      wallpaper: conversation.wallpaper,
      isGroup: conversation.isGroup,
      isPrivate: conversation.isPrivate,
      creatorId: conversation.creatorId,
      members: members.filter(Boolean),
      joinRequests,
      userRole: membership.isAdmin ? "admin" : "member",
      isMuted: membership.isMuted,
    };
  },
});

// Update conversation settings (admin only)
export const updateConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()), // Base64 image
    wallpaper: v.optional(v.string()), // Base64 image
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, name, avatar, wallpaper } = args;

    // Check if conversation exists
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // Verify user is an admin
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership || !membership.isAdmin) {
      throw new ConvexError("Only admins can update conversation settings");
    }

    const updates: Record<string, any> = {};

    // Update name if provided
    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new ConvexError("Conversation name cannot be empty");
      }
      updates.name = name;
    }

    // Upload avatar if provided
    if (avatar && avatar.startsWith("data:")) {
      const uploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
        base64Data: avatar,
        folder: "chatter-school-connect/group-avatars"
      });
      updates.avatar = uploadResult.url;
    }

    // Upload wallpaper if provided
    if (wallpaper && wallpaper.startsWith("data:")) {
      const uploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
        base64Data: wallpaper,
        folder: "chatter-school-connect/group-wallpapers"
      });
      updates.wallpaper = uploadResult.url;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(conversationId, updates);
    }

    return { success: true };
  },
});

// Remove member from a group (admin only)
export const removeMember = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, memberId } = args;

    // Convert string ID to Convex ID type
    const memberIdTyped = memberId as unknown as Id<"users">;

    // Check if conversation exists and is a group
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw new ConvexError("Group not found");
    }

    // Verify user is an admin
    const adminMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!adminMembership || !adminMembership.isAdmin) {
      throw new ConvexError("Only admins can remove members");
    }

    // Cannot remove creator (unless you are the creator)
    if (memberId === conversation.creatorId && userId !== conversation.creatorId) {
      throw new ConvexError("Cannot remove the group creator");
    }

    // Find member to remove
    const memberToRemove = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", memberIdTyped)
      )
      .first();

    if (!memberToRemove) {
      throw new ConvexError("Member not found in this group");
    }

    // Remove the member
    await ctx.db.delete(memberToRemove._id);

    return { success: true };
  },
});

// Change member admin status (creator only)
export const toggleAdminStatus = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    memberId: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, memberId, isAdmin } = args;

    // Convert string ID to Convex ID type
    const memberIdTyped = memberId as unknown as Id<"users">;

    // Check if conversation exists and is a group
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw new ConvexError("Group not found");
    }

    // Only the creator can promote/demote admins
    if (conversation.creatorId !== userId) {
      throw new ConvexError("Only the group creator can change admin status");
    }

    // Find target member
    const targetMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", memberIdTyped)
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("Member not found in this group");
    }

    // Update admin status
    await ctx.db.patch(targetMembership._id, {
      isAdmin,
    });

    return { success: true };
  },
});

// Leave a conversation
export const leaveConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    // Check if conversation exists
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // If it's a group and user is the creator, they can't leave unless they transfer ownership
    if (conversation.isGroup && conversation.creatorId === userId) {
      // Check if there are other admins
      const otherAdmins = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .filter((q) => 
          q.and(
            q.neq(q.field("userId"), userId),
            q.eq(q.field("isAdmin"), true)
          )
        )
        .first();

      if (!otherAdmins) {
        throw new ConvexError(
          "As the creator, you must promote another member to admin before leaving"
        );
      }
    }

    // Find membership
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Remove the member
    await ctx.db.delete(membership._id);

    // For one-on-one chats, if one user leaves, delete the conversation
    if (!conversation.isGroup) {
      const otherMember = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .first();

      if (otherMember) {
        await ctx.db.delete(otherMember._id);
      }

      await ctx.db.delete(conversationId);
    }

    return { success: true };
  },
});

// Request to join a private group
export const requestToJoinGroup = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId } = args;

    // Check if conversation exists and is a private group
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !conversation.isGroup || !conversation.isPrivate) {
      throw new ConvexError("Private group not found");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (existingMembership) {
      throw new ConvexError("You are already a member of this group");
    }

    // Check if there's already a pending request
    const existingRequest = await ctx.db
      .query("joinRequests")
      .withIndex("by_conversation_user_status", (q) =>
        q.eq("conversationId", conversationId)
          .eq("userId", userId)
          .eq("status", "pending")
      )
      .first();

    if (existingRequest) {
      throw new ConvexError("You already have a pending request to join this group");
    }

    // Create join request
    await ctx.db.insert("joinRequests", {
      conversationId,
      userId,
      requestedAt: Date.now(),
      status: "pending",
    });

    return { success: true };
  },
});

// Handle join request (approve/reject)
export const handleJoinRequest = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    requestId: v.id("joinRequests"),
    approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { requestId, approve } = args;

    // Get the request
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") {
      throw new ConvexError("Join request not found or already processed");
    }

    // Check if user is an admin of the group
    const adminMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", request.conversationId).eq("userId", userId)
      )
      .first();

    if (!adminMembership || !adminMembership.isAdmin) {
      throw new ConvexError("Only admins can handle join requests");
    }

    if (approve) {
      // Add user to group
      await ctx.db.insert("conversationMembers", {
        conversationId: request.conversationId,
        userId: request.userId,
        isAdmin: false,
        isMuted: false,
        joinedAt: Date.now(),
      });

      // Update request status
      await ctx.db.patch(requestId, {
        status: "approved",
      });
    } else {
      // Reject request
      await ctx.db.patch(requestId, {
        status: "rejected",
      });
    }

    return { success: true };
  },
});

// Toggle conversation mute status
export const toggleMute = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    conversationId: v.id("conversations"),
    isMuted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { conversationId, isMuted } = args;

    // Find membership
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new ConvexError("You are not a member of this conversation");
    }

    // Update mute status
    await ctx.db.patch(membership._id, {
      isMuted,
    });

    return { success: true };
  },
});

// Create or get existing direct conversation
export const createOrGetDirectConversation = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    otherUserId: v.string(),
  },
  handler: async (ctx, args): Promise<DirectConversationResult> => {
    // Get current user
    const { userId, user: currentUser } = await getAuthenticatedUser(ctx, args.sessionToken);

    // Convert string ID to Convex ID type for the other user
    const otherUserId = args.otherUserId as unknown as Id<"users">;
    
    // Get other user to check existence
    const otherUser = await ctx.db.get(otherUserId);
    if (!otherUser) {
      throw new ConvexError("User not found");
    }
    
    // Find all conversations the current user is a member of
    const userMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Get all conversation IDs the user is part of
    const userConversationIds = userMemberships.map((m) => m.conversationId);
    
    // Find all memberships of the other user
    const otherUserMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", otherUserId))
      .collect();
    
    // Get conversation IDs that both users are members of
    const sharedConversationIds = otherUserMemberships
      .map((m) => m.conversationId)
      .filter((id) => userConversationIds.includes(id));
    
    // Check each shared conversation to find a direct chat
    for (const conversationId of sharedConversationIds) {
      const conversation = await ctx.db.get(conversationId);
      if (conversation && !conversation.isGroup) {
        // Return existing conversation
        return {
          conversationId,
          isNew: false,
        };
      }
    }
    
    // If no existing conversation, create a new direct conversation
    // First make sure the user is not blocked
    if (
      currentUser.blockedUsers.includes(args.otherUserId) ||
      otherUser.blockedUsers.includes(userId.toString())
    ) {
      throw new ConvexError("Cannot create conversation with blocked user");
    }
    
    // Create the conversation
    const name = `${currentUser.username} & ${otherUser.username}`;
    const conversationId = await ctx.db.insert("conversations", {
      name,
      isGroup: false,
      creatorId: userId,
      type: "direct",
      isActive: true,
      lastMessageTimestamp: Date.now(),
    });
    
    // Create the conversation members
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      isAdmin: true,
      isMuted: false,
      joinedAt: Date.now(),
      isActive: true,
    });
    
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: otherUserId,
      isAdmin: false,
      isMuted: false,
      joinedAt: Date.now(),
      isActive: true,
    });
    
    return {
      conversationId,
      isNew: true,
    };
  },
}); 