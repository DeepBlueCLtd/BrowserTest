var SonarQuiz=function(t){"use strict";function s(t){if(t.length<2)return"**";if(2===t.length)return t;return t.slice(0,2)+"*".repeat(t.length-2)}function n(t){if(null===t||"object"!=typeof t)return t;const r={};for(const[o,a]of Object.entries(t))"name"!==o&&"passwordHash"!==o&&(r[o]="serviceId"!==o||"string"!=typeof a?"object"!=typeof a||null===a?a:n(a):s(a));return r}function r(t,s){}function o(t,s){if(s instanceof Error){const n={name:s.name,message:s.message};console.error(`[ERROR] ${t}`,n)}else void 0!==s?console.error(`[ERROR] ${t}`,n(s)):console.error(`[ERROR] ${t}`)}function a(t,s){void 0!==s?console.warn(`[WARN] ${t}`,n(s)):console.warn(`[WARN] ${t}`)}function c(t){const s=[],n=[];if(!t.classList.contains("qd-quiz"))return s.push('Table must have class "qd-quiz"'),{element:t,questions:n,errors:s};const r=Array.from(t.querySelectorAll("tbody tr"));return 0===r.length?(s.push("Quiz table has no data rows"),{element:t,questions:n,errors:s}):(r.forEach((t,r)=>{const o=Array.from(t.querySelectorAll("td"));if(3!==o.length)return void s.push(`Row ${r+1} has ${o.length} columns, expected 3 (Question | Answer | Detail)`);const a=o[0],c=o[1],d=o[2];if(!a||!c||!d)return;const l=a.textContent?.trim()||"";if(!l)return void s.push(`Row ${r+1} has empty question text`);const u=c.textContent?.trim()||"";if(!u)return void s.push(`Row ${r+1} has empty answer`);const h=d.querySelector("ol");if(h){const t=(p=h,Array.from(p.querySelectorAll("li")).map(t=>t.textContent?.trim()||"").filter(t=>t.length>0));if(0===t.length)return void s.push(`Row ${r+1} MCQ has no options in <ol>`);n.push({text:l,kind:"mcq",correctAnswer:u,options:t})}else{const t=d.textContent?.trim()||"",o=parseFloat(t);if(isNaN(o))return void s.push(`Row ${r+1} appears to be numeric but has invalid tolerance: "${t}"`);n.push({text:l,kind:"numeric",correctAnswer:u,tolerance:o})}var p}),{element:t,questions:n,errors:s.length>0?s:void 0})}function d(t,s){if(!s||""===s.trim())return!1;const n=s.trim();if("mcq"===t.kind)return n===t.correctAnswer;{const s=parseFloat(n),r=parseFloat(t.correctAnswer);if(isNaN(s)||isNaN(r))return!1;const o=t.tolerance??0;return Math.abs(s-r)<=o}}const l=18e5,u={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},h=3,p=3e4;class SessionService{createSession(t,s,n){const r=new Date,o=r.toISOString(),a={serviceId:t,name:s,release:n,loginTime:o,lastActivity:o,expiresAt:new Date(r.getTime()+l).toISOString(),instructorUnlocked:!1};return this.saveSession(a),this.emitEvent("qd:login",{serviceId:t,name:s,release:n,loginTime:o}),a}getSession(){try{const t=sessionStorage.getItem(u.SESSION);if(!t)return null;const s=JSON.parse(t);return s.serviceId&&s.release&&s.expiresAt?s:(a("Invalid session data, missing required fields"),null)}catch(t){return o("Failed to parse session data",t),null}}updateActivity(){const t=this.getSession();if(!t)return;const s=new Date;t.lastActivity=s.toISOString(),t.expiresAt=new Date(s.getTime()+l).toISOString(),this.saveSession(t)}isExpired(){const t=this.getSession();return!t||function(t,s=new Date){const n=new Date(t);return!!isNaN(n.getTime())||s>=n}(t.expiresAt)}clearSession(){const t=this.getSession();sessionStorage.removeItem(u.SESSION),sessionStorage.removeItem(u.CACHE),sessionStorage.removeItem(u.INSTRUCTOR),sessionStorage.removeItem("qd/instructor/showAnswers"),t&&(t.serviceId,this.emitEvent("qd:logout",{serviceId:t.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!0,t.unlockTime=(new Date).toISOString(),this.saveSession(t),this.emitEvent("qd:instructor-unlock",{timestamp:t.unlockTime}))}lockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!1,delete t.unlockTime,this.saveSession(t),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const t=this.getSession();return!0===t?.instructorUnlocked}getCache(){try{const t=sessionStorage.getItem(u.CACHE);return t?JSON.parse(t):null}catch(t){return o("Failed to parse cache data",t),null}}saveCache(t){try{sessionStorage.setItem(u.CACHE,JSON.stringify(t))}catch(s){o("Failed to save cache",s)}}clearCache(){sessionStorage.removeItem(u.CACHE)}saveSession(t){try{sessionStorage.setItem(u.SESSION,JSON.stringify(t))}catch(s){o("Failed to save session",s)}}emitEvent(t,s){try{const n=new CustomEvent(t,{detail:s,bubbles:!0});document.dispatchEvent(n)}catch(n){o(`Failed to emit event ${t}`,n)}}}function m(t,s){const n=s.answers.length,r=s.answers.filter(t=>""!==t.answer.trim()).length,o=s.answers.filter(t=>t.success).length;return{state:s.state,total:n,answered:r,correct:o,last:s.lastAttempted,answers:s.answers,analysis:s.analysis}}function g(t){return function(t,s="display"){if(null==t)return console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date";const n="string"==typeof t?new Date(t):t;return isNaN(n.getTime())?(console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date"):"csv"===s?function(t){return t.toISOString()}(n):function(t){return`${t.toLocaleDateString("en-US",{month:"short"})} ${t.getDate()} ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`}(n)}(t,"display")}class Debouncer{constructor(){this.timers=new Map}debounce(t,s,n=200){const r=this.timers.get(t);void 0!==r&&clearTimeout(r);const o=setTimeout(()=>{this.timers.delete(t),s()},n);this.timers.set(t,o)}cancel(t){const s=this.timers.get(t);return void 0!==s&&(clearTimeout(s),this.timers.delete(t),!0)}cancelAll(){let t=0;for(const s of this.timers.values())clearTimeout(s),t++;return this.timers.clear(),t}isPending(t){return this.timers.has(t)}getPendingCount(){return this.timers.size}}function f(t){const s=t.querySelector("tbody");return s?Array.from(s.querySelectorAll("tr")):[]}function b(t){return Array.from(t.cells)}function v(t){return t&&t.textContent?.trim()||""}function w(t,s,n){return document.createElement(t)}function y(t,...s){t.classList.add(...s)}function S(t,...s){t.classList.remove(...s)}function x(t,s,n){const r=new CustomEvent(t,{detail:s,bubbles:!0,composed:!0,cancelable:!1});return document.dispatchEvent(r)}function E(t,s,n,r){const o=new CustomEvent(s,{detail:n,bubbles:!0,composed:!0,cancelable:!1});return t.dispatchEvent(o)}function C(t){try{const s=sessionStorage.getItem(t);return s?JSON.parse(s):null}catch(s){return a(`Failed to parse JSON from sessionStorage key: ${t}`,s),null}}function $(t,s){try{const n=JSON.stringify(s);return sessionStorage.setItem(t,n),!0}catch(n){return a(`Failed to store JSON in sessionStorage key: ${t}`,n),!1}}function q(){const t=[];for(let s=0;s<sessionStorage.length;s++){const n=sessionStorage.key(s);n&&n.startsWith("qd/")&&t.push(n)}for(const s of t)sessionStorage.removeItem(s);return t.length}function A(t,s){return`qd/${t}/u${s}`}class StorageError extends Error{constructor(t,s,n){super(t),this.operation=s,this.cause=n,this.name="StorageError",n?o(`Storage error in ${s}: ${t}`,n):o(`Storage error in ${s}: ${t}`)}}class StorageNotInitializedError extends StorageError{constructor(t){super("Storage adapter not initialized. Call init() first.",t),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(t){super("Storage quota exceeded. Please clear old data or free up space.",t),this.name="StorageQuotaError"}}const T="students",P="backups",_="auditLog";class IndexedDBStorageAdapter{constructor(t){if(this.db=null,this.initPromise=null,!t)throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");this.dbName=t}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=new Promise((t,s)=>{let n,r=!1;const c=()=>{n&&(clearTimeout(n),n=void 0)};n=window.setTimeout(()=>{if(r)return;r=!0,this.initPromise=null,a("IndexedDB open timed out after 5000ms - attempting recovery");const n=indexedDB.deleteDatabase(this.dbName);n.onsuccess=()=>{this.init().then(t).catch(s)},n.onerror=()=>{s(new StorageError(`Database "${this.dbName}" appears corrupted. Please clear site data in browser settings.`,"init"))},n.onblocked=()=>{s(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const d=indexedDB.open(this.dbName,3);d.onerror=()=>{r||(r=!0,c(),o(`IndexedDB open error: ${d.error?.message||"unknown"}`),this.initPromise=null,s(new StorageError("Failed to open database","init",d.error)))},d.onblocked=()=>{a("IndexedDB open blocked - close other tabs with this database")},d.onsuccess=()=>{if(!r){if(r=!0,c(),this.db=d.result,!this.db.objectStoreNames.contains(T)||!this.db.objectStoreNames.contains(P)||!this.db.objectStoreNames.contains(_)){a(`Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`),this.db.close(),this.db=null;const n=indexedDB.deleteDatabase(this.dbName);return n.onsuccess=()=>{this.initPromise=null,this.init().then(t).catch(s)},void(n.onerror=()=>{this.initPromise=null,s(new StorageError("Failed to delete corrupted database","init",n.error))})}this.initPromise=null,t()}},d.onupgradeneeded=t=>{const s=t.target.result,n=t.target.transaction;n&&(n.onerror=()=>{o(`Upgrade transaction error: ${n.error?.message||"unknown"}`)},n.onabort=()=>{o(`Upgrade transaction aborted: ${n.error?.message||"unknown"}`)});try{if(!s.objectStoreNames.contains(T)){const t=s.createObjectStore(T,{keyPath:null});t.createIndex("by-release","release",{unique:!1}),t.createIndex("by-service-id","serviceId",{unique:!1})}if(!s.objectStoreNames.contains(P)){const t=s.createObjectStore(P,{keyPath:null});t.createIndex("by-original-key","originalKey",{unique:!1}),t.createIndex("by-timestamp","timestamp",{unique:!1})}if(!s.objectStoreNames.contains(_)){const t=s.createObjectStore(_,{keyPath:"eventId"});t.createIndex("by-service-id","serviceId",{unique:!1}),t.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(r){throw o("Error during database upgrade",r),r}}}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(t,s){const n=this.ensureInitialized(),r=A(t,s);return new Promise((t,s)=>{try{const o=n.transaction(T,"readonly"),a=o.objectStore(T).get(r);a.onsuccess=()=>{t(a.result||null)},a.onerror=()=>{s(new StorageError("Failed to get student record","getStudent",a.error))}}catch(o){s(new StorageError("Failed to get student record","getStudent",o))}})}async saveStudent(t){const s=this.ensureInitialized(),n=A(t.release,t.serviceId);return new Promise((r,o)=>{try{const a=s.transaction(T,"readwrite"),c=a.objectStore(T).put(t,n);c.onsuccess=()=>{r()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?o(new StorageQuotaError("saveStudent")):o(new StorageError("Failed to save student record","saveStudent",c.error))},a.onerror=()=>{o(new StorageError("Transaction failed while saving student","saveStudent",a.error))}}catch(a){o(new StorageError("Failed to save student record","saveStudent",a))}})}async getStudentsByRelease(t){const s=this.ensureInitialized();return new Promise((n,r)=>{try{const o=s.transaction(T,"readonly").objectStore(T),a=o.index("by-release").getAll(t);a.onsuccess=()=>{n(a.result||[])},a.onerror=()=>{r(new StorageError("Failed to get students by release","getStudentsByRelease",a.error))}}catch(o){r(new StorageError("Failed to get students by release","getStudentsByRelease",o))}})}async clearAll(){const t=this.ensureInitialized();return new Promise((s,n)=>{try{const r=t.transaction([T,P,_],"readwrite"),o=r.objectStore(T),a=r.objectStore(P),c=r.objectStore(_),d=o.clear(),l=a.clear(),u=c.clear();let h=!1,p=!1,m=!1;d.onsuccess=()=>{h=!0,p&&m&&s()},l.onsuccess=()=>{p=!0,h&&m&&s()},u.onsuccess=()=>{m=!0,h&&p&&s()},d.onerror=()=>{n(new StorageError("Failed to clear students","clearAll",d.error))},l.onerror=()=>{n(new StorageError("Failed to clear backups","clearAll",l.error))},u.onerror=()=>{n(new StorageError("Failed to clear audit log","clearAll",u.error))},r.onerror=()=>{n(new StorageError("Transaction failed during clearAll","clearAll",r.error))}}catch(r){n(new StorageError("Failed to clear all data","clearAll",r))}})}async backup(t){const s=this.ensureInitialized(),n=(new Date).toISOString(),r=`backup_${n}_${t.serviceId}`,o=A(t.release,t.serviceId),a={...t,originalKey:o,timestamp:n};return new Promise((t,n)=>{try{const o=s.transaction(P,"readwrite"),c=o.objectStore(P).put(a,r);c.onsuccess=()=>{t()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?n(new StorageQuotaError("backup")):n(new StorageError("Failed to create backup","backup",c.error))},o.onerror=()=>{n(new StorageError("Transaction failed during backup","backup",o.error))}}catch(o){n(new StorageError("Failed to create backup","backup",o))}})}async saveAuditEvent(t){const s=this.ensureInitialized();return new Promise((n,r)=>{try{const o=s.transaction(_,"readwrite"),a=o.objectStore(_).add(t);a.onsuccess=()=>{n()},a.onerror=()=>{r(new StorageError("Failed to save audit event","saveAuditEvent",a.error))}}catch(o){r(new StorageError("Failed to save audit event","saveAuditEvent",o))}})}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let O=null,D=null;function U(t){if(!t)throw new Error("FATAL: dbName is required for getStorageAdapter()");return O&&D!==t&&(O.close(),O=null),O||(O=new IndexedDBStorageAdapter(t),D=t),O}function j(t,s){return 0===s||function(t){return 0===t.length}(t)?"unstarted":function(t,s){if(t.length!==s)return!1;return t.every(t=>!0===t.success)}(t,s)?"complete":"incomplete"}class StorageService{constructor(t){if(!t)throw new Error("FATAL: dbName is required for StorageService");this.dbName=t,this.adapter=U(t)}async init(){try{await this.adapter.init(),this.dbName}catch(t){throw o("Failed to initialize storage service",t),t}}async loadStudentRecord(t){try{const s=await this.adapter.getStudent(t.release,t.serviceId);if(s)return t.serviceId,s;const n={schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}};return t.serviceId,n}catch(s){a(`IndexedDB error, creating new record: ${s.message}`);return{schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}}async saveStudentRecord(t){try{t.updated=(new Date).toISOString();const s=function(t){let s=0,n=0;for(const r in t){const o=t[r];if(o&&o.answers&&Array.isArray(o.answers)){const t=o.answers.filter(t=>""!==t.answer.trim());s+=t.length,n+=t.filter(t=>t.success).length}}return{attempted:s,correct:n}}(t.pages);t.attempted=s.attempted,t.correct=s.correct,await this.adapter.saveStudent(t),t.serviceId}catch(s){throw o("Failed to save student record",s),s}}updateRecordWithAnswer(t,s,n,r,o){const a=t.pages[s]||{answers:[],state:"unstarted"};for(;a.answers.length<=n;)a.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});a.answers[n]=r;const c=(new Date).toISOString();return a.firstAttempted||(a.firstAttempted=c),a.lastAttempted=c,a.state=j(a.answers,o),{...t,pages:{...t.pages,[s]:a}}}buildCache(t){return function(t){const s={totals:{total:0,answered:0,correct:0},pages:{}};for(const[n,r]of Object.entries(t.pages)){const t=m(0,r);s.pages[n]=t,s.totals.total+=t.total,s.totals.answered+=t.answered,s.totals.correct+=t.correct}return s}(t)}async getStudentsByRelease(t){try{return await this.adapter.getStudentsByRelease(t)}catch(s){throw o("Failed to get students by release",s),s}}async clearAll(){try{await this.adapter.clearAll()}catch(t){throw o("Failed to clear all data",t),t}}async backup(t){try{await this.adapter.backup(t),t.serviceId}catch(s){a(`Failed to create backup for ${t.serviceId}`,s)}}}let F=null,B=null;function V(t){if(F&&!t)return F;if(F&&t&&B!==t)return a(`Storage service already initialized with dbName="${B}", ignoring new dbName="${t}"`),F;if(!F){if(!t)throw new Error("FATAL: dbName is required for first getStorageService() call");F=new StorageService(t),B=t}return F}const Q=Object.freeze(Object.defineProperty({__proto__:null,StorageService:StorageService,getStorageService:V},Symbol.toStringTag,{value:"Module"})),K=new WeakMap;function W(t,s){const n=K.get(t);let r;if(n){if(n.interactive||!s.interactive)return!0;r=n.parsed}else r=c(t),r.errors&&r.errors.length>0&&o("Quiz table has validation errors:",r.errors);const l={parsed:r,interactive:s.interactive,pageId:s.pageId};if(s.interactive){if(!s.pageId)return o("Interactive mode requires pageId option"),!1;s.pageId,l.debouncer=new Debouncer,l.inputs=[]}if(K.set(t,l),s.interactive){const s=function(t,s){const{parsed:n,pageId:r,debouncer:c}=s;if(!r||!c)return o("Interactive mode requires pageId and debouncer"),!1;(function(t){const s=t.querySelectorAll("thead th, thead td");s[1]&&S(s[1],"qd-hidden");const n=t.querySelectorAll("tbody tr");n.forEach(t=>{const s=t.querySelectorAll("td");s[1]&&S(s[1],"qd-hidden")})})(t),G(t);if(!C(u.SESSION))return o("No active session found"),!1;let l=C(u.CACHE);l?(l.totals.total,Object.keys(l.pages).length):l={totals:{total:0,answered:0,correct:0},pages:{}};const h=n.questions.length;l=function(t,s,n){const r=t.pages[s];if(r&&r.total>=n)return t;const o=n-(r?.total||0),a={state:r?.state||"unstarted",total:n,answered:r?.answered||0,correct:r?.correct||0,last:r?.last,answers:r?.answers,analysis:r?.analysis};return{totals:{total:t.totals.total+o,answered:t.totals.answered,correct:t.totals.correct},pages:{...t.pages,[s]:a}}}(l,r,h),$(u.CACHE,l);const p=l?.pages[r],m=p?.answers||[];m.length;const g=t.querySelector("tbody");if(!g)return o("Quiz table has no tbody element"),!1;const f=Array.from(g.querySelectorAll("tr")),b=[];n.questions.forEach((n,r)=>{const c=f[r];if(!c)return;const l=Array.from(c.querySelectorAll("td"));if(3!==l.length)return;const h=l[0],p=l[1];if(!h||!p)return;const g=m[r];g&&g.answer&&(g.answer,g.success);const v=function(t,s){const n=function(t,s){if("mcq"===t.kind){const n=(t.options||[]).map((t,s)=>({value:String(s+1),text:`${s+1}. ${t}`}));return{type:"select",className:"qd-quiz-input",placeholder:"Select an answer...",value:s?.answer||"",options:n}}return{type:"text",className:"qd-quiz-input",placeholder:"Enter value",value:s?.answer||""}}(t,s);if("select"===n.type){const t=w("select");t.className=n.className;const s=w("option");return s.value="",s.textContent=n.placeholder,s.disabled=!0,t.appendChild(s),n.options&&n.options.forEach(s=>{const n=w("option");n.value=s.value,n.textContent=s.text,t.appendChild(n)}),t.value=n.value,t}{const t=w("input");return t.type=n.type,t.className=n.className,t.placeholder=n.placeholder,t.value=n.value,t}}(n,g);b.push(v),p.textContent="",p.appendChild(v),g&&J(p,g.success);const y="SELECT"===v.tagName?"change":"input";v.addEventListener(y,()=>{!function(t,s,n,r){const{debouncer:c,pageId:l,parsed:h}=s;if(!c||!l)return;const p=h.questions[n];if(!p)return;c.debounce(`save-answer-${n}`,()=>{!async function(t,s,n,r){const{pageId:c,parsed:l,inputs:h}=s;if(!c||!h)return;const p=l.questions[n];if(!p)return;const m=C(u.SESSION);if(!m)return void o("No active session found");const g=d(p,r),f={answer:r.trim(),success:g,timestamp:(new Date).toISOString()},b=V();let v;try{v=await b.loadStudentRecord(m)}catch(A){return void a("Failed to load student record, answer not saved",A)}const w=l.questions.length,y=b.updateRecordWithAnswer(v,c,n,f,w);try{await b.saveStudentRecord(y)}catch(A){a("Failed to save student record to IndexedDB",A)}const S=b.buildCache(y);$(u.CACHE,S);const E=t.querySelector(`tbody tr:nth-child(${n+1})`);if(E){const t=E.querySelector("td:nth-child(2)");t&&J(t,g)}x("qd:answer-saved",{pageId:c,answer:f});const q=y.pages[c];q&&x("qd:state-changed",{pageId:c,state:q.state})}(t,s,n,r)},200)}(t,s,r,v.value)})}),s.inputs=b;const v=()=>{X(t,s)},E=()=>{tt(t)};document.addEventListener("qd:instructor-show-answers",v),document.addEventListener("qd:instructor-hide-answers",E);const q="true"===sessionStorage.getItem(u.INSTRUCTOR),A="true"===sessionStorage.getItem("qd/instructor/showAnswers");q&&A&&X(t,s);const T=()=>{t.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(t=>{S(t,"qd-answer-correct","qd-answer-incorrect")}),tt(t)};return document.addEventListener("qd:logout",T),s.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",v),document.removeEventListener("qd:instructor-hide-answers",E),document.removeEventListener("qd:logout",T)},y(t,"qd-quiz-interactive"),!0}(t,l);return s?r.questions.length:o("Interactive enhancement failed"),s}return function(t){return function(t){const s=t.querySelector("colgroup");s&&s.remove()}(t),Y(t),G(t),y(t,"qd-quiz-non-interactive"),!0}(t)}function J(t,s){S(t,"qd-answer-correct","qd-answer-incorrect"),y(t,s?"qd-answer-correct":"qd-answer-incorrect")}function Y(t){const s=t.querySelectorAll("thead th, thead td");s[1]&&y(s[1],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const s=t.querySelectorAll("td");s[1]&&(y(s[1],"qd-hidden"),s[1].textContent="")})}function G(t){const s=t.querySelectorAll("thead th, thead td");s[2]&&y(s[2],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const s=t.querySelectorAll("td");s[2]&&y(s[2],"qd-hidden")})}function Z(t){return K.get(t)}async function X(t,s){const{pageId:n,parsed:r}=s;if(!n)return;const a=C(u.SESSION);if(!a)return;const{getStorageService:c}=await Promise.resolve().then(()=>Q),d=c();try{const s=await d.getStudentsByRelease(a.release);if(0===s.length)return void alert("No student data available for this release. Students need to log in and answer questions first.");const o=t.querySelector("tbody");if(!o)return;const c=Array.from(o.querySelectorAll("tr"));r.questions.forEach((t,r)=>{const o=c[r];if(!o)return;const a=Array.from(o.querySelectorAll("td"))[1];if(!a)return;const d=a.querySelector(".qd-student-answers");d&&d.remove();const l=function(t,s,n){const r=[];for(const o of t){const t=o.pages[s];if(!t||!t.answers)continue;const a=t.answers[n];a&&r.push({name:o.name,maskedServiceId:o.serviceId.slice(-4),answer:a.answer,success:a.success,formattedTimestamp:g(a.timestamp),cssClass:a.success?"qd-correct":"qd-incorrect"})}return r}(s,n,r);if(l.length>0){const t=document.createElement("div");t.className="qd-student-answers",l.forEach(s=>{const n=document.createElement("div");n.className=`qd-student-answer ${s.cssClass}`,n.innerHTML=`\n            <span class="qd-student-name">${s.name} (${s.maskedServiceId})</span>:\n            <span class="qd-student-answer-text">${s.answer}</span>\n            <span class="qd-timestamp">${s.formattedTimestamp}</span>\n          `,t.appendChild(n)}),a.appendChild(t)}}),s.length}catch(l){o("Failed to load student answers",l)}}function tt(t){t.querySelectorAll(".qd-student-answers").forEach(t=>t.remove())}function et(t,s=16){let n=5381;for(let o=0;o<t.length;o++){n=(n<<5)+n+t.charCodeAt(o),n&=n}const r=Math.abs(n).toString(16).padStart(8,"0");return r.repeat(Math.ceil(s/r.length)).substring(0,s)}function st(t){const s=f(t),n=s[0],r=n?b(n).length:0,o=t.className||"qd-analysis";return et(`${s.length}x${r}:${o}`,16)}function nt(t,s,n){return`R${t}C${s}#f:${et(n.replace(/\s+/g," ").trim(),8)}`}function rt(t){return t.classList.contains("interactive")}function ot(t){const s=[];t.querySelector("tbody")||s.push("Analysis table must have a tbody element");const n=f(t);0===n.length&&s.push("Analysis table must have at least one row");const r=st(t),o=[];return n.forEach((t,s)=>{b(t).forEach((t,n)=>{if(rt(t)){const r=v(t),a=nt(s,n,r);o.push({row:s,col:n,key:a})}})}),{element:t,tableId:r,editableCells:o,errors:s.length>0?s:void 0}}const it=new WeakMap;function at(t,s){const n=ot(t);n.errors&&n.errors.length>0&&o("Analysis table has validation errors:",n.errors);const r={parsed:n,interactive:s.interactive,pageId:s.pageId};if(s.interactive){if(!s.pageId)return o("Interactive mode requires pageId option"),!1;r.debouncer=new Debouncer,r.cellKeyMap=new Map}return it.set(t,r),s.interactive?function(t,s){const{parsed:n,pageId:r,debouncer:c,cellKeyMap:d}=s;if(!r||!c||!d)return o("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!C(u.SESSION))return o("No active session found"),!1;const l=C(u.CACHE),h=l?.pages[r],p=h?.analysis,m=p?.cells||{},g=f(t);return n.editableCells.forEach(({row:t,col:n,key:r})=>{const c=g[t];if(!c)return;const l=b(c)[n];l&&(rt(l)?(d.set(l,r),m[r]&&(l.textContent=m[r]),l.contentEditable="true",y(l,"qd-editable"),l.addEventListener("input",()=>{!function(t,s,n){const{debouncer:r,pageId:c}=t;if(!r||!c)return;const d=v(s);r.debounce(`save-cell-${n}`,()=>{!async function(t,s,n){const{pageId:r,parsed:c}=t;if(!r)return;const d=C(u.SESSION);if(!d)return void o("No active session found");const l=V();let h;try{h=await l.loadStudentRecord(d)}catch(b){return void a("Failed to load student record, analysis not saved",b)}const p=h.pages[r]||{answers:[],state:"unstarted"},m=p.analysis||{tableId:c.tableId,cells:{}};m.cells[s]=n;const g=(new Date).toISOString();m.firstEdited||(m.firstEdited=g);m.lastEdited=g,p.analysis=m,h.pages[r]=p,h.updated=g;try{await l.saveStudentRecord(h)}catch(b){a("Failed to save student record to IndexedDB",b)}const f=l.buildCache(h);$(u.CACHE,f),x("qd:analysis-saved",{pageId:r,tableId:c.tableId,cellKey:s,content:n})}(t,n,d)},500)}(s,l,r)})):o(`Cell at R${t}C${n} is no longer editable`))}),y(t,"qd-analysis-interactive"),!0}(t,r):function(t){y(t,"qd-analysis-non-interactive");const s=()=>{!async function(t){const s=it.get(t);if(!s)return void a("Cannot show student entries: table not enhanced");const n=s.pageId||function(){const t=document.body.dataset.pageId;if(t)return t;const s=window.location.pathname,n=(s.split("/").pop()||"").replace(".html","");return n||void 0}();if(!n)return void a("Cannot show student entries: page ID not found");const r=C(u.SESSION);if(!r)return void a("Cannot show student entries: no active session");const c=V();let d;try{d=await c.getStudentsByRelease(r.release)}catch(m){return void o("Failed to load students for instructor view:",m)}const l=function(t,s){const n={};return t.forEach(t=>{const r=t.pages[s];if(!r||!r.analysis)return;const{cells:o}=r.analysis,a=r.analysis.lastEdited||t.updated;Object.entries(o).forEach(([s,r])=>{n[s]||(n[s]=[]),n[s].push({serviceId:t.serviceId,name:t.name,content:r,timestamp:a})})}),n}(d,n),{editableCells:h}=s.parsed,p=f(t);h.forEach(({row:t,col:s,key:n})=>{const r=p[t];if(!r)return;const o=b(r)[s];if(!o)return;const a=function(t){const s=document.createElement("div");if(s.className="qd-student-entries",0===t.length)return s.className+=" qd-no-entries",s.textContent="(No entries yet)",s.style.cssText="color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;",s;const n=function(t){return[...t].sort((t,s)=>{const n=new Date(t.timestamp).getTime();return new Date(s.timestamp).getTime()-n})}(t);return n.forEach(t=>{const n=document.createElement("div");n.className="qd-entry",n.style.cssText="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";const r=t.serviceId.slice(-4),o=g(t.timestamp),a=document.createElement("span");a.style.cssText="font-weight: 600; color: #374151;",a.textContent=`${t.name} (${r}) • ${o}: `;const c=document.createElement("span");c.style.cssText="white-space: pre-wrap;",c.textContent=t.content,n.appendChild(a),n.appendChild(c),s.appendChild(n)}),s.style.cssText="margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;",s}(l[n]||[]);a.setAttribute("data-qd-student-entries","true");const c=o.querySelector("[data-qd-student-entries]");c&&c.remove(),o.appendChild(a)}),h.length}(t)},n=()=>{ct(t)};return document.addEventListener("qd:instructor-show-answers",s),document.addEventListener("qd:instructor-hide-answers",n),!0}(t)}function ct(t){t.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove())}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers()}registerLoginHandlers(){this.addEventListener("qd:login",t=>{(async()=>{const s=t.detail;if(s.serviceId,s.name,"INSTRUCTOR"===s.serviceId)return;const n=C(u.SESSION);if(!n)return;const r=V();let o,a;try{o=await r.loadStudentRecord(n),await r.saveStudentRecord(o),a=r.buildCache(o),$(u.CACHE,a),a.totals.total}catch{$(u.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}this.dispatchEvent("qd:cache-rebuild",{}),this.upgradeTablesAfterLogin()})()})}upgradeTablesAfterLogin(){const t=window.location.pathname,s=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!s)return;if("true"===sessionStorage.getItem(u.INSTRUCTOR)){return void document.querySelectorAll("table.qd-quiz").forEach(t=>{const n=Z(t);if(!n)return;n.pageId=s;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,s)=>{const r=n.parsed.questions[s];r&&t instanceof HTMLTableCellElement&&(t.textContent=r.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const r=()=>{X(t,n)};document.addEventListener("qd:instructor-show-answers",r),document.addEventListener("qd:instructor-hide-answers",()=>{tt(t)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&r()})}const n=document.querySelectorAll("table.qd-quiz");n.length>0&&(n.length,n.forEach(t=>{W(t,{interactive:!0,pageId:s})}));const r=document.querySelectorAll("table.qd-analysis");r.length>0&&(r.length,r.forEach(t=>{at(t,{interactive:!0,pageId:s})}))}registerLogoutHandlers(){this.addEventListener("qd:logout",t=>{t.detail.serviceId;document.querySelectorAll("table.qd-quiz").forEach(t=>{!function(t){const s=K.get(t);s&&(s.interactive=!1,s.pageId=void 0,s.inputs=void 0,s.cleanupInstructorListeners?.(),s.cleanupInstructorListeners=void 0,Y(t),G(t),S(t,"qd-quiz-interactive"))}(t)});document.querySelectorAll("table.qd-analysis").forEach(t=>{!function(t){const s=it.get(t);s&&(ct(t),s.interactive&&(t.querySelectorAll(".qd-editable").forEach(t=>{t instanceof HTMLTableCellElement&&(t.contentEditable="false",t.classList.remove("qd-editable"),t.textContent="")}),t.classList.remove("qd-analysis-interactive"),s.debouncer?.cancelAll()),s.interactive=!1,s.pageId=void 0,s.debouncer=void 0,s.cellKeyMap=void 0)}(t)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",t=>{const s=t.detail;s.pageId,s.questionIndex,s.answer,s.success,this.dispatchEvent("qd:cache-update",{pageId:s.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",t=>{const s=t.detail;s.pageId,s.state,this.dispatchEvent("qd:badge-update",{pageId:s.pageId,state:s.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",t=>{t.detail.unlockTime}),this.addEventListener("qd:instructor-lock",()=>{})}registerDataHandlers(){this.addEventListener("qd:data-cleared",t=>{t.detail.timestamp,this.dispatchEvent("qd:cache-clear",{})})}addEventListener(t,s){document.addEventListener(t,s);const n=this.listeners.get(t)||[];n.push(s),this.listeners.set(t,n)}dispatchEvent(t,s){const n=new CustomEvent(t,{detail:s,bubbles:!0,composed:!0});document.dispatchEvent(n)}cleanup(){for(const[t,s]of this.listeners)for(const n of s)document.removeEventListener(t,n);this.listeners.clear()}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const t=this.sessionService.getSession();if(t){if(t.serviceId,this.sessionService.isExpired())return a("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(t),this.setupActivityTracking()}}scheduleExpiryCheck(t){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const s=(new Date).getTime(),n=new Date(t.expiresAt).getTime()-s;n<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{this.sessionService.clearSession()},n)}setupActivityTracking(){const t=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const t=this.sessionService.getSession();t&&this.scheduleExpiryCheck(t)};let s;const n=()=>{void 0!==s&&window.clearTimeout(s),s=window.setTimeout(()=>{t()},5e3)};["click","keydown","scroll","mousemove"].forEach(t=>{document.addEventListener(t,n,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const dt=globalThis,lt=dt.ShadowRoot&&(void 0===dt.ShadyCSS||dt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ut=Symbol(),ht=new WeakMap;let pt=class{constructor(t,s,n){if(this._$cssResult$=!0,n!==ut)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o;const s=this.t;if(lt&&void 0===t){const n=void 0!==s&&1===s.length;n&&(t=ht.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),n&&ht.set(s,t))}return t}toString(){return this.cssText}};const mt=(t,...s)=>{const n=1===t.length?t[0]:s.reduce((s,n,r)=>s+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+t[r+1],t[0]);return new pt(n,t,ut)},gt=lt?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let s="";for(const n of t.cssRules)s+=n.cssText;return(t=>new pt("string"==typeof t?t:t+"",void 0,ut))(s)})(t):t,{is:ft,defineProperty:bt,getOwnPropertyDescriptor:vt,getOwnPropertyNames:wt,getOwnPropertySymbols:yt,getPrototypeOf:St}=Object,xt=globalThis,Et=xt.trustedTypes,Ct=Et?Et.emptyScript:"",$t=xt.reactiveElementPolyfillSupport,It=(t,s)=>t,qt={toAttribute(t,s){switch(s){case Boolean:t=t?Ct:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,s){let n=t;switch(s){case Boolean:n=null!==t;break;case Number:n=null===t?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch(r){n=null}}return n}},At=(t,s)=>!ft(t,s),kt={attribute:!0,type:String,converter:qt,reflect:!1,useDefault:!1,hasChanged:At};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),xt.litPropertyMetadata??=new WeakMap;let Tt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=kt){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){const n=Symbol(),r=this.getPropertyDescriptor(t,n,s);void 0!==r&&bt(this.prototype,t,r)}}static getPropertyDescriptor(t,s,n){const{get:r,set:o}=vt(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t}};return{get:r,set(s){const a=r?.call(this);o?.call(this,s),this.requestUpdate(t,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??kt}static _$Ei(){if(this.hasOwnProperty(It("elementProperties")))return;const t=St(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(It("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(It("properties"))){const t=this.properties,s=[...wt(t),...yt(t)];for(const n of s)this.createProperty(n,t[n])}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,n]of s)this.elementProperties.set(t,n)}this._$Eh=new Map;for(const[s,n]of this.elementProperties){const t=this._$Eu(s,n);void 0!==t&&this._$Eh.set(t,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const s=[];if(Array.isArray(t)){const n=new Set(t.flat(1/0).reverse());for(const t of n)s.unshift(gt(t))}else void 0!==t&&s.push(gt(t));return s}static _$Eu(t,s){const n=s.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const n of s.keys())this.hasOwnProperty(n)&&(t.set(n,this[n]),delete this[n]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(lt)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const n of s){const s=document.createElement("style"),r=dt.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=n.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,s,n){this._$AK(t,n)}_$ET(t,s){const n=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,n);if(void 0!==r&&!0===n.reflect){const o=(void 0!==n.converter?.toAttribute?n.converter:qt).toAttribute(s,n.type);this._$Em=t,null==o?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,s){const n=this.constructor,r=n._$Eh.get(t);if(void 0!==r&&this._$Em!==r){const t=n.getPropertyOptions(r),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:qt;this._$Em=r;const a=o.fromAttribute(s,t.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(t,s,n){if(void 0!==t){const r=this.constructor,o=this[t];if(n??=r.getPropertyOptions(t),!((n.hasChanged??At)(o,s)||n.useDefault&&n.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,n))))return;this.C(t,s,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,s,{useDefault:n,reflect:r,wrapped:o},a){n&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??s??this[t]),!0!==o||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||n||(s=void 0),this._$AL.set(t,s)),!0===r&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,n]of t){const{wrapped:t}=n,r=this[s];!0!==t||this._$AL.has(s)||void 0===r||this.C(s,void 0,n,r)}}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM()}catch(n){throw t=!1,this._$EM(),n}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};Tt.elementStyles=[],Tt.shadowRootOptions={mode:"open"},Tt[It("elementProperties")]=new Map,Tt[It("finalized")]=new Map,$t?.({ReactiveElement:Tt}),(xt.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Pt=globalThis,_t=Pt.trustedTypes,Nt=_t?_t.createPolicy("lit-html",{createHTML:t=>t}):void 0,Ot="$lit$",Lt=`lit$${Math.random().toFixed(9).slice(2)}$`,Dt="?"+Lt,Rt=`<${Dt}>`,zt=document,Mt=()=>zt.createComment(""),Ht=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Ut=Array.isArray,jt="[ \t\n\f\r]",Ft=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Bt=/-->/g,Vt=/>/g,Qt=RegExp(`>|${jt}(?:([^\\s"'>=/]+)(${jt}*=${jt}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Kt=/'/g,Wt=/"/g,Jt=/^(?:script|style|textarea|title)$/i,Yt=(ee=1,(t,...s)=>({_$litType$:ee,strings:t,values:s})),Gt=Symbol.for("lit-noChange"),Zt=Symbol.for("lit-nothing"),Xt=new WeakMap,te=zt.createTreeWalker(zt,129);var ee;function se(t,s){if(!Ut(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==Nt?Nt.createHTML(s):s}class N{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let o=0,a=0;const c=t.length-1,d=this.parts,[l,u]=((t,s)=>{const n=t.length-1,r=[];let o,a=2===s?"<svg>":3===s?"<math>":"",c=Ft;for(let d=0;d<n;d++){const s=t[d];let n,l,u=-1,h=0;for(;h<s.length&&(c.lastIndex=h,l=c.exec(s),null!==l);)h=c.lastIndex,c===Ft?"!--"===l[1]?c=Bt:void 0!==l[1]?c=Vt:void 0!==l[2]?(Jt.test(l[2])&&(o=RegExp("</"+l[2],"g")),c=Qt):void 0!==l[3]&&(c=Qt):c===Qt?">"===l[0]?(c=o??Ft,u=-1):void 0===l[1]?u=-2:(u=c.lastIndex-l[2].length,n=l[1],c=void 0===l[3]?Qt:'"'===l[3]?Wt:Kt):c===Wt||c===Kt?c=Qt:c===Bt||c===Vt?c=Ft:(c=Qt,o=void 0);const p=c===Qt&&t[d+1].startsWith("/>")?" ":"";a+=c===Ft?s+Rt:u>=0?(r.push(n),s.slice(0,u)+Ot+s.slice(u)+Lt+p):s+Lt+(-2===u?d:p)}return[se(t,a+(t[n]||"<?>")+(2===s?"</svg>":3===s?"</math>":"")),r]})(t,s);if(this.el=N.createElement(l,n),te.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=te.nextNode())&&d.length<c;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(Ot)){const s=u[a++],n=r.getAttribute(t).split(Lt),c=/([.?@])?(.*)/.exec(s);d.push({type:1,index:o,name:c[2],strings:n,ctor:"."===c[1]?H:"?"===c[1]?I:"@"===c[1]?L:k}),r.removeAttribute(t)}else t.startsWith(Lt)&&(d.push({type:6,index:o}),r.removeAttribute(t));if(Jt.test(r.tagName)){const t=r.textContent.split(Lt),s=t.length-1;if(s>0){r.textContent=_t?_t.emptyScript:"";for(let n=0;n<s;n++)r.append(t[n],Mt()),te.nextNode(),d.push({type:2,index:++o});r.append(t[s],Mt())}}}else if(8===r.nodeType)if(r.data===Dt)d.push({type:2,index:o});else{let t=-1;for(;-1!==(t=r.data.indexOf(Lt,t+1));)d.push({type:7,index:o}),t+=Lt.length-1}o++}}static createElement(t,s){const n=zt.createElement("template");return n.innerHTML=t,n}}function ne(t,s,n=t,r){if(s===Gt)return s;let o=void 0!==r?n._$Co?.[r]:n._$Cl;const a=Ht(s)?void 0:s._$litDirective$;return o?.constructor!==a&&(o?._$AO?.(!1),void 0===a?o=void 0:(o=new a(t),o._$AT(t,n,r)),void 0!==r?(n._$Co??=[])[r]=o:n._$Cl=o),void 0!==o&&(s=ne(t,o._$AS(t,s.values),o,r)),s}class M{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:s},parts:n}=this._$AD,r=(t?.creationScope??zt).importNode(s,!0);te.currentNode=r;let o=te.nextNode(),a=0,c=0,d=n[0];for(;void 0!==d;){if(a===d.index){let s;2===d.type?s=new R(o,o.nextSibling,this,t):1===d.type?s=new d.ctor(o,d.name,d.strings,this,t):6===d.type&&(s=new z(o,this,t)),this._$AV.push(s),d=n[++c]}a!==d?.index&&(o=te.nextNode(),a++)}return te.currentNode=zt,r}p(t){let s=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(t,n,s),s+=n.strings.length-2):n._$AI(t[s])),s++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,s,n,r){this.type=2,this._$AH=Zt,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const s=this._$AM;return void 0!==s&&11===t?.nodeType&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=ne(this,t,s),Ht(t)?t===Zt||null==t||""===t?(this._$AH!==Zt&&this._$AR(),this._$AH=Zt):t!==this._$AH&&t!==Gt&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Ut(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Zt&&Ht(this._$AH)?this._$AA.nextSibling.data=t:this.T(zt.createTextNode(t)),this._$AH=t}$(t){const{values:s,_$litType$:n}=t,r="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=N.createElement(se(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(s);else{const t=new M(r,this),n=t.u(this.options);t.p(s),this.T(n),this._$AH=t}}_$AC(t){let s=Xt.get(t.strings);return void 0===s&&Xt.set(t.strings,s=new N(t)),s}k(t){Ut(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let n,r=0;for(const o of t)r===s.length?s.push(n=new R(this.O(Mt()),this.O(Mt()),this,this.options)):n=s[r],n._$AI(o),r++;r<s.length&&(this._$AR(n&&n._$AB.nextSibling,r),s.length=r)}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);t!==this._$AB;){const s=t.nextSibling;t.remove(),t=s}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,n,r,o){this.type=1,this._$AH=Zt,this._$AN=void 0,this.element=t,this.name=s,this._$AM=r,this.options=o,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=Zt}_$AI(t,s=this,n,r){const o=this.strings;let a=!1;if(void 0===o)t=ne(this,t,s,0),a=!Ht(t)||t!==this._$AH&&t!==Gt,a&&(this._$AH=t);else{const r=t;let c,d;for(t=o[0],c=0;c<o.length-1;c++)d=ne(this,r[n+c],s,c),d===Gt&&(d=this._$AH[c]),a||=!Ht(d)||d!==this._$AH[c],d===Zt?t=Zt:t!==Zt&&(t+=(d??"")+o[c+1]),this._$AH[c]=d}a&&!r&&this.j(t)}j(t){t===Zt?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Zt?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Zt)}}class L extends k{constructor(t,s,n,r,o){super(t,s,n,r,o),this.type=5}_$AI(t,s=this){if((t=ne(this,t,s,0)??Zt)===Gt)return;const n=this._$AH,r=t===Zt&&n!==Zt||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,o=t!==Zt&&(n===Zt||r);r&&this.element.removeEventListener(this.name,this,n),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,s,n){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(t){ne(this,t)}}const re=Pt.litHtmlPolyfillSupport;re?.(N,R),(Pt.litHtmlVersions??=[]).push("3.3.1");const oe=(t,s,n)=>{const r=n?.renderBefore??s;let o=r._$litPart$;if(void 0===o){const t=n?.renderBefore??null;r._$litPart$=o=new R(s.insertBefore(Mt(),t),t,void 0,n??{})}return o._$AI(t),o},ie=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let ae=class extends Tt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=oe(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Gt}};ae._$litElement$=!0,ae.finalized=!0,ie.litElementHydrateSupport?.({LitElement:ae});const ce=ie.litElementPolyfillSupport;ce?.({LitElement:ae}),(ie.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const de=t=>(s,n)=>{void 0!==n?n.addInitializer(()=>{customElements.define(t,s)}):customElements.define(t,s)},le={attribute:!0,type:String,converter:qt,reflect:!1,hasChanged:At},ue=(t=le,s,n)=>{const{kind:r,metadata:o}=n;let a=globalThis.litPropertyMetadata.get(o);if(void 0===a&&globalThis.litPropertyMetadata.set(o,a=new Map),"setter"===r&&((t=Object.create(t)).wrapped=!0),a.set(n.name,t),"accessor"===r){const{name:r}=n;return{set(n){const o=s.get.call(this);s.set.call(this,n),this.requestUpdate(r,o,t)},init(s){return void 0!==s&&this.C(r,void 0,t,s),s}}}if("setter"===r){const{name:r}=n;return function(n){const o=this[r];s.call(this,n),this.requestUpdate(r,o,t)}}throw Error("Unsupported decorator location: "+r)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function he(t){return(s,n)=>"object"==typeof n?ue(t,s,n):((t,s,n)=>{const r=s.hasOwnProperty(n);return s.constructor.createProperty(n,t),r?Object.getOwnPropertyDescriptor(s,n):void 0})(t,s,n)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function pe(t){return he({...t,state:!0,attribute:!1})}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const me=".wh_top_menu_and_indexterms_link",ge=".wh_publication_title .title",fe="",be="qd-status-container",ve="qd-title-selector",we="qd-instructor-hash",ye="qd-db-name";function Se(t,s){const n=document.querySelector(`#${t}`);if(!n)return s;const r=n.textContent?.trim()||"";return""===r?(a(`Config element #${t} found but empty, using default: "${s}"`),s):r}function xe(){const t=function(t){const s=document.querySelector(`#${t}`);if(!s){const s=`FATAL: Required config element #${t} not found in DOM. Processing stopped.`;throw console.error(s),new Error(s)}const n=s.textContent?.trim()||"";if(""===n){const s=`FATAL: Required config element #${t} is empty. Processing stopped.`;throw console.error(s),new Error(s)}return n}(ye);return{statusPanelContainer:Se(be,me),titleSelector:Se(ve,ge),instructorHash:Se(we,fe),dbName:t}}async function Ee(t){const s=(new TextEncoder).encode(t),n=await crypto.subtle.digest("SHA-256",s);return Array.from(new Uint8Array(n)).map(t=>t.toString(16).padStart(2,"0")).join("")}function Ce(t){return`${u.PIN_ATTEMPTS}:${t}`}function $e(t){const s=Ce(t),n=sessionStorage.getItem(s);if(!n)return null;try{return JSON.parse(n)}catch{return null}}function Ie(t){const s=$e(t);if(!s||!s.lockoutUntil)return{isLocked:!1,remainingMs:0};const n=new Date(s.lockoutUntil).getTime(),r=Date.now();return n>r?{isLocked:!0,remainingMs:n-r}:(qe(t),{isLocked:!1,remainingMs:0})}function qe(t){const n=$e(t);n&&n.attempts>0&&(n.attempts,s(t));const r=Ce(t);sessionStorage.removeItem(r)}var Ae=Object.getOwnPropertyDescriptor;let ke=class extends ae{render(){return Yt`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"26/Nov/2025"}</span>
      </div>
    `}};ke.styles=mt`
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
  `,ke=((t,s,n,r)=>{for(var o,a=r>1?void 0:r?Ae(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=o(a)||a);return a})([de("qd-build-info")],ke);var Te=Object.defineProperty,Pe=Object.getOwnPropertyDescriptor,_e=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?Pe(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&Te(s,n,a),a};let Ne=null;let Oe=class extends ae{constructor(){super(...arguments),this.open=!1,this.closable=!0,this.previouslyFocused=null,this.portalElement=null,this.cloneMap=new Map,this.childObserver=null,this.handleKeyDown=t=>{"Escape"===t.key&&this.open&&this.closable&&(this.emitCloseEvent(),this.close())},this.handleBackdropClick=()=>{this.closable&&(this.emitCloseEvent(),this.close())},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown),this.ensureStyles(),this.childObserver=new MutationObserver(()=>{this.open&&this.portalElement&&this.createPortal()}),this.childObserver.observe(this,{childList:!0,subtree:!0,characterData:!0})}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),this.removePortal(),this.childObserver?.disconnect(),this.childObserver=null,Ne===this&&(Ne=null)}updated(t){t.has("open")&&(this.open?this.handleOpen():this.handleClose())}ensureStyles(){Oe.styleElement||(Oe.styleElement=document.createElement("style"),Oe.styleElement.textContent="\n  .qd-modal-backdrop {\n    position: fixed;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background: rgba(0, 0, 0, 0.5);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 99999;\n    font-family: system-ui, -apple-system, sans-serif;\n    animation: qd-modal-fadeIn 0.15s ease-out;\n  }\n\n  @keyframes qd-modal-fadeIn {\n    from { opacity: 0; }\n    to { opacity: 1; }\n  }\n\n  .qd-modal-content {\n    background: white;\n    border-radius: 8px;\n    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);\n    max-width: 90vw;\n    max-height: 90vh;\n    overflow: auto;\n    animation: qd-modal-slideIn 0.15s ease-out;\n  }\n\n  @keyframes qd-modal-slideIn {\n    from { transform: translateY(-20px); opacity: 0; }\n    to { transform: translateY(0); opacity: 1; }\n  }\n\n  .qd-modal-header {\n    padding: 16px 20px;\n    border-bottom: 1px solid #eee;\n    font-weight: 600;\n    font-size: 18px;\n  }\n\n  .qd-modal-header:empty {\n    display: none;\n  }\n\n  .qd-modal-body {\n    padding: 20px;\n  }\n\n  .error-message {\n    color: #d32f2f;\n    font-size: 12px;\n    padding: 8px;\n    background: #ffebee;\n    border-radius: 4px;\n    border-left: 3px solid #d32f2f;\n  }\n",document.head.appendChild(Oe.styleElement))}createPortal(){this.removePortal(),this.cloneMap.clear(),this.portalElement=document.createElement("div"),this.portalElement.className="qd-modal-backdrop",this.portalElement.addEventListener("click",this.handleBackdropClick);const t=document.createElement("div");t.className="qd-modal-content",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.addEventListener("click",this.stopPropagation);const s=document.createElement("div");s.className="qd-modal-header";const n=document.createElement("div");n.className="qd-modal-body";const r=this.querySelector('[slot="header"]');r&&s.appendChild(r.cloneNode(!0)),Array.from(this.children).forEach(t=>{if(!t.hasAttribute("slot")||"header"!==t.getAttribute("slot")){const s=t.cloneNode(!0);this.cloneMap.set(t,s),n.appendChild(s)}}),t.appendChild(s),t.appendChild(n),this.portalElement.appendChild(t),document.body.appendChild(this.portalElement),this.setupFormEventForwarding(n)}setupFormEventForwarding(t){t.querySelectorAll("form").forEach(t=>{t.addEventListener("submit",s=>{s.preventDefault();const n=new FormData(t),r={};n.forEach((t,s)=>{"string"==typeof t&&(r[s]=t)});const o=t.querySelector('input[type="password"]');o&&(r.password=o.value);const a=new CustomEvent("qd:password-submit",{detail:r,bubbles:!0,composed:!0});this.dispatchEvent(a)})})}removePortal(){this.portalElement&&(this.portalElement.remove(),this.portalElement=null)}render(){return Zt}show(){this.open=!0}close(){this.open=!1}refreshPortal(){this.open&&this.portalElement&&this.createPortal()}handleOpen(){Ne&&Ne!==this&&Ne.close(),Ne=this,this.previouslyFocused=document.activeElement,this.createPortal(),requestAnimationFrame(()=>{this.focusFirstElement()})}handleClose(){Ne===this&&(Ne=null),this.removePortal(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}focusFirstElement(){if(!this.portalElement)return;const t=this.portalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');t&&t.focus()}emitCloseEvent(){const t=new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0});this.dispatchEvent(t)}};Oe.styleElement=null,_e([he({type:Boolean,reflect:!0})],Oe.prototype,"open",2),_e([he({type:Boolean})],Oe.prototype,"closable",2),Oe=_e([de("qd-modal")],Oe);var Le=Object.defineProperty,De=Object.getOwnPropertyDescriptor,Re=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?De(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&Le(s,n,a),a};let ze=class extends ae{constructor(){super(...arguments),this.open=!1,this.title="Enter Password",this.error="",this.password="",this.handleModalClose=()=>{this.close()},this.handleInput=t=>{const s=t.target;this.password=s.value,this.error&&(this.error="")},this.handleSubmit=t=>{t.preventDefault(),this.password.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:this.password},bubbles:!0,composed:!0}))},this.handleForwardedSubmit=t=>{t.stopPropagation();const s=t.detail?.password||"";s.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:s},bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close()}}show(){this.open=!0,this.password="",this.error=""}close(){this.open=!1,this.password="",this.error="",this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}syncErrorToPortal(){const t=document.querySelector(".qd-modal-backdrop");if(!t)return;const s=t.querySelector("form.password-form");if(!s)return;let n=s.querySelector(".error-message");if(this.error){if(!n){n=document.createElement("div"),n.className="error-message",n.style.cssText="\n          color: #d32f2f;\n          font-size: 12px;\n          padding: 8px;\n          background: #ffebee;\n          border-radius: 4px;\n          border-left: 3px solid #d32f2f;\n        ";const t=s.querySelector(".button-row");t?s.insertBefore(n,t):s.appendChild(n)}n.textContent=this.error}else n?.remove()}updated(t){t.has("open")&&this.open&&(this.password="",this.updateComplete.then(()=>{this.passwordInput?.focus()})),t.has("error")&&this.open&&this.updateComplete.then(()=>{setTimeout(()=>{this.syncErrorToPortal()},0)})}render(){return this.open?Yt`
      <qd-modal
        .open=${this.open}
        @qd:modal-close=${this.handleModalClose}
        @qd:password-submit=${this.handleForwardedSubmit}
      >
        <span slot="header">${this.title}</span>

        <form class="password-form" @submit=${this.handleSubmit}>
          <div class="form-field">
            <label for="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              placeholder="Password"
              .value=${this.password}
              @input=${this.handleInput}
              required
              aria-label="Enter your password"
            />
          </div>

          ${this.error?Yt`<div class="error-message">${this.error}</div>`:""}

          <div class="button-row">
            <button type="button" @click=${this.handleCancel}>Cancel</button>
            <button type="submit">Login</button>
          </div>
        </form>
      </qd-modal>
    `:Zt}};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
var Me;ze.styles=mt`
    :host {
      display: contents;
    }

    .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    input[type='password'] {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }

    input[type='password']:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 3px solid #d32f2f;
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button[type='submit'] {
      background: #0066cc;
      color: white;
    }

    button[type='submit']:hover {
      background: #0052a3;
    }

    button[type='button'] {
      background: #e0e0e0;
      color: #333;
    }

    button[type='button']:hover {
      background: #d0d0d0;
    }
  `,Re([he({type:Boolean,reflect:!0})],ze.prototype,"open",2),Re([he({type:String})],ze.prototype,"title",2),Re([he({type:String})],ze.prototype,"error",2),Re([pe()],ze.prototype,"password",2),Re([(Me='input[type="password"]',(t,s,n)=>((t,s,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&"object"!=typeof s&&Object.defineProperty(t,s,n),n))(t,s,{get(){return(t=>t.renderRoot?.querySelector(Me)??null)(this)}}))],ze.prototype,"passwordInput",2),ze=Re([de("qd-password-modal")],ze);
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const He=2;class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,s,n){this._$Ct=t,this._$AM=s,this._$Ci=n}_$AS(t,s){return this.update(t,s)}update(t,s){return this.render(...s)}}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class e extends i{constructor(t){if(super(t),this.it=Zt,t.type!==He)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===Zt||null==t)return this._t=void 0,this.it=t;if(t===Gt)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const s=[t];return s.raw=s,this._t={_$litType$:this.constructor.resultType,strings:s,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;const Ue=(t=>(...s)=>({_$litDirective$:t,values:s}))(e);var je=Object.defineProperty,Fe=Object.getOwnPropertyDescriptor,Be=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?Fe(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&je(s,n,a),a};let Ve=class extends ae{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}render(){return Yt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${Ue(this.message)}</div>

          <div class="button-row">
            <button type="button" class="cancel-btn" @click=${this.handleCancel}>
              ${this.cancelText}
            </button>
            <button
              type="button"
              class="confirm-btn ${this.destructive?"destructive":""}"
              @click=${this.handleConfirm}
            >
              ${this.confirmText}
            </button>
          </div>
        </div>
      </qd-modal>
    `}};Ve.styles=mt`
    :host {
      display: contents;
    }

    .confirm-content {
      padding: 8px 0;
    }

    .message {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .button-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
    }

    .confirm-btn {
      background: #0066cc;
      color: white;
    }

    .confirm-btn:hover {
      background: #0052a3;
    }

    .confirm-btn.destructive {
      background: #d32f2f;
    }

    .confirm-btn.destructive:hover {
      background: #b71c1c;
    }
  `,Be([he({type:Boolean,reflect:!0})],Ve.prototype,"open",2),Be([he({type:String})],Ve.prototype,"title",2),Be([he({type:String})],Ve.prototype,"message",2),Be([he({type:String})],Ve.prototype,"confirmText",2),Be([he({type:String})],Ve.prototype,"cancelText",2),Be([he({type:Boolean})],Ve.prototype,"destructive",2),Ve=Be([de("qd-confirm-dialog")],Ve);var Qe=Object.defineProperty,Ke=Object.getOwnPropertyDescriptor,We=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?Ke(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&Qe(s,n,a),a};let Je=class extends ae{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.showInstructorModal=!1,this.instructorError="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutSeconds=0,this.showPinConfirmation=!1,this.lockoutInterval=null,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.instructorError="",this.pin="",this.lockoutSeconds=0,this.showPinConfirmation=!1,this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null),this.updateVisibility()},this.handleInstructorPasswordSubmit=t=>{this.handleInstructorLogin(t.detail.password)},this.handleInstructorModalClose=()=>{this.showInstructorModal=!1,this.instructorError=""},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){C(u.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return Yt`
      <div class="login-container">
        <div class="title">${this.title} <qd-build-info></qd-build-info></div>

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
            ?disabled=${this.isSubmitting||this.lockoutSeconds>0}
            required
          />

          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting||!this.isValid()||this.lockoutSeconds>0}
          >
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

          ${this.errorMessage?Yt`<div class="error-message">${this.errorMessage}</div>`:""}
          ${this.lockoutSeconds>0?Yt`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
                Too many attempts. Try again in ${this.lockoutSeconds}s
              </div>`:""}
        </form>
      </div>

      <qd-password-modal
        .open=${this.showInstructorModal}
        title="Instructor Login"
        .error=${this.instructorError}
        @qd:password-submit=${this.handleInstructorPasswordSubmit}
        @close=${this.handleInstructorModalClose}
      ></qd-password-modal>

      <qd-confirm-dialog
        .open=${this.showPinConfirmation}
        title="PIN Stored"
        message="Your PIN has been saved. Use it with your name and service ID on future logins."
        confirmText="OK"
        cancelText=""
        @qd:confirm=${this.handlePinConfirmationDismiss}
        @qd:cancel=${this.handlePinConfirmationDismiss}
      ></qd-confirm-dialog>
    `}handleNameInput(t){const s=t.target;this.name=s.value,this.errorMessage=""}handleServiceIdInput(t){const s=t.target;this.serviceId=s.value,this.errorMessage=""}handlePinInput(t){const s=t.target;this.pin=function(t){return t.replace(/\D/g,"")}(s.value),this.errorMessage=""}isValid(){return 0===function(t,s,n){const r=[];t&&""!==t.trim()||r.push("Name required"),s?/^[a-zA-Z0-9]{2,10}$/.test(s)||r.push("Service ID must be 2-10 alphanumeric characters"):r.push("Service ID required");n?/^\d{4}$/.test(n)||r.push("PIN must be exactly 4 digits"):r.push("PIN required");return r}(this.name,this.serviceId,this.pin).length}getRelease(){const t=document.getElementById(ve),s=t?.textContent?.trim()||".wh_publication_title .title",n=document.querySelector(s);return n?.textContent?.trim()||""}async handleStudentLogin(t){if(t.preventDefault(),this.isValid()){this.isSubmitting=!0,this.errorMessage="";try{const t=this.getRelease();if(!t)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const n=this.serviceId.trim(),r=this.name.trim(),o=Ie(n);if(o.isLocked)return this.startLockoutCountdown(o.remainingMs),void(this.isSubmitting=!1);const c=document.getElementById(ye);if(!c?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${ye}">dbName</span> to page.`);const d=U(c.textContent.trim());await d.init();const l=await d.getStudent(t,n);if(!l){const s=await Ee(this.pin),o={schema:2,docId:"",release:t,serviceId:n,name:r,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:s,pinCreatedAt:(new Date).toISOString()};return await d.saveStudent(o),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,r,t)}if(l.schema<2||!function(t){return Boolean(t.pinHash&&t.pinHash.length>0)}(l)){const s=function(t,s){return{...t,schema:2,pinHash:s,pinCreatedAt:(new Date).toISOString()}}(l,await Ee(this.pin));return await d.saveStudent(s),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,r,t)}if(!(await async function(t,s){return function(t,s){if(t.length!==s.length)return!1;let n=0;for(let r=0;r<t.length;r++)n|=t.charCodeAt(r)^s.charCodeAt(r);return 0===n}(await Ee(t),s)}(this.pin,l.pinHash||""))){const t=function(t){const n=(new Date).toISOString();let r=$e(t);if(r||(r={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:n}),r.attempts+=1,r.lastAttempt=n,r.attempts>=h){const n=new Date(Date.now()+p);r.lockoutUntil=n.toISOString(),a(`PIN lockout triggered for ${s(t)} after ${r.attempts} failed attempts`)}else r.attempts,s(t);const o=Ce(t);return sessionStorage.setItem(o,JSON.stringify(r)),r}(n),r=function(t){const s=$e(t);return s?Ie(t).isLocked?0:Math.max(0,h-s.attempts):h}(n);if(t.lockoutUntil){const s=new Date(t.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(s)}else this.errorMessage=`Incorrect PIN. ${r} attempt${1!==r?"s":""} remaining`;return this.pin="",void(this.isSubmitting=!1)}qe(n),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}));this.completeLogin(n,r,t)}catch(n){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",n),this.isSubmitting=!1}}else this.errorMessage="Please enter name, service ID, and 4-digit PIN"}showPinStoredConfirmation(){this.showPinConfirmation=!0}startLockoutCountdown(t){this.lockoutSeconds=Math.ceil(t/1e3),this.errorMessage="",this.lockoutInterval&&clearInterval(this.lockoutInterval),this.lockoutInterval=window.setInterval(()=>{this.lockoutSeconds--,this.lockoutSeconds<=0&&this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)},1e3)}completeLogin(t,s,n){(new SessionService).createSession(t,s,n);const r=new CustomEvent("qd:login",{detail:{serviceId:t,name:s,release:n,role:"student"},bubbles:!0,composed:!0});this.dispatchEvent(r),this.pin="",this.isSubmitting=!1,this.updateVisibility()}openInstructorModal(){this.showInstructorModal=!0,this.instructorError=""}async hashPassword(t){const s=(new TextEncoder).encode(t),n=await crypto.subtle.digest("SHA-256",s);return Array.from(new Uint8Array(n)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){const t=document.getElementById(we);return t?.textContent?.trim()||""}async handleInstructorLogin(t){try{const s=await this.hashPassword(t),n=this.getExpectedHash();if(!n)return void(this.instructorError="Instructor password not configured");if(s!==n)return void(this.instructorError="Incorrect password");const r=this.getRelease();(new SessionService).createSession("INSTRUCTOR","Instructor",r||""),sessionStorage.setItem(u.INSTRUCTOR,"true");const o=new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:r||"",role:"instructor"},bubbles:!0,composed:!0});this.dispatchEvent(o),this.showInstructorModal=!1,this.instructorError="",this.updateVisibility()}catch(s){this.instructorError="Login failed. Please try again.",console.error("Instructor login error:",s)}}};Je.styles=mt`
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
    }
  `,We([he({type:String})],Je.prototype,"title",2),We([pe()],Je.prototype,"name",2),We([pe()],Je.prototype,"serviceId",2),We([pe()],Je.prototype,"showInstructorModal",2),We([pe()],Je.prototype,"instructorError",2),We([pe()],Je.prototype,"errorMessage",2),We([pe()],Je.prototype,"isSubmitting",2),We([pe()],Je.prototype,"pin",2),We([pe()],Je.prototype,"lockoutSeconds",2),We([pe()],Je.prototype,"showPinConfirmation",2),Je=We([de("qd-login")],Je);var Ye=Object.defineProperty,Ge=Object.getOwnPropertyDescriptor,Ze=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?Ge(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&Ye(s,n,a),a};let Xe=class extends ae{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent)}render(){const t=this.serviceId.slice(-4);return Yt`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${t}
          </span>
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
    `}loadCache(){const t=C(u.SESSION);t?(this.name=t.name||"",this.serviceId=t.serviceId||""):(this.name="",this.serviceId="");const s=C(u.CACHE);if(!s)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");this.total=s.totals.total,this.correct=s.totals.correct,this.percentage=this.calculatePercentage(s.totals.total,s.totals.correct),this.statusColor=this.calculateStatusColor(s.totals.total,s.totals.correct)}calculatePercentage(t,s){return 0===t?0:Math.round(s/t*100)}calculateStatusColor(t,s){return function(t,s){return 0===t||0===s?"red":s===t?"green":"amber"}(t,s)}updateVisibility(){const t=C(u.SESSION),s="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&!s?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const t=C(u.SESSION);(new SessionService).clearSession();const s=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(s)}};Xe.styles=mt`
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
  `,Ze([pe()],Xe.prototype,"total",2),Ze([pe()],Xe.prototype,"correct",2),Ze([pe()],Xe.prototype,"percentage",2),Ze([pe()],Xe.prototype,"statusColor",2),Ze([pe()],Xe.prototype,"name",2),Ze([pe()],Xe.prototype,"serviceId",2),Xe=Ze([de("qd-status")],Xe);const ts=mt`
  :host {
    display: inline-block;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  /* When showing modal, host should not constrain size */
  :host([showmodal]) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none; /* Let clicks through except on modal */
  }

  :host([showmodal]) .modal-overlay {
    pointer-events: auto; /* Re-enable on overlay */
  }

  .instructor-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .instructor-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--qd-text-on-dark, #fff);
    margin-right: 8px;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--qd-text-on-dark, #fff);
    user-select: none;
  }

  .toggle-label input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  button:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  button:active {
    background: #e5e5e5;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.compact {
    padding: 6px 12px;
    font-size: 13px;
  }

  button.primary {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  button.primary:hover {
    background: #0056b3;
    border-color: #0056b3;
  }

  button.secondary {
    background: #ff9800;
    color: white;
    border-color: #ff9800;
  }

  button.secondary:hover {
    background: #f57c00;
    border-color: #f57c00;
  }

  button.danger {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
  }

  button.danger:hover {
    background: #c82333;
    border-color: #c82333;
  }

  button.logout {
    background: #6c757d;
    color: white;
    border-color: #6c757d;
  }

  button.logout:hover {
    background: #5a6268;
    border-color: #5a6268;
  }

  input,
  textarea {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  .error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
  }

  .success {
    color: #28a745;
    font-size: 12px;
    margin-top: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  th,
  td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    color: #333; /* Explicit dark text */
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #000; /* Explicit black for headers */
  }

  tr:hover {
    background: #f9f9f9;
  }

  .correct {
    color: #28a745;
  }

  .incorrect {
    color: #dc3545;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--qd-modal-overlay-z-index, 9999);
    pointer-events: auto; /* Ensure overlay catches all clicks */
  }

  .modal-content {
    position: relative;
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 800px;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: var(--qd-modal-z-index, 10000);
    color: #333; /* Explicit dark text color */
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #000; /* Explicit black for title */
  }

  .close-button {
    padding: 4px 8px;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }

  .close-button:hover {
    color: #000;
  }
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],s=t[Math.min(this.failureCount-1,t.length-1)]??3e4;this.lockoutUntil=Date.now()+s}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const es="instructor.password.hash";var ss=Object.defineProperty,ns=Object.getOwnPropertyDescriptor,rs=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?ns(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&ss(s,n,a),a};let os=class extends ae{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=t=>{const s=t.target;this.password=s.value,this.error=""},this.handleSubmit=async t=>{t.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const t=function(){const t=document.getElementById(es);if(!t){const t=`Instructor password hash not found. Expected element with id="${es}". Check Oxygen XSL transform configuration.`;throw o(t),new Error(t)}const s=t.textContent?.trim();if(!s){const t="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw o(t),new Error(t)}if(!/^[a-f0-9]{64}$/i.test(s)){const t=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${s.substring(0,20)}...`;throw o(t),new Error(t)}return s.toLowerCase()}(),s=(new TextEncoder).encode(this.password),n=await crypto.subtle.digest("SHA-256",s),r=Array.from(new Uint8Array(n)).map(t=>t.toString(16).padStart(2,"0")).join(""),a=await async function(t,s){if(t.length!==s.length)return!1;if(0===t.length)return!0;const n=new TextEncoder,r=n.encode(t),o=n.encode(s);try{const t=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),s=await crypto.subtle.sign("HMAC",t,o),n=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),a=await crypto.subtle.sign("HMAC",n,r);if(s.byteLength!==a.byteLength)return!1;const c=new Uint8Array(s),d=new Uint8Array(a);let l=0;for(let r=0;r<c.length;r++)l|=(c[r]??0)^(d[r]??0);return 0===l}catch(a){return console.error("Constant-time comparison failed:",a),!1}}(r,t);a?(this.rateLimiter.reset(),this.password="",this.error="",E(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return Yt`
      <div class="unlock-container">
        <h3>Instructor Access</h3>
        <p>Enter the instructor password to unlock administrative features.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="password">Password:</label>
            <input
              type="password"
              id="password"
              .value=${this.password}
              @input=${this.handlePasswordInput}
              ?disabled=${t}
              autocomplete="current-password"
              required
            />
          </div>

          ${this.error?Yt`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};os.styles=ts,rs([pe()],os.prototype,"password",2),rs([pe()],os.prototype,"error",2),rs([pe()],os.prototype,"remainingSeconds",2),os=rs([de("qd-instructor-unlock")],os);var is=Object.defineProperty,as=Object.getOwnPropertyDescriptor,cs=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?as(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&is(s,n,a),a};let ds=class extends ae{constructor(){super(...arguments),this.open=!1,this.students=[],this.expandedStudents=new Set,this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}updated(t){t.has("open")&&this.open&&(this.expandedStudents=new Set(this.students.map(t=>t.serviceId)))}render(){return Yt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Student Scores</span>
        <div class="scores-content">
          ${0===this.students.length?Yt`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const t=[...this.students].sort((t,s)=>t.name.localeCompare(s.name));return Yt`
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Service ID</th>
            <th>Attempted</th>
            <th>Correct</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${t.map(t=>this.renderStudentRow(t))}
        </tbody>
      </table>
    `}renderStudentRow(t){const s=this.calculateSummary(t),n=this.expandedStudents.has(t.serviceId);return Yt`
      <tr class="student-row" @click=${()=>this.toggleStudent(t.serviceId)}>
        <td>
          <span class="expand-icon">${n?"▼":"▶"}</span>
          ${s.name}
        </td>
        <td>${s.serviceId}</td>
        <td>${s.attempted}</td>
        <td
          class=${s.correct===s.attempted&&s.attempted>0?"correct-highlight":""}
        >
          ${s.correct}
        </td>
        <td class=${this.getPercentageClass(s.percentage)}>${s.percentage}%</td>
      </tr>
      ${n?this.renderDetailRow(t):Zt}
    `}renderDetailRow(t){const s=Object.entries(t.pages);return Yt`
      <tr class="detail-row">
        <td colspan="5">
          ${0===s.length?Yt`<span class="no-pages">No quiz pages attempted</span>`:Yt`
                <div class="page-breakdown">
                  ${s.map(([t,s])=>Yt`
                      <div class="page-row">
                        <span class="page-name">${t}</span>
                        <div class="answers-list">
                          ${s.answers.map((t,s)=>Yt`
                              <span class="answer-badge ${this.getAnswerClass(t)}">
                                Q${s+1}: ${t?t.answer:"—"}
                              </span>
                            `)}
                        </div>
                      </div>
                    `)}
                </div>
              `}
        </td>
      </tr>
    `}calculateSummary(t){const s=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:s}}getPercentageClass(t){return 100===t?"correct-highlight":0===t?"incorrect-highlight":""}getAnswerClass(t){return t?t.success?"correct":"incorrect":"unanswered"}toggleStudent(t){const s=new Set(this.expandedStudents);s.has(t)?s.delete(t):s.add(t),this.expandedStudents=s}show(){this.open=!0}close(){this.open=!1}};ds.styles=mt`
    :host {
      display: contents;
    }

    .scores-content {
      min-width: 600px;
      max-width: 800px;
    }

    .empty-message {
      color: #666;
      padding: 20px;
      text-align: center;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
      background: #f5f5f5;
      font-weight: 600;
    }

    .student-row {
      cursor: pointer;
    }

    .student-row:hover {
      background: #f9f9f9;
    }

    .student-row td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }

    .expand-icon {
      display: inline-block;
      width: 16px;
      margin-right: 4px;
      text-align: center;
    }

    .correct-highlight {
      color: #28a745;
    }

    .incorrect-highlight {
      color: #dc3545;
    }

    .detail-row {
      background: #f9f9f9;
    }

    .detail-row td {
      padding: 8px 8px 8px 40px;
      border-bottom: 1px solid #eee;
    }

    .page-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .page-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .page-name {
      font-weight: 600;
      min-width: 120px;
      flex-shrink: 0;
    }

    .answers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
    }

    .answer-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
    }

    .answer-badge.correct {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .answer-badge.incorrect {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .answer-badge.unanswered {
      background: #e0e0e0;
      color: #666;
    }

    .no-pages {
      color: #666;
      font-style: italic;
    }
  `,cs([he({type:Boolean,reflect:!0})],ds.prototype,"open",2),cs([he({type:Array})],ds.prototype,"students",2),cs([pe()],ds.prototype,"expandedStudents",2),ds=cs([de("qd-scores-modal")],ds);var ls=Object.defineProperty,us=Object.getOwnPropertyDescriptor,hs=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?us(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&ls(s,n,a),a};let ps=class extends ae{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return Yt`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};ps.styles=ts,hs([he({type:Array})],ps.prototype,"students",2),hs([he({type:Boolean})],ps.prototype,"showModal",2),ps=hs([de("qd-instructor-scores")],ps);var ms=Object.defineProperty,gs=Object.getOwnPropertyDescriptor,fs=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?gs(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&ms(s,n,a),a};let bs=class extends ae{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),s=new Blob([t],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(s),r=document.createElement("a");r.href=n;const o=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);r.download=`quiz-data-${o}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}}escapeCSVField(t){const s=String(t);return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const s of this.students)for(const[n,r]of Object.entries(s.pages)){(r.answers||[]).forEach((r,o)=>{r&&t.push([this.escapeCSVField(s.serviceId),this.escapeCSVField(s.name),this.escapeCSVField(s.release),this.escapeCSVField(n),this.escapeCSVField(o),this.escapeCSVField(r.answer),this.escapeCSVField(r.success),this.escapeCSVField(r.timestamp)].join(","))})}return t.join("\n")}render(){const t=this.students.length>0&&this.students.some(t=>t.attempted>0),s=t?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return Yt`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${s}
      >
        Export CSV
      </button>
    `}};bs.styles=ts,fs([he({type:Array})],bs.prototype,"students",2),bs=fs([de("qd-instructor-export")],bs);var vs=Object.defineProperty,ws=Object.getOwnPropertyDescriptor,ys=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?ws(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&vs(s,n,a),a};let Ss=class extends ae{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const s=t.target;this.confirmText=s.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{q(),E(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),oe(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return Yt`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?Yt`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t="DELETE ALL DATA"===this.confirmText;return Yt`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${t=>{t.target===t.currentTarget&&this.handleCancelClear()}}
      >
        <div
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${t=>t.stopPropagation()}
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h2 style="font-size: 18px; font-weight: 600; margin: 0; color: #000;">
              Confirm Data Deletion
            </h2>
            <button
              style="padding: 4px 8px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #666;"
              @click=${this.handleCancelClear}
            >
              ✕
            </button>
          </div>

          <p style="color: #dc3545; font-weight: 600; margin: 12px 0;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p style="margin: 12px 0; color: #333;">
            This action cannot be undone. All students will need to start over.
          </p>

          <p style="margin: 12px 0; color: #333;">
            Type <strong>DELETE ALL DATA</strong> to confirm:
          </p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin: 16px 0; box-sizing: border-box;"
            autocomplete="off"
          />

          ${this.error?Yt`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button
              style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer; font-size: 14px;"
              @click=${this.handleCancelClear}
            >
              Cancel
            </button>
            <button
              style="padding: 8px 16px; border: none; border-radius: 4px; background: ${t?"#dc3545":"#ccc"}; color: white; cursor: ${t?"pointer":"not-allowed"}; font-size: 14px;"
              @click=${this.handleConfirmClear}
              ?disabled=${!t}
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};Ss.styles=ts,ys([pe()],Ss.prototype,"showConfirmDialog",2),ys([pe()],Ss.prototype,"confirmText",2),ys([pe()],Ss.prototype,"error",2),ys([pe()],Ss.prototype,"success",2),Ss=ys([de("qd-instructor-manage")],Ss);var xs=Object.defineProperty,Es=Object.getOwnPropertyDescriptor,Cs=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?Es(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&xs(s,n,a),a};let $s=class extends ae{constructor(){super(...arguments),this.students=[],this.open=!1,this.searchText="",this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleSearchInput=t=>{const s=t.target;this.searchText=s.value,this.updateComplete.then(()=>{this.syncContentToPortal()})},this.handleResetClick=t=>{this.confirmingStudent=t,this.confirmDialogOpen=!0},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(t){this.open=t}get showModal(){return this.open}get filteredStudents(){if(!this.searchText.trim())return this.students;const t=this.searchText.toLowerCase().trim();return this.students.filter(s=>s.name.toLowerCase().includes(t)||s.serviceId.toLowerCase().includes(t))}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.searchText="",this.errorMessage=""}show(){this.open=!0}async executeReset(t){try{const n=document.getElementById(ye);if(!n?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${ye}">dbName</span> to page.`);const r=U(n.textContent.trim());await r.init();const o=(s=t,{...s,pinHash:"",pinResetAt:(new Date).toISOString()});await r.saveStudent(o);const a={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:t.release};await r.saveAuditEvent(a);const c=this.students.findIndex(s=>s.serviceId===t.serviceId);c>=0&&(this.students[c]=o,this.students=[...this.students]),this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.confirmDialogOpen=!1,this.confirmingStudent=null,this.errorMessage="",this.updateComplete.then(()=>{this.syncContentToPortal()})}catch(n){console.error("PIN reset error:",n),this.errorMessage="Failed to reset PIN. Please try again.",this.confirmDialogOpen=!1,this.confirmingStudent=null,this.updateComplete.then(()=>{this.syncContentToPortal()})}var s}syncContentToPortal(){const t=document.querySelector(".qd-modal-backdrop");if(!t)return;const s=t.querySelector(".student-list");if(!s)return;s.innerHTML="";const n=this.filteredStudents;if(0===n.length){const t=document.createElement("div");t.className="empty-message",t.textContent=this.searchText?"No matching students":"No students found",t.style.cssText="padding: 16px; text-align: center; color: #666; font-size: 12px;",s.appendChild(t)}else n.forEach(t=>{const n=document.createElement("div");n.className="student-item",n.style.cssText="\n          display: flex;\n          justify-content: space-between;\n          align-items: center;\n          padding: 8px 12px;\n          border-bottom: 1px solid #f0f0f0;\n        ";const r=document.createElement("div"),o=document.createElement("div");o.className="student-name",o.textContent=t.name,o.style.cssText="font-size: 12px; font-weight: 500;";const a=document.createElement("div");a.className="student-id",a.textContent=`ID: ${t.serviceId}`,a.style.cssText="font-size: 10px; color: #666;";const c=document.createElement("div");c.className="pin-status";const d=t.pinHash&&t.pinHash.length>0;c.textContent=d?"PIN set":"No PIN",c.style.cssText=`font-size: 10px; color: ${d?"#4caf50":"#ff9800"};`,r.appendChild(o),r.appendChild(a),r.appendChild(c);const l=document.createElement("button");l.className="reset-btn",l.textContent="Reset PIN",l.type="button",l.style.cssText="\n          background: #ff5722;\n          color: white;\n          border: none;\n          border-radius: 4px;\n          padding: 4px 8px;\n          font-size: 10px;\n          cursor: pointer;\n        ",l.onclick=()=>this.handleResetClick(t),n.appendChild(r),n.appendChild(l),s.appendChild(n)});let r=t.querySelector(".error-message");if(this.errorMessage){if(!r){r=document.createElement("div"),r.className="error-message";const s=t.querySelector(".qd-modal-body");s?.appendChild(r)}r.textContent=this.errorMessage,r.style.cssText="\n        color: #d32f2f;\n        font-size: 11px;\n        margin-top: 8px;\n        padding: 8px;\n        background: #ffebee;\n        border-radius: 4px;\n      "}else r?.remove()}setupPortalListeners(){const t=document.querySelector(".qd-modal-backdrop");if(!t)return;const s=t.querySelector(".search-input");s&&(s.oninput=this.handleSearchInput,s.focus()),this.syncContentToPortal()}updated(t){t.has("open")&&this.open&&setTimeout(()=>{this.setupPortalListeners()},0),t.has("students")&&this.open&&this.updateComplete.then(()=>{this.syncContentToPortal()})}render(){if(!this.open)return Zt;const t=this.confirmingStudent,s=t?`Reset PIN for <strong>${t.name}</strong> (${t.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return Yt`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        <div class="pin-reset-content">
          <input
            type="text"
            class="search-input"
            placeholder="Search by name or ID..."
            .value=${this.searchText}
          />

          <div class="student-list">
            ${0===this.filteredStudents.length?Yt`<div class="empty-message">
                  ${this.searchText?"No matching students":"No students found"}
                </div>`:this.filteredStudents.map(t=>Yt`
                    <div class="student-item">
                      <div>
                        <div class="student-name">${t.name}</div>
                        <div class="student-id">ID: ${t.serviceId}</div>
                        <div class="pin-status ${t.pinHash?"has-pin":"no-pin"}">
                          ${t.pinHash?"PIN set":"No PIN"}
                        </div>
                      </div>
                      <button class="reset-btn" type="button">Reset PIN</button>
                    </div>
                  `)}
          </div>

          ${this.errorMessage?Yt`<div class="error-message">${this.errorMessage}</div>`:""}
        </div>
      </qd-modal>

      <qd-confirm-dialog
        .open=${this.confirmDialogOpen}
        title="Reset PIN"
        .message=${s}
        confirmText="Reset PIN"
        cancelText="Cancel"
        destructive
        @qd:confirm=${this.handleConfirmReset}
        @qd:cancel=${this.handleCancelReset}
      ></qd-confirm-dialog>
    `}};$s.styles=mt`
    :host {
      display: contents;
    }

    .pin-reset-content {
      min-width: 400px;
      max-width: 500px;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .search-input:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
    }

    .student-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .student-item:last-child {
      border-bottom: none;
    }

    .student-name {
      font-size: 12px;
      font-weight: 500;
    }

    .student-id {
      font-size: 10px;
      color: #666;
    }

    .pin-status {
      font-size: 10px;
    }

    .pin-status.has-pin {
      color: #4caf50;
    }

    .pin-status.no-pin {
      color: #ff9800;
    }

    .reset-btn {
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    }

    .reset-btn:hover {
      background: #e64a19;
    }

    .empty-message {
      padding: 16px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    }
  `,Cs([he({type:Array})],$s.prototype,"students",2),Cs([he({type:Boolean,reflect:!0})],$s.prototype,"open",2),Cs([pe()],$s.prototype,"searchText",2),Cs([pe()],$s.prototype,"confirmingStudent",2),Cs([pe()],$s.prototype,"confirmDialogOpen",2),Cs([pe()],$s.prototype,"errorMessage",2),Cs([he({type:Boolean})],$s.prototype,"showModal",1),$s=Cs([de("qd-pin-reset-dialog")],$s);var Is=Object.defineProperty,qs=Object.getOwnPropertyDescriptor,As=(t,s,n,r)=>{for(var o,a=r>1?void 0:r?qs(s,n):s,c=t.length-1;c>=0;c--)(o=t[c])&&(a=(r?o(s,n,a):o(a))||a);return r&&a&&Is(s,n,a),a};let ks=class extends ae{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.handleLoginEvent=t=>{const s=t,n=s.detail?.role;this.updateVisibility(),"instructor"===n&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{const t=C(u.SESSION);if(t){try{const{getStorageService:s}=await Promise.resolve().then(()=>Q),n=s(),r=await n.getStudentsByRelease(t.release);this.students=r}catch(s){console.error("Failed to load students:",s),this.students=[]}this.showPinReset=!0}},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const t=C(u.SESSION);if(t){try{const{getStorageService:s}=await Promise.resolve().then(()=>Q),n=s(),r=await n.getStudentsByRelease(t.release);this.students=r}catch(s){console.error("Failed to load students:",s),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=C(u.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const s=t.target;if(this.showStudentAnswers=s.checked,this.showStudentAnswers&&0===this.students.length){const t=C(u.SESSION);if(t)try{const{getStorageService:s}=await Promise.resolve().then(()=>Q),n=s(),r=await n.getStudentsByRelease(t.release);this.students=r}catch(r){console.error("Failed to load students for toggle:",r)}}const n=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(n,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&this.unlock();const s=sessionStorage.getItem("qd/instructor/showAnswers");null!==s&&(this.showStudentAnswers="true"===s,this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){"true"===sessionStorage.getItem(u.INSTRUCTOR)?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(t){this.students=t}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?Yt`
      <div class="instructor-panel">
        <div class="instructor-title">Instructor Mode <qd-build-info></qd-build-info></div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show student answers on page
        </label>

        <button @click=${this.handleViewScores} class="primary compact">View All Scores</button>

        <button @click=${this.handleResetPins} class="secondary compact">Reset PINs</button>

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>

        <button @click=${this.handleLogout} class="logout">Logout</button>

        <qd-instructor-scores
          .students=${this.students}
          .showModal=${this.showScores}
          @close=${this.handleCloseScores}
        ></qd-instructor-scores>

        <qd-pin-reset-dialog
          .students=${this.students}
          .showModal=${this.showPinReset}
          @close=${this.handleClosePinReset}
          @qd:pin-reset=${this.handlePinReset}
        ></qd-pin-reset-dialog>
      </div>
    `:Yt`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};ks.styles=[ts,mt`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],As([pe()],ks.prototype,"unlocked",2),As([pe()],ks.prototype,"showScores",2),As([pe()],ks.prototype,"students",2),As([pe()],ks.prototype,"showStudentAnswers",2),As([pe()],ks.prototype,"showPinReset",2),ks=As([de("qd-instructor")],ks);const Ts={statusPanel:".wh_top_menu_and_indexterms_link"};function Ps(t={}){const s=t.statusPanelContainer||Ts.statusPanel;!function(t){const s=document.querySelector(t);if(!s)return null;const n=document.createElement("qd-login");s.appendChild(n)}(s),function(t){const s=document.querySelector(t);if(!s)return null;const n=document.createElement("qd-status");s.appendChild(n)}(s),function(t){const s=document.querySelector(t);if(!s)return null;const n=document.createElement("qd-instructor");s.appendChild(n)}(s)}const _s={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},Ns={unstarted:"red",incomplete:"amber",complete:"green"};function Os(t){const s=function(t,s){if(!t||!s?.pages)return"unstarted";const n=s.pages[t];return n?.state??"unstarted"}(t.getAttribute("data-page-id"),C(u.CACHE));!function(t,s){Object.values(_s).forEach(s=>{t.classList.remove(s)});const n=_s[Ns[s]];t.classList.add(n)}(t,s)}function Ls(){const t=document.querySelectorAll(".quizPageBtn"),s=C(u.CACHE),n="true"===sessionStorage.getItem(u.INSTRUCTOR);if(!s||n)return t.forEach(t=>{Object.values(_s).forEach(s=>{t.classList.remove(s)})}),void t.length;t.forEach(t=>{Os(t)}),t.length}function Ds(t){const s=t,{pageId:n}=s.detail,r=document.querySelector(`[data-page-id="${n}"]`);r&&r.classList.contains("quizPageBtn")&&Os(r)}function Rs(){Ls()}function zs(){const t=document.querySelectorAll(".quizPageBtn");t.forEach(t=>{Object.values(_s).forEach(s=>{t.classList.remove(s)})}),t.length}const Ms={initialized:!1};async function Hs(t={}){if(Ms.initialized)return void a("Bootstrap already initialized, skipping");if(function(){if(document.getElementById("qd-global-styles"))return;const t=document.createElement("style");t.id="qd-global-styles",t.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: 1rem;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor mode: Student answers display */\n    .qd-student-answers {\n      margin-top: 12px;\n      padding: 8px;\n      background: #f8f9fa;\n      border-radius: 4px;\n      border: 1px solid #dee2e6;\n    }\n\n    .qd-student-answer {\n      font-size: 12px;\n      padding: 4px 0;\n      line-height: 1.4;\n    }\n\n    .qd-student-answer.qd-correct {\n      color: #28a745;\n    }\n\n    .qd-student-answer.qd-incorrect {\n      color: #dc3545;\n    }\n\n    .qd-student-name {\n      font-weight: 600;\n    }\n\n    .qd-student-answer-text {\n      margin: 0 4px;\n    }\n\n    .qd-timestamp {\n      color: #6c757d;\n      font-size: 11px;\n      margin-left: 8px;\n    }\n  ",document.head.appendChild(t)}(),!t.dbName){const t="FATAL: dbName not provided in bootstrap config. Processing stopped.";throw console.error(t),new Error(t)}const s=V(t.dbName);await s.init();const n=new EventCoordinator;n.initialize(),Ms.eventCoordinator=n;const r=new SessionCoordinator;r.initialize(),Ms.sessionCoordinator=r,Ps({statusPanelContainer:t.statusPanelContainer,dbName:t.dbName}),!1!==t.autoEnhanceQuizTables&&function(){const t=document.querySelectorAll("table.qd-quiz");if(0===t.length)return;t.length;for(const n of Array.from(t))try{W(n,{interactive:!1})}catch(s){a(`Failed to enhance quiz table: ${s.message}`)}t.length}(),!1!==t.autoEnhanceAnalysisTables&&function(){const t=document.querySelectorAll("table.qd-analysis");if(0===t.length)return;t.length;for(const n of Array.from(t))try{at(n,{interactive:!1})}catch(s){a(`Failed to enhance analysis table: ${s.message}`)}t.length}(),!1!==t.autoEnhanceHomeBadges&&function(){const t=document.querySelectorAll(".quizPageBtn");if(0===t.length)return;t.length;try{document.querySelectorAll(".quizPageBtn").forEach(t=>{const s=function(t){const s=t.getAttribute("href");return s&&s.substring(s.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(t);s?(t.setAttribute("data-page-id",s),t.textContent?.trim()):t.getAttribute("href")}),Ls(),document.addEventListener("qd:state-changed",Ds),document.addEventListener("qd:cache-rebuild",Rs),document.addEventListener("qd:logout",zs)}catch(s){a(`Failed to enhance home badges: ${s.message}`)}}(),await async function(){const t=C(u.SESSION);if(!t)return;if("true"===sessionStorage.getItem(u.INSTRUCTOR)){const t=window.location.pathname,s=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"");return void document.querySelectorAll("table.qd-quiz").forEach(t=>{const n=Z(t);if(!n)return;n.pageId=s;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,s)=>{const r=n.parsed.questions[s];r&&t instanceof HTMLTableCellElement&&(t.textContent=r.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const r=()=>{X(t,n)},o=()=>{tt(t)};document.addEventListener("qd:instructor-show-answers",r),document.addEventListener("qd:instructor-hide-answers",o);"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&r()})}t.serviceId;const s=V();let n=C(u.CACHE);if(!n)try{const r=await s.loadStudentRecord(t);n=s.buildCache(r),$(u.CACHE,n),n.totals.total}catch{a("Failed to rebuild cache from IndexedDB, using empty cache"),n={totals:{total:0,answered:0,correct:0},pages:{}},$(u.CACHE,n)}const r=window.location.pathname,o=r.substring(r.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!o)return;const c=document.querySelectorAll("table.qd-quiz");c.length>0&&(c.length,c.forEach(t=>{W(t,{interactive:!0,pageId:o})}));const d=document.querySelectorAll("table.qd-analysis");d.length>0&&(d.length,d.forEach(t=>{at(t,{interactive:!0,pageId:o})}))}(),Ms.initialized=!0}if("undefined"!=typeof window){const t=()=>{const t=xe();Hs({dbName:t.dbName,statusPanelContainer:t.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(t=>{console.error("[FATAL] Bootstrap failed:",t)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{t()}):t()}return t.BUILD_DATE="26/Nov/2025",t.DEFAULT_CONTAINERS=Ts,t.Debouncer=Debouncer,t.SCHEMA_VERSION=2,t.SESSION_TIMEOUT_MS=l,t.STORAGE_KEYS=u,t.VERSION="0.1.0-phase3.1",t.bootstrap=Hs,t.calculateCompletionState=j,t.cleanup=function(){Ms.initialized?(Ms.eventCoordinator?.cleanup(),Ms.sessionCoordinator?.cleanup(),Ms.initialized=!1,Ms.eventCoordinator=void 0,Ms.sessionCoordinator=void 0):a("Bootstrap not initialized, nothing to cleanup")},t.clearQuizData=q,t.enhanceAnalysisTable=at,t.enhanceQuizTable=W,t.error=o,t.generateCellKey=nt,t.generateTableId=st,t.getAnalysisTableMetadata=function(t){return it.get(t)},t.getJSON=C,t.getQuizTableMetadata=Z,t.info=r,t.injectComponents=Ps,t.isAnalysisTableEnhanced=function(t){return it.has(t)},t.isCellEditable=rt,t.isInitialized=function(){return Ms.initialized},t.isQuizTableEnhanced=function(t){return K.has(t)},t.parseAnalysisTable=ot,t.parseQuizTable=c,t.setJSON=$,t.validateAnswer=d,t.warn=a,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),t}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
