import{x as e}from"./lit-element-DR9D0stx.js";import"./qd-confirm-dialog-DChDrNIs.js";import"./property-BRFVFa-w.js";import"./qd-modal-Co8ngVCc.js";const f={title:"Components/ConfirmDialog",component:"qd-confirm-dialog",tags:["autodocs"],parameters:{docs:{description:{component:`
Reusable confirmation dialog for destructive or important actions.

**Features:**
- Customizable title and message (supports HTML)
- Configurable button text for confirm/cancel
- Destructive mode (red confirm button)
- Uses qd-modal base for backdrop, Escape key, focus management
- Emits qd:confirm and qd:cancel events

**Properties:**
- \`open\`: Boolean - whether dialog is visible
- \`title\`: String - dialog header (default: "Confirm")
- \`message\`: String - body text (supports HTML)
- \`confirmText\`: String - confirm button text (default: "Confirm")
- \`cancelText\`: String - cancel button text (default: "Cancel")
- \`destructive\`: Boolean - red confirm button styling

**Events:**
- \`qd:confirm\`: Emitted when confirm button is clicked
- \`qd:cancel\`: Emitted when cancel button is clicked or dialog dismissed
        `}}}},o={render:()=>e`
    <qd-confirm-dialog open title="Confirm Action" message="Are you sure you want to proceed?">
    </qd-confirm-dialog>
  `},n={render:()=>e`
    <qd-confirm-dialog
      open
      title="Delete Item"
      message="This action cannot be undone. All data will be permanently removed."
      confirmText="Delete"
      cancelText="Keep"
      destructive
    >
    </qd-confirm-dialog>
  `},t={render:()=>e`
    <qd-confirm-dialog
      open
      title="Save Changes"
      .message=${"You have unsaved changes. Would you like to save before leaving?"}
      confirmText="Save &amp; Exit"
      cancelText="Discard Changes"
    >
    </qd-confirm-dialog>
  `},r={render:()=>e`
    <qd-confirm-dialog
      open
      title="Reset PIN"
      .message=${"Reset PIN for <strong>John Smith</strong> (ID: RS1234)?<br><span style='font-size: 11px; color: #666;'>They will need to create a new PIN on next login.</span>"}
      confirmText="Reset PIN"
      destructive
    >
    </qd-confirm-dialog>
  `},i={render:()=>e`
      <div style="padding: 20px;">
        <button
          @click=${()=>{document.querySelector("qd-confirm-dialog")?.show()}}
          style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Delete Item
        </button>

        <qd-confirm-dialog
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          destructive
          @qd:confirm=${()=>{alert("Confirmed!")}}
          @qd:cancel=${()=>{alert("Cancelled")}}
        >
        </qd-confirm-dialog>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the confirmation dialog. Choose Confirm or Cancel (or press
            Escape) to close.
          </p>
        </div>
      </div>
    `},a={render:()=>e`
    <qd-confirm-dialog
      open
      title="Publish Document"
      message="This document will be published and visible to all users."
      confirmText="Publish"
      cancelText="Cancel"
    >
    </qd-confirm-dialog>
  `};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-confirm-dialog open title="Confirm Action" message="Are you sure you want to proceed?">
    </qd-confirm-dialog>
  \`
}`,...o.parameters?.docs?.source},description:{story:`Default

Basic confirmation dialog with default styling.`,...o.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-confirm-dialog
      open
      title="Delete Item"
      message="This action cannot be undone. All data will be permanently removed."
      confirmText="Delete"
      cancelText="Keep"
      destructive
    >
    </qd-confirm-dialog>
  \`
}`,...n.parameters?.docs?.source},description:{story:`Destructive Action

Confirmation for a destructive action with red button.`,...n.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-confirm-dialog
      open
      title="Save Changes"
      .message=\${'You have unsaved changes. Would you like to save before leaving?'}
      confirmText="Save &amp; Exit"
      cancelText="Discard Changes"
    >
    </qd-confirm-dialog>
  \`
}`,...t.parameters?.docs?.source},description:{story:`Custom Button Text

Dialog with customized confirm and cancel buttons.`,...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-confirm-dialog
      open
      title="Reset PIN"
      .message=\${"Reset PIN for <strong>John Smith</strong> (ID: RS1234)?<br><span style='font-size: 11px; color: #666;'>They will need to create a new PIN on next login.</span>"}
      confirmText="Reset PIN"
      destructive
    >
    </qd-confirm-dialog>
  \`
}`,...r.parameters?.docs?.source},description:{story:`HTML Message

Message with HTML formatting.`,...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    const openDialog = () => {
      const dialog = document.querySelector('qd-confirm-dialog');
      dialog?.show();
    };
    const handleConfirm = () => {
      alert('Confirmed!');
    };
    const handleCancel = () => {
      alert('Cancelled');
    };
    return html\`
      <div style="padding: 20px;">
        <button
          @click=\${openDialog}
          style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Delete Item
        </button>

        <qd-confirm-dialog
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          destructive
          @qd:confirm=\${handleConfirm}
          @qd:cancel=\${handleCancel}
        >
        </qd-confirm-dialog>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Click the button to open the confirmation dialog. Choose Confirm or Cancel (or press
            Escape) to close.
          </p>
        </div>
      </div>
    \`;
  }
}`,...i.parameters?.docs?.source},description:{story:`Interactive

Demonstrates opening, confirming, and canceling.`,...i.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-confirm-dialog
      open
      title="Publish Document"
      message="This document will be published and visible to all users."
      confirmText="Publish"
      cancelText="Cancel"
    >
    </qd-confirm-dialog>
  \`
}`,...a.parameters?.docs?.source},description:{story:`Non-Destructive Confirmation

Standard blue confirm button for non-dangerous actions.`,...a.parameters?.docs?.description}}};const h=["Default","DestructiveAction","CustomButtonText","HtmlMessage","Interactive","NonDestructive"];export{t as CustomButtonText,o as Default,n as DestructiveAction,r as HtmlMessage,i as Interactive,a as NonDestructive,h as __namedExportsOrder,f as default};
