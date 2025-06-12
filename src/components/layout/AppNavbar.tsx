import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Bell, Settings, User, LogOut, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import NotificationDropdown from '@/components/NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { useDebounce } from '@/hooks/use-debounce';
import { CommandDialog } from '@/components/ui/command';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AppNavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
}

const AppNavbar = ({ sidebarOpen, setSidebarOpen, setActiveView }: AppNavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCommandK, setShowCommandK] = useState<boolean>(false);

  // Add scroll event listener to change navbar appearance on scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setShowCommandK(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Mock search functionality
    if (debouncedSearchQuery.length > 1) {
      // Simulate API call/search
      setSearchResults([
        { type: 'user', id: '1', name: 'John Smith', role: 'Student' },
        { type: 'channel', id: '1', name: 'Computer Science 101' },
        { type: 'message', id: '1', content: 'Has anyone completed the assignment?', user: 'Jane Doe' }
      ].filter(item => 
        item.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
        item.content?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      ));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  const handleProfileClick = () => {
    setActiveView('profile');
  };

  const handleSettingsClick = () => {
    setActiveView('settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur-md px-3 sm:px-5 md:px-6 transition-all duration-200",
        isScrolled && "shadow-md bg-background/98"
      )}
    >
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-3 md:hidden hover:bg-muted/50 transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? 
            <X className="h-5 w-5 text-foreground transition-all duration-200" /> : 
            <Menu className="h-5 w-5 text-foreground transition-all duration-200" />
          }
        </Button>
        
        <div className={cn("flex items-center gap-2", sidebarOpen && "md:hidden lg:flex")}>
          <span className="bg-primary h-6 w-1.5 rounded-full hidden sm:block mr-2"></span>
          <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ConnectLearnNow
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted/50 transition-colors"
          onClick={() => setActiveView('notifications')}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse"></span>
        </Button>
        
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={user?.profilePicture ? `${user.profilePicture}?v=${user.profilePictureVersion || 1}` : undefined} 
                    alt={user?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={user?.profilePicture ? `${user.profilePicture}?v=${user.profilePictureVersion || 1}` : undefined} 
                  alt={user?.username || 'User'} 
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user?.username || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default AppNavbar;
