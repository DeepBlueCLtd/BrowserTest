import{i as h,a as p,x as g}from"./lit-element-CSmQN0ht.js";import{t as b}from"./property-Cqq8i_uy.js";import{r as d}from"./state-BjYqokDn.js";import{g as u,S as n}from"./storage-helpers-B4dxqHb-.js";import{S as f}from"./session-BY0Y0_gx.js";var v=Object.defineProperty,m=Object.getOwnPropertyDescriptor,a=(t,e,r,i)=>{for(var s=i>1?void 0:i?m(e,r):e,c=t.length-1,l;c>=0;c--)(l=t[c])&&(s=(i?l(e,r,s):l(s))||s);return i&&s&&v(e,r,s),s};let o=class extends p{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent)}render(){return g`
      <div class="status-panel">
        <div class="status-indicator ${this.statusColor}"></div>
        <div class="progress-label">Progress:</div>
        <div class="progress-text">${this.correct}/${this.total} Correct (${this.percentage}%)</div>
        <button class="logout-button" @click=${()=>this.handleLogout()}>Logout</button>
      </div>
    `}loadCache(){const t=u(n.CACHE);if(!t){this.total=0,this.correct=0,this.percentage=0,this.statusColor="red";return}this.total=t.totals.total,this.correct=t.totals.correct,this.percentage=this.calculatePercentage(t.totals.total,t.totals.correct),this.statusColor=this.calculateStatusColor(t.totals.total,t.totals.correct)}calculatePercentage(t,e){return t===0?0:Math.round(e/t*100)}calculateStatusColor(t,e){return t===0||e===0?"red":e===t?"green":"amber"}updateVisibility(){const t=u(n.SESSION),e=sessionStorage.getItem(n.INSTRUCTOR)==="true";t&&!e?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const t=u(n.SESSION);new f().clearSession();const r=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(r)}};o.styles=h`
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
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
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
  `;a([d()],o.prototype,"total",2);a([d()],o.prototype,"correct",2);a([d()],o.prototype,"percentage",2);a([d()],o.prototype,"statusColor",2);o=a([b("qd-status")],o);
