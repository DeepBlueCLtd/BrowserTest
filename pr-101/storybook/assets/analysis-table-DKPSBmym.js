import{a as C,b as E,c as T,g as D,d as S}from"./dom-helpers-CAaP8i-_.js";import{p as M,f as H,e as _,D as B}from"./date-helpers-CMY6yFEp.js";import{g as y,S as w}from"./storage-helpers-h0mJMTqi.js";import{e as f,w as q,i as L}from"./logger-DdbYlyfi.js";import{i as P,a as F,x as $}from"./lit-element-DR9D0stx.js";import{n as j,t as z}from"./property-BRFVFa-w.js";function N(e,n=16){let t=5381;for(let a=0;a<e.length;a++){const o=e.charCodeAt(a);t=(t<<5)+t+o,t=t&t}const s=Math.abs(t).toString(16).padStart(8,"0");return s.repeat(Math.ceil(n/s.length)).substring(0,n)}function W(e){const n=C(e),t=n[0],s=t?E(t).length:0,r=e.className||"qd-analysis",a=`${n.length}x${s}:${r}`;return N(a,16)}function G(e,n,t){const s=t.replace(/\s+/g," ").trim(),r=N(s,8);return`R${e}C${n}#f:${r}`}function x(e){return e.classList.contains("interactive")}function J(e){const n=[];e.querySelector("tbody")||n.push("Analysis table must have a tbody element");const t=C(e);t.length===0&&n.push("Analysis table must have at least one row");const s=W(e),r=[];return t.forEach((a,o)=>{E(a).forEach((l,d)=>{if(x(l)){const u=T(l),m=G(o,d,u);r.push({row:o,col:d,key:m})}})}),{element:e,tableId:s,editableCells:r,errors:n.length>0?n:void 0}}function K(e,n,t){const{debouncer:s,pageId:r}=e;if(!s||!r)return;const a=T(n),o=Q(n);s.debounce(`save-cell-${t}`,()=>{Y(e,t,a,o)},500)}function Q(e){const n=e.getAttribute("aria-labelledby");return(n?document.getElementById(n)?.textContent:void 0)?.replace(/\s+/g," ").trim().replace(/:$/,"").trim()||void 0}async function Y(e,n,t,s){const{pageId:r,parsed:a}=e;if(!r)return;const o=y(w.SESSION);if(!o){f("No active session found");return}const c=D();let l;try{l=await c.loadStudentRecord(o)}catch(u){q("Failed to load student record, analysis not saved",u);return}const d=c.updateRecordWithAnalysis(l,r,a.tableId,n,t,{totalCells:a.editableCells.length,label:s});await M(d,{events:[{name:"qd:analysis-saved",detail:{pageId:r,tableId:a.tableId,cellKey:n,content:t}}]})}function U(e,n){const t={};return e.forEach(s=>{const r=s.pages[n];if(!r||!r.analysis)return;const{cells:a}=r.analysis,o=r.analysis.lastEdited||s.updated;Object.entries(a).forEach(([c,l])=>{t[c]||(t[c]=[]),t[c].push({serviceId:s.serviceId,name:s.name,content:l,timestamp:o})})}),t}function V(e){return[...e].sort((n,t)=>{const s=new Date(n.timestamp).getTime();return new Date(t.timestamp).getTime()-s})}var X=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,R=(e,n,t,s)=>{for(var r=s>1?void 0:s?Z(n,t):n,a=e.length-1,o;a>=0;a--)(o=e[a])&&(r=(s?o(n,t,r):o(r))||r);return s&&r&&X(n,t,r),r};let I=class extends F{constructor(){super(...arguments),this.entries=[]}render(){return this.entries.length===0?(this.setAttribute("data-empty",""),$`<div class="qd-no-entries">(No entries yet)</div>`):(this.removeAttribute("data-empty"),V(this.entries).map(e=>{const n=e.serviceId.slice(-4),t=H(e.timestamp);return $`<div class="qd-entry">
        <span class="qd-entry-name">${e.name} (${n}) • ${t}: </span>
        <span class="qd-entry-content">${e.content}</span>
      </div>`}))}};I.styles=P`
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
  `;R([j({attribute:!1})],I.prototype,"entries",2);I=R([z("qd-student-entries")],I);function k(e){const n=document.createElement("qd-student-entries");return n.entries=e,n}async function ee(e,n){const t=n.pageId||ne();if(!t){q("Cannot show student entries: page ID not found");return}const s=y(w.SESSION);if(!s){q("Cannot show student entries: no active session");return}const r=D();let a;try{a=await r.getStudentsByRelease(s.release)}catch(d){f("Failed to load students for instructor view:",d);return}const o=U(a,t),{editableCells:c}=n.parsed,l=C(e);c.forEach(({row:d,col:u,key:m})=>{const g=l[d];if(!g)return;const p=E(g)[u];if(!p)return;const v=o[m]||[],h=k(v);h.setAttribute("data-qd-student-entries","true");const i=p.querySelector("[data-qd-student-entries]");i&&i.remove(),p.appendChild(h)}),L(`Displayed student entries for ${c.length} cells`)}function te(e){e.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove())}function ne(){const e=document.body.dataset.pageId;return e||(window.location.pathname.split("/").pop()||"").replace(".html","")||void 0}const O=new WeakMap;function pe(e,n){const t=J(e);t.errors&&t.errors.length>0&&f("Analysis table has validation errors:",t.errors);const s={parsed:t,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return f("Interactive mode requires pageId option"),!1;s.debouncer=new B,s.cellKeyMap=new Map}return O.set(e,s),n.interactive?re(e,s):se(e)}function se(e){S(e,"qd-analysis-non-interactive");const n=()=>{const s=O.get(e);s&&ee(e,s)},t=()=>{te(e)};return document.addEventListener("qd:instructor-show-answers",n),document.addEventListener("qd:instructor-hide-answers",t),!0}function re(e,n){const{parsed:t,pageId:s,debouncer:r,cellKeyMap:a}=n;if(!s||!r||!a)return f("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!y(w.SESSION))return f("No active session found"),!1;const u=y(w.CACHE)?.pages[s]?.analysis?.cells||{},m=C(e);return t.editableCells.forEach(({row:g,col:b,key:p})=>{const v=m[g];if(!v)return;const h=E(v),i=h[b];if(!i)return;if(!x(i)){f(`Cell at R${g}C${b} is no longer editable`);return}a.set(i,p),u[p]&&(i.textContent=u[p]),i.contentEditable="true",S(i,"qd-editable"),i.setAttribute("role","textbox"),i.setAttribute("aria-multiline","true");const A=ae(h,b);A&&i.setAttribute("aria-labelledby",_(A,"qd-analysis-label")),i.addEventListener("input",()=>{K(n,i,p)})}),S(e,"qd-analysis-interactive"),!0}function ae(e,n){for(let t=n-1;t>=0;t--){const s=e[t];if(s&&!x(s)&&s.textContent?.trim())return s}}export{pe as e};
