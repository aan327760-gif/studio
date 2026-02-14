'use server';

/**
 * @fileOverview A Genkit flow for moderating user-generated content.
 *
 * - moderateContent - A function that handles the content moderation process.
 * - ModerateContentInput - The input type for the moderateContent function.
 * - ModerateContentOutput - The return type for the moderateContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerateContentInputSchema = z.object({
  text: z.string().describe('The content to be moderated, can be in English or Arabic.'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

const moderationCategories = z.enum([
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_CIVIC_INTEGRITY',
  'SPAM',
  'UNSURE',
]);

const ModerateContentOutputSchema = z.object({
  isAppropriate: z.boolean().describe('True if the content is appropriate according to AI analysis, false otherwise.'),
  moderationFlags: z.array(moderationCategories).describe('A list of detected inappropriate content categories. Empty if appropriate.'),
  reasoning: z.string().optional().describe('Optional reasoning provided by the AI for its decision.'),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;

export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  return moderateContentFlow(input);
}

const moderateContentPrompt = ai.definePrompt({
  name: 'moderateContentPrompt',
  input: { schema: ModerateContentInputSchema },
  output: { schema: ModerateContentOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an AI content moderation assistant for Unbound. Analyze the following content for hate speech, explicit material, or harassment.
  
  Content to analyze:
  {{{text}}} `,
});

const moderateContentFlow = ai.defineFlow(
  {
    name: 'moderateContentFlow',
    inputSchema: ModerateContentInputSchema,
    outputSchema: ModerateContentOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await moderateContentPrompt(input);

      if (!output) {
        return {
          isAppropriate: true,
          moderationFlags: [],
          reasoning: 'AI returned empty output, proceeding by default.',
        };
      }
      return output;
    } catch (error: any) {
      console.error('Moderation error (likely missing API key):', error);
      // Bypass moderation in prototype if AI service is not configured
      return {
        isAppropriate: true,
        moderationFlags: [],
        reasoning: `Moderation skipped (Technical error: ${error.message}). In a production app, please set GOOGLE_GENAI_API_KEY.`,
      };
    }
  }
);
