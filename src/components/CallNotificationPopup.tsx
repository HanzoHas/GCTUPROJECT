import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useZego } from '@/contexts/ZegoContext';
import { notifications as notificationsApi } from '@/lib/convex';
import { cn } from '@/lib/utils';

interface CallNotificationProps {
  notification: {
    id: string;
    callData: {
      callType: 'audio' | 'video';
      roomId: string;
      callerName: string;
    };
  };
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

const CallNotificationPopup: React.FC<CallNotificationProps> = ({
  notification,
  onAccept,
  onDecline,
  onDismiss
}) => {
  const { joinCall } = useZego();
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timeout

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAccept = async () => {
    try {
      // Mark notification as read
      await notificationsApi.markAsRead(notification.id);
      
      // Join the call
      joinCall(notification.callData.roomId, notification.callData.callType);
      
      onAccept();
      setIsVisible(false);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleDecline = async () => {
    try {
      // Mark notification as read
      await notificationsApi.markAsRead(notification.id);
      
      onDecline();
      setIsVisible(false);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const handleDismiss = () => {
    onDismiss();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const callType = notification.callData.callType;
  const callerName = notification.callData.callerName;
  const isVideoCall = callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-96 mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Caller Avatar */}
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {callerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center",
                isVideoCall ? "bg-blue-500" : "bg-green-500"
              )}>
                {isVideoCall ? (
                  <Video className="w-4 h-4 text-white" />
                ) : (
                  <Phone className="w-4 h-4 text-white" />
                )}
              </div>
            </div>

            {/* Call Info */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold">{callerName}</h3>
              <p className="text-sm text-muted-foreground">
                Incoming {isVideoCall ? 'video' : 'audio'} call
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-decline in {timeLeft}s
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 w-full">
              <Button
                variant="destructive"
                size="lg"
                className="flex-1 rounded-full"
                onClick={handleDecline}
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Decline
              </Button>
              <Button
                variant="default"
                size="lg"
                className={cn(
                  "flex-1 rounded-full",
                  isVideoCall ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"
                )}
                onClick={handleAccept}
              >
                {isVideoCall ? (
                  <Video className="w-5 h-5 mr-2" />
                ) : (
                  <Phone className="w-5 h-5 mr-2" />
                )}
                Accept
              </Button>
            </div>

            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallNotificationPopup;
