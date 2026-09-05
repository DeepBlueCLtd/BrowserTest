import{i as x,a as $,x as p,E as v}from"./lit-element-DR9D0stx.js";import{t as S,n as g}from"./property-BRFVFa-w.js";import{r as h}from"./state-7B7Yt9om.js";import{e as C}from"./query-C-S87uso.js";import{d as E,i as M,a as R,g as P,v as q}from"./instructor-auth-Dkd1BrSp.js";import{w as I,i as O,e as D}from"./logger-DdbYlyfi.js";import"./qd-modal-Co8ngVCc.js";const _=!1,f="students";async function z(r,t,a){const s=performance.now(),e={migrated:0,skipped:0,errors:[],durationMs:0},{releaseId:o,dryRun:i=!1}=a,d=E(o),l=await F(r);try{const k=await T(l);for(const{key:b,value:y}of k)try{const u=M(y);if(t!=="encrypt"){if(!u){e.skipped++;continue}const m=R(y,d);i||await j(l,b,m),e.migrated++}}catch(u){const m=u instanceof Error?u.message:String(u);e.errors.push({key:b,error:m}),I(`Migration error for key ${b}: ${m}`)}}finally{l.close()}return e.durationMs=performance.now()-s,O(`Migration complete: migrated=${e.migrated}, skipped=${e.skipped}, errors=${e.errors.length}, duration=${e.durationMs.toFixed(2)}ms`),e}async function F(r){return new Promise((t,a)=>{const s=indexedDB.open(r);s.onsuccess=()=>t(s.result),s.onerror=()=>{D(`Failed to open database: ${s.error?.message}`),a(new Error(`Failed to open database: ${s.error?.message}`))}})}async function T(r){return new Promise((t,a)=>{const o=r.transaction(f,"readonly").objectStore(f).openCursor(),i=[];o.onsuccess=()=>{const d=o.result;if(d){const l=typeof d.key=="string"?d.key:JSON.stringify(d.key);i.push({key:l,value:d.value}),d.continue()}else t(i)},o.onerror=()=>{a(new Error(`Failed to read records: ${o.error?.message}`))}})}async function j(r,t,a){return new Promise((s,e)=>{const d=r.transaction(f,"readwrite").objectStore(f).put(a,t);d.onsuccess=()=>s(),d.onerror=()=>{e(new Error(`Failed to save record: ${d.error?.message}`))}})}const N=x`
  :host {
    display: contents;
  }

  .migration-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px 0;
  }

  .warning-banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #fff3cd;
    border-radius: 4px;
    border-left: 4px solid #ffc107;
  }

  .warning-icon {
    font-size: 20px;
    line-height: 1;
  }

  .warning-text {
    flex: 1;
  }

  .warning-text strong {
    display: block;
    margin-bottom: 4px;
    color: #856404;
  }

  .format-info {
    font-size: 13px;
    color: #666;
  }

  .format-row {
    display: flex;
    gap: 8px;
    margin: 4px 0;
  }

  .format-label {
    font-weight: 500;
    min-width: 100px;
  }

  .format-value {
    font-family: monospace;
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }

  input[type='password'] {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  input[type='password']:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }

  .error-message {
    color: #d32f2f;
    font-size: 12px;
    padding: 8px;
    background: #ffebee;
    border-radius: 4px;
    border-left: 3px solid #d32f2f;
  }

  .success-message {
    color: #2e7d32;
    font-size: 13px;
    padding: 12px;
    background: #e8f5e9;
    border-radius: 4px;
    border-left: 3px solid #4caf50;
  }

  .migrating-state {
    text-align: center;
    padding: 20px;
  }

  .button-row {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button.primary {
    background: #0066cc;
    color: white;
  }

  button.primary:hover:not(:disabled) {
    background: #0052a3;
  }

  button.secondary {
    background: #e0e0e0;
    color: #333;
  }

  button.secondary:hover:not(:disabled) {
    background: #d0d0d0;
  }
`,A=x`
  .spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid #e0e0e0;
    border-top-color: #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;var B=Object.getOwnPropertyDescriptor,K=(r,t,a,s)=>{for(var e=s>1?void 0:s?B(t,a):t,o=r.length-1,i;o>=0;o--)(i=r[o])&&(e=i(e)||e);return e};let w=class extends ${render(){return p`<div class="spinner" role="status" aria-label="Loading"></div>`}};w.styles=[A];w=K([S("qd-spinner")],w);var Q=Object.defineProperty,U=Object.getOwnPropertyDescriptor,c=(r,t,a,s)=>{for(var e=s>1?void 0:s?U(t,a):t,o=r.length-1,i;o>=0;o--)(i=r[o])&&(e=(s?i(t,a,e):i(e))||e);return s&&e&&Q(t,a,e),e};let n=class extends ${constructor(){super(...arguments),this.open=!1,this.expected="plain",this.found="plain",this.dbName="",this.releaseId="",this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.handleModalClose=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))},this.handleInput=r=>{const t=r.target;this.password=t.value,this.error&&(this.error="")},this.handleSubmit=async r=>{if(r.preventDefault(),!this.password.trim())return;if(!await this.validatePassword(this.password)){this.error||(this.error="Incorrect instructor password");return}await this.runMigration()},this.handleContinue=()=>{this.dispatchEvent(new CustomEvent("qd:migration-complete",{detail:this.migrationResult,bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))}}updated(r){r.has("open")&&this.open&&(this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.updateComplete.then(()=>{this.passwordInput?.focus()}))}async validatePassword(r){return P()?q(r):(this.error="Instructor password not configured",!1)}async runMigration(){this.dialogState="migrating",this.error="";try{const r=_?"encrypt":"decrypt",t=await z(this.dbName,r,{releaseId:this.releaseId,dryRun:!1});if(t.errors.length>0){this.dialogState="error",this.error=`Migration completed with ${t.errors.length} error(s). Some records may not have been migrated.`;return}this.migrationResult={migrated:t.migrated,skipped:t.skipped},this.dialogState="success"}catch(r){this.dialogState="error",this.error=`Migration failed: ${r instanceof Error?r.message:"Unknown error"}`}}render(){return p`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Database Migration Required</span>

        ${this.open?this.renderContent():v}
      </qd-modal>
    `}renderContent(){switch(this.dialogState){case"password":return this.renderPasswordForm();case"migrating":return this.renderMigrating();case"error":return this.renderError();case"success":return this.renderSuccess()}}renderPasswordForm(){return p`
      <div class="migration-content">
        <div class="warning-banner">
          <span class="warning-icon">&#9888;</span>
          <div class="warning-text">
            <strong>Storage format mismatch detected</strong>
            <div class="format-info">
              <div class="format-row">
                <span class="format-label">Current data:</span>
                <span class="format-value">${this.found}</span>
              </div>
              <div class="format-row">
                <span class="format-label">Build expects:</span>
                <span class="format-value">${this.expected}</span>
              </div>
            </div>
          </div>
        </div>

        <p>Enter the instructor password to migrate all stored records to the new format.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-field">
            <label for="migration-password">Instructor Password</label>
            <input
              id="migration-password"
              type="password"
              placeholder="Password"
              .value=${this.password}
              @input=${this.handleInput}
              required
              aria-label="Enter instructor password to authorize migration"
            />
          </div>

          ${this.error?p`<div class="error-message">${this.error}</div>`:v}

          <div class="button-row">
            <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary">Migrate Database</button>
          </div>
        </form>
      </div>
    `}renderMigrating(){return p`
      <div class="migration-content">
        <div class="migrating-state">
          <qd-spinner></qd-spinner>
          <p>Migrating database records...</p>
          <p class="format-info">Please wait, do not close this window.</p>
        </div>
      </div>
    `}renderError(){return p`
      <div class="migration-content">
        <div class="error-message">${this.error}</div>

        <div class="button-row">
          <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
          <button type="button" class="primary" @click=${()=>this.dialogState="password"}>
            Try Again
          </button>
        </div>
      </div>
    `}renderSuccess(){return p`
      <div class="migration-content">
        <div class="success-message">
          Migration completed successfully!<br />
          <span class="format-info">
            ${this.migrationResult?.migrated??0} record(s) migrated,
            ${this.migrationResult?.skipped??0} already in correct format.
          </span>
        </div>

        <div class="button-row">
          <button type="button" class="primary" @click=${this.handleContinue}>Continue</button>
        </div>
      </div>
    `}};n.styles=[N];c([g({type:Boolean,reflect:!0})],n.prototype,"open",2);c([g({type:String})],n.prototype,"expected",2);c([g({type:String})],n.prototype,"found",2);c([g({type:String})],n.prototype,"dbName",2);c([g({type:String})],n.prototype,"releaseId",2);c([h()],n.prototype,"dialogState",2);c([h()],n.prototype,"password",2);c([h()],n.prototype,"error",2);c([h()],n.prototype,"migrationResult",2);c([C('input[type="password"]')],n.prototype,"passwordInput",2);n=c([S("qd-migration-dialog")],n);
