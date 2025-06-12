import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { messages as messagesApi, conversations as conversationsApi } from '../lib/convex';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getSessionToken, clearSessionToken } from '../lib/convex';
import { Id } from '../../convex/_generated/dataModel';

export type MessageType = 'text' | 'image' | 'video' | 'audio';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPicture?: string;
  content: string;
  type: MessageType;
  timestamp: number;
  isRead: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
  };
  reactions?: {
    userId: string;
    username: string;
    emoji: string;
  }[];
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  wallpaper?: string;
  isGroup: boolean;
  members: {
    id: string;
    username: string;
    avatar?: string;
    isAdmin?: boolean;
    status: 'Available' | 'Busy' | 'In class' | 'Offline';
    isOnline: boolean;
  }[];
  lastMessage?: {
    id: string;
    content: string;
    type: MessageType;
    timestamp: number;
    senderId: string;
    senderName: string;
  };
  unreadCount: number;
  typing?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  selectedMessage: Message | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, type: MessageType, replyToId?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  setSelectedMessage: (message: Message | null) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  loadMoreMessages: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: {userId: string, username: string}[];
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  currentConversation: null,
  messages: [],
  selectedMessage: null,
  setCurrentConversation: () => {},
  sendMessage: async () => {},
  markAsRead: async () => {},
  setSelectedMessage: () => {},
  deleteMessage: async () => {},
  reactToMessage: async () => {},
  isLoadingMessages: false,
  isLoadingConversations: false,
  loadMoreMessages: async () => {},
  startTyping: () => {},
  stopTyping: () => {},
  typingUsers: [],
  refreshConversations: async () => {},
});

export const useChat = () => useContext(ChatContext);

// Create dummy components to handle conditional queries
const ConversationsProvider = ({ 
  sessionToken, 
  isAuthenticated, 
  children,
  onData
}: { 
  sessionToken: string;
  isAuthenticated: boolean; 
  children: React.ReactNode;
  onData: (data: any[]) => void;
}) => {
  // Always call useQuery unconditionally with "skip" when needed
  const data = useQuery(
    api.conversations.getUserConversations, 
    isAuthenticated && sessionToken ? { sessionToken } : "skip"
  );
  
  // Then use an effect to handle the data
  useEffect(() => {
    if (isAuthenticated && data) {
      // Use type assertions to map server data to our interface
      const mappedData = Array.isArray(data) 
        ? data.map(conv => ({
            id: conv.id,
            name: conv.name || '',
            avatar: conv.avatar,
            wallpaper: '',
            isGroup: conv.isGroup || conv.type === 'group',
            members: conv.otherMember ? [
              {
                id: conv.otherMember.id,
                username: conv.otherMember.username || '',
                avatar: conv.otherMember.profilePicture,
                status: conv.otherMember.status || 'Offline',
                isOnline: false,
                isAdmin: false
              }
            ] : [],
            lastMessage: {
              id: conv.lastMessageId || '',
              content: '',
              type: 'text' as MessageType,
              timestamp: conv.lastMessageTimestamp || Date.now(),
              senderId: '',
              senderName: ''
            },
            unreadCount: 0
          } as Conversation)) 
        : [];
      
      onData(mappedData);
    } else {
      // When not authenticated, pass empty array
      onData([]);
    }
  }, [data, onData, isAuthenticated]);
  
  return <>{children}</>;
};

const TypingIndicatorsProvider = ({
  sessionToken,
  conversationId,
  isAuthenticated,
  children,
  onData
}: {
  sessionToken: string;
  conversationId?: Id<"conversations">;
  isAuthenticated: boolean;
  children: React.ReactNode;
  onData: (data: any[]) => void;
}) => {
  // Default conversationId to a safe value when not provided
  const safeConversationId = useMemo(() => 
    conversationId || "00000000000000000000000000000000" as Id<"conversations">,
    [conversationId]
  );
  
  // Always call useQuery unconditionally with "skip" when needed
  const data = useQuery(
    api.messages.getTypingIndicators, 
    isAuthenticated && sessionToken && conversationId ? 
      { sessionToken, conversationId: safeConversationId } : 
      "skip"
  );
  
  // Process the result in an effect
  useEffect(() => {
    if (isAuthenticated && conversationId && data) {
      onData(Array.isArray(data) ? data : []);
    } else {
      onData([]);
    }
  }, [data, onData, isAuthenticated, conversationId]);
  
  return <>{children}</>;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // Context state
  const { isAuthenticated, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<number | null>(null);
  const [typingTimerRef, setTypingTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [typingUsers, setTypingUsers] = useState<{userId: string, username: string}[]>([]);
  const { toast } = useToast();
  
  // Handle auth errors
  useEffect(() => {
    const handleAuthError = (event: ErrorEvent) => {
      // Check if error is related to auth
      if (event.error?.message?.includes('Unauthorized: Invalid or expired session')) {
        console.log('Auth session expired. Logging out...');
        clearSessionToken();
        logout();
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      }
    };

    // Add global error handler
    window.addEventListener('error', handleAuthError);
    
    return () => {
      window.removeEventListener('error', handleAuthError);
    };
  }, [logout, toast]);
  
  // Get the session token
  const sessionToken = useMemo(() => getSessionToken() || "", []);
  
  // Fetch conversations using useQuery
  const conversationsData = useQuery(
    api.conversations.getUserConversations,
    isAuthenticated && sessionToken ? { sessionToken } : "skip"
  );

  useEffect(() => {
    if (isAuthenticated && conversationsData) {
      // Use type assertions to map server data to our interface
      const mappedConversations = Array.isArray(conversationsData) 
        ? conversationsData.map(conv => ({
            id: conv.id,
            name: conv.name || '',
            avatar: conv.avatar,
            wallpaper: '',
            isGroup: conv.isGroup || conv.type === 'group',
            members: conv.otherMember ? [
              {
                id: conv.otherMember.id,
                username: conv.otherMember.username || '',
                avatar: conv.otherMember.profilePicture,
                status: conv.otherMember.status || 'Offline',
                isOnline: false,
                isAdmin: false
              }
            ] : [],
            lastMessage: {
              id: conv.lastMessageId || '',
              content: '',
              type: 'text' as MessageType,
              timestamp: conv.lastMessageTimestamp || Date.now(),
              senderId: '',
              senderName: ''
            },
            unreadCount: 0
          } as Conversation)) 
        : [];
      
      setConversations(mappedConversations);
    } else {
      setConversations([]);
    }
  }, [isAuthenticated, conversationsData]);
  
  // Stop typing indicator - Define this first to avoid circular dependency
  const stopTyping = useCallback(() => {
    if (!currentConversation || !sessionToken) return;
    
    // Clear existing timer
    if (typingTimerRef) {
      clearTimeout(typingTimerRef);
      setTypingTimerRef(null);
    }
    
    // Send stop typing indicator
    messagesApi.setTypingIndicator(
      currentConversation.id,
      false
    );
  }, [currentConversation, typingTimerRef, sessionToken]);
  
  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!currentConversation || !sessionToken) return;
    
    // Clear any existing timer
    if (typingTimerRef) {
      clearTimeout(typingTimerRef);
    }
    
    // Send typing indicator
    messagesApi.setTypingIndicator(
      currentConversation.id,
      true
    );
    
    // Set timer to auto-clear typing indicator after 5 seconds of inactivity
    const timer = setTimeout(() => {
      stopTyping();
    }, 5000);
    
    setTypingTimerRef(timer);
  }, [currentConversation, typingTimerRef, sessionToken, stopTyping]);
  
  // Poll for typing indicators
  useEffect(() => {
    if (!currentConversation || !isAuthenticated || !sessionToken) return;
    
    const pollTypingIndicators = async () => {
      try {
        const response = await messagesApi.getTypingIndicators(
          currentConversation.id
        );
        setTypingUsers(response);
      } catch (error) {
        console.error('Error polling typing indicators:', error);
      }
    };
    
    // Poll immediately
    pollTypingIndicators();
    
    // Set up polling interval (every 3 seconds)
    const intervalId = setInterval(pollTypingIndicators, 3000);
    
    // Clean up interval on unmount or when conversation changes
    return () => clearInterval(intervalId);
  }, [currentConversation, isAuthenticated, sessionToken]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!currentConversation || !sessionToken) return;
    
    setIsLoadingMessages(true);
    try {
      const conversationId = currentConversation.id;
      const fetchedMessages = await messagesApi.getMessages(
        conversationId,
        50
      );
      
      setMessages(fetchedMessages);
      
      // Set the oldest message timestamp for pagination
      if (fetchedMessages.length > 0) {
        const oldest = [...fetchedMessages].sort((a, b) => a.timestamp - b.timestamp)[0];
        setOldestMessageTimestamp(oldest.timestamp);
      }
      
      // Mark newest message as read if not sent by current user
      if (fetchedMessages.length > 0) {
        const newest = [...fetchedMessages].sort((a, b) => b.timestamp - a.timestamp)[0];
        const auth = await import('../lib/convex').then(m => m.auth);
        const currentUser = await auth.me();
        
        if (currentUser && newest.senderId !== currentUser.id) {
          await messagesApi.markAsRead(newest.id);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentConversation, toast, sessionToken]);
  
  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages();
    } else {
      setMessages([]);
      setOldestMessageTimestamp(null);
    }
  }, [currentConversation, fetchMessages]);

  // Set current conversation
  const handleSetCurrentConversation = useCallback((conversation: Conversation | null) => {
    setCurrentConversation(conversation);
    setSelectedMessage(null);
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content: string, type: MessageType, replyToId?: string) => {
    if (!currentConversation || !sessionToken) {
      toast({
        title: "Error",
        description: "No active conversation selected or not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Stop typing indicator when sending
      stopTyping();
      
      const conversationId = currentConversation.id;
      await messagesApi.sendMessage(
        conversationId,
        content,
        type,
        replyToId
      );
      
      // Refresh messages after sending
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [currentConversation, toast, stopTyping, fetchMessages, sessionToken]);

  // Message handling functions
  const markAsRead = useCallback(async (messageId: string) => {
    if (!sessionToken) return;
    
    try {
      await messagesApi.markAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [sessionToken]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!sessionToken) return;
    
    try {
      await messagesApi.deleteMessage(messageId);
      
      toast({
        title: "Success",
        description: "Message deleted",
      });
      
      // Refresh messages after deleting
      fetchMessages();
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    }
  }, [toast, fetchMessages, sessionToken]);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!sessionToken) return;
    
    try {
      await messagesApi.reactToMessage(messageId, emoji);
      
      // Refresh messages after reaction
      fetchMessages();
    } catch (error: any) {
      console.error('Error reacting to message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to react to message",
        variant: "destructive",
      });
    }
  }, [toast, fetchMessages, sessionToken]);
  
  // Load more messages for pagination
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !oldestMessageTimestamp || isLoadingMessages || !sessionToken) return;
    
    setIsLoadingMessages(true);
    try {
      const conversationId = currentConversation.id;
      const olderMessages = await messagesApi.getMessages(
        conversationId,
        50,
        oldestMessageTimestamp
      );
      
      if (olderMessages.length > 0) {
        // Update oldest timestamp for next pagination
        const oldest = [...olderMessages].sort((a, b) => a.timestamp - b.timestamp)[0];
        setOldestMessageTimestamp(oldest.timestamp);
        
        // Combine with existing messages, avoiding duplicates
        const messageIds = new Set(messages.map(m => m.id));
        const newMessages = olderMessages.filter(m => !messageIds.has(m.id));
        
        setMessages(prev => [...prev, ...newMessages]);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentConversation, oldestMessageTimestamp, isLoadingMessages, messages, sessionToken]);

  // Create a function to refresh conversations
  const refreshConversations = useCallback(async () => {
    if (isAuthenticated && sessionToken) {
      setIsLoadingConversations(true);
      try {
        const rawData = await conversationsApi.getUserConversations();
        
        // Use type assertions to map server data to our interface
        const data = Array.isArray(rawData) 
          ? rawData.map(conv => ({
              id: conv.id,
              name: conv.name || '',
              avatar: conv.avatar,
              wallpaper: '',
              isGroup: conv.isGroup || conv.type === 'group',
              members: conv.otherMember ? [
                {
                  id: conv.otherMember.id,
                  username: conv.otherMember.username || '',
                  avatar: conv.otherMember.profilePicture,
                  status: conv.otherMember.status || 'Offline',
                  isOnline: false,
                  isAdmin: false
                }
              ] : [],
              lastMessage: {
                id: conv.lastMessageId || '',
                content: '',
                type: 'text' as MessageType,
                timestamp: conv.lastMessageTimestamp || Date.now(),
                senderId: '',
                senderName: ''
              },
              unreadCount: 0
            } as Conversation)) 
          : [];
        
        setConversations(data);
        
        // If we have a current conversation, update it with fresh data
        if (currentConversation) {
          const updatedConversation = data.find(c => c.id === currentConversation.id);
          if (updatedConversation) {
            setCurrentConversation(updatedConversation);
          }
        }
      } catch (error) {
        console.error('Error refreshing conversations:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh conversations',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingConversations(false);
      }
    }
  }, [isAuthenticated, sessionToken, currentConversation, toast]);

  // Create the context value
  const contextValue = useMemo(() => ({
    conversations,
    currentConversation,
    messages,
    selectedMessage,
    setCurrentConversation: handleSetCurrentConversation,
    sendMessage,
    markAsRead,
    setSelectedMessage,
    deleteMessage,
    reactToMessage,
    isLoadingMessages,
    isLoadingConversations,
    loadMoreMessages,
    startTyping,
    stopTyping,
    typingUsers,
    refreshConversations,
  }), [
    conversations,
    currentConversation,
    messages,
    selectedMessage,
    handleSetCurrentConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    reactToMessage,
    isLoadingMessages,
    isLoadingConversations,
    loadMoreMessages,
    startTyping,
    stopTyping,
    typingUsers,
    refreshConversations
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
