const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./storage-service-Dg7mdGHN.js","./storage-helpers-B4dxqHb-.js","./session-BjIMOy9d.js"])))=>i.map(i=>d[i]);
import{_ as L}from"./iframe-DZE_3Qql.js";import{i as q,a as w,x as c,B as z}from"./lit-element-CSmQN0ht.js";import{t as y,n as D}from"./property-Cqq8i_uy.js";import{r as d}from"./state-BjYqokDn.js";import{e as I,c as P,g as A,S as b}from"./storage-helpers-B4dxqHb-.js";import{S as R}from"./session-BjIMOy9d.js";import{d as O}from"./event-helpers-DOv9sfVv.js";const v=q`
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
`;class U{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return this.lockoutUntil&&Date.now()<this.lockoutUntil?!1:(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const e=[2e3,4e3,8e3,16e3,3e4],s=Math.min(this.failureCount-1,e.length-1),n=e[s]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const e=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(e/1e3)}isLockedOut(){return this.lockoutUntil!==null&&Date.now()<this.lockoutUntil}}async function V(t,e){if(t.length!==e.length)return!1;if(t.length===0)return!0;const s=new TextEncoder,n=s.encode(t),o=s.encode(e);try{const r=await crypto.subtle.importKey("raw",n,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),i=await crypto.subtle.sign("HMAC",r,o),a=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),l=await crypto.subtle.sign("HMAC",a,n);if(i.byteLength!==l.byteLength)return!1;const p=new Uint8Array(i),g=new Uint8Array(l);let E=0;for(let h=0;h<p.length;h++)E|=(p[h]??0)^(g[h]??0);return E===0}catch(r){return console.error("Constant-time comparison failed:",r),!1}}const _="instructor.password.hash";function j(){const t=document.getElementById(_);if(!t){const s=`Instructor password hash not found. Expected element with id="${_}". Check Oxygen XSL transform configuration.`;throw I(s),new Error(s)}const e=t.textContent?.trim();if(!e){const s="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw I(s),new Error(s)}if(!/^[a-f0-9]{64}$/i.test(e)){const s=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${e.substring(0,20)}...`;throw I(s),new Error(s)}return e.toLowerCase()}var B=Object.defineProperty,F=Object.getOwnPropertyDescriptor,$=(t,e,s,n)=>{for(var o=n>1?void 0:n?F(e,s):e,r=t.length-1,i;r>=0;r--)(i=t[r])&&(o=(n?i(e,s,o):i(o))||o);return n&&o&&B(e,s,o),o};let f=class extends w{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new U,this.handlePasswordInput=t=>{const e=t.target;this.password=e.value,this.error=""},this.handleSubmit=async t=>{if(t.preventDefault(),!this.rateLimiter.attempt()){this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`;return}try{const s=j(),o=new TextEncoder().encode(this.password),r=await crypto.subtle.digest("SHA-256",o),a=Array.from(new Uint8Array(r)).map(p=>p.toString(16).padStart(2,"0")).join("");await V(a,s)?(this.rateLimiter.reset(),this.password="",this.error="",O(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.remainingSeconds===0?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return c`
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

          ${this.error?c`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};f.styles=v;$([d()],f.prototype,"password",2);$([d()],f.prototype,"error",2);$([d()],f.prototype,"remainingSeconds",2);f=$([y("qd-instructor-unlock")],f);var H=Object.defineProperty,N=Object.getOwnPropertyDescriptor,T=(t,e,s,n)=>{for(var o=n>1?void 0:n?N(e,s):e,r=t.length-1,i;r>=0;r--)(i=t[r])&&(o=(n?i(e,s,o):i(o))||o);return n&&o&&H(e,s,o),o};let x=class extends w{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.expandedStudents=new Set,this.modalElement=null,this.handleEscape=t=>{t.key==="Escape"&&this.showModal&&this.handleClose()},this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(t){t.has("showModal")&&(this.showModal?(this.expandedStudents.clear(),this.students.forEach(e=>{this.expandedStudents.add(e.serviceId)}),this.renderModalToBody()):this.removeModalFromBody())}calculateSummary(t){const e=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:e}}renderModalToBody(){this.removeModalFromBody();const t=document.createElement("div");t.className="qd-scores-modal-overlay",t.style.cssText=`
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
    `,t.onclick=a=>{a.target===t&&this.handleClose()};const e=document.createElement("div");e.className="qd-scores-modal",e.style.cssText=`
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
    `,e.onclick=a=>a.stopPropagation();const s=document.createElement("div");s.style.cssText=`
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
    `,o.onclick=()=>this.handleClose(),s.appendChild(n),s.appendChild(o);const r=document.createElement("div"),i=[...this.students].sort((a,l)=>a.name.localeCompare(l.name));if(i.length===0)r.innerHTML='<p style="color: #333;">No student data available.</p>';else{const a=this.createScoresTable(i);r.appendChild(a)}e.appendChild(s),e.appendChild(r),t.appendChild(e),document.body.appendChild(t),this.modalElement=t}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}toggleStudent(t){this.expandedStudents.has(t)?this.expandedStudents.delete(t):this.expandedStudents.add(t),this.showModal&&this.renderModalToBody()}createScoresTable(t){const e=document.createElement("table");e.style.cssText=`
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
    `,e.appendChild(s);const n=document.createElement("tbody");return t.forEach(o=>{const r=this.calculateSummary(o),i=this.expandedStudents.has(o.serviceId),a=document.createElement("tr");if(a.style.cssText="cursor: pointer; color: #333;",a.innerHTML=`
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">
          <span style="display: inline-block; width: 16px; margin-right: 4px;">${i?"▼":"▶"}</span>
          ${r.name}
        </td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${r.serviceId}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${r.attempted}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${r.correct===r.attempted?"color: #28a745;":""}">${r.correct}</td>
        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${r.percentage===100?"color: #28a745;":r.percentage===0?"color: #dc3545;":""}">${r.percentage}%</td>
      `,a.onclick=()=>this.toggleStudent(o.serviceId),n.appendChild(a),i){const l=this.createExpandedRow(o);n.appendChild(l)}}),e.appendChild(n),e}createExpandedRow(t){const e=document.createElement("tr");e.style.backgroundColor="#f9f9f9";const s=document.createElement("td");s.colSpan=5,s.style.cssText="padding: 8px 8px 8px 40px; border-bottom: 1px solid #ddd;";const n=Object.entries(t.pages);if(n.length===0)s.innerHTML='<em style="color: #666;">No quiz pages attempted</em>';else{const o=document.createElement("div");o.style.cssText="display: flex; flex-direction: column; gap: 6px;",n.forEach(([r,i])=>{const a=document.createElement("div");a.style.cssText="display: flex; align-items: center; gap: 12px;";const l=document.createElement("span");l.style.cssText="font-weight: 600; color: #000; min-width: 120px; flex-shrink: 0;",l.textContent=r,a.appendChild(l);const p=document.createElement("div");p.style.cssText="display: flex; flex-wrap: wrap; gap: 4px; flex: 1;",i.answers.forEach((g,E)=>{const h=document.createElement("span");h.style.cssText=`
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            ${g===null?"background: #e0e0e0; color: #666;":g.success?"background: #d4edda; color: #155724; border: 1px solid #c3e6cb;":"background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"}
          `,h.textContent=`Q${E+1}: ${g?g.answer:"—"}`,p.appendChild(h)}),a.appendChild(p),o.appendChild(a)}),s.appendChild(o)}return e.appendChild(s),e}render(){return c``}};x.styles=v;T([D({type:Array})],x.prototype,"students",2);T([D({type:Boolean})],x.prototype,"showModal",2);T([d()],x.prototype,"expandedStudents",2);x=T([y("qd-instructor-scores")],x);var Q=Object.defineProperty,K=Object.getOwnPropertyDescriptor,M=(t,e,s,n)=>{for(var o=n>1?void 0:n?K(e,s):e,r=t.length-1,i;r>=0;r--)(i=t[r])&&(o=(n?i(e,s,o):i(o))||o);return n&&o&&Q(e,s,o),o};let k=class extends w{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),e=new Blob([t],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(e),n=document.createElement("a");n.href=s;const r=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);n.download=`quiz-data-${r}.csv`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(s)}}escapeCSVField(t){const e=String(t);return e.includes(",")||e.includes('"')||e.includes(`
`)?`"${e.replace(/"/g,'""')}"`:e}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const e of this.students)for(const[s,n]of Object.entries(e.pages))(n.answers||[]).forEach((r,i)=>{r&&t.push([this.escapeCSVField(e.serviceId),this.escapeCSVField(e.name),this.escapeCSVField(e.release),this.escapeCSVField(s),this.escapeCSVField(i),this.escapeCSVField(r.answer),this.escapeCSVField(r.success),this.escapeCSVField(r.timestamp)].join(","))});return t.join(`
`)}render(){const t=this.students.length>0&&this.students.some(s=>s.attempted>0),e=t?`Export ${this.students.length} student${this.students.length===1?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return c`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${e}
      >
        Export CSV
      </button>
    `}};k.styles=v;M([D({type:Array})],k.prototype,"students",2);k=M([y("qd-instructor-export")],k);var W=Object.defineProperty,G=Object.getOwnPropertyDescriptor,S=(t,e,s,n)=>{for(var o=n>1?void 0:n?G(e,s):e,r=t.length-1,i;r>=0;r--)(i=t[r])&&(o=(n?i(e,s,o):i(o))||o);return n&&o&&W(e,s,o),o};let u=class extends w{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const e=t.target;this.confirmText=e.value},this.handleConfirmClear=()=>{if(this.confirmText!=="DELETE ALL DATA"){this.error="Confirmation text does not match";return}try{P(),O(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),z(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return c`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?c`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t=this.confirmText==="DELETE ALL DATA";return c`
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

          ${this.error?c`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};u.styles=v;S([d()],u.prototype,"showConfirmDialog",2);S([d()],u.prototype,"confirmText",2);S([d()],u.prototype,"error",2);S([d()],u.prototype,"success",2);u=S([y("qd-instructor-manage")],u);var J=Object.defineProperty,X=Object.getOwnPropertyDescriptor,C=(t,e,s,n)=>{for(var o=n>1?void 0:n?X(e,s):e,r=t.length-1,i;r>=0;r--)(i=t[r])&&(o=(n?i(e,s,o):i(o))||o);return n&&o&&J(e,s,o),o};let m=class extends w{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.handleLoginEvent=t=>{const s=t.detail?.role;this.updateVisibility(),s==="instructor"&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const t=A(b.SESSION);if(t){try{const{getStorageService:e}=await L(async()=>{const{getStorageService:o}=await import("./storage-service-Dg7mdGHN.js");return{getStorageService:o}},__vite__mapDeps([0,1,2]),import.meta.url),n=await e().getStudentsByRelease(t.release);this.students=n}catch(e){console.error("Failed to load students:",e),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=A(b.SESSION);new R().clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const e=t.target;if(this.showStudentAnswers=e.checked,this.showStudentAnswers&&this.students.length===0){const n=A(b.SESSION);if(n)try{const{getStorageService:o}=await L(async()=>{const{getStorageService:a}=await import("./storage-service-Dg7mdGHN.js");return{getStorageService:a}},__vite__mapDeps([0,1,2]),import.meta.url),i=await o().getStudentsByRelease(n.release);this.students=i}catch(o){console.error("Failed to load students for toggle:",o)}}const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t=sessionStorage.getItem(b.INSTRUCTOR)==="true";t&&this.unlock();const e=sessionStorage.getItem("qd/instructor/showAnswers");e!==null&&(this.showStudentAnswers=e==="true",this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){sessionStorage.getItem(b.INSTRUCTOR)==="true"?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(t){this.students=t}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1}render(){return this.unlocked?c`
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
      `}};m.styles=[v,q`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `];C([d()],m.prototype,"unlocked",2);C([d()],m.prototype,"showScores",2);C([d()],m.prototype,"students",2);C([d()],m.prototype,"showStudentAnswers",2);m=C([y("qd-instructor")],m);
