'use server';

/**
 * @fileOverview مساعد إبداعي لتحسين النصوص.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EnhanceTextInputSchema = z.object({
  text: z.string().describe('النص المراد تحسينه.'),
  tone: z.enum(['sovereign', 'poetic', 'professional', 'casual']).describe('الأسلوب المطلوب.'),
});
export type EnhanceTextInput = z.infer<typeof EnhanceTextInputSchema>;

const EnhanceTextOutputSchema = z.object({
  enhancedText: z.string().describe('النص المحسن.'),
});
export type EnhanceTextOutput = z.infer<typeof EnhanceTextOutputSchema>;

export async function enhancePostText(input: EnhanceTextInput): Promise<EnhanceTextOutput> {
  const { output } = await ai.generate({
    prompt: `أنت مساعد إبداعي في منصة Unbound. 
    قم بإعادة صياغة النص التالي بأسلوب ${input.tone}. 
    اجعل النص قوياً، جذاباً، ومعبراً عن الحرية والسيادة.
    
    النص الأصلي: ${input.text}`,
    output: { schema: EnhanceTextOutputSchema }
  });
  return output!;
}
