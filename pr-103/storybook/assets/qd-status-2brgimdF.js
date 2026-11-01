import{i as u,a as g,x as b}from"./lit-element-DR9D0stx.js";import{t as m}from"./property-BRFVFa-w.js";import{r as n}from"./state-7B7Yt9om.js";import{g as c,S as h}from"./storage-helpers-h0mJMTqi.js";import{i as f}from"./session-state-Cbzz7Lnd.js";import{f as v,g as p,c as w,S as C}from"./help-content-B3n3zGYG.js";import{r as x}from"./dom-config-reader-DImSGrCl.js";import"./qd-help-trigger-DqOyfU8-.js";import"./qd-help-popup-DyrM3QuK.js";var q=Object.defineProperty,y=Object.getOwnPropertyDescriptor,o=(e,s,a,r)=>{for(var i=r>1?void 0:r?y(s,a):s,d=e.length-1,l;d>=0;d--)(l=e[d])&&(i=(r?l(s,a,i):l(i))||i);return r&&i&&q(s,a,i),i};let t=class extends g{constructor(){super(...arguments),this.answered=0,this.correct=0,this.questionTotal=void 0,this.statusColor="red",this.name="",this.serviceId="",this.helpOpen=!1,this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleCacheRebuild=()=>{this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:cache-rebuild",this.handleCacheRebuild)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:cache-rebuild",this.handleCacheRebuild)}render(){const e=this.serviceId.slice(-4);return b`
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
            ${v(this.answered,this.correct,this.questionTotal)}
          </div>
        </div>
      </div>
      <qd-help-popup
        .open=${this.helpOpen}
        .title=${p("status").title}
        .content=${p("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}loadCache(){const e=c(h.SESSION);e?(this.name=e.name||"",this.serviceId=e.serviceId||""):(this.name="",this.serviceId=""),this.questionTotal=x();const s=c(h.CACHE);this.answered=s?.totals.answered??0,this.correct=s?.totals.correct??0,this.statusColor=w(this.answered,this.correct,this.questionTotal)}updateVisibility(){this.toggleAttribute("data-show",f())}handleLogout(){const e=c(h.SESSION);new C().clearSession();const a=new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(a)}};t.styles=u`
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
  `;o([n()],t.prototype,"answered",2);o([n()],t.prototype,"correct",2);o([n()],t.prototype,"questionTotal",2);o([n()],t.prototype,"statusColor",2);o([n()],t.prototype,"name",2);o([n()],t.prototype,"serviceId",2);o([n()],t.prototype,"helpOpen",2);t=o([m("qd-status")],t);
