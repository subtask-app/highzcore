// Default Insights question set — what a creator gets when they don't write
// their own questions. These are deliberately broad + structurally varied
// (multi-choice + short text + long text + timestamp + rating) so the
// report can show charts AND quotes.
//
// Question shape matches the JSONB schema on insights_studies.questions
// (src/lib/supabase/types.ts).

import type { InsightQuestion } from '@/lib/supabase/types';

export const DEFAULT_QUESTIONS: InsightQuestion[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    prompt: 'Did the title and thumbnail match what you got?',
    required: true,
    options: [
      'Yes, it matched exactly',
      'Mostly — but I expected something slightly different',
      'No, it felt misleading',
    ],
  },
  {
    id: 'q2',
    type: 'rating',
    prompt: 'How interesting was this video overall? (1 = boring, 5 = great)',
    required: true,
  },
  {
    id: 'q3',
    type: 'timestamp',
    prompt: 'At what point in the video did you start losing interest?',
    required: false,
  },
  {
    id: 'q4',
    type: 'multiple_choice',
    prompt: 'Would you subscribe to this channel after watching?',
    required: true,
    options: [
      'Yes, definitely',
      'Maybe, if I watched another video first',
      'No',
    ],
  },
  {
    id: 'q5',
    type: 'short_text',
    prompt: "What's the first thing you'd change about this video?",
    required: false,
  },
  {
    id: 'q6',
    type: 'long_text',
    prompt: 'Any other feedback for the creator? (optional)',
    required: false,
  },
];

// What workers should typically spend on a study, in minutes. Used for
// payout sizing and display.
export function expectedMinutesFor(videoSeconds: number, questionCount: number): number {
  const watching = Math.ceil(videoSeconds / 60);          // 1 minute per video minute
  const answering = Math.ceil(questionCount * 0.75);      // ~45s per question
  return Math.max(3, watching + answering);
}
