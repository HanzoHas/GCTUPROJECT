import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthenticatedUser, sessionTokenValidator } from "./utils/auth";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { CloudinaryUploadResult } from "./utils/mediaService";

// Create a new post
export const createPost = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    image: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { title, content, tags, image } = args;

    const postId = await ctx.db.insert("posts", {
      title,
      content,
      authorId: userId,
      createdAt: Date.now(),
      upvotes: 0,
      commentCount: 0,
      tags,
      image: image === null ? undefined : image,
    });

    return { postId };
  },
});

// Upload an image for a post
export const uploadImage = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    imageData: v.string(),
  },
  handler: async (ctx, args): Promise<{ imageUrl: string }> => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { imageData } = args;

    // Upload the image using the media wrapper
    const folder = `chatter-school-connect/users/${userId}/posts`;
    const result: CloudinaryUploadResult = await ctx.runMutation(api.utils.mediaWrapper.uploadMediaSync, {
      base64Data: imageData,
      folder,
    });

    return { imageUrl: result.url };
  },
});

// Get all posts
export const getPosts = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);

    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .collect();
      
    // Get user's likes for all posts
    const userLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
      
    // Create a set of post IDs that the user has liked
    const likedPostIds = new Set(userLikes.map(like => like.postId));
    
    // Get user's comment likes
    const userCommentLikes = await ctx.db
      .query("commentLikes")
      .withIndex("by_user", q => q.eq("userId", userId))
      .collect();
      
    // Create a set of comment IDs that the user has liked
    const likedCommentIds = new Set(userCommentLikes.map(like => like.commentId));

    // Get author details for each post
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Generate proper profile picture URL or use a default
        let profilePictureUrl = undefined;
        if (author?.profilePicture) {
          // If it's already a full URL, use it as is
          if (author.profilePicture.startsWith('http')) {
            profilePictureUrl = author.profilePicture;
          } else {
            // For demo, we'll use a placeholder image if no URL is provided
            profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.username)}&background=random`;
          }
        }

        return {
          id: post._id,
          title: post.title,
          content: post.content,
          author: {
            id: author?._id,
            username: author?.username,
            profilePicture: profilePictureUrl,
          },
          createdAt: post.createdAt,
          upvotes: post.upvotes,
          commentCount: post.commentCount,
          tags: post.tags,
          image: post.image,
          // Add liked status for the current user
          liked: likedPostIds.has(post._id),
          comments: comments.map((comment) => ({
            id: comment._id,
            content: comment.content,
            author: {
              id: comment.authorId,
              username: comment.authorUsername,
              profilePicture: comment.authorProfilePicture && comment.authorProfilePicture.startsWith('http') 
                ? comment.authorProfilePicture 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorUsername)}&background=random`,
            },
            createdAt: comment.createdAt,
            upvotes: comment.upvotes,
            // Add liked status for the comment
            liked: likedCommentIds.has(comment._id),
          })),
        };
      })
    );

    return postsWithAuthors;
  },
});

// Create a comment
export const createComment = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { postId, content } = args;

    const author = await ctx.db.get(userId);
    if (!author) {
      throw new ConvexError("Author not found");
    }

    const commentId = await ctx.db.insert("comments", {
      postId,
      content,
      authorId: userId,
      authorUsername: author.username,
      authorProfilePicture: author.profilePicture,
      createdAt: Date.now(),
      upvotes: 0,
    });

    // Update post comment count
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        commentCount: (post.commentCount || 0) + 1,
      });
    }

    return { commentId };
  },
});

// Upvote a post
export const upvotePost = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { postId } = args;

    const post = await ctx.db.get(postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    // Check if user has already liked this post
    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_post_user", q => q.eq("postId", postId).eq("userId", userId))
      .first();

    if (existingLike) {
      // User has already liked this post
      return { success: false, reason: "already_liked" };
    }

    // Record the like
    await ctx.db.insert("postLikes", {
      postId,
      userId,
      timestamp: Date.now(),
    });

    // Update post upvote count
    await ctx.db.patch(postId, {
      upvotes: (post.upvotes || 0) + 1,
    });

    return { success: true };
  },
});

// Upvote a comment
export const upvoteComment = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { commentId } = args;

    const comment = await ctx.db.get(commentId);
    if (!comment) {
      throw new ConvexError("Comment not found");
    }
    
    // Check if user has already liked this comment
    const existingLike = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_user", q => q.eq("commentId", commentId).eq("userId", userId))
      .first();

    if (existingLike) {
      // User has already liked this comment
      return { success: false, reason: "already_liked" };
    }

    // Record the like
    await ctx.db.insert("commentLikes", {
      commentId,
      userId,
      timestamp: Date.now(),
    });

    // Update comment upvote count
    await ctx.db.patch(commentId, {
      upvotes: (comment.upvotes || 0) + 1,
    });

    return { success: true };
  },
});

// Delete a post
export const deletePost = mutation({
  args: {
    sessionToken: sessionTokenValidator,
    postId: v.id("posts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { userId } = await getAuthenticatedUser(ctx, args.sessionToken);
    const { postId } = args;

    // Get the post
    const post = await ctx.db.get(postId);
    
    // Check if post exists
    if (!post) {
      throw new ConvexError("Post not found");
    }
    
    // Check if the user is the author of the post
    if (post.authorId !== userId) {
      throw new ConvexError("You can only delete your own posts");
    }
    
    // Delete all comments associated with the post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
      
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }
    
    // Delete the post
    await ctx.db.delete(postId);
    
    return { success: true };
  },
});
 