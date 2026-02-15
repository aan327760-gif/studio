
'use server';

import { v2 as cloudinary } from 'cloudinary';

/**
 * دالة لرفع الوسائط إلى Cloudinary.
 * تم تحسينها لتعطي رسائل خطأ واضحة جداً للمستخدم في حال نقص البيانات السرية.
 */
export async function uploadToCloudinary(fileData: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  // فحص شامل للإعدادات
  if (!cloudinaryUrl || cloudinaryUrl.includes('your_') || cloudinaryUrl.includes('ضع_الرمز_السري')) {
    throw new Error('بيانات Cloudinary غير مكتملة. يرجى الذهاب إلى ملف .env واستبدال "ضع_الرمز_السري_الحقيقي_هنا" بالرمز السري الحقيقي (تجد بجانبه زر Show في Cloudinary).');
  }

  // تهيئة الإعدادات باستخدام الرابط المباشر من البيئة
  cloudinary.config({
    secure: true
  });

  try {
    if (!fileData) throw new Error('لا توجد بيانات للرفع');

    // الرفع مع تحديد المجلد وزيادة المهلة الزمنية
    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: resourceType,
      folder: 'unbound_media',
      timeout: 120000, // 2 دقيقة للفيديوهات الكبيرة
    });
    
    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Error Details:', error);

    // معالجة خطأ التوقيع (Signature) الذي يدل على خطأ في الرمز السري
    if (error.message?.includes('Invalid Signature') || error.http_code === 401) {
      throw new Error('خطأ في "التوقيع" (Signature): الرمز السري (API Secret) الذي وضعته في ملف .env غير صحيح. تأكد من الضغط على زر "Show" في موقع Cloudinary لنسخ الرمز الحقيقي.');
    }

    if (error.message?.includes('api_key')) {
      throw new Error('مفتاح الـ API (459481774199522) غير صحيح. يرجى التأكد من نسخه بشكل دقيق.');
    }

    throw new Error(error.message || 'حدث خطأ غير متوقع أثناء الرفع. يرجى المحاولة مرة أخرى.');
  }
}
