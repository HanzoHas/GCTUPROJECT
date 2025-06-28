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
import { motion } from 'framer-motion';

interface SubchannelContentProps {
  channel: ChannelType;
  subchannel: SubchannelType;
}

export function SubchannelContent({ channel, subchannel }: SubchannelContentProps) {
  const { createChannelAnnouncement, channelAnnouncements, refreshAnnouncements, deleteChannelAnnouncement, canManageChannel } = useChannel();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]); // This would be replaced with real messages from context
  const [messageText, setMessageText] = useState('');
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, channelAnnouncements]);
  
  useEffect(() => {
    // This would be replaced with real message fetching
    if (subchannel.type === 'TEXT' || subchannel.type === 'CLASS') {
      // Mock data for demonstration
      setMessages([
        {
          id: '1',
          content: 'Welcome to the channel!',
          sender: { id: 'admin', name: 'Admin', avatar: '' },
          timestamp: Date.now() - 3600000
        }
      ]);
    }
    
    // Fetch announcements if it's an announcement channel
    if (subchannel.type === 'ANNOUNCEMENT') {
      refreshAnnouncements();
    }
  }, [subchannel]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    // This would send a real message in a complete implementation
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: messageText,
      sender: { id: user?.id || 'unknown', name: user?.username || 'Unknown', avatar: user?.profilePicture },
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id}
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
          </div>
        ))}
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
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button type="submit" size="icon" disabled={!messageText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 
