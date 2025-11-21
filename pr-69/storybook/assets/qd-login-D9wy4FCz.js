import{i as y,a as w,x as b}from"./lit-element-CSmQN0ht.js";import{n as I,t as E}from"./property-Cqq8i_uy.js";import{r as p}from"./state-BjYqokDn.js";import{g as S,S as x}from"./storage-helpers-B4dxqHb-.js";import{S as f}from"./session-BjIMOy9d.js";const v={titleSelector:"qd-title-selector",instructorHash:"qd-instructor-hash"};var M=Object.defineProperty,C=Object.getOwnPropertyDescriptor,l=(t,e,s,r)=>{for(var o=r>1?void 0:r?C(e,s):e,i=t.length-1,n;i>=0;i--)(n=t[i])&&(o=(r?n(e,s,o):n(o))||o);return r&&o&&M(e,s,o),o};let a=class extends w{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.instructorPassword="",this.showInstructorModal=!1,this.modalOverlay=null,this.modalErrorDiv=null,this.modalPasswordInput=null,this.errorMessage="",this.isSubmitting=!1,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.instructorPassword="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.cleanupModal(),this.updateVisibility()},this.handleEscape=t=>{t.key==="Escape"&&this.showInstructorModal&&this.closeInstructorModal()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("keydown",this.handleEscape),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.cleanupModal()}cleanupModal(){this.modalOverlay&&(this.modalOverlay.remove(),this.modalOverlay=null),this.modalErrorDiv=null,this.modalPasswordInput=null}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){S(x.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return b`
      <div class="login-container">
        <div class="title">${this.title}</div>

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

          <button type="submit" class="login-btn" ?disabled=${this.isSubmitting||!this.isValid()}>
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

          ${this.errorMessage?b`<div class="error-message">${this.errorMessage}</div>`:""}
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
    `;const s=document.createElement("div");s.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    `;const r=document.createElement("h3");r.textContent="Instructor Login",r.style.cssText="font-size: 18px; font-weight: 600; color: #333; margin: 0;";const o=document.createElement("button");o.textContent="×",o.type="button",o.style.cssText=`
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
    `,o.onclick=()=>this.closeInstructorModal(),s.appendChild(r),s.appendChild(o);const i=document.createElement("form"),n=document.createElement("div");n.style.marginBottom="20px";const d=document.createElement("input");d.id="qd-instructor-password",d.type="password",d.placeholder="Password",d.required=!0,d.style.cssText=`
      width: 100%;
      box-sizing: border-box;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: auto;
      position: relative;
      z-index: 1;
    `,d.oninput=c=>{this.instructorPassword=c.target.value,this.modalErrorDiv&&(this.modalErrorDiv.style.display="none",this.modalErrorDiv.textContent="")},n.appendChild(d),this.modalPasswordInput=d;const m=document.createElement("div");m.id="qd-instructor-modal-error",m.style.cssText=`
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 4px 8px;
      background: #ffebee;
      border-radius: 3px;
      border-left: 3px solid #d32f2f;
      display: none;
    `,n.appendChild(m),this.modalErrorDiv=m;const g=document.createElement("div");g.style.cssText="display: flex; gap: 8px; justify-content: flex-end;";const u=document.createElement("button");u.textContent="Cancel",u.type="button",u.style.cssText=`
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
    `,u.onclick=()=>this.closeInstructorModal();const h=document.createElement("button");h.id="qd-instructor-submit",h.textContent="Login",h.type="submit",h.style.cssText=`
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
    `,g.appendChild(u),g.appendChild(h),i.appendChild(n),i.appendChild(g),i.onsubmit=c=>{c.preventDefault(),this.handleInstructorLogin(c)},e.appendChild(s),e.appendChild(i),t.appendChild(e),t.onclick=c=>{c.target===t&&this.closeInstructorModal()},document.body.appendChild(t),this.modalOverlay=t,setTimeout(()=>d.focus(),50)}handleNameInput(t){const e=t.target;this.name=e.value,this.errorMessage=""}handleServiceIdInput(t){const e=t.target;this.serviceId=e.value,this.errorMessage=""}isValid(){const t=this.name.trim(),e=this.serviceId.trim();return!(!t||!/^[A-Za-z0-9]{2,10}$/.test(e))}getRelease(){const e=document.getElementById(v.titleSelector)?.textContent?.trim()||".wh_publication_title .title";return document.querySelector(e)?.textContent?.trim()||""}handleStudentLogin(t){if(t.preventDefault(),!this.isValid()){this.errorMessage="Please enter valid name and service ID (2-10 alphanumeric)";return}this.isSubmitting=!0,this.errorMessage="";try{const e=this.getRelease();if(!e){this.errorMessage="Release not found (missing publication title element)",this.isSubmitting=!1;return}new f().createSession(this.serviceId.trim(),this.name.trim(),e);const r={serviceId:this.serviceId.trim(),name:this.name.trim(),release:e,role:"student"},o=new CustomEvent("qd:login",{detail:r,bubbles:!0,composed:!0});this.dispatchEvent(o),this.updateVisibility()}catch(e){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",e),this.isSubmitting=!1}}openInstructorModal(){this.showInstructorModal=!0,this.instructorPassword="",this.renderInstructorModalToBody()}closeInstructorModal(){this.showInstructorModal=!1,this.instructorPassword="",this.cleanupModal()}async hashPassword(t){const s=new TextEncoder().encode(t),r=await crypto.subtle.digest("SHA-256",s);return Array.from(new Uint8Array(r)).map(i=>i.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){return document.getElementById(v.instructorHash)?.textContent?.trim()||""}showModalError(t){this.modalErrorDiv&&(this.modalErrorDiv.textContent=t,this.modalErrorDiv.style.display="block")}async handleInstructorLogin(t){if(t.preventDefault(),!this.instructorPassword){this.showModalError("Password is required");return}try{const e=await this.hashPassword(this.instructorPassword),s=this.getExpectedHash();if(!s){this.showModalError("Instructor password not configured");return}if(e!==s){this.showModalError("Incorrect password"),this.instructorPassword="",this.modalPasswordInput&&(this.modalPasswordInput.value="",this.modalPasswordInput.focus());return}const r=this.getRelease();new f().createSession("INSTRUCTOR","Instructor",r||""),sessionStorage.setItem(x.INSTRUCTOR,"true");const i={serviceId:"INSTRUCTOR",name:"Instructor",release:r||"",role:"instructor"},n=new CustomEvent("qd:login",{detail:i,bubbles:!0,composed:!0});this.dispatchEvent(n),this.closeInstructorModal(),this.updateVisibility()}catch(e){this.showModalError("Login failed. Please try again."),console.error("Instructor login error:",e)}}};a.styles=y`
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
  `;l([I({type:String})],a.prototype,"title",2);l([p()],a.prototype,"name",2);l([p()],a.prototype,"serviceId",2);l([p()],a.prototype,"instructorPassword",2);l([p()],a.prototype,"showInstructorModal",2);l([p()],a.prototype,"errorMessage",2);l([p()],a.prototype,"isSubmitting",2);a=l([E("qd-login")],a);
