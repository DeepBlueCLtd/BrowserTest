import{i as M,a as P,x as p}from"./lit-element-DR9D0stx.js";import{n as L,t as $}from"./property-BRFVFa-w.js";import{r as d}from"./state-7B7Yt9om.js";import{s as X,h as Q,a as J}from"./session-state-Cbzz7Lnd.js";import{P as h,S as y,b as Y,a as Z}from"./storage-helpers-h0mJMTqi.js";import{s as G,v as D,a as W}from"./validation-helpers-BKV-CcJj.js";import{S as q,g as N}from"./help-content-B3n3zGYG.js";import{a as x,b as S}from"./dom-config-reader-DImSGrCl.js";import{g as O,h as R,n as C,c as tt,u as et,S as it}from"./migration-D6nbdGca.js";import{w as st,m as k,i as _}from"./logger-DdbYlyfi.js";import{R as nt,g as rt}from"./instructor-auth-z7mVUIDs.js";import"./qd-password-modal-BO6kslGq.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";import"./qd-migration-dialog-B8tNHRJC.js";const ot=M`
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
      /* Wide enough to keep every control on one row, including the PIN field
         with its "PIN (4 digits)" placeholder. The surrounding header has
         ample horizontal space; this panel was the constraint, not the page. */
      max-width: 560px;
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
      /* Sized to show the "PIN (4 digits)" placeholder in full, so the field
         states its own rule rather than reading as an unexplained box. */
      width: 88px;
      min-width: 88px;
      max-width: 88px;
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

    /*
     * Reserve the message row so typing does not make the header grow and
     * shrink (SRD 013 UX-11)
     */
    .message-slot {
      width: 100%;
      min-height: 22px;
    }

    input[aria-invalid='true'] {
      border-color: #d32f2f;
    }

    .hint-message {
      width: 100%;
      /* Padding inside the 100% width, so long messages stay in the panel */
      box-sizing: border-box;
      color: #555;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #f1f3f4;
      border-radius: 3px;
      border-left: 3px solid #9aa0a6;
    }

    .notice-message {
      color: #0b4f8a;
      font-size: 11px;
      margin: 0 0 6px;
      padding: 4px 8px;
      background: #e8f1fb;
      border-radius: 3px;
      border-left: 3px solid #1d6fb8;
    }

    .error-message {
      width: 100%;
      /* Padding inside the 100% width, so long messages stay in the panel */
      box-sizing: border-box;
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
      /* Padding inside the 100% width, so long messages stay in the panel */
      box-sizing: border-box;
      color: #f57c00;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #fff3e0;
      border-radius: 3px;
      border-left: 3px solid #f57c00;
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
`;function U(t){return Array.from(t).map(e=>e.toString(16).padStart(2,"0")).join("")}function at(t){const e=new Uint8Array(new ArrayBuffer(t.length/2));for(let i=0;i<e.length;i++)e[i]=parseInt(t.substring(i*2,i*2+2),16);return e}async function H(t,e,i){const s=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveBits"]),n=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:at(e),iterations:i},s,256);return U(new Uint8Array(n))}async function I(t,e=h.KDF_ITERATIONS){const i=U(crypto.getRandomValues(new Uint8Array(h.SALT_BYTES)));return{pinHash:await H(t,i,e),pinSalt:i,pinIterations:e,pinKdf:"pbkdf2-sha256"}}async function dt(t,e){const i=e.pinHash??"";if(!i)return{valid:!1};if(e.pinKdf==="pbkdf2-sha256"&&e.pinSalt&&e.pinIterations){const s=await H(t,e.pinSalt,e.pinIterations);return{valid:z(s,i)}}return await ct(t,i)?{valid:!0,upgrade:await I(t)}:{valid:!1}}async function lt(t){const i=new TextEncoder().encode(t),s=await crypto.subtle.digest("SHA-256",i);return Array.from(new Uint8Array(s)).map(r=>r.toString(16).padStart(2,"0")).join("")}async function ct(t,e){const i=await lt(t);return z(i,e)}function z(t,e){if(t.length!==e.length)return!1;let i=0;for(let s=0;s<t.length;s++)i|=t.charCodeAt(s)^e.charCodeAt(s);return i===0}function E(t){return`${y.PIN_ATTEMPTS}:${t}`}function b(t){const e=E(t),i=sessionStorage.getItem(e);if(!i)return null;try{return JSON.parse(i)}catch{return null}}function j(t){const e=b(t);if(!e||!e.lockoutUntil)return{isLocked:!1,remainingMs:0};const i=new Date(e.lockoutUntil).getTime(),s=Date.now();return i>s?{isLocked:!0,remainingMs:i-s}:(V(t),{isLocked:!1,remainingMs:0})}function ht(t){const e=new Date().toISOString();let i=b(t);if(i||(i={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:e}),i.attempts+=1,i.lastAttempt=e,i.attempts>=h.MAX_ATTEMPTS){const n=new Date(Date.now()+h.LOCKOUT_MS);i.lockoutUntil=n.toISOString(),st(`PIN lockout triggered for ${k(t)} after ${i.attempts} failed attempts`)}else _(`Failed PIN attempt ${i.attempts}/${h.MAX_ATTEMPTS} for ${k(t)}`);const s=E(t);return sessionStorage.setItem(s,JSON.stringify(i)),i}function V(t){const e=b(t);e&&e.attempts>0&&_(`Cleared ${e.attempts} failed PIN attempts for ${k(t)} on successful login`);const i=E(t);sessionStorage.removeItem(i)}function pt(t){const e=b(t);return e?j(t).isLocked?0:Math.max(0,h.MAX_ATTEMPTS-e.attempts):h.MAX_ATTEMPTS}class ut{loginStudent(e){return this.runLogin(e,{checkLock:!0,surfaceMigration:!0,errorMessage:"Login failed. Please try again.",errorLabel:"Student login error:"})}retryAfterMigration(e){return this.runLogin(e,{checkLock:!1,surfaceMigration:!1,errorMessage:"Login failed after migration. Please try again.",errorLabel:"Post-migration login error:"})}async isRegistered(e,i,s){try{const n=O(s);await n.init();const r=await n.getStudent(i,e);return r?R(r)&&!C(r):!1}catch{return null}}async runLogin(e,i){const{serviceId:s,name:n,pin:r,release:o,dbName:B}=e;if(i.checkLock){const c=j(s);if(c.isLocked)return{kind:"lockout",lockoutMs:c.remainingMs}}try{const c=O(B);await c.init();const u=await c.getStudent(o,s);if(u){if(C(u)||!R(u)){const f=await I(r),A=tt(u,f);return await c.saveStudent(A),{kind:"pin-created",serviceId:s,name:n,release:o}}const w=await dt(r,u);if(!w.valid){const f=ht(s);return f.lockoutUntil?{kind:"lockout",lockoutMs:new Date(f.lockoutUntil).getTime()-Date.now()}:{kind:"bad-pin",remaining:pt(s)}}return V(s),w.upgrade&&await c.saveStudent(et(u,w.upgrade)),{kind:"pin-verified",serviceId:s,name:n,release:o}}const F=await I(r),K={schema:Y,docId:"",release:o,serviceId:s,name:n,attempted:0,correct:0,updated:new Date().toISOString(),pages:{},...F,pinCreatedAt:new Date().toISOString()};return await c.saveStudent(K),{kind:"pin-created",serviceId:s,name:n,release:o}}catch(c){return i.surfaceMigration&&c instanceof it?{kind:"needs-migration",error:c}:(console.error(i.errorLabel,c),{kind:"error",message:i.errorMessage})}}}var gt=Object.defineProperty,mt=Object.getOwnPropertyDescriptor,v=(t,e,i,s)=>{for(var n=s>1?void 0:s?mt(e,i):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(n=(s?o(e,i,n):o(n))||n);return s&&n&&gt(e,i,n),n};let g=class extends P{constructor(){super(...arguments),this.disabled=!1,this.showModal=!1,this.error="",this.rateLimiter=new nt(h.MAX_ATTEMPTS-1),this.open=()=>{this.showModal=!0,this.error=""},this.handleClose=()=>{this.showModal=!1,this.error=""},this.handleSubmit=t=>{this.login(t.detail.password)}}render(){return p`
      <button type="button" class="instructor-btn" @click=${this.open} ?disabled=${this.disabled}>
        Instructor
      </button>

      <qd-password-modal
        .open=${this.showModal}
        title="Instructor Login"
        .error=${this.error}
        @qd:password-submit=${this.handleSubmit}
        @close=${this.handleClose}
      ></qd-password-modal>
    `}async login(t){if(!rt()){this.error="Instructor password not configured";return}if(!this.rateLimiter.attempt()){this.error=`Too many attempts. Try again in ${this.rateLimiter.getRemainingSeconds()}s`;return}try{if(!await X(t)){this.rateLimiter.recordFailure(),this.error="Incorrect password";return}this.rateLimiter.reset();const i=x();new q().createSession("INSTRUCTOR","Instructor",i||""),this.dispatchEvent(new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:i||"",role:"instructor"},bubbles:!0,composed:!0})),this.showModal=!1,this.error=""}catch(i){this.error="Login failed. Please try again.",console.error("Instructor login error:",i)}}};g.styles=M`
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      background: #6c757d;
      color: white;
    }

    button:hover:not(:disabled) {
      background: #5a6268;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  `;v([L({type:Boolean})],g.prototype,"disabled",2);v([d()],g.prototype,"showModal",2);v([d()],g.prototype,"error",2);g=v([$("qd-instructor-login")],g);var ft=Object.defineProperty,bt=Object.getOwnPropertyDescriptor,T=(t,e,i,s)=>{for(var n=s>1?void 0:s?bt(e,i):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(n=(s?o(e,i,n):o(n))||n);return s&&n&&ft(e,i,n),n};let m=class extends P{constructor(){super(...arguments),this.untilMs=0,this.seconds=0,this.interval=null}disconnectedCallback(){super.disconnectedCallback(),this.clearTimer()}willUpdate(t){if(t.has("untilMs")){const e=this.untilMs-Date.now();this.seconds=e>0?Math.ceil(e/1e3):0}}updated(t){t.has("untilMs")&&this.startTimer()}render(){return this.seconds<=0?p``:p`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
      Too many attempts. Try again in ${this.seconds}s
    </div>`}startTimer(){this.clearTimer(),!(this.seconds<=0)&&(this.interval=window.setInterval(()=>{this.seconds--,this.seconds<=0&&(this.clearTimer(),this.dispatchEvent(new CustomEvent("qd:lockout-expired",{bubbles:!0,composed:!0})))},1e3))}clearTimer(){this.interval&&(clearInterval(this.interval),this.interval=null)}};m.styles=M`
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
  `;T([L({type:Number})],m.prototype,"untilMs",2);T([d()],m.prototype,"seconds",2);m=T([$("qd-lockout-banner")],m);var vt=Object.defineProperty,wt=Object.getOwnPropertyDescriptor,l=(t,e,i,s)=>{for(var n=s>1?void 0:s?wt(e,i):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(n=(s?o(e,i,n):o(n))||n);return s&&n&&vt(e,i,n),n};let a=class extends P{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.touched=new Set,this.isRegistered=null,this.pendingPin="",this.helpOpen=!1,this.sessionNotice="",this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.authService=new ut,this.handleLoginEvent=()=>{this.sessionNotice="",this.updateVisibility()},this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.touched=new Set,this.helpOpen=!1,this.isRegistered=null,this.pendingPin="",this.takeSessionExpiredNotice(),this.updateVisibility()},this.handleLockoutExpired=()=>{this.lockoutUntil=0},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handleMigrationComplete=()=>{if(this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData){const{serviceId:t,name:e,release:i}=this.pendingLoginData;this.pendingLoginData=null,this.retryLoginAfterMigration(t,e,i)}},this.handleMigrationCancel=()=>{this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.errorMessage="Data migration cancelled. Please contact your instructor for assistance.",this.isSubmitting=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.takeSessionExpiredNotice(),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:login",this.handleLoginEvent)}disconnectedCallback(){super.disconnectedCallback(),window.clearTimeout(this.registrationTimer),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:login",this.handleLoginEvent)}takeSessionExpiredNotice(){if(sessionStorage.getItem(y.SESSION_EXPIRED)===null)return;sessionStorage.removeItem(y.SESSION_EXPIRED);const t=Math.round(Z/6e4);this.sessionNotice=`Your session ended after ${t} minutes without activity. Log in again to continue.`}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){this.toggleAttribute("data-show",!Q()&&!J())}isLockedOut(){return this.lockoutUntil>Date.now()}render(){return p`
      <div class="login-container">
        <div class="title">
          ${this.title}
          <qd-build-info></qd-build-info>
          <qd-help-trigger panelType="login" @qd:help-open=${this.handleHelpOpen}></qd-help-trigger>
        </div>

        ${this.sessionNotice?p`<div class="notice-message" role="status">${this.sessionNotice}</div>`:""}
        <form class="login-form" @submit=${t=>this.handleStudentLogin(t)}>
          <input
            type="text"
            name="name"
            placeholder="Name (J Smith)"
            aria-label="Name"
            aria-invalid=${this.fieldErrors.name?"true":"false"}
            .value=${this.name}
            @input=${t=>this.handleNameInput(t)}
            @blur=${()=>this.touch("name")}
            ?disabled=${this.isSubmitting}
            required
          />
          <input
            type="text"
            name="serviceId"
            placeholder="Service ID (30012345)"
            aria-label="Service ID"
            aria-invalid=${this.fieldErrors.serviceId?"true":"false"}
            .value=${this.serviceId}
            @input=${t=>this.handleServiceIdInput(t)}
            @blur=${()=>this.touch("serviceId")}
            ?disabled=${this.isSubmitting}
            pattern="[A-Za-z0-9]{2,10}"
            title="2-10 alphanumeric characters"
            required
          />
          <input
            type="password"
            name="pin"
            class="pin-input"
            placeholder=${this.pendingPin?"Re-enter PIN":"PIN (4 digits)"}
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            autocomplete="off"
            aria-label="Enter your 4-digit PIN"
            aria-invalid=${this.fieldErrors.pin?"true":"false"}
            .value=${this.pin}
            @input=${t=>this.handlePinInput(t)}
            @blur=${()=>this.touch("pin")}
            ?disabled=${this.isSubmitting||this.isLockedOut()}
            required
          />
          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting||!this.isValid()||this.isLockedOut()}
          >
            ${this.submitLabel}
          </button>
          <qd-instructor-login ?disabled=${this.isSubmitting}></qd-instructor-login>
          <div class="message-slot">
            ${this.errorMessage?p`<div class="error-message" role="alert">${this.errorMessage}</div>`:this.validationHint?p`<div class="hint-message" role="status">${this.validationHint}</div>`:""}
          </div>
          <qd-lockout-banner
            .untilMs=${this.lockoutUntil}
            @qd:lockout-expired=${this.handleLockoutExpired}
          ></qd-lockout-banner>
        </form>
      </div>
      <qd-help-popup
        .open=${this.helpOpen}
        .title=${N("login").title}
        .content=${N("login").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
      <qd-migration-dialog
        .open=${this.showMigrationDialog}
        .expected=${this.migrationError?.expected??"plain"}
        .found=${this.migrationError?.found??"plain"}
        .dbName=${this.pendingLoginData?.dbName??""}
        .releaseId=${this.pendingLoginData?.release??""}
        @qd:migration-complete=${this.handleMigrationComplete}
        @qd:migration-cancel=${this.handleMigrationCancel}
      ></qd-migration-dialog>
    `}handleNameInput(t){this.name=t.target.value,this.errorMessage="",this.touch("name")}handleServiceIdInput(t){this.serviceId=t.target.value,this.errorMessage="",this.touch("serviceId"),this.pendingPin="",this.scheduleRegistrationCheck()}scheduleRegistrationCheck(){window.clearTimeout(this.registrationTimer),this.isRegistered=null;const t=this.serviceId.trim();/^[a-zA-Z0-9]{2,10}$/.test(t)&&(this.registrationTimer=window.setTimeout(()=>{this.checkRegistration(t)},300))}async checkRegistration(t){let e=null;try{const i=x();e=i?await this.authService.isRegistered(t,i,S()):null}catch{e=null}t===this.serviceId.trim()&&(this.isRegistered=e)}get submitLabel(){return this.pendingPin?"Confirm":this.isRegistered===!1?"Create":"Login"}handlePinInput(t){this.pin=G(t.target.value),this.errorMessage="",this.touch("pin")}touch(t){this.touched.has(t)||(this.touched=new Set([...this.touched,t]))}get fieldErrors(){const t=D(this.name,this.serviceId,this.pin),e={};for(const i of this.touched)t[i]&&(e[i]=t[i]);return e}isValid(){return W(this.name,this.serviceId,this.pin).length===0}get validationHint(){return this.pendingPin?"Re-enter your PIN to confirm":!this.name&&!this.serviceId&&!this.pin?"":Object.values(D(this.name,this.serviceId,this.pin)).join(" · ")}async handleStudentLogin(t){if(t.preventDefault(),!this.isValid()){this.touched=new Set(["name","serviceId","pin"]),this.errorMessage="Please enter name, service ID, and 4-digit PIN";return}if(this.isRegistered===null&&!this.pendingPin&&await this.checkRegistration(this.serviceId.trim()),this.pendingPin){if(this.pin!==this.pendingPin){this.pendingPin="",this.pin="",this.errorMessage="PINs did not match. Please enter your PIN again.";return}this.pendingPin=""}else if(this.isRegistered===!1){this.pendingPin=this.pin,this.pin="",this.errorMessage="";return}this.isSubmitting=!0,this.errorMessage="";const e=x();if(!e){this.errorMessage="Release not found (missing publication title element)",this.isSubmitting=!1;return}const i=this.serviceId.trim(),s=this.name.trim(),n=S(),r=this.pin,o=await this.authService.loginStudent({serviceId:i,name:s,pin:r,release:e,dbName:n});if(o.kind==="needs-migration"){this.migrationError=o.error,this.pendingLoginData={serviceId:i,name:s,release:e,pin:r,dbName:n},this.showMigrationDialog=!0,this.isSubmitting=!1;return}this.applyLoginResult(o)}applyLoginResult(t){switch(t.kind){case"pin-created":this.dispatchPinEvent("qd:pin-created",t.serviceId),this.completeLogin(t.serviceId,t.name,t.release);break;case"pin-verified":this.dispatchPinEvent("qd:pin-verified",t.serviceId),this.completeLogin(t.serviceId,t.name,t.release);break;case"lockout":this.lockoutUntil=Date.now()+t.lockoutMs,this.errorMessage="",this.isSubmitting=!1;break;case"bad-pin":this.errorMessage=`Incorrect PIN. ${t.remaining} attempt${t.remaining!==1?"s":""} remaining`,this.pin="",this.isSubmitting=!1;break;case"error":this.errorMessage=t.message,this.isSubmitting=!1;break}}dispatchPinEvent(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{serviceId:e,timestamp:new Date().toISOString()},bubbles:!0,composed:!0}))}async retryLoginAfterMigration(t,e,i){this.isSubmitting=!0,this.errorMessage="";const s=await this.authService.retryAfterMigration({serviceId:t,name:e,pin:this.pin,release:i,dbName:S()});this.applyLoginResult(s)}completeLogin(t,e,i){new q().createSession(t,e,i);const s={serviceId:t,name:e,release:i,role:"student"};this.dispatchEvent(new CustomEvent("qd:login",{detail:s,bubbles:!0,composed:!0})),this.pin="",this.isSubmitting=!1,this.updateVisibility()}};a.styles=ot;l([L({type:String})],a.prototype,"title",2);l([d()],a.prototype,"name",2);l([d()],a.prototype,"serviceId",2);l([d()],a.prototype,"errorMessage",2);l([d()],a.prototype,"isSubmitting",2);l([d()],a.prototype,"pin",2);l([d()],a.prototype,"lockoutUntil",2);l([d()],a.prototype,"touched",2);l([d()],a.prototype,"isRegistered",2);l([d()],a.prototype,"pendingPin",2);l([d()],a.prototype,"helpOpen",2);l([d()],a.prototype,"sessionNotice",2);l([d()],a.prototype,"showMigrationDialog",2);l([d()],a.prototype,"migrationError",2);l([d()],a.prototype,"pendingLoginData",2);a=l([$("qd-login")],a);
