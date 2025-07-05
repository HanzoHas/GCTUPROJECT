import { LiveKitRoom, VideoConference } from '@livekit/react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveKit } from '@/contexts/LiveKitContext';
import { useAuth } from '@/contexts/AuthContext';
import { livekit as livekitApi } from '@/lib/convex';

const CallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const callType = (searchParams.get('type') as 'audio' | 'video') ?? 'video';

  const { user } = useAuth();
  const { endCurrentCall } = useLiveKit();
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string;

  useEffect(() => {
    if (!user || !roomId || !LIVEKIT_URL) {
      navigate('/');
      return;
    }

    livekitApi
      .getToken({
        roomId,
        userId: user.id,
        userName: user.username ?? 'User',
        audio: true,
        video: callType === 'video',
      })
      .then(setToken)
      .catch(() => navigate('/'));
  }, [user, roomId, callType, navigate, LIVEKIT_URL]);

  if (!token) {
    return <div className="flex items-center justify-center h-screen">Connecting…</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={LIVEKIT_URL}
      data-lk-theme="default"
      video={callType === 'video'}
      audio
      onDisconnected={() => navigate(-1)}
    >
      <VideoConference />
      <button
        onClick={endCurrentCall}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
      >
        End
      </button>
    </LiveKitRoom>
  );
};

export default CallPage;
