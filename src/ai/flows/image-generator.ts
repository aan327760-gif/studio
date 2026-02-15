'use server';

/**
 * @fileOverview تدفق لتوليد الصور باستخدام Imagen.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('وصف الصورة المراد توليدها.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('رابط الصورة المولد (Base64).'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateSovereignImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const { media } = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: `A high-quality, cinematic, sovereign style digital art of: ${input.prompt}. Unbound aesthetic, epic lighting.`,
  });

  if (!media) {
    throw new Error('فشل توليد الصورة.');
  }

  return { imageUrl: media.url };
}
