import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppNavbar from './AppNavbar';
import AppSidebar from './AppSidebar';
import ChatView from '../views/ChatView';
import AnnouncementsView from '../views/AnnouncementsView';
import ProfileView from '../views/ProfileView';
import SettingsView from '../views/SettingsView';
import TrendingView from '../views/TrendingView';
import ChannelsView from '../views/ChannelsView';
import { Button } from '../ui/button';

const AppLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [activeView, setActiveView] = useState('announcements');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const renderView = () => {
    switch (activeView) {
      case 'announcements':
        return <AnnouncementsView />;
      case 'chats':
        return <ChatView />;
      case 'trending':
        return <TrendingView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'channels':
      case 'lecturer-channels':
      case 'student-channels':
        return <ChannelsView />;
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 bg-muted h-16 w-16 rounded-full">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a chat from the sidebar to start messaging.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppNavbar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        setActiveView={setActiveView}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar 
          open={sidebarOpen} 
          activeView={activeView} 
          onChangeView={setActiveView}
          onToggleSidebar={toggleSidebar}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto transition-all duration-200 relative">
          {/* Remove duplicate mobile menu button since we already have one in the navbar */}
          
          <div className="p-3 sm:p-4 md:p-6 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full max-w-7xl mx-auto"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
