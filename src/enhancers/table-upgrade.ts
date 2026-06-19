/**
 * Post-login table upgrade.
 *
 * Upgrades quiz/analysis tables to interactive mode after a student logs in, or
 * reveals answers + wires instructor toggles for an instructor. Extracted from
 * `event-coordinator.ts` so the coordinator only routes events.
 */

import { enhanceQuizTable, getQuizTableMetadata } from './quiz-table.js';
import { enhanceAnalysisTable } from './analysis-table.js';
import { revealInstructorAnswers } from './instructor-answer-reveal.js';
import { getPageIdFromUrl } from '../utils/page-id.js';
import { STORAGE_KEYS } from '../types/contracts.js';
import { info } from '../utils/logger.js';

/**
 * Upgrade all tables to interactive mode after login.
 *
 * Instructors keep non-interactive tables but get answers revealed; students
 * get interactive quiz/analysis tables for the current page.
 */
export function upgradeTablesAfterLogin(): void {
  const pageId = getPageIdFromUrl();

  if (!pageId) {
    info('No pageId found, skipping table upgrade to interactive mode');
    return;
  }

  const isInstructor = sessionStorage.getItem(STORAGE_KEYS.INSTRUCTOR) === 'true';
  if (isInstructor) {
    revealTablesForInstructor(pageId);
    return;
  }

  const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');
  if (quizTables.length > 0) {
    info(`Upgrading ${quizTables.length} quiz table(s) to interactive mode...`);
    quizTables.forEach((table) => enhanceQuizTable(table, { interactive: true, pageId }));
  }

  const analysisTables = document.querySelectorAll<HTMLTableElement>('table.qd-analysis');
  if (analysisTables.length > 0) {
    info(`Upgrading ${analysisTables.length} analysis table(s) to interactive mode...`);
    analysisTables.forEach((table) => enhanceAnalysisTable(table, { interactive: true, pageId }));
  }
}

/**
 * Reveal answers and wire instructor toggles on the current page's quiz tables.
 */
function revealTablesForInstructor(pageId: string): void {
  info('Instructor session detected, tables remain in non-interactive mode with answers visible');
  const quizTables = document.querySelectorAll<HTMLTableElement>('table.qd-quiz');

  quizTables.forEach((table) => {
    const metadata = getQuizTableMetadata(table);
    if (!metadata) return;
    metadata.pageId = pageId;
    // Post-login path does not add the qd-quiz-instructor visibility class.
    revealInstructorAnswers(table, metadata);
  });
}
