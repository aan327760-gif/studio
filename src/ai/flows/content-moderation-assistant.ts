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
  'UNSURE', // For cases where the model is uncertain but flags for manual review
]);

const ModerateContentOutputSchema = z.object({
  isAppropriate: z.boolean().describe('True if the content is appropriate according to AI analysis, false otherwise.'),
  moderationFlags: z.array(moderationCategories).describe('A list of detected inappropriate content categories. Empty if appropriate. From AI analysis.'),
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
    // For a moderation tool, we want the AI to analyze and identify issues
    // even if the content itself is highly problematic. We rely on the AI's
    // output for flagging, rather than blocking the response outright. The model
    // configured in genkit.ts might have default safety settings, but for this
    // specific task, we override them to ensure a response is always returned for analysis.
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an AI content moderation assistant for a social media platform called LammaFeed. Your task is to analyze user-generated content, which can be in English or Arabic, and determine if it contains inappropriate material.

Inappropriate material includes:
- Hate speech: Content that expresses hatred or disparagement towards a person or group based on protected characteristics (e.g., race, ethnicity, origin, religion, gender, sexual orientation, disability).
- Sexually explicit content: Content depicting nudity, sexual acts, or material with explicit sexual overtones.
- Harassment: Content that targets, threatens, bullies, or shames individuals.
- Dangerous content: Content promoting self-harm, illegal activities, or inciting violence.
- Civic integrity violations: Content that undermines democratic processes, spreads misinformation about public safety, elections, or health.
- Spam: Unsolicited commercial content, repetitive messages, phishing attempts, or deceptive practices to manipulate platform engagement.

Carefully evaluate the following content. If you find any inappropriate content, set 'isAppropriate' to false and populate 'moderationFlags' with ALL relevant categories from the following list. If multiple categories apply, list them all.
- HARM_CATEGORY_HATE_SPEECH
- HARM_CATEGORY_SEXUALLY_EXPLICIT
- HARM_CATEGORY_HARASSMENT
- HARM_CATEGORY_DANGEROUS_CONTENT
- HARM_CATEGORY_CIVIC_INTEGRITY
- SPAM
- UNSURE (Use this if you are not certain but suspect the content might be inappropriate and requires manual review.)

If the content is completely appropriate, set 'isAppropriate' to true and leave 'moderationFlags' as an empty array.
Optionally, provide a brief 'reasoning' (maximum 2-3 sentences) for your decision, especially when flagging content.

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
      // With safetySettings set to BLOCK_NONE, we expect an output for analysis
      // rather than the content being blocked by default API filters.
      const { output } = await moderateContentPrompt(input);

      if (!output) {
        // This case should ideally not happen with BLOCK_NONE, but provides robustness.
        return {
          isAppropriate: false,
          moderationFlags: ['UNSURE'],
          reasoning: 'AI failed to produce an output for moderation analysis.',
        };
      }
      return output;
    } catch (error: any) {
      console.error('Error during content moderation:', error);
      return {
        isAppropriate: false,
        moderationFlags: ['UNSURE'],
        reasoning: `An unexpected error occurred during moderation: ${error.message || 'Unknown error'} `,
      };
    }
  }
);
