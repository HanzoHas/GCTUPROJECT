import React, { useState, useEffect, useRef } from 'react';
import { useChannel, ChannelType, SubchannelType, ChannelAnnouncementType } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, Video, AudioLines, Trash2, Upload, X, Plus, Edit, 
  Pencil, BookOpen, Users, User, MessageCircle, SendHorizontal,
  Menu, ChevronLeft, Layers, Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { users } from '@/lib/convex';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageInput from '@/components/chat/MessageInput';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';

// Chat message type
interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "video" | "audio";
  senderId: string;
  senderName: string;
  senderPicture?: string;
  senderPictureVersion?: number;
  timestamp: number;
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    content: string;
  };
  isRead: boolean;
}

// SubchannelChatView component to render chat messages for a subchannel
const SubchannelChatView: React.FC<{ channelId: string, subchannelId: string }> = ({ channelId, subchannelId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; senderId: string; senderName: string; } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { canChatInSubchannel } = useChannel();

  // Mock messages for now - in a real app, fetch these from an API
  useEffect(() => {
    // Simulate loading messages from server
    setLoading(true);
    const timer = setTimeout(() => {
      // Generate some mock messages
      const mockMessages: Message[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `msg-${i}`,
        content: `This is a test message in this subchannel ${i + 1}`,
        type: "text",
        senderId: i % 2 === 0 ? "mock-user-1" : (user?.id || "mock-user-2"),
        senderName: i % 2 === 0 ? "User One" : (user?.username || "You"),
        timestamp: Date.now() - (10 - i) * 60000,
        reactions: {},
        isRead: true
      }));
      setMessages(mockMessages);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [channelId, subchannelId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string, type: "text" | "image" | "video" | "audio") => {
    if (!content.trim()) return;
    
    // In a real app, send to server first
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      type,
      senderId: user?.id || "unknown",
      senderName: user?.username || "Unknown User",
      senderPicture: user?.profilePicture,
      timestamp: Date.now(),
      replyTo: replyingTo,
      isRead: true
    };
    
    setMessages([...messages, newMessage]);
    setReplyingTo(null);
  };

  const handleReply = (messageId: string) => {
    const messageToReply = messages.find(m => m.id === messageId);
    if (messageToReply) {
      setReplyingTo({
        id: messageToReply.id,
        content: messageToReply.content,
        senderId: messageToReply.senderId,
        senderName: messageToReply.senderName
      });
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages(messages.filter(message => message.id !== messageId));
  };

  const reactToMessage = (messageId: string, reaction: string) => {
    setMessages(messages.map(message => {
      if (message.id === messageId) {
        const reactions = { ...(message.reactions || {}) };
        const userReactions = reactions[reaction] || [];
        
        if (userReactions.includes(user?.id || '')) {
          // Remove reaction
          reactions[reaction] = userReactions.filter(id => id !== user?.id);
          if (reactions[reaction].length === 0) {
            delete reactions[reaction];
          }
        } else {
          // Add reaction
          reactions[reaction] = [...userReactions, user?.id || ''];
        }
        
        return { ...message, reactions };
      }
      return message;
    }));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4 bg-muted h-12 w-12 rounded-full animate-pulse">
            <MessageCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-2">Loading messages...</h3>
        </div>
      </div>
    );
  }

  const userCanChat = canChatInSubchannel(subchannelId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
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
              <div className="inline-flex items-center justify-center mb-4 bg-muted h-12 w-12 rounded-full">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground text-sm">
                Start the conversation by sending a message.
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {userCanChat && (
        <div className="p-2 sm:p-4 border-t">
          <MessageInput 
            onSendMessage={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      )}
      
      {!userCanChat && (
        <div className="p-4 border-t text-center">
          <p className="text-muted-foreground text-sm mb-2">You don't have permission to send messages in this subchannel.</p>
        </div>
      )}
    </div>
  );
};

const ChannelsView = () => {
  const { 
    userIsLecturer, 
    lecturerChannels, 
    userChannels,
    currentChannel, 
    currentSubchannel,
    subchannels,
    channelAnnouncements,
    channelError,
    setCurrentChannel,
    setCurrentSubchannel,
    createChannel,
    createSubchannel,
    createChannelAnnouncement,
    deleteChannelAnnouncement,
    isLoadingChannels,
    isLoadingSubchannels,
    isLoadingAnnouncements
  } = useChannel();
  
  const { user } = useAuth();
  const { toast } = useToast();

  // State for channel creation
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');

  // State for subchannel creation
  const [isCreatingSubchannel, setIsCreatingSubchannel] = useState(false);
  const [newSubchannelName, setNewSubchannelName] = useState('');
  const [newSubchannelDescription, setNewSubchannelDescription] = useState('');
  const [newSubchannelGroups, setNewSubchannelGroups] = useState('');

  // State for announcement creation
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Add loading timeout detection
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // New state for mobile navigation
  const [mobileView, setMobileView] = useState<'channels' | 'subchannels' | 'content'>('channels');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Function to navigate to a specific section on mobile
  const navigateToSection = (section: 'channels' | 'subchannels' | 'content') => {
    setMobileView(section);
    setIsMobileNavOpen(false);
  };
  
  // Update the mobile view when a channel is selected
  useEffect(() => {
    if (currentChannel && mobileView === 'channels') {
      setMobileView('subchannels');
    }
  }, [currentChannel]);
  
  // Update the mobile view when a subchannel is selected
  useEffect(() => {
    if (currentSubchannel && mobileView === 'subchannels') {
      setMobileView('content');
    }
  }, [currentSubchannel]);

  useEffect(() => {
    // If channels are loading for more than 5 seconds, assume there's an issue
    let timeoutId: number;
    
    if (isLoadingChannels) {
      setLoadingTimeout(false);
      timeoutId = window.setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isLoadingChannels]);

  // Handle setting user as lecturer and refreshing
  const handleSetAsLecturer = async () => {
    try {
      await users.setAsLecturer();
      toast({
        title: "Success",
        description: "Account set as lecturer. Refreshing page...",
      });
      // Force a page refresh to reload Convex queries
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set as lecturer",
        variant: "destructive",
      });
    }
  };

  // Force refetch without page reload
  const handleForceRefetch = () => {
    // Since we can't directly trigger a Convex refetch,
    // we'll force a component remount by changing key
    // This is a hacky solution but should work for debugging
    toast({
      title: "Refreshing Channels",
      description: "Attempting to refetch channel data...",
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Add a manual refresh function
  const handleRefreshChannels = () => {
    window.location.reload();
  };

  // Handler for creating a new channel
  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createChannel(newChannelName, newChannelDescription);
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
      setNewChannelName('');
      setNewChannelDescription('');
      setIsCreatingChannel(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create channel",
        variant: "destructive",
      });
    }
  };

  // Handler for creating a new subchannel
  const handleCreateSubchannel = async () => {
    if (!currentChannel) {
      toast({
        title: "Error",
        description: "No channel selected",
        variant: "destructive",
      });
      return;
    }

    if (!newSubchannelName.trim()) {
      toast({
        title: "Error",
        description: "Subchannel name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const studentGroups = newSubchannelGroups
        .split(',')
        .map(group => group.trim())
        .filter(Boolean);
      
      await createSubchannel(
        currentChannel._id, 
        newSubchannelName, 
        newSubchannelDescription, 
        "TEXT",
        studentGroups
      );
      
      toast({
        title: "Success",
        description: "Subchannel created successfully",
      });
      
      setNewSubchannelName('');
      setNewSubchannelDescription('');
      setNewSubchannelGroups('');
      setIsCreatingSubchannel(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subchannel",
        variant: "destructive",
      });
    }
  };

  // Handler for creating a new announcement
  const handleCreateAnnouncement = async () => {
    if (!currentChannel) {
      toast({
        title: "Error",
        description: "No channel selected",
        variant: "destructive",
      });
      return;
    }

    if (!announcementTitle.trim()) {
      toast({
        title: "Error",
        description: "Announcement title is required",
        variant: "destructive",
      });
      return;
    }

    if (!announcementContent.trim() && announcementType === 'text') {
      toast({
        title: "Error",
        description: "Announcement content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = announcementType !== 'text' && mediaUrl ? mediaUrl : announcementContent;
      
      await createChannelAnnouncement(
        currentChannel._id,
        currentSubchannel?._id,
        announcementTitle,
        content,
        announcementType
      );
      
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementType('text');
      setMediaUrl('');
      setMediaPreview(null);
      setIsCreatingAnnouncement(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    }
  };

  // Handler for file upload (for announcements)
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingMedia(true);
    const file = files[0];
    
    try {
      // Validate file type matches selected media type
      const fileType = file.type.split('/')[0];
      if (
        (announcementType === 'image' && fileType !== 'image') ||
        (announcementType === 'video' && fileType !== 'video') ||
        (announcementType === 'audio' && fileType !== 'audio')
      ) {
        throw new Error(`Selected file must be ${announcementType} type`);
      }
      
      // Create preview for the file
      const fileURL = URL.createObjectURL(file);
      setMediaPreview(fileURL);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Using unsigned upload preset
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      formData.append('upload_preset', uploadPreset);
      
      // Upload to Cloudinary
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary configuration missing');
      }
      
      let resourceType = 'image';
      if (announcementType === 'video') resourceType = 'video';
      if (announcementType === 'audio') resourceType = 'raw';
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      
      const data = await uploadResponse.json();
      if (!data.secure_url) throw new Error('Upload failed: No secure URL returned');
      
      // Set the media URL to the uploaded file URL
      setMediaUrl(data.secure_url);
      
      toast({
        title: 'Success',
        description: `${announcementType.charAt(0).toUpperCase() + announcementType.slice(1)} uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      });
      setMediaPreview(null);
    } finally {
      setUploadingMedia(false);
    }
  };

  const clearMedia = () => {
    setMediaUrl('');
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render announcement content based on type
  const renderAnnouncementContent = (announcement: ChannelAnnouncementType) => {
    switch (announcement.type) {
      case 'image':
        return (
          <img
            src={announcement.content}
            alt={announcement.title}
            className="w-full h-auto rounded-md object-cover mb-4 max-h-80"
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

  // Render media preview
  const renderMediaPreview = () => {
    if (!mediaPreview) return null;
    
    switch (announcementType) {
      case 'image':
        return (
          <div className="relative mt-2">
            <img src={mediaPreview} alt="Preview" className="max-h-40 rounded-md" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full"
              onClick={clearMedia}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      case 'video':
        return (
          <div className="relative mt-2">
            <video src={mediaPreview} className="max-h-40 rounded-md" controls />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full"
              onClick={clearMedia}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      case 'audio':
        return (
          <div className="relative mt-2">
            <audio src={mediaPreview} className="w-full" controls />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full"
              onClick={clearMedia}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // Render channel sidebar items
  const renderChannelItems = (channels: ChannelType[]) => {
    if (channelError) {
      // Check if this is an API configuration error
      if (channelError.includes("API Error")) {
        return (
          <div className="text-center py-4">
            <p className="text-destructive mb-2">{channelError}</p>
            <p className="text-xs text-muted-foreground mb-4">
              This error occurs when the Convex API is not properly generated or configured. 
              You may need to run `npx convex dev` to regenerate the API.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshChannels}
            >
              Refresh Page
            </Button>
          </div>
        );
      }
      
      // Standard error
      return (
        <div className="text-center py-4">
          <p className="text-destructive mb-2">{channelError}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshChannels}
          >
            Retry
          </Button>
        </div>
      );
    }
    
    if (isLoadingChannels) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mx-auto mb-2"></div>
          <p>Loading channels...</p>
        </div>
      );
    }
    
    if (channels.length === 0) {
      // Check if this is the "all" view or "teaching" view
      const isTeachingView = channels === lecturerChannels;
      
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p className="mb-2">
            {isTeachingView ? "No teaching channels" : "No channels available"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCreatingChannel(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Channel
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {channels.map(channel => (
          <div 
            key={channel._id.toString()} 
            className={`p-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-accent/50 ${
              currentChannel?._id === channel._id ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => {
              setCurrentChannel(channel);
              setCurrentSubchannel(null);
              // On mobile, navigate to subchannels view when a channel is selected
              if (window.innerWidth < 768) {
                setMobileView('subchannels');
              }
            }}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={channel.avatar} />
              <AvatarFallback>{channel.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{channel.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {channel.description || 'No description'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render subchannel list
  const renderSubchannels = () => {
    if (!currentChannel) return null;
    
    if (isLoadingSubchannels) {
      return <div className="text-center py-4">Loading subchannels...</div>;
    }
    
    if (subchannels.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <p className="mb-2">No subchannels found</p>
          {userIsLecturer && currentChannel.lecturerId.toString() === user?.id && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCreatingSubchannel(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create Subchannel
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {subchannels.map(subchannel => (
          <div 
            key={subchannel._id.toString()}
            className={`p-2 rounded-md cursor-pointer hover:bg-accent/50 ${
              currentSubchannel?._id === subchannel._id ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => {
              setCurrentSubchannel(subchannel);
              // On mobile, navigate to content view when a subchannel is selected
              if (window.innerWidth < 768) {
                setMobileView('content');
              }
            }}
          >
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div className="font-medium">{subchannel.name}</div>
            </div>
            {subchannel.description && (
              <div className="text-xs text-muted-foreground ml-6">{subchannel.description}</div>
            )}
            {subchannel.studentGroups.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1 ml-6 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span>{subchannel.studentGroups.join(', ')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render main content (announcements or chat)
  const renderMainContent = () => {
    if (!currentChannel) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          Select a channel to view content
        </div>
      );
    }
    
    // If subchannel is selected and it's a text type, show the chat interface
    if (currentSubchannel && currentSubchannel.type === "TEXT") {
      return (
        <SubchannelChatView 
          channelId={currentChannel._id} 
          subchannelId={currentSubchannel._id} 
        />
      );
    }
    
    // Otherwise show announcements
    return renderAnnouncements();
  };

  // Render announcements
  const renderAnnouncements = () => {
    if (!currentChannel) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Select a channel to view announcements</p>
        </div>
      );
    }
    
    if (isLoadingAnnouncements) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading announcements...</p>
        </div>
      );
    }
    
    const canCreateAnnouncement = userIsLecturer && currentChannel.lecturerId.toString() === user?.id;
    
    return (
      <div className="space-y-4 p-2">
        <div className="flex items-center justify-between sticky top-0 bg-background pt-1 pb-2 z-10">
          <h2 className="text-xl font-bold truncate">
            {currentSubchannel ? `${currentSubchannel.name}` : currentChannel.name}
          </h2>
          
          {canCreateAnnouncement && (
            <Button 
              size="sm"
              onClick={() => setIsCreatingAnnouncement(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          )}
        </div>
        
        {channelAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-4">No announcements yet</p>
            {canCreateAnnouncement && (
              <Button 
                size="sm"
                onClick={() => setIsCreatingAnnouncement(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Create Announcement
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {channelAnnouncements.map(announcement => (
              <Card key={announcement.id.toString()} className="overflow-hidden">
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base sm:text-lg">{announcement.title}</CardTitle>
                    {(user?.id === announcement.author.id || 
                      (userIsLecturer && currentChannel.lecturerId.toString() === user?.id)) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteChannelAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1 flex-wrap">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={announcement.author.avatar} />
                      <AvatarFallback>{announcement.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{announcement.author.name}</span>
                    <span className="text-xs">•</span>
                    <span className="text-xs">{formatDistanceToNow(announcement.timestamp, { addSuffix: true })}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  {renderAnnouncementContent(announcement)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-1 sm:p-4 h-full">
      {/* Mobile Navigation */}
      <div className="flex items-center justify-between md:hidden mb-2 border-b pb-2">
        <div className="flex items-center">
          {mobileView !== 'channels' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileView(mobileView === 'content' ? 'subchannels' : 'channels')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-bold">
            {mobileView === 'channels' && 'Channels'}
            {mobileView === 'subchannels' && (currentChannel?.name || 'Subchannels')}
            {mobileView === 'content' && (currentSubchannel ? `${currentChannel?.name} / ${currentSubchannel?.name}` : currentChannel?.name)}
          </h1>
        </div>
        
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px]">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription className="text-xs">
                Navigate between channels and messages
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <Button 
                variant={mobileView === 'channels' ? 'default' : 'outline'} 
                className="w-full justify-start" 
                onClick={() => navigateToSection('channels')}
              >
                <Layers className="mr-2 h-4 w-4" />
                All Channels
              </Button>
              {currentChannel && (
                <Button 
                  variant={mobileView === 'subchannels' ? 'default' : 'outline'} 
                  className="w-full justify-start" 
                  onClick={() => navigateToSection('subchannels')}
                >
                  <Hash className="mr-2 h-4 w-4" />
                  Subchannels
                </Button>
              )}
              {currentChannel && (
                <Button 
                  variant={mobileView === 'content' ? 'default' : 'outline'} 
                  className="w-full justify-start" 
                  onClick={() => navigateToSection('content')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {currentSubchannel ? 'Messages' : 'Announcements'}
                </Button>
              )}
              
              <div className="mt-8 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleSetAsLecturer}
                  className="w-full mb-2"
                >
                  Set As Lecturer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleForceRefetch}
                  className="w-full"
                >
                  Refresh Channels
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 h-[calc(100vh-5rem)]">
        {/* Channel List - Only visible on desktop or when on channels tab in mobile */}
        <div className={`md:col-span-3 border-b md:border-r md:border-b-0 pb-2 md:pb-0 pr-0 md:pr-4 ${mobileView !== 'channels' ? 'hidden md:block' : ''}`}>
          {loadingTimeout && (
            <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              <p>Channel loading seems slow. If no channels appear:</p>
              <ol className="list-decimal list-inside mt-2">
                <li className="mb-1">Check your Convex deployment</li>
                <li className="mb-1">Verify your Convex environment variables</li>
                <li>Try refreshing the page</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={handleRefreshChannels}
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          <Tabs defaultValue="all">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              {userIsLecturer && (
                <TabsTrigger value="teaching" className="flex-1">Teaching</TabsTrigger>
              )}
              <TabsTrigger value="student" className="flex-1">My Own</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-2 pr-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">All Channels</h3>
                    <Button
                      size="sm"
                      onClick={() => setIsCreatingChannel(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                  </div>
                  
                  {isLoadingChannels ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading channels...</p>
                    </div>
                  ) : (
                    renderChannelItems(userChannels)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {userIsLecturer && (
              <TabsContent value="teaching">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="space-y-2 pr-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">Teaching Channels</h3>
                      <Button
                        size="sm"
                        onClick={() => setIsCreatingChannel(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> New
                      </Button>
                    </div>
                    
                    {isLoadingChannels ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading teaching channels...</p>
                      </div>
                    ) : (
                      renderChannelItems(lecturerChannels)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
            
            <TabsContent value="student">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-2 pr-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">My Channels</h3>
                    <Button
                      size="sm"
                      onClick={() => setIsCreatingChannel(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                  </div>
                  
                  {isLoadingChannels ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading channels...</p>
                    </div>
                  ) : (
                    renderChannelItems(userChannels.filter(channel => channel.createdByStudent))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Subchannel List - Only visible on desktop or when on subchannels tab in mobile */}
        <div className={`md:col-span-2 border-b md:border-r md:border-b-0 pb-2 md:pb-0 pr-0 md:pr-4 flex flex-col ${mobileView !== 'subchannels' ? 'hidden md:block' : ''} ${!currentChannel && 'md:block hidden'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Subchannels</h3>
            {userIsLecturer && currentChannel?.lecturerId.toString() === user?.id && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsCreatingSubchannel(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {!currentChannel ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a channel to view subchannels
              </div>
            ) : (
              renderSubchannels()
            )}
          </ScrollArea>
        </div>

        {/* Main Content (Announcements or Chat) - Only visible on desktop or when on content tab in mobile */}
        <div className={`md:col-span-7 overflow-y-auto ${mobileView !== 'content' ? 'hidden md:block' : ''}`}>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            {renderMainContent()}
          </ScrollArea>
        </div>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={isCreatingChannel} onOpenChange={setIsCreatingChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Create a new channel to organize your content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input 
                id="channel-name" 
                value={newChannelName} 
                onChange={(e) => setNewChannelName(e.target.value)} 
                placeholder="Enter channel name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description (Optional)</Label>
              <Textarea 
                id="channel-description" 
                value={newChannelDescription} 
                onChange={(e) => setNewChannelDescription(e.target.value)} 
                placeholder="Enter channel description"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingChannel(false)}>Cancel</Button>
            <Button onClick={handleCreateChannel}>Create Channel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subchannel Dialog */}
      <Dialog open={isCreatingSubchannel} onOpenChange={setIsCreatingSubchannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Subchannel</DialogTitle>
            <DialogDescription>
              Create a new subchannel for {currentChannel?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subchannel-name">Subchannel Name</Label>
              <Input 
                id="subchannel-name" 
                value={newSubchannelName} 
                onChange={(e) => setNewSubchannelName(e.target.value)} 
                placeholder="Enter subchannel name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subchannel-description">Description (Optional)</Label>
              <Textarea 
                id="subchannel-description" 
                value={newSubchannelDescription} 
                onChange={(e) => setNewSubchannelDescription(e.target.value)} 
                placeholder="Enter subchannel description"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subchannel-groups">
                Student Groups (Optional, comma-separated)
              </Label>
              <Input 
                id="subchannel-groups" 
                value={newSubchannelGroups} 
                onChange={(e) => setNewSubchannelGroups(e.target.value)} 
                placeholder="e.g. Group A, Group B, Group C"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingSubchannel(false)}>Cancel</Button>
            <Button onClick={handleCreateSubchannel}>Create Subchannel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Announcement Dialog */}
      <Dialog open={isCreatingAnnouncement} onOpenChange={setIsCreatingAnnouncement}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Post an announcement to {currentSubchannel ? `${currentChannel?.name} / ${currentSubchannel?.name}` : currentChannel?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input 
                id="announcement-title" 
                value={announcementTitle} 
                onChange={(e) => setAnnouncementTitle(e.target.value)} 
                placeholder="Enter announcement title"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="announcement-content">Content</Label>
                <div className="flex space-x-1">
                  <Button 
                    variant={announcementType === 'text' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setAnnouncementType('text')}
                  >
                    Text
                  </Button>
                  <Button 
                    variant={announcementType === 'image' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setAnnouncementType('image')}
                  >
                    <Image className="h-4 w-4 mr-1" /> Image
                  </Button>
                  <Button 
                    variant={announcementType === 'video' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setAnnouncementType('video')}
                  >
                    <Video className="h-4 w-4 mr-1" /> Video
                  </Button>
                  <Button 
                    variant={announcementType === 'audio' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setAnnouncementType('audio')}
                  >
                    <AudioLines className="h-4 w-4 mr-1" /> Audio
                  </Button>
                </div>
              </div>
              
              {announcementType === 'text' ? (
                <Textarea 
                  id="announcement-content" 
                  value={announcementContent} 
                  onChange={(e) => setAnnouncementContent(e.target.value)} 
                  placeholder="Enter announcement content"
                  rows={6}
                />
              ) : (
                <div className="border border-input rounded-md p-4 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={
                      announcementType === 'image' ? 'image/*' :
                      announcementType === 'video' ? 'video/*' :
                      'audio/*'
                    }
                    onChange={handleFileUpload}
                  />
                  
                  {!mediaPreview ? (
                    <Button 
                      variant="outline" 
                      onClick={triggerFileInput}
                      disabled={uploadingMedia}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {announcementType}
                    </Button>
                  ) : (
                    renderMediaPreview()
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAnnouncementTitle('');
              setAnnouncementContent('');
              setAnnouncementType('text');
              setMediaUrl('');
              setMediaPreview(null);
              setIsCreatingAnnouncement(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAnnouncement}
              disabled={!announcementTitle || (announcementType === 'text' && !announcementContent) || (announcementType !== 'text' && !mediaUrl)}
            >
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelsView;
