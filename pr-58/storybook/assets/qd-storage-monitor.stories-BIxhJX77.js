import{i as x,a as y,x as n}from"./lit-element-CSmQN0ht.js";import{n as h,t as v}from"./property-Cqq8i_uy.js";import{r as m}from"./state-BjYqokDn.js";var S=Object.defineProperty,w=Object.getOwnPropertyDescriptor,d=(e,t,s,r)=>{for(var o=r>1?void 0:r?w(t,s):t,i=e.length-1,l;i>=0;i--)(l=e[i])&&(o=(r?l(t,s,o):l(o))||o);return r&&o&&S(t,s,o),o};let a=class extends y{constructor(){super(...arguments),this.dbName="quiz-scores",this.hidden=!0,this.visible=!1,this.indexedDBEntries=[],this.sessionStorageEntries=[],this.handleToggleEntry=e=>{e.expanded=!e.expanded,this.requestUpdate()},this.handleClearSessionStorage=()=>{confirm("Clear all sessionStorage?")&&(sessionStorage.clear(),this.refreshData())},this.handleClearIndexedDB=async()=>{if(confirm(`Clear IndexedDB "${this.dbName}"?`))try{const e=await this.openDatabase();for(const t of Array.from(e.objectStoreNames))e.transaction(t,"readwrite").objectStore(t).clear();await this.refreshData()}catch(e){console.error("Failed to clear IndexedDB:",e)}},this.handleClose=()=>{this.visible=!1,this.hidden=!0}}connectedCallback(){super.connectedCallback(),this.setupKeyboardShortcut(),this.startRefresh()}disconnectedCallback(){super.disconnectedCallback(),this.stopRefresh()}setupKeyboardShortcut(){const e=t=>{t.ctrlKey&&t.shiftKey&&t.key==="D"&&(t.preventDefault(),this.toggleVisibility())};document.addEventListener("keydown",e)}toggleVisibility(){this.visible=!this.visible,this.hidden=!this.visible}startRefresh(){this.refreshData(),this.refreshInterval=window.setInterval(()=>{this.refreshData()},1e3)}stopRefresh(){this.refreshInterval&&window.clearInterval(this.refreshInterval)}async refreshData(){await this.refreshIndexedDB(),this.refreshSessionStorage()}async refreshIndexedDB(){try{const e=await this.openDatabase(),t=[];for(const s of Array.from(e.objectStoreNames)){const i=e.transaction(s,"readonly").objectStore(s).getAll();await new Promise((l,b)=>{i.onsuccess=()=>{i.result.forEach((u,f)=>{t.push({key:`${s}[${f}]`,value:u,expanded:!1})}),l()},i.onerror=()=>b(new Error(i.error?.message||"IndexedDB request failed"))})}this.indexedDBEntries=t}catch{this.indexedDBEntries=[]}}refreshSessionStorage(){const e=[];for(let t=0;t<sessionStorage.length;t++){const s=sessionStorage.key(t);if(s)try{const r=sessionStorage.getItem(s);e.push({key:s,value:r&&JSON.parse(r),expanded:!1})}catch{e.push({key:s,value:sessionStorage.getItem(s),expanded:!1})}}this.sessionStorageEntries=e}openDatabase(){return new Promise((e,t)=>{const s=indexedDB.open(this.dbName);s.onsuccess=()=>e(s.result),s.onerror=()=>t(new Error(s.error?.message||"Failed to open database"))})}renderEntry(e){return n`
      <div class="entry">
        <div class="entry-key" @click=${()=>this.handleToggleEntry(e)}>
          ${e.expanded?"▼":"▶"} ${e.key}
        </div>
        ${e.expanded?n` <div class="entry-value">${JSON.stringify(e.value,null,2)}</div> `:""}
      </div>
    `}render(){return n`
      <div class="header">
        <span class="title">Storage Monitor (Ctrl+Shift+D)</span>
        <div class="controls">
          <button @click=${this.handleClose}>✕</button>
        </div>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-title">
            IndexedDB: ${this.dbName}
            <button
              class="danger"
              @click=${this.handleClearIndexedDB}
              style="float: right; margin-top: -2px;"
            >
              Clear
            </button>
          </div>
          ${this.indexedDBEntries.length===0?n`<div class="empty">No entries</div>`:this.indexedDBEntries.map(e=>this.renderEntry(e))}
        </div>

        <div class="section">
          <div class="section-title">
            sessionStorage
            <button
              class="danger"
              @click=${this.handleClearSessionStorage}
              style="float: right; margin-top: -2px;"
            >
              Clear
            </button>
          </div>
          ${this.sessionStorageEntries.length===0?n`<div class="empty">No entries</div>`:this.sessionStorageEntries.map(e=>this.renderEntry(e))}
        </div>
      </div>
    `}};a.styles=x`
    :host {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      max-height: 500px;
      background: white;
      border: 2px solid #333;
      border-radius: 4px 0 0 0;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      font-family: monospace;
      font-size: 12px;
      z-index: 9999; /* Below modal overlays (10001) */
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    }

    :host([hidden]) {
      display: none;
      pointer-events: none;
    }

    .header {
      background: #333;
      color: white;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title {
      font-weight: bold;
    }

    .controls {
      display: flex;
      gap: 8px;
    }

    button {
      background: #555;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }

    button:hover {
      background: #777;
    }

    button.danger {
      background: #dc3545;
    }

    button.danger:hover {
      background: #c82333;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 4px;
      padding: 4px;
      background: #f0f0f0;
    }

    .entry {
      margin: 4px 0;
      padding: 4px;
      border-left: 2px solid #ddd;
      padding-left: 8px;
    }

    .entry-key {
      color: #0066cc;
      cursor: pointer;
      user-select: none;
    }

    .entry-key:hover {
      text-decoration: underline;
    }

    .entry-value {
      color: #666;
      margin-left: 16px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .entry-actions {
      margin-left: 16px;
      margin-top: 4px;
    }

    .empty {
      color: #999;
      font-style: italic;
    }
  `;d([h({type:String})],a.prototype,"dbName",2);d([h({type:Boolean,reflect:!0})],a.prototype,"hidden",2);d([m()],a.prototype,"visible",2);d([m()],a.prototype,"indexedDBEntries",2);d([m()],a.prototype,"sessionStorageEntries",2);a=d([v("qd-storage-monitor")],a);const B={title:"Components/QdStorageMonitor",component:"qd-storage-monitor",tags:["autodocs"],argTypes:{dbName:{control:"text"}}},c={args:{dbName:"BrowserTest"},render:e=>(typeof window<"u"&&(sessionStorage.setItem("qd/session",JSON.stringify({serviceId:"TEST001",name:"John Doe",release:"01-2025",loginTime:new Date().toISOString()})),sessionStorage.setItem("qd/cache",JSON.stringify({"quiz-1":{state:"complete",attempted:5,correct:4},"quiz-2":{state:"incomplete",attempted:2,correct:1}}))),n`
      <div>
        <div
          style="background: #f0f0f0; padding: 16px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>🔍 Storage Monitor (Development Tool)</strong><br />
          <br />
          <strong>Keyboard Shortcut:</strong> Press
          <kbd
            style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;"
            >Ctrl+Shift+D</kbd
          >
          to toggle visibility<br />
          <br />
          <strong>Features:</strong>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Real-time IndexedDB inspection</li>
            <li>SessionStorage viewer</li>
            <li>Expand/collapse JSON objects</li>
            <li>Clear individual keys or all storage</li>
          </ul>
          <strong>Note:</strong> The monitor starts hidden. Use the keyboard shortcut to show it in
          the bottom-right corner.
        </div>
        <qd-storage-monitor dbName=${e.dbName}></qd-storage-monitor>
      </div>
    `)},p={args:{dbName:"MyCustomDB"},render:e=>n`
    <div>
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
        Monitoring IndexedDB database: <strong>${e.dbName}</strong>
      </p>
      <qd-storage-monitor dbName=${e.dbName}></qd-storage-monitor>
    </div>
  `},g={args:{dbName:"BrowserTest"},render:e=>(typeof window<"u"&&(sessionStorage.setItem("demo-key-1","Simple string value"),sessionStorage.setItem("demo-key-2",JSON.stringify({nested:{data:!0}}))),n`
      <div>
        <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
          ℹ️ This story shows the monitor always visible for demonstration purposes.
        </p>
        <qd-storage-monitor dbName=${e.dbName} hidden="false"></qd-storage-monitor>
      </div>
    `)};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    dbName: 'BrowserTest'
  },
  render: args => {
    // Add some sample sessionStorage data
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qd/session', JSON.stringify({
        serviceId: 'TEST001',
        name: 'John Doe',
        release: '01-2025',
        loginTime: new Date().toISOString()
      }));
      sessionStorage.setItem('qd/cache', JSON.stringify({
        'quiz-1': {
          state: 'complete',
          attempted: 5,
          correct: 4
        },
        'quiz-2': {
          state: 'incomplete',
          attempted: 2,
          correct: 1
        }
      }));
    }
    return html\`
      <div>
        <div
          style="background: #f0f0f0; padding: 16px; margin-bottom: 16px; border-radius: 4px; font-size: 13px;"
        >
          <strong>🔍 Storage Monitor (Development Tool)</strong><br />
          <br />
          <strong>Keyboard Shortcut:</strong> Press
          <kbd
            style="background: white; padding: 2px 6px; border: 1px solid #ccc; border-radius: 3px;"
            >Ctrl+Shift+D</kbd
          >
          to toggle visibility<br />
          <br />
          <strong>Features:</strong>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Real-time IndexedDB inspection</li>
            <li>SessionStorage viewer</li>
            <li>Expand/collapse JSON objects</li>
            <li>Clear individual keys or all storage</li>
          </ul>
          <strong>Note:</strong> The monitor starts hidden. Use the keyboard shortcut to show it in
          the bottom-right corner.
        </div>
        <qd-storage-monitor dbName=\${args.dbName}></qd-storage-monitor>
      </div>
    \`;
  }
}`,...c.parameters?.docs?.source},description:{story:`Storage monitor for development debugging

**Features:**
- Real-time IndexedDB and sessionStorage inspection
- Expand/collapse JSON objects
- Clear individual keys or all storage
- Keyboard shortcut: \`Ctrl+Shift+D\` to toggle visibility
- Auto-injected when \`data-debug="true"\` on script tag

**Usage:**
\`\`\`html
<qd-storage-monitor dbName="BrowserTest"></qd-storage-monitor>
\`\`\``,...c.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    dbName: 'MyCustomDB'
  },
  render: args => html\`
    <div>
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
        Monitoring IndexedDB database: <strong>\${args.dbName}</strong>
      </p>
      <qd-storage-monitor dbName=\${args.dbName}></qd-storage-monitor>
    </div>
  \`
}`,...p.parameters?.docs?.source},description:{story:`Custom database name

Configure the IndexedDB database name to monitor a different database.`,...p.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    dbName: 'BrowserTest'
  },
  render: args => {
    // Add sample data
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demo-key-1', 'Simple string value');
      sessionStorage.setItem('demo-key-2', JSON.stringify({
        nested: {
          data: true
        }
      }));
    }
    return html\`
      <div>
        <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
          ℹ️ This story shows the monitor always visible for demonstration purposes.
        </p>
        <qd-storage-monitor dbName=\${args.dbName} hidden="false"></qd-storage-monitor>
      </div>
    \`;
  }
}`,...g.parameters?.docs?.source},description:{story:'Always visible (for demonstration)\n\nThis story shows the monitor with `hidden="false"` for easier preview.',...g.parameters?.docs?.description}}};const q=["Default","CustomDatabase","AlwaysVisible"];export{g as AlwaysVisible,p as CustomDatabase,c as Default,q as __namedExportsOrder,B as default};
