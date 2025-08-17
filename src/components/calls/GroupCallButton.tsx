import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import { useZego } from '@/contexts/ZegoContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMutation } from 'convex/react';
import { api, convex } from '@/lib/convex';
import type { Id } from '@/convex/_generated/dataModel';

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
  const sendGroupCallInvite = useMutation(api.notifications.sendGroupCallInvite);
  
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
      // Get the conversation ID for this subchannel using the backend query
      const conversationResult = await convex.query(api.conversations.getConversationBySubchannel, {
        sessionToken: localStorage.getItem('sessionToken') || '',
        subchannelId: subchannelId as Id<"studySubchannels">
      });
      
      // Send notification message to the channel
      const messageContent = `${user.username} started a ${callType.toLowerCase()} call in ${channelName}. Click to join!`;
      await sendMessage({
        sessionToken: localStorage.getItem('sessionToken') || '',
        conversationId: conversationResult.conversationId,
        content: messageContent,
        type: 'text'
      });

      // Send individual call notifications to all channel members
      await sendGroupCallInvite({
        subchannelId: subchannelId as Id<"studySubchannels">,
        roomId,
        callType: variant,
        callerName: user.username,
        callerId: user.id as Id<"users">
      });

      // Use the Zego context to properly initiate the group call
      initCall(roomId, channelName, variant, conversationResult.conversationId);
      
      toast({
        title: "Call Started",
        description: `${callType} call started in ${channelName}. All members have been notified.`,
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