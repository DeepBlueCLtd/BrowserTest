import{x as r}from"./lit-element-DR9D0stx.js";import"./qd-password-modal-BO6kslGq.js";import"./property-BRFVFa-w.js";import"./state-7B7Yt9om.js";import"./query-C-S87uso.js";import"./qd-modal-Co8ngVCc.js";const b={title:"Components/PasswordModal",component:"qd-password-modal",tags:["autodocs"],parameters:{docs:{description:{component:`
Password entry modal for authentication flows.

**Features:**
- Password input with placeholder
- Custom title support
- Error display capability
- Cancel and Submit buttons
- Uses qd-modal base for backdrop, Escape key, focus trap
- Auto-focuses password input on open

**Properties:**
- \`open\`: Boolean - whether modal is visible
- \`title\`: String - modal header (default: "Enter Password")
- \`error\`: String - error message to display

**Events:**
- \`qd:password-submit\`: Emitted with { password } when form is submitted
- \`close\`: Emitted when modal closes
        `}}}},o={render:()=>r` <qd-password-modal open></qd-password-modal> `},e={render:()=>r` <qd-password-modal open title="Instructor Login"></qd-password-modal> `},s={render:()=>r`
    <qd-password-modal open title="Instructor Login" error="Incorrect password"></qd-password-modal>
  `},t={render:()=>r`
    <qd-password-modal
      open
      title="Instructor Login"
      error="Instructor password not configured"
    ></qd-password-modal>
  `},n={render:()=>r`
      <div style="padding: 20px;">
        <button
          @click=${()=>{document.querySelector("qd-password-modal")?.show()}}
          style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Open Instructor Login
        </button>

        <qd-password-modal
          title="Instructor Login"
          @qd:password-submit=${a=>{const p=a.detail;alert(`Password submitted: ${p.password.substring(0,3)}***`),document.querySelector("qd-password-modal")?.close()}}
          @close=${()=>{}}
        ></qd-password-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the modal. Enter a password and click Login to submit, or
            Cancel/Escape to close.
          </p>
        </div>
      </div>
    `},d={render:()=>r`
    <div style="padding: 20px;">
      <qd-password-modal
        open
        title="Try Again"
        error="Incorrect password - start typing to clear this error"
      ></qd-password-modal>
    </div>
  `};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{\n  render: () => html` <qd-password-modal open></qd-password-modal> `\n}",...o.parameters?.docs?.source},description:{story:`Default

Basic password modal with default title.`,...o.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:'{\n  render: () => html` <qd-password-modal open title="Instructor Login"></qd-password-modal> `\n}',...e.parameters?.docs?.source},description:{story:`Custom Title

Password modal with custom header text.`,...e.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-password-modal open title="Instructor Login" error="Incorrect password"></qd-password-modal>
  \`
}`,...s.parameters?.docs?.source},description:{story:`With Error

Shows error message state.`,...s.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-password-modal
      open
      title="Instructor Login"
      error="Instructor password not configured"
    ></qd-password-modal>
  \`
}`,...t.parameters?.docs?.source},description:{story:`Multiple Errors

Shows different error messages.`,...t.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const openModal = () => {
      const modal = document.querySelector('qd-password-modal');
      modal?.show();
    };
    const handleSubmit = (e: Event) => {
      const detail = (e as CustomEvent<{
        password: string;
      }>).detail;
      alert(\`Password submitted: \${detail.password.substring(0, 3)}***\`);
      const modal = document.querySelector('qd-password-modal');
      modal?.close();
    };
    return html\`
      <div style="padding: 20px;">
        <button
          @click=\${openModal}
          style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Open Instructor Login
        </button>

        <qd-password-modal
          title="Instructor Login"
          @qd:password-submit=\${handleSubmit}
          @close=\${() => {
      /* modal closed */
    }}
        ></qd-password-modal>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the modal. Enter a password and click Login to submit, or
            Cancel/Escape to close.
          </p>
        </div>
      </div>
    \`;
  }
}`,...n.parameters?.docs?.source},description:{story:`Interactive Open/Close

Demonstrates opening and closing the modal.`,...n.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="padding: 20px;">
      <qd-password-modal
        open
        title="Try Again"
        error="Incorrect password - start typing to clear this error"
      ></qd-password-modal>
    </div>
  \`
}`,...d.parameters?.docs?.source},description:{story:`Error Clear on Input

Demonstrates that error clears when user types.`,...d.parameters?.docs?.description}}};const y=["Default","CustomTitle","WithError","PasswordNotConfigured","Interactive","ErrorClearsOnInput"];export{e as CustomTitle,o as Default,d as ErrorClearsOnInput,n as Interactive,t as PasswordNotConfigured,s as WithError,y as __namedExportsOrder,b as default};
