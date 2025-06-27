import React, { useState, useMemo, useEffect } from 'react';
import { useChannel, ChannelType } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lock, Plus } from 'lucide-react';
import { ChannelContent } from './ChannelContent';
import { CreateChannelDialog } from './CreateChannelDialog';

function ChannelsView() {
  const { user } = useAuth();
  const { userChannels, refreshChannels, isLoadingChannels } = useChannel();
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch channels when component mounts
  useEffect(() => {
    refreshChannels();
  }, []);

  // Filter channels based on search query and remove duplicates
  const filteredChannels = useMemo(() => {
    // First deduplicate channels by ID
    const uniqueChannels = Array.from(
      new Map(userChannels.map(channel => [channel._id, channel])).values()
    );
    
    // Then apply search filter
    if (!searchQuery) return uniqueChannels;
    const query = searchQuery.toLowerCase();
    return uniqueChannels.filter(channel => 
      channel.name.toLowerCase().includes(query) ||
      channel.description?.toLowerCase().includes(query)
    );
  }, [userChannels, searchQuery]);

  // Early return if not authenticated
  if (!user) {
    return null;
  }
  
  // Show loading state
  if (isLoadingChannels) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent">
            <span className="sr-only">Loading...</span>
          </div>
          <h3 className="text-lg font-semibold">Loading channels...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r flex flex-col">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Channels</h2>
            <Button 
              size="sm" 
              onClick={() => setIsCreatingChannel(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Channel List */}
          <div className="space-y-2">
            {filteredChannels.length > 0 ? (
              filteredChannels.map(channel => (
                <div
                  key={channel._id}
                  className={`p-2 rounded cursor-pointer hover:bg-accent ${
                    selectedChannel?._id === channel._id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{channel.name}</span>
                    {channel.isPrivate && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {channel.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {channel.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? 'No channels found' : 'No channels available'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <ChannelContent
            channel={selectedChannel}
            onClose={() => setSelectedChannel(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a channel to view its content
          </div>
        )}
      </div>

      {/* Create Channel Dialog */}
      {isCreatingChannel && (
        <CreateChannelDialog
          onClose={() => setIsCreatingChannel(false)}
          onChannelCreated={() => setIsCreatingChannel(false)}
        />
      )}
    </div>
  );
}

export default ChannelsView;
