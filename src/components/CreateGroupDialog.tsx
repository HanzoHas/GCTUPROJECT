import React, { useState } from 'react';
import { Users, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { conversations as conversationsApi, users as usersApi } from '@/lib/convex';
import { useToast } from '@/components/ui/use-toast';
import { useChat } from '@/contexts/ChatContext';

interface UserOption {
  id: string;
  username: string;
  profilePicture?: string;
  status: "Available" | "Busy" | "In class" | "Offline";
  isOnline: boolean;
}

const CreateGroupDialog = () => {
  // Hooks must be called at the top level
  const { toast } = useToast();
  const { conversations, setCurrentConversation, refreshConversations } = useChat();
  
  // Dialog state
  const [open, setOpen] = useState(false);
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search for users
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await usersApi.searchUsers(searchQuery);
      
      // Remove users that are already selected
      const filteredResults = results.filter(
        user => !selectedUsers.some(selected => selected.id === user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Add user to selection
  const addUser = (user: UserOption) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter(u => u.id !== user.id));
    setSearchQuery('');
  };
  
  // Remove user from selection
  const removeUser = (userId: string) => {
    const removedUser = selectedUsers.find(u => u.id === userId);
    if (removedUser) {
      setSelectedUsers(prev => prev.filter(u => u.id !== userId));
      
      // Add back to search results if search term still matches
      if (
        searchQuery.trim() &&
        removedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        setSearchResults(prev => [...prev, removedUser]);
      }
    }
  };
  
  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 5MB',
        variant: 'destructive',
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarFile(result);
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };
  
  // Clear avatar
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };
  
  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedUsers.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one member',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create the group
      const result = await conversationsApi.createGroup(
        groupName,
        isPrivate,
        selectedUsers.map(u => u.id),
        avatarFile || undefined
      );
      
      if (result?.conversationId) {
        toast({
          title: 'Success',
          description: 'Group created successfully',
        });
        
        // Refresh conversations to make sure we have the latest data
        await refreshConversations();
        
        // Find the newly created conversation
        const newConversation = conversations.find(c => c.id === result.conversationId);
        if (newConversation) {
          setCurrentConversation(newConversation);
        }
        
        // Reset form
        setGroupName('');
        setIsPrivate(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUsers([]);
        
        // Close dialog
        setOpen(false);
      }
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form when dialog closes
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setGroupName('');
      setIsPrivate(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Group Conversation</DialogTitle>
          <DialogDescription>
            Create a new group conversation by adding members and setting group details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Group Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              {avatarPreview ? (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={clearAvatar}
                >
                  <X className="h-3 w-3" />
                </Button>
              ) : (
                <Label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground h-7 w-7 rounded-full flex items-center justify-center cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </Label>
              )}
            </div>
          </div>
          
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          
          {/* Privacy Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Private Group</Label>
              <p className="text-xs text-muted-foreground">
                Private groups require approval to join
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
          
          {/* Member Selection */}
          <div className="space-y-2">
            <Label>Add Members</Label>
            
            {/* Selected Members */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(user => (
                  <Badge key={user.id} variant="secondary" className="gap-1 pl-1">
                    <Avatar className="h-5 w-5 mr-1">
                      <AvatarImage src={user.profilePicture} />
                      <AvatarFallback className="text-xs">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.username}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-destructive/20 rounded-full"
                      onClick={() => removeUser(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* User Search */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                placeholder="Search users by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="absolute right-1 top-1 h-7"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[150px] border rounded-md p-2">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-md px-2 cursor-pointer"
                    onClick={() => addUser(user)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback>
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user.username}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            user.isOnline ? 'bg-chat-online' : 'bg-muted-foreground'
                          } mr-1`}></span>
                          {user.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    <Checkbox />
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isSubmitting || !groupName.trim() || selectedUsers.length === 0}
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog; 