import{i as k,a as P,x as h}from"./lit-element-DR9D0stx.js";import{n as I,t as M}from"./property-BRFVFa-w.js";import{r as l}from"./state-7B7Yt9om.js";import{S as N,h as j,g as C}from"./help-content-OC8L37iC.js";import{R as F,g as X,v as K,r as S,b as v}from"./instructor-auth-Dkd1BrSp.js";import{P as p,S as O,b as Q}from"./storage-helpers-D_wcwu-v.js";import{g as D,h as E,n as q,c as B,S as J}from"./migration-D_yK0_mn.js";import{w as Z,m as y,i as R}from"./logger-DdbYlyfi.js";import"./qd-password-modal-BO6kslGq.js";import"./qd-confirm-dialog-DChDrNIs.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";import"./qd-migration-dialog-Ckz8R3ku.js";const Y=k`
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

    .hint-message {
      width: 100%;
      color: #555;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #f1f3f4;
      border-radius: 3px;
      border-left: 3px solid #9aa0a6;
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

    /* Responsive */
    @media (max-width: 600px) {
      .login-form {
        flex-direction: column;
      }

      input,
      button {
        width: 100%;
      }
`;function A(t,e,i){const n=[];return(!t||t.trim()==="")&&n.push("Name required"),e?/^[a-zA-Z0-9]{2,10}$/.test(e)||n.push("Service ID must be 2-10 alphanumeric characters"):n.push("Service ID required"),i?/^\d{4}$/.test(i)||n.push("PIN must be exactly 4 digits"):n.push("PIN required"),n}function G(t){return t.replace(/\D/g,"")}async function x(t){const i=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",i);return Array.from(new Uint8Array(n)).map(r=>r.toString(16).padStart(2,"0")).join("")}async function W(t,e){const i=await x(t);return tt(i,e)}function tt(t,e){if(t.length!==e.length)return!1;let i=0;for(let n=0;n<t.length;n++)i|=t.charCodeAt(n)^e.charCodeAt(n);return i===0}function L(t){return`${O.PIN_ATTEMPTS}:${t}`}function b(t){const e=L(t),i=sessionStorage.getItem(e);if(!i)return null;try{return JSON.parse(i)}catch{return null}}function _(t){const e=b(t);if(!e||!e.lockoutUntil)return{isLocked:!1,remainingMs:0};const i=new Date(e.lockoutUntil).getTime(),n=Date.now();return i>n?{isLocked:!0,remainingMs:i-n}:(U(t),{isLocked:!1,remainingMs:0})}function et(t){const e=new Date().toISOString();let i=b(t);if(i||(i={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:e}),i.attempts+=1,i.lastAttempt=e,i.attempts>=p.MAX_ATTEMPTS){const s=new Date(Date.now()+p.LOCKOUT_MS);i.lockoutUntil=s.toISOString(),Z(`PIN lockout triggered for ${y(t)} after ${i.attempts} failed attempts`)}else R(`Failed PIN attempt ${i.attempts}/${p.MAX_ATTEMPTS} for ${y(t)}`);const n=L(t);return sessionStorage.setItem(n,JSON.stringify(i)),i}function U(t){const e=b(t);e&&e.attempts>0&&R(`Cleared ${e.attempts} failed PIN attempts for ${y(t)} on successful login`);const i=L(t);sessionStorage.removeItem(i)}function it(t){const e=b(t);return e?_(t).isLocked?0:Math.max(0,p.MAX_ATTEMPTS-e.attempts):p.MAX_ATTEMPTS}class nt{loginStudent(e){return this.runLogin(e,{checkLock:!0,surfaceMigration:!0,errorMessage:"Login failed. Please try again.",errorLabel:"Student login error:"})}retryAfterMigration(e){return this.runLogin(e,{checkLock:!1,surfaceMigration:!1,errorMessage:"Login failed after migration. Please try again.",errorLabel:"Post-migration login error:"})}async isRegistered(e,i,n){try{const s=D(n);await s.init();const r=await s.getStudent(i,e);return r?E(r)&&!q(r):!1}catch{return null}}async runLogin(e,i){const{serviceId:n,name:s,pin:r,release:o,dbName:H}=e;if(i.checkLock){const c=_(n);if(c.isLocked)return{kind:"lockout",lockoutMs:c.remainingMs}}try{const c=D(H);await c.init();const g=await c.getStudent(o,n);if(g){if(q(g)||!E(g)){const f=await x(r),T=B(g,f);return await c.saveStudent(T),{kind:"pin-created",serviceId:n,name:s,release:o}}if(!await W(r,g.pinHash||"")){const f=et(n);return f.lockoutUntil?{kind:"lockout",lockoutMs:new Date(f.lockoutUntil).getTime()-Date.now()}:{kind:"bad-pin",remaining:it(n)}}return U(n),{kind:"pin-verified",serviceId:n,name:s,release:o}}const z=await x(r),V={schema:Q,docId:"",release:o,serviceId:n,name:s,attempted:0,correct:0,updated:new Date().toISOString(),pages:{},pinHash:z,pinCreatedAt:new Date().toISOString()};return await c.saveStudent(V),{kind:"pin-created",serviceId:n,name:s,release:o}}catch(c){return i.surfaceMigration&&c instanceof J?{kind:"needs-migration",error:c}:(console.error(i.errorLabel,c),{kind:"error",message:i.errorMessage})}}}var st=Object.defineProperty,rt=Object.getOwnPropertyDescriptor,w=(t,e,i,n)=>{for(var s=n>1?void 0:n?rt(e,i):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(s=(n?o(e,i,s):o(s))||s);return n&&s&&st(e,i,s),s};let u=class extends P{constructor(){super(...arguments),this.disabled=!1,this.showModal=!1,this.error="",this.rateLimiter=new F(p.MAX_ATTEMPTS-1),this.open=()=>{this.showModal=!0,this.error=""},this.handleClose=()=>{this.showModal=!1,this.error=""},this.handleSubmit=t=>{this.login(t.detail.password)}}render(){return h`
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
    `}async login(t){if(!X()){this.error="Instructor password not configured";return}if(!this.rateLimiter.attempt()){this.error=`Too many attempts. Try again in ${this.rateLimiter.getRemainingSeconds()}s`;return}try{if(!await K(t)){this.rateLimiter.recordFailure(),this.error="Incorrect password";return}this.rateLimiter.reset();const i=S();new N().createSession("INSTRUCTOR","Instructor",i||""),sessionStorage.setItem(O.INSTRUCTOR,"true"),this.dispatchEvent(new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:i||"",role:"instructor"},bubbles:!0,composed:!0})),this.showModal=!1,this.error=""}catch(i){this.error="Login failed. Please try again.",console.error("Instructor login error:",i)}}};u.styles=k`
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
  `;w([I({type:Boolean})],u.prototype,"disabled",2);w([l()],u.prototype,"showModal",2);w([l()],u.prototype,"error",2);u=w([M("qd-instructor-login")],u);var ot=Object.defineProperty,at=Object.getOwnPropertyDescriptor,$=(t,e,i,n)=>{for(var s=n>1?void 0:n?at(e,i):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(s=(n?o(e,i,s):o(s))||s);return n&&s&&ot(e,i,s),s};let m=class extends P{constructor(){super(...arguments),this.untilMs=0,this.seconds=0,this.interval=null}disconnectedCallback(){super.disconnectedCallback(),this.clearTimer()}willUpdate(t){if(t.has("untilMs")){const e=this.untilMs-Date.now();this.seconds=e>0?Math.ceil(e/1e3):0}}updated(t){t.has("untilMs")&&this.startTimer()}render(){return this.seconds<=0?h``:h`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
      Too many attempts. Try again in ${this.seconds}s
    </div>`}startTimer(){this.clearTimer(),!(this.seconds<=0)&&(this.interval=window.setInterval(()=>{this.seconds--,this.seconds<=0&&(this.clearTimer(),this.dispatchEvent(new CustomEvent("qd:lockout-expired",{bubbles:!0,composed:!0})))},1e3))}clearTimer(){this.interval&&(clearInterval(this.interval),this.interval=null)}};m.styles=k`
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
  `;$([I({type:Number})],m.prototype,"untilMs",2);$([l()],m.prototype,"seconds",2);m=$([M("qd-lockout-banner")],m);var lt=Object.defineProperty,dt=Object.getOwnPropertyDescriptor,d=(t,e,i,n)=>{for(var s=n>1?void 0:n?dt(e,i):e,r=t.length-1,o;r>=0;r--)(o=t[r])&&(s=(n?o(e,i,s):o(s))||s);return n&&s&&lt(e,i,s),s};let a=class extends P{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.isRegistered=null,this.pendingPin="",this.helpOpen=!1,this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.authService=new nt,this.handleLoginEvent=()=>{this.updateVisibility()},this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.isRegistered=null,this.pendingPin="",this.updateVisibility()},this.handleLockoutExpired=()=>{this.lockoutUntil=0},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1},this.handleMigrationComplete=()=>{if(this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData){const{serviceId:t,name:e,release:i}=this.pendingLoginData;this.pendingLoginData=null,this.retryLoginAfterMigration(t,e,i)}},this.handleMigrationCancel=()=>{this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.errorMessage="Data migration cancelled. Please contact your instructor for assistance.",this.isSubmitting=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:login",this.handleLoginEvent)}disconnectedCallback(){super.disconnectedCallback(),window.clearTimeout(this.registrationTimer),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:login",this.handleLoginEvent)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){this.toggleAttribute("data-show",!j())}isLockedOut(){return this.lockoutUntil>Date.now()}render(){return h`
      <div class="login-container">
        <div class="title">
          ${this.title}
          <qd-build-info></qd-build-info>
          <qd-help-trigger panelType="login" @qd:help-open=${this.handleHelpOpen}></qd-help-trigger>
        </div>

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
            placeholder=${this.pendingPin?"Re-enter PIN":"PIN (4 digits)"}
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            autocomplete="off"
            aria-label="Enter your 4-digit PIN"
            .value=${this.pin}
            @input=${t=>this.handlePinInput(t)}
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
          ${this.errorMessage?h`<div class="error-message">${this.errorMessage}</div>`:this.validationHint?h`<div class="hint-message" role="status">${this.validationHint}</div>`:""}
          <qd-lockout-banner
            .untilMs=${this.lockoutUntil}
            @qd:lockout-expired=${this.handleLockoutExpired}
          ></qd-lockout-banner>
        </form>
      </div>
      <qd-confirm-dialog
        .open=${this.showPinConfirmation}
        title="PIN Stored"
        message="Your PIN has been saved. Use it with your name and service ID on future logins."
        confirmText="OK"
        cancelText=""
        @qd:confirm=${this.handlePinConfirmationDismiss}
        @qd:cancel=${this.handlePinConfirmationDismiss}
      ></qd-confirm-dialog>
      <qd-help-popup
        .open=${this.helpOpen}
        .title=${C("login").title}
        .content=${C("login").body}
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
    `}handleNameInput(t){this.name=t.target.value,this.errorMessage=""}handleServiceIdInput(t){this.serviceId=t.target.value,this.errorMessage="",this.pendingPin="",this.scheduleRegistrationCheck()}scheduleRegistrationCheck(){window.clearTimeout(this.registrationTimer),this.isRegistered=null;const t=this.serviceId.trim();/^[a-zA-Z0-9]{2,10}$/.test(t)&&(this.registrationTimer=window.setTimeout(()=>{this.checkRegistration(t)},300))}async checkRegistration(t){let e=null;try{const i=S();e=i?await this.authService.isRegistered(t,i,v()):null}catch{e=null}t===this.serviceId.trim()&&(this.isRegistered=e)}get submitLabel(){return this.pendingPin?"Confirm":this.isRegistered===!1?"Create":"Login"}handlePinInput(t){this.pin=G(t.target.value),this.errorMessage=""}isValid(){return A(this.name,this.serviceId,this.pin).length===0}get validationHint(){return this.pendingPin?"Re-enter your PIN to confirm":!this.name&&!this.serviceId&&!this.pin?"":A(this.name,this.serviceId,this.pin)[0]??""}async handleStudentLogin(t){if(t.preventDefault(),!this.isValid()){this.errorMessage="Please enter name, service ID, and 4-digit PIN";return}if(this.isRegistered===null&&!this.pendingPin&&await this.checkRegistration(this.serviceId.trim()),this.pendingPin){if(this.pin!==this.pendingPin){this.pendingPin="",this.pin="",this.errorMessage="PINs did not match. Please enter your PIN again.";return}this.pendingPin=""}else if(this.isRegistered===!1){this.pendingPin=this.pin,this.pin="",this.errorMessage="";return}this.isSubmitting=!0,this.errorMessage="";const e=S();if(!e){this.errorMessage="Release not found (missing publication title element)",this.isSubmitting=!1;return}const i=this.serviceId.trim(),n=this.name.trim(),s=v(),r=this.pin,o=await this.authService.loginStudent({serviceId:i,name:n,pin:r,release:e,dbName:s});if(o.kind==="needs-migration"){this.migrationError=o.error,this.pendingLoginData={serviceId:i,name:n,release:e,pin:r,dbName:s},this.showMigrationDialog=!0,this.isSubmitting=!1;return}this.applyLoginResult(o)}applyLoginResult(t){switch(t.kind){case"pin-created":this.dispatchPinEvent("qd:pin-created",t.serviceId),this.showPinStoredConfirmation(),this.completeLogin(t.serviceId,t.name,t.release);break;case"pin-verified":this.dispatchPinEvent("qd:pin-verified",t.serviceId),this.completeLogin(t.serviceId,t.name,t.release);break;case"lockout":this.lockoutUntil=Date.now()+t.lockoutMs,this.errorMessage="",this.isSubmitting=!1;break;case"bad-pin":this.errorMessage=`Incorrect PIN. ${t.remaining} attempt${t.remaining!==1?"s":""} remaining`,this.pin="",this.isSubmitting=!1;break;case"error":this.errorMessage=t.message,this.isSubmitting=!1;break}}dispatchPinEvent(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{serviceId:e,timestamp:new Date().toISOString()},bubbles:!0,composed:!0}))}showPinStoredConfirmation(){this.showPinConfirmation=!0}async retryLoginAfterMigration(t,e,i){this.isSubmitting=!0,this.errorMessage="";const n=await this.authService.retryAfterMigration({serviceId:t,name:e,pin:this.pin,release:i,dbName:v()});this.applyLoginResult(n)}completeLogin(t,e,i){new N().createSession(t,e,i);const n={serviceId:t,name:e,release:i,role:"student"};this.dispatchEvent(new CustomEvent("qd:login",{detail:n,bubbles:!0,composed:!0})),this.pin="",this.isSubmitting=!1,this.updateVisibility()}};a.styles=Y;d([I({type:String})],a.prototype,"title",2);d([l()],a.prototype,"name",2);d([l()],a.prototype,"serviceId",2);d([l()],a.prototype,"errorMessage",2);d([l()],a.prototype,"isSubmitting",2);d([l()],a.prototype,"pin",2);d([l()],a.prototype,"lockoutUntil",2);d([l()],a.prototype,"showPinConfirmation",2);d([l()],a.prototype,"isRegistered",2);d([l()],a.prototype,"pendingPin",2);d([l()],a.prototype,"helpOpen",2);d([l()],a.prototype,"showMigrationDialog",2);d([l()],a.prototype,"migrationError",2);d([l()],a.prototype,"pendingLoginData",2);a=d([M("qd-login")],a);
