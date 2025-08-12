import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import { useZego } from '@/contexts/ZegoContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMutation } from 'convex/react';
import { api, getConversationIdFromSubchannel } from '@/lib/convex';

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
  
  const handleClick = async () => {
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
    
    try {
      // Generate a unique room ID for the channel call
      const roomId = `channel_${channelId}_${subchannelId}_${Date.now()}`;
      
      // Create a message with the call link
      const callType = variant === 'video' ? 'Video' : 'Audio';
      const callLink = `/call/${roomId}?type=${variant}`;
      const messageContent = `${user.username} started a ${callType.toLowerCase()} call. [Join Call](${callLink})`;
      
      // Send the message to the channel
      // Convert subchannel ID to the expected Id<"conversations"> type using the helper function
      const conversationId = getConversationIdFromSubchannel(subchannelId);
      
      await sendMessage({
        sessionToken: localStorage.getItem('sessionToken') || '',
        conversationId, // Using subchannel ID as the conversation ID
        content: messageContent,
        type: 'text'
      });
      
      // Initialize the call
      initCall(channelId, channelName, variant);
      
      toast({
        title: "Call Started",
        description: `${callType} call started in ${channelName}`,
      });
    } catch (error) {
      console.error('Error starting group call:', error);
      toast({
        title: "Call Error",
        description: "There was a problem starting the call",
        variant: "destructive"
      });
    }
  };
  
  const sizeClasses = {
    default: 'h-8 w-8',
    sm: 'h-6 w-6',
    lg: 'h-10 w-10'
  };
  
  const iconSize = {
    default: 'h-4 w-4',
    sm: 'h-3 w-3',
    lg: 'h-5 w-5'
  };
  
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