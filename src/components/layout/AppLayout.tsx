import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppNavbar from './AppNavbar';
import AppSidebar from './AppSidebar';
import ChatView from '../views/ChatView';
import AnnouncementsView from '../views/AnnouncementsView';
import ProfileView from '../views/ProfileView';
import SettingsView from '../views/SettingsView';
import GroupChatView from '../views/GroupChatView';
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
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'group-math':
        return <GroupChatView groupId="2" groupName="Math Study Group" />;
      case 'group-science':
        return <GroupChatView groupId="science" groupName="Science Club" />;
      case 'group-history':
        return <GroupChatView groupId="history" groupName="History Discussion" />;
      default:
        return <AnnouncementsView />;
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
