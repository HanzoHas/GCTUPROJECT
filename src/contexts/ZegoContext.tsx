import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useAuth } from './AuthContext';

type ZegoContextType = {
  startCall: (targetId: string, isVideoCall: boolean) => void;
  joinGroupCall: (roomId: string, roomName: string) => void;
  endCall: () => void;
  isInCall: boolean;
};

const ZegoContext = createContext<ZegoContextType | undefined>(undefined);

export const useZego = () => {
  const context = useContext(ZegoContext);
  if (!context) {
    throw new Error('useZego must be used within a ZegoProvider');
  }
  return context;
};

type ZegoProviderProps = {
  children: ReactNode;
};

export const ZegoProvider = ({ children }: ZegoProviderProps) => {
  const { user } = useAuth();
  const [isInCall, setIsInCall] = useState(false);
  const [zegoInstance, setZegoInstance] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    // Load the ZegoUIKitPrebuilt instance
    const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || '0');
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || '';
    
    if (appID === 0 || !serverSecret) {
      console.error('ZEGO credentials not found in environment variables');
      return;
    }
    
    // We'll initialize the instance when needed
  }, [user]);

  const generateKitToken = () => {
    if (!user) return null;
    
    const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || '0');
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || '';
    
    if (appID === 0 || !serverSecret) {
      console.error('ZEGO credentials not found in environment variables');
      return null;
    }
    
    return ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      `room-${Date.now()}`,
      user.id || Date.now().toString(),
      user.displayName || 'User'
    );
  };

  const startCall = (targetId: string, isVideoCall: boolean) => {
    if (!user) return;
    
    const roomId = [user.id, targetId].sort().join('_');
    const token = generateKitToken();
    
    if (!token) return;
    
    const zp = ZegoUIKitPrebuilt.create(token);
    setZegoInstance(zp);
    
    zp.joinRoom({
      container: document.querySelector('#zego-container') as HTMLElement,
      scenario: {
        mode: isVideoCall 
          ? ZegoUIKitPrebuilt.OneONoneCall 
          : ZegoUIKitPrebuilt.OneONoneCall,
        config: {
          audioOnly: !isVideoCall,
        },
      },
      showPreJoinView: false,
      onLeaveRoom: () => {
        setIsInCall(false);
        setZegoInstance(null);
      },
    });
    
    setIsInCall(true);
  };

  const joinGroupCall = (roomId: string, roomName: string) => {
    if (!user) return;
    
    const token = generateKitToken();
    
    if (!token) return;
    
    const zp = ZegoUIKitPrebuilt.create(token);
    setZegoInstance(zp);
    
    zp.joinRoom({
      container: document.querySelector('#zego-container') as HTMLElement,
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
      showPreJoinView: false,
      sharedLinks: [
        {
          name: roomName,
          url: window.location.origin + `/group-call/${roomId}`,
        },
      ],
      onLeaveRoom: () => {
        setIsInCall(false);
        setZegoInstance(null);
      },
    });
    
    setIsInCall(true);
  };

  const endCall = () => {
    if (zegoInstance) {
      zegoInstance.destroy();
      setZegoInstance(null);
      setIsInCall(false);
    }
  };

  return (
    <ZegoContext.Provider
      value={{
        startCall,
        joinGroupCall,
        endCall,
        isInCall,
      }}
    >
      {children}
      <div id="zego-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" style={{ display: isInCall ? 'flex' : 'none' }}></div>
    </ZegoContext.Provider>
  );
}; 