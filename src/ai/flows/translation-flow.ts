'use server';

/**
 * @fileOverview تدفق الترجمة السيادي - يكسر حواجز اللغة في Unbound.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TranslateInputSchema = z.object({
  text: z.string().describe('النص المراد ترجمته.'),
  targetLang: z.string().describe('اللغة الهدف (مثلاً: Arabic, English).'),
});

const TranslateOutputSchema = z.object({
  translatedText: z.string().describe('النص بعد الترجمة.'),
});

export async function translateContent(input: { text: string, targetLang: string }): Promise<string> {
  const { output } = await ai.generate({
    prompt: `Translate the following text to ${input.targetLang}. 
    Maintain the original tone, formatting, and emojis. 
    If the text is already in the target language, return it as is.
    
    Text: ${input.text}`,
    output: { schema: TranslateOutputSchema }
  });

  return output?.translatedText || input.text;
}
