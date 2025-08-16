import React, { useState, useEffect, useRef } from 'react';
import { SubchannelType, ChannelType, useChannel, ChannelAnnouncementType } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Send, Image, Paperclip, Smile, Plus, Trash2, AudioLines, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GroupCallButton from '@/components/calls/GroupCallButton';
import { useZego } from '@/contexts/ZegoContext';
import { useMutation, useQuery } from 'convex/react';
import { api, convex } from '@/lib/convex';
import type { Id } from '@/convex/_generated/dataModel';

interface SubchannelContentProps {
  channel: ChannelType;
  subchannel: SubchannelType;
}

export function SubchannelContent({ channel, subchannel }: SubchannelContentProps) {
  const { createChannelAnnouncement, channelAnnouncements, refreshAnnouncements, deleteChannelAnnouncement, canManageChannel } = useChannel();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInCall } = useZego();
  const [messageText, setMessageText] = useState('');
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useMutation(api.messages.sendMessage);

  // Get conversation ID for this subchannel
  const conversationQuery = useQuery(api.conversations.getConversationBySubchannel, 
    conversationId === null ? {
      sessionToken: localStorage.getItem('sessionToken') || '',
      subchannelId: subchannel._id as Id<"studySubchannels">
    } : "skip"
  );

  // Get messages using real-time subscription
  const messages = useQuery(api.messages.getMessages, 
    conversationId ? {
      sessionToken: localStorage.getItem('sessionToken') || '',
      conversationId: conversationId
    } : "skip"
  ) || [];
  
  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, channelAnnouncements]);
  
  // Function to fetch messages for the current subchannel
  const fetchMessages = async () => {
    try {
      if (subchannel.type !== 'TEXT' && subchannel.type !== 'CLASS') return;
      
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) return;
      
      // Get the conversation ID for this subchannel using the backend query
      const conversationResult = await convex.query(api.conversations.getConversationBySubchannel, {
        sessionToken,
        subchannelId: subchannel._id as Id<"studySubchannels">
      });
      
      // Use the Convex API to fetch messages for this subchannel
      const response = await convex.query(api.messages.getMessages, {
        sessionToken,
        conversationId: conversationResult.conversationId
      });
      
      if (response && Array.isArray(response)) {
        // Messages are already filtered by conversationId on the server
        setMessages(response);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };
  
  // Set up real-time subscription for messages
  useEffect(() => {
    if (subchannel.type === 'TEXT' || subchannel.type === 'CLASS') {
      fetchMessages();
      
      // Set up polling for real-time updates (every 2 seconds)
      const intervalId = setInterval(fetchMessages, 2000);
      
      return () => clearInterval(intervalId);
    }
    
    // Fetch announcements if it's an announcement channel
    if (subchannel.type === 'ANNOUNCEMENT') {
      refreshAnnouncements();
    }
  }, [subchannel]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission and page refresh
    if (!messageText.trim() || !conversationId) return;
    
    try {
      await sendMessage({
        sessionToken: localStorage.getItem('sessionToken') || '',
        conversationId: conversationId,
        content: messageText,
        type: 'text'
      });
      
      // Clear the message text - the message will appear via real-time subscription
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createChannelAnnouncement(
        channel._id,
        subchannel._id,
        announcementTitle,
        announcementContent,
        'text'
      );
      
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setShowNewAnnouncement(false);
      toast({
        title: "Success",
        description: "Announcement created successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive"
      });
    }
  };
  
  const renderAnnouncementContent = (announcement: ChannelAnnouncementType) => {
    switch (announcement.type) {
      case 'image':
        return (
          <img
            src={announcement.content}
            alt={announcement.title}
            className="w-full h-auto rounded-md object-cover mb-4"
          />
        );
      case 'video':
        return (
          <video
            src={announcement.content}
            controls
            className="w-full h-auto rounded-md mb-4"
          />
        );
      case 'audio':
        return (
          <audio
            src={announcement.content}
            controls
            className="w-full mb-4"
          />
        );
      default:
        return <p className="mb-4">{announcement.content}</p>;
    }
  };
  
  // Render based on subchannel type
  if (subchannel.type === 'ANNOUNCEMENT') {
    return (
      <div className="h-full flex flex-col p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Announcements</h2>
          {canManageChannel(channel._id) && (
            <Dialog open={showNewAnnouncement} onOpenChange={setShowNewAnnouncement}>
              <DialogTrigger asChild>
                <Button>Create Announcement</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>
                    Create a new announcement for this subchannel.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleCreateAnnouncement}>
                    Post Announcement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {channelAnnouncements.length > 0 ? (
            channelAnnouncements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={announcement.author.avatar} />
                          <AvatarFallback>{announcement.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          <CardDescription>
                            Posted by {announcement.author.name} • {formatDistanceToNow(announcement.timestamp, { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {canManageChannel(channel._id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteChannelAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    {renderAnnouncementContent(announcement)}
                  </CardContent>
                  
                  <CardFooter className="flex justify-end gap-2 pt-0">
                    <Button variant="ghost" size="sm">Share</Button>
                    <Button variant="ghost" size="sm">Save</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center bg-muted h-16 w-16 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
              <p className="text-muted-foreground mb-6">
                {canManageChannel(channel._id)
                  ? 'Create the first announcement to share with everyone.'
                  : 'Check back soon for updates.'}
              </p>
              
              {canManageChannel(channel._id) && (
                <Button
                  onClick={() => setShowNewAnnouncement(true)}
                >
                  Create First Announcement
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // For TEXT and CLASS channels (chat functionality)
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>#{subchannel.name}</span>
          {subchannel.description && (
            <span className="text-sm font-normal text-muted-foreground">
              {subchannel.description}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {/* Only show call buttons if user is channel owner */}
          {canManageChannel(channel._id) && (
            <>
              <GroupCallButton
                channelId={channel._id}
                subchannelId={subchannel._id}
                channelName={subchannel.name}
                variant="audio"
                isChannelOwner={canManageChannel(channel._id)}
              />
              <GroupCallButton
                channelId={channel._id}
                subchannelId={subchannel._id}
                channelName={subchannel.name}
                variant="video"
                isChannelOwner={canManageChannel(channel._id)}
              />
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex max-w-[80%]">
                {message.sender.id !== user?.id && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src={message.sender.avatar} />
                    <AvatarFallback>{message.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  {message.sender.id !== user?.id && (
                    <p className="text-xs text-muted-foreground mb-1">{message.sender.name}</p>
                  )}
                  <div className={`rounded-lg px-3 py-2 ${message.sender.id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message.content}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex-none p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder={`Send a message in #${subchannel.name}`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="pr-12"
              disabled={isInCall} // Disable input when in a call
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            disabled={!messageText.trim() || isInCall}
            className="transition-all duration-200 hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
