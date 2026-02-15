'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * مكتبة Cloudinary تلتقط CLOUDINARY_URL من متغيرات البيئة تلقائياً.
 * نقوم فقط بضبط الإعدادات لضمان استخدام الروابط الآمنة (HTTPS).
 */
cloudinary.config({
  secure: true
});

/**
 * يقوم برفع ملف مشفر (base64) أو رابط بيانات إلى Cloudinary.
 * @param fileData بيانات الملف كسلسلة base64 أو رابط بيانات.
 * @param resourceType نوع المورد ('image' أو 'video' أو 'raw' للملفات الصوتية).
 * @returns الرابط الآمن للملف المرفوع.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  // فحص ما إذا كان الرابط مهيأ أم لا يزال يحتوي على القيم الافتراضية
  if (!cloudinaryUrl || cloudinaryUrl.includes('<your_') || cloudinaryUrl.includes('your_cloud_name')) {
    const errorMsg = 'تنبيه: إعدادات Cloudinary ناقصة. يرجى استبدال <your_api_key> و <your_api_secret> في ملف .env بمفاتيحك الحقيقية من لوحة تحكم Cloudinary.';
    console.error('Cloudinary Configuration Error:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    if (!fileData) throw new Error('No data provided for upload.');

    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error details:', error);
    throw new Error(error.message || 'Failed to upload media to cloud storage.');
  }
}
