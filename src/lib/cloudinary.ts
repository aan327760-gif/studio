
'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

/**
 * Uploads a base64 encoded file or a data URI to Cloudinary.
 * @param fileData The file data as a base64 string or data URI.
 * @param resourceType The type of resource ('image', 'video', or 'raw' for audio).
 * @returns The secure URL of the uploaded file.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload media to cloud storage.');
  }
}
