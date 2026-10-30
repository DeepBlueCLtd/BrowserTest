/** Type declarations for scripts/finalise-output.js (used by its unit test). */

export function countQuestions(html: string): number;

export function stampQuestionTotal(html: string, total: number): { html: string; stamped: boolean };

export function finaliseOutput(outputDir: string): {
  total: number;
  stamped: number;
  leaks: unknown[];
  searchIndex: boolean;
};
