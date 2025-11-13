/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Storybook stories for formatting utilities
 * Demonstrates service ID masking for privacy protection
 */

import type { Meta, StoryObj } from '@storybook/web-components';
import { formatServiceId, maskServiceId } from '../../src/utils/formatting';
import type { StudentSummary } from '../../src/types/contracts';

interface StoryArgs {
  instructorMode: boolean;
}

const meta: Meta<StoryArgs> = {
  title: 'Utils/Formatting - Service ID Masking',
  tags: ['autodocs'],
  argTypes: {
    instructorMode: {
      control: 'boolean',
      description: 'Toggle between instructor and student view',
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// Mock student data for demonstration
const mockStudents: StudentSummary[] = [
  {
    serviceId: 'RN2344',
    name: 'J Corner',
    attempted: 10,
    correct: 8,
    percentage: 80,
    lastActive: '2025-11-12T13:00:00Z',
  },
  {
    serviceId: 'AB1234',
    name: 'A Smith',
    attempted: 10,
    correct: 9,
    percentage: 90,
    lastActive: '2025-11-12T12:45:00Z',
  },
  {
    serviceId: 'XYZ789',
    name: 'B Jones',
    attempted: 10,
    correct: 7,
    percentage: 70,
    lastActive: '2025-11-12T12:30:00Z',
  },
  {
    serviceId: 'CD5678',
    name: 'C Davis',
    attempted: 10,
    correct: 10,
    percentage: 100,
    lastActive: '2025-11-12T13:15:00Z',
  },
  {
    serviceId: 'EF9012',
    name: 'D Wilson',
    attempted: 8,
    correct: 6,
    percentage: 75,
    lastActive: '2025-11-12T11:00:00Z',
  },
];

/**
 * Student Scores List - Interactive Demo
 *
 * This story demonstrates the service ID masking feature for privacy protection.
 *
 * **Toggle the "Instructor Mode" control** to see the difference:
 * - **Instructor Mode OFF** (Student View): Service IDs are masked to show only last 3 digits (e.g., ***344)
 * - **Instructor Mode ON** (Instructor View): Full service IDs are visible (e.g., RN2344)
 *
 * This ensures student privacy while allowing instructors to identify specific students.
 */
export const StudentScoresList: Story = {
  args: {
    instructorMode: false,
  },
  render: (args: any) => {
    const container = document.createElement('div');
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
    `;

    const isInstructor = args.instructorMode as boolean;

    // Header section
    const header = document.createElement('div');
    header.style.cssText = `
      background: ${isInstructor ? '#e3f2fd' : '#f5f5f5'};
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border-left: 4px solid ${isInstructor ? '#2196f3' : '#9e9e9e'};
    `;
    header.innerHTML = `
      <h2 style="margin: 0 0 0.5rem 0; color: #333;">
        ${isInstructor ? '👨‍🏫 Instructor View' : '👤 Student View'}
      </h2>
      <p style="margin: 0; color: #666; font-size: 0.875rem;">
        ${
          isInstructor
            ? 'Full service IDs visible for student identification'
            : 'Service IDs masked for privacy protection (last 3 digits only)'
        }
      </p>
    `;

    // Table
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    `;

    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: #f5f5f5; text-align: left;">
        <th style="padding: 1rem; font-weight: 600; color: #333;">Name</th>
        <th style="padding: 1rem; font-weight: 600; color: #333;">Service ID</th>
        <th style="padding: 1rem; font-weight: 600; color: #333;">Attempted</th>
        <th style="padding: 1rem; font-weight: 600; color: #333;">Correct</th>
        <th style="padding: 1rem; font-weight: 600; color: #333;">Score</th>
      </tr>
    `;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    mockStudents.forEach((student, index) => {
      const displayId = formatServiceId(student.serviceId, isInstructor);
      const row = document.createElement('tr');
      row.style.cssText = `
        border-top: 1px solid #e0e0e0;
        ${index % 2 === 0 ? 'background: #fafafa;' : ''}
      `;

      const scoreColor =
        student.percentage >= 80 ? '#4caf50' : student.percentage >= 60 ? '#ff9800' : '#d32f2f';

      row.innerHTML = `
        <td style="padding: 1rem; color: #333;">${student.name}</td>
        <td style="padding: 1rem; color: #666; font-family: monospace; font-weight: 500;">
          ${displayId}
          ${!isInstructor ? '<span style="color: #999; font-size: 0.75rem; margin-left: 0.5rem;">(masked)</span>' : ''}
        </td>
        <td style="padding: 1rem; color: #666; text-align: center;">${student.attempted}</td>
        <td style="padding: 1rem; color: #666; text-align: center;">${student.correct}</td>
        <td style="padding: 1rem; font-weight: 600; color: ${scoreColor}; text-align: center;">
          ${student.percentage}%
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Info box
    const infoBox = document.createElement('div');
    infoBox.style.cssText = `
      margin-top: 1.5rem;
      padding: 1rem;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
    `;
    infoBox.innerHTML = `
      <h4 style="margin: 0 0 0.5rem 0; color: #e65100;">Privacy Feature</h4>
      <p style="margin: 0; color: #666; font-size: 0.875rem; line-height: 1.5;">
        When students view score lists, they see masked service IDs (last 3 digits only).
        This protects privacy while still allowing students to verify their own entry.
        Instructors see full IDs for proper student identification.
      </p>
    `;

    container.appendChild(header);
    container.appendChild(table);
    container.appendChild(infoBox);

    return container;
  },
};

/**
 * Service ID Masking Examples
 *
 * Shows various service ID formats and how they are masked.
 */
export const MaskingExamples: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Service ID Masking Examples';
    title.style.cssText = 'color: #333; margin-bottom: 1rem;';

    const examples = [
      { original: 'RN2344', description: 'Standard service ID' },
      { original: 'ABC123', description: 'Alphanumeric ID' },
      { original: 'SERVICE123456', description: 'Long service ID' },
      { original: 'ABCD', description: '4-character ID' },
      { original: 'ABC', description: '3-character ID (edge case)' },
      { original: 'AB', description: '2-character ID (edge case)' },
    ];

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    `;

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: #f5f5f5; text-align: left;">
        <th style="padding: 1rem; font-weight: 600; color: #333;">Original ID</th>
        <th style="padding: 1rem; font-weight: 600; color: #333;">Masked ID</th>
        <th style="padding: 1rem; font-weight: 600; color: #333;">Description</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    examples.forEach((example, index) => {
      const masked = maskServiceId(example.original);
      const row = document.createElement('tr');
      row.style.cssText = `
        border-top: 1px solid #e0e0e0;
        ${index % 2 === 0 ? 'background: #fafafa;' : ''}
      `;
      row.innerHTML = `
        <td style="padding: 1rem; font-family: monospace; color: #333;">${example.original}</td>
        <td style="padding: 1rem; font-family: monospace; color: #d32f2f; font-weight: 500;">${masked}</td>
        <td style="padding: 1rem; color: #666; font-size: 0.875rem;">${example.description}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(title);
    container.appendChild(table);

    return container;
  },
};

/**
 * Instructor Toggle Comparison
 *
 * Side-by-side comparison of student view vs instructor view.
 */
export const SideBySideComparison: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Student View vs Instructor View';
    title.style.cssText = 'color: #333; margin-bottom: 1.5rem; text-align: center;';

    const comparison = document.createElement('div');
    comparison.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    `;

    // Student view
    const studentView = createScoreCard('Student View', false);
    const instructorView = createScoreCard('Instructor View', true);

    comparison.appendChild(studentView);
    comparison.appendChild(instructorView);

    container.appendChild(title);
    container.appendChild(comparison);

    return container;
  },
};

function createScoreCard(title: string, isInstructor: boolean): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: white;
    border: 2px solid ${isInstructor ? '#2196f3' : '#9e9e9e'};
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background: ${isInstructor ? '#2196f3' : '#9e9e9e'};
    color: white;
    padding: 1rem;
    font-weight: 600;
    text-align: center;
  `;
  header.textContent = title;

  const content = document.createElement('div');
  content.style.cssText = 'padding: 1rem;';

  const students = mockStudents.slice(0, 3); // Show first 3 students
  students.forEach((student) => {
    const displayId = formatServiceId(student.serviceId, isInstructor);
    const row = document.createElement('div');
    row.style.cssText = `
      padding: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    row.innerHTML = `
      <div>
        <div style="font-weight: 500; color: #333;">${student.name}</div>
        <div style="font-family: monospace; font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
          ${displayId}
        </div>
      </div>
      <div style="font-weight: 600; color: #2196f3; font-size: 1.125rem;">
        ${student.percentage}%
      </div>
    `;
    content.appendChild(row);
  });

  card.appendChild(header);
  card.appendChild(content);

  return card;
}
