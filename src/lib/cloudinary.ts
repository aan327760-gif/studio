
'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * دالة لرفع الوسائط إلى Cloudinary.
 * تستخدم الرابط المباشر من ملف .env لضمان أعلى مستوى من الأمان والسهولة.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  // فحص وجود الرابط في البيئة
  if (!process.env.CLOUDINARY_URL) {
    throw new Error('إعدادات Cloudinary مفقودة في ملف .env');
  }

  // تهيئة Cloudinary (يتم جلب الإعدادات تلقائياً من CLOUDINARY_URL)
  cloudinary.config({
    secure: true
  });

  try {
    if (!fileData) throw new Error('لا توجد بيانات للرفع');

    // الرفع مع تحديد المجلد وزيادة المهلة الزمنية لدعم الفيديوهات
    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      timeout: 120000, // 2 دقيقة
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    
    // رسائل خطأ واضحة للمستخدم
    if (error.message?.includes('Invalid Signature') || error.http_code === 401) {
      throw new Error('خطأ في "التوقيع" (Signature): الرمز السري الذي وضعناه قد يكون غير مفعل أو تم تغييره.');
    }

    throw new Error(error.message || 'حدث خطأ أثناء رفع الوسائط. يرجى المحاولة مرة أخرى.');
  }
}
