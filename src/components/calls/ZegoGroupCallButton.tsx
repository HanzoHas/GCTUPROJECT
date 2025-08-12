import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Video } from 'lucide-react';
import { useZego } from '@/contexts/ZegoContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GroupCallButtonProps {
  groupId: string;
  groupName: string;
  showText?: boolean;
  size?: 'default' | 'sm' | 'lg';
}

const ZegoGroupCallButton: React.FC<GroupCallButtonProps> = ({
  groupId,
  groupName,
  showText = false,
  size = 'default'
}) => {
  const { joinCall } = useZego();
  
  const handleClick = () => {
    if (!groupId || groupId.trim() === '') {
      // Button should be disabled anyway, no need for error message
      return;
    }
    
    // Create a room ID that includes the group ID for consistency
    const roomId = `group_${groupId}_${Date.now()}`;
    joinCall(roomId, 'video');
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
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {showText ? (
            <Button
              variant="outline"
              onClick={handleClick}
              className="flex items-center gap-2"
              disabled={!groupId}
            >
              <Users className="h-4 w-4" />
              Join Group Call
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              className={cn("rounded-full", sizeClasses[size])}
              disabled={!groupId}
            >
              <Users className={iconSize[size]} />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>Join Group Video Call</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ZegoGroupCallButton;