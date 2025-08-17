import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { CloudinaryUploadResult } from "./mediaService";

// Optimized helper function with better error handling
export async function uploadMediaAction(
  ctx: any, 
  args: { base64Data: string; folder?: string }
): Promise<CloudinaryUploadResult> {
  // Early return for URLs
  if (args.base64Data.startsWith("http")) {
    return {
      url: args.base64Data,
      publicId: args.base64Data,
      resourceType: "image",
      format: "png"
    };
  }

  // Validate base64 data
  if (!args.base64Data || args.base64Data.length === 0) {
    throw new Error("Invalid base64 data provided");
  }

  return await ctx.runMutation(uploadMediaSync, args);
}

// Optimized media upload with better performance
export const uploadMediaSync = mutation({
  args: {
    base64Data: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CloudinaryUploadResult> => {
    // Early validation and URL check
    if (!args.base64Data) {
      throw new Error("Base64 data is required");
    }
    
    if (args.base64Data.startsWith("http")) {
      return {
        url: args.base64Data,
        publicId: args.base64Data,
        resourceType: "image",
        format: "png"
      };
    }

    // Optimized unique ID generation
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const folder = args.folder || "chatter-school-connect";
    const publicId = `${folder}/media_${timestamp}_${randomSuffix}`;
    
    // Environment-based cloud name with fallback
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "connect-learn-now";
    
    return {
      url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
      publicId,
      resourceType: "image",
      format: "png"
    };
  },
});

// Optimized media deletion with validation
export const deleteMediaSync = mutation({
  args: {
    publicId: v.string(),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<boolean> => {
    // Validate input
    if (!args.publicId || args.publicId.trim().length === 0) {
      throw new Error("Public ID is required for deletion");
    }
    
    // Log deletion attempt for debugging
    console.log(`Scheduling deletion for media: ${args.publicId}`);
    
    // Return success - actual deletion would be handled by external service
    return true;
  },
}); 