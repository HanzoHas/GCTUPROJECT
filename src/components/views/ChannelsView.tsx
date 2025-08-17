import React, { useState, useMemo, useEffect } from 'react';
import { useChannel, ChannelType } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lock, Plus, Filter, UserPlus } from 'lucide-react';
import { ChannelContent } from './ChannelContent';
import { CreateChannelDialog } from './CreateChannelDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { directApi } from '@/lib/apiWrapper';

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
  const [isJoiningChannel, setIsJoiningChannel] = useState(false);
  const [joinChannelSearch, setJoinChannelSearch] = useState("");
  const [availableChannels, setAvailableChannels] = useState<ChannelType[]>([]);
  const [isSearchingChannels, setIsSearchingChannels] = useState(false);
  const [selectedJoinChannel, setSelectedJoinChannel] = useState<ChannelType | null>(null);
  const { toast } = useToast();

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

  // Handle searching for channels to join
  const handleSearchChannels = async () => {
    if (joinChannelSearch.length < 2) return;
    
    setIsSearchingChannels(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken') || '';
      // We'll search for all channels and then filter by name
      const allChannels = await directApi._callConvexFunction(
        "channels:getChannelsByLevel", 
        { sessionToken }
      );
      
      // Filter channels by search term
      const query = joinChannelSearch.toLowerCase();
      const filtered = allChannels.filter((channel: ChannelType) => 
        channel.name.toLowerCase().includes(query) ||
        channel.description?.toLowerCase().includes(query)
      );
      
      // Filter out channels the user is already a member of
      const userChannelIds = new Set(userChannels.map(c => c._id));
      const availableToJoin = filtered.filter((c: ChannelType) => !userChannelIds.has(c._id));
      
      setAvailableChannels(availableToJoin);
    } catch (error) {
      console.error('Error searching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for channels',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingChannels(false);
    }
  };
  
  // Handle join channel request
  const handleJoinChannel = async () => {
    if (!selectedJoinChannel) return;
    
    try {
      const sessionToken = localStorage.getItem('sessionToken') || '';
      
      // Join the selected channel using the new joinChannel method
      await directApi.joinChannel(
        sessionToken,
        selectedJoinChannel._id
      );
      
      toast({
        title: 'Success',
        description: `Joined channel: ${selectedJoinChannel.name}`,
      });
      
      // Refresh channel list
      await refreshChannels();
      
      // Close the dialog
      setIsJoiningChannel(false);
      setSelectedJoinChannel(null);
      setJoinChannelSearch('');
      setAvailableChannels([]);
    } catch (error) {
      console.error('Error joining channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to join channel',
        variant: 'destructive',
      });
    }
  };
  
  // Debounce search for join channels
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isJoiningChannel && joinChannelSearch.length >= 2) {
        handleSearchChannels();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [joinChannelSearch, isJoiningChannel]);

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
    <div className="h-full grid grid-cols-[256px_1fr] overflow-hidden">
      {/* Channels Sidebar - Fixed Width */}
      <div className="bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
        <div className="flex-none p-3">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wider">Text Channels</h2>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsJoiningChannel(true)}
                className="h-6 w-6 p-0 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsCreatingChannel(true)}
                className="h-6 w-6 p-0 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search and Filter - Discord Style */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-sidebar-foreground/60" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-sidebar-accent/10 border-sidebar-accent/20 text-sidebar-foreground placeholder:text-sidebar-foreground/60 focus:bg-sidebar-accent/20 focus:border-sidebar-primary/50"
              />
            </div>
            
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wider">Filter</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent/20">
                    <Filter className="h-3.5 w-3.5" />
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
        </div>

        {/* Channel List - Discord Style */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-0.5 pr-1">
            {filteredChannels.length > 0 ? (
              filteredChannels.map(channel => (
                <div
                  key={channel._id}
                  className={`group flex items-center px-2 py-1.5 mx-2 rounded cursor-pointer transition-all duration-150 ${
                    selectedChannel?._id === channel._id 
                      ? 'bg-sidebar-primary/20 text-sidebar-primary' 
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
                  }`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <span className="text-gray-400 mr-2">#</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{channel.name.toLowerCase().replace(/\s+/g, '-')}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {channel.level && (
                          <span className="text-xs bg-sidebar-accent/20 text-sidebar-foreground/70 px-1.5 py-0.5 rounded">
                            {channel.level}
                          </span>
                        )}
                        {channel.isPrivate && (
                          <Lock className="h-3 w-3 text-sidebar-foreground/60" />
                        )}
                      </div>
                    </div>
                    {channel.description && selectedChannel?._id === channel._id && (
                      <p className="text-xs text-sidebar-foreground/60 truncate mt-0.5">
                        {channel.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4">
                <div className="text-sidebar-foreground/60 text-sm">
                  {searchQuery || !levelFilter.all ? 'No channels found' : 'No channels available'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Takes remaining space */}
      <div className="h-full overflow-hidden">
        {selectedChannel ? (
          <ChannelContent
            channel={selectedChannel}
            onClose={() => setSelectedChannel(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-background/95 to-background/90">
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
      
      {/* Join Channel Dialog */}
      <Dialog open={isJoiningChannel} onOpenChange={setIsJoiningChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Channel</DialogTitle>
            <DialogDescription>
              Search for channels by name or description to join
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Input
                placeholder="Search channels..."
                value={joinChannelSearch}
                onChange={(e) => setJoinChannelSearch(e.target.value)}
              />
              
              {isSearchingChannels && (
                <div className="flex justify-center py-2">
                  <div className="flex h-6 w-6 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              
              {/* Search results */}
              {!isSearchingChannels && joinChannelSearch.length >= 2 && (
                <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                  {availableChannels.length > 0 ? (
                    availableChannels.map(channel => (
                      <div 
                        key={channel._id}
                        className={`p-3 border-b cursor-pointer hover:bg-muted ${
                          selectedJoinChannel?._id === channel._id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedJoinChannel(channel)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{channel.name}</h3>
                            {channel.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {channel.description}
                              </p>
                            )}
                          </div>
                          {channel.level && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-full">
                              Level {channel.level}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Created by: {channel.lecturer?.name || 'Unknown'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No channels found matching your search
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoiningChannel(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleJoinChannel} 
              disabled={!selectedJoinChannel}
            >
              Join Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChannelsView;
