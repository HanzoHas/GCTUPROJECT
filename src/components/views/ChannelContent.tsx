import React, { useEffect, useState } from 'react';
import { ChannelType, useChannel, SubchannelType } from '@/contexts/ChannelContext';
import { Button } from '@/components/ui/button';
import { X, MessageSquare, Users, Bell, Plus } from 'lucide-react';
import { CreateSubchannelDialog } from './CreateSubchannelDialog';
import { SubchannelContent } from './SubchannelContent';

interface ChannelContentProps {
  channel: ChannelType;
  onClose: () => void;
}

export function ChannelContent({ channel, onClose }: ChannelContentProps) {
  const { 
    subchannels, 
    setCurrentChannel, 
    currentSubchannel, 
    setCurrentSubchannel,
    isLoadingSubchannels,
    canManageChannel
  } = useChannel();
  
  const [isCreatingSubchannel, setIsCreatingSubchannel] = useState(false);

  // Set the current channel when this component mounts
  useEffect(() => {
    setCurrentChannel(channel);
    return () => setCurrentChannel(null);
  }, [channel, setCurrentChannel]);

  // Function to handle subchannel selection
  const handleSubchannelClick = (subchannel: SubchannelType) => {
    setCurrentSubchannel(subchannel);
  };

  // Get icon based on subchannel type
  const getSubchannelIcon = (type: SubchannelType['type']) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Bell className="h-4 w-4 mr-2" />;
      case 'CLASS':
        return <Users className="h-4 w-4 mr-2" />;
      case 'TEXT':
      default:
        return <MessageSquare className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-semibold">{channel.name}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 flex">
        {/* Subchannels sidebar */}
        <div className="w-64 border-r p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Subchannels</h3>
            {canManageChannel(channel._id) && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsCreatingSubchannel(true)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isLoadingSubchannels ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : subchannels.length > 0 ? (
            <div className="space-y-1">
              {subchannels.map(subchannel => (
                <div 
                  key={subchannel._id}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-accent ${currentSubchannel?._id === subchannel._id ? 'bg-accent' : ''}`}
                  onClick={() => handleSubchannelClick(subchannel)}
                >
                  {getSubchannelIcon(subchannel.type)}
                  <span>{subchannel.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No subchannels available
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {currentSubchannel ? (
            <SubchannelContent 
              channel={channel} 
              subchannel={currentSubchannel} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h3 className="text-lg font-medium mb-2">Welcome to {channel.name}</h3>
              <p className="text-muted-foreground">
                {subchannels.length > 0 
                  ? 'Select a subchannel to view its content' 
                  : 'This channel has no subchannels yet'}
              </p>
              {subchannels.length === 0 && canManageChannel(channel._id) && (
                <Button 
                  onClick={() => setIsCreatingSubchannel(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Subchannel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Subchannel Dialog */}
      {isCreatingSubchannel && (
        <CreateSubchannelDialog
          channelId={channel._id}
          onClose={() => setIsCreatingSubchannel(false)}
          onSubchannelCreated={() => setIsCreatingSubchannel(false)}
        />
      )}
    </div>
  );
}