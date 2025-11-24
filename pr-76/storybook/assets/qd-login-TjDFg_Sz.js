import{i as P,a as T,x as v}from"./lit-element-CSmQN0ht.js";import{n as A,t as D}from"./property-Cqq8i_uy.js";import{r as m}from"./state-BjYqokDn.js";import{P as f,w as L,m as w,i as E,S as y,g as N,b as $}from"./storage-helpers-BNoxrCtd.js";import{S as k}from"./session-Bx2jS3Yd.js";import{C as b,n as O,h as z,c as q}from"./dom-config-reader-ByJzI-qV.js";import{g as _}from"./indexeddb-CRFeaCTM.js";import"./qd-build-info-Gl919pTb.js";async function S(t){const o=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",o);return Array.from(new Uint8Array(n)).map(s=>s.toString(16).padStart(2,"0")).join("")}async function H(t,e){const o=await S(t);return R(o,e)}function R(t,e){if(t.length!==e.length)return!1;let o=0;for(let n=0;n<t.length;n++)o|=t.charCodeAt(n)^e.charCodeAt(n);return o===0}function I(t){return`${y.PIN_ATTEMPTS}:${t}`}function x(t){const e=I(t),o=sessionStorage.getItem(e);if(!o)return null;try{return JSON.parse(o)}catch{return null}}function M(t){const e=x(t);if(!e||!e.lockoutUntil)return{isLocked:!1,remainingMs:0};const o=new Date(e.lockoutUntil).getTime(),n=Date.now();return o>n?{isLocked:!0,remainingMs:o-n}:(C(t),{isLocked:!1,remainingMs:0})}function U(t){const e=new Date().toISOString();let o=x(t);if(o||(o={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:e}),o.attempts+=1,o.lastAttempt=e,o.attempts>=f.MAX_ATTEMPTS){const i=new Date(Date.now()+f.LOCKOUT_MS);o.lockoutUntil=i.toISOString(),L(`PIN lockout triggered for ${w(t)} after ${o.attempts} failed attempts`)}else E(`Failed PIN attempt ${o.attempts}/${f.MAX_ATTEMPTS} for ${w(t)}`);const n=I(t);return sessionStorage.setItem(n,JSON.stringify(o)),o}function C(t){const e=x(t);e&&e.attempts>0&&E(`Cleared ${e.attempts} failed PIN attempts for ${w(t)} on successful login`);const o=I(t);sessionStorage.removeItem(o)}function j(t){const e=x(t);return e?M(t).isLocked?0:Math.max(0,f.MAX_ATTEMPTS-e.attempts):f.MAX_ATTEMPTS}var B=Object.defineProperty,V=Object.getOwnPropertyDescriptor,p=(t,e,o,n)=>{for(var i=n>1?void 0:n?V(e,o):e,s=t.length-1,a;s>=0;s--)(a=t[s])&&(i=(n?a(e,o,i):a(i))||i);return n&&i&&B(e,o,i),i};let l=class extends T{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.instructorPassword="",this.showInstructorModal=!1,this.modalOverlay=null,this.modalErrorDiv=null,this.modalPasswordInput=null,this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutSeconds=0,this.lockoutInterval=null,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.instructorPassword="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.pin="",this.lockoutSeconds=0,this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null),this.cleanupModal(),this.updateVisibility()},this.handleEscape=t=>{t.key==="Escape"&&this.showInstructorModal&&this.closeInstructorModal()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("keydown",this.handleEscape),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.cleanupModal(),this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)}cleanupModal(){this.modalOverlay&&(this.modalOverlay.remove(),this.modalOverlay=null),this.modalErrorDiv=null,this.modalPasswordInput=null}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){N(y.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return v`
      <div class="login-container">
        <div class="title">${this.title} <qd-build-info></qd-build-info></div>

        <form class="login-form" @submit=${t=>this.handleStudentLogin(t)}>
          <input
            type="text"
            name="name"
            placeholder="Name (J Smith)"
            .value=${this.name}
            @input=${t=>this.handleNameInput(t)}
            ?disabled=${this.isSubmitting}
            required
          />

          <input
            type="text"
            name="serviceId"
            placeholder="Service ID (30012345)"
            .value=${this.serviceId}
            @input=${t=>this.handleServiceIdInput(t)}
            ?disabled=${this.isSubmitting}
            pattern="[A-Za-z0-9]{2,10}"
            title="2-10 alphanumeric characters"
            required
          />

          <input
            type="password"
            name="pin"
            class="pin-input"
            placeholder="PIN"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            autocomplete="off"
            aria-label="Enter your 4-digit PIN"
            .value=${this.pin}
            @input=${t=>this.handlePinInput(t)}
            ?disabled=${this.isSubmitting||this.lockoutSeconds>0}
            required
          />

          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting||!this.isValid()||this.lockoutSeconds>0}
          >
            Login
          </button>

          <button
            type="button"
            class="instructor-btn"
            @click=${()=>this.openInstructorModal()}
            ?disabled=${this.isSubmitting}
          >
            Instructor
          </button>

          ${this.errorMessage?v`<div class="error-message">${this.errorMessage}</div>`:""}
          ${this.lockoutSeconds>0?v`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
                Too many attempts. Try again in ${this.lockoutSeconds}s
              </div>`:""}
        </form>
      </div>
    `}renderInstructorModalToBody(){const t=document.createElement("div");t.className="qd-instructor-modal-overlay",t.style.cssText=`
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
    `;const e=document.createElement("div");e.className="qd-instructor-modal",e.style.cssText=`
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      position: relative;
      z-index: 100000;
    `;const o=document.createElement("div");o.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    `;const n=document.createElement("h3");n.textContent="Instructor Login",n.style.cssText="font-size: 18px; font-weight: 600; color: #333; margin: 0;";const i=document.createElement("button");i.textContent="×",i.type="button",i.style.cssText=`
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      line-height: 1;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `,i.onclick=()=>this.closeInstructorModal(),o.appendChild(n),o.appendChild(i);const s=document.createElement("form"),a=document.createElement("div");a.style.marginBottom="20px";const r=document.createElement("input");r.id="qd-instructor-password",r.type="password",r.placeholder="Password",r.required=!0,r.style.cssText=`
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `,r.oninput=h=>{this.instructorPassword=h.target.value,this.modalErrorDiv&&(this.modalErrorDiv.style.display="none",this.modalErrorDiv.textContent="")},a.appendChild(r),this.modalPasswordInput=r;const c=document.createElement("div");c.id="qd-instructor-modal-error",c.style.cssText=`
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
      display: none;
    `,a.appendChild(c),this.modalErrorDiv=c;const g=document.createElement("div");g.style.cssText="display: flex; gap: 8px; justify-content: flex-end;";const d=document.createElement("button");d.textContent="Cancel",d.type="button",d.style.cssText=`
      background: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `,d.onclick=()=>this.closeInstructorModal();const u=document.createElement("button");u.id="qd-instructor-submit",u.textContent="Login",u.type="submit",u.style.cssText=`
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 12px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `,g.appendChild(d),g.appendChild(u),s.appendChild(a),s.appendChild(g),s.onsubmit=h=>{h.preventDefault(),this.handleInstructorLogin(h)},e.appendChild(o),e.appendChild(s),t.appendChild(e),t.onclick=h=>{h.target===t&&this.closeInstructorModal()},document.body.appendChild(t),this.modalOverlay=t,setTimeout(()=>r.focus(),50)}handleNameInput(t){const e=t.target;this.name=e.value,this.errorMessage=""}handleServiceIdInput(t){const e=t.target;this.serviceId=e.value,this.errorMessage=""}handlePinInput(t){const e=t.target;this.pin=e.value.replace(/\D/g,""),this.errorMessage=""}isValid(){const t=this.name.trim(),e=this.serviceId.trim();return!(!t||!/^[A-Za-z0-9]{2,10}$/.test(e)||this.pin.length!==4)}getRelease(){const e=document.getElementById(b.titleSelector)?.textContent?.trim()||".wh_publication_title .title";return document.querySelector(e)?.textContent?.trim()||""}async handleStudentLogin(t){if(t.preventDefault(),!this.isValid()){this.errorMessage="Please enter name, service ID, and 4-digit PIN";return}this.isSubmitting=!0,this.errorMessage="";try{const e=this.getRelease();if(!e){this.errorMessage="Release not found (missing publication title element)",this.isSubmitting=!1;return}const o=this.serviceId.trim(),n=this.name.trim(),i=M(o);if(i.isLocked){this.startLockoutCountdown(i.remainingMs),this.isSubmitting=!1;return}const s=document.getElementById(b.dbName);if(!s?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${b.dbName}">dbName</span> to page.`);const a=s.textContent.trim(),r=_(a);await r.init();const c=await r.getStudent(e,o);if(c){if(O(c)||!z(c)){const d=await S(this.pin),u=q(c,d);await r.saveStudent(u),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:o,timestamp:new Date().toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),this.completeLogin(o,n,e);return}if(!await H(this.pin,c.pinHash||"")){const d=U(o),u=j(o);if(d.lockoutUntil){const h=new Date(d.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(h)}else this.errorMessage=`Incorrect PIN. ${u} attempt${u!==1?"s":""} remaining`;this.pin="",this.isSubmitting=!1;return}C(o),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:o,timestamp:new Date().toISOString()},bubbles:!0,composed:!0}))}else{const g=await S(this.pin),d={schema:$,docId:"",release:e,serviceId:o,name:n,attempted:0,correct:0,updated:new Date().toISOString(),pages:{},pinHash:g,pinCreatedAt:new Date().toISOString()};await r.saveStudent(d),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:o,timestamp:new Date().toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),this.completeLogin(o,n,e);return}this.completeLogin(o,n,e)}catch(e){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",e),this.isSubmitting=!1}}showPinStoredConfirmation(){const t=document.createElement("div");t.style.cssText=`
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
    `;const e=document.createElement("div");e.style.cssText=`
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 320px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
    `,e.innerHTML=`
      <div style="font-size: 32px; margin-bottom: 12px;">✓</div>
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">PIN Stored</h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #666;">
        Your PIN has been saved. Use it with your name and service ID on future logins.
      </p>
      <button style="
        background: #0066cc;
        color: white;
        border: none;
        padding: 8px 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">OK</button>
    `,e.querySelector("button")?.addEventListener("click",()=>{document.body.removeChild(t)}),t.addEventListener("click",n=>{n.target===t&&document.body.removeChild(t)}),t.appendChild(e),document.body.appendChild(t),setTimeout(()=>{document.body.contains(t)&&document.body.removeChild(t)},3e3)}startLockoutCountdown(t){this.lockoutSeconds=Math.ceil(t/1e3),this.errorMessage="",this.lockoutInterval&&clearInterval(this.lockoutInterval),this.lockoutInterval=window.setInterval(()=>{this.lockoutSeconds--,this.lockoutSeconds<=0&&this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)},1e3)}completeLogin(t,e,o){new k().createSession(t,e,o);const i={serviceId:t,name:e,release:o,role:"student"},s=new CustomEvent("qd:login",{detail:i,bubbles:!0,composed:!0});this.dispatchEvent(s),this.pin="",this.isSubmitting=!1,this.updateVisibility()}openInstructorModal(){this.showInstructorModal=!0,this.instructorPassword="",this.renderInstructorModalToBody()}closeInstructorModal(){this.showInstructorModal=!1,this.instructorPassword="",this.cleanupModal()}async hashPassword(t){const o=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",o);return Array.from(new Uint8Array(n)).map(s=>s.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){return document.getElementById(b.instructorHash)?.textContent?.trim()||""}showModalError(t){this.modalErrorDiv&&(this.modalErrorDiv.textContent=t,this.modalErrorDiv.style.display="block")}async handleInstructorLogin(t){if(t.preventDefault(),!this.instructorPassword){this.showModalError("Password is required");return}try{const e=await this.hashPassword(this.instructorPassword),o=this.getExpectedHash();if(!o){this.showModalError("Instructor password not configured");return}if(e!==o){this.showModalError("Incorrect password"),this.instructorPassword="",this.modalPasswordInput&&(this.modalPasswordInput.value="",this.modalPasswordInput.focus());return}const n=this.getRelease();new k().createSession("INSTRUCTOR","Instructor",n||""),sessionStorage.setItem(y.INSTRUCTOR,"true");const s={serviceId:"INSTRUCTOR",name:"Instructor",release:n||"",role:"instructor"},a=new CustomEvent("qd:login",{detail:s,bubbles:!0,composed:!0});this.dispatchEvent(a),this.closeInstructorModal(),this.updateVisibility()}catch(e){this.showModalError("Login failed. Please try again."),console.error("Instructor login error:",e)}}};l.styles=P`
    :host {
      display: none; /* Hidden if already logged in */
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    :host([data-show]) {
      display: block;
    }

    .login-container {
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-width: 480px;
    }

    .title {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }

    .login-form {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    input {
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
      width: 110px;
      min-width: 75px;
      max-width: 110px;
    }

    input.pin-input {
      width: 45px;
      min-width: 45px;
      max-width: 45px;
      text-align: center;
      letter-spacing: 1px;
    }

    input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .login-btn {
      background: #0066cc;
      color: white;
    }

    .login-btn:hover:not(:disabled) {
      background: #0052a3;
    }

    .login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .instructor-btn {
      background: #6c757d;
      color: white;
    }

    .instructor-btn:hover {
      background: #5a6268;
    }

    .error-message {
      width: 100%;
      color: #d32f2f;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
    }

    .lockout-message {
      width: 100%;
      color: #f57c00;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #fff3e0;
      border-radius: 3px;
      border-left: 3px solid #f57c00;
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001; /* Above storage monitor (10000) */
    }

    .modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      margin-bottom: 20px;
    }

    .modal-body input {
      width: 100%;
      box-sizing: border-box;
    }

    .modal-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .login-form {
        flex-direction: column;
      }

      input,
      button {
        width: 100%;
      }
    }
  `;p([A({type:String})],l.prototype,"title",2);p([m()],l.prototype,"name",2);p([m()],l.prototype,"serviceId",2);p([m()],l.prototype,"instructorPassword",2);p([m()],l.prototype,"showInstructorModal",2);p([m()],l.prototype,"errorMessage",2);p([m()],l.prototype,"isSubmitting",2);p([m()],l.prototype,"pin",2);p([m()],l.prototype,"lockoutSeconds",2);l=p([D("qd-login")],l);
