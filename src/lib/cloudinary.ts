
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

  // فحص ما إذا كان الرابط لا يزال يحتوي على القيم الافتراضية
  if (!cloudinaryUrl || cloudinaryUrl.includes('<your_') || cloudinaryUrl.includes('your_cloud_name')) {
    const errorMsg = 'إعدادات Cloudinary غير مكتملة. يرجى وضع المفاتيح الحقيقية (API Key & Secret) في ملف .env';
    console.error('Configuration Error:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    if (!fileData) throw new Error('No data provided');

    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Error:', error);
    throw new Error(error.message || 'فشل رفع الملف. تأكد من صحة مفاتيح Cloudinary في ملف .env');
  }
}
