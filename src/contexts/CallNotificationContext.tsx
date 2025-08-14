import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { useAuth } from './AuthContext';
import CallNotificationPopup from '@/components/CallNotificationPopup';

interface CallNotification {
  id: string;
  type: 'call';
  title: string;
  content: string;
  timestamp: number;
  read: boolean;
  sourceId?: string;
  sourceType?: string;
  callData: {
    callType: 'audio' | 'video';
    roomId: string;
    callerName: string;
  };
}

interface CallNotificationContextType {
  hasIncomingCall: boolean;
  currentCallNotification: CallNotification | null;
  dismissCallNotification: () => void;
}

const CallNotificationContext = createContext<CallNotificationContextType | undefined>(undefined);

export const CallNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [currentCallNotification, setCurrentCallNotification] = useState<CallNotification | null>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  // Get session token for queries
  const sessionToken = localStorage.getItem('sessionToken') || '';

  // Query for unread call notifications
  const notifications = useQuery(
    api.notifications.getNotifications,
    isAuthenticated && sessionToken ? {
      sessionToken,
      limit: 10,
      onlyUnread: true
    } : "skip"
  );

  // Check for incoming call notifications
  useEffect(() => {
    if (!notifications || !Array.isArray(notifications)) return;

    // Find the most recent unread call notification that hasn't been dismissed
    const callNotification = notifications.find((notification: any) => 
      notification.type === 'call' && 
      !notification.read && 
      !dismissedNotifications.has(notification.id) &&
      notification.callData
    ) as CallNotification | undefined;

    if (callNotification && (!currentCallNotification || currentCallNotification.id !== callNotification.id)) {
      setCurrentCallNotification(callNotification);
    } else if (!callNotification && currentCallNotification) {
      setCurrentCallNotification(null);
    }
  }, [notifications, dismissedNotifications, currentCallNotification]);

  const dismissCallNotification = () => {
    if (currentCallNotification) {
      setDismissedNotifications(prev => new Set(prev).add(currentCallNotification.id));
      setCurrentCallNotification(null);
    }
  };

  const handleCallAccept = () => {
    setCurrentCallNotification(null);
  };

  const handleCallDecline = () => {
    setCurrentCallNotification(null);
  };

  const value = {
    hasIncomingCall: !!currentCallNotification,
    currentCallNotification,
    dismissCallNotification,
  };

  return (
    <CallNotificationContext.Provider value={value}>
      {children}
      {currentCallNotification && (
        <CallNotificationPopup
          notification={currentCallNotification}
          onAccept={handleCallAccept}
          onDecline={handleCallDecline}
          onDismiss={dismissCallNotification}
        />
      )}
    </CallNotificationContext.Provider>
  );
};

export const useCallNotification = (): CallNotificationContextType => {
  const context = useContext(CallNotificationContext);
  if (context === undefined) {
    throw new Error('useCallNotification must be used within a CallNotificationProvider');
  }
  return context;
};
