import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useZego } from '@/contexts/ZegoContext';
import CallControls from '@/components/calls/CallControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const GroupCallPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { joinGroupCall, isInCall, endCall } = useZego();
  const navigate = useNavigate();

  useEffect(() => {
    // If we have a roomId from the URL, join that call automatically
    if (roomId && !isInCall) {
      joinGroupCall(roomId, `Group Call ${roomId}`);
    }

    // Cleanup when the component unmounts
    return () => {
      if (isInCall) {
        endCall();
      }
    };
  }, [roomId, isInCall]);

  const handleGoBack = () => {
    if (isInCall) {
      endCall();
    }
    navigate(-1);
  };

  return (
    <div className="relative h-screen w-screen bg-black flex flex-col">
      <div className="absolute top-4 left-4 z-[70]">
        <Button
          variant="ghost"
          className="bg-black/30 hover:bg-black/50 rounded-full"
          onClick={handleGoBack}
        >
          <ArrowLeft className="text-white" size={20} />
        </Button>
      </div>
      
      <div id="zego-container" className="flex-1"></div>
      
      <CallControls />
    </div>
  );
};

export default GroupCallPage; 