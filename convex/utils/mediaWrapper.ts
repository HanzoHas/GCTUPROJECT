import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { CloudinaryUploadResult } from "./mediaService";

// Helper function to upload media for other modules
export async function uploadMediaAction(
  ctx: any, 
  args: { base64Data: string; folder?: string }
): Promise<CloudinaryUploadResult> {
  // If the input is already a URL, just return it
  if (args.base64Data.startsWith("http")) {
    return {
      url: args.base64Data,
      publicId: args.base64Data,
      resourceType: "image",
      format: "png"
    };
  }

  // Use the existing uploadMediaSync mutation
  return await ctx.runMutation(uploadMediaSync, args);
}

// Public wrapper mutation that can be called from other mutations
export const uploadMediaSync = mutation({
  args: {
    base64Data: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CloudinaryUploadResult> => {
    // If the input is already a URL, just return it
    if (args.base64Data.startsWith("http")) {
      return {
        url: args.base64Data,
        publicId: args.base64Data,
        resourceType: "image",
        format: "png"
      };
    }

    // Generate a unique ID for the resource with timestamp
    const timestamp = new Date().getTime();
    const folder = args.folder || "chatter-school-connect";
    const publicId = `${folder}/generated_${timestamp}`;
    
    // This runs the action in the background
    await ctx.scheduler.runAfter(0, api.utils.mediaService.uploadMedia, {
      base64Data: args.base64Data,
      folder,
      publicId, // Pass the generated publicId to ensure consistency
    });
    
    // Get the cloud name from environment, or use a safe default if not set
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "connect-learn-now";
    
    // Return a best-effort result
    return {
      url: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
      publicId: publicId,
      resourceType: "image",
      format: "png"
    };
  },
});

// Public wrapper mutation that can be called from other mutations
export const deleteMediaSync = mutation({
  args: {
    publicId: v.string(),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<boolean> => {
    // In Convex, we can't directly wait for action results from mutations
    // So we run the action and assume success
    
    // This runs the action in the background
    await ctx.scheduler.runAfter(0, api.utils.mediaService.deleteMedia, args);
    
    // Always return true (assumption of success)
    // The actual deletion happens asynchronously
    return true;
  },
}); 