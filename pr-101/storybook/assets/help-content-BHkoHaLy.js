import{a as d,S as i,I as g}from"./storage-helpers-h0mJMTqi.js";import{w as p,e as a,i as S}from"./logger-DdbYlyfi.js";import{e as f}from"./session-state-Cbzz7Lnd.js";import{i as m,a as h,x as v}from"./lit-element-DR9D0stx.js";import{t as w}from"./property-BRFVFa-w.js";function N(s,e,t){return s===0?"red":t!==void 0&&e>=t?"green":"amber"}function k(s,e,t){return`${t!==void 0?`${s} of ${t} answered`:`${s} answered`} · ${e} correct`}function y(s,e=new Date){const t=new Date(s);return isNaN(t.getTime())?!0:e>=t}class A{createSession(e,t,o){const r=new Date,n=r.toISOString(),l=new Date(r.getTime()+d).toISOString(),u={serviceId:e,name:t,release:o,loginTime:n,lastActivity:n,expiresAt:l,instructorUnlocked:!1};return this.saveSession(u),this.emitEvent("qd:login",{serviceId:e,name:t,release:o,loginTime:n}),u}getSession(){try{const e=sessionStorage.getItem(i.SESSION);if(!e)return null;const t=JSON.parse(e);return!t.serviceId||!t.release||!t.expiresAt?(p("Invalid session data, missing required fields"),null):t}catch(e){return a("Failed to parse session data",e),null}}updateActivity(){const e=this.getSession();if(!e)return;const t=new Date;e.lastActivity=t.toISOString(),e.expiresAt=new Date(t.getTime()+d).toISOString(),this.saveSession(e)}isExpired(){const e=this.getSession();return e?y(e.expiresAt):!0}clearSession(){const e=this.getSession();sessionStorage.removeItem(i.SESSION),sessionStorage.removeItem(i.CACHE),f(),sessionStorage.removeItem(g),e&&(S(`Session cleared for ${e.serviceId}`),this.emitEvent("qd:logout",{serviceId:e.serviceId,timestamp:new Date().toISOString()}))}unlockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!0,e.unlockTime=new Date().toISOString(),this.saveSession(e),this.emitEvent("qd:instructor-unlock",{timestamp:e.unlockTime}))}lockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!1,delete e.unlockTime,this.saveSession(e),this.emitEvent("qd:instructor-lock",{timestamp:new Date().toISOString()}))}isInstructorUnlocked(){return this.getSession()?.instructorUnlocked===!0}getCache(){try{const e=sessionStorage.getItem(i.CACHE);return e?JSON.parse(e):null}catch(e){return a("Failed to parse cache data",e),null}}saveCache(e){try{sessionStorage.setItem(i.CACHE,JSON.stringify(e))}catch(t){a("Failed to save cache",t)}}clearCache(){sessionStorage.removeItem(i.CACHE)}saveSession(e){try{sessionStorage.setItem(i.SESSION,JSON.stringify(e))}catch(t){a("Failed to save session",t)}}emitEvent(e,t){try{const o=new CustomEvent(e,{detail:t,bubbles:!0});document.dispatchEvent(o)}catch(o){a(`Failed to emit event ${e}`,o)}}}var I=Object.getOwnPropertyDescriptor,b=(s,e,t,o)=>{for(var r=o>1?void 0:o?I(e,t):e,n=s.length-1,l;n>=0;n--)(l=s[n])&&(r=l(r)||r);return r};let c=class extends h{render(){return v`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"31/Oct/2026"}</span>
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
  `;c=b([w("qd-build-info")],c);const E={login:{title:"Login Help",body:'<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>4-digit PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'},status:{title:"Student View",body:'<p>Page badges in the contents:<ul><li><strong style="color:#2e7d32">Green</strong>: every question on the page answered correctly</li><li><strong style="color:#b26a00">Amber</strong>: started, with some questions unanswered or incorrect</li><li><strong style="color:#c62828">Red</strong>: not started</li></ul></p><p>On a quiz page, each answer shows <strong>✓ Correct</strong> or <strong>✗ Incorrect</strong>. You can change an answer at any time.</p><p>The <b>Test progress</b> panel counts the questions you have answered and how many are correct.</p>'},instructor:{title:"Instructor Tools",body:"<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"}};function P(s){return E[s]}export{A as S,N as c,k as f,P as g};
