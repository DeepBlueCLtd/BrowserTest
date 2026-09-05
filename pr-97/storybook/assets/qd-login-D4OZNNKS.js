import{i as y,a as x,x as g}from"./lit-element-DR9D0stx.js";import{n as k,t as M}from"./property-BRFVFa-w.js";import{r as l}from"./state-7B7Yt9om.js";import{S as T,h as U,g as $}from"./help-content-OC8L37iC.js";import{R as H,g as z,v as V,r as C,b as D}from"./instructor-auth-Dkd1BrSp.js";import{P as p,S as E,b as j}from"./storage-helpers-D_wcwu-v.js";import{g as F,n as X,h as K,c as Q,S as B}from"./migration-D_yK0_mn.js";import{w as J,m as v,i as q}from"./logger-DdbYlyfi.js";import"./qd-password-modal-BO6kslGq.js";import"./qd-confirm-dialog-DChDrNIs.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";import"./qd-migration-dialog-Ckz8R3ku.js";const Y=y`
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

    /* Responsive */
    @media (max-width: 600px) {
      .login-form {
        flex-direction: column;
      }

      input,
      button {
        width: 100%;
      }
`;function Z(t,e,i){const n=[];return(!t||t.trim()==="")&&n.push("Name required"),e?/^[a-zA-Z0-9]{2,10}$/.test(e)||n.push("Service ID must be 2-10 alphanumeric characters"):n.push("Service ID required"),i?/^\d{4}$/.test(i)||n.push("PIN must be exactly 4 digits"):n.push("PIN required"),n}function G(t){return t.replace(/\D/g,"")}async function S(t){const i=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",i);return Array.from(new Uint8Array(n)).map(o=>o.toString(16).padStart(2,"0")).join("")}async function W(t,e){const i=await S(t);return tt(i,e)}function tt(t,e){if(t.length!==e.length)return!1;let i=0;for(let n=0;n<t.length;n++)i|=t.charCodeAt(n)^e.charCodeAt(n);return i===0}function I(t){return`${E.PIN_ATTEMPTS}:${t}`}function b(t){const e=I(t),i=sessionStorage.getItem(e);if(!i)return null;try{return JSON.parse(i)}catch{return null}}function A(t){const e=b(t);if(!e||!e.lockoutUntil)return{isLocked:!1,remainingMs:0};const i=new Date(e.lockoutUntil).getTime(),n=Date.now();return i>n?{isLocked:!0,remainingMs:i-n}:(O(t),{isLocked:!1,remainingMs:0})}function et(t){const e=new Date().toISOString();let i=b(t);if(i||(i={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:e}),i.attempts+=1,i.lastAttempt=e,i.attempts>=p.MAX_ATTEMPTS){const r=new Date(Date.now()+p.LOCKOUT_MS);i.lockoutUntil=r.toISOString(),J(`PIN lockout triggered for ${v(t)} after ${i.attempts} failed attempts`)}else q(`Failed PIN attempt ${i.attempts}/${p.MAX_ATTEMPTS} for ${v(t)}`);const n=I(t);return sessionStorage.setItem(n,JSON.stringify(i)),i}function O(t){const e=b(t);e&&e.attempts>0&&q(`Cleared ${e.attempts} failed PIN attempts for ${v(t)} on successful login`);const i=I(t);sessionStorage.removeItem(i)}function it(t){const e=b(t);return e?A(t).isLocked?0:Math.max(0,p.MAX_ATTEMPTS-e.attempts):p.MAX_ATTEMPTS}class nt{loginStudent(e){return this.runLogin(e,{checkLock:!0,surfaceMigration:!0,errorMessage:"Login failed. Please try again.",errorLabel:"Student login error:"})}retryAfterMigration(e){return this.runLogin(e,{checkLock:!1,surfaceMigration:!1,errorMessage:"Login failed after migration. Please try again.",errorLabel:"Post-migration login error:"})}async runLogin(e,i){const{serviceId:n,name:r,pin:o,release:s,dbName:N}=e;if(i.checkLock){const c=A(n);if(c.isLocked)return{kind:"lockout",lockoutMs:c.remainingMs}}try{const c=F(N);await c.init();const u=await c.getStudent(s,n);if(u){if(X(u)||!K(u)){const f=await S(o),P=Q(u,f);return await c.saveStudent(P),{kind:"pin-created",serviceId:n,name:r,release:s}}if(!await W(o,u.pinHash||"")){const f=et(n);return f.lockoutUntil?{kind:"lockout",lockoutMs:new Date(f.lockoutUntil).getTime()-Date.now()}:{kind:"bad-pin",remaining:it(n)}}return O(n),{kind:"pin-verified",serviceId:n,name:r,release:s}}const _=await S(o),R={schema:j,docId:"",release:s,serviceId:n,name:r,attempted:0,correct:0,updated:new Date().toISOString(),pages:{},pinHash:_,pinCreatedAt:new Date().toISOString()};return await c.saveStudent(R),{kind:"pin-created",serviceId:n,name:r,release:s}}catch(c){return i.surfaceMigration&&c instanceof B?{kind:"needs-migration",error:c}:(console.error(i.errorLabel,c),{kind:"error",message:i.errorMessage})}}}var rt=Object.defineProperty,st=Object.getOwnPropertyDescriptor,w=(t,e,i,n)=>{for(var r=n>1?void 0:n?st(e,i):e,o=t.length-1,s;o>=0;o--)(s=t[o])&&(r=(n?s(e,i,r):s(r))||r);return n&&r&&rt(e,i,r),r};let h=class extends x{constructor(){super(...arguments),this.disabled=!1,this.showModal=!1,this.error="",this.rateLimiter=new H(p.MAX_ATTEMPTS-1),this.open=()=>{this.showModal=!0,this.error=""},this.handleClose=()=>{this.showModal=!1,this.error=""},this.handleSubmit=t=>{this.login(t.detail.password)}}render(){return g`
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
    `}async login(t){if(!z()){this.error="Instructor password not configured";return}if(!this.rateLimiter.attempt()){this.error=`Too many attempts. Try again in ${this.rateLimiter.getRemainingSeconds()}s`;return}try{if(!await V(t)){this.rateLimiter.recordFailure(),this.error="Incorrect password";return}this.rateLimiter.reset();const i=C();new T().createSession("INSTRUCTOR","Instructor",i||""),sessionStorage.setItem(E.INSTRUCTOR,"true"),this.dispatchEvent(new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:i||"",role:"instructor"},bubbles:!0,composed:!0})),this.showModal=!1,this.error=""}catch(i){this.error="Login failed. Please try again.",console.error("Instructor login error:",i)}}};h.styles=y`
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
  `;w([k({type:Boolean})],h.prototype,"disabled",2);w([l()],h.prototype,"showModal",2);w([l()],h.prototype,"error",2);h=w([M("qd-instructor-login")],h);var ot=Object.defineProperty,at=Object.getOwnPropertyDescriptor,L=(t,e,i,n)=>{for(var r=n>1?void 0:n?at(e,i):e,o=t.length-1,s;o>=0;o--)(s=t[o])&&(r=(n?s(e,i,r):s(r))||r);return n&&r&&ot(e,i,r),r};let m=class extends x{constructor(){super(...arguments),this.untilMs=0,this.seconds=0,this.interval=null}disconnectedCallback(){super.disconnectedCallback(),this.clearTimer()}willUpdate(t){if(t.has("untilMs")){const e=this.untilMs-Date.now();this.seconds=e>0?Math.ceil(e/1e3):0}}updated(t){t.has("untilMs")&&this.startTimer()}render(){return this.seconds<=0?g``:g`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
      Too many attempts. Try again in ${this.seconds}s
    </div>`}startTimer(){this.clearTimer(),!(this.seconds<=0)&&(this.interval=window.setInterval(()=>{this.seconds--,this.seconds<=0&&(this.clearTimer(),this.dispatchEvent(new CustomEvent("qd:lockout-expired",{bubbles:!0,composed:!0})))},1e3))}clearTimer(){this.interval&&(clearInterval(this.interval),this.interval=null)}};m.styles=y`
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
  `;L([k({type:Number})],m.prototype,"untilMs",2);L([l()],m.prototype,"seconds",2);m=L([M("qd-lockout-banner")],m);var lt=Object.defineProperty,dt=Object.getOwnPropertyDescriptor,d=(t,e,i,n)=>{for(var r=n>1?void 0:n?dt(e,i):e,o=t.length-1,s;o>=0;o--)(s=t[o])&&(r=(n?s(e,i,r):s(r))||r);return n&&r&&lt(e,i,r),r};let a=class extends x{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.authService=new nt,this.handleLoginEvent=()=>{this.updateVisibility()},this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.updateVisibility()},this.handleLockoutExpired=()=>{this.lockoutUntil=0},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1},this.handleMigrationComplete=()=>{if(this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData){const{serviceId:t,name:e,release:i}=this.pendingLoginData;this.pendingLoginData=null,this.retryLoginAfterMigration(t,e,i)}},this.handleMigrationCancel=()=>{this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.errorMessage="Data migration cancelled. Please contact your instructor for assistance.",this.isSubmitting=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:login",this.handleLoginEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:login",this.handleLoginEvent)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){this.toggleAttribute("data-show",!U())}isLockedOut(){return this.lockoutUntil>Date.now()}render(){return g`
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
            placeholder="PIN"
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
            Login
          </button>
          <qd-instructor-login ?disabled=${this.isSubmitting}></qd-instructor-login>
          ${this.errorMessage?g`<div class="error-message">${this.errorMessage}</div>`:""}
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
        .title=${$("login").title}
        .content=${$("login").body}
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
    `}handleNameInput(t){this.name=t.target.value,this.errorMessage=""}handleServiceIdInput(t){this.serviceId=t.target.value,this.errorMessage=""}handlePinInput(t){this.pin=G(t.target.value),this.errorMessage=""}isValid(){return Z(this.name,this.serviceId,this.pin).length===0}async handleStudentLogin(t){if(t.preventDefault(),!this.isValid()){this.errorMessage="Please enter name, service ID, and 4-digit PIN";return}this.isSubmitting=!0,this.errorMessage="";const e=C();if(!e){this.errorMessage="Release not found (missing publication title element)",this.isSubmitting=!1;return}const i=this.serviceId.trim(),n=this.name.trim(),r=D(),o=this.pin,s=await this.authService.loginStudent({serviceId:i,name:n,pin:o,release:e,dbName:r});if(s.kind==="needs-migration"){this.migrationError=s.error,this.pendingLoginData={serviceId:i,name:n,release:e,pin:o,dbName:r},this.showMigrationDialog=!0,this.isSubmitting=!1;return}this.applyLoginResult(s)}applyLoginResult(t){switch(t.kind){case"pin-created":this.dispatchPinEvent("qd:pin-created",t.serviceId),this.showPinStoredConfirmation(),this.completeLogin(t.serviceId,t.name,t.release);break;case"pin-verified":this.dispatchPinEvent("qd:pin-verified",t.serviceId),this.completeLogin(t.serviceId,t.name,t.release);break;case"lockout":this.lockoutUntil=Date.now()+t.lockoutMs,this.errorMessage="",this.isSubmitting=!1;break;case"bad-pin":this.errorMessage=`Incorrect PIN. ${t.remaining} attempt${t.remaining!==1?"s":""} remaining`,this.pin="",this.isSubmitting=!1;break;case"error":this.errorMessage=t.message,this.isSubmitting=!1;break}}dispatchPinEvent(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{serviceId:e,timestamp:new Date().toISOString()},bubbles:!0,composed:!0}))}showPinStoredConfirmation(){this.showPinConfirmation=!0}async retryLoginAfterMigration(t,e,i){this.isSubmitting=!0,this.errorMessage="";const n=await this.authService.retryAfterMigration({serviceId:t,name:e,pin:this.pin,release:i,dbName:D()});this.applyLoginResult(n)}completeLogin(t,e,i){new T().createSession(t,e,i);const n={serviceId:t,name:e,release:i,role:"student"};this.dispatchEvent(new CustomEvent("qd:login",{detail:n,bubbles:!0,composed:!0})),this.pin="",this.isSubmitting=!1,this.updateVisibility()}};a.styles=Y;d([k({type:String})],a.prototype,"title",2);d([l()],a.prototype,"name",2);d([l()],a.prototype,"serviceId",2);d([l()],a.prototype,"errorMessage",2);d([l()],a.prototype,"isSubmitting",2);d([l()],a.prototype,"pin",2);d([l()],a.prototype,"lockoutUntil",2);d([l()],a.prototype,"showPinConfirmation",2);d([l()],a.prototype,"helpOpen",2);d([l()],a.prototype,"showMigrationDialog",2);d([l()],a.prototype,"migrationError",2);d([l()],a.prototype,"pendingLoginData",2);a=d([M("qd-login")],a);
