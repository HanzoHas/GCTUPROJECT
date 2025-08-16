import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Access ZegoUIKitPrebuilt from the global window object
const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { notifications, api } from '@/lib/convex';

// Define types
type CallVariant = 'audio' | 'video';

interface ZegoContextType {
  initCall: (recipientId: string, recipientName: string, variant: CallVariant, conversationId?: string) => void;
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
    navigate(`/call/${roomId}?type=${callType}`);
  };

  const initCall = async (recipientId: string, recipientName: string, variant: CallVariant, conversationId?: string) => {
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
      // Check if this is a group call (roomId format: channel_xxx_xxx)
      const isGroupCall = recipientId.startsWith('channel_');
      
      if (isGroupCall) {
        // For group calls, use the roomId directly and create the call room
        const roomId = recipientId;
        createCallRoom(roomId, variant);
        
        toast({
          title: 'Group Call Started',
          description: `${variant} call started in ${recipientName}`,
          variant: 'default',
        });
      } else {
        // For 1-on-1 calls, send notification to recipient
        const roomId = conversationId || `call_${[user.id, recipientId].sort().join('_')}`;
        
        try {
          await notifications.sendCallNotification({
            targetUserId: recipientId,
            callType: variant,
            roomId,
            callerName: user.username,
          });
          
          // Create the call room
          createCallRoom(roomId, variant);
          
          toast({
            title: 'Call Started',
            description: `${recipientName} has been notified of your ${variant} call`,
            variant: 'default',
          });
          
        } catch (error) {
          console.error('Failed to send call notification:', error);
          toast({
            title: 'Call Failed',
            description: 'Could not connect call to recipient',
            variant: 'destructive',
          });
        }
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
    
    // Navigate to call page - both users join the same room
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