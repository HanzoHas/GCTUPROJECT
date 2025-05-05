import React from 'react';
import { Users, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { useZego } from '@/contexts/ZegoContext';
import { useToast } from '@/components/ui/use-toast';

interface GroupCallButtonProps {
  groupId: string;
  groupName: string;
  variant?: 'outline' | 'secondary' | 'default' | 'destructive' | 'ghost';
  showText?: boolean;
  className?: string;
}

const GroupCallButton = ({
  groupId,
  groupName,
  variant = 'outline',
  showText = false,
  className,
}: GroupCallButtonProps) => {
  const { joinGroupCall, isInCall } = useZego();
  const { toast } = useToast();

  const handleGroupCall = () => {
    if (isInCall) {
      toast({
        title: 'Already in a call',
        description: 'Please end your current call before starting a new one.',
        variant: 'destructive',
      });
      return;
    }

    try {
      joinGroupCall(groupId, groupName);
      toast({
        title: 'Group call initiated',
        description: `Joining ${groupName} group call...`,
      });
    } catch (error) {
      console.error('Group call error:', error);
      toast({
        title: 'Group call failed',
        description: 'Could not join group call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant={variant}
      className={`${showText ? 'gap-2' : 'aspect-square p-2'} ${className}`}
      onClick={handleGroupCall}
      title={`Join ${groupName} group call`}
    >
      <Users size={18} />
      {showText && 'Join Group Call'}
    </Button>
  );
};

export default GroupCallButton; 