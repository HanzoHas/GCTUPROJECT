import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useZego } from '@/contexts/ZegoContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Access ZegoUIKitPrebuilt from the global window object
const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    zegoInstance?: any;
  }
}

const CallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const callType = (searchParams.get('type') as 'audio' | 'video') ?? 'video';

  const { user } = useAuth();
  const { endCurrentCall } = useZego();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isMobile, setIsMobile] = useState(false);
  const permissionsGranted = true; // Auto-grant permissions

  // Check if user is on mobile
  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  // Initialize call
  useEffect(() => {
    if (!user || !roomId) {
      navigate('/');
      return;
    }

    let isMounted = true;
    let zp: any = null;

    const initializeCall = async () => {
      try {
        const appID = import.meta.env.VITE_ZEGO_APP_ID;
        const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        if (!appID || !serverSecret) {
          throw new Error('Missing Zego credentials');
        }

        // Create a Zego instance
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          parseInt(appID),
          serverSecret,
          roomId!,
          user.id,
          user.username || 'User'
        );

        // Create instance
        zp = ZegoUIKitPrebuilt.create(kitToken);
        
        if (!isMounted) {
          zp.destroy();
          return;
        }

        // Store instance globally for cleanup
        window.zegoInstance = zp;

        // Join the call room - both users should have equal access
        zp.joinRoom({
          container: document.querySelector('#zego-container'),
          maxUsers: 10, // Allow up to 10 participants
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall, // Use GroupCall for all calls
          },
          showRoomTimer: true,
          showScreenSharingButton: callType === 'video',
          showUserList: true,
          showMemberList: true,
          enableVideo: callType === 'video',
          turnOnCameraWhenJoining: callType === 'video',
          turnOnMicrophoneWhenJoining: true,
          showLeavingView: false, // Don't show leaving confirmation
          onLeaveRoom: () => {
            if (isMounted) {
              endCurrentCall();
              navigate('/');
            }
          },
          onUserJoin: (users: any[]) => {
            console.log('Users joined:', users);
          },
          onUserLeave: (users: any[]) => {
            console.log('Users left:', users);
          },
        });
      } catch (error) {
        console.error('Error initializing call:', error);
        toast({
          title: 'Call Error',
          description: error instanceof Error ? error.message : 'Failed to initialize call',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    initializeCall();

    // Clean up on unmount
    return () => {
      isMounted = false;
      if (zp) {
        try {
          zp.destroy();
          if (window.zegoInstance === zp) {
            delete window.zegoInstance;
          }
        } catch (error) {
          console.error('Error cleaning up Zego instance:', error);
        }
      }
    };
  }, [user, roomId, permissionsGranted, callType, navigate, toast, endCurrentCall]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (window.zegoInstance) {
        window.zegoInstance.destroy();
        delete window.zegoInstance;
      }
      endCurrentCall();
    };
  }, [endCurrentCall]);

  // Permissions are auto-granted, no need for permission screens

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      <div className="bg-primary text-white p-2 text-center font-medium">
        Call Room - {callType === 'video' ? 'Video Call' : 'Audio Call'}
      </div>
      <div id="zego-container" className="flex-1 w-full"></div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <button
          onClick={() => {
            endCurrentCall();
            navigate('/');
          }}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 z-10 shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
            <line x1="23" y1="1" x2="1" y2="23"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CallPage;