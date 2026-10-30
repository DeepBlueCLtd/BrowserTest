import{a as w,b as S,c as A,g as $,d as C}from"./dom-helpers-CAaP8i-_.js";import{p as O,f as M,D as H}from"./date-helpers-BybTNUJN.js";import{g as v,S as y}from"./storage-helpers-D_wcwu-v.js";import{e as p,w as q,i as _}from"./logger-DdbYlyfi.js";import{i as P,a as B,x}from"./lit-element-DR9D0stx.js";import{n as F,t as L}from"./property-BRFVFa-w.js";function T(e,n=16){let t=5381;for(let a=0;a<e.length;a++){const o=e.charCodeAt(a);t=(t<<5)+t+o,t=t&t}const s=Math.abs(t).toString(16).padStart(8,"0");return s.repeat(Math.ceil(n/s.length)).substring(0,n)}function j(e){const n=w(e),t=n[0],s=t?S(t).length:0,r=e.className||"qd-analysis",a=`${n.length}x${s}:${r}`;return T(a,16)}function z(e,n,t){const s=t.replace(/\s+/g," ").trim(),r=T(s,8);return`R${e}C${n}#f:${r}`}function D(e){return e.classList.contains("interactive")}function W(e){const n=[];e.querySelector("tbody")||n.push("Analysis table must have a tbody element");const t=w(e);t.length===0&&n.push("Analysis table must have at least one row");const s=j(e),r=[];return t.forEach((a,o)=>{S(a).forEach((d,l)=>{if(D(d)){const f=A(d),h=z(o,l,f);r.push({row:o,col:l,key:h})}})}),{element:e,tableId:s,editableCells:r,errors:n.length>0?n:void 0}}function G(e,n,t){const{debouncer:s,pageId:r}=e;if(!s||!r)return;const a=A(n);s.debounce(`save-cell-${t}`,()=>{J(e,t,a)},500)}async function J(e,n,t){const{pageId:s,parsed:r}=e;if(!s)return;const a=v(y.SESSION);if(!a){p("No active session found");return}const o=$();let i;try{i=await o.loadStudentRecord(a)}catch(l){q("Failed to load student record, analysis not saved",l);return}const d=o.updateRecordWithAnalysis(i,s,r.tableId,n,t);await O(d,{events:[{name:"qd:analysis-saved",detail:{pageId:s,tableId:r.tableId,cellKey:n,content:t}}]})}function K(e,n){const t={};return e.forEach(s=>{const r=s.pages[n];if(!r||!r.analysis)return;const{cells:a}=r.analysis,o=r.analysis.lastEdited||s.updated;Object.entries(a).forEach(([i,d])=>{t[i]||(t[i]=[]),t[i].push({serviceId:s.serviceId,name:s.name,content:d,timestamp:o})})}),t}function Q(e){return[...e].sort((n,t)=>{const s=new Date(n.timestamp).getTime();return new Date(t.timestamp).getTime()-s})}var Y=Object.defineProperty,U=Object.getOwnPropertyDescriptor,N=(e,n,t,s)=>{for(var r=s>1?void 0:s?U(n,t):n,a=e.length-1,o;a>=0;a--)(o=e[a])&&(r=(s?o(n,t,r):o(r))||r);return s&&r&&Y(n,t,r),r};let b=class extends B{constructor(){super(...arguments),this.entries=[]}render(){return this.entries.length===0?(this.setAttribute("data-empty",""),x`<div class="qd-no-entries">(No entries yet)</div>`):(this.removeAttribute("data-empty"),Q(this.entries).map(e=>{const n=e.serviceId.slice(-4),t=M(e.timestamp);return x`<div class="qd-entry">
        <span class="qd-entry-name">${e.name} (${n}) • ${t}: </span>
        <span class="qd-entry-content">${e.content}</span>
      </div>`}))}};b.styles=P`
    :host {
      display: block;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 2px solid #3b82f6;
    }

    :host([data-empty]) {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }

    .qd-no-entries {
      color: #9ca3af;
      font-style: italic;
      font-size: 13px;
      padding: 8px 0;
    }

    .qd-entry {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #1f2937;
    }

    .qd-entry-name {
      font-weight: 600;
      color: #374151;
    }

    .qd-entry-content {
      white-space: pre-wrap;
    }
  `;N([F({attribute:!1})],b.prototype,"entries",2);b=N([L("qd-student-entries")],b);function V(e){const n=document.createElement("qd-student-entries");return n.entries=e,n}async function X(e,n){const t=n.pageId||k();if(!t){q("Cannot show student entries: page ID not found");return}const s=v(y.SESSION);if(!s){q("Cannot show student entries: no active session");return}const r=$();let a;try{a=await r.getStudentsByRelease(s.release)}catch(l){p("Failed to load students for instructor view:",l);return}const o=K(a,t),{editableCells:i}=n.parsed,d=w(e);i.forEach(({row:l,col:f,key:h})=>{const g=d[l];if(!g)return;const u=S(g)[f];if(!u)return;const m=o[h]||[],I=V(m);I.setAttribute("data-qd-student-entries","true");const c=u.querySelector("[data-qd-student-entries]");c&&c.remove(),u.appendChild(I)}),_(`Displayed student entries for ${i.length} cells`)}function Z(e){e.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove())}function k(){const e=document.body.dataset.pageId;return e||(window.location.pathname.split("/").pop()||"").replace(".html","")||void 0}const R=new WeakMap;function ce(e,n){const t=W(e);t.errors&&t.errors.length>0&&p("Analysis table has validation errors:",t.errors);const s={parsed:t,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return p("Interactive mode requires pageId option"),!1;s.debouncer=new H,s.cellKeyMap=new Map}return R.set(e,s),n.interactive?te(e,s):ee(e)}function ee(e){C(e,"qd-analysis-non-interactive");const n=()=>{const s=R.get(e);s&&X(e,s)},t=()=>{Z(e)};return document.addEventListener("qd:instructor-show-answers",n),document.addEventListener("qd:instructor-hide-answers",t),!0}function te(e,n){const{parsed:t,pageId:s,debouncer:r,cellKeyMap:a}=n;if(!s||!r||!a)return p("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!v(y.SESSION))return p("No active session found"),!1;const f=v(y.CACHE)?.pages[s]?.analysis?.cells||{},h=w(e);return t.editableCells.forEach(({row:g,col:E,key:u})=>{const m=h[g];if(!m)return;const c=S(m)[E];if(c){if(!D(c)){p(`Cell at R${g}C${E} is no longer editable`);return}a.set(c,u),f[u]&&(c.textContent=f[u]),c.contentEditable="true",C(c,"qd-editable"),c.addEventListener("input",()=>{G(n,c,u)})}}),C(e,"qd-analysis-interactive"),!0}export{ce as e};
