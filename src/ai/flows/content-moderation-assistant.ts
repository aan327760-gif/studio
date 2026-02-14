'use server';

/**
 * @fileOverview نظام داخلي بسيط لفحص المحتوى (Content Moderation).
 * يقوم بفحص النصوص بحثاً عن كلمات غير لائقة محددة مسبقاً بدلاً من الاعتماد على ذكاء اصطناعي خارجي.
 */

import { z } from 'zod';

// قائمة بسيطة بالكلمات المحظورة (يمكنك توسيعها لاحقاً)
const PROHIBITED_WORDS = [
  'badword1', 'badword2', 'سب', 'شتم', 'قذف', 'عنف', 'إباحي'
];

const ModerateContentInputSchema = z.object({
  text: z.string().describe('النص المراد فحصه.'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

const ModerateContentOutputSchema = z.object({
  isAppropriate: z.boolean().describe('True إذا كان المحتوى لائقاً.'),
  moderationFlags: z.array(z.string()).describe('قائمة التصنيفات المكتشفة.'),
  reasoning: z.string().optional().describe('سبب القرار.'),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;

/**
 * دالة فحص المحتوى - تعمل الآن داخلياً بدون الحاجة للاتصال بخوادم خارجية.
 */
export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  const text = input.text.toLowerCase();
  const detectedWords = PROHIBITED_WORDS.filter(word => text.includes(word));

  if (detectedWords.length > 0) {
    return {
      isAppropriate: false,
      moderationFlags: ['HATE_SPEECH_OR_HARASSMENT'],
      reasoning: `تم اكتشاف كلمات غير لائقة: (${detectedWords.join(', ')})`,
    };
  }

  return {
    isAppropriate: true,
    moderationFlags: [],
    reasoning: 'المحتوى يبدو سليماً وفقاً لنظام الفحص الداخلي.',
  };
}
