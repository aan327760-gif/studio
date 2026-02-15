
'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * إعداد Cloudinary للعمل مع الروابط الآمنة.
 */
cloudinary.config({
  secure: true
});

/**
 * يرفع الملف إلى Cloudinary مع فحص مسبق للإعدادات.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  // فحص ما إذا كان الرابط يحتوي على القيم الافتراضية أو مفقود
  const isNotConfigured = !cloudinaryUrl || 
                          cloudinaryUrl.includes('<your_') || 
                          cloudinaryUrl.includes('api_secret');

  if (isNotConfigured) {
    const errorMsg = 'إعدادات Cloudinary غير مكتملة. يا زعيم، نحتاج للرمز السري (API Secret) ليعمل الرفع. تجده في لوحة تحكم Cloudinary بجانب المفتاح الذي أرسلته.';
    console.warn('Configuration Warning:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    if (!fileData) throw new Error('لا توجد بيانات للرفع');

    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Execution Error:', error);
    throw new Error(error.message || 'حدث خطأ أثناء الرفع. تأكد من صحة المفتاح السري في ملف .env');
  }
}
