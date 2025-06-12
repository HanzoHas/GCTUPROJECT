import React, { useState, useEffect, useRef } from 'react';
import { trending } from '@/lib/convex';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ThumbsUp, MessageSquare, Share2, MoreVertical, Image as ImageIcon, 
  X, Sparkles, Search, Filter, TrendingUp, Award, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: number;
  upvotes: number;
  commentCount: number;
  tags: string[];
  comments?: Comment[];
  image?: string;
  liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: number;
  upvotes: number;
  liked?: boolean;
}

const TrendingView = () => {
  const { user } = useAuth();
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');

  // Fetch posts when component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const fetchedPosts = await trending.getPosts();
        setPosts(fetchedPosts || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (postImage) {
        // Convert image to base64 for upload
        const reader = new FileReader();
        const imageDataPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(postImage);
        });
        
        const imageData = await imageDataPromise;
        
        // Call API to upload the image and get back a URL
        const uploadResult = await trending.uploadImage(imageData);
        if (uploadResult?.imageUrl) {
          imageUrl = uploadResult.imageUrl;
        }
      }

      // Create post with image if available
      await trending.createPost(
        newPostTitle, 
        newPostContent, 
        selectedTags,
        imageUrl
      );
      
      // Refresh posts after creating a new one
      const fetchedPosts = await trending.getPosts();
      setPosts(fetchedPosts || []);
      
      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setSelectedTags([]);
      clearImage();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      await trending.createComment(postId, newComment);
      // Refresh posts to show the new comment
      const fetchedPosts = await trending.getPosts();
      setPosts(fetchedPosts || []);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleUpvotePost = async (postId: string) => {
    try {
      const response = await trending.upvotePost(postId);
      
      if (!response.success && response.reason === "already_liked") {
        // Optional: Show a message that the user already liked this post
        return;
      }
      
      // Refresh posts to show updated upvote count
      const fetchedPosts = await trending.getPosts();
      setPosts(fetchedPosts || []);
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    try {
      const response = await trending.upvoteComment(commentId);
      
      if (!response.success && response.reason === "already_liked") {
        // Optional: Show a message that the user already liked this comment
        return;
      }
      
      // Refresh posts to show updated upvote count on the comment
      const fetchedPosts = await trending.getPosts();
      setPosts(fetchedPosts || []);
    } catch (error) {
      console.error('Error upvoting comment:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }
    
    try {
      const result = await trending.deletePost(postId);
      if (result.success) {
        // Remove the deleted post from the state
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. You can only delete your own posts.');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    return (
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (activeTab === 'trending') {
      return b.upvotes - a.upvotes;
    } else if (activeTab === 'newest') {
      return b.createdAt - a.createdAt;
    } else { // popular
      return b.commentCount - a.commentCount;
    }
  });

  const availableTags = ['Academic', 'Research', 'Study Tips', 'Career', 'Events', 'Question', 'Discussion', 'Resources'];

  return (
    <div className="relative p-4 h-full">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-10 w-40 h-40 bg-primary-300/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-40 -right-10 w-60 h-60 bg-accent-300/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <div className="mr-3 bg-gradient-to-r from-primary/20 to-accent/20 p-2 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary font-display">Trending Topics</h1>
              <p className="text-muted-foreground text-sm">Discover what's being discussed in your academic community</p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-white shadow-sm hover:shadow-glow-sm transition-all">
                <Sparkles className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-primary/10 shadow-float max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-gradient-primary">Create a New Post</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <Input
                  placeholder="Title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="bg-primary/5 border-primary/10 focus:border-primary/30"
                />
                
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={5}
                  className="bg-primary/5 border-primary/10 focus:border-primary/30"
                />
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center bg-primary/5 border-primary/10 hover:bg-primary/10"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-40 rounded-md mt-2 object-cover" 
                      />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2 text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          selectedTags.includes(tag) 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-primary/5 border-primary/10 hover:bg-primary/10"
                        )}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    onClick={handleCreatePost} 
                    className="w-full bg-gradient-to-r from-primary to-accent text-white hover:shadow-glow-sm"
                  >
                    Post to Community
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div 
          className="mb-6 glass-card p-4 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts, topics, or users..."
                className="pl-9 bg-primary/5 border-primary/10 focus:border-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="bg-primary/5 p-1">
                <TabsTrigger 
                  value="trending" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trending
                </TabsTrigger>
                <TabsTrigger 
                  value="newest"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Newest
                </TabsTrigger>
                <TabsTrigger 
                  value="popular"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Award className="h-4 w-4 mr-1" />
                  Popular
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Posts List */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-6 pb-6">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-12 glass-card rounded-xl">
                <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
                <span className="mt-4 text-muted-foreground">Loading posts...</span>
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-xl">
                {searchQuery ? (
                  <p className="text-muted-foreground">No posts match your search criteria.</p>
                ) : (
                  <p className="text-muted-foreground">No posts yet. Be the first to start a discussion!</p>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {sortedPosts.map((post: Post, index) => (
                  <motion.div 
                    key={post.id} 
                    className="glass-card rounded-xl shadow-sm p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="border border-primary/10 shadow-sm">
                          <AvatarImage src={post.author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.username)}&background=random`} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {post.author.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{post.author.username}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {post.author.id === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:bg-primary/10 rounded-full h-8 w-8"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                      <p className="text-muted-foreground whitespace-pre-line">{post.content}</p>
                      
                      {post.image && (
                        <div className="mt-3">
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className="rounded-lg max-h-96 object-cover" 
                          />
                        </div>
                      )}
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center space-x-1 hover:bg-primary/10 ${post.liked ? 'text-primary' : ''}`}
                        onClick={() => handleUpvotePost(post.id)}
                        disabled={post.liked}
                      >
                        <ThumbsUp className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                        <span>{post.upvotes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-1 hover:bg-primary/10"
                        onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentCount}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center space-x-1 hover:bg-primary/10"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {selectedPost?.id === post.id && (
                        <motion.div 
                          className="mt-4 pt-4 border-t border-primary/10"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="space-y-4">
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map((comment: Comment) => (
                                <div key={comment.id} className="flex space-x-3">
                                  <Avatar className="h-8 w-8 border border-primary/10">
                                    <AvatarImage src={comment.author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.username)}&background=random`} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {comment.author.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{comment.author.username}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm mt-1">{comment.content}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`mt-1 hover:bg-primary/10 ${comment.liked ? 'text-primary' : ''}`}
                                      onClick={() => handleUpvoteComment(comment.id)}
                                      disabled={comment.liked}
                                    >
                                      <ThumbsUp className={`h-4 w-4 mr-1 ${comment.liked ? 'fill-current' : ''}`} />
                                      {comment.upvotes}
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-sm text-muted-foreground py-2">
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </div>

                          <div className="mt-4">
                            <Textarea
                              placeholder="Write a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={2}
                              className="bg-primary/5 border-primary/10 focus:border-primary/30"
                            />
                            <Button
                              className="mt-2 bg-gradient-to-r from-primary to-accent text-white hover:shadow-sm"
                              onClick={() => handleCreateComment(post.id)}
                            >
                              Comment
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TrendingView;