/**
 * CSV export service
 * Generates RFC 4180 compliant CSV exports of student data
 */

import type { StudentRecord } from '../types/contracts.js';

/**
 * Escape a field for CSV output according to RFC 4180
 * - Fields containing comma, quote, or newline are wrapped in quotes
 * - Quotes inside fields are escaped by doubling them
 */
function escapeCSVField(field: string | number | boolean): string {
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate RFC 4180 compliant CSV from student records
 *
 * CSV format:
 * - Header row: Service ID, Name, Release, Page ID, Question Index, Answer, Success, Timestamp
 * - One row per answer
 * - Proper escaping of special characters
 *
 * @param students - Array of student records to export
 * @returns CSV string ready for download
 */
export function generateCSV(students: StudentRecord[]): string {
  const rows: string[] = [];

  // Header row
  rows.push('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp');

  // Data rows
  for (const student of students) {
    for (const [pageId, pageData] of Object.entries(student.pages)) {
      const answers = pageData.answers || [];
      answers.forEach((answer, index) => {
        if (answer) {
          rows.push([
            escapeCSVField(student.serviceId),
            escapeCSVField(student.name),
            escapeCSVField(student.release),
            escapeCSVField(pageId),
            escapeCSVField(index),
            escapeCSVField(answer.answer),
            escapeCSVField(answer.success),
            escapeCSVField(answer.timestamp),
          ].join(','));
        }
      });
    }
  }

  return rows.join('\n');
}

/**
 * Trigger browser download of CSV data
 *
 * @param csvData - CSV string to download
 * @param filename - Optional filename (defaults to quiz-data-{timestamp}.csv)
 */
export function downloadCSV(csvData: string, filename?: string): void {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = document.createElement('a');
  link.href = url;

  // Generate filename with timestamp if not provided
  if (!filename) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    filename = `quiz-data-${timestamp}.csv`;
  }
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate and download CSV in one step
 *
 * @param students - Array of student records to export
 * @param filename - Optional filename
 */
export function exportStudentsToCSV(students: StudentRecord[], filename?: string): void {
  const csv = generateCSV(students);
  downloadCSV(csv, filename);
}
