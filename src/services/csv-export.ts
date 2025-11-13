/**
 * CSV Export Service
 *
 * Provides RFC 4180 compliant CSV generation with UTF-8 BOM
 * for exporting student quiz data and analysis.
 *
 * T086: Implement CSV export service (RFC 4180 with BOM)
 * T087: Add per-question and per-page export options
 */

import type { StudentRecord, PageId, ReleaseId } from '../types/contracts';

/**
 * Export type for CSV generation
 */
export type ExportFormat = 'summary' | 'detailed' | 'per-page';

/**
 * CSV Export options
 */
export interface CSVExportOptions {
  /** Format type */
  format: ExportFormat;
  /** Page ID (required for per-page export) */
  pageId?: PageId;
  /** Include analysis data */
  includeAnalysis?: boolean;
  /** Sort field */
  sortBy?: 'serviceId' | 'name' | 'percentage';
}

/**
 * Escape a CSV field value per RFC 4180
 *
 * Rules:
 * - Fields containing comma, quote, or newline must be quoted
 * - Quotes within fields must be escaped by doubling them
 *
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCSVField(value: string | number | boolean): string {
  const str = String(value);

  // Check if escaping is needed
  const needsQuoting =
    str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (!needsQuoting) {
    return str;
  }

  // Escape quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Generate a CSV row from an array of values
 *
 * @param values - Array of values for the row
 * @returns CSV row string
 */
function generateCSVRow(values: (string | number | boolean)[]): string {
  return values.map(escapeCSVField).join(',');
}

/**
 * Add UTF-8 BOM to CSV content
 *
 * The BOM ensures Excel and other applications correctly interpret
 * the file as UTF-8 encoded.
 *
 * @param content - CSV content
 * @returns Content with BOM prepended
 */
function addBOM(content: string): string {
  return '\ufeff' + content;
}

/**
 * Sort student records by specified field
 *
 * @param students - Array of student records
 * @param sortBy - Field to sort by
 * @returns Sorted array (does not mutate original)
 */
function sortStudents(
  students: StudentRecord[],
  sortBy: 'serviceId' | 'name' | 'percentage' = 'serviceId',
): StudentRecord[] {
  const sorted = [...students];

  switch (sortBy) {
    case 'serviceId':
      return sorted.sort((a, b) => a.serviceId.localeCompare(b.serviceId));

    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'percentage': {
      const getPercentage = (s: StudentRecord) =>
        s.attempted === 0 ? 0 : (s.correct / s.attempted) * 100;
      return sorted.sort((a, b) => getPercentage(b) - getPercentage(a));
    }

    default:
      return sorted;
  }
}

/**
 * Export student summary as CSV
 *
 * Generates a summary CSV with one row per student showing:
 * - Service ID
 * - Name
 * - Questions Attempted
 * - Correct Answers
 * - Percentage
 * - Last Updated
 *
 * @param students - Array of student records
 * @param release - Release ID
 * @param options - Export options
 * @returns CSV string with BOM
 */
export function exportStudentSummary(
  students: StudentRecord[],
  _release: ReleaseId,
  options: Pick<CSVExportOptions, 'sortBy'> = {},
): string {
  const sorted = sortStudents(students, options.sortBy);

  // Header row
  const headers = ['Service ID', 'Name', 'Attempted', 'Correct', 'Percentage', 'Last Updated'];
  const rows: string[] = [generateCSVRow(headers)];

  // Data rows
  for (const student of sorted) {
    const percentage = student.attempted === 0 ? 0 : (student.correct / student.attempted) * 100;

    const row = [
      student.serviceId,
      student.name,
      student.attempted,
      student.correct,
      percentage.toFixed(1),
      student.updated,
    ];

    rows.push(generateCSVRow(row));
  }

  return addBOM(rows.join('\n'));
}

/**
 * Export detailed answers as CSV
 *
 * Generates a detailed CSV with one row per answer showing:
 * - Service ID
 * - Name
 * - Page ID
 * - Question Number
 * - Answer
 * - Correct (Yes/No)
 * - Timestamp
 *
 * @param students - Array of student records
 * @param release - Release ID
 * @param options - Export options
 * @returns CSV string with BOM
 */
export function exportDetailedAnswers(
  students: StudentRecord[],
  _release: ReleaseId,
  options: Pick<CSVExportOptions, 'sortBy'> = {},
): string {
  const sorted = sortStudents(students, options.sortBy);

  // Header row
  const headers = ['Service ID', 'Name', 'Page ID', 'Question', 'Answer', 'Correct', 'Timestamp'];
  const rows: string[] = [generateCSVRow(headers)];

  // Data rows
  for (const student of sorted) {
    for (const [pageId, pageData] of Object.entries(student.pages)) {
      for (let i = 0; i < pageData.answers.length; i++) {
        const answer = pageData.answers[i];

        const row = [
          student.serviceId,
          student.name,
          pageId,
          i + 1, // Question number (1-indexed)
          answer.answer,
          answer.success ? 'Yes' : 'No',
          answer.timestamp,
        ];

        rows.push(generateCSVRow(row));
      }
    }
  }

  return addBOM(rows.join('\n'));
}

/**
 * Export answers for a specific page as CSV
 *
 * Generates a CSV with answers from a single page only.
 *
 * @param students - Array of student records
 * @param pageId - Page ID to export
 * @param release - Release ID
 * @param options - Export options
 * @returns CSV string with BOM
 */
export function exportPerPage(
  students: StudentRecord[],
  pageId: PageId,
  _release: ReleaseId,
  options: Pick<CSVExportOptions, 'sortBy'> = {},
): string {
  const sorted = sortStudents(students, options.sortBy);

  // Header row
  const headers = ['Service ID', 'Name', 'Page ID', 'Question', 'Answer', 'Correct', 'Timestamp'];
  const rows: string[] = [generateCSVRow(headers)];

  // Data rows - only for the specified page
  for (const student of sorted) {
    const pageData = student.pages[pageId];

    if (!pageData) {
      continue; // Student hasn't attempted this page
    }

    for (let i = 0; i < pageData.answers.length; i++) {
      const answer = pageData.answers[i];

      const row = [
        student.serviceId,
        student.name,
        pageId,
        i + 1, // Question number (1-indexed)
        answer.answer,
        answer.success ? 'Yes' : 'No',
        answer.timestamp,
      ];

      rows.push(generateCSVRow(row));
    }
  }

  return addBOM(rows.join('\n'));
}

/**
 * Export analysis data as CSV
 *
 * Generates a CSV with analysis cell entries showing:
 * - Service ID
 * - Name
 * - Page ID
 * - Cell Key
 * - Content
 * - Last Edited
 *
 * @param students - Array of student records
 * @param release - Release ID
 * @param options - Export options
 * @returns CSV string with BOM
 */
export function exportAnalysisData(
  students: StudentRecord[],
  _release: ReleaseId,
  options: Pick<CSVExportOptions, 'sortBy' | 'pageId'> = {},
): string {
  const sorted = sortStudents(students, options.sortBy);

  // Header row
  const headers = ['Service ID', 'Name', 'Page ID', 'Cell Key', 'Content', 'Last Edited'];
  const rows: string[] = [generateCSVRow(headers)];

  // Data rows
  for (const student of sorted) {
    for (const [pageId, pageData] of Object.entries(student.pages)) {
      // Skip if filtering by page and this isn't the target page
      if (options.pageId && pageId !== options.pageId) {
        continue;
      }

      // Skip if no analysis data
      if (!pageData.analysis) {
        continue;
      }

      const analysis = pageData.analysis;

      for (const [cellKey, content] of Object.entries(analysis.cells)) {
        const row = [
          student.serviceId,
          student.name,
          pageId,
          cellKey,
          content,
          analysis.lastEdited || '',
        ];

        rows.push(generateCSVRow(row));
      }
    }
  }

  return addBOM(rows.join('\n'));
}

/**
 * Trigger CSV file download in browser
 *
 * Creates a Blob with the CSV content and triggers a download using
 * a temporary anchor element.
 *
 * @param content - CSV content (should include BOM)
 * @param filename - Filename for the download
 */
export function downloadCSV(content: string, filename: string): void {
  // Create blob with CSV MIME type
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

  // Create temporary download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 *
 * @param prefix - Filename prefix
 * @param extension - File extension (default: 'csv')
 * @returns Filename with timestamp
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').split('.')[0];
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Main export function that handles all export types
 *
 * @param students - Array of student records
 * @param release - Release ID
 * @param options - Export options
 * @returns CSV string with BOM
 */
export function exportToCSV(
  students: StudentRecord[],
  release: ReleaseId,
  options: CSVExportOptions,
): string {
  switch (options.format) {
    case 'summary':
      return exportStudentSummary(students, release, options);

    case 'detailed':
      return exportDetailedAnswers(students, release, options);

    case 'per-page':
      if (!options.pageId) {
        throw new Error('pageId is required for per-page export');
      }
      return exportPerPage(students, options.pageId, release, options);

    default:
      throw new Error(`Unknown export format: ${String(options.format)}`);
  }
}
