'use server';

/**
 * @fileOverview محرك الإيجاز السيادي - تلخيص الأفكار العميقة بذكاء.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeInputSchema = z.object({
  text: z.string().describe('النص الطويل المراد تلخيصه.'),
});

const SummarizeOutputSchema = z.object({
  summary: z.string().describe('الملخص المركز للنص.'),
});

export async function summarizeInsight(text: string): Promise<string> {
  const { output } = await ai.generate({
    prompt: `أنت مساعد الإيجاز في منصة Unbound. 
    مهمتك تلخيص النص التالي بأسلوب بليغ، مركز، ومحايد. 
    اجعل الملخص لا يتجاوز جملتين تعبران عن جوهر الفكرة.
    
    النص: "${text}"`,
    output: { schema: SummarizeOutputSchema }
  });

  return output?.summary || text;
}
