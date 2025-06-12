import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppNavbar from './AppNavbar';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AnimatePresence, motion } from 'framer-motion';
import ChatView from '../views/ChatView';
import AnnouncementsView from '../views/AnnouncementsView';
import TrendingView from '../views/TrendingView';
import ProfileView from '../views/ProfileView';
import SettingsView from '../views/SettingsView';
import ChannelsView from '../views/ChannelsView';
import { MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';

const AppLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('chats');
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    // On mobile screens, hide sidebar by default
    if (isMobile) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
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
        if (activeView.startsWith('conversation-') || activeView.startsWith('channel-')) {
          return <ChatView />;
        }
        return (
          <motion.div 
            className="h-full flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center max-w-md mx-auto p-8 glass-card rounded-xl shadow-float">
              <div className="inline-flex items-center justify-center mb-6 bg-gradient-to-br from-primary/20 to-accent/20 h-24 w-24 rounded-[40%] shadow-glow-sm animate-pulse-glow">
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-full">
                  <MessageSquare className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 text-gradient-primary">Start Chatting</h3>
              <p className="text-muted-foreground text-lg mb-8">
                Choose a conversation from the sidebar to connect with your classmates and educators.
              </p>
              
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveView('chats')}
                  className="glass-effect border-primary/10 hover:border-primary/30 px-5"
                >
                  View Chats
                </Button>
                <Button 
                  onClick={() => setActiveView('channels')}
                  className="bg-gradient-to-r from-primary to-accent text-white px-5 hover:shadow-glow-sm"
                >
                  Explore Channels
                </Button>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Advanced Animated Background with Mesh + Noise */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-800/30 via-background to-accent-800/20 animate-gradient-xy"></div>
          <div className="absolute inset-0 bg-mesh-dense opacity-60"></div>
          <div className="absolute inset-0 bg-noise mix-blend-soft-light"></div>
          <div className="absolute inset-0 bg-grid opacity-[0.015]"></div>
        </div>
        
        <div className="glass-card shadow-float p-8 rounded-xl animate-fade-in-blur">
          <div className="h-16 w-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-center text-lg font-medium">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Advanced Animated Background with Mesh + Noise */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-800/30 via-background to-accent-800/20 animate-gradient-xy"></div>
        <div className="absolute inset-0 bg-mesh-dense opacity-60"></div>
        <div className="absolute inset-0 bg-noise mix-blend-soft-light"></div>
        <div className="absolute inset-0 bg-grid opacity-[0.015]"></div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/70 via-accent/70 to-primary/70"></div>
      <div className="absolute top-12 left-12 w-32 h-32 bg-primary-200 rounded-full blur-3xl opacity-20 animate-pulse-glow"></div>
      <div className="absolute bottom-12 right-12 w-40 h-40 bg-accent-300 rounded-full blur-3xl opacity-20 animate-pulse-glow"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/30 rounded-full blur-2xl animate-float-slow"></div>

      {/* App Layout */}
      <div className="relative z-10 flex flex-col h-screen">
        <AppNavbar 
          sidebarOpen={showSidebar} 
          setSidebarOpen={setShowSidebar} 
          setActiveView={setActiveView} 
        />
        
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {showSidebar && (
              <motion.div
                initial={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  "w-[280px] overflow-y-auto",
                  isMobile && "absolute z-50 h-[calc(100vh-4rem)]"
                )}
              >
                <AppSidebar
                  open={showSidebar}
                  activeView={activeView}
                  onChangeView={setActiveView}
                  onToggleSidebar={toggleSidebar}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <main className={cn(
            "flex-1 overflow-hidden glass-panel m-2 rounded-xl shadow-sm",
            !showSidebar && "w-full"
          )}>
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeView}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto rounded-xl"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
