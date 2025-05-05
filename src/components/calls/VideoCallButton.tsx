import React from 'react';
import { Phone, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { useZego } from '@/contexts/ZegoContext';
import { useToast } from '@/components/ui/use-toast';

interface VideoCallButtonProps {
  recipientId: string;
  recipientName: string;
  variant?: 'audio' | 'video';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VideoCallButton = ({
  recipientId,
  recipientName,
  variant = 'video',
  size = 'md',
  className,
}: VideoCallButtonProps) => {
  const { startCall, isInCall } = useZego();
  const { toast } = useToast();

  const handleCall = () => {
    if (isInCall) {
      toast({
        title: 'Already in a call',
        description: 'Please end your current call before starting a new one.',
        variant: 'destructive',
      });
      return;
    }

    try {
      startCall(recipientId, variant === 'video');
      toast({
        title: `${variant === 'video' ? 'Video' : 'Audio'} call initiated`,
        description: `Calling ${recipientName}...`,
      });
    } catch (error) {
      console.error('Call error:', error);
      toast({
        title: 'Call failed',
        description: 'Could not initiate call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <Button
      variant="outline"
      className={`rounded-full ${sizeClasses[size]} p-0 ${className}`}
      onClick={handleCall}
      title={`${variant === 'video' ? 'Video' : 'Audio'} call ${recipientName}`}
    >
      {variant === 'video' ? (
        <Video size={iconSize[size]} />
      ) : (
        <Phone size={iconSize[size]} />
      )}
    </Button>
  );
};

export default VideoCallButton; 