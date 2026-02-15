
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
    // التحقق من حجم البيانات قبل الرفع لتجنب الأخطاء
    if (!fileData) throw new Error('No data provided for upload.');

    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      // تحسين جودة الضغط لزيادة سرعة الرفع والعرض لاحقاً
      quality: 'auto:eco',
      fetch_format: 'auto',
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Failed to upload media to cloud storage.');
  }
}
