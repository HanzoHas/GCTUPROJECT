import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useZego } from '@/contexts/ZegoContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Access ZegoUIKitPrebuilt from the global window object
const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

const CallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const callType = (searchParams.get('type') as 'audio' | 'video') ?? 'video';
  const mode = searchParams.get('mode') || 'join'; // 'create' or 'join'

  const { user } = useAuth();
  const { endCurrentCall } = useZego();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

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

  // Initialize call after permissions are granted
  useEffect(() => {
    if (!user || !roomId) {
      navigate('/');
      return;
    }

    let isMounted = true;
    let zp: any = null;

    const initializeCall = async () => {
      try {
        // Ensure we have permissions
        const hasPermissions = permissionsGranted || await requestPermissions();
        if (!hasPermissions) {
          console.error('Required permissions not granted');
          toast({
            title: 'Permission Required',
            description: 'Please allow camera and microphone access to join the call',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

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

        // Join or create the call based on mode
        zp.joinRoom({
          container: document.querySelector('#zego-container'),
          maxUsers: 10, // Allow up to 10 participants
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
            config: {
              role: mode === 'create' ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience,
            },
          },
          showRoomTimer: true,
          showScreenSharingButton: callType === 'video',
          showUserList: true,
          enableVideo: callType === 'video',
          turnOnCameraWhenJoining: callType === 'video',
          turnOnMicrophoneWhenJoining: true,
          onLeaveRoom: () => {
            if (isMounted) {
              endCurrentCall();
              navigate('/');
            }
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
  }, [user, roomId, permissionsGranted, callType, mode, navigate, requestPermissions, toast, endCurrentCall]);

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
        {mode === 'create' ? 'Creating Call Room' : 'Joining Call Room'}
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