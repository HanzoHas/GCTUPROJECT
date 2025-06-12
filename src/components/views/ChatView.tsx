import React, { useEffect, useRef, useState } from 'react';
import { useChat, Message, Conversation } from '@/contexts/ChatContext';
import ConversationList from '../chat/ConversationList';
import ChatMessage from '../chat/ChatMessage';
import MessageInput from '../chat/MessageInput';
import { Info, ArrowLeft, Menu, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import VideoCallButton from '../calls/VideoCallButton';
import GroupCallButton from '../calls/GroupCallButton';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import styles from './ChatView.module.css';

const ChatView = () => {
  const {
    conversations,
    currentConversation,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConversationList, setShowConversationList] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Check for mobile screens
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowConversationList(true);
      } else if (currentConversation) {
        setShowConversationList(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentConversation]);

  useEffect(() => {
    if (currentConversation) {
      // Don't call markAsRead here with a conversation ID since markAsRead expects a message ID
      // This was causing the error in the console
      
      // On mobile, hide conversation list when a conversation is selected
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  }, [currentConversation, isMobile]);

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

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  const toggleConversationList = () => {
    setShowConversationList(prev => !prev);
  };

  // Function to get the display name for a conversation
  const getConversationDisplayName = (conversation: Conversation) => {
    // If it's explicitly a group conversation
    if (conversation.isGroup) {
      return conversation.name;
    }
    
    // For direct conversations, show only the other user's name
    if (!conversation.members || !Array.isArray(conversation.members)) {
      // If the name contains "&", it might be a combined name - extract just the other person
      if (conversation.name && conversation.name.includes('&')) {
        const names = conversation.name.split('&').map(name => name.trim());
        // Try to find a name that doesn't match the current user's username
        const otherName = names.find(name => name !== user?.username);
        return otherName || conversation.name || 'Unnamed Conversation';
      }
      return conversation.name || 'Unnamed Conversation';
    }
    
    const otherMember = conversation.members.find(member => member.id !== user?.id);
    return otherMember ? otherMember.username : conversation.name || 'Unnamed Conversation';
  };
  
  const getRecipientId = (conversation: Conversation) => {
    if (!conversation.members || !Array.isArray(conversation.members)) {
      return '';
    }
    
    const otherMember = conversation.members.find(member => member.id !== user?.id);
    return otherMember ? otherMember.id : '';
  };

  return (
    <div className="h-full bg-gradient-to-br from-background to-background/95 flex flex-col md:grid md:grid-cols-12 lg:grid-cols-10 gap-0 relative overflow-hidden">
      {/* Conversation List */}
      <AnimatePresence initial={false}>
        {showConversationList && (
          <motion.div 
            className={cn(
              "w-full md:col-span-5 lg:col-span-3 h-full absolute md:relative z-20 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md overflow-hidden flex flex-col",
              isMobile && "inset-0 border-r border-accent/10"
            )}
            initial={isMobile ? { x: -300, opacity: 0 } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -300, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Conversation List Header */}
            <div className="flex-none sticky top-0 z-10 p-4 backdrop-blur-md border-b border-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user?.profilePicture || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-display font-semibold">Chats</h2>
              </div>
              
              <div className="flex items-center gap-1.5">
                <TooltipProvider delayDuration={350}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Users className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>New Group</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="flex-none px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="w-full pl-9 pr-4 py-2 bg-muted/30 border-muted/30 rounded-full focus-visible:ring-primary/30"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Conversation List */}
            <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
            />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Area */}
      <div className="w-full h-full flex flex-col md:col-span-7 lg:col-span-7 bg-gradient-to-br from-background/95 to-background/90 overflow-hidden isolate">
        {!currentConversation ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center mb-6 bg-muted/30 h-24 w-24 rounded-full">
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-12 w-12 text-primary/50"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">No conversation selected</h3>
              <p className="text-muted-foreground mb-6">
                Select a conversation from the list or start a new one.
              </p>
              <Button className="rounded-full px-6" onClick={() => setShowConversationList(true)}>
                <Users className="h-4 w-4 mr-2" />
                View Conversations
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex-none flex items-center justify-between p-3 border-b border-accent/10 backdrop-blur-sm bg-background/80 z-10">
              <div className="flex items-center">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleConversationList}
                    className="mr-1 rounded-full h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                
                <Avatar className="h-10 w-10 border-2 border-primary/10 mr-3">
                  <AvatarImage src={currentConversation.avatar} />
                  <AvatarFallback className="bg-accent/10 text-accent">
                    {getConversationDisplayName(currentConversation).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-semibold leading-none">{getConversationDisplayName(currentConversation)}</h3>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {currentConversation.isGroup ? (
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {currentConversation.members?.length || 0} members
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-status-online mr-1.5"></span>
                        Online
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {!currentConversation.isGroup && (
                  <>
                    <VideoCallButton
                      recipientId={getRecipientId(currentConversation)}
                      recipientName={getConversationDisplayName(currentConversation)}
                      variant="audio"
                      size="sm"
                    />
                    <VideoCallButton
                      recipientId={getRecipientId(currentConversation)}
                      recipientName={getConversationDisplayName(currentConversation)}
                      variant="video"
                      size="sm"
                    />
                  </>
                )}
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{getConversationDisplayName(currentConversation)}</SheetTitle>
                      <SheetDescription>
                        {currentConversation.isGroup
                          ? 'Group information and settings'
                          : 'Contact information and shared media'}
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="py-6 flex flex-col items-center">
                      <Avatar className="h-24 w-24 mb-4 shadow-md border-2 border-primary/20">
                        <AvatarImage src={currentConversation.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-medium">
                          {getConversationDisplayName(currentConversation).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="text-xl font-semibold mb-1">{getConversationDisplayName(currentConversation)}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-6">
                        <span className="h-2.5 w-2.5 rounded-full bg-status-online mr-1.5 animate-pulse"></span>
                        {currentConversation.isGroup ? `${currentConversation.members?.length || 0} members` : 'Online'}
                      </div>
                      
                      {currentConversation.isGroup ? (
                        <>
                          {/* Group info */}
                          <div className="w-full mt-4 space-y-4">
                            <div className="w-full">
                              <h4 className="font-medium mb-2">Members</h4>
                              <div className="space-y-2">
                                {currentConversation.members && Array.isArray(currentConversation.members) ? (
                                  currentConversation.members.map(member => (
                                    <div key={member.id} className="flex items-center p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                      <Avatar className="h-8 w-8 mr-2">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-sm">{member.username}</div>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <span 
                                            className={member.status === 'Available' ? 'h-1.5 w-1.5 rounded-full bg-status-online mr-1.5' : 'h-1.5 w-1.5 rounded-full bg-status-offline mr-1.5'}
                                          ></span>
                                          <span>{member.status || 'Offline'}</span>
                                        </div>
                                      </div>
                                      {member.isAdmin && (
                                        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin</span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-sm text-muted-foreground">No members found</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Direct chat info */}
                          <div className="w-full mt-4">
                            <div className="flex space-x-2 justify-center mb-6">
                              <VideoCallButton 
                                recipientId={getRecipientId(currentConversation)}
                                recipientName={getConversationDisplayName(currentConversation)}
                                variant="audio"
                                size="lg"
                              />
                              <VideoCallButton 
                                recipientId={getRecipientId(currentConversation)}
                                recipientName={getConversationDisplayName(currentConversation)}
                                variant="video"
                                size="lg"
                              />
                            </div>
                            
                            {/* Contact info */}
                            <div className="w-full mb-6">
                              <h4 className="font-medium mb-2">Contact Info</h4>
                              {currentConversation.members && Array.isArray(currentConversation.members) ? (
                                currentConversation.members
                                  .filter(member => member.id !== user?.id)
                                  .map(member => (
                                    <div key={member.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/40 transition-all">
                                      <div className="font-medium">{member.username}</div>
                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <span 
                                          className={member.status === 'Available' ? 'h-2 w-2 rounded-full bg-status-online mr-1.5' : 'h-2 w-2 rounded-full bg-status-offline mr-1.5'}
                                          style={{ marginRight: '0.375rem' }}
                                        ></span>
                                        <span>{member.status}</span>
                                      </div>
                                    </div>
                                  ))
                              ) : (
                                <div className="text-sm text-muted-foreground">No contact information available</div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-gradient-radial from-background/50 to-background/95">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === user?.id}
                    onReply={() => handleReply(message.id)}
                    onDelete={deleteMessage}
                    onReact={reactToMessage}
                  />
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
              <MessageInput onSendMessage={handleSendMessage} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;
