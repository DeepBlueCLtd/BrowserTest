import{i as h,a as p,x as g}from"./lit-element-CSmQN0ht.js";import{t as f}from"./property-Cqq8i_uy.js";import{r}from"./state-BjYqokDn.js";import{g as d,S as n}from"./storage-helpers-B4dxqHb-.js";import{S as b}from"./session-BjIMOy9d.js";import"./qd-build-info-BbVz48LV.js";var v=Object.defineProperty,m=Object.getOwnPropertyDescriptor,i=(e,t,a,c)=>{for(var o=c>1?void 0:c?m(t,a):t,l=e.length-1,u;l>=0;l--)(u=e[l])&&(o=(c?u(t,a,o):u(o))||o);return c&&o&&v(t,a,o),o};let s=class extends p{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent)}render(){const e=this.serviceId.slice(-4);return g`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${e}
          </span>
          <button class="logout-button" @click=${()=>this.handleLogout()}>Logout</button>
        </div>
        <div class="bottom-row">
          <div class="status-indicator ${this.statusColor}"></div>
          <div class="progress-text">
            ${this.correct}/${this.total} Correct (${this.percentage}%)
          </div>
        </div>
        <qd-build-info></qd-build-info>
      </div>
    `}loadCache(){const e=d(n.SESSION);e?(this.name=e.name||"",this.serviceId=e.serviceId||""):(this.name="",this.serviceId="");const t=d(n.CACHE);if(!t){this.total=0,this.correct=0,this.percentage=0,this.statusColor="red";return}this.total=t.totals.total,this.correct=t.totals.correct,this.percentage=this.calculatePercentage(t.totals.total,t.totals.correct),this.statusColor=this.calculateStatusColor(t.totals.total,t.totals.correct)}calculatePercentage(e,t){return e===0?0:Math.round(t/e*100)}calculateStatusColor(e,t){return e===0||t===0?"red":t===e?"green":"amber"}updateVisibility(){const e=d(n.SESSION),t=sessionStorage.getItem(n.INSTRUCTOR)==="true";e&&!t?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const e=d(n.SESSION);new b().clearSession();const a=new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(a)}};s.styles=h`
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
  `;i([r()],s.prototype,"total",2);i([r()],s.prototype,"correct",2);i([r()],s.prototype,"percentage",2);i([r()],s.prototype,"statusColor",2);i([r()],s.prototype,"name",2);i([r()],s.prototype,"serviceId",2);s=i([f("qd-status")],s);
