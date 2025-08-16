import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Phone, Users } from 'lucide-react';
import { useZego } from '@/contexts/ZegoContext';
import { cn } from '@/lib/utils';

interface GroupCallNotificationProps {
  roomId: string;
  callType: 'audio' | 'video';
  channelName: string;
  callerName: string;
  onJoin?: () => void;
  onDismiss?: () => void;
}

const GroupCallNotification: React.FC<GroupCallNotificationProps> = ({
  roomId,
  callType,
  channelName,
  callerName,
  onJoin,
  onDismiss
}) => {
  const { joinCall } = useZego();

  const handleJoinCall = () => {
    joinCall(roomId, callType);
    onJoin?.();
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  const isVideoCall = callType === 'video';

  return (
    <Card className="w-full max-w-md mx-auto mb-4 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isVideoCall ? "bg-blue-500" : "bg-green-500"
          )}>
            {isVideoCall ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <Phone className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {callerName} started a {callType} call
            </p>
            <p className="text-sm text-gray-500 truncate">
              in {channelName}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={handleJoinCall}
              className={cn(
                "flex items-center space-x-1",
                isVideoCall ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
              )}
            >
              <Users className="w-4 h-4" />
              <span>Join</span>
            </Button>
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCallNotification;
