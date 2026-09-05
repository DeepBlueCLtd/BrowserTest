import{x as t}from"./lit-element-DR9D0stx.js";import"./qd-help-popup-DyrM3QuK.js";import"./qd-help-trigger-DqOyfU8-.js";import"./property-BRFVFa-w.js";import"./state-7B7Yt9om.js";const f={title:"Components/HelpPopup",component:"qd-help-popup",tags:["autodocs"],parameters:{docs:{description:{component:`
A modal popup that displays contextual help content.

**Features:**
- Portal rendering to document.body for proper z-index
- Customizable title and HTML content
- Multiple close methods: Escape key, backdrop click, close button
- Focus management (focuses close button, restores on close)
- Accessible (role="dialog", aria-modal, aria-labelledby)

**Properties:**
- \`open\`: Boolean - whether popup is visible
- \`title\`: String - popup header text (default: "Help")
- \`content\`: String - HTML content to display

**Events:**
- \`qd:modal-close\`: Emitted when popup closes

**Accessibility:**
- Dialog role with aria-modal="true"
- aria-labelledby points to title
- Close button has aria-label="Close"
- Focus trapped in popup while open
        `}}}},p={render:()=>t`
    <qd-help-popup
      open
      title="Login Help"
      .content=${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>'}
    >
    </qd-help-popup>
  `},r={render:()=>t`
    <qd-help-popup
      open
      title="Understanding Your Score"
      .content=${"<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>"}
    >
    </qd-help-popup>
  `},n={render:()=>t`
    <qd-help-popup
      open
      title="Instructor Tools"
      .content=${"<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>"}
    >
    </qd-help-popup>
  `},s={render:()=>t`
    <qd-help-popup
      open
      title="Custom Help"
      .content=${'<h3>Getting Started</h3><p>This is a <strong>custom</strong> help popup with <em>formatted</em> content.</p><ul><li>First item</li><li>Second item</li><li>Third item</li></ul><p>Contact: <a href="mailto:support@example.com">support@example.com</a></p>'}
    >
    </qd-help-popup>
  `},l={render:()=>t`
      <div style="padding: 20px;">
        <div
          style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
        >
          <span style="font-weight: 600; font-size: 16px;">Click for Help</span>
          <qd-help-trigger panelType="login" @qd:help-open=${()=>{const e=document.querySelector("#interactive-popup");e&&(e.open=!0)}}></qd-help-trigger>
        </div>

        <qd-help-popup
          id="interactive-popup"
          title="Login Help"
          .content=${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p><p><strong>Contact:</strong> support@example.com</p>'}
          @qd:modal-close=${()=>{const e=document.querySelector("#interactive-popup");e&&(e.open=!1)}}
        >
        </qd-help-popup>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the ? button to open the help popup. Close with Escape, backdrop click, or the ×
            button.
          </p>
        </div>
      </div>
    `},i={render:()=>{const a=e=>()=>{const o=document.querySelector(`#${e}`);o&&(o.open=!0)},d=e=>()=>{const o=document.querySelector(`#${e}`);o&&(o.open=!1)};return t`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Login Panel</span>
              <qd-help-trigger
                panelType="login"
                @qd:help-open=${a("login-help")}
              ></qd-help-trigger>
            </div>
          </div>

          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Status Panel</span>
              <qd-help-trigger
                panelType="status"
                @qd:help-open=${a("status-help")}
              ></qd-help-trigger>
            </div>
          </div>

          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Instructor Panel</span>
              <qd-help-trigger
                panelType="instructor"
                @qd:help-open=${a("instructor-help")}
              ></qd-help-trigger>
            </div>
          </div>
        </div>

        <qd-help-popup
          id="login-help"
          title="Login Help"
          .content=${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>'}
          @qd:modal-close=${d("login-help")}
        >
        </qd-help-popup>

        <qd-help-popup
          id="status-help"
          title="Understanding Your Score"
          .content=${"<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>"}
          @qd:modal-close=${d("status-help")}
        >
        </qd-help-popup>

        <qd-help-popup
          id="instructor-help"
          title="Instructor Tools"
          .content=${"<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>"}
          @qd:modal-close=${d("instructor-help")}
        >
        </qd-help-popup>
      </div>
    `}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-help-popup
      open
      title="Login Help"
      .content=\${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>'}
    >
    </qd-help-popup>
  \`
}`,...p.parameters?.docs?.source},description:{story:`Login Help

Help content for the login panel.`,...p.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-help-popup
      open
      title="Understanding Your Score"
      .content=\${'<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>'}
    >
    </qd-help-popup>
  \`
}`,...r.parameters?.docs?.source},description:{story:`Status Help

Help content for the student status panel.`,...r.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-help-popup
      open
      title="Instructor Tools"
      .content=\${'<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>'}
    >
    </qd-help-popup>
  \`
}`,...n.parameters?.docs?.source},description:{story:`Instructor Help

Help content for the instructor panel.`,...n.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-help-popup
      open
      title="Custom Help"
      .content=\${'<h3>Getting Started</h3><p>This is a <strong>custom</strong> help popup with <em>formatted</em> content.</p><ul><li>First item</li><li>Second item</li><li>Third item</li></ul><p>Contact: <a href="mailto:support@example.com">support@example.com</a></p>'}
    >
    </qd-help-popup>
  \`
}`,...s.parameters?.docs?.source},description:{story:`Custom Content

Shows how HTML content is rendered.`,...s.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    const openPopup = () => {
      const popup = document.querySelector('#interactive-popup') as HTMLElement & {
        open: boolean;
      };
      if (popup) {
        popup.open = true;
      }
    };
    const closePopup = () => {
      const popup = document.querySelector('#interactive-popup') as HTMLElement & {
        open: boolean;
      };
      if (popup) {
        popup.open = false;
      }
    };
    return html\`
      <div style="padding: 20px;">
        <div
          style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
        >
          <span style="font-weight: 600; font-size: 16px;">Click for Help</span>
          <qd-help-trigger panelType="login" @qd:help-open=\${openPopup}></qd-help-trigger>
        </div>

        <qd-help-popup
          id="interactive-popup"
          title="Login Help"
          .content=\${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p><p><strong>Contact:</strong> support@example.com</p>'}
          @qd:modal-close=\${closePopup}
        >
        </qd-help-popup>

        <div
          style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the ? button to open the help popup. Close with Escape, backdrop click, or the ×
            button.
          </p>
        </div>
      </div>
    \`;
  }
}`,...l.parameters?.docs?.source},description:{story:`Interactive

Demonstrates opening and closing the popup with the trigger button.`,...l.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const openPopup = (id: string) => () => {
      const popup = document.querySelector(\`#\${id}\`) as HTMLElement & {
        open: boolean;
      };
      if (popup) popup.open = true;
    };
    const closePopup = (id: string) => () => {
      const popup = document.querySelector(\`#\${id}\`) as HTMLElement & {
        open: boolean;
      };
      if (popup) popup.open = false;
    };
    return html\`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Login Panel</span>
              <qd-help-trigger
                panelType="login"
                @qd:help-open=\${openPopup('login-help')}
              ></qd-help-trigger>
            </div>
          </div>

          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Status Panel</span>
              <qd-help-trigger
                panelType="status"
                @qd:help-open=\${openPopup('status-help')}
              ></qd-help-trigger>
            </div>
          </div>

          <div
            style="flex: 1; min-width: 200px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600;">Instructor Panel</span>
              <qd-help-trigger
                panelType="instructor"
                @qd:help-open=\${openPopup('instructor-help')}
              ></qd-help-trigger>
            </div>
          </div>
        </div>

        <qd-help-popup
          id="login-help"
          title="Login Help"
          .content=\${'<h3>Welcome to BrowserTest</h3><p>Enter your Service ID and name to log in as a student and track your quiz progress.</p><p>Instructors: Click the "Instructor" button to access admin features.</p>'}
          @qd:modal-close=\${closePopup('login-help')}
        >
        </qd-help-popup>

        <qd-help-popup
          id="status-help"
          title="Understanding Your Score"
          .content=\${'<h3>Understanding Your Score</h3><p>Your score reflects your progress on quiz pages you have visited.</p><p><strong>Green</strong> = All questions correct<br><strong>Amber</strong> = Some questions answered<br><strong>Red</strong> = No questions answered</p>'}
          @qd:modal-close=\${closePopup('status-help')}
        >
        </qd-help-popup>

        <qd-help-popup
          id="instructor-help"
          title="Instructor Tools"
          .content=\${'<h3>Instructor Tools</h3><p><strong>View Scores</strong>: See all student results.</p><p><strong>Export CSV</strong>: Download detailed answer data.</p><p><strong>Erase Data</strong>: Clear database for new student cohort.</p>'}
          @qd:modal-close=\${closePopup('instructor-help')}
        >
        </qd-help-popup>
      </div>
    \`;
  }
}`,...i.parameters?.docs?.source},description:{story:`All Three Panels

Side-by-side comparison of all three help content types.`,...i.parameters?.docs?.description}}};const y=["LoginHelp","StatusHelp","InstructorHelp","CustomContent","Interactive","AllThreePanels"];export{i as AllThreePanels,s as CustomContent,n as InstructorHelp,l as Interactive,p as LoginHelp,r as StatusHelp,y as __namedExportsOrder,f as default};
