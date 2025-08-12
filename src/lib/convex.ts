import { ConvexReactClient } from "convex/react";
import { api as generatedApi } from "../../convex/_generated/api";
import { FunctionReference, SystemTableNames } from "convex/server";
import { Id, TableNames } from "../../convex/_generated/dataModel";

// Create a client for Convex
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Use the generated API for full type safety
export const api = generatedApi;

// Helper function for ID casting
export function castId<T extends TableNames | SystemTableNames>(id: string): Id<T> {
  return id as unknown as Id<T>;
}

// Utility function to get session token from localStorage
export const getSessionToken = (): string | null => {
  return localStorage.getItem("sessionToken");
};

// Utility function to save session token to localStorage
export const saveSessionToken = (token: string): void => {
  localStorage.setItem("sessionToken", token);
};

// Utility function to clear session token from localStorage
export const clearSessionToken = (): void => {
  localStorage.removeItem("sessionToken");
};

// Type definitions for auth responses
export interface AuthResponse {
  token: string;
  userId: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
  profilePictureVersion?: number;
  isOnline: boolean;
  lastSeen: number;
  isAdmin: boolean;
}

// Authentication API functions
export const auth = {
  register: async (username: string, email: string, password: string, confirmPassword: string) => {
    return convex.mutation(api.auth.register, {
      username,
      email,
      password,
      confirmPassword,
    });
  },

  login: async (email: string, password: string) => {
    return convex.mutation(api.auth.login, {
      email,
      password,
    });
  },

  logout: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    const result = await convex.mutation(api.auth.logout, {
      sessionToken,
    });
    clearSessionToken();
    return result;
  },

  me: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.auth.me, {
      sessionToken,
    });
  },

  isAuthenticated: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return false;

    return convex.query(api.auth.isAuthenticated, {
      sessionToken,
    });
  },

  // Add new verification code functions
  sendVerificationCode: async (
    email: string,
    username: string,
    password?: string,
    confirmPassword?: string
  ) => {
    const result = await convex.mutation(api.auth.sendVerificationCode, {
      email,
      username,
      ...(password ? { password } : {}),
      ...(confirmPassword ? { confirmPassword } : {}),
    });
    
    if (result && result.success && result.code) {
      // Now call the email sending action directly
      await convex.action(api.utils.emailVerification.sendVerificationEmail, {
        email,
        code: result.code,
        username,
      });
    }
    
    return result;
  },

  verifyEmailCode: async (
    email: string,
    code: string,
    username?: string,
    password?: string
  ) => {
    return convex.mutation(api.auth.verifyEmailCode, {
      email,
      code,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    });
  },
};

// User profile API functions
export const users = {
  getProfile: async (userId?: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.users.getProfile, {
      sessionToken,
      userId: userId as unknown as Id<"users">,
    });
  },

  setAsLecturer: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.users.setCurrentUserAsLecturer, {
      sessionToken,
    });
  },

  updateProfile: async (updates: {
    username?: string;
    profilePicture?: string;
    status?: "Available" | "Busy" | "In class" | "Offline";
    notificationSettings?: {
      enabled: boolean;
      newMessages: boolean;
      mentions: boolean;
      groupInvites: boolean;
      announcements: boolean;
    }
  }) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.users.updateProfile, {
      sessionToken,
      ...updates,
    });
  },

  blockUser: async (targetUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.users.blockUser, {
      sessionToken,
      targetUserId: targetUserId as unknown as Id<"users">,
    });
  },

  unblockUser: async (targetUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.users.unblockUser, {
      sessionToken,
      targetUserId: targetUserId as unknown as Id<"users">,
    });
  },

  toggleVisibility: async (isHidden: boolean) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.users.toggleVisibility, {
      sessionToken,
      isHidden,
    });
  },

  searchUsers: async (query: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.users.searchUsers, {
      sessionToken,
      query,
    });
  },
};

// Messages API functions
export const messages = {
  sendMessage: async (
    conversationId: string,
    content: string,
    type: "text" | "image" | "video" | "audio",
    replyToId?: string
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.messages.sendMessage, {
      sessionToken,
      conversationId: conversationId as unknown as Id<"conversations">,
      content,
      type,
      replyToId: replyToId as unknown as Id<"messages">,
    });
  },

  editMessage: async (messageId: string, content: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.editMessage, {
      sessionToken,
      messageId: messageId as unknown as Id<"messages">,
      content,
    });
  },

  deleteMessage: async (messageId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.deleteMessage, {
      sessionToken,
      messageId: messageId as unknown as Id<"messages">,
    });
  },

  markAsRead: async (messageId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.markAsRead, {
      sessionToken,
      messageId: messageId as unknown as Id<"messages">,
    });
  },

  getMessages: async (
    conversationId: string,
    limit: number = 50,
    before?: number
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.messages.getMessages, {
      sessionToken,
      conversationId: conversationId as unknown as Id<"conversations">,
      limit,
      before,
    });
  },

  reactToMessage: async (messageId: string, emoji: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.reactToMessage, {
      sessionToken,
      messageId: messageId as unknown as Id<"messages">,
      emoji,
    });
  },

  setTypingIndicator: async (conversationId: string, isTyping: boolean) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    if (isTyping) {
      return convex.mutation(api.messages.setTypingIndicator, {
        sessionToken,
        conversationId: conversationId as unknown as Id<"conversations">,
      });
    } else {
      return convex.mutation(api.messages.clearTypingIndicator, {
        sessionToken,
        conversationId: conversationId as unknown as Id<"conversations">,
      });
    }
  },

  getTypingIndicators: async (conversationId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.messages.getTypingIndicators, {
      sessionToken,
      conversationId: conversationId as unknown as Id<"conversations">,
    });
  },
};

// Conversations API functions
export const conversations = {
  createOneOnOne: async (otherUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.conversations.createDirectConversation, {
      sessionToken,
      otherUserId: otherUserId as unknown as Id<"users">,
    });
  },
  
  // Alias for createOneOnOne to match function name used in components
  createOrGetDirectConversation: async (otherUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.conversations.createDirectConversation, {
      sessionToken,
      otherUserId: otherUserId as unknown as Id<"users">,
    });
  },
  
  getUserConversations: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.conversations.getUserConversations, {
      sessionToken,
    });
  },

  getConversation: async (params: { conversationId: string }) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.conversations.getConversation, {
      sessionToken,
      conversationId: params.conversationId as unknown as Id<"conversations">,
    });
  },
};

// Announcements API functions
export const announcements = {
  createAnnouncement: async (
    title: string,
    content: string,
    type: "text" | "image" | "video" | "audio"
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.announcements.createAnnouncement, {
      sessionToken,
      title,
      content,
      type,
    });
  },

  getAnnouncements: async (limit?: number, before?: number) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.announcements.getAnnouncements, {
      sessionToken,
      limit,
      before,
    });
  },

  getAnnouncementById: async (announcementId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.announcements.getAnnouncementById, {
      sessionToken,
      announcementId: announcementId as unknown as Id<"announcements">,
    });
  },

  deleteAnnouncement: async (announcementId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.announcements.deleteAnnouncement, {
      sessionToken,
      announcementId: announcementId as unknown as Id<"announcements">,
    });
  },

  updateAnnouncement: async (
    announcementId: string,
    updates: {
      title?: string;
      content?: string;
      type?: "text" | "image" | "video" | "audio";
    }
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.announcements.updateAnnouncement, {
      sessionToken,
      announcementId: announcementId as unknown as Id<"announcements">,
      ...updates,
    });
  },
};

// Notifications API functions
export const notifications = {
  getNotifications: async (limit?: number, onlyUnread?: boolean) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.notifications.getNotifications, {
      sessionToken,
      limit,
      onlyUnread,
    });
  },

  markAsRead: async (notificationId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.notifications.markNotificationAsRead, {
      sessionToken,
      notificationId: notificationId as unknown as Id<"notifications">,
    });
  },

  markAllAsRead: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.notifications.markAllNotificationsAsRead, {
      sessionToken,
    });
  },

  getUnreadCount: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return 0;

    return convex.query(api.notifications.getUnreadCount, {
      sessionToken,
    });
  },

  // Add function to send call notifications
  sendCallNotification: async (params: {
    targetUserId: string;
    callType: 'audio' | 'video';
    roomId: string;
    callerName?: string;
  }) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.notifications.sendCallNotification, {
      sessionToken,
      ...params,
      targetUserId: params.targetUserId as unknown as Id<"users">
    });
  }
};

// User activity API functions
export const activities = {
  getUserActivities: async (limit?: number) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.activities.getUserActivities, {
      sessionToken,
      limit,
    });
  },
};

// Settings API
export const settings = {
  get: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.settings.getSettings, {});
  },
  
  update: async (settings: any) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.settings.updateSettings, {
      settings,
    });
  },
};

// Trending API functions
export const trending = {
  getPosts: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.trending.getPosts, {
      sessionToken,
    });
  },

  uploadImage: async (imageData: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.trending.uploadImage, {
      sessionToken,
      imageData,
    });
  },

  createPost: async (title: string, content: string, tags: string[], image?: string | null) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.trending.createPost, {
      sessionToken,
      title,
      content,
      tags,
      image,
    });
  },

  deletePost: async (postId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.trending.deletePost, {
      sessionToken,
      postId: postId as unknown as Id<"posts">,
    });
  },

  createComment: async (postId: string, content: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.trending.createComment, {
      sessionToken,
      postId: postId as unknown as Id<"posts">,
      content,
    });
  },

  upvotePost: async (postId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.trending.upvotePost, {
      sessionToken,
      postId: postId as unknown as Id<"posts">,
    });
  },

  upvoteComment: async (commentId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.trending.upvoteComment, {
      sessionToken,
      commentId: commentId as unknown as Id<"comments">,
    });
  },
};
