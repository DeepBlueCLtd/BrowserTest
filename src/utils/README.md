# Utility Functions

This directory contains shared utility functions used across the Sonar Quiz System.

## Formatting Utilities (`formatting.ts`)

### Service ID Masking

The system implements privacy protection for service IDs when displaying student scores or information to non-instructor users.

#### Functions

##### `maskServiceId(serviceId: ServiceId): string`

Masks a service ID to show only the last 3 digits/characters.

**Usage:**
```typescript
import { maskServiceId } from './utils/formatting';

maskServiceId('RN2344'); // Returns: "***344"
maskServiceId('ABC');    // Returns: "***ABC"
```

##### `formatServiceId(serviceId: ServiceId, isInstructor: boolean): string`

Formats service ID based on user role:
- **Instructor mode**: Shows full service ID
- **Non-instructor mode**: Shows masked service ID (last 3 digits only)

**Usage:**
```typescript
import { formatServiceId } from './utils/formatting';
import type { SessionData, StudentSummary } from '../types/contracts';

// In a component displaying student summaries
function displayStudentScore(
  student: StudentSummary,
  session: SessionData
) {
  const displayId = formatServiceId(
    student.serviceId,
    session.instructorUnlocked
  );

  return `${student.name} (${displayId}): ${student.percentage}%`;
}
```

#### Privacy Rationale

When displaying lists of student scores or summaries:
- **Non-instructors** (regular students) should only see partial service IDs to protect privacy
- **Instructors** need to see full service IDs to identify specific students

This approach balances:
- Privacy: Students can't easily identify each other from score listings
- Usability: Students can verify their own entry (last 3 digits are memorable)
- Instructor needs: Full IDs available when needed for grading/review

#### Implementation Location

Use `formatServiceId()` whenever displaying `StudentSummary` objects or lists of students:

1. **Instructor Panel** (`src/components/qd-instructor.ts` - when implemented):
   ```typescript
   // When rendering the scores list
   students.map(student => {
     const displayId = formatServiceId(
       student.serviceId,
       this.sessionData.instructorUnlocked
     );
     return html`<tr>
       <td>${student.name}</td>
       <td>${displayId}</td>
       <td>${student.percentage}%</td>
     </tr>`;
   });
   ```

2. **Scores Page** (when implemented):
   - Apply masking to all service ID displays in leaderboards or score tables
   - Check `instructorUnlocked` flag from session data

3. **Export Functions** (when implemented):
   - CSV exports for instructors should include full service IDs
   - Student-facing exports (if any) should use masked IDs

#### Testing

Comprehensive unit tests are available in `tests/unit/utils/formatting.test.ts` covering:
- Standard service IDs (>3 characters)
- Short service IDs (≤3 characters)
- Edge cases (empty strings, special characters)
- Both instructor and non-instructor modes
- Privacy protection verification
