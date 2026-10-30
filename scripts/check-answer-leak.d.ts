/** Type declarations for scripts/check-answer-leak.js (used by its unit test). */

export interface AnswerLeak {
  row: number;
  column: 'answer' | 'tolerance';
  value: string;
}

export const SEARCH_INDEX_DIR: string;

export function findLeaksInHtml(html: string): AnswerLeak[];

export function checkOutput(outputDir: string): {
  leaks: (AnswerLeak & { file: string })[];
  searchIndex: boolean;
};
