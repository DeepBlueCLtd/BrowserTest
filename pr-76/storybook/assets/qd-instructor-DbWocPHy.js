const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./storage-service-DCabG_JC.js","./indexeddb-CRFeaCTM.js","./storage-helpers-BNoxrCtd.js","./session-Bx2jS3Yd.js"])))=>i.map(i=>d[i]);
import{_ as P}from"./iframe-DyU3bkDf.js";import{i as q,a as v,x as u,B}from"./lit-element-CSmQN0ht.js";import{t as C,n as E}from"./property-Cqq8i_uy.js";import{r as p}from"./state-BjYqokDn.js";import{e as _,c as j,g as $,S as b}from"./storage-helpers-BNoxrCtd.js";import{S as F}from"./session-Bx2jS3Yd.js";import{d as O}from"./event-helpers-DOv9sfVv.js";import"./qd-build-info-Gl919pTb.js";import{g as U}from"./indexeddb-CRFeaCTM.js";import{C as M,r as V}from"./dom-config-reader-ByJzI-qV.js";const k=q`
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
`;class H{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return this.lockoutUntil&&Date.now()<this.lockoutUntil?!1:(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],s=Math.min(this.failureCount-1,t.length-1),n=t[s]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return this.lockoutUntil!==null&&Date.now()<this.lockoutUntil}}async function Q(e,t){if(e.length!==t.length)return!1;if(e.length===0)return!0;const s=new TextEncoder,n=s.encode(e),o=s.encode(t);try{const r=await crypto.subtle.importKey("raw",n,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),i=await crypto.subtle.sign("HMAC",r,o),a=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),d=await crypto.subtle.sign("HMAC",a,n);if(i.byteLength!==d.byteLength)return!1;const c=new Uint8Array(i),l=new Uint8Array(d);let m=0;for(let h=0;h<c.length;h++)m|=(c[h]??0)^(l[h]??0);return m===0}catch(r){return console.error("Constant-time comparison failed:",r),!1}}const z="instructor.password.hash";function K(){const e=document.getElementById(z);if(!e){const s=`Instructor password hash not found. Expected element with id="${z}". Check Oxygen XSL transform configuration.`;throw _(s),new Error(s)}const t=e.textContent?.trim();if(!t){const s="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw _(s),new Error(s)}if(!/^[a-f0-9]{64}$/i.test(t)){const s=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${t.substring(0,20)}...`;throw _(s),new Error(s)}return t.toLowerCase()}var G=Object.defineProperty,W=Object.getOwnPropertyDescriptor,L=(e,t,s,n)=>{for(var o=n>1?void 0:n?W(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&G(t,s,o),o};let y=class extends v{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new H,this.handlePasswordInput=e=>{const t=e.target;this.password=t.value,this.error=""},this.handleSubmit=async e=>{if(e.preventDefault(),!this.rateLimiter.attempt()){this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`;return}try{const s=K(),o=new TextEncoder().encode(this.password),r=await crypto.subtle.digest("SHA-256",o),a=Array.from(new Uint8Array(r)).map(c=>c.toString(16).padStart(2,"0")).join("");await Q(a,s)?(this.rateLimiter.reset(),this.password="",this.error="",O(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.remainingSeconds===0?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const e=this.remainingSeconds>0;return u`
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

          ${this.error?u`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${e||!this.password}>
            ${e?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};y.styles=k;L([p()],y.prototype,"password",2);L([p()],y.prototype,"error",2);L([p()],y.prototype,"remainingSeconds",2);y=L([C("qd-instructor-unlock")],y);var J=Object.defineProperty,X=Object.getOwnPropertyDescriptor,A=(e,t,s,n)=>{for(var o=n>1?void 0:n?X(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&J(t,s,o),o};let w=class extends v{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.expandedStudents=new Set,this.modalElement=null,this.handleEscape=e=>{e.key==="Escape"&&this.showModal&&this.handleClose()},this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(e){e.has("showModal")&&(this.showModal?(this.expandedStudents.clear(),this.students.forEach(t=>{this.expandedStudents.add(t.serviceId)}),this.renderModalToBody()):this.removeModalFromBody())}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}renderModalToBody(){this.removeModalFromBody();const e=document.createElement("div");e.className="qd-scores-modal-overlay",e.style.cssText=`
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
    `,o.onclick=()=>this.handleClose(),s.appendChild(n),s.appendChild(o);const r=document.createElement("div"),i=[...this.students].sort((a,d)=>a.name.localeCompare(d.name));if(i.length===0)r.innerHTML='<p style="color: #333;">No student data available.</p>';else{const a=this.createScoresTable(i);r.appendChild(a)}t.appendChild(s),t.appendChild(r),e.appendChild(t),document.body.appendChild(e),this.modalElement=e}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}toggleStudent(e){this.expandedStudents.has(e)?this.expandedStudents.delete(e):this.expandedStudents.add(e),this.showModal&&this.renderModalToBody()}createScoresTable(e){const t=document.createElement("table");t.style.cssText=`
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
    `,t.appendChild(s);const n=document.createElement("tbody");return e.forEach(o=>{const r=this.calculateSummary(o),i=this.expandedStudents.has(o.serviceId),a=document.createElement("tr");a.style.cssText="cursor: pointer; color: #333;";const d=document.createElement("td");d.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;",d.innerHTML=`<span style="display: inline-block; width: 16px; margin-right: 4px;">${i?"▼":"▶"}</span>${r.name}`,d.onclick=()=>this.toggleStudent(o.serviceId),a.appendChild(d);const c=document.createElement("td");c.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;",c.textContent=r.serviceId,c.onclick=()=>this.toggleStudent(o.serviceId),a.appendChild(c);const l=document.createElement("td");l.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;",l.textContent=String(r.attempted),l.onclick=()=>this.toggleStudent(o.serviceId),a.appendChild(l);const m=document.createElement("td");m.style.cssText=`padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${r.correct===r.attempted?"color: #28a745;":""}`,m.textContent=String(r.correct),m.onclick=()=>this.toggleStudent(o.serviceId),a.appendChild(m);const h=document.createElement("td");if(h.style.cssText=`padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${r.percentage===100?"color: #28a745;":r.percentage===0?"color: #dc3545;":""}`,h.textContent=`${r.percentage}%`,h.onclick=()=>this.toggleStudent(o.serviceId),a.appendChild(h),n.appendChild(a),i){const N=this.createExpandedRow(o);n.appendChild(N)}}),t.appendChild(n),t}createExpandedRow(e){const t=document.createElement("tr");t.style.backgroundColor="#f9f9f9";const s=document.createElement("td");s.colSpan=5,s.style.cssText="padding: 8px 8px 8px 40px; border-bottom: 1px solid #ddd;";const n=Object.entries(e.pages);if(n.length===0)s.innerHTML='<em style="color: #666;">No quiz pages attempted</em>';else{const o=document.createElement("div");o.style.cssText="display: flex; flex-direction: column; gap: 6px;",n.forEach(([r,i])=>{const a=document.createElement("div");a.style.cssText="display: flex; align-items: center; gap: 12px;";const d=document.createElement("span");d.style.cssText="font-weight: 600; color: #000; min-width: 120px; flex-shrink: 0;",d.textContent=r,a.appendChild(d);const c=document.createElement("div");c.style.cssText="display: flex; flex-wrap: wrap; gap: 4px; flex: 1;",i.answers.forEach((l,m)=>{const h=document.createElement("span");h.style.cssText=`
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            ${l===null?"background: #e0e0e0; color: #666;":l.success?"background: #d4edda; color: #155724; border: 1px solid #c3e6cb;":"background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"}
          `,h.textContent=`Q${m+1}: ${l?l.answer:"—"}`,c.appendChild(h)}),a.appendChild(c),o.appendChild(a)}),s.appendChild(o)}return t.appendChild(s),t}render(){return u``}};w.styles=k;A([E({type:Array})],w.prototype,"students",2);A([E({type:Boolean})],w.prototype,"showModal",2);A([p()],w.prototype,"expandedStudents",2);w=A([C("qd-instructor-scores")],w);var Y=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,R=(e,t,s,n)=>{for(var o=n>1?void 0:n?Z(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&Y(t,s,o),o};let D=class extends v{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const e=this.generateCSV(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(t),n=document.createElement("a");n.href=s;const r=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);n.download=`quiz-data-${r}.csv`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(s)}}escapeCSVField(e){const t=String(e);return t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t.replace(/"/g,'""')}"`:t}generateCSV(){const e=[];e.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const t of this.students)for(const[s,n]of Object.entries(t.pages))(n.answers||[]).forEach((r,i)=>{r&&e.push([this.escapeCSVField(t.serviceId),this.escapeCSVField(t.name),this.escapeCSVField(t.release),this.escapeCSVField(s),this.escapeCSVField(i),this.escapeCSVField(r.answer),this.escapeCSVField(r.success),this.escapeCSVField(r.timestamp)].join(","))});return e.join(`
`)}render(){const e=this.students.length>0&&this.students.some(s=>s.attempted>0),t=e?`Export ${this.students.length} student${this.students.length===1?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return u`
      <button
        @click=${this.handleExport}
        ?disabled=${!e}
        class="primary compact"
        title=${t}
      >
        Export CSV
      </button>
    `}};D.styles=k;R([E({type:Array})],D.prototype,"students",2);D=R([C("qd-instructor-export")],D);var ee=Object.defineProperty,te=Object.getOwnPropertyDescriptor,T=(e,t,s,n)=>{for(var o=n>1?void 0:n?te(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&ee(t,s,o),o};let g=class extends v{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=e=>{const t=e.target;this.confirmText=t.value},this.handleConfirmClear=()=>{if(this.confirmText!=="DELETE ALL DATA"){this.error="Confirmation text does not match";return}try{j(),O(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(e){super.updated(e),e.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(e.has("confirmText")||e.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),B(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return u`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?u`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const e=this.confirmText==="DELETE ALL DATA";return u`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${t=>{t.target===t.currentTarget&&this.handleCancelClear()}}
      >
        <div
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${t=>t.stopPropagation()}
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

          ${this.error?u`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};g.styles=k;T([p()],g.prototype,"showConfirmDialog",2);T([p()],g.prototype,"confirmText",2);T([p()],g.prototype,"error",2);T([p()],g.prototype,"success",2);g=T([C("qd-instructor-manage")],g);var oe=Object.defineProperty,se=Object.getOwnPropertyDescriptor,I=(e,t,s,n)=>{for(var o=n>1?void 0:n?se(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&oe(t,s,o),o};let x=class extends v{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.searchText="",this.confirmingStudent=null,this.modalElement=null,this.handleEscape=e=>{e.key==="Escape"&&this.showModal&&(this.confirmingStudent?this.confirmingStudent=null:this.handleClose())},this.handleClose=()=>{this.confirmingStudent=null,this.searchText="",this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(e){e.has("showModal")&&(this.showModal?this.renderModalToBody():this.removeModalFromBody())}get filteredStudents(){if(!this.searchText.trim())return this.students;const e=this.searchText.toLowerCase().trim();return this.students.filter(t=>t.name.toLowerCase().includes(e)||t.serviceId.toLowerCase().includes(e))}renderModalToBody(){this.removeModalFromBody();const e=document.createElement("div");e.className="qd-pin-reset-overlay",e.style.cssText=`
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
    `;const t=document.createElement("div");t.style.cssText=`
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    `;const s=document.createElement("div");s.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;const n=document.createElement("h3");n.textContent="Reset Student PIN",n.style.cssText="font-size: 18px; font-weight: 600; margin: 0;";const o=document.createElement("button");o.textContent="×",o.type="button",o.style.cssText=`
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `,o.onclick=()=>this.handleClose(),s.appendChild(n),s.appendChild(o);const r=document.createElement("input");r.type="text",r.placeholder="Search by name or ID...",r.style.cssText=`
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    `,r.oninput=d=>{this.searchText=d.target.value,this.updateStudentList(t)};const i=document.createElement("div");i.className="student-list",i.style.cssText=`
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    `,t.appendChild(s),t.appendChild(r),t.appendChild(i);const a=document.createElement("div");a.className="error-message",a.style.cssText=`
      display: none;
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    `,t.appendChild(a),e.appendChild(t),e.onclick=d=>{d.target===e&&this.handleClose()},document.body.appendChild(e),this.modalElement=e,this.updateStudentList(t),r.focus()}updateStudentList(e){const t=e.querySelector(".student-list");if(!t)return;t.innerHTML="";const s=this.filteredStudents;if(s.length===0){const n=document.createElement("div");n.textContent=this.searchText?"No matching students":"No students found",n.style.cssText="padding: 16px; text-align: center; color: #666; font-size: 12px;",t.appendChild(n);return}s.forEach(n=>{const o=document.createElement("div");o.style.cssText=`
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid #f0f0f0;
      `;const r=document.createElement("div"),i=document.createElement("div");i.textContent=n.name,i.style.cssText="font-size: 12px; font-weight: 500;";const a=document.createElement("div");a.textContent=`ID: ${n.serviceId}`,a.style.cssText="font-size: 10px; color: #666;";const d=document.createElement("div"),c=n.pinHash&&n.pinHash.length>0;d.textContent=c?"PIN set":"No PIN",d.style.cssText=`font-size: 10px; color: ${c?"#4caf50":"#ff9800"};`,r.appendChild(i),r.appendChild(a),r.appendChild(d);const l=document.createElement("button");l.textContent="Reset PIN",l.type="button",l.style.cssText=`
        background: #ff5722;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
      `,l.onclick=()=>this.showConfirmation(n,e),o.appendChild(r),o.appendChild(l),t.appendChild(o)})}showConfirmation(e,t){this.confirmingStudent=e;const s=document.createElement("div");s.className="confirm-overlay",s.style.cssText=`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    `;const n=document.createElement("p");n.innerHTML=`Reset PIN for <strong>${e.name}</strong> (${e.serviceId})?`,n.style.cssText="margin: 0 0 16px; text-align: center; font-size: 14px;";const o=document.createElement("p");o.textContent="They will need to create a new PIN on next login.",o.style.cssText="margin: 0 0 16px; text-align: center; font-size: 11px; color: #666;";const r=document.createElement("div");r.style.cssText="display: flex; gap: 8px;";const i=document.createElement("button");i.textContent="Cancel",i.type="button",i.style.cssText=`
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
    `,i.onclick=()=>{this.confirmingStudent=null,s.remove()};const a=document.createElement("button");a.textContent="Reset PIN",a.type="button",a.style.cssText=`
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 12px;
      cursor: pointer;
    `,a.onclick=()=>this.executeReset(e,s,t),r.appendChild(i),r.appendChild(a),s.appendChild(n),s.appendChild(o),s.appendChild(r);const d=t.querySelector("div:first-child")?.parentElement||t;d.style.position="relative",d.appendChild(s)}async executeReset(e,t,s){try{const n=document.getElementById(M.dbName);if(!n?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${M.dbName}">dbName</span> to page.`);const o=n.textContent.trim(),r=U(o);await r.init();const i=V(e);await r.saveStudent(i);const a={eventId:crypto.randomUUID(),serviceId:e.serviceId,resetBy:"instructor",resetAt:new Date().toISOString(),release:e.release};await r.saveAuditEvent(a);const d=this.students.findIndex(c=>c.serviceId===e.serviceId);d>=0&&(this.students[d]=i,this.students=[...this.students]),this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:e.serviceId,resetBy:"instructor",timestamp:new Date().toISOString()},bubbles:!0,composed:!0})),this.confirmingStudent=null,t.remove(),this.updateStudentList(s)}catch(n){console.error("PIN reset error:",n);const o=s.querySelector(".error-message");o&&(o.textContent="Failed to reset PIN. Please try again.",o.style.display="block")}}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}render(){return u``}};x.styles=q`
    :host {
      display: block;
    }
  `;I([E({type:Array})],x.prototype,"students",2);I([E({type:Boolean})],x.prototype,"showModal",2);I([p()],x.prototype,"searchText",2);I([p()],x.prototype,"confirmingStudent",2);x=I([C("qd-pin-reset-dialog")],x);var ne=Object.defineProperty,re=Object.getOwnPropertyDescriptor,S=(e,t,s,n)=>{for(var o=n>1?void 0:n?re(t,s):t,r=e.length-1,i;r>=0;r--)(i=e[r])&&(o=(n?i(t,s,o):i(o))||o);return n&&o&&ne(t,s,o),o};let f=class extends v{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.handleLoginEvent=e=>{const s=e.detail?.role;this.updateVisibility(),s==="instructor"&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{const e=$(b.SESSION);if(e){try{const{getStorageService:t}=await P(async()=>{const{getStorageService:o}=await import("./storage-service-DCabG_JC.js");return{getStorageService:o}},__vite__mapDeps([0,1,2,3]),import.meta.url),n=await t().getStudentsByRelease(e.release);this.students=n}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showPinReset=!0}},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const e=$(b.SESSION);if(e){try{const{getStorageService:t}=await P(async()=>{const{getStorageService:o}=await import("./storage-service-DCabG_JC.js");return{getStorageService:o}},__vite__mapDeps([0,1,2,3]),import.meta.url),n=await t().getStudentsByRelease(e.release);this.students=n}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const e=$(b.SESSION);new F().clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async e=>{const t=e.target;if(this.showStudentAnswers=t.checked,this.showStudentAnswers&&this.students.length===0){const n=$(b.SESSION);if(n)try{const{getStorageService:o}=await P(async()=>{const{getStorageService:a}=await import("./storage-service-DCabG_JC.js");return{getStorageService:a}},__vite__mapDeps([0,1,2,3]),import.meta.url),i=await o().getStudentsByRelease(n.release);this.students=i}catch(o){console.error("Failed to load students for toggle:",o)}}const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const e=sessionStorage.getItem(b.INSTRUCTOR)==="true";e&&this.unlock();const t=sessionStorage.getItem("qd/instructor/showAnswers");t!==null&&(this.showStudentAnswers=t==="true",this.showStudentAnswers&&e&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){sessionStorage.getItem(b.INSTRUCTOR)==="true"?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(e){this.students=e}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?u`
      <div class="instructor-panel">
        <div class="instructor-title">Instructor Mode <qd-build-info></qd-build-info></div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show student answers on page
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
      </div>
    `:u`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};f.styles=[k,q`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `];S([p()],f.prototype,"unlocked",2);S([p()],f.prototype,"showScores",2);S([p()],f.prototype,"students",2);S([p()],f.prototype,"showStudentAnswers",2);S([p()],f.prototype,"showPinReset",2);f=S([C("qd-instructor")],f);
