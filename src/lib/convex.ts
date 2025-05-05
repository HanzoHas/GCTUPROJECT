import { api } from "../../convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import { useQuery, useMutation } from 'convex/react';

// Create the Convex client
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

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
};

// User profile API functions
export const users = {
  getProfile: async (userId?: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.users.getProfile, {
      sessionToken,
      userId,
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
      targetUserId,
    });
  },

  unblockUser: async (targetUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.users.unblockUser, {
      sessionToken,
      targetUserId,
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

  get: (id: string) => useQuery(api.users.get, { id }),
  search: (query: string) => useMutation(api.users.search, { query }),
  update: (updates: any) => useMutation(api.users.update, updates),
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
      conversationId,
      content,
      type,
      replyToId,
    });
  },

  editMessage: async (messageId: string, content: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.editMessage, {
      sessionToken,
      messageId,
      content,
    });
  },

  deleteMessage: async (messageId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.deleteMessage, {
      sessionToken,
      messageId,
    });
  },

  markAsRead: async (messageId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.markAsRead, {
      sessionToken,
      messageId,
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
      conversationId,
      limit,
      before,
    });
  },

  reactToMessage: async (messageId: string, emoji: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.messages.reactToMessage, {
      sessionToken,
      messageId,
      emoji,
    });
  },

  setTypingIndicator: async (conversationId: string, isTyping: boolean) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    if (isTyping) {
      return convex.mutation(api.messages.setTypingIndicator, {
        sessionToken,
        conversationId,
      });
    } else {
      return convex.mutation(api.messages.clearTypingIndicator, {
        sessionToken,
        conversationId,
      });
    }
  },

  getTypingIndicators: async (conversationId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.messages.getTypingIndicators, {
      sessionToken,
      conversationId,
    });
  },

  list: (conversationId: string) => useQuery(api.messages.list, { conversationId }),
  send: (conversationId: string, content: string) => 
    useMutation(api.messages.send, { conversationId, content }),
  update: (id: string, updates: any) => useMutation(api.messages.update, { id, updates }),
  delete: (id: string) => useMutation(api.messages.delete, { id }),
};

// Conversations API functions
export const conversations = {
  createOneOnOne: async (otherUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.conversations.createOneOnOneConversation, {
      sessionToken,
      otherUserId,
    });
  },

  createOrGetDirectConversation: async (otherUserId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.conversations.createOrGetDirectConversation, {
      sessionToken,
      otherUserId,
    });
  },

  createGroup: async (
    name: string,
    isPrivate: boolean,
    initialMemberIds: string[],
    avatar?: string,
    wallpaper?: string
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.mutation(api.conversations.createGroupConversation, {
      sessionToken,
      name,
      isPrivate,
      initialMemberIds,
      avatar,
      wallpaper,
    });
  },

  getUserConversations: async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return [];

    return convex.query(api.conversations.getUserConversations, {
      sessionToken,
    });
  },

  getConversationDetails: async (conversationId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return null;

    return convex.query(api.conversations.getConversationDetails, {
      sessionToken,
      conversationId,
    });
  },

  updateConversation: async (
    conversationId: string,
    updates: {
      name?: string;
      avatar?: string;
      wallpaper?: string;
    }
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.updateConversation, {
      sessionToken,
      conversationId,
      ...updates,
    });
  },

  removeMember: async (conversationId: string, memberId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.removeMember, {
      sessionToken,
      conversationId,
      memberId,
    });
  },

  toggleAdminStatus: async (
    conversationId: string,
    memberId: string,
    isAdmin: boolean
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.toggleAdminStatus, {
      sessionToken,
      conversationId,
      memberId,
      isAdmin,
    });
  },

  leaveConversation: async (conversationId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.leaveConversation, {
      sessionToken,
      conversationId,
    });
  },

  requestToJoinGroup: async (conversationId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.requestToJoinGroup, {
      sessionToken,
      conversationId,
    });
  },

  handleJoinRequest: async (requestId: string, approve: boolean) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.handleJoinRequest, {
      sessionToken,
      requestId,
      approve,
    });
  },

  toggleMute: async (conversationId: string, isMuted: boolean) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.conversations.toggleMute, {
      sessionToken,
      conversationId,
      isMuted,
    });
  },

  list: () => useQuery(api.conversations.list),
  get: (id: string) => useQuery(api.conversations.get, { id }),
  create: () => useMutation(api.conversations.create),
  createGroup: (name: string, isPrivate: boolean, members: string[], avatar?: string) => 
    useMutation(api.conversations.createGroup, { name, isPrivate, members, avatar }),
  update: (id: string, updates: any) => useMutation(api.conversations.update, { id, updates }),
  delete: (id: string) => useMutation(api.conversations.delete, { id }),
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
      announcementId,
    });
  },

  deleteAnnouncement: async (announcementId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return { success: false };

    return convex.mutation(api.announcements.deleteAnnouncement, {
      sessionToken,
      announcementId,
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
      announcementId,
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
      notificationId,
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
  get: () => useQuery(api.settings.get),
  update: (settings: any) => useMutation(api.settings.update, { settings }),
}; 