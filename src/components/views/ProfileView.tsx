import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Settings, Grid, Clock, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { users, activities } from '@/lib/convex';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

// Define the status type for better type safety
type UserStatus = 'Available' | 'Busy' | 'In class' | 'Offline';

// Define activity type
interface UserActivity {
  id: string;
  type: 'joinedGroup' | 'startedConversation' | 'profileUpdate' | 'custom';
  description: string;
  timestamp: number;
  relatedEntityId?: string;
  relatedEntityType?: 'conversation' | 'user' | 'announcement';
}

const ProfileView = () => {
  const { user, logout, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState<UserStatus>(user?.status as UserStatus || 'Available');
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setStatus(user.status as UserStatus || 'Available');
      setProfilePicture(user.profilePicture);
    }
  }, [user]);

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const fetchedActivities = await activities.getUserActivities(10);
        setUserActivities(fetchedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your recent activities',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [toast]);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const result = await users.updateProfile({
        username,
        status,
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
        
        // Refresh user data
        await refreshUser();
        setEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a type-safe handler for the RadioGroup
  const handleStatusChange = (value: string) => {
    // Only set the status if it's a valid UserStatus
    if (value === 'Available' || value === 'Busy' || value === 'In class' || value === 'Offline') {
      setStatus(value);
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return format(date, 'MMM d, yyyy');
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'joinedGroup':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        );
      case 'startedConversation':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'profileUpdate':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  // Redirect to settings for profile picture updates
  const handleProfilePictureHelp = () => {
    toast({
      title: 'Update Profile Picture',
      description: 'You can update your profile picture in the Settings page under the Profile tab.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <Avatar className="h-32 w-32">
                    {user?.profilePicture ? (
                      <AvatarImage 
                        src={`${user.profilePicture}?v=${user.profilePictureVersion || 1}`} 
                        alt={user?.username || 'Profile'} 
                      />
                    ) : (
                      <AvatarFallback className="text-3xl">
                        {user?.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                <h2 className="text-xl font-semibold mb-1">{user?.username}</h2>
                <div className="flex items-center mb-6 text-sm text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${
                    status === 'Available' ? 'bg-chat-online' :
                    status === 'Busy' ? 'bg-destructive' :
                    'bg-chat-typing'
                  } mr-1.5`}></span>
                  {status}
                </div>
                
                <div className="w-full space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-start" 
                    onClick={() => setEditing(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {editing ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <RadioGroup value={status} onValueChange={handleStatusChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Available" id="available" />
                          <Label htmlFor="available" className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-chat-online mr-1.5"></span>
                            Available
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Busy" id="busy" />
                          <Label htmlFor="busy" className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-destructive mr-1.5"></span>
                            Busy
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="In class" id="in-class" />
                          <Label htmlFor="in-class" className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-chat-typing mr-1.5"></span>
                            In class
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleProfileUpdate}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Tabs defaultValue="activity">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="media">
                  <Grid className="h-4 w-4 mr-2" />
                  Shared Media
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your recent interactions and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isLoadingActivities ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading activities...
                        </div>
                      ) : userActivities.length > 0 ? (
                        userActivities.map(activity => (
                          <div key={activity.id} className="border rounded-md p-4">
                            <div className="flex items-start">
                              <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                {getActivityIcon(activity.type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{activity.description}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTimestamp(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent activities to show
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="media" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Shared Media</CardTitle>
                    <CardDescription>
                      Media you've shared across conversations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {/* This would be populated with actual shared media */}
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
                        No media shared yet
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
