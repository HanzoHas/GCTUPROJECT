import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { ChevronDown, Home, Users, MessageSquare, User, Settings, Search, Plus, Menu, X, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { conversations as conversationsApi } from '@/lib/convex';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasSubMenu?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  rightContent?: React.ReactNode;
}

const SidebarItem = ({
  icon,
  label,
  active = false,
  hasSubMenu = false,
  expanded = false,
  onClick,
  rightContent,
}: SidebarItemProps) => {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
      className={cn(
        'flex items-center px-3 py-2 rounded-md cursor-pointer',
        active ? 'bg-primary/10 text-primary' : 'text-foreground'
      )}
      onClick={onClick}
    >
      <div className="mr-3 text-current">{icon}</div>
      <span className="flex-1">{label}</span>
      {rightContent}
      {hasSubMenu && (
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', expanded && 'transform rotate-180')}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
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

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div 
            className="fixed inset-0 bg-black/50 z-30"
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
          "fixed inset-y-0 left-0 z-40 w-[280px] bg-background border-r shadow-sm flex flex-col",
          "md:relative md:z-0",
          !open && "pointer-events-none"
        )}
        initial={isMobile ? "closed" : "open"}
        animate={open ? "open" : "closed"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.profilePicture ? `${user.profilePicture}?v=${user.profilePictureVersion || 1}` : undefined} alt={user?.username} />
              <AvatarFallback>
                {user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">{user?.username}</h3>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${
                  user?.status === 'Available' ? 'bg-green-500' :
                  user?.status === 'Busy' ? 'bg-red-500' :
                  'bg-yellow-500'
                } mr-1.5`}></span>
                {user?.status}
              </div>
            </div>
          </div>
          
          {/* Close button for mobile */}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search friends..."
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="space-y-1">
            <SidebarItem
              icon={<Home className="h-5 w-5" />}
              label="Announcements"
              active={activeView === 'announcements'}
              onClick={() => handleNavItemClick('announcements')}
            />
            <SidebarItem
              icon={<MessageSquare className="h-5 w-5" />}
              label="Chats"
              active={activeView === 'chats'}
              onClick={() => handleNavItemClick('chats')}
            />
            <SidebarItem
              icon={<TrendingUp className="h-5 w-5" />}
              label="Trending"
              active={activeView === 'trending'}
              onClick={() => handleNavItemClick('trending')}
            />
            <SidebarItem
              icon={<User className="h-5 w-5" />}
              label="Profile"
              active={activeView === 'profile'}
              onClick={() => handleNavItemClick('profile')}
            />
            <SidebarItem
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              active={activeView === 'settings'}
              onClick={() => handleNavItemClick('settings')}
            />
          </nav>
        </div>
        
        <div className="p-4 border-t text-center">
          <div className="text-xs text-muted-foreground">ConnectLearnNow</div>
        </div>
      </motion.aside>
    </>
  );
};

export default AppSidebar;
