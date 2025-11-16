/**
 * Scores Service
 *
 * Aggregates student data for instructor scores page.
 * Provides summary statistics, per-student breakdowns, and per-page analysis.
 *
 * T080: Implementation of scores service for data aggregation
 */

import type { StudentRecord, PageId, ServiceId } from '../types/contracts';

/**
 * Summary statistics for a student
 */
export interface StudentSummary {
  serviceId: ServiceId;
  name: string;
  totalAttempted: number;
  totalCorrect: number;
  percentage: number;
  pagesComplete: number;
  pagesTotal: number;
}

/**
 * Aggregated scores across all students
 */
export interface AggregatedScores {
  totalAttempted: number;
  totalCorrect: number;
  totalStudents: number;
  averagePercentage: number;
  students: StudentSummary[];
}

/**
 * Per-page statistics across all students
 */
export interface PageStatistics {
  pageId: PageId;
  studentsAttempted: number;
  totalAttempted: number;
  totalCorrect: number;
  averagePercentage: number;
  lowCompletionRate: boolean; // < 50%
}

/**
 * Aggregate student scores from multiple student records
 *
 * @param students - Array of student records to aggregate
 * @returns Aggregated scores with per-student summaries
 */
export function aggregateStudentScores(students: StudentRecord[]): AggregatedScores {
  if (students.length === 0) {
    return {
      totalAttempted: 0,
      totalCorrect: 0,
      totalStudents: 0,
      averagePercentage: 0,
      students: [],
    };
  }

  // Build student summaries
  const summaries = students.map((student) => createStudentSummary(student));

  // Calculate totals
  const totalAttempted = summaries.reduce((sum, s) => sum + s.totalAttempted, 0);
  const totalCorrect = summaries.reduce((sum, s) => sum + s.totalCorrect, 0);

  // Calculate average percentage
  const averagePercentage = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

  return {
    totalAttempted,
    totalCorrect,
    totalStudents: students.length,
    averagePercentage,
    students: summaries,
  };
}

/**
 * Create a summary for a single student
 *
 * @param student - Student record to summarize
 * @returns Student summary statistics
 */
function createStudentSummary(student: StudentRecord): StudentSummary {
  const pages = Object.values(student.pages);
  const pagesComplete = pages.filter((p) => p.state === 'complete').length;
  const pagesTotal = pages.length;

  console.log('[createStudentSummary] Student:', student.name);
  console.log('[createStudentSummary] Pages:', Object.entries(student.pages));
  pages.forEach((page, idx) => {
    const pageId = Object.keys(student.pages)[idx];
    console.log(`[createStudentSummary] Page ${pageId}:`, {
      state: page.state,
      answers: page.answers,
    });
  });
  console.log('[createStudentSummary] pagesComplete:', pagesComplete, '/', pagesTotal);

  // Calculate percentage
  const percentage = student.attempted > 0 ? (student.correct / student.attempted) * 100 : 0;

  return {
    serviceId: student.serviceId,
    name: student.name,
    totalAttempted: student.attempted,
    totalCorrect: student.correct,
    percentage,
    pagesComplete,
    pagesTotal,
  };
}

/**
 * Aggregate scores per page across all students
 *
 * @param students - Array of student records
 * @returns Map of page ID to page statistics
 */
export function aggregatePageScores(students: StudentRecord[]): Map<PageId, PageStatistics> {
  const pageStats = new Map<PageId, PageStatistics>();

  // Collect all unique page IDs
  const pageIds = new Set<PageId>();
  students.forEach((student) => {
    Object.keys(student.pages).forEach((pageId) => pageIds.add(pageId));
  });

  // Aggregate statistics for each page
  pageIds.forEach((pageId) => {
    const studentsWithPage = students.filter((s) => s.pages[pageId]);

    if (studentsWithPage.length === 0) {
      return;
    }

    const totalAttempted = studentsWithPage.reduce(
      (sum, s) => sum + s.pages[pageId].answers.length,
      0,
    );

    const totalCorrect = studentsWithPage.reduce(
      (sum, s) => sum + s.pages[pageId].answers.filter((a) => a.success).length,
      0,
    );

    const averagePercentage = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

    pageStats.set(pageId, {
      pageId,
      studentsAttempted: studentsWithPage.length,
      totalAttempted,
      totalCorrect,
      averagePercentage,
      lowCompletionRate: averagePercentage < 50,
    });
  });

  return pageStats;
}

/**
 * Sort comparison function type
 */
export type SortComparator<T> = (a: T, b: T) => number;

/**
 * Sort students by service ID (alphabetically)
 */
export function sortByServiceId(a: StudentRecord, b: StudentRecord): number {
  return a.serviceId.localeCompare(b.serviceId);
}

/**
 * Sort students by score (descending - highest first)
 */
export function sortByScore(a: StudentRecord, b: StudentRecord): number {
  return b.correct - a.correct;
}

/**
 * Sort students by name (alphabetically)
 */
export function sortByName(a: StudentRecord, b: StudentRecord): number {
  return a.name.localeCompare(b.name);
}

/**
 * Sort students by percentage (descending - highest first)
 */
export function sortByPercentage(a: StudentRecord, b: StudentRecord): number {
  const aPercentage = a.attempted > 0 ? a.correct / a.attempted : 0;
  const bPercentage = b.attempted > 0 ? b.correct / b.attempted : 0;
  return bPercentage - aPercentage;
}

/**
 * Filter predicate function type
 */
export type FilterPredicate<T> = (item: T) => boolean;

/**
 * Filter students by minimum percentage threshold
 *
 * @param threshold - Minimum percentage (0-100)
 * @returns Filter predicate
 */
export function filterByMinPercentage(threshold: number): FilterPredicate<StudentRecord> {
  return (student: StudentRecord) => {
    if (student.attempted === 0) return false;
    const percentage = (student.correct / student.attempted) * 100;
    return percentage >= threshold;
  };
}

/**
 * Filter students by service ID pattern
 *
 * @param pattern - Regex or string pattern to match
 * @returns Filter predicate
 */
export function filterByServiceIdPattern(pattern: string | RegExp): FilterPredicate<StudentRecord> {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return (student: StudentRecord) => regex.test(student.serviceId);
}

/**
 * Filter students with incomplete pages
 *
 * @returns Filter predicate
 */
export function filterWithIncompletePages(): FilterPredicate<StudentRecord> {
  return (student: StudentRecord) => {
    const pages = Object.values(student.pages);
    return pages.some((p) => p.state === 'incomplete' || p.state === 'unstarted');
  };
}

/**
 * Filter students with complete pages only
 *
 * @returns Filter predicate
 */
export function filterWithCompletePages(): FilterPredicate<StudentRecord> {
  return (student: StudentRecord) => {
    const pages = Object.values(student.pages);
    return pages.length > 0 && pages.every((p) => p.state === 'complete');
  };
}

/**
 * Get students with low scores (below threshold)
 *
 * @param students - Student records
 * @param threshold - Score threshold percentage (default: 60)
 * @returns Students below threshold
 */
export function getStudentsNeedingAttention(
  students: StudentRecord[],
  threshold = 60,
): StudentRecord[] {
  return students.filter(filterByMinPercentage(0)).filter((s) => {
    const percentage = s.attempted > 0 ? (s.correct / s.attempted) * 100 : 0;
    return percentage < threshold;
  });
}

/**
 * Get pages with low completion rates (below threshold)
 *
 * @param pageStats - Page statistics map
 * @param threshold - Completion rate threshold (default: 50)
 * @returns Array of page IDs with low completion rates
 */
export function getPagesNeedingAttention(
  pageStats: Map<PageId, PageStatistics>,
  threshold = 50,
): PageId[] {
  const lowPages: PageId[] = [];

  pageStats.forEach((stats) => {
    if (stats.averagePercentage < threshold) {
      lowPages.push(stats.pageId);
    }
  });

  return lowPages;
}
