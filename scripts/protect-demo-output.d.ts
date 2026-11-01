/** Type declarations for scripts/protect-demo-output.js (used by its unit test). */

export const DEFAULT_KEY: string;

export function encodeAnswer(value: string, key: string): string;

export function countQuizRows(html: string): number;

export function protectHtml(html: string, options: { key: string; total: string }): string;

export function protectSearchPage(html: string): string;

export function protectOutput(
  outputDir: string,
  options?: { key?: string },
): { pages: number; questionTotal: number };
