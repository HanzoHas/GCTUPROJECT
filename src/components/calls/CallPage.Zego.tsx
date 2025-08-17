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
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Check if user is on mobile and request permissions
  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
    
    // Request media permissions
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: callType === 'video' 
        });
        // Close the stream immediately after getting permissions
        stream.getTracks().forEach(track => track.stop());
        setPermissionsGranted(true);
      } catch (error) {
        console.error('Permission denied:', error);
        toast({
          title: 'Permissions Required',
          description: 'Please allow camera and microphone access to join the call',
          variant: 'destructive',
        });
        setPermissionsGranted(true); // Continue anyway
      }
    };
    
    requestPermissions();
  }, [callType, toast]);

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
          maxUsers: 2, // Limit to 2 participants for 1-on-1 calls
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall, // Use GroupCall mode to enable screen sharing
          },
          showRoomTimer: true,
          showScreenSharingButton: true, // Always show screen sharing button
          showUserList: false, // Hide user list for 1-on-1 calls
          showMemberList: false, // Hide member list for 1-on-1 calls
          enableVideo: callType === 'video',
          turnOnCameraWhenJoining: callType === 'video',
          turnOnMicrophoneWhenJoining: true,
          showLeavingView: false, // Don't show leaving confirmation
          // Force enable audio and video permissions
          showMicrophoneStateOnJoining: true,
          showCameraStateOnJoining: callType === 'video',
          // Auto-grant permissions
          autoLeaveRoomWhenOnlySelfInRoom: true,
          // Callback handlers
          onLeaveRoom: () => {
            console.log('User left the room');
            if (isMounted) {
              endCurrentCall();
            }
          },
          onUserJoin: (users: any[]) => {
            console.log('User joined call:', users);
            // Force unmute when user joins
            users.forEach((user: any) => {
              if (user.userID !== user.id) {
                try {
                  zp.setRemoteUserAudioMute(user.userID, false);
                  if (callType === 'video') {
                    zp.setRemoteUserVideoMute(user.userID, false);
                  }
                } catch (error) {
                  console.log('Could not unmute user:', error);
                }
              }
            });
          },
          onUserLeave: (users: any[]) => {
            console.log('User left call, remaining users:', users);
            // End call immediately when other user leaves
            if (users.length <= 1 && isMounted) {
              setTimeout(() => {
                endCurrentCall();
              }, 1000); // Reduced delay
            }
          },
          // Audio/Video state callbacks
          onUserAudioStateUpdate: (userList: any[]) => {
            console.log('Audio state updated:', userList);
          },
          onUserVideoStateUpdate: (userList: any[]) => {
            console.log('Video state updated:', userList);
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

  // Cleanup function - only clean up instances, don't call endCurrentCall
  useEffect(() => {
    return () => {
      if (window.zegoInstance) {
        try {
          window.zegoInstance.destroy();
          delete window.zegoInstance;
        } catch (error) {
          console.error('Error cleaning up Zego instance:', error);
        }
      }
    };
  }, []);

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