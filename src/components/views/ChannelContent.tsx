import React from 'react';
import { ChannelType } from '@/contexts/ChannelContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ChannelContentProps {
  channel: ChannelType;
  onClose: () => void;
}

export function ChannelContent({ channel, onClose }: ChannelContentProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">{channel.name}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-4">
        {channel.description && (
          <p className="text-muted-foreground mb-4">{channel.description}</p>
        )}
        <div className="text-center text-muted-foreground">
          Channel content coming soon...
        </div>
      </div>
    </div>
  );
} 