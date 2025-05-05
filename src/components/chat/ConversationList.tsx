import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, User, Plus, Clock, UserPlus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Conversation, useChat } from '@/contexts/ChatContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { users as usersApi, conversations as conversationsApi } from '@/lib/convex';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchResult {
  id: string;
  username: string;
  profilePicture?: string;
  profilePictureVersion?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

// Function to get proper display name for a conversation
const getConversationDisplayName = (conversation: any, currentUserId: string | undefined) => {
  if (conversation.isGroup) {
    return conversation.name;
  }
  
  // For direct conversations, show only the other user's name
  const otherMember = conversation.members.find((member: any) => member.id !== currentUserId);
  return otherMember ? otherMember.username : conversation.name;
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [username, setUsername] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { toast } = useToast();
  const { setCurrentConversation, refreshConversations } = useChat();
  const { user } = useAuth();

  const filteredConversations = conversations.filter(conversation => 
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.members.some(member => 
      member.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Search for users when the username input changes
  useEffect(() => {
    const searchUsers = async () => {
      if (username.length < 3) {
        setSearchResults([]);
        setSelectedUser(null);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await usersApi.searchUsers(username);
        setSearchResults(results);
        
        // Clear selected user if they're no longer in results
        if (selectedUser && !results.some(user => user.id === selectedUser.id)) {
          setSelectedUser(null);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    const debounceTimeout = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounceTimeout);
  }, [username, selectedUser]);

  const handleAddFriend = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user from the search results",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreatingChat(true);
      
      // Create or get existing direct conversation with this user
      const result = await conversationsApi.createOrGetDirectConversation(selectedUser.id);
      
      if (result?.conversationId) {
        toast({
          title: "Chat Created",
          description: `You can now chat with ${selectedUser.username}`
        });
        
        // Refresh conversations to get the new one
        await refreshConversations();
        
        // Find the newly created/existing conversation
        const targetConversation = conversations.find(c => c.id === result.conversationId);
        
        // If found, set it as the current conversation
        if (targetConversation) {
          setCurrentConversation(targetConversation);
        }
        
        // Close the dialog
        setShowAddFriend(false);
        setUsername('');
        setSearchResults([]);
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const selectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
  };

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-background">
      <div className="p-3 sm:p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center p-3 rounded-md cursor-pointer',
                currentConversation?.id === conversation.id ? 'bg-primary/10' : ''
              )}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="relative">
                {conversation.isGroup ? (
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                ) : (
                  <Avatar>
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{getConversationDisplayName(conversation, user?.id).substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                {conversation.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                )}
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{getConversationDisplayName(conversation, user?.id)}</span>
                  {conversation.lastMessage?.timestamp && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground truncate max-w-[80%]">
                    {conversation.typing ? (
                      <div className="flex items-center">
                        <span className="mr-1">{conversation.typing} is typing</span>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    ) : (
                      conversation.lastMessage?.content || 'No messages yet'
                    )}
                  </div>
                  
                  {conversation.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-muted rounded-full p-3 mb-3">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No conversations found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Try a different search term' : 'Add a friend to start chatting'}
            </p>
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4 border-t">
        <Dialog open={showAddFriend} onOpenChange={(open) => {
          setShowAddFriend(open);
          if (!open) {
            setUsername('');
            setSearchResults([]);
            setSelectedUser(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Find Users</DialogTitle>
              <DialogDescription>
                Search for a user by username to start a conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Search Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username (min 3 characters)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              {isSearching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  <ScrollArea className="h-[200px] border rounded-md">
                    <div className="p-2 space-y-2">
                      {searchResults.map(user => (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                            selectedUser?.id === user.id ? "bg-primary/10" : ""
                          )}
                          onClick={() => selectUser(user)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profilePicture ? `${user.profilePicture}?v=${user.profilePictureVersion || 1}` : undefined} />
                            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="font-medium">{user.username}</div>
                          </div>
                          {selectedUser?.id === user.id && (
                            <div className="ml-auto">
                              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <div className="h-3 w-3 rounded-full bg-primary"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {!isSearching && username.length >= 3 && searchResults.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No users found with that username
                </div>
              )}
              
              {selectedUser && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="text-sm font-medium mb-1">Selected User</div>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.profilePicture ? `${selectedUser.profilePicture}?v=${selectedUser.profilePictureVersion || 1}` : undefined} />
                      <AvatarFallback>
                        {selectedUser.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-2 font-medium">{selectedUser.username}</div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddFriend} 
                disabled={!selectedUser || isCreatingChat}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isCreatingChat ? 'Starting chat...' : (selectedUser ? `Chat with ${selectedUser.username}` : 'Start Chat')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ConversationList;
