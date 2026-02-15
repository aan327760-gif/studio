'use server';

/**
 * @fileOverview درع المحتوى السيادي - نظام فحص ذكي مدعوم بـ Gemini.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ModerateContentInputSchema = z.object({
  text: z.string().describe('النص المراد فحصه.'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

const ModerateContentOutputSchema = z.object({
  isAppropriate: z.boolean().describe('True إذا كان المحتوى لائقاً سيادياً.'),
  moderationFlags: z.array(z.string()).describe('التصنيفات المكتشفة (عنف، كراهية، إباحية، إلخ).'),
  reasoning: z.string().describe('شرح مختصر للقرار باللغة العربية.'),
  severity: z.enum(['low', 'medium', 'high']).describe('مستوى خطورة المخالفة.'),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;

export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  const { output } = await ai.generate({
    prompt: `أنت نظام الرقابة السيادي لمنصة Unbound. 
    مهمتك فحص النص التالي والتأكد من توافقه مع قيم الحرية والسيادة والاحترام.
    يُمنع منعاً باتاً: التحريض على العنف، الكراهية الصريحة، المحتوى الإباحي، أو السب القاذف.
    نحن نشجع حرية التعبير الجريئة لكن نرفض الإساءة المباشرة.
    
    النص: ${input.text}`,
    output: { schema: ModerateContentOutputSchema }
  });
  
  return output!;
}

/**
 * تحليل البلاغات للمشرفين.
 */
const AnalyzeReportInputSchema = z.object({
  postContent: z.string(),
  reason: z.string(),
});
export type AnalyzeReportInput = z.infer<typeof AnalyzeReportInputSchema>;

export async function analyzeReportAI(input: AnalyzeReportInput) {
  const { output } = await ai.generate({
    prompt: `أنت مستشار إداري ذكي. تلقينا بلاغاً عن منشور.
    محتوى المنشور: "${input.postContent}"
    سبب البلاغ المقدم من المستخدم: "${input.reason}"
    
    حلل الموقف وقدم توصية للمشرف (هل يحذف المنشور؟ هل يحظر المستخدم؟ أم يتجاهل البلاغ؟) مع ذكر السبب.`,
    output: { 
      schema: z.object({
        recommendation: z.string(),
        suggestedAction: z.enum(['ignore', 'delete', 'ban_user']),
        riskLevel: z.string()
      })
    }
  });
  return output!;
}
