/**
 * Unit tests for CSV export service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateCSV, downloadCSV, exportStudentsToCSV } from '../../../src/services/csv-export.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

describe('csv-export', () => {
  let mockStudent: StudentRecord;

  beforeEach(() => {
    mockStudent = {
      schema: 1,
      docId: 'qd/01-2025/uTEST001',
      serviceId: 'TEST001',
      name: 'John Doe',
      release: '01-2025',
      attempted: 3,
      correct: 2,
      updated: '2025-01-01T10:00:00Z',
      pages: {
        'page-1': {
          state: 'complete',
          answers: [
            { answer: 'a', success: true, timestamp: '2025-01-01T10:00:00Z' },
            { answer: 'b', success: false, timestamp: '2025-01-01T10:01:00Z' },
          ],
        },
        'page-2': {
          state: 'incomplete',
          answers: [{ answer: '42', success: true, timestamp: '2025-01-01T10:05:00Z' }],
        },
      },
    };
  });

  describe('generateCSV', () => {
    it('should generate CSV with header row', () => {
      const csv = generateCSV([mockStudent]);

      expect(csv).toContain(
        'Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp',
      );
    });

    it('should generate data rows for each answer', () => {
      const csv = generateCSV([mockStudent]);
      const lines = csv.split('\n');

      // Header + 3 answer rows
      expect(lines).toHaveLength(4);
    });

    it('should format answer data correctly', () => {
      const csv = generateCSV([mockStudent]);
      const lines = csv.split('\n');

      // First answer
      expect(lines[1]).toBe('TEST001,John Doe,01-2025,page-1,0,a,true,2025-01-01T10:00:00Z');

      // Second answer
      expect(lines[2]).toBe('TEST001,John Doe,01-2025,page-1,1,b,false,2025-01-01T10:01:00Z');

      // Third answer
      expect(lines[3]).toBe('TEST001,John Doe,01-2025,page-2,0,42,true,2025-01-01T10:05:00Z');
    });

    it('should handle empty student array', () => {
      const csv = generateCSV([]);

      expect(csv).toBe('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp');
    });

    it('should skip null answers', () => {
      const student: StudentRecord = {
        ...mockStudent,
        pages: {
          'page-1': {
            state: 'incomplete',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            answers: [
              { answer: 'a', success: true, timestamp: '2025-01-01T10:00:00Z' },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              null as any,
              { answer: 'c', success: false, timestamp: '2025-01-01T10:02:00Z' },
            ],
          },
        },
      };

      const csv = generateCSV([student]);
      const lines = csv.split('\n');

      // Header + 2 non-null answers
      expect(lines).toHaveLength(3);
    });

    it('should escape fields containing commas', () => {
      const student: StudentRecord = {
        ...mockStudent,
        name: 'Doe, John',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [{ answer: 'a, b, c', success: true, timestamp: '2025-01-01T10:00:00Z' }],
          },
        },
      };

      const csv = generateCSV([student]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"Doe, John"');
      expect(lines[1]).toContain('"a, b, c"');
    });

    it('should escape fields containing quotes', () => {
      const student: StudentRecord = {
        ...mockStudent,
        name: 'John "Johnny" Doe',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [{ answer: 'Say "hello"', success: true, timestamp: '2025-01-01T10:00:00Z' }],
          },
        },
      };

      const csv = generateCSV([student]);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"John ""Johnny"" Doe"');
      expect(lines[1]).toContain('"Say ""hello"""');
    });

    it('should escape fields containing newlines', () => {
      const student: StudentRecord = {
        ...mockStudent,
        pages: {
          'page-1': {
            state: 'complete',
            answers: [
              { answer: 'Line 1\nLine 2', success: true, timestamp: '2025-01-01T10:00:00Z' },
            ],
          },
        },
      };

      const csv = generateCSV([student]);

      // The newline is preserved inside the quoted field
      expect(csv).toContain('"Line 1\nLine 2"');
    });

    it('should handle multiple students', () => {
      const student2: StudentRecord = {
        schema: 1,
        docId: 'qd/01-2025/uTEST002',
        serviceId: 'TEST002',
        name: 'Jane Smith',
        release: '01-2025',
        attempted: 1,
        correct: 1,
        updated: '2025-01-01T11:00:00Z',
        pages: {
          'page-1': {
            state: 'complete',
            answers: [{ answer: 'x', success: true, timestamp: '2025-01-01T11:00:00Z' }],
          },
        },
      };

      const csv = generateCSV([mockStudent, student2]);
      const lines = csv.split('\n');

      // Header + 3 answers from student1 + 1 answer from student2
      expect(lines).toHaveLength(5);
      expect(lines[4]).toContain('TEST002');
      expect(lines[4]).toContain('Jane Smith');
    });

    it('should handle student with no pages', () => {
      const student: StudentRecord = {
        ...mockStudent,
        pages: {},
      };

      const csv = generateCSV([student]);

      expect(csv).toBe('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp');
    });

    it('should handle page with empty answers array', () => {
      const student: StudentRecord = {
        ...mockStudent,
        pages: {
          'empty-page': {
            state: 'unstarted',
            answers: [],
          },
        },
      };

      const csv = generateCSV([student]);

      expect(csv).toBe('Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp');
    });
  });

  describe('downloadCSV', () => {
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create blob with correct type', () => {
      const csv = 'test,data\n1,2';
      downloadCSV(csv);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('should create download link with blob URL', () => {
      const csv = 'test,data\n1,2';
      downloadCSV(csv);

      expect(mockLink.href).toBe('blob:mock-url');
    });

    it('should use custom filename when provided', () => {
      const csv = 'test,data\n1,2';
      downloadCSV(csv, 'custom-file.csv');

      expect(mockLink.download).toBe('custom-file.csv');
    });

    it('should generate timestamped filename when not provided', () => {
      const csv = 'test,data\n1,2';
      downloadCSV(csv);

      expect(mockLink.download).toMatch(/^quiz-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('should trigger download', () => {
      const csv = 'test,data\n1,2';
      downloadCSV(csv);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should append and remove link from DOM', () => {
      const csv = 'test,data\n1,2';
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      downloadCSV(csv);

      expect(appendSpy).toHaveBeenCalledWith(mockLink);
      expect(removeSpy).toHaveBeenCalledWith(mockLink);
    });

    it('should revoke object URL after download', () => {
      const csv = 'test,data\n1,2';
      downloadCSV(csv);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('exportStudentsToCSV', () => {
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should generate CSV and trigger download', () => {
      exportStudentsToCSV([mockStudent]);

      expect(mockLink.download).toMatch(/^quiz-data-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should pass custom filename to download', () => {
      exportStudentsToCSV([mockStudent], 'custom.csv');

      expect(mockLink.download).toBe('custom.csv');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle empty student array', () => {
      exportStudentsToCSV([]);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should create blob URL and trigger download', () => {
      exportStudentsToCSV([mockStudent]);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockLink.click).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
