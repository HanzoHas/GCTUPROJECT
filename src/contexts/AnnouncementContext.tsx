import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { announcements as announcementsApi } from '../lib/convex';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getSessionToken } from '../lib/convex';

export type AnnouncementType = 'text' | 'image' | 'video' | 'audio';

export interface Announcement {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  title: string;
  content: string;
  type: AnnouncementType;
  timestamp: number;
}

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (title: string, content: string, type: AnnouncementType) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  isLoading: boolean;
  loadMoreAnnouncements: () => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType>({
  announcements: [],
  addAnnouncement: async () => {},
  deleteAnnouncement: async () => {},
  isLoading: false,
  loadMoreAnnouncements: async () => {},
});

export const useAnnouncements = () => useContext(AnnouncementContext);

export const AnnouncementProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Use Convex live query to get announcements
  const sessionToken = getSessionToken();
  
  // Fix: Make sure we have a proper check before calling useQuery
  const queryArgs = isAuthenticated && sessionToken ? { 
    sessionToken 
  } : undefined;
  
  const liveAnnouncements = useQuery(
    api.announcements.getAnnouncements, 
    queryArgs
  ) || [];
  
  // Load more announcements (pagination)
  const loadMoreAnnouncements = async () => {
    if (!oldestTimestamp || isLoading) return;
    
    setIsLoading(true);
    try {
      const olderAnnouncements = await announcementsApi.getAnnouncements(
        20, // limit
        oldestTimestamp
      );
      
      if (olderAnnouncements.length > 0) {
        // Set oldest timestamp for next pagination
        const oldest = [...olderAnnouncements].sort((a, b) => a.timestamp - b.timestamp)[0];
        setOldestTimestamp(oldest.timestamp);
      }
    } catch (error) {
      console.error('Error loading more announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load more announcements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set oldest timestamp when announcements change
  useEffect(() => {
    if (liveAnnouncements && liveAnnouncements.length > 0) {
      const oldest = [...liveAnnouncements].sort((a, b) => a.timestamp - b.timestamp)[0];
      setOldestTimestamp(oldest.timestamp);
    }
  }, [liveAnnouncements]);

  const addAnnouncement = async (title: string, content: string, type: AnnouncementType) => {
    if (!user || !user.isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can create announcements",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await announcementsApi.createAnnouncement(title, content, type);
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!user || !user.isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete announcements",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await announcementsApi.deleteAnnouncement(id);
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete announcement",
        variant: "destructive",
      });
    }
  };

  return (
    <AnnouncementContext.Provider
      value={{
        announcements: liveAnnouncements,
        addAnnouncement,
        deleteAnnouncement,
        isLoading,
        loadMoreAnnouncements,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
};
