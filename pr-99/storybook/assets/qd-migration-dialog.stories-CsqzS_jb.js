import{x as r}from"./lit-element-DR9D0stx.js";import"./qd-migration-dialog-Ckz8R3ku.js";import"./property-BRFVFa-w.js";import"./state-7B7Yt9om.js";import"./query-C-S87uso.js";import"./instructor-auth-Dkd1BrSp.js";import"./logger-DdbYlyfi.js";import"./qd-modal-Co8ngVCc.js";const h={title:"Components/MigrationDialog",component:"qd-migration-dialog",tags:["autodocs"],parameters:{docs:{description:{component:`
Migration dialog for handling storage format mismatch during login.

**Purpose:**
When the \`ENCRYPT_STORAGE\` build flag doesn't match the format of stored data,
this dialog allows instructors to migrate all records to the correct format.

**Features:**
- Shows mismatch details (expected vs found format)
- Requires instructor password for authorization
- Runs migration via migrateObfuscation()
- Progress and error/success states
- Uses qd-modal base for backdrop, Escape key, focus management

**Properties:**
- \`open\`: Boolean - whether dialog is visible
- \`expected\`: String - expected format ('plain' or 'obfuscated')
- \`found\`: String - actual format found in storage
- \`dbName\`: String - database name for migration
- \`releaseId\`: String - release ID for key derivation

**Events:**
- \`qd:migration-complete\`: Emitted on successful migration with {migrated, skipped} counts
- \`qd:migration-cancel\`: Emitted when user cancels
        `}}},decorators:[d=>((()=>{if(!document.getElementById("qd-instructor-hash")){const e=document.createElement("span");e.id="qd-instructor-hash",e.style.display="none",e.textContent="a1159e9df367",document.body.appendChild(e)}})(),d())]},o={render:()=>r`
    <qd-migration-dialog
      open
      expected="obfuscated"
      found="plain"
      dbName="BrowserTestDB"
      releaseId="TRV Connectors Autumn 2025"
    >
    </qd-migration-dialog>
  `},t={render:()=>r`
    <qd-migration-dialog
      open
      expected="plain"
      found="obfuscated"
      dbName="BrowserTestDB"
      releaseId="TRV Connectors Autumn 2025"
    >
    </qd-migration-dialog>
  `},a={render:()=>r`
      <div style="padding: 20px;">
        <button
          @click=${()=>{const n=document.querySelector("qd-migration-dialog");n&&(n.open=!0)}}
          style="padding: 8px 16px; background: #f57c00; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Trigger Migration Dialog
        </button>

        <qd-migration-dialog
          expected="obfuscated"
          found="plain"
          dbName="BrowserTestDB"
          releaseId="TRV Connectors Autumn 2025"
          @qd:migration-complete=${n=>{alert(`Migration complete: ${n.detail.migrated} migrated, ${n.detail.skipped} skipped`)}}
          @qd:migration-cancel=${()=>{alert("Migration cancelled")}}
        >
        </qd-migration-dialog>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0;"><strong>Test Instructions:</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click the button to open the dialog</li>
            <li>Enter instructor password: <code>pwd</code></li>
            <li>Click "Migrate Database" to simulate migration</li>
            <li>Or click Cancel to dismiss</li>
          </ol>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            Note: In Storybook, actual migration won't run (no real IndexedDB data).
          </p>
        </div>
      </div>
    `},i={render:()=>r`
    <div style="padding: 20px;">
      <p>The migration dialog is closed (open=false). Nothing should be visible.</p>
      <qd-migration-dialog
        expected="obfuscated"
        found="plain"
        dbName="BrowserTestDB"
        releaseId="TRV Connectors Autumn 2025"
      >
      </qd-migration-dialog>
    </div>
  `};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-migration-dialog
      open
      expected="obfuscated"
      found="plain"
      dbName="BrowserTestDB"
      releaseId="TRV Connectors Autumn 2025"
    >
    </qd-migration-dialog>
  \`
}`,...o.parameters?.docs?.source},description:{story:`Plain to Obfuscated

Shows dialog when plain data found but obfuscated expected.`,...o.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <qd-migration-dialog
      open
      expected="plain"
      found="obfuscated"
      dbName="BrowserTestDB"
      releaseId="TRV Connectors Autumn 2025"
    >
    </qd-migration-dialog>
  \`
}`,...t.parameters?.docs?.source},description:{story:`Obfuscated to Plain

Shows dialog when obfuscated data found but plain expected.`,...t.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const handleComplete = (e: CustomEvent<{
      migrated: number;
      skipped: number;
    }>) => {
      alert(\`Migration complete: \${e.detail.migrated} migrated, \${e.detail.skipped} skipped\`);
    };
    const handleCancel = () => {
      alert('Migration cancelled');
    };
    const openDialog = () => {
      const dialog = document.querySelector('qd-migration-dialog');
      if (dialog) {
        dialog.open = true;
      }
    };
    return html\`
      <div style="padding: 20px;">
        <button
          @click=\${openDialog}
          style="padding: 8px 16px; background: #f57c00; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          Trigger Migration Dialog
        </button>

        <qd-migration-dialog
          expected="obfuscated"
          found="plain"
          dbName="BrowserTestDB"
          releaseId="TRV Connectors Autumn 2025"
          @qd:migration-complete=\${handleComplete}
          @qd:migration-cancel=\${handleCancel}
        >
        </qd-migration-dialog>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0;"><strong>Test Instructions:</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click the button to open the dialog</li>
            <li>Enter instructor password: <code>pwd</code></li>
            <li>Click "Migrate Database" to simulate migration</li>
            <li>Or click Cancel to dismiss</li>
          </ol>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            Note: In Storybook, actual migration won't run (no real IndexedDB data).
          </p>
        </div>
      </div>
    \`;
  }
}`,...a.parameters?.docs?.source},description:{story:`Interactive

Demonstrates opening and event handling.`,...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="padding: 20px;">
      <p>The migration dialog is closed (open=false). Nothing should be visible.</p>
      <qd-migration-dialog
        expected="obfuscated"
        found="plain"
        dbName="BrowserTestDB"
        releaseId="TRV Connectors Autumn 2025"
      >
      </qd-migration-dialog>
    </div>
  \`
}`,...i.parameters?.docs?.source},description:{story:`Closed State

Dialog in closed state (not visible).`,...i.parameters?.docs?.description}}};const x=["PlainToObfuscated","ObfuscatedToPlain","Interactive","Closed"];export{i as Closed,a as Interactive,t as ObfuscatedToPlain,o as PlainToObfuscated,x as __namedExportsOrder,h as default};
