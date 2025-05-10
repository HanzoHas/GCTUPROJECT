import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { directApi } from '@/lib/apiWrapper';

// Updated channel type to be more Discord-like
export type ChannelType = {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  lecturerId: string;
  createdAt: number;
  lecturer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS";
  position: number;
  isPrivate: boolean;
  allowedStudentGroups?: string[];
  createdByStudent?: boolean; // Flag to mark student-created channels
  members?: string[]; // Array of user IDs who are members of this channel
};

export type SubchannelType = {
  _id: string;
  channelId: string;
  name: string;
  description?: string;
  studentGroups: string[];
  createdAt: number;
  type: "TEXT" | "ANNOUNCEMENT" | "CLASS";
  position: number;
  isPrivate: boolean;
};

export type ChannelAnnouncementType = {
  id: string;
  channelId: string;
  subchannelId?: string;
  title: string;
  content: string;
  type: "text" | "image" | "video" | "audio";
  timestamp: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  pinned?: boolean;
};

// Function to get proper display name for a conversation
const getConversationDisplayName = (conversation: any, currentUserId: string | undefined) => {
  if (conversation.isGroup) {
    return conversation.name;
  }
  
  // For direct conversations, show only the other user's name
  if (!conversation.members || !Array.isArray(conversation.members)) {
    return conversation.name || 'Unnamed Conversation';
  }
  
  const otherMember = conversation.members.find((member: any) => member.id !== currentUserId);
  return otherMember ? otherMember.username : conversation.name || 'Unnamed Conversation';
};

interface ChannelContextType {
  userIsLecturer: boolean;
  lecturerChannels: ChannelType[];
  userChannels: ChannelType[];
  currentChannel: ChannelType | null;
  currentSubchannel: SubchannelType | null;
  subchannels: SubchannelType[];
  channelAnnouncements: ChannelAnnouncementType[];
  channelError: string | null;
  setCurrentChannel: (channel: ChannelType | null) => void;
  setCurrentSubchannel: (subchannel: SubchannelType | null) => void;
  createChannel: (name: string, description?: string, type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS", isPrivate?: boolean, allowedStudentGroups?: string[], members?: string[]) => Promise<string | undefined>;
  updateChannel: (channelId: string, data: { name?: string; description?: string; type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS"; position?: number; isPrivate?: boolean; allowedStudentGroups?: string[]; members?: string[] }) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  createSubchannel: (channelId: string, name: string, description?: string, type?: "TEXT" | "ANNOUNCEMENT" | "CLASS", studentGroups?: string[], isPrivate?: boolean) => Promise<string | undefined>;
  updateSubchannel: (subchannelId: string, data: { name?: string; description?: string; studentGroups?: string[]; type?: "TEXT" | "ANNOUNCEMENT" | "CLASS"; position?: number; isPrivate?: boolean }) => Promise<void>;
  deleteSubchannel: (subchannelId: string) => Promise<void>;
  createChannelAnnouncement: (channelId: string, subchannelId: string | undefined, title: string, content: string, type: "text" | "image" | "video" | "audio", pinned?: boolean) => Promise<string | undefined>;
  deleteChannelAnnouncement: (announcementId: string) => Promise<void>;
  isLoadingChannels: boolean;
  isLoadingSubchannels: boolean;
  isLoadingAnnouncements: boolean;
  refreshChannels: () => Promise<void>;
  refreshSubchannels: () => Promise<void>;
  refreshAnnouncements: () => Promise<void>;
  canCreateChannels: boolean; // Allow both students and lecturers to create channels
  canManageChannel: (channelId: string) => boolean; // Method to check if user can manage a specific channel
  canChatInSubchannel: (subchannelId: string) => boolean; // New method to check if user can chat in a subchannel
  isStudentChannel: (channelId: string) => boolean; // New method to check if a channel was created by a student
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userIsLecturer, setUserIsLecturer] = useState(false);
  const [lecturerChannels, setLecturerChannels] = useState<ChannelType[]>([]);
  const [userChannels, setUserChannels] = useState<ChannelType[]>([]);
  const [currentChannel, setCurrentChannel] = useState<ChannelType | null>(null);
  const [currentSubchannel, setCurrentSubchannel] = useState<SubchannelType | null>(null);
  const [subchannels, setSubchannels] = useState<SubchannelType[]>([]);
  const [channelAnnouncements, setChannelAnnouncements] = useState<ChannelAnnouncementType[]>([]);
  const [channelError, setChannelError] = useState<string | null>(null);
  
  // Loading states
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingSubchannels, setIsLoadingSubchannels] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

  // Get session token from localStorage
  const getSessionToken = () => {
    return localStorage.getItem('sessionToken') || '';
  };

  // Check if user is a lecturer
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const sessionToken = getSessionToken();
        if (!sessionToken) return;
        
        const isLecturer = await directApi.isUserLecturer(sessionToken);
        setUserIsLecturer(isLecturer);
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserIsLecturer(false);
      }
    };
    
    if (user) {
      checkUserRole();
    }
  }, [user]);

  // Permission helpers
  // Both students and lecturers can create channels, but students create personal channels
  const canCreateChannels = true; // Allow all users to create channels
  
  // Check if user can manage (edit/delete) a specific channel
  const canManageChannel = (channelId: string) => {
    const channel = [...lecturerChannels, ...userChannels].find(c => c._id === channelId);
    
    if (!channel) return false;
    
    // Lecturers can manage their own channels
    if (userIsLecturer && lecturerChannels.some(c => c._id === channelId)) {
      return true;
    }
    
    // Students can manage channels they created
    if (channel.createdByStudent && channel.lecturerId === user?.id) {
      return true;
    }
    
    return false;
  };
  
  // Check if user can chat in a subchannel
  const canChatInSubchannel = (subchannelId: string) => {
    // Everyone can chat in subchannels now
    return true;
  };
  
  // Check if a channel was created by a student
  const isStudentChannel = (channelId: string) => {
    const channel = [...lecturerChannels, ...userChannels].find(c => c._id === channelId);
    return !!channel?.createdByStudent;
  };

  // Fetch channels
  const fetchChannels = async () => {
    try {
      setIsLoadingChannels(true);
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setIsLoadingChannels(false);
        setChannelError("Missing authentication token. Please log in again.");
        return;
      }
      
      // Fetch user channels
      const userChannelsData = await directApi.getChannels(sessionToken);
      setUserChannels(Array.isArray(userChannelsData) ? userChannelsData : []);
      
      // Fetch lecturer channels if user is a lecturer
      if (userIsLecturer) {
        const lecturerChannelsData = await directApi.getLecturerChannels(sessionToken);
        setLecturerChannels(Array.isArray(lecturerChannelsData) ? lecturerChannelsData : []);
      }
      
      setChannelError(null);
    } catch (error) {
      console.error("Error fetching channels:", error);
      if (error instanceof Error) {
        setChannelError(`Failed to load channels: ${error.message}`);
      } else {
        setChannelError("Failed to load channels. Please try again later.");
      }
    } finally {
      // Short delay to prevent flickering UI
      setTimeout(() => {
        setIsLoadingChannels(false);
      }, 500);
    }
  };

  // Fetch subchannels for current channel
  const fetchSubchannels = async () => {
    try {
      if (!currentChannel) {
        setSubchannels([]);
        return;
      }
      
      setIsLoadingSubchannels(true);
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setIsLoadingSubchannels(false);
        return;
      }
      
      const subchannelsData = await directApi.getSubchannels(sessionToken, currentChannel._id);
      setSubchannels(Array.isArray(subchannelsData) ? subchannelsData : []);
      setChannelError(null);
    } catch (error) {
      console.error("Error fetching subchannels:", error);
      setChannelError("Failed to load subchannels");
    } finally {
      setIsLoadingSubchannels(false);
    }
  };

  // Fetch announcements for current channel/subchannel
  const fetchAnnouncements = async () => {
    try {
      if (!currentChannel) {
        setChannelAnnouncements([]);
        return;
      }
      
      setIsLoadingAnnouncements(true);
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setIsLoadingAnnouncements(false);
        return;
      }
      
      const announcementsData = await directApi.getAnnouncements(
        sessionToken, 
        currentChannel._id,
        currentSubchannel?._id
      );
      setChannelAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      setChannelError(null);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setChannelError("Failed to load announcements");
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user, userIsLecturer]);

  // Fetch subchannels when current channel changes
  useEffect(() => {
    fetchSubchannels();
  }, [currentChannel]);

  // Fetch announcements when current channel or subchannel changes
  useEffect(() => {
    fetchAnnouncements();
  }, [currentChannel, currentSubchannel]);

  // Mutations with direct API
  const createChannel = async (
    name: string, 
    description?: string, 
    type: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS" = "TEXT", 
    isPrivate = false, 
    allowedStudentGroups?: string[],
    members?: string[]
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    try {
      // If user is a lecturer, create a regular channel
      if (userIsLecturer) {
        const result = await directApi.createChannel(
          sessionToken, 
          name, 
          description,
          type,
          isPrivate,
          allowedStudentGroups,
          false // Not a student channel
        );
        await fetchChannels();
        return result?.channelId;
      } 
      // If user is a student, create a student channel (private by default)
      else {
        const result = await directApi.createChannel(
          sessionToken, 
          name, 
          description,
          "TEXT", // Student channels are always TEXT type
          true, // Always private
          undefined, // No student groups
          true, // Mark as a student channel
          members // Members explicitly added
        );
        await fetchChannels();
        return result?.channelId;
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  };

  const updateChannel = async (
    channelId: string, 
    data: { 
      name?: string; 
      description?: string; 
      type?: "CATEGORY" | "TEXT" | "ANNOUNCEMENT" | "CLASS"; 
      position?: number; 
      isPrivate?: boolean; 
      allowedStudentGroups?: string[];
      members?: string[]
    }
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Check if user can manage this channel
    if (!canManageChannel(channelId)) {
      setChannelError("You don't have permission to modify this channel");
      throw new Error("Permission denied: You don't have permission to modify this channel");
    }
    
    try {
      // Check if this is a student channel, enforce some restrictions
      if (isStudentChannel(channelId)) {
        // Student channels can't change their type from TEXT
        delete data.type;
        // Student channels must remain private
        data.isPrivate = true;
        // Student channels don't use student groups
        delete data.allowedStudentGroups;
      }
      
      await directApi.updateChannel(sessionToken, channelId, data);
      await fetchChannels();
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  };

  const deleteChannel = async (channelId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Check if user can manage this channel
    if (!canManageChannel(channelId)) {
      setChannelError("You don't have permission to delete this channel");
      throw new Error("Permission denied: You don't have permission to delete this channel");
    }
    
    try {
      await directApi.deleteChannel(sessionToken, channelId);
      
      if (currentChannel?._id === channelId) {
        setCurrentChannel(null);
        setCurrentSubchannel(null);
      }
      
      await fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  };

  const createSubchannel = async (
    channelId: string, 
    name: string, 
    description?: string, 
    type: "TEXT" | "ANNOUNCEMENT" | "CLASS" = "TEXT",
    studentGroups?: string[],
    isPrivate = false
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Students can't create subchannels in any channel
    if (!userIsLecturer) {
      // Check if this is a student channel
      if (isStudentChannel(channelId)) {
        setChannelError("Student channels cannot have subchannels");
        throw new Error("Permission denied: Student channels cannot have subchannels");
      }
      
      setChannelError("Only lecturers can add subchannels to a channel");
      throw new Error("Permission denied: Only lecturers can add subchannels to a channel");
    }
    
    // Check if user can manage this channel
    if (!canManageChannel(channelId)) {
      setChannelError("You don't have permission to add subchannels to this channel");
      throw new Error("Permission denied: You don't have permission to add subchannels to this channel");
    }
    
    try {
      const result = await directApi.createSubchannel(
        sessionToken,
        channelId,
        name,
        description,
        studentGroups
      );
      await fetchSubchannels();
      return result?.subchannelId;
    } catch (error) {
      console.error('Error creating subchannel:', error);
      throw error;
    }
  };

  const updateSubchannel = async (
    subchannelId: string, 
    data: { 
      name?: string; 
      description?: string; 
      studentGroups?: string[]; 
      type?: "TEXT" | "ANNOUNCEMENT" | "CLASS"; 
      position?: number; 
      isPrivate?: boolean
    }
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Find the subchannel to get its channelId
    const subchannel = subchannels.find(s => s._id === subchannelId);
    if (!subchannel) {
      throw new Error("Subchannel not found");
    }
    
    // Check if user can manage the parent channel
    if (!canManageChannel(subchannel.channelId)) {
      setChannelError("You don't have permission to modify this subchannel");
      throw new Error("Permission denied: You don't have permission to modify this subchannel");
    }
    
    try {
      await directApi.updateSubchannel(sessionToken, subchannelId, data);
      await fetchSubchannels();
    } catch (error) {
      console.error('Error updating subchannel:', error);
      throw error;
    }
  };

  const deleteSubchannel = async (subchannelId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Find the subchannel to get its channelId
    const subchannel = subchannels.find(s => s._id === subchannelId);
    if (!subchannel) {
      throw new Error("Subchannel not found");
    }
    
    // Check if user can manage the parent channel
    if (!canManageChannel(subchannel.channelId)) {
      setChannelError("You don't have permission to delete this subchannel");
      throw new Error("Permission denied: You don't have permission to delete this subchannel");
    }
    
    try {
      await directApi.deleteSubchannel(sessionToken, subchannelId);
      
      if (currentSubchannel?._id === subchannelId) {
        setCurrentSubchannel(null);
      }
      
      await fetchSubchannels();
    } catch (error) {
      console.error('Error deleting subchannel:', error);
      throw error;
    }
  };

  const createChannelAnnouncement = async (
    channelId: string,
    subchannelId: string | undefined,
    title: string, 
    content: string, 
    type: "text" | "image" | "video" | "audio",
    pinned = false
  ) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Check if user can post in this channel/subchannel
    // For announcements, allow lecturers who own the channel
    const channelToCheck = subchannelId 
      ? subchannels.find(s => s._id === subchannelId)?.channelId
      : channelId;
      
    if (!channelToCheck || !canManageChannel(channelToCheck)) {
      setChannelError("You don't have permission to post in this channel");
      throw new Error("Permission denied: You don't have permission to post in this channel");
    }
    
    try {
      const result = await directApi.createChannelAnnouncement(
        sessionToken,
        channelId,
        subchannelId,
        title,
        content,
        type
      );
      await fetchAnnouncements();
      return result?.announcementId;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  };

  const deleteChannelAnnouncement = async (announcementId: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) return;
    
    // Find the announcement to check permissions
    const announcement = channelAnnouncements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }
    
    // Check if user can delete this announcement
    // Only the lecturer who owns the channel can delete announcements
    if (!canManageChannel(announcement.channelId)) {
      setChannelError("You don't have permission to delete this announcement");
      throw new Error("Permission denied: You don't have permission to delete this announcement");
    }
    
    try {
      await directApi.deleteChannelAnnouncement(sessionToken, announcementId);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  };

  // Public refresh methods
  const refreshChannels = fetchChannels;
  const refreshSubchannels = fetchSubchannels;
  const refreshAnnouncements = fetchAnnouncements;

  return (
    <ChannelContext.Provider
      value={{
        userIsLecturer,
        lecturerChannels,
        userChannels,
        currentChannel,
        currentSubchannel,
        subchannels,
        channelAnnouncements,
        channelError,
        setCurrentChannel,
        setCurrentSubchannel,
        createChannel,
        updateChannel,
        deleteChannel,
        createSubchannel,
        updateSubchannel,
        deleteSubchannel,
        createChannelAnnouncement,
        deleteChannelAnnouncement,
        isLoadingChannels,
        isLoadingSubchannels,
        isLoadingAnnouncements,
        refreshChannels,
        refreshSubchannels,
        refreshAnnouncements,
        canCreateChannels,
        canManageChannel,
        canChatInSubchannel,
        isStudentChannel,
      }}
    >
      {isLoadingChannels && !channelError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent">
              <span className="sr-only">Loading...</span>
            </div>
            <h3 className="text-lg font-semibold">Loading channels...</h3>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      )}

      {channelError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[400px] rounded-lg border border-destructive bg-card p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold text-destructive">Error</h3>
            <p className="mb-4 text-sm text-card-foreground">{channelError}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setChannelError(null);
                  refreshChannels();
                }}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}; 