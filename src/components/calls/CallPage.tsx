import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useZego } from '@/contexts/ZegoContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';

const CallPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const callType = searchParams.get('type') as 'audio' | 'video' || 'video';
  
  const { user } = useAuth();
  const { endCurrentCall } = useZego();
  const navigate = useNavigate();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const zegoRef = useRef<any>(null);
  
  // Get app ID and server secret from environment variables
  const appID = import.meta.env.VITE_ZEGO_APP_ID ? parseInt(import.meta.env.VITE_ZEGO_APP_ID) : 0;
  const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || '';
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    if (!roomId) {
      // Silently navigate back without logging in production
      if (process.env.NODE_ENV === 'development') {
        console.error('No room ID provided');
      }
      navigate('/');
      return;
    }
    
    if (!appID || !serverSecret) {
      // Silently navigate back without logging in production
      if (process.env.NODE_ENV === 'development') {
        console.error('ZEGO credentials not set up properly');
      }
      navigate('/');
      return;
    }
    
    const initCall = async () => {
      if (!containerRef.current) return;
      
      try {
        // Generate a token for the user
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          user.id,
          user.username || 'User'
        );
        
        // Create the instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoRef.current = zp;
        
        // Initialize and join the room
        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: 'Copy link',
              url: `${window.location.origin}/call/${roomId}?type=${callType}`,
            },
          ],
          scenario: {
            mode: callType === 'video' 
              ? ZegoUIKitPrebuilt.VideoConference 
              : ZegoUIKitPrebuilt.OneONoneCall,
          },
          showScreenSharingButton: callType === 'video',
          showPreJoinView: false,
          turnOnCameraWhenJoining: callType === 'video',
          showMyCameraToggleButton: callType === 'video',
          showUserList: true,
          maxUsers: 2,
          layout: callType === 'video' 
            ? 'Grid' 
            : 'Auto',
          showLeavingView: false,
          onLeaveRoom: () => {
            navigate(-1);
          },
        });
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to join call:', error);
        }
        navigate('/');
      }
    };
    
    initCall();
    
    return () => {
      if (zegoRef.current) {
        zegoRef.current.destroy();
      }
    };
  }, [roomId, user, appID, serverSecret, navigate, callType]);
  
  const handleEndCall = () => {
    endCurrentCall();
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 flex justify-between items-center border-b">
        <div className="text-xl font-semibold">
          {callType === 'video' ? 'Video Call' : 'Audio Call'}
        </div>
        <Button 
          variant="destructive" 
          size="icon" 
          onClick={handleEndCall}
          className="rounded-full h-10 w-10"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 relative" ref={containerRef}></div>
    </div>
  );
};

export default CallPage; 