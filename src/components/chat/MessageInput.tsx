import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, Video, Mic, X, AlertCircle, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageType } from '@/contexts/ChatContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

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
  const [isFocused, setIsFocused] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Automatically adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  return (
    <div className="w-full">
      {replyingTo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center bg-muted/40 backdrop-blur-sm border border-muted/30 rounded-xl p-2.5 mb-3"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-primary/80 font-medium mb-0.5">Replying to message</div>
            <div className="text-sm truncate text-muted-foreground">{replyingTo.content}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-6 w-6 rounded-full hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      )}
      
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative mb-3 bg-muted/20 backdrop-blur-sm p-2 rounded-xl border border-muted/30"
        >
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-90 hover:opacity-100"
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
          
          {fileType === 'image' && (
            <img src={previewUrl} alt="Preview" className="rounded-lg shadow-md max-h-40 w-auto mx-auto" />
          )}
          
          {fileType === 'video' && (
            <video src={previewUrl} controls className="rounded-lg shadow-md max-h-40 w-auto mx-auto" />
          )}
          
          {fileType === 'audio' && (
            <audio src={previewUrl} controls className="w-full rounded-md" />
          )}
          
          <div className="text-xs text-muted-foreground mt-1.5 px-1">
            {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)} KB)
          </div>
        </motion.div>
      )}
      
      <div className={cn(
        "flex items-end gap-1.5 p-0.5 pr-1 border rounded-2xl transition-all duration-300",
        isFocused 
          ? "bg-background shadow-lg border-primary/30 ring-2 ring-primary/10" 
          : "bg-muted/30 border-muted/50 hover:border-muted/80"
      )}>
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm min-h-[50px] max-h-[150px] resize-none focus:outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isUploading}
            style={{fontSize: '16px'}} // Prevents iOS zoom on focus
          />
        </div>
        
        <div className="flex items-center pb-1.5 pr-1 gap-0.5">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
            disabled={isUploading}
          />
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              type="button"
              disabled={(!message.trim() && !previewUrl) || isUploading}
              onClick={handleSendMessage}
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-300",
                (!message.trim() && !previewUrl) ? "opacity-70" : "shadow-md"
              )}
            >
              {isUploading ? (
                <span className="inline-block animate-spin-slow">⏳</span>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
