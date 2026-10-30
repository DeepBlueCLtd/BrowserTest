import{x as e}from"./lit-element-DR9D0stx.js";import"./qd-scores-modal-_vWRpiMT.js";import"./property-BRFVFa-w.js";import"./qd-modal-Co8ngVCc.js";const w={title:"Components/ScoresModal",component:"qd-scores-modal",tags:["autodocs"],parameters:{docs:{description:{component:`
Modal displaying student scores with expandable per-page breakdown.

**Features:**
- Summary view with attempted/correct/percentage for each student
- Expandable rows showing per-page answer details
- Color-coded correct (green) / incorrect (red) answers
- Alphabetically sorted student list
- Uses qd-modal base for backdrop, Escape key, focus trap

**Properties:**
- \`open\`: Boolean - whether modal is visible
- \`students\`: StudentRecord[] - student data to display

**Events:**
- \`close\`: Emitted when modal closes
        `}}}},c=[{schema:1,docId:"doc-1",release:"01-2025",serviceId:"ALICE001",name:"Alice Anderson",attempted:10,correct:9,updated:"2025-01-15T10:30:00Z",pages:{"quiz-page-1":{state:"complete",answers:[{answer:"A",success:!0,timestamp:"2025-01-15T10:00:00Z"},{answer:"B",success:!0,timestamp:"2025-01-15T10:01:00Z"},{answer:"C",success:!0,timestamp:"2025-01-15T10:02:00Z"}]},"quiz-page-2":{state:"complete",answers:[{answer:"42",success:!0,timestamp:"2025-01-15T10:10:00Z"},{answer:"3.14",success:!0,timestamp:"2025-01-15T10:11:00Z"},{answer:"99",success:!1,timestamp:"2025-01-15T10:12:00Z"}]}}},{schema:1,docId:"doc-2",release:"01-2025",serviceId:"BOB00002",name:"Bob Baker",attempted:6,correct:4,updated:"2025-01-15T11:00:00Z",pages:{"quiz-page-1":{state:"incomplete",answers:[{answer:"A",success:!0,timestamp:"2025-01-15T10:30:00Z"},{answer:"D",success:!1,timestamp:"2025-01-15T10:31:00Z"},{answer:"C",success:!0,timestamp:"2025-01-15T10:32:00Z"}]},"quiz-page-2":{state:"incomplete",answers:[{answer:"40",success:!1,timestamp:"2025-01-15T10:40:00Z"},{answer:"3.14",success:!0,timestamp:"2025-01-15T10:41:00Z"},{answer:"100",success:!0,timestamp:"2025-01-15T10:42:00Z"}]}}},{schema:1,docId:"doc-3",release:"01-2025",serviceId:"CHARLIE3",name:"Charlie Chen",attempted:3,correct:3,updated:"2025-01-15T09:00:00Z",pages:{"quiz-page-1":{state:"complete",answers:[{answer:"A",success:!0,timestamp:"2025-01-15T09:00:00Z"},{answer:"B",success:!0,timestamp:"2025-01-15T09:01:00Z"},{answer:"C",success:!0,timestamp:"2025-01-15T09:02:00Z"}]}}}],s={render:()=>e` <qd-scores-modal open .students=${c}></qd-scores-modal> `},t={render:()=>e` <qd-scores-modal open .students=${[]}></qd-scores-modal> `},r={render:()=>e` <qd-scores-modal open .students=${[c[0]]}></qd-scores-modal> `},n={render:()=>e` <qd-scores-modal open .students=${[{schema:1,docId:"perfect",release:"01-2025",serviceId:"PERF0001",name:"Perfect Paula",attempted:5,correct:5,updated:"2025-01-15T12:00:00Z",pages:{"quiz-page-1":{state:"complete",answers:[{answer:"A",success:!0,timestamp:"2025-01-15T12:00:00Z"},{answer:"B",success:!0,timestamp:"2025-01-15T12:01:00Z"},{answer:"C",success:!0,timestamp:"2025-01-15T12:02:00Z"},{answer:"D",success:!0,timestamp:"2025-01-15T12:03:00Z"},{answer:"E",success:!0,timestamp:"2025-01-15T12:04:00Z"}]}}}]}></qd-scores-modal> `},a={render:()=>e` <qd-scores-modal open .students=${[{schema:1,docId:"low1",release:"01-2025",serviceId:"LOW00001",name:"Struggling Steve",attempted:10,correct:2,updated:"2025-01-15T13:00:00Z",pages:{"quiz-page-1":{state:"incomplete",answers:[{answer:"X",success:!1,timestamp:"2025-01-15T13:00:00Z"},{answer:"Y",success:!1,timestamp:"2025-01-15T13:01:00Z"},{answer:"C",success:!0,timestamp:"2025-01-15T13:02:00Z"}]}}},{schema:1,docId:"low2",release:"01-2025",serviceId:"LOW00002",name:"Learning Larry",attempted:5,correct:0,updated:"2025-01-15T14:00:00Z",pages:{"quiz-page-1":{state:"incomplete",answers:[{answer:"wrong",success:!1,timestamp:"2025-01-15T14:00:00Z"},{answer:"nope",success:!1,timestamp:"2025-01-15T14:01:00Z"}]}}}]}></qd-scores-modal> `},o={render:()=>e`
      <div style="padding: 20px;">
        <button
          @click=${()=>{document.querySelector("qd-scores-modal")?.show()}}
          style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          View Student Scores
        </button>

        <qd-scores-modal .students=${c} @close=${()=>{}}></qd-scores-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the scores modal. Press Escape or click outside to close.
          </p>
        </div>
      </div>
    `};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{\n  render: () => html` <qd-scores-modal open .students=${sampleStudents}></qd-scores-modal> `\n}",...s.parameters?.docs?.source},description:{story:`Default with Sample Data

Shows modal with multiple students and their scores.`,...s.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{\n  render: () => html` <qd-scores-modal open .students=${[]}></qd-scores-modal> `\n}",...t.parameters?.docs?.source},description:{story:`Empty State

Shows modal when no students have data.`,...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{\n  render: () => html` <qd-scores-modal open .students=${[sampleStudents[0]]}></qd-scores-modal> `\n}",...r.parameters?.docs?.source},description:{story:`Single Student

Shows modal with just one student.`,...r.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const perfectStudent: StudentRecord = {
      schema: 1,
      docId: 'perfect',
      release: '01-2025',
      serviceId: 'PERF0001',
      name: 'Perfect Paula',
      attempted: 5,
      correct: 5,
      updated: '2025-01-15T12:00:00Z',
      pages: {
        'quiz-page-1': {
          state: 'complete',
          answers: [{
            answer: 'A',
            success: true,
            timestamp: '2025-01-15T12:00:00Z'
          }, {
            answer: 'B',
            success: true,
            timestamp: '2025-01-15T12:01:00Z'
          }, {
            answer: 'C',
            success: true,
            timestamp: '2025-01-15T12:02:00Z'
          }, {
            answer: 'D',
            success: true,
            timestamp: '2025-01-15T12:03:00Z'
          }, {
            answer: 'E',
            success: true,
            timestamp: '2025-01-15T12:04:00Z'
          }]
        }
      }
    };
    return html\` <qd-scores-modal open .students=\${[perfectStudent]}></qd-scores-modal> \`;
  }
}`,...n.parameters?.docs?.source},description:{story:`Perfect Score

Shows a student with 100% correct answers.`,...n.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const lowScoreStudents: StudentRecord[] = [{
      schema: 1,
      docId: 'low1',
      release: '01-2025',
      serviceId: 'LOW00001',
      name: 'Struggling Steve',
      attempted: 10,
      correct: 2,
      updated: '2025-01-15T13:00:00Z',
      pages: {
        'quiz-page-1': {
          state: 'incomplete',
          answers: [{
            answer: 'X',
            success: false,
            timestamp: '2025-01-15T13:00:00Z'
          }, {
            answer: 'Y',
            success: false,
            timestamp: '2025-01-15T13:01:00Z'
          }, {
            answer: 'C',
            success: true,
            timestamp: '2025-01-15T13:02:00Z'
          }]
        }
      }
    }, {
      schema: 1,
      docId: 'low2',
      release: '01-2025',
      serviceId: 'LOW00002',
      name: 'Learning Larry',
      attempted: 5,
      correct: 0,
      updated: '2025-01-15T14:00:00Z',
      pages: {
        'quiz-page-1': {
          state: 'incomplete',
          answers: [{
            answer: 'wrong',
            success: false,
            timestamp: '2025-01-15T14:00:00Z'
          }, {
            answer: 'nope',
            success: false,
            timestamp: '2025-01-15T14:01:00Z'
          }]
        }
      }
    }];
    return html\` <qd-scores-modal open .students=\${lowScoreStudents}></qd-scores-modal> \`;
  }
}`,...a.parameters?.docs?.source},description:{story:`Low Score

Shows students with low scores (mostly incorrect).`,...a.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-scores-modal');
      modal?.show();
    };
    return html\`
      <div style="padding: 20px;">
        <button
          @click=\${openModal}
          style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          View Student Scores
        </button>

        <qd-scores-modal .students=\${sampleStudents} @close=\${() => {}}></qd-scores-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the scores modal. Press Escape or click outside to close.
          </p>
        </div>
      </div>
    \`;
  }
}`,...o.parameters?.docs?.source},description:{story:`Interactive Open/Close

Shows how to open and close the modal via button.`,...o.parameters?.docs?.description}}};const g=["Default","EmptyState","SingleStudent","PerfectScore","LowScores","Interactive"];export{s as Default,t as EmptyState,o as Interactive,a as LowScores,n as PerfectScore,r as SingleStudent,g as __namedExportsOrder,w as default};
