import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import { useZego } from '@/contexts/ZegoContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VideoCallButtonProps {
  recipientId: string;
  recipientName: string;
  variant: 'video' | 'audio';
  size?: 'default' | 'sm' | 'lg';
  conversationId?: string;
}

const ZegoVideoCallButton: React.FC<VideoCallButtonProps> = ({
  recipientId,
  recipientName,
  variant,
  size = 'default',
  conversationId
}) => {
  const { initCall } = useZego();
  
  const handleClick = () => {
    if (!recipientId || recipientId.trim() === '') {
      // Button should be disabled anyway, just return silently
      return;
    }
    
    // Check if initCall is defined
    if (typeof initCall !== 'function') {
      // Only keep this critical error log
      console.error("initCall is not a function");
      return;
    }
    
    initCall(recipientId, recipientName, variant, conversationId);
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
  
  const tooltipText = variant === 'video' ? 'Video Call' : 'Audio Call';
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
            disabled={!recipientId}
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

export default ZegoVideoCallButton;