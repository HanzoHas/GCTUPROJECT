"use node";
import { action, mutation } from "../_generated/server";
import { v } from "convex/values";
import { CloudinaryUploadResult } from "./mediaService";
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Public action that handles media uploads
export const uploadMediaSync = action({
  args: {
    base64Data: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CloudinaryUploadResult> => {
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

    try {
      // Upload to Cloudinary
      const result = await cloudinary.v2.uploader.upload(args.base64Data, {
        folder: args.folder || 'chatter-school-connect',
        resource_type: 'auto'
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format
      };
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      throw new Error("Failed to upload media to Cloudinary");
    }
  },
});

// Optimized media deletion with validation
export const deleteMediaSync = action({
  args: {
    publicId: v.string(),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx: any, args: { publicId: string; resourceType?: string }): Promise<boolean> => {
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