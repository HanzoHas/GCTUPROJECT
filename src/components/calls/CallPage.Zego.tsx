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

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Memoized requestPermissions function
  const requestPermissions = useCallback(async () => {
    if (isRequestingPermissions) return false;
    
    setIsRequestingPermissions(true);
    try {
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop the stream immediately as we just needed to get permissions
      stream.getTracks().forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      
      setPermissionsGranted(true);
      toast({
        title: 'Permissions Granted',
        description: 'Camera and microphone access granted',
        variant: 'default',
      });
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      toast({
        title: 'Permission Required',
        description: 'Please allow camera and microphone access to join the call',
        variant: 'destructive',
      });
      setPermissionsGranted(false);
      return false;
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [callType, isRequestingPermissions, toast]);

  // Check if user is on mobile
  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    // Auto-request permissions on desktop
    if (!mobileCheck && user && roomId) {
      requestPermissions();
    }
  }, [user, roomId]);

  // Initialize call only after permissions are granted
  useEffect(() => {
    if (!user || !roomId) {
      navigate('/');
      return;
    }

    // Only initialize call if permissions are granted
    if (!permissionsGranted) {
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

  // Render permission request UI for mobile
  if (isMobile && !permissionsGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Permission Required</h1>
          <p className="mb-6 text-gray-600">
            To join the {callType} call, please grant camera and microphone permissions.
          </p>
          <button
            onClick={requestPermissions}
            disabled={isRequestingPermissions}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequestingPermissions ? 'Requesting...' : 'Allow Camera & Microphone'}
          </button>
        </div>
      </div>
    );
  }

  // Show permission request screen
  if (!permissionsGranted) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">
            {callType === 'video' ? '📹' : '🎤'}
          </div>
          <h2 className="text-2xl font-semibold">
            {callType === 'video' ? 'Camera' : 'Microphone'} Access Required
          </h2>
          <p className="text-muted-foreground">
            To join this {callType} call, please allow access to your {callType === 'video' ? 'camera and microphone' : 'microphone'}.
          </p>
          <button
            onClick={requestPermissions}
            disabled={isRequestingPermissions}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isRequestingPermissions ? 'Requesting...' : 'Grant Permissions'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="block w-full text-muted-foreground hover:text-foreground mt-4"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

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