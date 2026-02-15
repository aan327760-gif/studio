
'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * دالة لرفع الوسائط إلى Cloudinary.
 * تستخدم الإعدادات من CLOUDINARY_URL لضمان الدقة.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  // فحص ما إذا كان الرابط لا يزال يحتوي على قيم افتراضية
  if (!cloudinaryUrl || cloudinaryUrl.includes('<your_') || cloudinaryUrl.includes('your_cloud_name')) {
    throw new Error('إعدادات Cloudinary غير مكتملة. يرجى وضع الرابط الصحيح من لوحة تحكم Cloudinary في ملف .env');
  }

  // تهيئة الإعدادات
  cloudinary.config({
    secure: true
  });

  try {
    if (!fileData) throw new Error('لا توجد بيانات للرفع');

    // الرفع مع تحديد المجلد وزيادة المهلة الزمنية للفيديوهات الكبيرة
    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      timeout: 120000, // 2 دقيقة
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Error Details:', error);

    // معالجة خطأ "Invalid Signature" بشكل محدد جداً
    if (error.message?.includes('Invalid Signature') || error.http_code === 401) {
      throw new Error('خطأ في الرمز السري (API Secret): الرمز الذي وضعته غير صحيح. تأكد من نسخه بالضغط على زر "Show" بجانب API Secret في لوحة تحكم Cloudinary.');
    }

    if (error.message?.includes('api_key')) {
      throw new Error('مفتاح الـ API غير صحيح. يرجى مراجعته في ملف .env');
    }

    throw new Error(error.message || 'حدث خطأ أثناء رفع الوسائط. يرجى المحاولة مرة أخرى.');
  }
}
