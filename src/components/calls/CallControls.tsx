import React from 'react';
import { PhoneOff, Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { Button } from '../ui/button';
import { useZego } from '@/contexts/ZegoContext';
import { useToast } from '@/components/ui/use-toast';

const CallControls = () => {
  const { endCall, isInCall } = useZego();
  const { toast } = useToast();
  const [micEnabled, setMicEnabled] = React.useState(true);
  const [cameraEnabled, setCameraEnabled] = React.useState(true);

  if (!isInCall) return null;

  const handleEndCall = () => {
    endCall();
    toast({
      title: 'Call ended',
      description: 'You have left the call.',
    });
  };

  const toggleMic = () => {
    // In a real implementation, you would use the ZEGO SDK to toggle the mic
    setMicEnabled(!micEnabled);
    toast({
      title: micEnabled ? 'Microphone muted' : 'Microphone unmuted',
      duration: 2000,
    });
  };

  const toggleCamera = () => {
    // In a real implementation, you would use the ZEGO SDK to toggle the camera
    setCameraEnabled(!cameraEnabled);
    toast({
      title: cameraEnabled ? 'Camera turned off' : 'Camera turned on',
      duration: 2000,
    });
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-[60] bg-black/50 p-3 rounded-full">
      <Button 
        variant="ghost" 
        className="rounded-full h-12 w-12 bg-gray-800 hover:bg-gray-700 p-0"
        onClick={toggleMic}
      >
        {micEnabled ? (
          <Mic className="text-white" />
        ) : (
          <MicOff className="text-red-500" />
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        className="rounded-full h-12 w-12 bg-gray-800 hover:bg-gray-700 p-0"
        onClick={toggleCamera}
      >
        {cameraEnabled ? (
          <Camera className="text-white" />
        ) : (
          <CameraOff className="text-red-500" />
        )}
      </Button>
      
      <Button 
        variant="destructive" 
        className="rounded-full h-12 w-12 p-0"
        onClick={handleEndCall}
      >
        <PhoneOff />
      </Button>
    </div>
  );
};

export default CallControls; 