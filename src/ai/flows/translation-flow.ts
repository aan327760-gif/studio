
'use server';

/**
 * @fileOverview تدفق الترجمة السيادي - كاسر الحواجز اللغوية.
 * يستخدم Gemini لترجمة النصوص مع الحفاظ على الروح، التنسيق، والرموز التعبيرية.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranslateInputSchema = z.object({
  text: z.string().describe('النص المراد ترجمته.'),
  targetLang: z.string().describe('اللغة الهدف (مثلاً: Arabic, English).'),
});

const TranslateOutputSchema = z.object({
  translatedText: z.string().describe('النص بعد الترجمة الاحترافية.'),
});

/**
 * ترجمة المحتوى بذكاء سيادي.
 */
export async function translateContent(input: { text: string, targetLang: string }): Promise<string> {
  // استخدام ai.generate مباشرة للحصول على أدق النتائج في الترجمة
  const { output } = await ai.generate({
    prompt: `أنت مترجم سيادي محترف في منصة Unbound. 
    مهمتك ترجمة النص التالي إلى ${input.targetLang}.
    
    القواعد المطلقة:
    1. حافظ على النبرة الأصلية (رسمية، ودية، حماسية).
    2. لا تقم بتغيير الرموز التعبيرية (Emojis) أو أماكنها.
    3. إذا كان النص يحتوي على وسوم (#Hashtags) اتركها كما هي.
    4. إذا كان النص بالفعل باللغة الهدف، أعده كما هو.
    5. قدم ترجمة بشرية طبيعية، وليست ترجمة آلية حرفية.
    
    النص المراد ترجمته: 
    "${input.text}"`,
    output: { schema: TranslateOutputSchema }
  });

  return output?.translatedText || input.text;
}
