import React, { useState, useEffect, useRef } from 'react';
import { trending } from '@/lib/convex';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare, Share2, MoreVertical, Image as ImageIcon, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
      await trending.upvotePost(postId);
      // Refresh posts to show updated upvote count
      const fetchedPosts = await trending.getPosts();
      setPosts(fetchedPosts || []);
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    try {
      await trending.upvoteComment(commentId);
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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Create Post Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full mb-6">Create New Discussion</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <Textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={5}
            />
            
            {/* Image upload section */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center"
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
                    className="max-h-40 rounded-md mt-2" 
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['Academic', 'Research', 'Study Tips', 'Career', 'Events'].map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
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
            <Button onClick={handleCreatePost}>Post</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            <span className="ml-3">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          posts.map((post: Post) => (
            <div key={post.id} className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.username)}&background=random`} />
                    <AvatarFallback>
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
                {user && post.author.id === user.id ? (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    title="Delete this post"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-muted-foreground mb-4">{post.content}</p>
              
              {/* Display post image if available */}
              {post.image && (
                <div className="mb-4">
                  <img 
                    src={post.image} 
                    alt="Post" 
                    className="max-w-full rounded-md" 
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                  onClick={() => handleUpvotePost(post.id)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.upvotes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                  onClick={() => setSelectedPost(post)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>

              {/* Comments Section */}
              {selectedPost?.id === post.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-4">
                    {post.comments?.map((comment: Comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.username)}&background=random`} />
                          <AvatarFallback>
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
                            className="mt-1"
                            onClick={() => handleUpvoteComment(comment.id)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {comment.upvotes}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                    />
                    <Button
                      className="mt-2"
                      onClick={() => handleCreateComment(post.id)}
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrendingView; 