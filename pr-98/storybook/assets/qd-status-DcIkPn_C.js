import{i as u,a as g,x as b}from"./lit-element-DR9D0stx.js";import{t as v}from"./property-BRFVFa-w.js";import{r as i}from"./state-7B7Yt9om.js";import{g as c,S as p}from"./storage-helpers-D_wcwu-v.js";import{g as h,c as f,a as m,i as C,S as w}from"./help-content-OC8L37iC.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";var x=Object.defineProperty,S=Object.getOwnPropertyDescriptor,o=(e,t,n,r)=>{for(var a=r>1?void 0:r?S(t,n):t,l=e.length-1,d;l>=0;l--)(d=e[l])&&(a=(r?d(t,n,a):d(a))||a);return r&&a&&x(t,n,a),a};let s=class extends g{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.helpOpen=!1,this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleCacheRebuild=()=>{this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:cache-rebuild",this.handleCacheRebuild)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:cache-rebuild",this.handleCacheRebuild)}render(){const e=this.serviceId.slice(-4);return b`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${e}
          </span>
          <qd-help-trigger
            panelType="status"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
          <button class="logout-button" @click=${()=>this.handleLogout()}>Logout</button>
          <qd-build-info></qd-build-info>
        </div>
        <div class="bottom-row">
          <div class="status-indicator ${this.statusColor}"></div>
          <div class="progress-text">
            ${this.correct}/${this.total} Correct (${this.percentage}%)
          </div>
        </div>
      </div>
      <qd-help-popup
        .open=${this.helpOpen}
        .title=${h("status").title}
        .content=${h("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}loadCache(){const e=c(p.SESSION);e?(this.name=e.name||"",this.serviceId=e.serviceId||""):(this.name="",this.serviceId="");const t=c(p.CACHE);if(!t){this.total=0,this.correct=0,this.percentage=0,this.statusColor="red";return}this.total=t.totals.total,this.correct=t.totals.correct,this.percentage=f(t.totals.correct,t.totals.total),this.statusColor=this.calculateStatusColor(t.totals.total,t.totals.correct)}calculateStatusColor(e,t){return m(e,t)}updateVisibility(){this.toggleAttribute("data-show",C())}handleLogout(){const e=c(p.SESSION);new w().clearSession();const n=new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(n)}};s.styles=u`
    :host {
      display: none; /* Hidden by default, shown when logged in */
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }

    :host([data-show]) {
      display: block;
    }

    .status-panel {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .top-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bottom-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-info {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
    }

    .user-label {
      font-weight: 500;
      color: #555;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.red {
      background: #d32f2f;
    }

    .status-indicator.amber {
      background: #ff9800;
    }

    .status-indicator.green {
      background: #4caf50;
    }

    .progress-label {
      font-size: 13px;
      font-weight: 500;
      color: #555;
      white-space: nowrap;
    }

    .progress-text {
      font-size: 13px;
      color: #333;
      white-space: nowrap;
    }

    .logout-button {
      padding: 5px 10px;
      background: #d32f2f;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      white-space: nowrap;
    }

    .logout-button:hover {
      background: #b71c1c;
    }
  `;o([i()],s.prototype,"total",2);o([i()],s.prototype,"correct",2);o([i()],s.prototype,"percentage",2);o([i()],s.prototype,"statusColor",2);o([i()],s.prototype,"name",2);o([i()],s.prototype,"serviceId",2);o([i()],s.prototype,"helpOpen",2);s=o([v("qd-status")],s);
