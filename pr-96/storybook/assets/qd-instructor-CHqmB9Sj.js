import{i as C,a as u,x as a,B as R,E as z}from"./lit-element-DR9D0stx.js";import{t as f,n as h}from"./property-BRFVFa-w.js";import{r as d}from"./state-7B7Yt9om.js";import{P as N,c as M,g as q,S as k,I as D}from"./storage-helpers-D_wcwu-v.js";import{S as j,b as P,g as O}from"./help-content-Cyahxh7N.js";import{f as _,g as A,h as T}from"./dom-helpers-CAaP8i-_.js";import{R as V,g as F,h as B,c as H,b as U,C as Q}from"./instructor-auth-Dkd1BrSp.js";import"./qd-scores-modal-_vWRpiMT.js";import{g as W,r as G}from"./migration-D_yK0_mn.js";import"./qd-modal-Co8ngVCc.js";import"./qd-confirm-dialog-DChDrNIs.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";const w=C`
  :host {
    display: inline-block;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  /* When showing modal, host should not constrain size */
  :host([showmodal]) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none; /* Let clicks through except on modal */
  }

  :host([showmodal]) .modal-overlay {
    pointer-events: auto; /* Re-enable on overlay */
  }

  .instructor-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .instructor-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--qd-text-on-dark, #fff);
    margin-right: 8px;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--qd-text-on-dark, #fff);
    user-select: none;
  }

  .toggle-label input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  button:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  button:active {
    background: #e5e5e5;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.compact {
    padding: 6px 12px;
    font-size: 13px;
  }

  button.primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  button.primary:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  button.secondary {
    background: #ff9800;
    color: white;
    border-color: #ff9800;
  }

  button.secondary:hover {
    background: #f57c00;
    border-color: #f57c00;
  }

  button.danger {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
  }

  button.danger:hover {
    background: #c82333;
    border-color: #c82333;
  }

  button.logout {
    background: #6c757d;
    color: white;
    border-color: #6c757d;
  }

  button.logout:hover {
    background: #5a6268;
    border-color: #5a6268;
  }

  input,
  textarea {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  .error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
  }

  .success {
    color: #28a745;
    font-size: 12px;
    margin-top: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  th,
  td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    color: #333; /* Explicit dark text */
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #000; /* Explicit black for headers */
  }

  tr:hover {
    background: #f9f9f9;
  }

  .correct {
    color: #28a745;
  }

  .incorrect {
    color: #dc3545;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--qd-modal-overlay-z-index, 9999);
    pointer-events: auto; /* Ensure overlay catches all clicks */
  }

  .modal-content {
    position: relative;
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 800px;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: var(--qd-modal-z-index, 10000);
    color: #333; /* Explicit dark text color */
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #000; /* Explicit black for title */
  }

  .close-button {
    padding: 4px 8px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }

  .close-button:hover {
    color: #000;
  }
`;var K=Object.defineProperty,Y=Object.getOwnPropertyDescriptor,$=(t,e,o,r)=>{for(var s=r>1?void 0:r?Y(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&K(e,o,s),s};let b=class extends u{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new V(N.MAX_ATTEMPTS-1),this.handlePasswordInput=t=>{const e=t.target;this.password=e.value,this.error=""},this.handleSubmit=async t=>{if(t.preventDefault(),!this.rateLimiter.attempt()){this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`;return}try{const o=F();if(!o)throw new Error("Instructor password hash not configured");const r=await B(this.password);await H(r,o)?(this.rateLimiter.reset(),this.password="",this.error="",_(this,"qd:instructor-unlock",{})):(this.rateLimiter.recordFailure(),this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.remainingSeconds===0?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return a`
      <div class="unlock-container">
        <h3>Instructor Access</h3>
        <p>Enter the instructor password to unlock administrative features.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="password">Password:</label>
            <input
              type="password"
              id="password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${t}
              autocomplete="current-password"
              required
            />
          </div>

          ${this.error?a`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};b.styles=w;$([d()],b.prototype,"password",2);$([d()],b.prototype,"error",2);$([d()],b.prototype,"remainingSeconds",2);b=$([f("qd-instructor-unlock")],b);var J=Object.defineProperty,X=Object.getOwnPropertyDescriptor,I=(t,e,o,r)=>{for(var s=r>1?void 0:r?X(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&J(e,o,s),s};let v=class extends u{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return a`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};v.styles=w;I([h({type:Array})],v.prototype,"students",2);I([h({type:Boolean})],v.prototype,"showModal",2);v=I([f("qd-instructor-scores")],v);var Z=Object.defineProperty,tt=Object.getOwnPropertyDescriptor,L=(t,e,o,r)=>{for(var s=r>1?void 0:r?tt(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&Z(e,o,s),s};let S=class extends u{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),e=new Blob([t],{type:"text/csv;charset=utf-8;"}),o=URL.createObjectURL(e),r=document.createElement("a");r.href=o;const n=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);r.download=`quiz-data-${n}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(o)}}escapeCSVField(t){let e=String(t);return/^[=+\-@\t\r]/.test(e)&&(e=`'${e}`),e.includes(",")||e.includes('"')||e.includes(`
`)?`"${e.replace(/"/g,'""')}"`:e}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const e of this.students)for(const[o,r]of Object.entries(e.pages))(r.answers||[]).forEach((n,i)=>{n&&t.push([this.escapeCSVField(e.serviceId),this.escapeCSVField(e.name),this.escapeCSVField(e.release),this.escapeCSVField(o),this.escapeCSVField(i),this.escapeCSVField(n.answer),this.escapeCSVField(n.success),this.escapeCSVField(n.timestamp)].join(","))});return t.join(`
`)}render(){const t=this.students.length>0&&this.students.some(o=>o.attempted>0),e=t?`Export ${this.students.length} student${this.students.length===1?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return a`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${e}
      >
        Export CSV
      </button>
    `}};S.styles=w;L([h({type:Array})],S.prototype,"students",2);S=L([f("qd-instructor-export")],S);var et=Object.defineProperty,st=Object.getOwnPropertyDescriptor,y=(t,e,o,r)=>{for(var s=r>1?void 0:r?st(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&et(e,o,s),s};let p=class extends u{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const e=t.target;this.confirmText=e.value},this.handleConfirmClear=async()=>{if(this.confirmText!=="DELETE ALL DATA"){this.error="Confirmation text does not match";return}try{await A().clearAll(),M(),_(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),R(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return a`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?a`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t=this.confirmText==="DELETE ALL DATA";return a`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${e=>{e.target===e.currentTarget&&this.handleCancelClear()}}
      >
        <div
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${e=>e.stopPropagation()}
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h2 style="font-size: 18px; font-weight: 600; margin: 0; color: #000;">
              Confirm Data Deletion
            </h2>
            <button
              style="padding: 4px 8px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #666;"
              @click=${this.handleCancelClear}
            >
              ✕
            </button>
          </div>

          <p style="color: #dc3545; font-weight: 600; margin: 12px 0;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p style="margin: 12px 0; color: #333;">
            This action cannot be undone. All students will need to start over.
          </p>

          <p style="margin: 12px 0; color: #333;">
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 16px 0; box-sizing: border-box;"
            autocomplete="off"
          />

          ${this.error?a`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button
              style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer; font-size: 14px;"
              @click=${this.handleCancelClear}
            >
              Cancel
            </button>
            <button
              style="padding: 8px 16px; border: none; border-radius: 4px; background: ${t?"#dc3545":"#ccc"}; color: white; cursor: ${t?"pointer":"not-allowed"}; font-size: 14px;"
              @click=${this.handleConfirmClear}
              ?disabled=${!t}
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};p.styles=w;y([d()],p.prototype,"showConfirmDialog",2);y([d()],p.prototype,"confirmText",2);y([d()],p.prototype,"error",2);y([d()],p.prototype,"success",2);p=y([f("qd-instructor-manage")],p);async function ot(t){const e=U();if(!e)return{ok:!1,error:`Database name not configured. Add <span id="${Q.dbName}">dbName</span> to page.`};try{const o=W(e);await o.init();const r=G(t);await o.saveStudent(r);const s={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:new Date().toISOString(),release:t.release};return await o.saveAuditEvent(s),{ok:!0,updated:r}}catch(o){return console.error("PIN reset error:",o),{ok:!1,error:"Failed to reset PIN. Please try again."}}}var rt=Object.defineProperty,nt=Object.getOwnPropertyDescriptor,E=(t,e,o,r)=>{for(var s=r>1?void 0:r?nt(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&rt(e,o,s),s};let x=class extends u{constructor(){super(...arguments),this.students=[],this.actionLabel="Select",this.searchText="",this.handleSearchInput=t=>{this.searchText=t.target.value}}get filteredStudents(){const t=this.searchText.toLowerCase().trim();return t?this.students.filter(e=>e.name.toLowerCase().includes(t)||e.serviceId.toLowerCase().includes(t)):this.students}emitSelect(t){this.dispatchEvent(new CustomEvent("select",{detail:t,bubbles:!0,composed:!0}))}render(){const t=this.filteredStudents;return a`
      <input
        type="text"
        class="search-input"
        placeholder="Search by name or ID..."
        .value=${this.searchText}
        @input=${this.handleSearchInput}
      />
      <div class="student-table-container">
        ${t.length===0?a`<div class="empty-message">
              ${this.searchText?"No matching students":"No students found"}
            </div>`:a`<table class="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Service ID</th>
                  <th>${this.actionLabel}</th>
                </tr>
              </thead>
              <tbody>
                ${t.map(e=>a`<tr>
                      <td>${e.name}</td>
                      <td>${e.serviceId}</td>
                      <td>
                        <button class="action-btn" type="button" @click=${()=>this.emitSelect(e)}>
                          ${this.actionLabel}
                        </button>
                      </td>
                    </tr>`)}
              </tbody>
            </table>`}
      </div>
    `}};x.styles=C`
    :host {
      display: block;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .search-input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .student-table-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .student-table th {
      text-align: left;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      position: sticky;
      top: 0;
    }

    .student-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .student-table tbody tr:nth-child(even) {
      background: #f8f8f8;
    }

    .student-table tbody tr:hover {
      background: #f0f0f0;
    }

    .student-table tr:last-child td {
      border-bottom: none;
    }

    .action-btn {
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    }

    .action-btn:hover {
      background: #e64a19;
    }

    .empty-message {
      padding: 16px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  `;E([h({type:Array})],x.prototype,"students",2);E([h({type:String})],x.prototype,"actionLabel",2);E([d()],x.prototype,"searchText",2);x=E([f("qd-student-table")],x);var it=Object.defineProperty,at=Object.getOwnPropertyDescriptor,m=(t,e,o,r)=>{for(var s=r>1?void 0:r?at(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&it(e,o,s),s};let l=class extends u{constructor(){super(...arguments),this.students=[],this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleResetClick=t=>{this.confirmingStudent=t,this.confirmDialogOpen=!0},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(t){this.open=t}get showModal(){return this.open}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage=""}show(){this.open=!0}async executeReset(t){const e=await ot(t);if(this.confirmDialogOpen=!1,this.confirmingStudent=null,!e.ok){this.errorMessage=e.error??"Failed to reset PIN. Please try again.";return}if(e.updated){const o=this.students.findIndex(r=>r.serviceId===t.serviceId);o>=0&&(this.students[o]=e.updated,this.students=[...this.students])}this.errorMessage="",this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:new Date().toISOString()},bubbles:!0,composed:!0}))}render(){const t=this.confirmingStudent,e=t?`Reset PIN for <strong>${T(t.name)}</strong> (${T(t.serviceId)})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return a`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open?a`
              <div class="pin-reset-content">
                <qd-student-table
                  .students=${this.students}
                  actionLabel="Reset"
                  @select=${o=>this.handleResetClick(o.detail)}
                ></qd-student-table>

                ${this.errorMessage?a`<div class="error-message">${this.errorMessage}</div>`:""}
              </div>
            `:z}
      </qd-modal>

      <qd-confirm-dialog
        .open=${this.confirmDialogOpen}
        title="Reset PIN"
        .message=${e}
        confirmText="Reset PIN"
        cancelText="Cancel"
        destructive
        @qd:confirm=${this.handleConfirmReset}
        @qd:cancel=${this.handleCancelReset}
      ></qd-confirm-dialog>
    `}};l.styles=C`
    :host {
      display: contents;
    }

    .pin-reset-content {
      min-width: 400px;
      max-width: 500px;
    }

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    }
  `;m([h({type:Array})],l.prototype,"students",2);m([h({type:Boolean,reflect:!0})],l.prototype,"open",2);m([d()],l.prototype,"confirmingStudent",2);m([d()],l.prototype,"confirmDialogOpen",2);m([d()],l.prototype,"errorMessage",2);m([h({type:Boolean})],l.prototype,"showModal",1);l=m([f("qd-pin-reset-dialog")],l);var dt=Object.defineProperty,lt=Object.getOwnPropertyDescriptor,g=(t,e,o,r)=>{for(var s=r>1?void 0:r?lt(e,o):e,n=t.length-1,i;n>=0;n--)(i=t[n])&&(s=(r?i(e,o,s):i(s))||s);return r&&s&&dt(e,o,s),s};let c=class extends u{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.helpOpen=!1,this.handleLoginEvent=t=>{const o=t.detail?.role;this.updateVisibility(),o==="instructor"&&(this.unlock(),this.refreshStudents())},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{await this.refreshStudents(),this.showPinReset=!0},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{await this.refreshStudents(),this.showScores=!0},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=q(k.SESSION);new j().clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const e=t.target;this.showStudentAnswers=e.checked,this.showStudentAnswers&&this.students.length===0&&await this.refreshStudents();const o=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(o,{bubbles:!0,composed:!0})),sessionStorage.setItem(D,String(this.showStudentAnswers))},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t=P();t&&(this.unlock(),this.refreshStudents());const e=sessionStorage.getItem(D);e!==null&&(this.showStudentAnswers=e==="true",this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){this.toggleAttribute("data-show",P())}setStudents(t){this.students=t}async refreshStudents(){const t=q(k.SESSION);if(t)try{const e=A();this.students=await e.getStudentsByRelease(t.release)}catch(e){console.error("Failed to load students:",e),this.students=[]}}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?a`
      <div class="instructor-panel">
        <div class="instructor-title">
          Instructor Mode
          <qd-help-trigger
            panelType="instructor"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
          <qd-build-info></qd-build-info>
        </div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show current answers
        </label>

        <button @click=${this.handleViewScores} class="primary compact">View All Scores</button>

        <button @click=${this.handleResetPins} class="secondary compact">Reset PINs</button>

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>

        <button @click=${this.handleLogout} class="logout">Logout</button>

        <qd-instructor-scores
          .students=${this.students}
          .showModal=${this.showScores}
          @close=${this.handleCloseScores}
        ></qd-instructor-scores>

        <qd-pin-reset-dialog
          .students=${this.students}
          .showModal=${this.showPinReset}
          @close=${this.handleClosePinReset}
          @qd:pin-reset=${this.handlePinReset}
        ></qd-pin-reset-dialog>

        <qd-help-popup
          .open=${this.helpOpen}
          .title=${O("instructor").title}
          .content=${O("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `:a`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};c.styles=[w,C`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `];g([d()],c.prototype,"unlocked",2);g([d()],c.prototype,"showScores",2);g([d()],c.prototype,"students",2);g([d()],c.prototype,"showStudentAnswers",2);g([d()],c.prototype,"showPinReset",2);g([d()],c.prototype,"helpOpen",2);c=g([f("qd-instructor")],c);
