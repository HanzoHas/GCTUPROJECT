import React from 'react';
import { Moon, Sun, BellRing, Bell, Lock, Monitor, Volume2, Globe, User, PaintBucket, AtSign, MessageSquare, Users, Save, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { users } from '@/lib/convex';

const SettingsView = () => {
  const {
    // Appearance
    theme,
    fontSize,
    chatBackground,
    toggleTheme,
    setFontSize,
    setChatBackground,
    
    // Notifications
    notificationsEnabled,
    soundEnabled,
    notificationSettings,
    toggleNotifications,
    toggleSound,
    updateNotificationSetting,
    
    // Privacy
    readReceipts,
    typingIndicators,
    onlineStatus,
    contactPreference,
    updatePrivacySetting,
    setContactPreference,
    
    // Language
    language,
    timeFormat,
    setLanguage,
    setTimeFormat,
    
    // Save
    saveSettings,
  } = useSettings();

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = React.useState("appearance");
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [profilePicture, setProfilePicture] = React.useState<string | undefined>(user?.profilePicture);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (user?.profilePicture) {
      setProfilePicture(user.profilePicture);
    }
  }, [user]);

  const handleSave = async () => {
    await saveSettings();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    const file = files[0];
    
    try {
      // Create a temporary preview immediately
      const objectUrl = URL.createObjectURL(file);
      setProfilePicture(objectUrl);
      
      // Convert to base64 for Convex upload
      const reader = new FileReader();
      
      const imageDataPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
      
      const imageData = await imageDataPromise;
      
      // Update user profile with base64 data
      const result = await users.updateProfile({
        profilePicture: imageData,
      });
      
      if (result.success) {
        // Refresh user to get the updated profile data
        await refreshUser();
        
        // Clean up temporary blob URL after successful upload and refresh
        URL.revokeObjectURL(objectUrl);
        
        // Use the URL from the refreshed user data with cache busting
        const updatedUser = await users.getProfile();
        if (updatedUser?.profilePicture) {
          const timestamp = new Date().getTime();
          const cacheBustedUrl = updatedUser.profilePicture.includes('?')
            ? `${updatedUser.profilePicture}&t=${timestamp}`
            : `${updatedUser.profilePicture}?t=${timestamp}`;
          setProfilePicture(cacheBustedUrl);
        }
        
        toast({
          title: 'Success',
          description: 'Profile picture updated successfully',
        });
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      // Clean up any temporary blob URL on error
      if (profilePicture && profilePicture.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicture);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture',
        variant: 'destructive'
      });
      // Reset to previous profile picture on error
      setProfilePicture(user?.profilePicture);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
        <Button 
          onClick={handleSave} 
          className="flex items-center"
          size={isMobile ? "sm" : "default"}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="appearance" value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
            <TabsTrigger value="profile" className="px-2 sm:px-4">
              <User className="h-4 w-4 mr-2 hidden sm:inline-block" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="px-2 sm:px-4">
              <PaintBucket className="h-4 w-4 mr-2 hidden sm:inline-block" />
              <span>Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-2 sm:px-4">
              <BellRing className="h-4 w-4 mr-2 hidden sm:inline-block" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="px-2 sm:px-4">
              <Lock className="h-4 w-4 mr-2 hidden sm:inline-block" />
              <span>Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="px-2 sm:px-4">
              <Globe className="h-4 w-4 mr-2 hidden sm:inline-block" />
              <span>Language</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>
        
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    {profilePicture ? (
                      <AvatarImage 
                        src={profilePicture} 
                        alt={user?.username} 
                        key={user?.profilePictureVersion || Date.now()}
                        onError={(e) => {
                          console.log('Error loading profile image, falling back to initials');
                          setProfilePicture(undefined);
                        }}
                      />
                    ) : (
                      <AvatarFallback className="text-3xl">
                        {user?.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
                {uploadingImage && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold">{user?.username}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how ConnectLearnNow looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Theme</Label>
                  <div className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Font Size</Label>
                <RadioGroup 
                  value={fontSize} 
                  onValueChange={setFontSize} 
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large">Large</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-4">
                <Label>Chat Background</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    className={`aspect-video rounded-md bg-white dark:bg-gray-800 border-2 ${
                      chatBackground === 'default' ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setChatBackground('default')}
                    aria-label="Default background"
                  ></button>
                  <button
                    className={`aspect-video rounded-md bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 border-2 ${
                      chatBackground === 'gradient1' ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setChatBackground('gradient1')}
                    aria-label="Gradient 1 background"
                  ></button>
                  <button
                    className={`aspect-video rounded-md bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900 border-2 ${
                      chatBackground === 'gradient2' ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setChatBackground('gradient2')}
                    aria-label="Gradient 2 background"
                  ></button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable or disable all notifications
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Sound</Label>
                  <div className="text-sm text-muted-foreground">
                    Play sounds for new messages
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={toggleSound}
                  disabled={!notificationsEnabled}
                />
              </div>
              
              <div className="space-y-4">
                <Label>Notification Settings</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-messages" className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      New messages
                    </Label>
                    <Switch
                      id="new-messages"
                      checked={notificationSettings.newMessages}
                      onCheckedChange={(checked) => updateNotificationSetting('newMessages', checked)}
                      disabled={!notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mentions" className="flex items-center">
                      <AtSign className="h-4 w-4 mr-2" />
                      Mentions
                    </Label>
                    <Switch
                      id="mentions"
                      checked={notificationSettings.mentions}
                      onCheckedChange={(checked) => updateNotificationSetting('mentions', checked)}
                      disabled={!notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="group-invites" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Group invites
                    </Label>
                    <Switch
                      id="group-invites"
                      checked={notificationSettings.groupInvites}
                      onCheckedChange={(checked) => updateNotificationSetting('groupInvites', checked)}
                      disabled={!notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="announcements" className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      Announcements
                    </Label>
                    <Switch
                      id="announcements"
                      checked={notificationSettings.announcements}
                      onCheckedChange={(checked) => updateNotificationSetting('announcements', checked)}
                      disabled={!notificationsEnabled}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Control who can see your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Read Receipts</Label>
                  <div className="text-sm text-muted-foreground">
                    Let others know when you've read their messages
                  </div>
                </div>
                <Switch
                  checked={readReceipts}
                  onCheckedChange={(checked) => updatePrivacySetting('readReceipts', checked)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Typing Indicators</Label>
                  <div className="text-sm text-muted-foreground">
                    Show when you're typing a message
                  </div>
                </div>
                <Switch
                  checked={typingIndicators}
                  onCheckedChange={(checked) => updatePrivacySetting('typingIndicators', checked)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-base">Online Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Show others when you're online
                  </div>
                </div>
                <Switch
                  checked={onlineStatus}
                  onCheckedChange={(checked) => updatePrivacySetting('onlineStatus', checked)}
                />
              </div>
              
              <div className="space-y-4">
                <Label>Who can contact me?</Label>
                <RadioGroup 
                  value={contactPreference} 
                  onValueChange={setContactPreference} 
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="everyone" id="everyone" />
                    <Label htmlFor="everyone">Everyone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="friends" id="friends" />
                    <Label htmlFor="friends">Friends only</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nobody" id="nobody" />
                    <Label htmlFor="nobody">Nobody</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="language" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Language & Format</CardTitle>
              <CardDescription>
                Set your preferred language and time format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Time Format</Label>
                <RadioGroup 
                  value={timeFormat} 
                  onValueChange={setTimeFormat} 
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="12h" />
                    <Label htmlFor="12h">12-hour (AM/PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="24h" />
                    <Label htmlFor="24h">24-hour</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsView;
