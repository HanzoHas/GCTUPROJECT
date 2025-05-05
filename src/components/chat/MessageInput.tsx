import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Video, Mic, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageType } from '@/contexts/ChatContext';
import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  onSendMessage: (content: string, type: MessageType) => void;
  replyingTo: {
    id: string;
    content: string;
  } | null;
  onCancelReply: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<MessageType>('text');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: MessageType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if Cloudinary is properly configured
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      toast({
        title: "Configuration Error",
        description: "Media upload is not configured. Please set up Cloudinary environment variables.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    setFileType(type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = () => {
    if (message.trim() || previewUrl) {
      setIsUploading(previewUrl !== null);
      
      const content = previewUrl || message;
      const type = previewUrl ? fileType : 'text';
      
      onSendMessage(content, type);
      setMessage('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-3 border-t">
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center bg-muted rounded-md p-2 mb-2"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-0.5">Replying to message</div>
            <div className="text-sm truncate">{replyingTo.content}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
      
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-2"
        >
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full"
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
          
          {fileType === 'image' && (
            <img src={previewUrl} alt="Preview" className="rounded-md max-h-40 w-auto" />
          )}
          
          {fileType === 'video' && (
            <video src={previewUrl} controls className="rounded-md max-h-40 w-auto" />
          )}
          
          {fileType === 'audio' && (
            <audio src={previewUrl} controls className="w-full" />
          )}
        </motion.div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] max-h-[200px] resize-none pr-10"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isUploading}
          />
        </div>
        
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
            disabled={isUploading}
          />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" type="button">
            <Video className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" type="button">
            <Mic className="h-5 w-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            type="button"
            disabled={(!message.trim() && !previewUrl) || isUploading}
            onClick={handleSendMessage}
          >
            {isUploading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
