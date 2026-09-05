import{S as o,g as p,a as g,I as d}from"./storage-helpers-D_wcwu-v.js";import{w as S,e as a,i as f}from"./logger-DdbYlyfi.js";import{i as m,a as h,x as v}from"./lit-element-DR9D0stx.js";import{t as I}from"./property-BRFVFa-w.js";function y(){return p(o.SESSION)!==null}function b(){return sessionStorage.getItem(o.INSTRUCTOR)==="true"}function k(){return y()&&!b()}function A(s,e){return s===0||e===0?"red":e===s?"green":"amber"}function P(s,e){return e===0?0:Math.round(s/e*100)}function w(s,e=new Date){const t=new Date(s);return isNaN(t.getTime())?!0:e>=t}class R{createSession(e,t,i){const n=new Date,r=n.toISOString(),l=new Date(n.getTime()+g).toISOString(),u={serviceId:e,name:t,release:i,loginTime:r,lastActivity:r,expiresAt:l,instructorUnlocked:!1};return this.saveSession(u),this.emitEvent("qd:login",{serviceId:e,name:t,release:i,loginTime:r}),u}getSession(){try{const e=sessionStorage.getItem(o.SESSION);if(!e)return null;const t=JSON.parse(e);return!t.serviceId||!t.release||!t.expiresAt?(S("Invalid session data, missing required fields"),null):t}catch(e){return a("Failed to parse session data",e),null}}updateActivity(){const e=this.getSession();if(!e)return;const t=new Date;e.lastActivity=t.toISOString(),e.expiresAt=new Date(t.getTime()+g).toISOString(),this.saveSession(e)}isExpired(){const e=this.getSession();return e?w(e.expiresAt):!0}clearSession(){const e=this.getSession();sessionStorage.removeItem(o.SESSION),sessionStorage.removeItem(o.CACHE),sessionStorage.removeItem(o.INSTRUCTOR),sessionStorage.removeItem(d),e&&(f(`Session cleared for ${e.serviceId}`),this.emitEvent("qd:logout",{serviceId:e.serviceId,timestamp:new Date().toISOString()}))}unlockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!0,e.unlockTime=new Date().toISOString(),this.saveSession(e),this.emitEvent("qd:instructor-unlock",{timestamp:e.unlockTime}))}lockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!1,delete e.unlockTime,this.saveSession(e),this.emitEvent("qd:instructor-lock",{timestamp:new Date().toISOString()}))}isInstructorUnlocked(){return this.getSession()?.instructorUnlocked===!0}getCache(){try{const e=sessionStorage.getItem(o.CACHE);return e?JSON.parse(e):null}catch(e){return a("Failed to parse cache data",e),null}}saveCache(e){try{sessionStorage.setItem(o.CACHE,JSON.stringify(e))}catch(t){a("Failed to save cache",t)}}clearCache(){sessionStorage.removeItem(o.CACHE)}saveSession(e){try{sessionStorage.setItem(o.SESSION,JSON.stringify(e))}catch(t){a("Failed to save session",t)}}emitEvent(e,t){try{const i=new CustomEvent(e,{detail:t,bubbles:!0});document.dispatchEvent(i)}catch(i){a(`Failed to emit event ${e}`,i)}}}var E=Object.getOwnPropertyDescriptor,O=(s,e,t,i)=>{for(var n=i>1?void 0:i?E(e,t):e,r=s.length-1,l;r>=0;r--)(l=s[r])&&(n=l(n)||n);return n};let c=class extends h{render(){return v`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"5/Sep/2026"}</span>
      </div>
    `}};c.styles=m`
    :host {
      display: inline-block;
      position: relative;
    }

    .info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      font-size: 10px;
      font-weight: bold;
      font-style: italic;
      font-family: Georgia, serif;
      cursor: help;
      user-select: none;
    }

    .info-icon:hover {
      background: #5a6268;
    }

    .tooltip {
      position: absolute;
      top: 50%;
      right: 100%;
      transform: translateY(-50%);
      margin-right: 8px;
      padding: 8px 12px;
      background: #333;
      color: white;
      font-size: 11px;
      font-style: normal;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s,
        visibility 0.2s;
      z-index: 1000;
      pointer-events: none;
    }

    .tooltip::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 100%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-left-color: #333;
    }

    .info-icon:hover + .tooltip,
    .info-icon:focus + .tooltip {
      opacity: 1;
      visibility: visible;
    }

    .tooltip-line {
      display: block;
      line-height: 1.4;
    }
  `;c=O([I("qd-build-info")],c);const N={login:{title:"Login Help",body:'<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'},status:{title:"Student View",body:'<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>'},instructor:{title:"Instructor Tools",body:"<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"}};function _(s){return N[s]}export{R as S,A as a,b,P as c,_ as g,y as h,k as i};
