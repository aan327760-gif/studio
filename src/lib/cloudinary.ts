
'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * إعداد Cloudinary للعمل مع الروابط الآمنة.
 * يتم جلب الإعدادات تلقائياً من متغير البيئة CLOUDINARY_URL في ملف .env
 */
cloudinary.config({
  secure: true
});

/**
 * يرفع الملف إلى Cloudinary مع فحص مسبق للإعدادات.
 * يدعم الصور، الفيديوهات، والمقاطع الصوتية.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  // فحص ما إذا كان الرابط مهيأ بشكل صحيح
  const isNotConfigured = !cloudinaryUrl || 
                          cloudinaryUrl.includes('<your_') || 
                          cloudinaryUrl.includes('your_cloud_name');

  if (isNotConfigured) {
    const errorMsg = 'إعدادات Cloudinary غير مكتملة في ملف .env. يرجى التأكد من وضع الرابط الصحيح من لوحة تحكم Cloudinary.';
    console.warn('Configuration Warning:', errorMsg);
    throw new Error(errorMsg);
  }

  try {
    if (!fileData) throw new Error('لا توجد بيانات للرفع');

    // الرفع باستخدام واجهة الـ API الخاصة بـ Cloudinary
    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      // تحسين المعالجة للفيديوهات الطويلة
      timeout: 120000, // 2 دقيقة
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Execution Error:', error);
    // توفير رسالة خطأ صديقة للمستخدم
    if (error.message?.includes('invalid api_key')) {
      throw new Error('مفتاح الـ API الخاص بـ Cloudinary غير صحيح. يرجى مراجعة ملف .env');
    }
    throw new Error(error.message || 'حدث خطأ أثناء رفع الوسائط. يرجى المحاولة مرة أخرى.');
  }
}
