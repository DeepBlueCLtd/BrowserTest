import{i as k,a as f,x as d,B as j,E as B}from"./lit-element-DR9D0stx.js";import{t as m,n as u}from"./property-BRFVFa-w.js";import{r as a}from"./state-7B7Yt9om.js";import{P as V,d as F,g as D,S as O,I as P}from"./storage-helpers-h0mJMTqi.js";import{s as U,c as L,r as _,a as T}from"./session-state-Cbzz7Lnd.js";import{S as H,g as A}from"./help-content-BQ47Ba-h.js";import{f as z,g as N,h as R}from"./dom-helpers-CAaP8i-_.js";import{R as Q,g as K}from"./instructor-auth-z7mVUIDs.js";import{c as W}from"./qd-scores-modal-BBid6wxL.js";import{g as G,r as Y}from"./migration-D6nbdGca.js";import{b as X,C as J}from"./dom-config-reader-DImSGrCl.js";import"./qd-modal-Co8ngVCc.js";import"./qd-confirm-dialog-CWA4vaaR.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";const S=k`
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

  /* #0062cc keeps white text above WCAG AA 4.5:1 (#007bff was 3.98:1; SRD 013 A11Y-04) */
  button.primary {
    background: #0062cc;
    color: white;
    border-color: #0062cc;
  }

  button.primary:hover {
    background: #004c9e;
    border-color: #004c9e;
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

  /*
   * Destructive actions sit apart from routine ones and stay quiet until used
   * (SRD 013 UX-08): an outline on the dark toolbar, filled only on hover.
   */
  .danger-zone {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-left: 12px;
    margin-left: 4px;
    border-left: 1px solid rgba(255, 255, 255, 0.35);
  }

  button.outline-danger {
    background: transparent;
    color: #ffcdd2;
    border-color: #e57373;
  }

  button.outline-danger:hover {
    background: #c62828;
    color: white;
    border-color: #c62828;
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
`;var Z=Object.defineProperty,ee=Object.getOwnPropertyDescriptor,E=(e,t,o,r)=>{for(var s=r>1?void 0:r?ee(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&Z(t,o,s),s};let x=class extends f{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new Q(V.MAX_ATTEMPTS-1),this.handlePasswordInput=e=>{const t=e.target;this.password=t.value,this.error=""},this.handleSubmit=async e=>{if(e.preventDefault(),!this.rateLimiter.attempt()){this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`;return}try{if(!K())throw new Error("Instructor password hash not configured");await U(this.password)?(this.rateLimiter.reset(),this.password="",this.error="",z(this,"qd:instructor-unlock",{})):(this.rateLimiter.recordFailure(),this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.remainingSeconds===0?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const e=this.remainingSeconds>0;return d`
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
              ?disabled=${e}
              autocomplete="current-password"
              required
            />
          </div>

          ${this.error?d`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${e||!this.password}>
            ${e?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};x.styles=S;E([a()],x.prototype,"password",2);E([a()],x.prototype,"error",2);E([a()],x.prototype,"remainingSeconds",2);x=E([m("qd-instructor-unlock")],x);var te=Object.defineProperty,se=Object.getOwnPropertyDescriptor,I=(e,t,o,r)=>{for(var s=r>1?void 0:r?se(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&te(t,o,s),s};let y=class extends f{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return d`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};y.styles=S;I([u({type:Array})],y.prototype,"students",2);I([u({type:Boolean})],y.prototype,"showModal",2);y=I([m("qd-instructor-scores")],y);var oe=Object.defineProperty,re=Object.getOwnPropertyDescriptor,M=(e,t,o,r)=>{for(var s=r>1?void 0:r?re(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&oe(t,o,s),s};let $=class extends f{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const e=this.generateCSV(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),o=URL.createObjectURL(t),r=document.createElement("a");r.href=o;const i=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);r.download=`quiz-data-${i}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(o)}}escapeCSVField(e){let t=String(e);return/^[=+\-@\t\r]/.test(t)&&(t=`'${t}`),t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t.replace(/"/g,'""')}"`:t}generateCSV(){const e=[];e.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp,Kind,Attempts,First Attempt Correct");for(const t of this.students){const o=[t.serviceId,t.name,t.release];for(const[r,s]of Object.entries(t.pages)){(s.answers||[]).forEach((l,C)=>{l&&e.push(this.csvRow([...o,r,C,l.answer,l.success,l.timestamp,"quiz",l.attempts??"",l.firstSuccess??""]))});const n=s.analysis;if(n)for(const[l,C]of Object.entries(n.cells))C.trim()!==""&&e.push(this.csvRow([...o,r,n.labels?.[l]??l,C,"",n.lastEdited??"","analysis","",""]))}}return e.join(`
`)}csvRow(e){return e.map(t=>this.escapeCSVField(t)).join(",")}render(){const e=this.students.length>0&&this.students.some(o=>o.attempted>0||Object.values(o.pages).some(r=>W(r.analysis)>0)),t=e?`Export ${this.students.length} student${this.students.length===1?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return d`
      <button
        @click=${this.handleExport}
        ?disabled=${!e}
        class="primary compact"
        title=${t}
      >
        Export CSV
      </button>
    `}};$.styles=S;M([u({type:Array})],$.prototype,"students",2);$=M([m("qd-instructor-export")],$);var ne=Object.defineProperty,ie=Object.getOwnPropertyDescriptor,g=(e,t,o,r)=>{for(var s=r>1?void 0:r?ie(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&ne(t,o,s),s};let c=class extends f{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.password="",this.checking=!1,this.error="",this.success="",this.modalContainer=null,this.handleKeydown=e=>{e.key==="Escape"&&this.showConfirmDialog&&this.handleCancelClear()},this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.password="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.password="",this.error=""},this.handleConfirmInput=e=>{const t=e.target;this.confirmText=t.value},this.handlePasswordInput=e=>{this.password=e.target.value,this.error=""},this.handleConfirmClear=async()=>{if(this.confirmText!=="DELETE ALL DATA"){this.error="Confirmation text does not match";return}this.checking=!0;const e=await L(this.password);if(this.checking=!1,!e.ok){this.error=_(e),this.password="";return}try{await N().clearAll(),F(),z(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.password="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody(),document.removeEventListener("keydown",this.handleKeydown)}updated(e){super.updated(e),e.has("showConfirmDialog")&&(this.showConfirmDialog?(this.renderModalToBody(),document.addEventListener("keydown",this.handleKeydown),this.modalContainer?.querySelector("input")?.focus()):(this.removeModalFromBody(),document.removeEventListener("keydown",this.handleKeydown))),this.showConfirmDialog&&(e.has("confirmText")||e.has("password")||e.has("checking")||e.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),j(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return d`
      <button
        @click=${this.handleClearRequest}
        class="danger outline-danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?d`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const e=this.confirmText==="DELETE ALL DATA"&&this.password.length>0&&!this.checking;return d`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${t=>{t.target===t.currentTarget&&this.handleCancelClear()}}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qd-erase-title"
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${t=>t.stopPropagation()}
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h2
              id="qd-erase-title"
              style="font-size: 18px; font-weight: 600; margin: 0; color: #000;"
            >
              Confirm Data Deletion
            </h2>
            <button
              aria-label="Close"
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

          <label for="qd-erase-confirm" style="display: block; margin: 12px 0 0; color: #333;">
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </label>

          <input
            id="qd-erase-confirm"
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 8px 0 16px; box-sizing: border-box;"
            autocomplete="off"
          />

          <label for="qd-erase-password" style="display: block; margin: 0; color: #333;">
            Instructor password:
          </label>

          <input
            id="qd-erase-password"
            type="password"
            .value=${this.password}
            @input=${this.handlePasswordInput}
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 8px 0 16px; box-sizing: border-box;"
            autocomplete="current-password"
          />

          ${this.error?d`<div role="alert" style="color: #dc3545; font-size: 14px; margin: 8px 0;">
                ${this.error}
              </div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button
              style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer; font-size: 14px;"
              @click=${this.handleCancelClear}
            >
              Cancel
            </button>
            <button
              style="padding: 8px 16px; border: none; border-radius: 4px; background: ${e?"#dc3545":"#ccc"}; color: white; cursor: ${e?"pointer":"not-allowed"}; font-size: 14px;"
              @click=${this.handleConfirmClear}
              ?disabled=${!e}
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};c.styles=S;g([a()],c.prototype,"showConfirmDialog",2);g([a()],c.prototype,"confirmText",2);g([a()],c.prototype,"password",2);g([a()],c.prototype,"checking",2);g([a()],c.prototype,"error",2);g([a()],c.prototype,"success",2);c=g([m("qd-instructor-manage")],c);async function ae(e){const t=X();if(!t)return{ok:!1,error:`Database name not configured. Add <span id="${J.dbName}">dbName</span> to page.`};try{const o=G(t);await o.init();const r=Y(e);await o.saveStudent(r);const s={eventId:crypto.randomUUID(),serviceId:e.serviceId,resetBy:"instructor",resetAt:new Date().toISOString(),release:e.release};return await o.saveAuditEvent(s),{ok:!0,updated:r}}catch(o){return console.error("PIN reset error:",o),{ok:!1,error:"Failed to reset PIN. Please try again."}}}var de=Object.defineProperty,le=Object.getOwnPropertyDescriptor,q=(e,t,o,r)=>{for(var s=r>1?void 0:r?le(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&de(t,o,s),s};let v=class extends f{constructor(){super(...arguments),this.students=[],this.actionLabel="Select",this.searchText="",this.handleSearchInput=e=>{this.searchText=e.target.value}}get filteredStudents(){const e=this.searchText.toLowerCase().trim();return e?this.students.filter(t=>t.name.toLowerCase().includes(e)||t.serviceId.toLowerCase().includes(e)):this.students}emitSelect(e){this.dispatchEvent(new CustomEvent("select",{detail:e,bubbles:!0,composed:!0}))}render(){const e=this.filteredStudents;return d`
      <input
        type="text"
        class="search-input"
        placeholder="Search by name or ID..."
        .value=${this.searchText}
        @input=${this.handleSearchInput}
      />
      <div class="student-table-container">
        ${e.length===0?d`<div class="empty-message">
              ${this.searchText?"No matching students":"No students found"}
            </div>`:d`<table class="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Service ID</th>
                  <th>${this.actionLabel}</th>
                </tr>
              </thead>
              <tbody>
                ${e.map(t=>d`<tr>
                      <td>${t.name}</td>
                      <td>${t.serviceId}</td>
                      <td>
                        <button class="action-btn" type="button" @click=${()=>this.emitSelect(t)}>
                          ${this.actionLabel}
                        </button>
                      </td>
                    </tr>`)}
              </tbody>
            </table>`}
      </div>
    `}};v.styles=k`
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
  `;q([u({type:Array})],v.prototype,"students",2);q([u({type:String})],v.prototype,"actionLabel",2);q([a()],v.prototype,"searchText",2);v=q([m("qd-student-table")],v);var ce=Object.defineProperty,he=Object.getOwnPropertyDescriptor,b=(e,t,o,r)=>{for(var s=r>1?void 0:r?he(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&ce(t,o,s),s};let h=class extends f{constructor(){super(...arguments),this.students=[],this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleResetClick=e=>{this.confirmingStudent=e,this.confirmDialogOpen=!0},this.handleConfirmReset=e=>{const t=this.confirmingStudent;t&&this.verifyThenReset(t,e.detail?.password??"")},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(e){this.open=e}get showModal(){return this.open}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage=""}show(){this.open=!0}async verifyThenReset(e,t){const o=await L(t);if(!o.ok){this.confirmDialogOpen=!1,this.confirmingStudent=null,this.errorMessage=`${_(o)}. The PIN was not reset.`;return}await this.executeReset(e)}async executeReset(e){const t=await ae(e);if(this.confirmDialogOpen=!1,this.confirmingStudent=null,!t.ok){this.errorMessage=t.error??"Failed to reset PIN. Please try again.";return}if(t.updated){const o=this.students.findIndex(r=>r.serviceId===e.serviceId);o>=0&&(this.students[o]=t.updated,this.students=[...this.students])}this.errorMessage="",this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:e.serviceId,resetBy:"instructor",timestamp:new Date().toISOString()},bubbles:!0,composed:!0}))}render(){const e=this.confirmingStudent,t=e?`Reset PIN for <strong>${R(e.name)}</strong> (${R(e.serviceId)})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return d`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open?d`
              <div class="pin-reset-content">
                <qd-student-table
                  .students=${this.students}
                  actionLabel="Reset"
                  @select=${o=>this.handleResetClick(o.detail)}
                ></qd-student-table>

                ${this.errorMessage?d`<div
                      class="error-message"
                      role="alert"
                      style="color: #d32f2f; font-size: 12px; margin-top: 8px; padding: 8px; background: #ffebee; border-radius: 4px;"
                    >
                      ${this.errorMessage}
                    </div>`:""}
              </div>
            `:B}
      </qd-modal>

      <qd-confirm-dialog
        .open=${this.confirmDialogOpen}
        title="Reset PIN"
        .message=${t}
        confirmText="Reset PIN"
        cancelText="Cancel"
        destructive
        requirePassword
        @qd:confirm=${this.handleConfirmReset}
        @qd:cancel=${this.handleCancelReset}
      ></qd-confirm-dialog>
    `}};h.styles=k`
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
  `;b([u({type:Array})],h.prototype,"students",2);b([u({type:Boolean,reflect:!0})],h.prototype,"open",2);b([a()],h.prototype,"confirmingStudent",2);b([a()],h.prototype,"confirmDialogOpen",2);b([a()],h.prototype,"errorMessage",2);b([u({type:Boolean})],h.prototype,"showModal",1);h=b([m("qd-pin-reset-dialog")],h);var pe=Object.defineProperty,ue=Object.getOwnPropertyDescriptor,w=(e,t,o,r)=>{for(var s=r>1?void 0:r?ue(t,o):t,i=e.length-1,n;i>=0;i--)(n=e[i])&&(s=(r?n(t,o,s):n(s))||s);return r&&s&&pe(t,o,s),s};let p=class extends f{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.helpOpen=!1,this.handleLoginEvent=e=>{const o=e.detail?.role;this.updateVisibility(),o==="instructor"&&(this.unlock(),this.refreshStudents())},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{await this.refreshStudents(),this.showPinReset=!0},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{await this.refreshStudents(),this.showScores=!0},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const e=D(O.SESSION);new H().clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async e=>{const t=e.target;this.showStudentAnswers=t.checked,this.showStudentAnswers&&this.students.length===0&&await this.refreshStudents();const o=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(o,{bubbles:!0,composed:!0})),sessionStorage.setItem(P,String(this.showStudentAnswers))},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const e=T();e&&(this.unlock(),this.refreshStudents());const t=sessionStorage.getItem(P);t!==null&&(this.showStudentAnswers=t==="true",this.showStudentAnswers&&e&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){this.toggleAttribute("data-show",T())}setStudents(e){this.students=e}async refreshStudents(){const e=D(O.SESSION);if(e)try{const t=N();this.students=await t.getStudentsByRelease(e.release)}catch(t){console.error("Failed to load students:",t),this.students=[]}}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?d`
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

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <span class="danger-zone" role="group" aria-label="Actions that change student data">
          <button @click=${this.handleResetPins} class="outline-danger compact">Reset PINs</button>
          <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>
        </span>

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
          .title=${A("instructor").title}
          .content=${A("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `:d`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};p.styles=[S,k`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `];w([a()],p.prototype,"unlocked",2);w([a()],p.prototype,"showScores",2);w([a()],p.prototype,"students",2);w([a()],p.prototype,"showStudentAnswers",2);w([a()],p.prototype,"showPinReset",2);w([a()],p.prototype,"helpOpen",2);p=w([m("qd-instructor")],p);
