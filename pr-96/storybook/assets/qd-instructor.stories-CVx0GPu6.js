import{x as a}from"./lit-element-DR9D0stx.js";import"./qd-instructor-CHqmB9Sj.js";import"./property-BRFVFa-w.js";import"./state-7B7Yt9om.js";import"./storage-helpers-D_wcwu-v.js";import"./logger-DdbYlyfi.js";import"./help-content-Cyahxh7N.js";import"./dom-helpers-CAaP8i-_.js";import"./instructor-auth-Dkd1BrSp.js";import"./qd-scores-modal-_vWRpiMT.js";import"./qd-modal-Co8ngVCc.js";import"./migration-D_yK0_mn.js";import"./qd-confirm-dialog-DChDrNIs.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";const q={title:"Components/QdInstructor",component:"qd-instructor",tags:["autodocs"]},d=[{schema:1,docId:"doc-1",updated:"2025-01-15T10:00:00Z",serviceId:"TEST001",name:"Alice Johnson",release:"01-2025",attempted:15,correct:12,pages:{"quiz-1":{state:"complete",answers:[{answer:"a",success:!0,timestamp:"2025-01-15T09:00:00Z"},{answer:"b",success:!0,timestamp:"2025-01-15T09:01:00Z"}]},"quiz-2":{state:"incomplete",answers:[{answer:"42",success:!1,timestamp:"2025-01-15T09:30:00Z"}]}}},{schema:1,docId:"doc-2",updated:"2025-01-15T11:00:00Z",serviceId:"TEST002",name:"Bob Smith",release:"01-2025",attempted:10,correct:10,pages:{"quiz-1":{state:"complete",answers:[{answer:"a",success:!0,timestamp:"2025-01-15T10:00:00Z"},{answer:"b",success:!0,timestamp:"2025-01-15T10:01:00Z"}]}}}],n={render:()=>a`
      <div>
        <!-- Hidden password hash element (mimics Oxygen XSL injection) -->
        <span id="qd-instructor-hash" style="display:none;">${"c1437a55f6e9"}</span>

        <div
          style="background: #f0f0f0; padding: 16px; margin-bottom: 16px; border-radius: 4px; font-family: monospace; font-size: 12px;"
        >
          <strong>🔐 Instructor Password Required</strong><br />
          <br />
          <strong>Test Password:</strong>
          <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">instructor123</code
          ><br />
          <br />
          <strong>Password Storage:</strong> The hash is read from a hidden DOM element
          <code>&lt;span id="qd-instructor-hash"&gt;</code> injected by Oxygen XSL transform. This
          story includes the hash for "instructor123".<br />
          <br />
          <strong>Generate a hash:</strong><br />
          <code>echo -n "your-password" | openssl dgst -sha256</code><br />
          <br />
          <strong>Rate Limiting:</strong> After 5 failed attempts, the form will lock with
          exponential backoff (2s, 4s, 8s, 16s, 30s max).
        </div>
        <qd-instructor></qd-instructor>
      </div>
    `},r={render:()=>{const e=a`
      <div>
        <div
          style="background: #e7f3ff; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>ℹ️ Unlocked State:</strong> This story shows the instructor panel with 2 sample
          students (Alice: 80% completion, Bob: 100% completion).
        </div>
        <qd-instructor></qd-instructor>
      </div>
    `;return setTimeout(()=>{const t=document.querySelector("qd-instructor");t&&(t.unlock(),t.setStudents(d))},100),e}},s={render:()=>{const e=a`
      <div>
        <div
          style="background: #fff3cd; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>⚠️ Empty State:</strong> No student data available. Export and View Scores buttons
          will reflect this state.
        </div>
        <qd-instructor></qd-instructor>
      </div>
    `;return setTimeout(()=>{const t=document.querySelector("qd-instructor");t&&(t.unlock(),t.setStudents([]))},100),e}},o={render:()=>{const e=a`
      <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
        <qd-instructor data-show></qd-instructor>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the <strong>?</strong> button to open the help popup explaining instructor
            features.
          </p>
        </div>
      </div>
    `;return setTimeout(()=>{const t=document.querySelector("qd-instructor");t&&(t.setAttribute("data-show",""),t.unlock(),t.setStudents(d))},50),e}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Hash for "instructor123"
    const passwordHash = 'c1437a55f6e9';
    return html\`
      <div>
        <!-- Hidden password hash element (mimics Oxygen XSL injection) -->
        <span id="qd-instructor-hash" style="display:none;">\${passwordHash}</span>

        <div
          style="background: #f0f0f0; padding: 16px; margin-bottom: 16px; border-radius: 4px; font-family: monospace; font-size: 12px;"
        >
          <strong>🔐 Instructor Password Required</strong><br />
          <br />
          <strong>Test Password:</strong>
          <code style="background: #fff; padding: 2px 6px; border-radius: 3px;">instructor123</code
          ><br />
          <br />
          <strong>Password Storage:</strong> The hash is read from a hidden DOM element
          <code>&lt;span id="qd-instructor-hash"&gt;</code> injected by Oxygen XSL transform. This
          story includes the hash for "instructor123".<br />
          <br />
          <strong>Generate a hash:</strong><br />
          <code>echo -n "your-password" | openssl dgst -sha256</code><br />
          <br />
          <strong>Rate Limiting:</strong> After 5 failed attempts, the form will lock with
          exponential backoff (2s, 4s, 8s, 16s, 30s max).
        </div>
        <qd-instructor></qd-instructor>
      </div>
    \`;
  }
}`,...n.parameters?.docs?.source},description:{story:`Default locked state - shows unlock form

**Test Password:** \`instructor123\`

**How it works:** The password hash is read from a hidden DOM element with \`id="qd-instructor-hash"\`.
This element is injected by the Oxygen XSL transform during DITA publishing. This allows different
passwords per deployment without rebuilding the JavaScript bundle.

**Generate Hash:**
\`\`\`bash
echo -n "your-password" | openssl dgst -sha256
\`\`\``,...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = html\`
      <div>
        <div
          style="background: #e7f3ff; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>ℹ️ Unlocked State:</strong> This story shows the instructor panel with 2 sample
          students (Alice: 80% completion, Bob: 100% completion).
        </div>
        <qd-instructor></qd-instructor>
      </div>
    \`;

    // Unlock and set data after render
    setTimeout(() => {
      const element = document.querySelector('qd-instructor') as QdInstructor;
      if (element) {
        element.unlock();
        element.setStudents(mockStudents);
      }
    }, 100);
    return container;
  }
}`,...r.parameters?.docs?.source},description:{story:`Unlocked state with student data

This story bypasses authentication to show the unlocked instructor panel with sample data.
The horizontal layout includes: View Scores | Export CSV | Erase All Data | Logout`,...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = html\`
      <div>
        <div
          style="background: #fff3cd; padding: 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>⚠️ Empty State:</strong> No student data available. Export and View Scores buttons
          will reflect this state.
        </div>
        <qd-instructor></qd-instructor>
      </div>
    \`;
    setTimeout(() => {
      const element = document.querySelector('qd-instructor') as QdInstructor;
      if (element) {
        element.unlock();
        element.setStudents([]);
      }
    }, 100);
    return container;
  }
}`,...s.parameters?.docs?.source},description:{story:`Unlocked with no student data

Shows the instructor panel when no students have submitted data yet.
The Export CSV button will be disabled, and the scores modal will show "No student data available".`,...s.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = html\`
      <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
        <qd-instructor data-show></qd-instructor>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the <strong>?</strong> button to open the help popup explaining instructor
            features.
          </p>
        </div>
      </div>
    \`;
    setTimeout(() => {
      const element = document.querySelector('qd-instructor') as QdInstructor;
      if (element) {
        element.setAttribute('data-show', '');
        element.unlock();
        element.setStudents(mockStudents);
      }
    }, 50);
    return container;
  }
}`,...o.parameters?.docs?.source},description:{story:`With Help

Shows instructor panel with help trigger button for E2E testing.`,...o.parameters?.docs?.description}}};const v=["Locked","Unlocked","UnlockedNoData","WithHelp"];export{n as Locked,r as Unlocked,s as UnlockedNoData,o as WithHelp,v as __namedExportsOrder,q as default};
