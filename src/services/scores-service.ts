/**
 * Scores calculation service
 * Calculates student scores and summaries from StudentRecord data
 */

import type { StudentRecord } from '../types/contracts.js';

export interface StudentSummary {
  serviceId: string;
  name: string;
  attempted: number;
  correct: number;
  percentage: number;
}

export interface PageSummary {
  pageId: string;
  attempted: number;
  correct: number;
  percentage: number;
}

/** Right-first-time figures for one student (SRD 013 SCO-04). */
export interface FirstAttemptSummary {
  /** Answered questions whose attempts are tracked (answered since v3) */
  tracked: number;
  /** Tracked questions answered correctly at the first attempt */
  correctFirstTime: number;
  /** Answered questions from before v3, whose first attempt is unknown */
  untracked: number;
}

/**
 * Count right-first-time answers across a student's pages.
 *
 * @param student - Student record
 * @returns Tracked, correct-first-time and untracked counts
 */
export function summariseFirstAttempts(student: StudentRecord): FirstAttemptSummary {
  let tracked = 0;
  let correctFirstTime = 0;
  let untracked = 0;
  for (const page of Object.values(student.pages)) {
    for (const answer of page.answers ?? []) {
      if (!answer || answer.answer.trim() === '') continue;
      if (answer.firstSuccess === undefined) {
        untracked++;
      } else {
        tracked++;
        if (answer.firstSuccess) correctFirstTime++;
      }
    }
  }
  return { tracked, correctFirstTime, untracked };
}

/**
 * Service for calculating student scores and summaries
 */
export class ScoresService {
  /**
   * Calculate summary statistics for a single student
   */
  calculateStudentSummary(student: StudentRecord): StudentSummary {
    const percentage =
      student.attempted > 0 ? Math.round((student.correct / student.attempted) * 100) : 0;

    return {
      serviceId: student.serviceId,
      name: student.name,
      attempted: student.attempted,
      correct: student.correct,
      percentage,
    };
  }

  /**
   * Calculate summary statistics for a specific page
   */
  calculatePageSummary(pageId: string, student: StudentRecord): PageSummary {
    const pageData = student.pages[pageId];
    if (!pageData) {
      return {
        pageId,
        attempted: 0,
        correct: 0,
        percentage: 0,
      };
    }

    const answers = pageData.answers || [];
    const attempted = answers.filter((a) => a !== null).length;
    const correct = answers.filter((a) => a?.success === true).length;
    const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    return {
      pageId,
      attempted,
      correct,
      percentage,
    };
  }

  /**
   * Get all page summaries for a student
   */
  getPageSummaries(student: StudentRecord): PageSummary[] {
    const pageIds = Object.keys(student.pages);
    return pageIds.map((pageId) => this.calculatePageSummary(pageId, student));
  }

  /**
   * Sort students by name (alphabetical)
   */
  sortStudentsByName(students: StudentRecord[]): StudentRecord[] {
    return [...students].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Sort students by percentage (descending)
   */
  sortStudentsByPercentage(students: StudentRecord[]): StudentRecord[] {
    return [...students].sort((a, b) => {
      const percentA = a.attempted > 0 ? (a.correct / a.attempted) * 100 : 0;
      const percentB = b.attempted > 0 ? (b.correct / b.attempted) * 100 : 0;
      return percentB - percentA;
    });
  }
}
