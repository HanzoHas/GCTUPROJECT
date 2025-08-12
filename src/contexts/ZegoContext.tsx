import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { notifications, conversations, api } from '@/lib/convex';
import { useMutation } from 'convex/react';

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

  const sendMessage = useMutation(api.messages.sendMessage);

  // Function to create a call room (caller's perspective)
  const createCallRoom = (roomId: string, callType: CallVariant) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create calls',
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
    navigate(`/call/${roomId}?type=${callType}&mode=create`);
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
      // The recipientId is always a user ID in this context
      let actualUserId = recipientId;

      // Generate a unique room ID based on user IDs (sorted to ensure same ID regardless of who initiates)
      const participants = [user.id, actualUserId].sort();
      const roomId = `call_${participants.join('_')}_${Date.now()}`;
      
      // Get or create a direct conversation with the recipient
      let conversation;
      try {
        conversation = await conversations.createOrGetDirectConversation(actualUserId);
      } catch (error) {
        console.error('Failed to get or create conversation:', error);
        toast({
          title: 'Call Setup Failed',
          description: 'Could not create conversation with recipient',
          variant: 'destructive',
        });
        return;
      }
      
      // Send a message with the call link
      if (conversation && conversation.conversationId) {
        const callType = variant === 'video' ? 'Video' : 'Audio';
        const callLink = `/call/${roomId}?type=${variant}`;
        const messageContent = `${user.username} is inviting you to join a ${callType.toLowerCase()} call. [Join Call](${callLink})`;
        
        try {
          await sendMessage({
            sessionToken: localStorage.getItem('sessionToken') || '',
            conversationId: conversation.conversationId,
            content: messageContent,
            type: 'text'
          });
        } catch (error) {
          console.error('Failed to send call message:', error);
          // Continue with the call even if message fails
        }
      }
      
      // Send notification to recipient
      try {
        await notifications.sendCallNotification({
          targetUserId: actualUserId,
          callType: variant,
          roomId,
          callerName: user.username,
        });
        
        // Create the call room
        createCallRoom(roomId, variant);
        
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
    
    // Navigate to call page with mode=join to indicate this user is joining an existing call
    navigate(`/call/${roomId}?type=${callType}&mode=join`);
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