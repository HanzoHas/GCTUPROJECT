import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import { useZego } from '@/contexts/ZegoContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMutation } from 'convex/react';
import { api } from '@/lib/convex';

// Memoized button icons to prevent unnecessary re-renders
const CallIcons = {
  video: <Video className="h-4 w-4" />,
  audio: <Phone className="h-4 w-4" />
};

interface GroupCallButtonProps {
  channelId: string;
  subchannelId: string;
  channelName: string;
  variant: 'video' | 'audio';
  size?: 'default' | 'sm' | 'lg';
  isChannelOwner: boolean;
}

const GroupCallButton: React.FC<GroupCallButtonProps> = ({
  channelId,
  subchannelId,
  channelName,
  variant,
  size = 'default',
  isChannelOwner
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { initCall } = useZego();
  const sendMessage = useMutation(api.messages.sendMessage);
  
  // Memoized click handler with proper error handling
  const handleClick = useCallback(async () => {
    if (!isChannelOwner) {
      toast({
        title: "Permission Denied",
        description: "Only the channel owner can start a call",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to start a call",
        variant: "destructive"
      });
      return;
    }
    
    // Generate a unique room ID for the channel call
    // Use a consistent format that both clients can generate
    const roomId = `channel_${channelId}_${subchannelId}`;
    const callType = variant === 'video' ? 'Video' : 'Audio';
    
    try {
      // Initialize the call first to ensure we have a valid room ID
      initCall(roomId, channelName, variant);
      
      // Create a message with the call link
      const callLink = `/call/${roomId}?type=${variant}&channelId=${channelId}&subchannelId=${subchannelId}`;
      const messageContent = `${user.username} started a ${callType.toLowerCase()} call. [Join Call](${callLink})`;
      
      // Send the message to the channel
      // Use the subchannel ID directly as the conversation ID
      await sendMessage({
        sessionToken: localStorage.getItem('sessionToken') || '',
        conversationId: subchannelId, // Use subchannel ID directly
        content: messageContent,
        type: 'text'
      });
      
      toast({
        title: "Call Started",
        description: `${callType} call started in ${channelName}`,
      });
    } catch (error) {
      console.error('Error starting group call:', error);
      // End the call if it was partially started
      if (window.zegoInstance) {
        window.zegoInstance.destroy();
      }
      
      toast({
        title: "Call Error",
        description: error instanceof Error ? error.message : "There was a problem starting the call",
        variant: "destructive"
      });
    }
  }, [channelId, channelName, initCall, isChannelOwner, sendMessage, subchannelId, toast, user, variant]);
  
  // Memoize size classes to prevent unnecessary re-renders
  const sizeClasses = useMemo(() => ({
    default: 'h-8 w-8',
    sm: 'h-6 w-6',
    lg: 'h-10 w-10'
  }), []);
  
  const iconSize = useMemo(() => ({
    default: 'h-4 w-4',
    sm: 'h-3 w-3',
    lg: 'h-5 w-5'
  }), []);
  
  const tooltipText = variant === 'video' ? 'Start Video Call' : 'Start Audio Call';
  const Icon = variant === 'video' ? Video : Phone;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={cn("rounded-full", sizeClasses[size])}
            disabled={!isChannelOwner}
          >
            <Icon className={iconSize[size]} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GroupCallButton;