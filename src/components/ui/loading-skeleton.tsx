import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Message loading skeleton
export const MessageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex gap-3 p-4", className)}>
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-16 w-full max-w-md" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

// Conversation list skeleton
export const ConversationSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 p-3", className)}>
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
    <Skeleton className="h-3 w-12" />
  </div>
);

// Subchannel list skeleton
export const SubchannelSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 p-3 rounded-xl", className)}>
    <Skeleton className="h-10 w-10 rounded-lg" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-40" />
    </div>
  </div>
);

// Channel card skeleton
export const ChannelSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("p-6 rounded-xl border", className)}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
    <div className="flex justify-between items-center mt-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);

// User profile skeleton
export const UserProfileSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3", className)}>
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="space-y-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

// Announcement skeleton
export const AnnouncementSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("p-6 rounded-xl border", className)}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  </div>
);
