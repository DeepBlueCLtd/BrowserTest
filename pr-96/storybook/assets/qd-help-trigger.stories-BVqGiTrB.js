import{x as e}from"./lit-element-DR9D0stx.js";import"./qd-help-trigger-DqOyfU8-.js";import"./property-BRFVFa-w.js";const u={title:"Components/HelpTrigger",component:"qd-help-trigger",tags:["autodocs"],parameters:{docs:{description:{component:`
A small help icon button (?) that triggers contextual help popups.

**Features:**
- Circular blue button with white "?" icon
- Keyboard accessible (focusable button)
- Emits qd:help-open event with panelType detail
- Three panel types: login, status, instructor

**Properties:**
- \`panelType\`: String - which panel this trigger belongs to ('login' | 'status' | 'instructor')

**Events:**
- \`qd:help-open\`: CustomEvent<{panelType: string}> - Emitted when button is clicked

**Accessibility:**
- \`aria-label="Help"\`
- \`title="Help"\`
- Native button element (keyboard accessible)
        `}}},argTypes:{panelType:{control:{type:"select"},options:["login","status","instructor"],description:"Which panel this trigger belongs to"}}},t={render:()=>e` <qd-help-trigger></qd-help-trigger> `},r={render:()=>e` <qd-help-trigger panelType="login"></qd-help-trigger> `},n={render:()=>e` <qd-help-trigger panelType="status"></qd-help-trigger> `},p={render:()=>e` <qd-help-trigger panelType="instructor"></qd-help-trigger> `},i={render:()=>{const a=o=>{const l=o.detail;alert(`Help requested for: ${l.panelType}`)};return e`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="text-align: center;">
            <qd-help-trigger panelType="login" @qd:help-open=${a}></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Login</div>
          </div>
          <div style="text-align: center;">
            <qd-help-trigger panelType="status" @qd:help-open=${a}></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Status</div>
          </div>
          <div style="text-align: center;">
            <qd-help-trigger
              panelType="instructor"
              @qd:help-open=${a}
            ></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Instructor</div>
          </div>
        </div>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">Click any help button to see the event with its panelType.</p>
        </div>
      </div>
    `}},s={render:()=>e`
    <div style="padding: 20px;">
      <div
        style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Login</span>
        <qd-help-trigger panelType="login"></qd-help-trigger>
      </div>

      <div
        style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Your Progress: 75%</span>
        <qd-help-trigger panelType="status"></qd-help-trigger>
      </div>

      <div
        style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Instructor Tools</span>
        <qd-help-trigger panelType="instructor"></qd-help-trigger>
      </div>
    </div>
  `};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{\n  render: () => html` <qd-help-trigger></qd-help-trigger> `\n}",...t.parameters?.docs?.source},description:{story:`Default

Basic help trigger with default login panel type.`,...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:'{\n  render: () => html` <qd-help-trigger panelType="login"></qd-help-trigger> `\n}',...r.parameters?.docs?.source},description:{story:`Login Panel Type

Help trigger for the login panel.`,...r.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:'{\n  render: () => html` <qd-help-trigger panelType="status"></qd-help-trigger> `\n}',...n.parameters?.docs?.source},description:{story:`Status Panel Type

Help trigger for the student status panel.`,...n.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:'{\n  render: () => html` <qd-help-trigger panelType="instructor"></qd-help-trigger> `\n}',...p.parameters?.docs?.source},description:{story:`Instructor Panel Type

Help trigger for the instructor panel.`,...p.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const handleHelpOpen = (e: Event) => {
      const detail = (e as CustomEvent<{
        panelType: string;
      }>).detail;
      alert(\`Help requested for: \${detail.panelType}\`);
    };
    return html\`
      <div style="padding: 20px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="text-align: center;">
            <qd-help-trigger panelType="login" @qd:help-open=\${handleHelpOpen}></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Login</div>
          </div>
          <div style="text-align: center;">
            <qd-help-trigger panelType="status" @qd:help-open=\${handleHelpOpen}></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Status</div>
          </div>
          <div style="text-align: center;">
            <qd-help-trigger
              panelType="instructor"
              @qd:help-open=\${handleHelpOpen}
            ></qd-help-trigger>
            <div style="font-size: 12px; margin-top: 8px; color: #666;">Instructor</div>
          </div>
        </div>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">Click any help button to see the event with its panelType.</p>
        </div>
      </div>
    \`;
  }
}`,...i.parameters?.docs?.source},description:{story:`Interactive

Click the button to see the event emitted.`,...i.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="padding: 20px;">
      <div
        style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Login</span>
        <qd-help-trigger panelType="login"></qd-help-trigger>
      </div>

      <div
        style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Your Progress: 75%</span>
        <qd-help-trigger panelType="status"></qd-help-trigger>
      </div>

      <div
        style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;"
      >
        <span style="font-weight: 600; font-size: 16px;">Instructor Tools</span>
        <qd-help-trigger panelType="instructor"></qd-help-trigger>
      </div>
    </div>
  \`
}`,...s.parameters?.docs?.source},description:{story:`In Context

Shows how the help trigger looks in a typical panel header.`,...s.parameters?.docs?.description}}};const y=["Default","LoginPanelType","StatusPanelType","InstructorPanelType","Interactive","InContext"];export{t as Default,s as InContext,p as InstructorPanelType,i as Interactive,r as LoginPanelType,n as StatusPanelType,y as __namedExportsOrder,u as default};
