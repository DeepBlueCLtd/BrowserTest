import{x as r}from"./lit-element-CSmQN0ht.js";import{e as a}from"./analysis-table-BMjHgOjo.js";import{s as i,S as o}from"./storage-helpers-B4dxqHb-.js";import"./debouncer-WBxe4mJ7.js";import"./event-helpers-DOv9sfVv.js";import"./storage-service-CKMCIiLV.js";import"./session-B4sBU_x4.js";const u={title:"Enhancers/Analysis Table",tags:["autodocs"],parameters:{docs:{description:{component:`
Analysis table enhancement with single-phase pattern.

**Author Constraints:**
- Add class="interactive" to cells that should be editable
- Cells without this class will always be read-only
- Only cells with class="interactive" become contenteditable in interactive mode

**Features:**
- Non-interactive mode: Read-only display
- Interactive mode: Editable cells (with class="interactive")
- Debounced auto-save (500ms)
- Stable cell keys for persistence
- Event emission: qd:analysis-saved
        `}}}};function c(){const e=new Date,t=new Date(e.getTime()+30*60*1e3);return{serviceId:"RN9999",name:"Storybook User",release:"11-2024",loginTime:e.toISOString(),lastActivity:e.toISOString(),expiresAt:t.toISOString(),instructorUnlocked:!1}}const d={render:()=>r`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Non-Interactive Mode</h2>
        <p>
          <strong>Note:</strong> This is the pre-login state. Cells with class="interactive" are
          marked but not editable.
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Student Answer
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">What is 2+2?</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Verify basic arithmetic</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Explain photosynthesis</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Check for key concepts: chlorophyll, sunlight, CO2, glucose
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Define democracy</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Look for: voting, representation, rights
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #f0f0f0;">
          <strong>Cells marked with class="interactive":</strong> Column 2 (Student Answer) - shown
          with light yellow background for visualization
        </div>
      </div>
    `,play:({canvasElement:e})=>{const t=e.querySelector("table.qd-analysis");t&&a(t,{interactive:!1})}},s={render:()=>{const e=c();return i(o.SESSION,e),r`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Interactive Mode</h2>
        <p>
          <strong>Try editing cells in the "Student Answer" column!</strong> These cells have
          class="interactive" and are now contenteditable.
        </p>
        <p>
          Changes are auto-saved after 500ms of inactivity. Check the browser console for
          <code>qd:analysis-saved</code> events.
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Student Answer (editable)
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Notes (read-only)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">What is 2+2?</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Verify basic arithmetic</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Explain photosynthesis</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Check for key concepts: chlorophyll, sunlight, CO2, glucose
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Define democracy</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Look for: voting, representation, rights
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #e8f5e9;">
          <strong>Editable cells:</strong> Column 2 (class="interactive") - Click to edit!
          <br />
          <strong>Read-only cells:</strong> Columns 1 and 3 (no 'interactive' class)
        </div>
      </div>
    `},play:({canvasElement:e})=>{const t=e.querySelector("table.qd-analysis");t&&(a(t,{interactive:!0,pageId:"storybook-analysis-1"}),document.addEventListener("qd:analysis-saved",l=>{console.log("Analysis cell saved:",l.detail)}))}},n={render:()=>{const e=c();return i(o.SESSION,e),r`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Mixed Editability</h2>
        <p>
          This table demonstrates selective editability. Some cells in the middle column have
          class="interactive" (editable), others don't (read-only).
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Item</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Value</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Name</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Enter your name</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Student ID</td>
              <td style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5;">RN9999</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Pre-filled (read-only, no 'interactive' class)
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Comments</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Add your feedback</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Grade</td>
              <td style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5;">A</td>
              <td style="border: 1px solid #ccc; padding: 8px;">Instructor-assigned (read-only)</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #fff3e0;">
          <strong>Legend:</strong>
          <ul style="margin: 5px 0;">
            <li><strong>Light yellow background:</strong> Editable cells (class="interactive")</li>
            <li><strong>Gray background:</strong> Read-only cells (no 'interactive' class)</li>
          </ul>
        </div>
      </div>
    `},play:({canvasElement:e})=>{const t=e.querySelector("table.qd-analysis");t&&a(t,{interactive:!0,pageId:"storybook-analysis-mixed"})}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    // NOTE: Do NOT clear storage here - preserve cache to prevent data loss
    // when navigating between stories. Cache contains user answers.

    return html\`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Non-Interactive Mode</h2>
        <p>
          <strong>Note:</strong> This is the pre-login state. Cells with class="interactive" are
          marked but not editable.
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Student Answer
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">What is 2+2?</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Verify basic arithmetic</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Explain photosynthesis</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Check for key concepts: chlorophyll, sunlight, CO2, glucose
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Define democracy</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for student input -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Look for: voting, representation, rights
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #f0f0f0;">
          <strong>Cells marked with class="interactive":</strong> Column 2 (Student Answer) - shown
          with light yellow background for visualization
        </div>
      </div>
    \`;
  },
  play: ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (table) {
      enhanceAnalysisTable(table, {
        interactive: false
      });
    }
  }
}`,...d.parameters?.docs?.source},description:{story:`Non-Interactive Mode

Analysis table in read-only mode (pre-login).
No cells are editable, regardless of class="interactive".`,...d.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Create session
    const session = createSession();
    setJSON(STORAGE_KEYS.SESSION, session);
    return html\`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Interactive Mode</h2>
        <p>
          <strong>Try editing cells in the "Student Answer" column!</strong> These cells have
          class="interactive" and are now contenteditable.
        </p>
        <p>
          Changes are auto-saved after 500ms of inactivity. Check the browser console for
          <code>qd:analysis-saved</code> events.
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Student Answer (editable)
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Notes (read-only)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">What is 2+2?</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Verify basic arithmetic</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Explain photosynthesis</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Check for key concepts: chlorophyll, sunlight, CO2, glucose
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Define democracy</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty, ready for editing -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Look for: voting, representation, rights
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #e8f5e9;">
          <strong>Editable cells:</strong> Column 2 (class="interactive") - Click to edit!
          <br />
          <strong>Read-only cells:</strong> Columns 1 and 3 (no 'interactive' class)
        </div>
      </div>
    \`;
  },
  play: ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (table) {
      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'storybook-analysis-1'
      });

      // Listen for save events (log to console for debugging)
      document.addEventListener('qd:analysis-saved', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Analysis cell saved:', e.detail);
      }) as EventListener);
    }
  }
}`,...s.parameters?.docs?.source},description:{story:`Interactive Mode

Analysis table with editing enabled for cells with class="interactive".
Cells without this class remain read-only.`,...s.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Create session
    const session = createSession();
    setJSON(STORAGE_KEYS.SESSION, session);
    return html\`
      <div style="padding: 20px; max-width: 800px;">
        <h2>Analysis Table - Mixed Editability</h2>
        <p>
          This table demonstrates selective editability. Some cells in the middle column have
          class="interactive" (editable), others don't (read-only).
        </p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Item</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Value</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Name</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Enter your name</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Student ID</td>
              <td style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5;">RN9999</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                Pre-filled (read-only, no 'interactive' class)
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Comments</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Add your feedback</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Grade</td>
              <td style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5;">A</td>
              <td style="border: 1px solid #ccc; padding: 8px;">Instructor-assigned (read-only)</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 10px; background: #fff3e0;">
          <strong>Legend:</strong>
          <ul style="margin: 5px 0;">
            <li><strong>Light yellow background:</strong> Editable cells (class="interactive")</li>
            <li><strong>Gray background:</strong> Read-only cells (no 'interactive' class)</li>
          </ul>
        </div>
      </div>
    \`;
  },
  play: ({
    canvasElement
  }) => {
    const table = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (table) {
      enhanceAnalysisTable(table, {
        interactive: true,
        pageId: 'storybook-analysis-mixed'
      });
    }
  }
}`,...n.parameters?.docs?.source},description:{story:`Mixed Editability

Demonstrates table with selective editable cells.
Only cells with class="interactive" are editable.`,...n.parameters?.docs?.description}}};const v=["NonInteractiveMode","InteractiveMode","MixedEditability"];export{s as InteractiveMode,n as MixedEditability,d as NonInteractiveMode,v as __namedExportsOrder,u as default};
