const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./storage-service-CKMCIiLV.js","./storage-helpers-B4dxqHb-.js","./session-B4sBU_x4.js"])))=>i.map(i=>d[i]);
import{_ as P}from"./iframe-Bf9MEJc_.js";import{i as _,a as m,x as a}from"./lit-element-CSmQN0ht.js";import{t as f,n as I}from"./property-Cqq8i_uy.js";import{r as c}from"./state-BjYqokDn.js";import{e as k,c as U,g as D,S}from"./storage-helpers-B4dxqHb-.js";import{S as V}from"./session-B4sBU_x4.js";import{d as T}from"./event-helpers-DOv9sfVv.js";const w=_`
  :host {
    display: inline-block;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    font-size: 14px;
    line-height: 1.5;
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
    color: #333;
    margin-right: 8px;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #555;
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
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
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
    z-index: 9999;
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
    z-index: 10000;
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
`;class R{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return this.lockoutUntil&&Date.now()<this.lockoutUntil?!1:(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],s=Math.min(this.failureCount-1,t.length-1),o=t[s]??3e4;this.lockoutUntil=Date.now()+o}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return this.lockoutUntil!==null&&Date.now()<this.lockoutUntil}}async function j(e,t){if(e.length!==t.length)return!1;if(e.length===0)return!0;const s=new TextEncoder,o=s.encode(e),r=s.encode(t);try{const n=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),i=await crypto.subtle.sign("HMAC",n,r),l=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),d=await crypto.subtle.sign("HMAC",l,o);if(i.byteLength!==d.byteLength)return!1;const x=new Uint8Array(i),O=new Uint8Array(d);let A=0;for(let y=0;y<x.length;y++)A|=(x[y]??0)^(O[y]??0);return A===0}catch(n){return console.error("Constant-time comparison failed:",n),!1}}const L="instructor.password.hash";function M(){const e=document.getElementById(L);if(!e){const s=`Instructor password hash not found. Expected element with id="${L}". Check Oxygen XSL transform configuration.`;throw k(s),new Error(s)}const t=e.textContent?.trim();if(!t){const s="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw k(s),new Error(s)}if(!/^[a-f0-9]{64}$/i.test(t)){const s=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${t.substring(0,20)}...`;throw k(s),new Error(s)}return t.toLowerCase()}var z=Object.defineProperty,H=Object.getOwnPropertyDescriptor,$=(e,t,s,o)=>{for(var r=o>1?void 0:o?H(t,s):t,n=e.length-1,i;n>=0;n--)(i=e[n])&&(r=(o?i(t,s,r):i(r))||r);return o&&r&&z(t,s,r),r};let p=class extends m{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new R,this.handlePasswordInput=e=>{const t=e.target;this.password=t.value,this.error=""},this.handleSubmit=async e=>{if(e.preventDefault(),!this.rateLimiter.attempt()){this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`;return}try{const s=M(),r=new TextEncoder().encode(this.password),n=await crypto.subtle.digest("SHA-256",r),l=Array.from(new Uint8Array(n)).map(x=>x.toString(16).padStart(2,"0")).join("");await j(l,s)?(this.rateLimiter.reset(),this.password="",this.error="",T(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.remainingSeconds===0?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const e=this.remainingSeconds>0;return a`
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

          ${this.error?a`<div class="error">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${e||!this.password}>
            ${e?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};p.styles=w;$([c()],p.prototype,"password",2);$([c()],p.prototype,"error",2);$([c()],p.prototype,"remainingSeconds",2);p=$([f("qd-instructor-unlock")],p);var F=Object.defineProperty,N=Object.getOwnPropertyDescriptor,E=(e,t,s,o)=>{for(var r=o>1?void 0:o?N(t,s):t,n=e.length-1,i;n>=0;n--)(i=e[n])&&(r=(o?i(t,s,r):i(r))||r);return o&&r&&F(t,s,r),r};let g=class extends m{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.expandedStudents=new Set,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))},this.toggleStudent=e=>{this.expandedStudents.has(e)?this.expandedStudents.delete(e):this.expandedStudents.add(e),this.requestUpdate()}}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}renderStudentRow(e){const t=this.calculateSummary(e),s=this.expandedStudents.has(e.serviceId);return a`
      <tr>
        <td>
          <button
            @click=${()=>this.toggleStudent(e.serviceId)}
            style="border: none; background: none; cursor: pointer; padding: 0;"
          >
            ${s?"▼":"▶"}
          </button>
          ${t.name}
        </td>
        <td>${t.serviceId}</td>
        <td>${t.attempted}</td>
        <td class=${t.correct===t.attempted?"correct":""}>${t.correct}</td>
        <td>
          <span
            class=${t.percentage===100?"correct":t.percentage===0?"incorrect":""}
          >
            ${t.percentage}%
          </span>
        </td>
      </tr>
      ${s?this.renderExpandedDetails(e):""}
    `}renderExpandedDetails(e){const t=Object.entries(e.pages);return t.length===0?a`
        <tr>
          <td colspan="5" style="padding-left: 40px; color: #666;">No quiz pages attempted</td>
        </tr>
      `:a`
      <tr>
        <td colspan="5" style="padding: 0;">
          <table style="margin: 0; width: 100%;">
            <thead>
              <tr>
                <th style="padding-left: 40px;">Page</th>
                <th>Attempted</th>
                <th>Correct</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${t.map(([s,o])=>{const r=o.answers||[],n=r.filter(d=>d!==null).length,i=r.filter(d=>d?.success===!0).length,l=n>0?Math.round(i/n*100):0;return a`
                  <tr>
                    <td style="padding-left: 40px;">${s}</td>
                    <td>${n}</td>
                    <td class=${i===n?"correct":""}>${i}</td>
                    <td>
                      <span
                        class=${l===100?"correct":l===0?"incorrect":""}
                      >
                        ${l}%
                      </span>
                    </td>
                  </tr>
                `})}
            </tbody>
          </table>
        </td>
      </tr>
    `}render(){if(!this.showModal)return a``;const e=[...this.students].sort((t,s)=>t.name.localeCompare(s.name));return a`
      <div class="modal-overlay" @click=${this.handleClose}>
        <div class="modal-content" @click=${t=>t.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Student Scores</h2>
            <button class="close-button" @click=${this.handleClose}>✕</button>
          </div>

          ${e.length===0?a`<p>No student data available.</p>`:a`
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Service ID</th>
                      <th>Attempted</th>
                      <th>Correct</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${e.map(t=>this.renderStudentRow(t))}
                  </tbody>
                </table>
              `}
        </div>
      </div>
    `}};g.styles=w;E([I({type:Array})],g.prototype,"students",2);E([I({type:Boolean})],g.prototype,"showModal",2);E([c()],g.prototype,"expandedStudents",2);g=E([f("qd-instructor-scores")],g);var B=Object.defineProperty,Q=Object.getOwnPropertyDescriptor,q=(e,t,s,o)=>{for(var r=o>1?void 0:o?Q(t,s):t,n=e.length-1,i;n>=0;n--)(i=e[n])&&(r=(o?i(t,s,r):i(r))||r);return o&&r&&B(t,s,r),r};let C=class extends m{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const e=this.generateCSV(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(t),o=document.createElement("a");o.href=s;const n=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);o.download=`quiz-data-${n}.csv`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(s)}}escapeCSVField(e){const t=String(e);return t.includes(",")||t.includes('"')||t.includes(`
`)?`"${t.replace(/"/g,'""')}"`:t}generateCSV(){const e=[];e.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const t of this.students)for(const[s,o]of Object.entries(t.pages))(o.answers||[]).forEach((n,i)=>{n&&e.push([this.escapeCSVField(t.serviceId),this.escapeCSVField(t.name),this.escapeCSVField(t.release),this.escapeCSVField(s),this.escapeCSVField(i),this.escapeCSVField(n.answer),this.escapeCSVField(n.success),this.escapeCSVField(n.timestamp)].join(","))});return e.join(`
`)}render(){const e=this.students.length>0,t=e?`Export ${this.students.length} student${this.students.length===1?"":"s"} to CSV`:"No data to export";return a`
      <button
        @click=${this.handleExport}
        ?disabled=${!e}
        class="primary compact"
        title=${t}
      >
        Export CSV
      </button>
    `}};C.styles=w;q([I({type:Array})],C.prototype,"students",2);C=q([f("qd-instructor-export")],C);var K=Object.defineProperty,G=Object.getOwnPropertyDescriptor,b=(e,t,s,o)=>{for(var r=o>1?void 0:o?G(t,s):t,n=e.length-1,i;n>=0;n--)(i=e[n])&&(r=(o?i(t,s,r):i(r))||r);return o&&r&&K(t,s,r),r};let h=class extends m{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=e=>{const t=e.target;this.confirmText=t.value},this.handleConfirmClear=()=>{if(this.confirmText!=="DELETE ALL DATA"){this.error="Confirmation text does not match";return}try{U(),T(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}}}render(){return a`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.showConfirmDialog?this.renderConfirmDialog():""}
      ${this.success?a`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const e=this.confirmText==="DELETE ALL DATA";return a`
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

          ${this.error?a`<div class="error">${this.error}</div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button @click=${this.handleCancelClear}>Cancel</button>
            <button @click=${this.handleConfirmClear} class="danger" ?disabled=${!e}>
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};h.styles=w;b([c()],h.prototype,"showConfirmDialog",2);b([c()],h.prototype,"confirmText",2);b([c()],h.prototype,"error",2);b([c()],h.prototype,"success",2);h=b([f("qd-instructor-manage")],h);var J=Object.defineProperty,W=Object.getOwnPropertyDescriptor,v=(e,t,s,o)=>{for(var r=o>1?void 0:o?W(t,s):t,n=e.length-1,i;n>=0;n--)(i=e[n])&&(r=(o?i(t,s,r):i(r))||r);return o&&r&&J(t,s,r),r};let u=class extends m{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.handleLoginEvent=e=>{const s=e.detail?.role;this.updateVisibility(),s==="instructor"&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const e=D(S.SESSION);if(e){try{const{getStorageService:t}=await P(async()=>{const{getStorageService:r}=await import("./storage-service-CKMCIiLV.js");return{getStorageService:r}},__vite__mapDeps([0,1,2]),import.meta.url),o=await t().getStudentsByRelease(e.release);this.students=o}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const e=D(S.SESSION);new V().clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=e=>{const t=e.target;this.showStudentAnswers=t.checked;const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),sessionStorage.getItem(S.INSTRUCTOR)==="true"&&this.unlock();const t=sessionStorage.getItem("qd/instructor/showAnswers");t!==null&&(this.showStudentAnswers=t==="true"),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){sessionStorage.getItem(S.INSTRUCTOR)==="true"?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(e){this.students=e}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1}render(){return this.unlocked?a`
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
    `:a`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};u.styles=[w,_`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `];v([c()],u.prototype,"unlocked",2);v([c()],u.prototype,"showScores",2);v([c()],u.prototype,"students",2);v([c()],u.prototype,"showStudentAnswers",2);u=v([f("qd-instructor")],u);
