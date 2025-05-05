import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAnnouncements, AnnouncementType } from '@/contexts/AnnouncementContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image, Video, AudioLines, Trash2, Upload, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const AnnouncementsView = () => {
  const { user } = useAuth();
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<AnnouncementType>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddAnnouncement = () => {
    if (title.trim() && (content.trim() || mediaUrl.trim())) {
      const finalContent = mediaType !== 'text' && mediaUrl ? mediaUrl : content;
      addAnnouncement(title, finalContent, mediaType);
      setTitle('');
      setContent('');
      setMediaUrl('');
      setMediaPreview(null);
      setMediaType('text');
      setShowAddAnnouncement(false);
    }
  };

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
        (mediaType === 'image' && fileType !== 'image') ||
        (mediaType === 'video' && fileType !== 'video') ||
        (mediaType === 'audio' && fileType !== 'audio')
      ) {
        throw new Error(`Selected file must be ${mediaType} type`);
      }
      
      // Create preview for the file
      const fileURL = URL.createObjectURL(file);
      setMediaPreview(fileURL);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Using unsigned upload
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      formData.append('upload_preset', uploadPreset);
      
      // Upload to Cloudinary
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary configuration missing');
      }
      
      let resourceType = 'image';
      if (mediaType === 'video') resourceType = 'video';
      if (mediaType === 'audio') resourceType = 'raw';
      
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
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`,
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

  const renderAnnouncementContent = (announcement: any) => {
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

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;
    
    switch (mediaType) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        
        {user?.isAdmin && (
          <Dialog open={showAddAnnouncement} onOpenChange={setShowAddAnnouncement}>
            <DialogTrigger asChild>
              <Button>Create Announcement</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Create a new announcement for all users to see.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Content Type</Label>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant={mediaType === 'text' ? 'default' : 'outline'} 
                      onClick={() => setMediaType('text')}
                      size="sm"
                    >
                      Text
                    </Button>
                    <Button 
                      type="button" 
                      variant={mediaType === 'image' ? 'default' : 'outline'} 
                      onClick={() => setMediaType('image')}
                      size="sm"
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Image
                    </Button>
                    <Button 
                      type="button" 
                      variant={mediaType === 'video' ? 'default' : 'outline'} 
                      onClick={() => setMediaType('video')}
                      size="sm"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Video
                    </Button>
                    <Button 
                      type="button" 
                      variant={mediaType === 'audio' ? 'default' : 'outline'} 
                      onClick={() => setMediaType('audio')}
                      size="sm"
                    >
                      <AudioLines className="h-4 w-4 mr-1" />
                      Audio
                    </Button>
                  </div>
                </div>
                
                {mediaType === 'text' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label>Upload {mediaType}</Label>
                      <div className="text-xs text-muted-foreground">or</div>
                      <Label htmlFor="mediaUrl" className="text-xs text-right">
                        Enter URL
                      </Label>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        disabled={uploadingMedia}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingMedia ? 'Uploading...' : `Upload ${mediaType}`}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept={
                          mediaType === 'image' 
                            ? 'image/*' 
                            : mediaType === 'video' 
                              ? 'video/*' 
                              : 'audio/*'
                        }
                      />
                      
                      <Input
                        id="mediaUrl"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder={`Or enter ${mediaType} URL`}
                        className="flex-1"
                      />
                    </div>
                    
                    {renderMediaPreview()}
                    
                    {/* URL Preview */}
                    {!mediaPreview && mediaUrl && mediaType === 'image' && (
                      <img src={mediaUrl} alt="Preview" className="mt-2 max-h-40 rounded-md" />
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button onClick={handleAddAnnouncement} disabled={!title.trim() || (!content.trim() && !mediaUrl)}>
                  Post Announcement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="space-y-6">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
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
                    
                    {user?.isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAnnouncement(announcement.id)}
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
              {user?.isAdmin
                ? 'Create the first announcement to share with everyone.'
                : 'Check back soon for updates from your administrators.'}
            </p>
            
            {user?.isAdmin && (
              <Button
                onClick={() => setShowAddAnnouncement(true)}
              >
                Create First Announcement
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsView;
