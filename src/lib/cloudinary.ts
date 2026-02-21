'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * دالة لرفع الوسائط إلى Cloudinary.
 * تستخدم الرابط المباشر من ملف .env لضمان أعلى مستوى من الأمان والسهولة.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error('إعدادات Cloudinary مفقودة');
  }

  cloudinary.config({
    secure: true
  });

  try {
    if (!fileData) throw new Error('لا توجد بيانات للرفع');

    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      timeout: 120000,
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Error:', error);
    throw new Error(error.message || 'فشل الرفع');
  }
}
