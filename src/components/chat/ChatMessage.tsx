import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Reply, Trash2, Heart, ThumbsUp, Smile, Frown, Check, Clock } from 'lucide-react';
import { Message } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, reaction: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isCurrentUser, 
  onReply, 
  onDelete,
  onReact
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  const getReactionCount = (reaction: string) => {
    return message.reactions?.filter(r => r.type === reaction).length || 0;
  };

  const hasUserReacted = (reaction: string) => {
    return message.reactions?.some(r => r.type === reaction && r.isCurrentUser) || false;
  };

  const getMessageStatusIcon = () => {
    if (message.isRead) {
      return <Check size={14} className="text-blue-500" />;
    } else if (message.isDelivered) {
      return <Check size={14} className="text-muted-foreground" />;
    } else {
      return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      className={cn(
        "group relative mb-4 max-w-[85%] md:max-w-[75%] flex items-start gap-2.5",
        isCurrentUser ? "flex-row-reverse mr-0 ml-auto" : "ml-0 mr-auto"
      )}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      layout
    >
      {!isCurrentUser && (
        <Avatar className={cn("h-8 w-8 ring-2 ring-background shadow-lg", message.replyToId ? "self-end mb-1" : "self-end")}>
          <AvatarImage src={message.senderAvatar} />
          <AvatarFallback className="bg-gradient-to-br from-primary-300 to-primary-500 text-primary-foreground">
            {message.senderName?.substring(0, 2).toUpperCase() || "UN"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col", isCurrentUser ? "items-end" : "items-start")}>
        {/* Reply to message if exists */}
        {message.replyToId && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-lg mb-1.5 px-3 py-1.5 max-w-[90%] text-xs backdrop-blur-sm",
              isCurrentUser 
                ? "bg-primary/10 border border-primary/20 mr-2" 
                : "bg-muted/60 border border-muted/30 ml-2"
            )}
          >
            <div className="font-medium text-xs mb-0.5 opacity-70">
              {message.replyToSenderName || "Reply to"}
            </div>
            <div className="truncate max-w-[200px]">{message.replyToContent}</div>
          </motion.div>
        )}
        
        {/* Main message */}
        <div 
          className={cn(
            "relative rounded-2xl py-3 px-4 max-w-prose shadow-md hover:shadow-lg transition-all duration-300",
            isCurrentUser 
              ? "chat-bubble-sent rounded-br-sm bg-gradient-to-br from-primary-400 to-primary-600 text-primary-foreground"
              : "chat-bubble-received rounded-tl-sm bg-card dark:bg-muted/20 backdrop-blur-sm border border-muted/20 dark:border-muted/10"
          )}
        >
          {/* Message header for group chats */}
          {!isCurrentUser && message.isGroupChat && (
            <div className="font-medium text-xs mb-1 text-primary/90">
              {message.senderName}
            </div>
          )}
          
          {/* Message content based on type */}
          {message.type === "text" && (
            <div className="whitespace-pre-wrap text-sm md:text-base">
              {message.content}
            </div>
          )}
          
          {message.type === "image" && (
            <div className="rounded-lg overflow-hidden mt-1 shadow-md">
              <img 
                src={message.content} 
                alt="Shared image" 
                className="max-h-60 max-w-full object-contain hover:scale-[99%] transition-transform cursor-pointer"
                loading="lazy"
              />
            </div>
          )}
          
          {message.type === "video" && (
            <div className="rounded-lg overflow-hidden mt-1 shadow-md">
              <video 
                src={message.content} 
                controls 
                className="max-h-60 max-w-full"
                preload="metadata"
              />
            </div>
          )}
          
          {message.type === "audio" && (
            <div className="mt-1">
              <audio src={message.content} controls className="w-full rounded-md" preload="none" />
            </div>
          )}
          
          {/* Message footer with time and status */}
          <div 
            className={cn(
              "flex items-center gap-1 mt-1.5 opacity-70 text-[10px]",
              isCurrentUser ? "justify-end" : "justify-start"
            )}
          >
            <span>{formatTime(message.timestamp)}</span>
            {isCurrentUser && <span>{getMessageStatusIcon()}</span>}
          </div>
          
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div 
              className={cn(
                "absolute -bottom-3 flex items-center gap-0.5 bg-background/90 dark:bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg border border-muted/20",
                isCurrentUser ? "right-2" : "left-2"
              )}
            >
              {['heart', 'thumbsUp', 'smile', 'frown'].map(reaction => {
                const count = getReactionCount(reaction);
                if (count === 0) return null;
                
                return (
                  <div 
                    key={reaction}
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all",
                      hasUserReacted(reaction) && "bg-muted/50 shadow-inner"
                    )}
                  >
                    {reaction === 'heart' && <Heart size={12} className="fill-red-500 text-red-500" />}
                    {reaction === 'thumbsUp' && <ThumbsUp size={12} className="fill-blue-500 text-blue-500" />}
                    {reaction === 'smile' && <Smile size={12} className="fill-amber-500 text-amber-500" />}
                    {reaction === 'frown' && <Frown size={12} className="fill-purple-500 text-purple-500" />}
                    <span className="text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Message actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "absolute -top-3 rounded-full flex items-center gap-0.5 p-1 shadow-lg bg-card/90 backdrop-blur-md border border-muted/30",
              isCurrentUser ? "right-0" : "left-9"
            )}
          >
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full hover:bg-muted hover:text-primary transition-colors"
                    onClick={() => onReply(message)}
                  >
                    <Reply size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Reply</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full hover:bg-muted hover:text-primary transition-colors"
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Smile size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>React</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isCurrentUser && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => onDelete(message.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reactions menu */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute -top-12 z-20 rounded-full flex items-center gap-1 p-1 shadow-xl bg-card/90 backdrop-blur-md border border-muted/30",
              isCurrentUser ? "right-0" : "left-9"
            )}
          >
            {['heart', 'thumbsUp', 'smile', 'frown'].map(reaction => (
              <Button
                key={reaction}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full hover:scale-125 transition-all duration-200",
                  hasUserReacted(reaction) && "bg-muted"
                )}
                onClick={() => onReact(message.id, reaction)}
              >
                {reaction === 'heart' && <Heart size={16} className={hasUserReacted(reaction) ? "fill-red-500 text-red-500" : ""} />}
                {reaction === 'thumbsUp' && <ThumbsUp size={16} className={hasUserReacted(reaction) ? "fill-blue-500 text-blue-500" : ""} />}
                {reaction === 'smile' && <Smile size={16} className={hasUserReacted(reaction) ? "fill-amber-500 text-amber-500" : ""} />}
                {reaction === 'frown' && <Frown size={16} className={hasUserReacted(reaction) ? "fill-purple-500 text-purple-500" : ""} />}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatMessage;
