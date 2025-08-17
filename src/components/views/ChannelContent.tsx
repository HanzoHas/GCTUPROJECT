import React, { useEffect, useState } from 'react';
import { ChannelType, useChannel, SubchannelType } from '@/contexts/ChannelContext';
import { Button } from '@/components/ui/button';
import { X, MessageSquare, Users, Bell, Plus, ArrowLeft, Menu } from 'lucide-react';
import { CreateSubchannelDialog } from './CreateSubchannelDialog';
import { SubchannelContent } from './SubchannelContent';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubchannelSkeleton } from '@/components/ui/loading-skeleton';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSubchannelList, setShowSubchannelList] = useState(!isMobile);

  // Check for mobile screens
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSubchannelList(true);
      } else if (currentSubchannel) {
        setShowSubchannelList(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentSubchannel]);

  // Set the current channel when this component mounts
  useEffect(() => {
    setCurrentChannel(channel);
    return () => setCurrentChannel(null);
  }, [channel, setCurrentChannel]);

  useEffect(() => {
    if (currentSubchannel && isMobile) {
      setShowSubchannelList(false);
    }
  }, [currentSubchannel, isMobile]);

  // Function to handle subchannel selection
  const handleSubchannelClick = (subchannel: SubchannelType) => {
    setCurrentSubchannel(subchannel);
    if (isMobile) {
      setShowSubchannelList(false);
    }
  };

  const toggleSubchannelList = () => {
    setShowSubchannelList(prev => !prev);
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
    <div className="h-full bg-gradient-to-br from-background to-background/95 flex flex-col md:grid md:grid-cols-12 lg:grid-cols-10 gap-0 relative overflow-hidden">
      {/* Channel Header - Mobile only */}
      <div className="md:hidden flex-none flex items-center justify-between p-4 border-b border-accent/10 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {channel.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-display font-semibold">{channel.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {currentSubchannel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSubchannelList}
              className="rounded-full h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subchannels List */}
      <AnimatePresence initial={false}>
        {showSubchannelList && (
          <motion.div 
            className={cn(
              "w-full md:col-span-5 lg:col-span-3 h-full absolute md:relative z-20 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md overflow-hidden flex flex-col",
              isMobile && "inset-0 border-r border-accent/10"
            )}
            initial={isMobile ? { x: -300, opacity: 0 } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -300, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Subchannels Header */}
            <div className="flex-none sticky top-0 z-10 p-4 backdrop-blur-md border-b border-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {channel.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-display font-semibold">{channel.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {subchannels.length} subchannel{subchannels.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {canManageChannel(channel._id) && (
                  <TooltipProvider delayDuration={350}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsCreatingSubchannel(true)}
                          className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>New Subchannel</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Subchannels List */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4 space-y-2">
                {isLoadingSubchannels ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SubchannelSkeleton key={i} />
                    ))}
                  </div>
                ) : subchannels.length > 0 ? (
                  subchannels.map(subchannel => (
                    <motion.div
                      key={subchannel._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50",
                        currentSubchannel?._id === subchannel._id 
                          ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                          : 'hover:shadow-sm border border-transparent'
                      )}
                      onClick={() => handleSubchannelClick(subchannel)}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg mr-3 transition-colors",
                        currentSubchannel?._id === subchannel._id 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted/50 text-muted-foreground group-hover:bg-muted/70'
                      )}>
                        {getSubchannelIcon(subchannel.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {subchannel.name}
                        </h3>
                        {subchannel.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {subchannel.description}
                          </p>
                        )}
                      </div>
                      {currentSubchannel?._id === subchannel._id && (
                        <div className="h-2 w-2 rounded-full bg-primary ml-2"></div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center mb-4 bg-muted/30 h-16 w-16 rounded-full">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No subchannels yet</h3>
                    <p className="text-muted-foreground mb-6 text-sm">
                      {canManageChannel(channel._id)
                        ? 'Create the first subchannel to get started.'
                        : 'Check back soon for updates.'}
                    </p>
                    {canManageChannel(channel._id) && (
                      <Button
                        onClick={() => setIsCreatingSubchannel(true)}
                        className="rounded-full px-6"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Subchannel
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Area */}
      <div className="w-full h-full flex flex-col md:col-span-7 lg:col-span-7 bg-gradient-to-br from-background/95 to-background/90 overflow-hidden isolate">
        {!currentSubchannel ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center mb-6 bg-muted/30 h-24 w-24 rounded-full">
                <div className="relative">
                  <MessageSquare className="h-12 w-12 text-primary/50" />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome to {channel.name}
              </h3>
              <p className="text-muted-foreground mb-6">
                {subchannels.length > 0 
                  ? 'Select a subchannel from the list to start chatting.' 
                  : 'This channel has no subchannels yet.'}
              </p>
              <Button 
                className="rounded-full px-6" 
                onClick={() => setShowSubchannelList(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View Subchannels
              </Button>
            </div>
          </div>
        ) : (
          <ErrorBoundary>
            <SubchannelContent 
              channel={channel} 
              subchannel={currentSubchannel}
              onBack={() => {
                setCurrentSubchannel(null);
                if (isMobile) setShowSubchannelList(true);
              }}
            />
          </ErrorBoundary>
        )}
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
