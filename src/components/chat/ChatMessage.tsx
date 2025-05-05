import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Edit, Reply, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  onReply: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

const emojiOptions = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  onReply,
  onDelete,
  onReact,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <img
            src={message.content}
            alt="Shared image"
            className="rounded-md max-h-60 w-auto"
          />
        );
      case 'video':
        return (
          <video
            src={message.content}
            controls
            className="rounded-md max-h-60 w-auto"
          />
        );
      case 'audio':
        return (
          <audio
            src={message.content}
            controls
            className="w-full max-w-[200px]"
          />
        );
      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="relative max-w-[80%]"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
        onTouchEnd={() => setTimeout(() => setShowActions(false), 3000)}
      >
        {!isCurrentUser && (
          <div className="flex items-end mb-1">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={message.senderPicture ? `${message.senderPicture}?v=${message.senderPictureVersion || 1}` : ''} />
              <AvatarFallback>{message.senderName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{message.senderName}</span>
          </div>
        )}

        {message.replyTo && (
          <div className={`flex items-center text-xs p-2 mb-1 rounded-md ${isCurrentUser ? 'bg-primary/10' : 'bg-muted'}`}>
            <MessageSquare className="h-3 w-3 mr-1" />
            <span className="truncate">
              Replying to: {message.replyTo.content.substring(0, 40)}
              {message.replyTo.content.length > 40 ? '...' : ''}
            </span>
          </div>
        )}

        <motion.div
          whileHover={{ scale: 1.01 }}
          className={isCurrentUser ? 'message-sent' : 'message-received'}
        >
          {renderMessageContent()}
        </motion.div>

        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
          
          {isCurrentUser && (
            <div className="text-xs text-muted-foreground flex items-center">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 ml-1" />
              ) : (
                <Check className="h-3 w-3 ml-1" />
              )}
            </div>
          )}
        </div>

        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute -top-8 ${isCurrentUser ? 'left-0' : 'right-0'} bg-background shadow-md rounded-full p-1 flex items-center space-x-1`}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-full hover:bg-muted"
              onClick={() => setShowReactions(!showReactions)}
            >
              😊
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-full hover:bg-muted"
              onClick={() => onReply(message.id)}
            >
              <Reply className="h-3 w-3" />
            </motion.button>
            
            {isCurrentUser && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <Edit className="h-3 w-3" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-full hover:bg-muted"
                  onClick={() => onDelete(message.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute -top-12 ${isCurrentUser ? 'left-0' : 'right-0'} bg-background shadow-md rounded-full p-1 flex items-center space-x-1`}
          >
            {emojiOptions.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="p-1 hover:bg-muted rounded-full"
                onClick={() => {
                  onReact(message.id, emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-3 right-0 bg-background shadow-sm rounded-full px-2 py-0.5 text-xs flex items-center">
            {message.reactions.map((reaction, index) => (
              <span key={index}>{reaction.emoji}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
