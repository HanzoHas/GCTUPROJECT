"use node";
// This file contains only Node.js actions for media handling
import { action } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "demo",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  secure: true,
});

// Define the result interface
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

// Internal implementation - Node.js action
export const uploadMedia = action({
  args: {
    base64Data: v.string(),
    folder: v.optional(v.string()),
    publicId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CloudinaryUploadResult> => {
    const { base64Data, folder = "chatter-school-connect", publicId } = args;
    
    try {
      // Strip the data URI prefix if present
      const base64WithoutPrefix = base64Data.replace(
        /^data:image\/[a-z]+;base64,/,
        ""
      );

      const result: CloudinaryResult = await new Promise<CloudinaryResult>((resolve, reject) => {
        cloudinary.uploader.upload(
          `data:image/png;base64,${base64WithoutPrefix}`,
          {
            folder,
            public_id: publicId ? publicId.replace(`${folder}/`, '') : undefined, // Use the provided publicId if available
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
      console.error("Media upload error:", error);
      throw new ConvexError("Failed to upload media");
    }
  },
});

// Internal implementation - Node.js action
export const deleteMedia = action({
  args: {
    publicId: v.string(),
    resourceType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const { publicId, resourceType = "image" } = args;
    
    try {
      const result: CloudinaryResult = await new Promise<CloudinaryResult>((resolve, reject) => {
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
      console.error("Media delete error:", error);
      throw new ConvexError("Failed to delete media");
    }
  },
}); 

// Helper function to store an image from a data URL
export const storeImage = async (
  ctx: any,
  userId: string,
  imageData: string
): Promise<string> => {
  try {
    // Generate a unique folder name using the userId
    const folder = `chatter-school-connect/users/${userId}/posts`;
    
    // Upload the image to Cloudinary
    const result = await ctx.runAction(uploadMedia, {
      base64Data: imageData,
      folder,
    });
    
    return result.url;
  } catch (error) {
    console.error("Image storage error:", error);
    throw new ConvexError("Failed to store image");
  }
}; 