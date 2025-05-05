import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import ChatMessage from '../chat/ChatMessage';
import MessageInput from '../chat/MessageInput';
import { Info, Shield, Users, Bell, BellOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import GroupCallButton from '../calls/GroupCallButton';

interface GroupChatViewProps {
  groupId: string;
  groupName: string;
}

const GroupChatView: React.FC<GroupChatViewProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    selectedMessage,
    setCurrentConversation,
    sendMessage,
    markAsRead,
    setSelectedMessage,
    deleteMessage,
    reactToMessage,
  } = useChat();
  
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const [joinRequests, setJoinRequests] = useState([
    { id: '1', name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200&h=200' },
    { id: '2', name: 'Maria Garcia', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200' },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedGroup = conversations.find(c => c.id === groupId);

  useEffect(() => {
    if (selectedGroup) {
      setCurrentConversation(selectedGroup);
      markAsRead(selectedGroup.id);
    }
  }, [selectedGroup, setCurrentConversation, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string, type: string) => {
    if (!content.trim()) return;
    
    sendMessage(
      content, 
      type as 'text' | 'image' | 'video' | 'audio', 
      replyingTo?.id
    );
    setReplyingTo(null);
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo({
        id: messageId,
        content: message.content,
      });
    }
  };

  const handleJoinRequest = (userId: string, accept: boolean) => {
    setJoinRequests(joinRequests.filter(request => request.id !== userId));
  };

  if (!selectedGroup) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4 bg-muted h-16 w-16 rounded-full">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Group not found</h3>
          <p className="text-muted-foreground">
            The requested group could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border rounded-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <div className="h-10 w-10 mr-3 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          
          <div>
            <h3 className="font-medium">{groupName}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>
                {selectedGroup.members.length} members
                {selectedGroup.typing && ` • ${selectedGroup.typing} is typing...`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <GroupCallButton 
            groupId={groupId}
            groupName={groupName}
            showText={false}
          />
          
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>{groupName}</SheetTitle>
                <SheetDescription>Group details and members</SheetDescription>
              </SheetHeader>
              
              <Tabs defaultValue="members" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="admin">Admin Panel</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {member.username}
                              {member.isAdmin && (
                                <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex items-center">
                                  <Shield className="h-3 w-3 mr-0.5" />
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span className={member.status === 'Available' ? 'online-indicator' : 'offline-indicator'} style={{ height: '0.5rem', width: '0.5rem' }}></span>
                              <span className="ml-1">{member.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="admin" className="space-y-4 mt-4">
                  {user?.isAdmin ? (
                    <>
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-2">Join Requests</h4>
                        {joinRequests.length > 0 ? (
                          <div className="space-y-3">
                            {joinRequests.map((request) => (
                              <div key={request.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={request.avatar} />
                                    <AvatarFallback>{request.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-sm">{request.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" onClick={() => handleJoinRequest(request.id, true)}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleJoinRequest(request.id, false)}>
                                    Deny
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No pending join requests.</p>
                        )}
                      </div>
                      
                      <div className="rounded-md border p-4">
                        <h4 className="font-medium mb-2">Group Settings</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Private Group</span>
                            <input type="checkbox" defaultChecked className="toggle" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Admin-only announcements</span>
                            <input type="checkbox" className="toggle" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-md bg-muted">
                      <p className="text-sm text-muted-foreground">
                        You need admin privileges to access these settings.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === user?.id}
              onReply={handleReply}
              onDelete={deleteMessage}
              onReact={reactToMessage}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 bg-muted h-16 w-16 rounded-full">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Welcome to {groupName}</h3>
              <p className="text-muted-foreground">
                This is the beginning of your group conversation.
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};

export default GroupChatView;
