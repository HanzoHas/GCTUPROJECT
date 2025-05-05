import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { settings as settingsApi } from '@/lib/convex/settings';
import { defaultSettings } from '../../convex/settings';

interface SettingsContextType {
  // Appearance
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  chatBackground: 'default' | 'gradient1' | 'gradient2';
  
  // Notifications
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  notificationSettings: {
    newMessages: boolean;
    mentions: boolean;
    groupInvites: boolean;
    announcements: boolean;
  };
  
  // Privacy
  readReceipts: boolean;
  typingIndicators: boolean;
  onlineStatus: boolean;
  contactPreference: 'everyone' | 'friends' | 'nobody';
  
  // Language
  language: string;
  timeFormat: '12h' | '24h';
  
  // Actions
  toggleTheme: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setChatBackground: (background: 'default' | 'gradient1' | 'gradient2') => void;
  toggleNotifications: (enabled: boolean) => void;
  toggleSound: (enabled: boolean) => void;
  updateNotificationSetting: (key: keyof SettingsContextType['notificationSettings'], value: boolean) => void;
  updatePrivacySetting: (key: keyof Pick<SettingsContextType, 'readReceipts' | 'typingIndicators' | 'onlineStatus'>, value: boolean) => void;
  setContactPreference: (preference: 'everyone' | 'friends' | 'nobody') => void;
  setLanguage: (language: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  saveSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Omit<SettingsContextType, 'actions'>>(defaultSettings);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await settingsApi.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      }
    };
    
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const result = await settingsApi.updateSettings(settings);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const value: SettingsContextType = {
    ...settings,
    toggleTheme: () => setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' })),
    setFontSize: (size) => setSettings(prev => ({ ...prev, fontSize: size })),
    setChatBackground: (background) => setSettings(prev => ({ ...prev, chatBackground: background })),
    toggleNotifications: (enabled) => setSettings(prev => ({ ...prev, notificationsEnabled: enabled })),
    toggleSound: (enabled) => setSettings(prev => ({ ...prev, soundEnabled: enabled })),
    updateNotificationSetting: (key, value) => setSettings(prev => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [key]: value }
    })),
    updatePrivacySetting: (key, value) => setSettings(prev => ({ ...prev, [key]: value })),
    setContactPreference: (preference) => setSettings(prev => ({ ...prev, contactPreference: preference })),
    setLanguage: (language) => setSettings(prev => ({ ...prev, language })),
    setTimeFormat: (format) => setSettings(prev => ({ ...prev, timeFormat: format })),
    saveSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 