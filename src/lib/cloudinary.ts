
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
 * في حال غياب الإعدادات، يعيد خطأً مفهوماً بدلاً من انهيار التطبيق.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  // فحص ما إذا كان الرابط يحتوي على القيم الافتراضية أو مفقود
  const isNotConfigured = !cloudinaryUrl || 
                          cloudinaryUrl.includes('<your_') || 
                          cloudinaryUrl.includes('<api_') ||
                          cloudinaryUrl.includes('your_cloud_name');

  if (isNotConfigured) {
    const errorMsg = 'إعدادات Cloudinary غير مكتملة. يرجى نسخ الرابط الحقيقي من (Cloudinary Dashboard) ووضعه في ملف .env';
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
    // تقديم رسالة خطأ واضحة للمستخدم في الواجهة
    throw new Error(error.message || 'حدث خطأ أثناء الرفع. تأكد من اتصال الإنترنت وصحة مفاتيح Cloudinary.');
  }
}
