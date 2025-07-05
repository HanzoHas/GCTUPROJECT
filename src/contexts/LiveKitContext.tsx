import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  Room,
  RoomEvent,
  TrackPublication,
  ConnectionState,
} from 'livekit-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { livekit } from '@/lib/convex';

// NOTE: "livekit" namespace is added to src/lib/convex.ts later in this patch

export type CallVariant = 'audio' | 'video';

interface LiveKitContextType {
  initCall: (
    recipientId: string,
    recipientName: string,
    variant: CallVariant,
  ) => void;
  joinCall: (roomId: string, variant: CallVariant) => void;
  endCurrentCall: () => void;
  isInCall: boolean;
  currentCallId: string | null;
  room?: Room | null;
}

const LiveKitContext = createContext<LiveKitContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const LiveKitProvider = ({ children }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL as string;

  /*
   ---------------------------------------------------------------------------
   Helper to create / fetch LiveKit token via Convex action
   ---------------------------------------------------------------------------
  */
  const fetchToken = async (
    roomId: string,
    participantId: string,
    participantName: string,
    variant: CallVariant,
  ): Promise<string | null> => {
    try {
      // We create a token allowing both publish and subscribe; you can fine-tune
      const token = await livekit.getToken({
        roomId,
        userId: participantId,
        userName: participantName,
        audio: true,
        video: variant === 'video',
      });
      if (!token) throw new Error('No token returned');
      return token;
    } catch (err) {
      console.error('Failed to fetch LiveKit token', err);
      toast({
        title: 'Call Error',
        description: 'Unable to obtain call credentials',
        variant: 'destructive',
      });
      return null;
    }
  };

  /*
   ---------------------------------------------------------------------------
   Call Control helpers exposed to UI
   ---------------------------------------------------------------------------
  */
  const initCall = async (
    recipientId: string,
    recipientName: string,
    variant: CallVariant,
  ) => {
    if (!user) {
      toast({ title: 'Login required', description: 'Sign in first', variant: 'destructive' });
      return;
    }

    // Unique deterministic room id for 1-1 calls
    const participants = [user.id, recipientId].sort();
    const roomId = `call_${participants.join('_')}`;

    // (Optional) send notification to recipient just like earlier – omitted here
    joinCall(roomId, variant);
  };

  const joinCall = async (roomId: string, variant: CallVariant) => {
    if (!user) {
      toast({ title: 'Login required', description: 'Sign in first', variant: 'destructive' });
      return;
    }

    // end existing call if any
    if (room) {
      endCurrentCall();
    }

    const token = await fetchToken(roomId, user.id, user.username, variant);
    if (!token) return;

    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    /* handle disconnect */
    const handleDisconnect = () => {
      setIsInCall(false);
      setCurrentCallId(null);
      setRoom(null);
      navigate(-1);
    };

    newRoom
      .prepareConnection()
      .then(() => newRoom.connect(LIVEKIT_URL, token))
      .then(() => {
        setRoom(newRoom);
        setIsInCall(true);
        setCurrentCallId(roomId);
        navigate(`/call/${roomId}?type=${variant}`);
      })
      .catch((err) => {
        console.error('LiveKit connect error', err);
        toast({ title: 'Call error', description: 'Could not connect', variant: 'destructive' });
        newRoom.disconnect();
      });

    newRoom.on(RoomEvent.Disconnected, handleDisconnect);
  };

  const endCurrentCall = () => {
    if (room) {
      room.disconnect();
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) room.disconnect();
    };
  }, [room]);

  const value: LiveKitContextType = {
    initCall,
    joinCall,
    endCurrentCall,
    isInCall,
    currentCallId,
    room,
  };

  return <LiveKitContext.Provider value={value}>{children}</LiveKitContext.Provider>;
};

export const useLiveKit = () => {
  const ctx = useContext(LiveKitContext);
  if (!ctx) throw new Error('useLiveKit must be used inside LiveKitProvider');
  return ctx;
};
