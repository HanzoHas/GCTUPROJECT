"use node";
import { v2 as cloudinary } from "cloudinary";
import { ConvexError } from "convex/values";
import { action, internalMutation, internalAction, mutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../convex/_generated/api";
import { Id } from "../_generated/dataModel";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "demo",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
}

// Cloudinary result interface
interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  result?: string;
}

// Upload to Cloudinary action
export const uploadMedia = action({
  args: {
    base64Data: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CloudinaryUploadResult> => {
    try {
      const { base64Data, folder = "chatter-school-connect" } = args;
      
      // Strip the data URI prefix if present
      const base64WithoutPrefix = base64Data.replace(
        /^data:image\/[a-z]+;base64,/,
        ""
      );

      const result = await new Promise<CloudinaryResult>((resolve, reject) => {
        cloudinary.uploader.upload(
          `data:image/png;base64,${base64WithoutPrefix}`,
          {
            folder,
            resource_type: "auto", // auto-detect resource type
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryResult);
            }
          }
        );
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new ConvexError("Failed to upload media to Cloudinary");
    }
  },
});

// Delete from Cloudinary action
export const deleteMedia = action({
  args: {
    publicId: v.string(),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<boolean> => {
    try {
      const { publicId, resourceType = "image" } = args;
      
      const result = await new Promise<CloudinaryResult>((resolve, reject) => {
        cloudinary.uploader.destroy(
          publicId,
          { resource_type: resourceType },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryResult);
            }
          }
        );
      });

      return result.result === "ok";
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new ConvexError("Failed to delete media from Cloudinary");
    }
  },
});

// Create a wrapper action that uploads media and stores the result
export const uploadMediaAndStoreResult = internalAction({
  args: {
    taskId: v.string(),
    base64Data: v.string(),
    folder: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CloudinaryUploadResult> => {
    const { taskId, base64Data, folder } = args;
    
    // Upload the media
    const result: CloudinaryUploadResult = await ctx.runAction(api.utils.mediaUpload.uploadMedia, {
      base64Data,
      folder,
    });
    
    // Store the result directly via a mutation
    await ctx.runMutation(internal.utils.tempStorage.storeTempUploadResult, {
      taskId,
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
      format: result.format,
    });
    
    return result;
  },
}); 