import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/lib/convex";
import { useAuth } from "@/contexts/AuthContext";

interface UserStatus {
  userId: string;
  username: string;
  status: "Available" | "Busy" | "In class" | "Offline";
  isOnline: boolean;
  lastSeen: number | null;
}

/**
 * Hook to subscribe to the status of multiple users
 * @param userIds Array of user IDs to monitor
 * @returns Array of user statuses with real-time updates
 */
export function useUserStatus(userIds: string[]): {
  statuses: UserStatus[];
  error: Error | null;
} {
  const { user, sessionToken } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  
  // Filter out duplicate IDs and empty strings
  const uniqueUserIds = [...new Set(userIds.filter(id => id))];
  
  // Only subscribe to status updates if we have a valid user and session token
  const statuses = useQuery(
    api.users.subscribeToUserStatus,
    user && sessionToken ? { 
      sessionToken,
      userIds: uniqueUserIds 
    } : "skip"
  );

  return { 
    statuses: statuses || [], 
    error 
  };
}

/**
 * Hook to subscribe to the status of a single user
 * @param userId ID of user to monitor
 * @returns User status with real-time updates
 */
export function useSingleUserStatus(userId: string | undefined): {
  status: UserStatus | null;
  error: Error | null;
} {
  const { statuses, error } = useUserStatus(userId ? [userId] : []);
  
  return {
    status: statuses && statuses.length > 0 ? statuses[0] : null,
    error
  };
} 