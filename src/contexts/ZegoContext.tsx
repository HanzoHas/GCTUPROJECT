import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Room } from 'livekit-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { notifications, conversations } from '@/lib/convex';

// Define types
type CallVariant = 'audio' | 'video';

interface ZegoContextType {
  initCall: (recipientId: string, recipientName: string, variant: CallVariant) => void;
  joinCall: (roomId: string, callType: CallVariant) => void;
  endCurrentCall: () => void;
  isInCall: boolean;
  currentCallId: string | null;
}

// Create context
const ZegoContext = createContext<ZegoContextType | undefined>(undefined);

// Provider component
export const ZegoProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [zegoInstance, setZegoInstance] = useState<any>(null);

  // Get app ID and server secret from environment variables
  const appID = import.meta.env.VITE_ZEGO_APP_ID ? parseInt(import.meta.env.VITE_ZEGO_APP_ID) : 0;
  const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || '';
  
  // Log environment variables in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("ZEGO config:", { 
        hasAppId: !!appID, 
        hasServerSecret: !!serverSecret,
        appIdType: typeof import.meta.env.VITE_ZEGO_APP_ID
      });
    }
  }, [appID, serverSecret]);

  const generateToken = (roomId: string, userId: string, userName: string) => {
    if (!appID || !serverSecret) {
      // Silently fail - will be caught by calling functions
      return null;
    }

    return ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userId,
      userName
    );
  };

  const initCall = async (recipientId: string, recipientName: string, variant: CallVariant) => {
    // Only log errors, not regular flow
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to make calls',
        variant: 'destructive',
      });
      return;
    }

    if (!recipientId || recipientId.trim() === '') {
      toast({
        title: 'Error',
        description: 'Invalid recipient',
        variant: 'destructive',
      });
      return;
    }
    
    if (!appID || !serverSecret) {
      console.error("Missing ZEGO credentials");
      toast({
        title: 'Configuration Error',
        description: 'Video call service not properly configured',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First check if the recipientId is a conversation ID by checking its length
      // Most conversation IDs are longer than typical user IDs
      let actualUserId = recipientId;
      
      if (recipientId.length > 24) {
        // Try to fetch the conversation to get member info without logging
        const conversationData = await conversations.getConversation({ 
          sessionToken: localStorage.getItem('sessionToken') || '',
          conversationId: recipientId 
        });
        
        if (conversationData && Array.isArray(conversationData.members)) {
          // Get the other user's ID (not the current user)
          const otherMember = conversationData.members.find(member => member.id !== user.id);
          if (otherMember) {
            actualUserId = otherMember.id;
          } else {
            throw new Error("Could not find recipient user in conversation members");
          }
        } else {
          toast({
            title: 'Call Failed',
            description: 'Could not determine call recipient from conversation',
            variant: 'destructive',
          });
          return;
        }
      }

      // Generate a unique room ID based on user IDs (sorted to ensure same ID regardless of who initiates)
      const participants = [user.id, actualUserId].sort();
      const roomId = `call_${participants.join('_')}_${Date.now()}`;
      
      // Send notification to recipient
      try {
        await notifications.sendCallNotification({
          targetUserId: actualUserId,
          callType: variant,
          roomId,
          callerName: user.username,
        });
        
        // Join the call
        joinCall(roomId, variant);
        
      } catch (error) {
        console.error('Failed to send call notification:', error);
        toast({
          title: 'Call Failed',
          description: 'Could not connect call to recipient',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: 'Call Error',
        description: 'There was a problem setting up the call',
        variant: 'destructive',
      });
    }
  };

  const joinCall = (roomId: string, callType: CallVariant) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to join calls',
        variant: 'destructive',
      });
      return;
    }

    if (!appID || !serverSecret) {
      toast({
        title: 'Configuration Error',
        description: 'Video call service not properly configured',
        variant: 'destructive',
      });
      return;
    }

    // Clean up any existing call
    if (isInCall) {
      endCurrentCall();
    }

    // Set call state
    setIsInCall(true);
    setCurrentCallId(roomId);
    
    // Navigate to call page
    navigate(`/call/${roomId}?type=${callType}`);
  };

  const endCurrentCall = () => {
    if (zegoInstance) {
      zegoInstance.destroy();
      setZegoInstance(null);
    }
    
    setIsInCall(false);
    setCurrentCallId(null);
    
    // Go back to previous page
    navigate(-1);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (zegoInstance) {
        zegoInstance.destroy();
      }
    };
  }, [zegoInstance]);

  const value = {
    initCall,
    joinCall,
    endCurrentCall,
    isInCall,
    currentCallId,
  };

  return <ZegoContext.Provider value={value}>{children}</ZegoContext.Provider>;
};

// Custom hook to use the context
export const useZego = (): ZegoContextType => {
  const context = useContext(ZegoContext);
  if (context === undefined) {
    throw new Error('useZego must be used within a ZegoProvider');
  }
  return context;
}; 