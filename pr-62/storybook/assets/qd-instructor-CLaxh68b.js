const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./storage-service-CiD2Vlrz.js","./storage-helpers-B4dxqHb-.js","./session-BY0Y0_gx.js"])))=>i.map(i=>d[i]);
import{_ as D}from"./iframe-C6LQZhLY.js";import{i as q,a as w,x as c}from"./lit-element-CSmQN0ht.js";import{t as v,n as L}from"./property-Cqq8i_uy.js";import{r as d}from"./state-BjYqokDn.js";import{e as I,c as P,g as A,S as b}from"./storage-helpers-B4dxqHb-.js";import{S as z}from"./session-BY0Y0_gx.js";import{d as O}from"./event-helpers-DOv9sfVv.js";const y=q`
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
`;class R{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return this.lockoutUntil&&Date.now()<this.lockoutUntil?!1:(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],s=Math.min(this.failureCount-1,t.length-1),n=t[s]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return this.lockoutUntil!==null&&Date.now()<this.lockoutUntil}}async function U(e,t){if(e.length!==t.length)return!1;if(e.length===0)return!0;const s=new TextEncoder,n=s.encode(e),o=s.encode(t);try{const r=await crypto.subtle.importKey("raw",n,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),i=await crypto.subtle.sign("HMAC",r,o),a=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),l=await crypto.subtle.sign("HMAC",a,n);if(i.byteLength!==l.byteLength)return!1;const h=new Uint8Array(i),g=new Uint8Array(l);let E=0;for(let p=0;p<h.length;p++)E|=(h[p]??0)^(g[p]??0);return E===0}catch(r){return console.error("Constant-time comparison failed:",r),!1}}const _="instructor.password.hash";function V(){const e=document.getElementById(_);if(!e){const s=`Instructor password hash not found. Expected element with id="${_}". Check Oxygen XSL transform configuration.`;throw I(s),new Error(s)}const t=e.textContent?.trim();if(!t){const s="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw I(s),new Error(s)}if(!/^[a-f0-9]{64}$/i.test(t)){const s=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${t.substring(0,20)}...`;throw I(s),new Error(s)}return t.toLowerCase()}var j=Object.defineProperty,H=Object.getOwnPropertyDescriptor,$=(e,t,s,n)=>{for(var o=n>1?void 0:n?H(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&j(t,s,o),o};let f=class extends w{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new R,this.handlePasswordInput=e=>{const t=e.target;this.password=t.value,this.error=""},this.handleSubmit=async e=>{if(e.preventDefault(),!this.rateLimiter.attempt()){this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`;return}try{const s=V(),o=new TextEncoder().encode(this.password),r=await crypto.subtle.digest("SHA-256",o),a=Array.from(new Uint8Array(r)).map(h=>h.toString(16).padStart(2,"0")).join("");await U(a,s)?(this.rateLimiter.reset(),this.password="",this.error="",O(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.remainingSeconds===0?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const e=this.remainingSeconds>0;return c`
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

          ${this.error?c`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${e||!this.password}>
            ${e?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};f.styles=y;$([d()],f.prototype,"password",2);$([d()],f.prototype,"error",2);$([d()],f.prototype,"remainingSeconds",2);f=$([v("qd-instructor-unlock")],f);var B=Object.defineProperty,F=Object.getOwnPropertyDescriptor,T=(e,t,s,n)=>{for(var o=n>1?void 0:n?F(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&B(t,s,o),o};let x=class extends w{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.expandedStudents=new Set,this.modalElement=null,this.handleEscape=e=>{e.key==="Escape"&&this.showModal&&this.handleClose()},this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(e){e.has("showModal")&&(this.showModal?(this.expandedStudents.clear(),this.students.forEach(t=>{this.expandedStudents.add(t.serviceId)}),this.renderModalToBody()):this.removeModalFromBody())}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}renderModalToBody(){this.removeModalFromBody();const e=document.createElement("div");e.className="qd-scores-modal-overlay",e.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: auto;
    `,e.onclick=a=>{a.target===e&&this.handleClose()};const t=document.createElement("div");t.className="qd-scores-modal",t.style.cssText=`
      background: white;
      color: #333;
      border-radius: 8px;
      padding: 24px;
      max-width: 800px;
      max-height: 80vh;
      overflow: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      position: relative;
      z-index: 100000;
    `,t.onclick=a=>a.stopPropagation();const s=document.createElement("div");s.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;const n=document.createElement("h2");n.textContent="Student Scores",n.style.cssText="font-size: 18px; font-weight: 600; color: #000; margin: 0;";const o=document.createElement("button");o.textContent="✕",o.type="button",o.style.cssText=`
      background: none;
      border: none;
      font-size: 20px;
      color: #666;
      cursor: pointer;
      padding: 4px 8px;
      pointer-events: auto;
    `,o.onclick=()=>this.handleClose(),s.appendChild(n),s.appendChild(o);const r=document.createElement("div"),i=[...this.students].sort((a,l)=>a.name.localeCompare(l.name));if(i.length===0)r.innerHTML='<p style="color: #333;">No student data available.</p>';else{const a=this.createScoresTable(i);r.appendChild(a)}t.appendChild(s),t.appendChild(r),e.appendChild(t),document.body.appendChild(e),this.modalElement=e}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}toggleStudent(e){this.expandedStudents.has(e)?this.expandedStudents.delete(e):this.expandedStudents.add(e),this.showModal&&this.renderModalToBody()}createScoresTable(e){const t=document.createElement("table");t.style.cssText=`
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    `;const s=document.createElement("thead");s.innerHTML=`
      <tr>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Student</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Service ID</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Attempted</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Correct</th>
        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Percentage</th>
      </tr>
    `,t.appendChild(s);const n=document.createElement("tbody");return e.forEach(o=>{const r=this.calculateSummary(o),i=this.expandedStudents.has(o.serviceId),a=document.createElement("tr");if(a.style.cssText="cursor: pointer; color: #333;",a.innerHTML=`
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">
          <span style="display: inline-block; width: 16px; margin-right: 4px;">${i?"▼":"▶"}</span>
          ${r.name}
        </td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${r.serviceId}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${r.attempted}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${r.correct===r.attempted?"color: #28a745;":""}">${r.correct}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${r.percentage===100?"color: #28a745;":r.percentage===0?"color: #dc3545;":""}">${r.percentage}%</td>
      `,a.onclick=()=>this.toggleStudent(o.serviceId),n.appendChild(a),i){const l=this.createExpandedRow(o);n.appendChild(l)}}),t.appendChild(n),t}createExpandedRow(e){const t=document.createElement("tr");t.style.backgroundColor="#f9f9f9";const s=document.createElement("td");s.colSpan=5,s.style.cssText="padding: 8px 8px 8px 40px; border-bottom: 1px solid #ddd;";const n=Object.entries(e.pages);if(n.length===0)s.innerHTML='<em style="color: #666;">No quiz pages attempted</em>';else{const o=document.createElement("div");o.style.cssText="display: flex; flex-direction: column; gap: 6px;",n.forEach(([r,i])=>{const a=document.createElement("div");a.style.cssText="display: flex; align-items: center; gap: 12px;";const l=document.createElement("span");l.style.cssText="font-weight: 600; color: #000; min-width: 120px; flex-shrink: 0;",l.textContent=r,a.appendChild(l);const h=document.createElement("div");h.style.cssText="display: flex; flex-wrap: wrap; gap: 4px; flex: 1;",i.answers.forEach((g,E)=>{const p=document.createElement("span");p.style.cssText=`
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            ${g===null?"background: #e0e0e0; color: #666;":g.success?"background: #d4edda; color: #155724; border: 1px solid #c3e6cb;":"background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"}
          `,p.textContent=`Q${E+1}: ${g?g.answer:"—"}`,h.appendChild(p)}),a.appendChild(h),o.appendChild(a)}),s.appendChild(o)}return t.appendChild(s),t}render(){return c``}};x.styles=y;T([L({type:Array})],x.prototype,"students",2);T([L({type:Boolean})],x.prototype,"showModal",2);T([d()],x.prototype,"expandedStudents",2);x=T([v("qd-instructor-scores")],x);var N=Object.defineProperty,Q=Object.getOwnPropertyDescriptor,M=(e,t,s,n)=>{for(var o=n>1?void 0:n?Q(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&N(t,s,o),o};let k=class extends w{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const e=this.generateCSV(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(t),n=document.createElement("a");n.href=s;const r=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);n.download=`quiz-data-${r}.csv`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(s)}}escapeCSVField(e){const t=String(e);return t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t.replace(/"/g,'""')}"`:t}generateCSV(){const e=[];e.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const t of this.students)for(const[s,n]of Object.entries(t.pages))(n.answers||[]).forEach((r,i)=>{r&&e.push([this.escapeCSVField(t.serviceId),this.escapeCSVField(t.name),this.escapeCSVField(t.release),this.escapeCSVField(s),this.escapeCSVField(i),this.escapeCSVField(r.answer),this.escapeCSVField(r.success),this.escapeCSVField(r.timestamp)].join(","))});return e.join(`
`)}render(){const e=this.students.length>0&&this.students.some(s=>s.attempted>0),t=e?`Export ${this.students.length} student${this.students.length===1?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return c`
      <button
        @click=${this.handleExport}
        ?disabled=${!e}
        class="primary compact"
        title=${t}
      >
        Export CSV
      </button>
    `}};k.styles=y;M([L({type:Array})],k.prototype,"students",2);k=M([v("qd-instructor-export")],k);var K=Object.defineProperty,W=Object.getOwnPropertyDescriptor,S=(e,t,s,n)=>{for(var o=n>1?void 0:n?W(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&K(t,s,o),o};let u=class extends w{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=e=>{const t=e.target;this.confirmText=t.value},this.handleConfirmClear=()=>{if(this.confirmText!=="DELETE ALL DATA"){this.error="Confirmation text does not match";return}try{P(),O(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}}}render(){return c`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.showConfirmDialog?this.renderConfirmDialog():""}
      ${this.success?c`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const e=this.confirmText==="DELETE ALL DATA";return c`
      <div class="modal-overlay" @click=${this.handleCancelClear}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Confirm Data Deletion</h2>
            <button class="close-button" @click=${this.handleCancelClear}>✕</button>
          </div>

          <p style="color: #dc3545; font-weight: 600;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p>This action cannot be undone. All students will need to start over.</p>

          <p>Type <strong>DELETE ALL DATA</strong> to confirm:</p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; margin: 16px 0;"
            autocomplete="off"
          />

          ${this.error?c`<div class="error">${this.error}</div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button @click=${this.handleCancelClear}>Cancel</button>
            <button @click=${this.handleConfirmClear} class="danger" ?disabled=${!e}>
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};u.styles=y;S([d()],u.prototype,"showConfirmDialog",2);S([d()],u.prototype,"confirmText",2);S([d()],u.prototype,"error",2);S([d()],u.prototype,"success",2);u=S([v("qd-instructor-manage")],u);var G=Object.defineProperty,J=Object.getOwnPropertyDescriptor,C=(e,t,s,n)=>{for(var o=n>1?void 0:n?J(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&G(t,s,o),o};let m=class extends w{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.handleLoginEvent=e=>{const s=e.detail?.role;this.updateVisibility(),s==="instructor"&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const e=A(b.SESSION);if(e){try{const{getStorageService:t}=await D(async()=>{const{getStorageService:o}=await import("./storage-service-CiD2Vlrz.js");return{getStorageService:o}},__vite__mapDeps([0,1,2]),import.meta.url),n=await t().getStudentsByRelease(e.release);this.students=n}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const e=A(b.SESSION);new z().clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async e=>{const t=e.target;if(this.showStudentAnswers=t.checked,this.showStudentAnswers&&this.students.length===0){const n=A(b.SESSION);if(n)try{const{getStorageService:o}=await D(async()=>{const{getStorageService:a}=await import("./storage-service-CiD2Vlrz.js");return{getStorageService:a}},__vite__mapDeps([0,1,2]),import.meta.url),i=await o().getStudentsByRelease(n.release);this.students=i}catch(o){console.error("Failed to load students for toggle:",o)}}const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const e=sessionStorage.getItem(b.INSTRUCTOR)==="true";e&&this.unlock();const t=sessionStorage.getItem("qd/instructor/showAnswers");t!==null&&(this.showStudentAnswers=t==="true",this.showStudentAnswers&&e&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){sessionStorage.getItem(b.INSTRUCTOR)==="true"?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(e){this.students=e}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1}render(){return this.unlocked?c`
      <div class="instructor-panel">
        <div class="instructor-title">Instructor Mode</div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show student answers on page
        </label>

        <button @click=${this.handleViewScores} class="primary compact">View All Scores</button>

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>

        <button @click=${this.handleLogout} class="logout">Logout</button>

        <qd-instructor-scores
          .students=${this.students}
          .showModal=${this.showScores}
          @close=${this.handleCloseScores}
        ></qd-instructor-scores>
      </div>
    `:c`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};m.styles=[y,q`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `];C([d()],m.prototype,"unlocked",2);C([d()],m.prototype,"showScores",2);C([d()],m.prototype,"students",2);C([d()],m.prototype,"showStudentAnswers",2);m=C([v("qd-instructor")],m);
