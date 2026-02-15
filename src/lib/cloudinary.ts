
'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * دالة لرفع الوسائط إلى Cloudinary.
 * تستخرج الإعدادات مباشرة من CLOUDINARY_URL لضمان الدقة.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (!cloudinaryUrl || cloudinaryUrl.includes('<your_')) {
    throw new Error('إعدادات Cloudinary غير مكتملة. يرجى التأكد من وضع الرابط الصحيح في ملف .env');
  }

  // تهيئة الإعدادات من الرابط مباشرة
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

    // معالجة خطأ التوقيع غير الصحيح
    if (error.message?.includes('Invalid Signature')) {
      throw new Error('خطأ في "التوقيع": الرمز السري (API Secret) غير صحيح. يرجى نسخه مجدداً من لوحة تحكم Cloudinary.');
    }

    if (error.message?.includes('api_key')) {
      throw new Error('مفتاح الـ API غير صحيح. يرجى التأكد من البيانات في ملف .env');
    }

    throw new Error(error.message || 'حدث خطأ أثناء رفع الوسائط. يرجى المحاولة مرة أخرى.');
  }
}
