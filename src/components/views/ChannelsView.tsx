import React, { useState, useMemo, useEffect } from 'react';
import { useChannel, ChannelType } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lock, Plus, Filter } from 'lucide-react';
import { ChannelContent } from './ChannelContent';
import { CreateChannelDialog } from './CreateChannelDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ChannelsView() {
  const { user } = useAuth();
  const { userChannels, refreshChannels, isLoadingChannels } = useChannel();
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<{
    "100": boolean;
    "200": boolean;
    "300": boolean;
    all: boolean;
  }>({
    "100": false,
    "200": false,
    "300": false,
    all: true,
  });

  // Fetch channels when component mounts
  useEffect(() => {
    refreshChannels();
  }, []);

  // Handle filter changes
  const handleLevelFilterChange = (level: '100' | '200' | '300' | 'all') => {
    if (level === 'all') {
      setLevelFilter({
        "100": false,
        "200": false,
        "300": false,
        all: true,
      });
    } else {
      const newFilter = {
        ...levelFilter,
        [level]: !levelFilter[level],
        all: false,
      };
      
      // If no filters are selected, set "all" to true
      if (!newFilter["100"] && !newFilter["200"] && !newFilter["300"]) {
        newFilter.all = true;
      }
      
      setLevelFilter(newFilter);
    }
  };

  // Filter channels based on search query and level filter
  const filteredChannels = useMemo(() => {
    // First deduplicate channels by ID
    const uniqueChannels = Array.from(
      new Map(userChannels.map(channel => [channel._id, channel])).values()
    );
    
    // Apply search filter
    let filtered = uniqueChannels;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(channel => 
        channel.name.toLowerCase().includes(query) ||
        channel.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply level filter
    if (!levelFilter.all) {
      filtered = filtered.filter(channel => {
        // If channel has no level, show it only when "all" is selected
        if (!channel.level) {
          return false;
        }
        return levelFilter[channel.level];
      });
    }
    
    return filtered;
  }, [userChannels, searchQuery, levelFilter]);

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
          
          {/* Search and Filter */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Filter by Level:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuCheckboxItem
                    checked={levelFilter.all}
                    onCheckedChange={() => handleLevelFilterChange('all')}
                  >
                    All Levels
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={levelFilter["100"]}
                    onCheckedChange={() => handleLevelFilterChange('100')}
                  >
                    100 Level
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={levelFilter["200"]}
                    onCheckedChange={() => handleLevelFilterChange('200')}
                  >
                    200 Level
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={levelFilter["300"]}
                    onCheckedChange={() => handleLevelFilterChange('300')}
                  >
                    300 Level
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                    <div className="flex items-center space-x-1">
                      {channel.level && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                          {channel.level}
                        </span>
                      )}
                      {channel.isPrivate && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
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
                {searchQuery || !levelFilter.all ? 'No channels found' : 'No channels available'}
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
