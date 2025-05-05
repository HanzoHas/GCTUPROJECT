import React, { useEffect, useRef, useState } from 'react';
import { useChat, Message, Conversation } from '@/contexts/ChatContext';
import ConversationList from '../chat/ConversationList';
import ChatMessage from '../chat/ChatMessage';
import MessageInput from '../chat/MessageInput';
import { Info, ArrowLeft, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import VideoCallButton from '../calls/VideoCallButton';
import GroupCallButton from '../calls/GroupCallButton';
import { useAuth } from '@/contexts/AuthContext';

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
    if (conversation.isGroup) {
      return conversation.name;
    }
    
    // For direct conversations, show only the other user's name
    const otherMember = conversation.members.find(member => member.id !== user?.id);
    return otherMember ? otherMember.username : conversation.name;
  };

  // Function to get the recipient ID for calls in direct conversations
  const getRecipientId = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.id;
    }
    
    // For direct conversations, get the other user's ID
    const otherMember = conversation.members.find(member => member.id !== user?.id);
    return otherMember ? otherMember.id : conversation.id;
  };

  return (
    <div className="h-full flex flex-col md:grid md:grid-cols-3 gap-4 relative">
      {/* Conversation List */}
      <AnimatePresence initial={false}>
        {showConversationList && (
          <motion.div 
            className={cn(
              "w-full h-full md:col-span-1 absolute md:relative z-20 bg-background",
              isMobile && "inset-0"
            )}
            initial={isMobile ? { x: -300, opacity: 0 } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -300, opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ConversationList
              conversations={conversations}
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Area */}
      <div className={cn(
        "h-full flex flex-col",
        isMobile ? "w-full" : "md:col-span-2"
      )}>
        {isMobile && !showConversationList && currentConversation && (
          <div className="flex items-center justify-between p-3 border-b">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleConversationList}
              className="mr-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center flex-1 mx-2">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={currentConversation.avatar} />
                <AvatarFallback>{getConversationDisplayName(currentConversation).substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium truncate">{getConversationDisplayName(currentConversation)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {!currentConversation.isGroup && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <VideoCallButton 
                      recipientId={getRecipientId(currentConversation)}
                      recipientName={getConversationDisplayName(currentConversation)}
                      variant="audio"
                      size="sm"
                    />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <VideoCallButton 
                      recipientId={getRecipientId(currentConversation)}
                      recipientName={getConversationDisplayName(currentConversation)}
                      variant="video"
                      size="sm"
                    />
                  </Button>
                </>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{getConversationDisplayName(currentConversation)}</SheetTitle>
                    <SheetDescription>
                      {currentConversation.isGroup
                        ? 'Group information and settings'
                        : 'Contact information and shared media'}
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-6 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={currentConversation.avatar} />
                      <AvatarFallback>{getConversationDisplayName(currentConversation).substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-xl font-semibold mb-1">{getConversationDisplayName(currentConversation)}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-6">
                      <span className="online-indicator mr-1.5"></span>
                      {currentConversation.isGroup ? `${currentConversation.members.length} members` : 'Online'}
                    </div>
                    
                    {currentConversation.isGroup ? (
                      <div className="w-full">
                        <h4 className="font-medium mb-2">Members</h4>
                        <div className="space-y-2">
                          {currentConversation.members.map((member) => (
                            <div key={member.id} className="flex items-center p-2 rounded-md">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{member.username}</div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span className={member.status === 'Available' ? 'online-indicator' : 'offline-indicator'} style={{ height: '0.5rem', width: '0.5rem' }}></span>
                                  <span className="ml-1">{member.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
                            {currentConversation.members
                              .filter(member => member.id !== user?.id)
                              .map(member => (
                                <div key={member.id} className="p-2 rounded-md">
                                  <div className="font-medium">{member.username}</div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <span className={member.status === 'Available' ? 'online-indicator' : 'offline-indicator'} style={{ marginRight: '0.375rem' }}></span>
                                    <span>{member.status}</span>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}

        {!currentConversation ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 bg-muted h-16 w-16 rounded-full">
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
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p className="text-muted-foreground">
                Select a conversation from the list or start a new one.
              </p>
              {isMobile && !showConversationList && (
                <Button
                  className="mt-4"
                  onClick={toggleConversationList}
                >
                  Show Conversations
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {!isMobile && (
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={currentConversation.avatar} />
                    <AvatarFallback>{getConversationDisplayName(currentConversation).substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium">{getConversationDisplayName(currentConversation)}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="online-indicator mr-1.5"></span>
                      {currentConversation.isGroup ? `${currentConversation.members.length} members` : 'Online'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentConversation.isGroup ? (
                    <GroupCallButton 
                      groupId={currentConversation.id}
                      groupName={getConversationDisplayName(currentConversation)}
                      showText={false}
                    />
                  ) : (
                    <>
                      <VideoCallButton 
                        recipientId={getRecipientId(currentConversation)}
                        recipientName={getConversationDisplayName(currentConversation)}
                        variant="audio"
                      />
                      <VideoCallButton 
                        recipientId={getRecipientId(currentConversation)}
                        recipientName={getConversationDisplayName(currentConversation)}
                        variant="video"
                      />
                    </>
                  )}
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>{getConversationDisplayName(currentConversation)}</SheetTitle>
                        <SheetDescription>
                          {currentConversation.isGroup
                            ? 'Group information and settings'
                            : 'Contact information and shared media'}
                        </SheetDescription>
                      </SheetHeader>
                      
                      <div className="py-6 flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={currentConversation.avatar} />
                          <AvatarFallback>{getConversationDisplayName(currentConversation).substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        
                        <h3 className="text-xl font-semibold mb-1">{getConversationDisplayName(currentConversation)}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-6">
                          <span className="online-indicator mr-1.5"></span>
                          {currentConversation.isGroup ? `${currentConversation.members.length} members` : 'Online'}
                        </div>
                        
                        {currentConversation.isGroup ? (
                          <div className="w-full">
                            <h4 className="font-medium mb-2">Members</h4>
                            <div className="space-y-2">
                              {currentConversation.members.map((member) => (
                                <div key={member.id} className="flex items-center p-2 rounded-md">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">{member.username}</div>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <span className={member.status === 'Available' ? 'online-indicator' : 'offline-indicator'} style={{ height: '0.5rem', width: '0.5rem' }}></span>
                                      <span className="ml-1">{member.status}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
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
                                {currentConversation.members
                                  .filter(member => member.id !== user?.id)
                                  .map(member => (
                                    <div key={member.id} className="p-2 rounded-md">
                                      <div className="font-medium">{member.username}</div>
                                      <div className="flex items-center text-sm text-muted-foreground">
                                        <span className={member.status === 'Available' ? 'online-indicator' : 'offline-indicator'} style={{ marginRight: '0.375rem' }}></span>
                                        <span>{member.status}</span>
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            )}
            
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
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t">
              <MessageInput 
                onSendMessage={handleSendMessage}
                replyTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatView;
