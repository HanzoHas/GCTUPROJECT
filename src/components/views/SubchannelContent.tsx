import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SubchannelType, ChannelType, useChannel, ChannelAnnouncementType } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Send, Paperclip, Smile, Trash2, ArrowLeft, Image } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import GroupCallButton from '@/components/calls/GroupCallButton';
import { useZego } from '@/contexts/ZegoContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { getSessionToken } from '@/lib/utils';
import { MessageSkeleton } from '@/components/ui/loading-skeleton';
import type { Id } from '../../../convex/_generated/dataModel';

interface SubchannelContentProps {
  channel: ChannelType;
  subchannel: SubchannelType;
  onBack?: () => void;
}

export function SubchannelContent({ channel, subchannel, onBack }: SubchannelContentProps) {
  const { createChannelAnnouncement, channelAnnouncements, refreshAnnouncements, deleteChannelAnnouncement, canManageChannel } = useChannel();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInCall } = useZego();
  const [messageText, setMessageText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useMutation(api.messages.sendMessage);
  const uploadMedia = useMutation(api.utils.mediaWrapper.uploadMediaSync);
  
  // Memoize session token to prevent unnecessary re-renders
  const sessionToken = useMemo(() => getSessionToken(), []);

  // Get conversation ID for this subchannel
  const conversationQuery = useQuery(api.conversations.getConversationBySubchannel, {
    sessionToken,
    subchannelId: subchannel._id as Id<"studySubchannels">
  });

  // Get messages using real-time subscription
  const conversationId = conversationQuery?.conversationId;
  const messages = useQuery(api.messages.getMessages, conversationId ? {
    sessionToken,
    conversationId,
    limit: 50
  } : "skip") || [];

  // Debug log to check message types
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Messages:', messages.map(m => ({ id: m.id, type: m.type, content: m.content.substring(0, 50) })));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Refresh announcements when subchannel changes to announcement type
  useEffect(() => {
    if (subchannel.type === 'ANNOUNCEMENT') {
      refreshAnnouncements();
    }
  }, [subchannel.type, refreshAnnouncements]);
  
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !conversationId || !user) return;

    try {
      await sendMessage({
        sessionToken,
        conversationId,
        content: messageText.trim(),
        type: "text"
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [messageText, conversationId, user, sendMessage, toast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !conversationId || !user) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload to Cloudinary via Convex
          const uploadResult = await uploadMedia({ base64Data });
          
          if (uploadResult?.url) {
            // Send message with image
            await sendMessage({
              sessionToken,
              conversationId,
              content: uploadResult.url,
              type: "image"
            });
            
            toast({
              title: "Success",
              description: "Image uploaded successfully!",
            });
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
        } finally {
          setUploadingFile(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to process file:', error);
      setUploadingFile(false);
      toast({
        title: "Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    }
  }, [conversationId, user, sendMessage, uploadMedia, toast]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Announcements</h2>
          </div>
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
    <div className="w-full h-full flex flex-col md:col-span-7 lg:col-span-7 bg-gradient-to-br from-background/95 to-background/90 overflow-hidden isolate">
      <div className="h-full flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="flex-none flex items-center justify-between p-3 border-b border-accent/10 backdrop-blur-sm bg-background/80 z-10 min-h-[60px]">
          <div className="flex items-center flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="mr-1 rounded-full h-8 w-8 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Avatar className="h-10 w-10 border-2 border-primary/10 mr-3">
              <AvatarFallback className="bg-accent/10 text-accent">
                {subchannel.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold leading-none truncate">#{subchannel.name}</h3>
              {subchannel.description && (
                <p className="text-xs text-muted-foreground flex items-center truncate">
                  {subchannel.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
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
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-gradient-radial from-background/50 to-background/95">
          {!conversationId ? (
            // Loading state
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <MessageSkeleton key={i} />
              ))}
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className="flex max-w-[80%]">
                    {message.senderId !== user?.id && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarImage src={message.senderPicture} />
                        <AvatarFallback>{message.senderName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {message.senderId !== user?.id && (
                        <p className="text-xs text-muted-foreground mb-1">{message.senderName}</p>
                      )}
                      <div className={`rounded-lg px-3 py-2 ${message.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {message.type === 'image' || (message.content && message.content.startsWith('http') && (message.content.includes('.jpg') || message.content.includes('.png') || message.content.includes('.gif') || message.content.includes('.jpeg') || message.content.includes('cloudinary'))) ? (
                          <img 
                            src={message.content} 
                            alt="Uploaded image" 
                            className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.content, '_blank')}
                            onError={(e) => {
                              console.error('Image failed to load:', message.content);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          message.content
                        )}
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
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-4 bg-muted/30 h-16 w-16 rounded-full backdrop-blur-sm">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground">
                  Start the conversation by sending a message.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="flex-none p-4 border-t border-accent/10 bg-background/80 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder={`Send a message in #${subchannel.name}`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="pr-12"
                disabled={isInCall}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={triggerFileUpload}
                  disabled={uploadingFile}
                  title="Upload image"
                >
                  {uploadingFile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={(!messageText.trim() && !uploadingFile) || isInCall}
              className="transition-all duration-200 hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
