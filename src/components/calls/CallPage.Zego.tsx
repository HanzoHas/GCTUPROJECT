import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useZego } from '@/contexts/ZegoContext';
import { useAuth } from '@/contexts/AuthContext';
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

  const [zegoInstance, setZegoInstance] = useState<any>(null);

  useEffect(() => {
    if (!user || !roomId) {
      navigate('/');
      return;
    }

    const appID = import.meta.env.VITE_ZEGO_APP_ID;
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

    if (!appID || !serverSecret) {
      console.error("Missing Zego credentials");
      navigate('/');
      return;
    }

    // Create a Zego instance
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      parseInt(appID),
      serverSecret,
      roomId,
      user.id,
      user.username || 'User'
    );

    // Create instance
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    setZegoInstance(zp);

    // Join or create the call based on mode
    zp.joinRoom({
      container: document.querySelector('#zego-container'),
      sharedLinks: [],
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
        config: {
          // Set role based on mode parameter
          role: mode === 'create' ? 'Host' : 'Audience' as any,
        },
      },
      showRoomDetailsButton: true,
      turnOnCameraWhenJoining: callType === 'video',
      turnOnMicrophoneWhenJoining: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showTextChat: true,
      showUserList: true,
      branding: {
        logoURL: '',
      },
      // Custom title based on mode
      showRoomTimer: true,
      showScreenSharingButton: true,
      onLeaveRoom: () => {
        endCurrentCall();
      },
    });

    return () => {
      if (zegoInstance) {
        zegoInstance.destroy();
      }
    };
  }, [user, roomId, callType, navigate, endCurrentCall]);

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-primary text-white p-2 text-center font-medium">
        {mode === 'create' ? 'Creating Call Room' : 'Joining Call Room'}
      </div>
      <div id="zego-container" className="flex-1"></div>
      <button
        onClick={endCurrentCall}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 z-10"
      >
        End
      </button>
    </div>
  );
};

export default CallPage;