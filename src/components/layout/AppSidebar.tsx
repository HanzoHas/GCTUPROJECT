import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useChannel } from '@/contexts/ChannelContext';
import { ChevronDown, Home, Users, MessageSquare, User, Settings, Search, Plus, Menu, X, TrendingUp, Book, GraduationCap, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { conversations as conversationsApi } from '@/lib/convex';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, School } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasSubMenu?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  rightContent?: React.ReactNode;
  badge?: number;
}

const SidebarItem = ({
  icon,
  label,
  active = false,
  hasSubMenu = false,
  expanded = false,
  onClick,
  rightContent,
  badge,
}: SidebarItemProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ x: 2 }}
      className={cn(
        'flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-1.5 relative group',
        active 
          ? 'bg-gradient-to-r from-primary/80 to-primary text-primary-foreground shadow-md' 
          : 'text-foreground hover:bg-primary/10'
      )}
      onClick={onClick}
    >
      {active && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className={cn("mr-3", active ? "text-current" : "text-muted-foreground")}>{icon}</div>
      <span className="flex-1 font-medium text-sm truncate">{label}</span>
      
      {badge !== undefined && badge > 0 && (
        <span className="bg-primary/15 text-primary text-xs font-semibold rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      
      {rightContent}
      
      {hasSubMenu && (
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200', 
            expanded && 'transform rotate-180',
            active ? "text-current" : "text-muted-foreground"
          )}
        />
      )}
    </motion.div>
  );
};

interface AppSidebarProps {
  open: boolean;
  activeView: string;
  onChangeView: (view: string) => void;
  onToggleSidebar: () => void;
}

const AppSidebar = ({ open, activeView, onChangeView, onToggleSidebar }: AppSidebarProps) => {
  const { user } = useAuth();
  const { conversations, setCurrentConversation } = useChat();
  const { userIsLecturer, lecturerChannels, userChannels } = useChannel();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    directMessages: true,
    lecturerChannels: true,
    studentChannels: true,
  });
  
  // Check for mobile screens
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // For mobile: close sidebar when selecting an item
  const handleNavItemClick = (view: string) => {
    onChangeView(view);
    if (isMobile) {
      onToggleSidebar();
    }
  };

  // Variants for sidebar animations
  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof conversation.lastMessage === 'object' && 
      conversation.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredChannels = userChannels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLecturerChannels = filteredChannels.filter((channel) => channel.type === "CLASS" || channel.type === "ANNOUNCEMENT");
  const filteredStudentChannels = filteredChannels.filter((channel) => channel.type === "TEXT" || channel.type === "CATEGORY");

  const mainNavItems = [
    { id: 'chats', label: 'Chats', icon: <MessageSquare size={18} /> },
    { id: 'channels', label: 'Channels', icon: <BookOpen size={18} /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell size={18} /> },
    { id: 'trending', label: 'Trending', icon: <TrendingUp size={18} /> },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[280px] glass-card backdrop-blur-md flex flex-col h-screen overflow-hidden",
          "border-r border-primary/10 shadow-float",
          "md:relative md:z-0",
          !open && "pointer-events-none"
        )}
        initial={isMobile ? "closed" : "open"}
        animate={open ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-noise mix-blend-soft-light opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40"></div>
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full blur-3xl opacity-10 animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent-300 rounded-full blur-3xl opacity-10 animate-pulse-glow"></div>
        
        <div className="flex items-center justify-between p-4 border-b border-primary/10 relative z-10">
          <div className="flex items-center gap-3">
            <Avatar 
              variant="circle" 
              size="md" 
              className="border-2 border-primary/20 shadow-glow-sm"
              status={
                user?.status === 'Available' ? 'online' : 
                user?.status === 'Busy' ? 'busy' :
                user?.status === 'Away' ? 'away' : 'offline'
              }
            >
              <AvatarImage 
                src={user?.profilePicture ? `${user.profilePicture}?v=${user.profilePictureVersion || 1}` : undefined} 
                alt={user?.username} 
              />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm text-gradient-primary">{user?.username}</h3>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={cn(
                  "text-xs",
                  user?.status === 'Available' ? 'text-emerald-500' :
                  user?.status === 'Busy' ? 'text-red-500' :
                  'text-amber-500'
                )}>
                  {user?.status || 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Close button for mobile */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden hover:bg-primary/10 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-y-auto py-4 px-3 relative z-10 h-full">
          <div className="relative mb-4 px-1">
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-9 bg-primary/5 border-primary/10 focus:border-primary/30 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="mb-6 mt-2">
            <h3 className="text-xs font-semibold text-primary/70 uppercase tracking-wider px-3 mb-3">
              Main Menu
            </h3>
            <nav className="space-y-1.5">
              {mainNavItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeView === item.id}
                  onClick={() => handleNavItemClick(item.id)}
                  badge={item.id === 'chats' 
                    ? conversations.filter(c => c.unreadCount && c.unreadCount > 0).length 
                    : item.id === 'announcements' ? 3 : undefined}
                />
              ))}
            </nav>
          </div>
            
          {/* Study Channels Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-primary/70 uppercase tracking-wider px-3 mb-3 flex justify-between items-center">
              Study Channels
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </h3>
            
            <nav className="space-y-1.5">
              <SidebarItem
                icon={<Book className="h-5 w-5" />}
                label="All Channels"
                active={activeView === 'channels'}
                onClick={() => handleNavItemClick('channels')}
              />
              
              {userIsLecturer && (
                <SidebarItem
                  icon={<GraduationCap className="h-5 w-5" />}
                  label="My Lecture Channels"
                  active={activeView === 'lecturer-channels'}
                  onClick={() => handleNavItemClick('lecturer-channels')}
                  badge={filteredLecturerChannels.length}
                />
              )}
              
              {/* Popular channels */}
              {filteredStudentChannels.slice(0, 3).map(channel => (
                <SidebarItem
                  key={channel._id}
                  icon={<Users className="h-5 w-5" />}
                  label={channel.name}
                  active={activeView === `channel-${channel._id}`}
                  onClick={() => {
                    handleNavItemClick(`channel-${channel._id}`);
                  }}
                />
              ))}
            </nav>
          </div>
          
          {/* Direct Messages Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-primary/70 uppercase tracking-wider px-3 mb-3 flex justify-between items-center">
              Direct Messages
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </h3>
            
            <nav className="space-y-1.5">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ x: 2 }}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 mb-1.5 relative',
                      activeView === `conversation-${conversation.id}` 
                        ? 'bg-gradient-to-r from-primary/80 to-primary text-primary-foreground shadow-md' 
                        : 'text-foreground hover:bg-primary/10'
                    )}
                    onClick={() => {
                      setCurrentConversation(conversation);
                      handleNavItemClick(`conversation-${conversation.id}`);
                    }}
                  >
                    {activeView === `conversation-${conversation.id}` && (
                      <motion.div 
                        layoutId="activeConversation"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <div className="relative mr-3">
                      <Avatar className="h-8 w-8 border border-primary/10">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                          {conversation.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.members && conversation.members[0] && (
                        <span className={cn(
                          "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-1 ring-card",
                          conversation.members[0].isOnline ? 'bg-status-online' : 'bg-status-offline'
                        )}></span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {conversation.name}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className={cn(
                            "text-xs rounded-full w-5 h-5 flex items-center justify-center",
                            activeView === `conversation-${conversation.id}`
                              ? "bg-white/20"
                              : "bg-primary text-primary-foreground"
                          )}>
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate text-muted-foreground">
                        {typeof conversation.lastMessage === 'string' 
                          ? conversation.lastMessage 
                          : conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-3 px-3 rounded-lg bg-primary/5">
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-1 text-primary"
                    onClick={() => handleNavItemClick('channels')}
                  >
                    Start a new conversation
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </ScrollArea>
        
        {/* Bottom section */}
        <div className="p-4 border-t border-primary/10 flex justify-between items-center bg-primary/5 backdrop-blur-sm relative z-10">
          <div className="flex gap-2">
            {secondaryNavItems.map((item) => (
              <TooltipProvider key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full hover:bg-primary/10",
                        activeView === item.id && "bg-primary/15 text-primary"
                      )}
                      onClick={() => handleNavItemClick(item.id)}
                    >
                      {item.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{item.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          <span className="text-xs text-primary/40 font-medium">
            v1.2.0
          </span>
        </div>
      </motion.aside>
    </>
  );
};

export default AppSidebar;
