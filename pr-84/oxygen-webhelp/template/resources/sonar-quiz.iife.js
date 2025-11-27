var SonarQuiz=function(t){"use strict";function s(t){if(t.length<2)return"**";if(2===t.length)return t;return t.slice(0,2)+"*".repeat(t.length-2)}function n(t){if(null===t||"object"!=typeof t)return t;const o={};for(const[r,a]of Object.entries(t))"name"!==r&&"passwordHash"!==r&&(o[r]="serviceId"!==r||"string"!=typeof a?"object"!=typeof a||null===a?a:n(a):s(a));return o}function o(t,s){}function r(t,s){if(s instanceof Error){const n={name:s.name,message:s.message};console.error(`[ERROR] ${t}`,n)}else void 0!==s?console.error(`[ERROR] ${t}`,n(s)):console.error(`[ERROR] ${t}`)}function a(t,s){void 0!==s?console.warn(`[WARN] ${t}`,n(s)):console.warn(`[WARN] ${t}`)}function c(t){const s=[],n=[];if(!t.classList.contains("qd-quiz"))return s.push('Table must have class "qd-quiz"'),{element:t,questions:n,errors:s};const o=Array.from(t.querySelectorAll("tbody tr"));return 0===o.length?(s.push("Quiz table has no data rows"),{element:t,questions:n,errors:s}):(o.forEach((t,o)=>{const r=Array.from(t.querySelectorAll("td"));if(3!==r.length)return void s.push(`Row ${o+1} has ${r.length} columns, expected 3 (Question | Answer | Detail)`);const a=r[0],c=r[1],d=r[2];if(!a||!c||!d)return;const l=a.textContent?.trim()||"";if(!l)return void s.push(`Row ${o+1} has empty question text`);const u=c.textContent?.trim()||"";if(!u)return void s.push(`Row ${o+1} has empty answer`);const h=d.querySelector("ol");if(h){const t=(p=h,Array.from(p.querySelectorAll("li")).map(t=>t.textContent?.trim()||"").filter(t=>t.length>0));if(0===t.length)return void s.push(`Row ${o+1} MCQ has no options in <ol>`);n.push({text:l,kind:"mcq",correctAnswer:u,options:t})}else{const t=d.textContent?.trim()||"",r=parseFloat(t);if(isNaN(r))return void s.push(`Row ${o+1} appears to be numeric but has invalid tolerance: "${t}"`);n.push({text:l,kind:"numeric",correctAnswer:u,tolerance:r})}var p}),{element:t,questions:n,errors:s.length>0?s:void 0})}function d(t,s){if(!s||""===s.trim())return!1;const n=s.trim();if("mcq"===t.kind)return n===t.correctAnswer;{const s=parseFloat(n),o=parseFloat(t.correctAnswer);if(isNaN(s)||isNaN(o))return!1;const r=t.tolerance??0;return Math.abs(s-o)<=r}}const l=18e5,u={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},h=3,p=3e4;class SessionService{createSession(t,s,n){const o=new Date,r=o.toISOString(),a={serviceId:t,name:s,release:n,loginTime:r,lastActivity:r,expiresAt:new Date(o.getTime()+l).toISOString(),instructorUnlocked:!1};return this.saveSession(a),this.emitEvent("qd:login",{serviceId:t,name:s,release:n,loginTime:r}),a}getSession(){try{const t=sessionStorage.getItem(u.SESSION);if(!t)return null;const s=JSON.parse(t);return s.serviceId&&s.release&&s.expiresAt?s:(a("Invalid session data, missing required fields"),null)}catch(t){return r("Failed to parse session data",t),null}}updateActivity(){const t=this.getSession();if(!t)return;const s=new Date;t.lastActivity=s.toISOString(),t.expiresAt=new Date(s.getTime()+l).toISOString(),this.saveSession(t)}isExpired(){const t=this.getSession();return!t||function(t,s=new Date){const n=new Date(t);return!!isNaN(n.getTime())||s>=n}(t.expiresAt)}clearSession(){const t=this.getSession();sessionStorage.removeItem(u.SESSION),sessionStorage.removeItem(u.CACHE),sessionStorage.removeItem(u.INSTRUCTOR),sessionStorage.removeItem("qd/instructor/showAnswers"),t&&(t.serviceId,this.emitEvent("qd:logout",{serviceId:t.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!0,t.unlockTime=(new Date).toISOString(),this.saveSession(t),this.emitEvent("qd:instructor-unlock",{timestamp:t.unlockTime}))}lockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!1,delete t.unlockTime,this.saveSession(t),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const t=this.getSession();return!0===t?.instructorUnlocked}getCache(){try{const t=sessionStorage.getItem(u.CACHE);return t?JSON.parse(t):null}catch(t){return r("Failed to parse cache data",t),null}}saveCache(t){try{sessionStorage.setItem(u.CACHE,JSON.stringify(t))}catch(s){r("Failed to save cache",s)}}clearCache(){sessionStorage.removeItem(u.CACHE)}saveSession(t){try{sessionStorage.setItem(u.SESSION,JSON.stringify(t))}catch(s){r("Failed to save session",s)}}emitEvent(t,s){try{const n=new CustomEvent(t,{detail:s,bubbles:!0});document.dispatchEvent(n)}catch(n){r(`Failed to emit event ${t}`,n)}}}function g(t,s){const n=s.answers.length,o=s.answers.filter(t=>""!==t.answer.trim()).length,r=s.answers.filter(t=>t.success).length;return{state:s.state,total:n,answered:o,correct:r,last:s.lastAttempted,answers:s.answers,analysis:s.analysis}}function m(t){return function(t,s="display"){if(null==t)return console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date";const n="string"==typeof t?new Date(t):t;return isNaN(n.getTime())?(console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date"):"csv"===s?function(t){return t.toISOString()}(n):function(t){return`${t.toLocaleDateString("en-US",{month:"short"})} ${t.getDate()} ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`}(n)}(t,"display")}class Debouncer{constructor(){this.timers=new Map}debounce(t,s,n=200){const o=this.timers.get(t);void 0!==o&&clearTimeout(o);const r=setTimeout(()=>{this.timers.delete(t),s()},n);this.timers.set(t,r)}cancel(t){const s=this.timers.get(t);return void 0!==s&&(clearTimeout(s),this.timers.delete(t),!0)}cancelAll(){let t=0;for(const s of this.timers.values())clearTimeout(s),t++;return this.timers.clear(),t}isPending(t){return this.timers.has(t)}getPendingCount(){return this.timers.size}}function f(t){const s=t.querySelector("tbody");return s?Array.from(s.querySelectorAll("tr")):[]}function b(t){return Array.from(t.cells)}function y(t){return t&&t.textContent?.trim()||""}function v(t,s,n){return document.createElement(t)}function w(t,...s){t.classList.add(...s)}function S(t,...s){t.classList.remove(...s)}function x(t,s,n){const o=new CustomEvent(t,{detail:s,bubbles:!0,composed:!0,cancelable:!1});return document.dispatchEvent(o)}function E(t,s,n,o){const r=new CustomEvent(s,{detail:n,bubbles:!0,composed:!0,cancelable:!1});return t.dispatchEvent(r)}function $(t){try{const s=sessionStorage.getItem(t);return s?JSON.parse(s):null}catch(s){return a(`Failed to parse JSON from sessionStorage key: ${t}`,s),null}}function C(t,s){try{const n=JSON.stringify(s);return sessionStorage.setItem(t,n),!0}catch(n){return a(`Failed to store JSON in sessionStorage key: ${t}`,n),!1}}function q(){const t=[];for(let s=0;s<sessionStorage.length;s++){const n=sessionStorage.key(s);n&&n.startsWith("qd/")&&t.push(n)}for(const s of t)sessionStorage.removeItem(s);return t.length}function A(t,s){return`qd/${t}/u${s}`}class StorageError extends Error{constructor(t,s,n){super(t),this.operation=s,this.cause=n,this.name="StorageError",n?r(`Storage error in ${s}: ${t}`,n):r(`Storage error in ${s}: ${t}`)}}class StorageNotInitializedError extends StorageError{constructor(t){super("Storage adapter not initialized. Call init() first.",t),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(t){super("Storage quota exceeded. Please clear old data or free up space.",t),this.name="StorageQuotaError"}}const T="students",O="backups",_="auditLog";class IndexedDBStorageAdapter{constructor(t){if(this.db=null,this.initPromise=null,!t)throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");this.dbName=t}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=new Promise((t,s)=>{let n,o=!1;const c=()=>{n&&(clearTimeout(n),n=void 0)};n=window.setTimeout(()=>{if(o)return;o=!0,this.initPromise=null,a("IndexedDB open timed out after 5000ms - attempting recovery");const n=indexedDB.deleteDatabase(this.dbName);n.onsuccess=()=>{this.init().then(t).catch(s)},n.onerror=()=>{s(new StorageError(`Database "${this.dbName}" appears corrupted. Please clear site data in browser settings.`,"init"))},n.onblocked=()=>{s(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const d=indexedDB.open(this.dbName,3);d.onerror=()=>{o||(o=!0,c(),r(`IndexedDB open error: ${d.error?.message||"unknown"}`),this.initPromise=null,s(new StorageError("Failed to open database","init",d.error)))},d.onblocked=()=>{a("IndexedDB open blocked - close other tabs with this database")},d.onsuccess=()=>{if(!o){if(o=!0,c(),this.db=d.result,!this.db.objectStoreNames.contains(T)||!this.db.objectStoreNames.contains(O)||!this.db.objectStoreNames.contains(_)){a(`Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`),this.db.close(),this.db=null;const n=indexedDB.deleteDatabase(this.dbName);return n.onsuccess=()=>{this.initPromise=null,this.init().then(t).catch(s)},void(n.onerror=()=>{this.initPromise=null,s(new StorageError("Failed to delete corrupted database","init",n.error))})}this.initPromise=null,t()}},d.onupgradeneeded=t=>{const s=t.target.result,n=t.target.transaction;n&&(n.onerror=()=>{r(`Upgrade transaction error: ${n.error?.message||"unknown"}`)},n.onabort=()=>{r(`Upgrade transaction aborted: ${n.error?.message||"unknown"}`)});try{if(!s.objectStoreNames.contains(T)){const t=s.createObjectStore(T,{keyPath:null});t.createIndex("by-release","release",{unique:!1}),t.createIndex("by-service-id","serviceId",{unique:!1})}if(!s.objectStoreNames.contains(O)){const t=s.createObjectStore(O,{keyPath:null});t.createIndex("by-original-key","originalKey",{unique:!1}),t.createIndex("by-timestamp","timestamp",{unique:!1})}if(!s.objectStoreNames.contains(_)){const t=s.createObjectStore(_,{keyPath:"eventId"});t.createIndex("by-service-id","serviceId",{unique:!1}),t.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(o){throw r("Error during database upgrade",o),o}}}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(t,s){const n=this.ensureInitialized(),o=A(t,s);return new Promise((t,s)=>{try{const r=n.transaction(T,"readonly"),a=r.objectStore(T).get(o);a.onsuccess=()=>{t(a.result||null)},a.onerror=()=>{s(new StorageError("Failed to get student record","getStudent",a.error))}}catch(r){s(new StorageError("Failed to get student record","getStudent",r))}})}async saveStudent(t){const s=this.ensureInitialized(),n=A(t.release,t.serviceId);return new Promise((o,r)=>{try{const a=s.transaction(T,"readwrite"),c=a.objectStore(T).put(t,n);c.onsuccess=()=>{o()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?r(new StorageQuotaError("saveStudent")):r(new StorageError("Failed to save student record","saveStudent",c.error))},a.onerror=()=>{r(new StorageError("Transaction failed while saving student","saveStudent",a.error))}}catch(a){r(new StorageError("Failed to save student record","saveStudent",a))}})}async getStudentsByRelease(t){const s=this.ensureInitialized();return new Promise((n,o)=>{try{const r=s.transaction(T,"readonly").objectStore(T),a=r.index("by-release").getAll(t);a.onsuccess=()=>{n(a.result||[])},a.onerror=()=>{o(new StorageError("Failed to get students by release","getStudentsByRelease",a.error))}}catch(r){o(new StorageError("Failed to get students by release","getStudentsByRelease",r))}})}async clearAll(){const t=this.ensureInitialized();return new Promise((s,n)=>{try{const o=t.transaction([T,O,_],"readwrite"),r=o.objectStore(T),a=o.objectStore(O),c=o.objectStore(_),d=r.clear(),l=a.clear(),u=c.clear();let h=!1,p=!1,g=!1;d.onsuccess=()=>{h=!0,p&&g&&s()},l.onsuccess=()=>{p=!0,h&&g&&s()},u.onsuccess=()=>{g=!0,h&&p&&s()},d.onerror=()=>{n(new StorageError("Failed to clear students","clearAll",d.error))},l.onerror=()=>{n(new StorageError("Failed to clear backups","clearAll",l.error))},u.onerror=()=>{n(new StorageError("Failed to clear audit log","clearAll",u.error))},o.onerror=()=>{n(new StorageError("Transaction failed during clearAll","clearAll",o.error))}}catch(o){n(new StorageError("Failed to clear all data","clearAll",o))}})}async backup(t){const s=this.ensureInitialized(),n=(new Date).toISOString(),o=`backup_${n}_${t.serviceId}`,r=A(t.release,t.serviceId),a={...t,originalKey:r,timestamp:n};return new Promise((t,n)=>{try{const r=s.transaction(O,"readwrite"),c=r.objectStore(O).put(a,o);c.onsuccess=()=>{t()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?n(new StorageQuotaError("backup")):n(new StorageError("Failed to create backup","backup",c.error))},r.onerror=()=>{n(new StorageError("Transaction failed during backup","backup",r.error))}}catch(r){n(new StorageError("Failed to create backup","backup",r))}})}async saveAuditEvent(t){const s=this.ensureInitialized();return new Promise((n,o)=>{try{const r=s.transaction(_,"readwrite"),a=r.objectStore(_).add(t);a.onsuccess=()=>{n()},a.onerror=()=>{o(new StorageError("Failed to save audit event","saveAuditEvent",a.error))}}catch(r){o(new StorageError("Failed to save audit event","saveAuditEvent",r))}})}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let P=null,D=null;function U(t){if(!t)throw new Error("FATAL: dbName is required for getStorageAdapter()");return P&&D!==t&&(P.close(),P=null),P||(P=new IndexedDBStorageAdapter(t),D=t),P}function j(t,s){return 0===s||function(t){return 0===t.length}(t)?"unstarted":function(t,s){if(t.length!==s)return!1;return t.every(t=>!0===t.success)}(t,s)?"complete":"incomplete"}class StorageService{constructor(t){if(!t)throw new Error("FATAL: dbName is required for StorageService");this.dbName=t,this.adapter=U(t)}async init(){try{await this.adapter.init(),this.dbName}catch(t){throw r("Failed to initialize storage service",t),t}}async loadStudentRecord(t){try{const s=await this.adapter.getStudent(t.release,t.serviceId);if(s)return t.serviceId,s;const n={schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}};return t.serviceId,n}catch(s){a(`IndexedDB error, creating new record: ${s.message}`);return{schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}}async saveStudentRecord(t){try{t.updated=(new Date).toISOString();const s=function(t){let s=0,n=0;for(const o in t){const r=t[o];if(r&&r.answers&&Array.isArray(r.answers)){const t=r.answers.filter(t=>""!==t.answer.trim());s+=t.length,n+=t.filter(t=>t.success).length}}return{attempted:s,correct:n}}(t.pages);t.attempted=s.attempted,t.correct=s.correct,await this.adapter.saveStudent(t),t.serviceId}catch(s){throw r("Failed to save student record",s),s}}updateRecordWithAnswer(t,s,n,o,r){const a=t.pages[s]||{answers:[],state:"unstarted"};for(;a.answers.length<=n;)a.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});a.answers[n]=o;const c=(new Date).toISOString();return a.firstAttempted||(a.firstAttempted=c),a.lastAttempted=c,a.state=j(a.answers,r),{...t,pages:{...t.pages,[s]:a}}}buildCache(t){return function(t){const s={totals:{total:0,answered:0,correct:0},pages:{}};for(const[n,o]of Object.entries(t.pages)){const t=g(0,o);s.pages[n]=t,s.totals.total+=t.total,s.totals.answered+=t.answered,s.totals.correct+=t.correct}return s}(t)}async getStudentsByRelease(t){try{return await this.adapter.getStudentsByRelease(t)}catch(s){throw r("Failed to get students by release",s),s}}async clearAll(){try{await this.adapter.clearAll()}catch(t){throw r("Failed to clear all data",t),t}}async backup(t){try{await this.adapter.backup(t),t.serviceId}catch(s){a(`Failed to create backup for ${t.serviceId}`,s)}}}let B=null,F=null;function V(t){if(B&&!t)return B;if(B&&t&&F!==t)return a(`Storage service already initialized with dbName="${F}", ignoring new dbName="${t}"`),B;if(!B){if(!t)throw new Error("FATAL: dbName is required for first getStorageService() call");B=new StorageService(t),F=t}return B}const Q=new WeakMap;function K(t,s){const n=Q.get(t);let o;if(n){if(n.interactive||!s.interactive)return!0;o=n.parsed}else o=c(t),o.errors&&o.errors.length>0&&r("Quiz table has validation errors:",o.errors);const l={parsed:o,interactive:s.interactive,pageId:s.pageId};if(s.interactive){if(!s.pageId)return r("Interactive mode requires pageId option"),!1;s.pageId,l.debouncer=new Debouncer,l.inputs=[]}if(Q.set(t,l),s.interactive){const s=function(t,s){const{parsed:n,pageId:o,debouncer:c}=s;if(!o||!c)return r("Interactive mode requires pageId and debouncer"),!1;(function(t){const s=t.querySelectorAll("thead th, thead td");s[1]&&S(s[1],"qd-hidden");const n=t.querySelectorAll("tbody tr");n.forEach(t=>{const s=t.querySelectorAll("td");s[1]&&S(s[1],"qd-hidden")})})(t),Y(t);if(!$(u.SESSION))return r("No active session found"),!1;let l=$(u.CACHE);l?(l.totals.total,Object.keys(l.pages).length):l={totals:{total:0,answered:0,correct:0},pages:{}};const h=n.questions.length;l=function(t,s,n){const o=t.pages[s];if(o&&o.total>=n)return t;const r=n-(o?.total||0),a={state:o?.state||"unstarted",total:n,answered:o?.answered||0,correct:o?.correct||0,last:o?.last,answers:o?.answers,analysis:o?.analysis};return{totals:{total:t.totals.total+r,answered:t.totals.answered,correct:t.totals.correct},pages:{...t.pages,[s]:a}}}(l,o,h),C(u.CACHE,l);const p=l?.pages[o],g=p?.answers||[];g.length;const m=t.querySelector("tbody");if(!m)return r("Quiz table has no tbody element"),!1;const f=Array.from(m.querySelectorAll("tr")),b=[];n.questions.forEach((n,o)=>{const c=f[o];if(!c)return;const l=Array.from(c.querySelectorAll("td"));if(3!==l.length)return;const h=l[0],p=l[1];if(!h||!p)return;const m=g[o];m&&m.answer&&(m.answer,m.success);const y=function(t,s){const n=function(t,s){if("mcq"===t.kind){const n=(t.options||[]).map((t,s)=>({value:String(s+1),text:`${s+1}. ${t}`}));return{type:"select",className:"qd-quiz-input",placeholder:"Select an answer...",value:s?.answer||"",options:n}}return{type:"text",className:"qd-quiz-input",placeholder:"Enter value",value:s?.answer||""}}(t,s);if("select"===n.type){const t=v("select");t.className=n.className;const s=v("option");return s.value="",s.textContent=n.placeholder,s.disabled=!0,t.appendChild(s),n.options&&n.options.forEach(s=>{const n=v("option");n.value=s.value,n.textContent=s.text,t.appendChild(n)}),t.value=n.value,t}{const t=v("input");return t.type=n.type,t.className=n.className,t.placeholder=n.placeholder,t.value=n.value,t}}(n,m);b.push(y),p.textContent="",p.appendChild(y),m&&W(p,m.success);const w="SELECT"===y.tagName?"change":"input";y.addEventListener(w,()=>{!function(t,s,n,o){const{debouncer:c,pageId:l,parsed:h}=s;if(!c||!l)return;const p=h.questions[n];if(!p)return;c.debounce(`save-answer-${n}`,()=>{!async function(t,s,n,o){const{pageId:c,parsed:l,inputs:h}=s;if(!c||!h)return;const p=l.questions[n];if(!p)return;const g=$(u.SESSION);if(!g)return void r("No active session found");const m=d(p,o),f={answer:o.trim(),success:m,timestamp:(new Date).toISOString()},b=V();let y;try{y=await b.loadStudentRecord(g)}catch(A){return void a("Failed to load student record, answer not saved",A)}const v=l.questions.length,w=b.updateRecordWithAnswer(y,c,n,f,v);try{await b.saveStudentRecord(w)}catch(A){a("Failed to save student record to IndexedDB",A)}const S=b.buildCache(w);C(u.CACHE,S);const E=t.querySelector(`tbody tr:nth-child(${n+1})`);if(E){const t=E.querySelector("td:nth-child(2)");t&&W(t,m)}x("qd:answer-saved",{pageId:c,answer:f});const q=w.pages[c];q&&x("qd:state-changed",{pageId:c,state:q.state})}(t,s,n,o)},200)}(t,s,o,y.value)})}),s.inputs=b;const y=()=>{Z(t,s)},E=()=>{X(t)};document.addEventListener("qd:instructor-show-answers",y),document.addEventListener("qd:instructor-hide-answers",E);const q="true"===sessionStorage.getItem(u.INSTRUCTOR),A="true"===sessionStorage.getItem("qd/instructor/showAnswers");q&&A&&Z(t,s);const T=()=>{t.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(t=>{S(t,"qd-answer-correct","qd-answer-incorrect")}),X(t)};return document.addEventListener("qd:logout",T),s.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",y),document.removeEventListener("qd:instructor-hide-answers",E),document.removeEventListener("qd:logout",T)},w(t,"qd-quiz-interactive"),!0}(t,l);return s?o.questions.length:r("Interactive enhancement failed"),s}return function(t){return function(t){const s=t.querySelector("colgroup");s&&s.remove()}(t),J(t),Y(t),w(t,"qd-quiz-non-interactive"),!0}(t)}function W(t,s){S(t,"qd-answer-correct","qd-answer-incorrect"),w(t,s?"qd-answer-correct":"qd-answer-incorrect")}function J(t){const s=t.querySelectorAll("thead th, thead td");s[1]&&w(s[1],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const s=t.querySelectorAll("td");s[1]&&(w(s[1],"qd-hidden"),s[1].textContent="")})}function Y(t){const s=t.querySelectorAll("thead th, thead td");s[2]&&w(s[2],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const s=t.querySelectorAll("td");s[2]&&w(s[2],"qd-hidden")})}function G(t){return Q.get(t)}async function Z(t,s){const{pageId:n,parsed:o}=s;if(!n)return;const a=$(u.SESSION);if(!a)return;const c=V();try{const s=await c.getStudentsByRelease(a.release);if(0===s.length)return void alert("No student data available for this release. Students need to log in and answer questions first.");const r=t.querySelector("tbody");if(!r)return;const d=Array.from(r.querySelectorAll("tr"));o.questions.forEach((t,o)=>{const r=d[o];if(!r)return;const a=Array.from(r.querySelectorAll("td"))[1];if(!a)return;const c=a.querySelector(".qd-student-answers");c&&c.remove();const l=function(t,s,n){const o=[];for(const r of t){const t=r.pages[s];if(!t||!t.answers)continue;const a=t.answers[n];a&&o.push({name:r.name,maskedServiceId:r.serviceId.slice(-4),answer:a.answer,success:a.success,formattedTimestamp:m(a.timestamp),cssClass:a.success?"qd-correct":"qd-incorrect"})}return o}(s,n,o);if(l.length>0){const t=document.createElement("div");t.className="qd-student-answers",l.forEach(s=>{const n=document.createElement("div");n.className=`qd-student-answer ${s.cssClass}`,n.innerHTML=`\n            <span class="qd-student-name">${s.name} (${s.maskedServiceId})</span>:\n            <span class="qd-student-answer-text">${s.answer}</span>\n            <span class="qd-timestamp">${s.formattedTimestamp}</span>\n          `,t.appendChild(n)}),a.appendChild(t)}}),s.length}catch(d){r("Failed to load student answers",d)}}function X(t){t.querySelectorAll(".qd-student-answers").forEach(t=>t.remove())}function tt(t,s=16){let n=5381;for(let r=0;r<t.length;r++){n=(n<<5)+n+t.charCodeAt(r),n&=n}const o=Math.abs(n).toString(16).padStart(8,"0");return o.repeat(Math.ceil(s/o.length)).substring(0,s)}function et(t){const s=f(t),n=s[0],o=n?b(n).length:0,r=t.className||"qd-analysis";return tt(`${s.length}x${o}:${r}`,16)}function st(t,s,n){return`R${t}C${s}#f:${tt(n.replace(/\s+/g," ").trim(),8)}`}function nt(t){return t.classList.contains("interactive")}function ot(t){const s=[];t.querySelector("tbody")||s.push("Analysis table must have a tbody element");const n=f(t);0===n.length&&s.push("Analysis table must have at least one row");const o=et(t),r=[];return n.forEach((t,s)=>{b(t).forEach((t,n)=>{if(nt(t)){const o=y(t),a=st(s,n,o);r.push({row:s,col:n,key:a})}})}),{element:t,tableId:o,editableCells:r,errors:s.length>0?s:void 0}}const rt=new WeakMap;function it(t,s){const n=ot(t);n.errors&&n.errors.length>0&&r("Analysis table has validation errors:",n.errors);const o={parsed:n,interactive:s.interactive,pageId:s.pageId};if(s.interactive){if(!s.pageId)return r("Interactive mode requires pageId option"),!1;o.debouncer=new Debouncer,o.cellKeyMap=new Map}return rt.set(t,o),s.interactive?function(t,s){const{parsed:n,pageId:o,debouncer:c,cellKeyMap:d}=s;if(!o||!c||!d)return r("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!$(u.SESSION))return r("No active session found"),!1;const l=$(u.CACHE),h=l?.pages[o],p=h?.analysis,g=p?.cells||{},m=f(t);return n.editableCells.forEach(({row:t,col:n,key:o})=>{const c=m[t];if(!c)return;const l=b(c)[n];l&&(nt(l)?(d.set(l,o),g[o]&&(l.textContent=g[o]),l.contentEditable="true",w(l,"qd-editable"),l.addEventListener("input",()=>{!function(t,s,n){const{debouncer:o,pageId:c}=t;if(!o||!c)return;const d=y(s);o.debounce(`save-cell-${n}`,()=>{!async function(t,s,n){const{pageId:o,parsed:c}=t;if(!o)return;const d=$(u.SESSION);if(!d)return void r("No active session found");const l=V();let h;try{h=await l.loadStudentRecord(d)}catch(b){return void a("Failed to load student record, analysis not saved",b)}const p=h.pages[o]||{answers:[],state:"unstarted"},g=p.analysis||{tableId:c.tableId,cells:{}};g.cells[s]=n;const m=(new Date).toISOString();g.firstEdited||(g.firstEdited=m);g.lastEdited=m,p.analysis=g,h.pages[o]=p,h.updated=m;try{await l.saveStudentRecord(h)}catch(b){a("Failed to save student record to IndexedDB",b)}const f=l.buildCache(h);C(u.CACHE,f),x("qd:analysis-saved",{pageId:o,tableId:c.tableId,cellKey:s,content:n})}(t,n,d)},500)}(s,l,o)})):r(`Cell at R${t}C${n} is no longer editable`))}),w(t,"qd-analysis-interactive"),!0}(t,o):function(t){w(t,"qd-analysis-non-interactive");const s=()=>{!async function(t){const s=rt.get(t);if(!s)return void a("Cannot show student entries: table not enhanced");const n=s.pageId||function(){const t=document.body.dataset.pageId;if(t)return t;const s=window.location.pathname,n=(s.split("/").pop()||"").replace(".html","");return n||void 0}();if(!n)return void a("Cannot show student entries: page ID not found");const o=$(u.SESSION);if(!o)return void a("Cannot show student entries: no active session");const c=V();let d;try{d=await c.getStudentsByRelease(o.release)}catch(g){return void r("Failed to load students for instructor view:",g)}const l=function(t,s){const n={};return t.forEach(t=>{const o=t.pages[s];if(!o||!o.analysis)return;const{cells:r}=o.analysis,a=o.analysis.lastEdited||t.updated;Object.entries(r).forEach(([s,o])=>{n[s]||(n[s]=[]),n[s].push({serviceId:t.serviceId,name:t.name,content:o,timestamp:a})})}),n}(d,n),{editableCells:h}=s.parsed,p=f(t);h.forEach(({row:t,col:s,key:n})=>{const o=p[t];if(!o)return;const r=b(o)[s];if(!r)return;const a=function(t){const s=document.createElement("div");if(s.className="qd-student-entries",0===t.length)return s.className+=" qd-no-entries",s.textContent="(No entries yet)",s.style.cssText="color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;",s;const n=function(t){return[...t].sort((t,s)=>{const n=new Date(t.timestamp).getTime();return new Date(s.timestamp).getTime()-n})}(t);return n.forEach(t=>{const n=document.createElement("div");n.className="qd-entry",n.style.cssText="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";const o=t.serviceId.slice(-4),r=m(t.timestamp),a=document.createElement("span");a.style.cssText="font-weight: 600; color: #374151;",a.textContent=`${t.name} (${o}) • ${r}: `;const c=document.createElement("span");c.style.cssText="white-space: pre-wrap;",c.textContent=t.content,n.appendChild(a),n.appendChild(c),s.appendChild(n)}),s.style.cssText="margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;",s}(l[n]||[]);a.setAttribute("data-qd-student-entries","true");const c=r.querySelector("[data-qd-student-entries]");c&&c.remove(),r.appendChild(a)}),h.length}(t)},n=()=>{at(t)};return document.addEventListener("qd:instructor-show-answers",s),document.addEventListener("qd:instructor-hide-answers",n),!0}(t)}function at(t){t.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove())}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers()}registerLoginHandlers(){this.addEventListener("qd:login",t=>{(async()=>{const s=t.detail;if(s.serviceId,s.name,"INSTRUCTOR"===s.serviceId)return;const n=$(u.SESSION);if(!n)return;const o=V();let r,a;try{r=await o.loadStudentRecord(n),await o.saveStudentRecord(r),a=o.buildCache(r),C(u.CACHE,a),a.totals.total}catch{C(u.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}this.dispatchEvent("qd:cache-rebuild",{}),this.upgradeTablesAfterLogin()})()})}upgradeTablesAfterLogin(){const t=window.location.pathname,s=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!s)return;if("true"===sessionStorage.getItem(u.INSTRUCTOR)){return void document.querySelectorAll("table.qd-quiz").forEach(t=>{const n=G(t);if(!n)return;n.pageId=s;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,s)=>{const o=n.parsed.questions[s];o&&t instanceof HTMLTableCellElement&&(t.textContent=o.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const o=()=>{Z(t,n)};document.addEventListener("qd:instructor-show-answers",o),document.addEventListener("qd:instructor-hide-answers",()=>{X(t)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&o()})}const n=document.querySelectorAll("table.qd-quiz");n.length>0&&(n.length,n.forEach(t=>{K(t,{interactive:!0,pageId:s})}));const o=document.querySelectorAll("table.qd-analysis");o.length>0&&(o.length,o.forEach(t=>{it(t,{interactive:!0,pageId:s})}))}registerLogoutHandlers(){this.addEventListener("qd:logout",t=>{t.detail.serviceId;document.querySelectorAll("table.qd-quiz").forEach(t=>{!function(t){const s=Q.get(t);s&&(s.interactive=!1,s.pageId=void 0,s.inputs=void 0,s.cleanupInstructorListeners?.(),s.cleanupInstructorListeners=void 0,J(t),Y(t),S(t,"qd-quiz-interactive"))}(t)});document.querySelectorAll("table.qd-analysis").forEach(t=>{!function(t){const s=rt.get(t);s&&(at(t),s.interactive&&(t.querySelectorAll(".qd-editable").forEach(t=>{t instanceof HTMLTableCellElement&&(t.contentEditable="false",t.classList.remove("qd-editable"),t.textContent="")}),t.classList.remove("qd-analysis-interactive"),s.debouncer?.cancelAll()),s.interactive=!1,s.pageId=void 0,s.debouncer=void 0,s.cellKeyMap=void 0)}(t)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",t=>{const s=t.detail;s.pageId,s.questionIndex,s.answer,s.success,this.dispatchEvent("qd:cache-update",{pageId:s.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",t=>{const s=t.detail;s.pageId,s.state,this.dispatchEvent("qd:badge-update",{pageId:s.pageId,state:s.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",t=>{t.detail.unlockTime}),this.addEventListener("qd:instructor-lock",()=>{})}registerDataHandlers(){this.addEventListener("qd:data-cleared",t=>{t.detail.timestamp,this.dispatchEvent("qd:cache-clear",{})})}addEventListener(t,s){document.addEventListener(t,s);const n=this.listeners.get(t)||[];n.push(s),this.listeners.set(t,n)}dispatchEvent(t,s){const n=new CustomEvent(t,{detail:s,bubbles:!0,composed:!0});document.dispatchEvent(n)}cleanup(){for(const[t,s]of this.listeners)for(const n of s)document.removeEventListener(t,n);this.listeners.clear()}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const t=this.sessionService.getSession();if(t){if(t.serviceId,this.sessionService.isExpired())return a("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(t),this.setupActivityTracking()}}scheduleExpiryCheck(t){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const s=(new Date).getTime(),n=new Date(t.expiresAt).getTime()-s;n<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{this.sessionService.clearSession()},n)}setupActivityTracking(){const t=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const t=this.sessionService.getSession();t&&this.scheduleExpiryCheck(t)};let s;const n=()=>{void 0!==s&&window.clearTimeout(s),s=window.setTimeout(()=>{t()},5e3)};["click","keydown","scroll","mousemove"].forEach(t=>{document.addEventListener(t,n,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const ct=globalThis,dt=ct.ShadowRoot&&(void 0===ct.ShadyCSS||ct.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,lt=Symbol(),ut=new WeakMap;let ht=class{constructor(t,s,n){if(this._$cssResult$=!0,n!==lt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o;const s=this.t;if(dt&&void 0===t){const n=void 0!==s&&1===s.length;n&&(t=ut.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),n&&ut.set(s,t))}return t}toString(){return this.cssText}};const pt=(t,...s)=>{const n=1===t.length?t[0]:s.reduce((s,n,o)=>s+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+t[o+1],t[0]);return new ht(n,t,lt)},gt=dt?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let s="";for(const n of t.cssRules)s+=n.cssText;return(t=>new ht("string"==typeof t?t:t+"",void 0,lt))(s)})(t):t,{is:mt,defineProperty:ft,getOwnPropertyDescriptor:bt,getOwnPropertyNames:yt,getOwnPropertySymbols:vt,getPrototypeOf:wt}=Object,St=globalThis,xt=St.trustedTypes,Et=xt?xt.emptyScript:"",$t=St.reactiveElementPolyfillSupport,Ct=(t,s)=>t,qt={toAttribute(t,s){switch(s){case Boolean:t=t?Et:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,s){let n=t;switch(s){case Boolean:n=null!==t;break;case Number:n=null===t?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch(o){n=null}}return n}},It=(t,s)=>!mt(t,s),At={attribute:!0,type:String,converter:qt,reflect:!1,useDefault:!1,hasChanged:It};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),St.litPropertyMetadata??=new WeakMap;let kt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=At){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){const n=Symbol(),o=this.getPropertyDescriptor(t,n,s);void 0!==o&&ft(this.prototype,t,o)}}static getPropertyDescriptor(t,s,n){const{get:o,set:r}=bt(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t}};return{get:o,set(s){const a=o?.call(this);r?.call(this,s),this.requestUpdate(t,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??At}static _$Ei(){if(this.hasOwnProperty(Ct("elementProperties")))return;const t=wt(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Ct("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ct("properties"))){const t=this.properties,s=[...yt(t),...vt(t)];for(const n of s)this.createProperty(n,t[n])}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,n]of s)this.elementProperties.set(t,n)}this._$Eh=new Map;for(const[s,n]of this.elementProperties){const t=this._$Eu(s,n);void 0!==t&&this._$Eh.set(t,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const s=[];if(Array.isArray(t)){const n=new Set(t.flat(1/0).reverse());for(const t of n)s.unshift(gt(t))}else void 0!==t&&s.push(gt(t));return s}static _$Eu(t,s){const n=s.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const n of s.keys())this.hasOwnProperty(n)&&(t.set(n,this[n]),delete this[n]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(dt)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const n of s){const s=document.createElement("style"),o=ct.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=n.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,s,n){this._$AK(t,n)}_$ET(t,s){const n=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,n);if(void 0!==o&&!0===n.reflect){const r=(void 0!==n.converter?.toAttribute?n.converter:qt).toAttribute(s,n.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,s){const n=this.constructor,o=n._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=n.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:qt;this._$Em=o;const a=r.fromAttribute(s,t.type);this[o]=a??this._$Ej?.get(o)??a,this._$Em=null}}requestUpdate(t,s,n){if(void 0!==t){const o=this.constructor,r=this[t];if(n??=o.getPropertyOptions(t),!((n.hasChanged??It)(r,s)||n.useDefault&&n.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,n))))return;this.C(t,s,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,s,{useDefault:n,reflect:o,wrapped:r},a){n&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??s??this[t]),!0!==r||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||n||(s=void 0),this._$AL.set(t,s)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,n]of t){const{wrapped:t}=n,o=this[s];!0!==t||this._$AL.has(s)||void 0===o||this.C(s,void 0,n,o)}}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM()}catch(n){throw t=!1,this._$EM(),n}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};kt.elementStyles=[],kt.shadowRootOptions={mode:"open"},kt[Ct("elementProperties")]=new Map,kt[Ct("finalized")]=new Map,$t?.({ReactiveElement:kt}),(St.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Tt=globalThis,Ot=Tt.trustedTypes,_t=Ot?Ot.createPolicy("lit-html",{createHTML:t=>t}):void 0,Pt="$lit$",Nt=`lit$${Math.random().toFixed(9).slice(2)}$`,Lt="?"+Nt,Dt=`<${Lt}>`,Rt=document,zt=()=>Rt.createComment(""),Mt=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Ht=Array.isArray,Ut="[ \t\n\f\r]",jt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Bt=/-->/g,Ft=/>/g,Vt=RegExp(`>|${Ut}(?:([^\\s"'>=/]+)(${Ut}*=${Ut}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Qt=/'/g,Kt=/"/g,Wt=/^(?:script|style|textarea|title)$/i,Jt=(te=1,(t,...s)=>({_$litType$:te,strings:t,values:s})),Yt=Symbol.for("lit-noChange"),Gt=Symbol.for("lit-nothing"),Zt=new WeakMap,Xt=Rt.createTreeWalker(Rt,129);var te;function ee(t,s){if(!Ht(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==_t?_t.createHTML(s):s}class N{constructor({strings:t,_$litType$:s},n){let o;this.parts=[];let r=0,a=0;const c=t.length-1,d=this.parts,[l,u]=((t,s)=>{const n=t.length-1,o=[];let r,a=2===s?"<svg>":3===s?"<math>":"",c=jt;for(let d=0;d<n;d++){const s=t[d];let n,l,u=-1,h=0;for(;h<s.length&&(c.lastIndex=h,l=c.exec(s),null!==l);)h=c.lastIndex,c===jt?"!--"===l[1]?c=Bt:void 0!==l[1]?c=Ft:void 0!==l[2]?(Wt.test(l[2])&&(r=RegExp("</"+l[2],"g")),c=Vt):void 0!==l[3]&&(c=Vt):c===Vt?">"===l[0]?(c=r??jt,u=-1):void 0===l[1]?u=-2:(u=c.lastIndex-l[2].length,n=l[1],c=void 0===l[3]?Vt:'"'===l[3]?Kt:Qt):c===Kt||c===Qt?c=Vt:c===Bt||c===Ft?c=jt:(c=Vt,r=void 0);const p=c===Vt&&t[d+1].startsWith("/>")?" ":"";a+=c===jt?s+Dt:u>=0?(o.push(n),s.slice(0,u)+Pt+s.slice(u)+Nt+p):s+Nt+(-2===u?d:p)}return[ee(t,a+(t[n]||"<?>")+(2===s?"</svg>":3===s?"</math>":"")),o]})(t,s);if(this.el=N.createElement(l,n),Xt.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Xt.nextNode())&&d.length<c;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(Pt)){const s=u[a++],n=o.getAttribute(t).split(Nt),c=/([.?@])?(.*)/.exec(s);d.push({type:1,index:r,name:c[2],strings:n,ctor:"."===c[1]?H:"?"===c[1]?I:"@"===c[1]?L:k}),o.removeAttribute(t)}else t.startsWith(Nt)&&(d.push({type:6,index:r}),o.removeAttribute(t));if(Wt.test(o.tagName)){const t=o.textContent.split(Nt),s=t.length-1;if(s>0){o.textContent=Ot?Ot.emptyScript:"";for(let n=0;n<s;n++)o.append(t[n],zt()),Xt.nextNode(),d.push({type:2,index:++r});o.append(t[s],zt())}}}else if(8===o.nodeType)if(o.data===Lt)d.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(Nt,t+1));)d.push({type:7,index:r}),t+=Nt.length-1}r++}}static createElement(t,s){const n=Rt.createElement("template");return n.innerHTML=t,n}}function se(t,s,n=t,o){if(s===Yt)return s;let r=void 0!==o?n._$Co?.[o]:n._$Cl;const a=Mt(s)?void 0:s._$litDirective$;return r?.constructor!==a&&(r?._$AO?.(!1),void 0===a?r=void 0:(r=new a(t),r._$AT(t,n,o)),void 0!==o?(n._$Co??=[])[o]=r:n._$Cl=r),void 0!==r&&(s=se(t,r._$AS(t,s.values),r,o)),s}class M{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:s},parts:n}=this._$AD,o=(t?.creationScope??Rt).importNode(s,!0);Xt.currentNode=o;let r=Xt.nextNode(),a=0,c=0,d=n[0];for(;void 0!==d;){if(a===d.index){let s;2===d.type?s=new R(r,r.nextSibling,this,t):1===d.type?s=new d.ctor(r,d.name,d.strings,this,t):6===d.type&&(s=new z(r,this,t)),this._$AV.push(s),d=n[++c]}a!==d?.index&&(r=Xt.nextNode(),a++)}return Xt.currentNode=Rt,o}p(t){let s=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(t,n,s),s+=n.strings.length-2):n._$AI(t[s])),s++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,s,n,o){this.type=2,this._$AH=Gt,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=n,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const s=this._$AM;return void 0!==s&&11===t?.nodeType&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=se(this,t,s),Mt(t)?t===Gt||null==t||""===t?(this._$AH!==Gt&&this._$AR(),this._$AH=Gt):t!==this._$AH&&t!==Yt&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Ht(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Gt&&Mt(this._$AH)?this._$AA.nextSibling.data=t:this.T(Rt.createTextNode(t)),this._$AH=t}$(t){const{values:s,_$litType$:n}=t,o="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=N.createElement(ee(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===o)this._$AH.p(s);else{const t=new M(o,this),n=t.u(this.options);t.p(s),this.T(n),this._$AH=t}}_$AC(t){let s=Zt.get(t.strings);return void 0===s&&Zt.set(t.strings,s=new N(t)),s}k(t){Ht(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let n,o=0;for(const r of t)o===s.length?s.push(n=new R(this.O(zt()),this.O(zt()),this,this.options)):n=s[o],n._$AI(r),o++;o<s.length&&(this._$AR(n&&n._$AB.nextSibling,o),s.length=o)}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);t!==this._$AB;){const s=t.nextSibling;t.remove(),t=s}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,n,o,r){this.type=1,this._$AH=Gt,this._$AN=void 0,this.element=t,this.name=s,this._$AM=o,this.options=r,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=Gt}_$AI(t,s=this,n,o){const r=this.strings;let a=!1;if(void 0===r)t=se(this,t,s,0),a=!Mt(t)||t!==this._$AH&&t!==Yt,a&&(this._$AH=t);else{const o=t;let c,d;for(t=r[0],c=0;c<r.length-1;c++)d=se(this,o[n+c],s,c),d===Yt&&(d=this._$AH[c]),a||=!Mt(d)||d!==this._$AH[c],d===Gt?t=Gt:t!==Gt&&(t+=(d??"")+r[c+1]),this._$AH[c]=d}a&&!o&&this.j(t)}j(t){t===Gt?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Gt?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Gt)}}class L extends k{constructor(t,s,n,o,r){super(t,s,n,o,r),this.type=5}_$AI(t,s=this){if((t=se(this,t,s,0)??Gt)===Yt)return;const n=this._$AH,o=t===Gt&&n!==Gt||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,r=t!==Gt&&(n===Gt||o);o&&this.element.removeEventListener(this.name,this,n),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,s,n){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(t){se(this,t)}}const ne=Tt.litHtmlPolyfillSupport;ne?.(N,R),(Tt.litHtmlVersions??=[]).push("3.3.1");const oe=(t,s,n)=>{const o=n?.renderBefore??s;let r=o._$litPart$;if(void 0===r){const t=n?.renderBefore??null;o._$litPart$=r=new R(s.insertBefore(zt(),t),t,void 0,n??{})}return r._$AI(t),r},re=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let ie=class extends kt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=oe(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Yt}};ie._$litElement$=!0,ie.finalized=!0,re.litElementHydrateSupport?.({LitElement:ie});const ae=re.litElementPolyfillSupport;ae?.({LitElement:ie}),(re.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const ce=t=>(s,n)=>{void 0!==n?n.addInitializer(()=>{customElements.define(t,s)}):customElements.define(t,s)},de={attribute:!0,type:String,converter:qt,reflect:!1,hasChanged:It},le=(t=de,s,n)=>{const{kind:o,metadata:r}=n;let a=globalThis.litPropertyMetadata.get(r);if(void 0===a&&globalThis.litPropertyMetadata.set(r,a=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),a.set(n.name,t),"accessor"===o){const{name:o}=n;return{set(n){const r=s.get.call(this);s.set.call(this,n),this.requestUpdate(o,r,t)},init(s){return void 0!==s&&this.C(o,void 0,t,s),s}}}if("setter"===o){const{name:o}=n;return function(n){const r=this[o];s.call(this,n),this.requestUpdate(o,r,t)}}throw Error("Unsupported decorator location: "+o)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function ue(t){return(s,n)=>"object"==typeof n?le(t,s,n):((t,s,n)=>{const o=s.hasOwnProperty(n);return s.constructor.createProperty(n,t),o?Object.getOwnPropertyDescriptor(s,n):void 0})(t,s,n)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function he(t){return ue({...t,state:!0,attribute:!1})}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const pe=".wh_top_menu_and_indexterms_link",ge=".wh_publication_title .title",me="",fe="qd-status-container",be="qd-title-selector",ye="qd-instructor-hash",ve="qd-db-name";function we(t,s){const n=document.querySelector(`#${t}`);if(!n)return s;const o=n.textContent?.trim()||"";return""===o?(a(`Config element #${t} found but empty, using default: "${s}"`),s):o}function Se(){const t=function(t){const s=document.querySelector(`#${t}`);if(!s){const s=`FATAL: Required config element #${t} not found in DOM. Processing stopped.`;throw console.error(s),new Error(s)}const n=s.textContent?.trim()||"";if(""===n){const s=`FATAL: Required config element #${t} is empty. Processing stopped.`;throw console.error(s),new Error(s)}return n}(ve);return{statusPanelContainer:we(fe,pe),titleSelector:we(be,ge),instructorHash:we(ye,me),dbName:t}}async function xe(t){const s=(new TextEncoder).encode(t),n=await crypto.subtle.digest("SHA-256",s);return Array.from(new Uint8Array(n)).map(t=>t.toString(16).padStart(2,"0")).join("")}function Ee(t){return`${u.PIN_ATTEMPTS}:${t}`}function $e(t){const s=Ee(t),n=sessionStorage.getItem(s);if(!n)return null;try{return JSON.parse(n)}catch{return null}}function Ce(t){const s=$e(t);if(!s||!s.lockoutUntil)return{isLocked:!1,remainingMs:0};const n=new Date(s.lockoutUntil).getTime(),o=Date.now();return n>o?{isLocked:!0,remainingMs:n-o}:(qe(t),{isLocked:!1,remainingMs:0})}function qe(t){const n=$e(t);n&&n.attempts>0&&(n.attempts,s(t));const o=Ee(t);sessionStorage.removeItem(o)}var Ie=Object.getOwnPropertyDescriptor;let Ae=class extends ie{render(){return Jt`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"27/Nov/2025"}</span>
      </div>
    `}};Ae.styles=pt`
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
  `,Ae=((t,s,n,o)=>{for(var r,a=o>1?void 0:o?Ie(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=r(a)||a);return a})([ce("qd-build-info")],Ae);var ke=Object.defineProperty,Te=Object.getOwnPropertyDescriptor,Oe=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?Te(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&ke(s,n,a),a};const _e="__qdModalCurrentRef__";function Pe(){return globalThis[_e]??null}function Ne(t){globalThis[_e]=t}let Le=class extends ie{constructor(){super(...arguments),this.open=!1,this.closable=!0,this.previouslyFocused=null,this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this.open&&this.closable&&(this.emitCloseEvent(),this.close())},this.handleBackdropClick=()=>{this.closable&&(this.emitCloseEvent(),this.close())},this.handleCloseClick=()=>{this.emitCloseEvent(),this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),Pe()!==this||this.isInBody||Ne(null)}updated(t){t.has("open")&&(this.open?this.handleOpen():this.handleClose())}moveToBody(){this.isInBody||(this.originalParent=this.parentNode,this.originalNextSibling=this.nextSibling,this.isInBody=!0,document.body.appendChild(this))}restorePosition(){this.isInBody&&this.originalParent&&(this.originalNextSibling?this.originalParent.insertBefore(this,this.originalNextSibling):this.originalParent.appendChild(this),this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1)}render(){return Jt`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="header">
            <span class="header-title"><slot name="header"></slot></span>
            ${this.closable?Jt`<button
                  type="button"
                  class="close-button"
                  @click=${this.handleCloseClick}
                  aria-label="Close"
                  title="Close"
                >
                  ×
                </button>`:""}
          </div>
          <div class="body">
            <slot></slot>
          </div>
        </div>
      </div>
    `}show(){this.open=!0}close(){this.open=!1}handleOpen(){const t=Pe();t&&t!==this&&t.close(),Ne(this),this.previouslyFocused=document.activeElement,this.moveToBody(),requestAnimationFrame(()=>{this.focusFirstElement()})}handleClose(){Pe()===this&&Ne(null),this.restorePosition(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}focusFirstElement(){const t=this.shadowRoot?.querySelector(".content");if(!t)return;const s=this.shadowRoot?.querySelector("slot:not([name])");if(s){const t=s.assignedElements({flatten:!0});for(const s of t){const t=s.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t)return void t.focus();if(s instanceof HTMLElement&&s.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))return void s.focus()}}const n=this.shadowRoot?.querySelector(".close-button");n&&n.focus()}emitCloseEvent(){const t=new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0});this.dispatchEvent(t)}};Le.styles=pt`
    :host {
      display: contents;
    }

    .backdrop {
      display: none;
    }

    :host([open]) .backdrop {
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      animation: qd-modal-fadeIn 0.15s ease-out;
    }

    @keyframes qd-modal-fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: qd-modal-slideIn 0.15s ease-out;
    }

    @keyframes qd-modal-slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      font-size: 18px;
    }

    .header ::slotted(*) {
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 20px;
      color: #666;
      line-height: 1;
      border-radius: 4px;
      transition:
        background-color 0.2s,
        color 0.2s;
      margin-left: auto;
    }

    .close-button:hover {
      background: #f0f0f0;
      color: #333;
    }

    .close-button:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }

    .body {
      padding: 20px;
    }
  `,Oe([ue({type:Boolean,reflect:!0})],Le.prototype,"open",2),Oe([ue({type:Boolean})],Le.prototype,"closable",2),Le=Oe([ce("qd-modal")],Le);var De=Object.defineProperty,Re=Object.getOwnPropertyDescriptor,ze=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?Re(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&De(s,n,a),a};let Me=class extends ie{constructor(){super(...arguments),this.open=!1,this.title="Enter Password",this.error="",this.password="",this.handleModalClose=()=>{this.close()},this.handleInput=t=>{const s=t.target;this.password=s.value,this.error&&(this.error="")},this.handleSubmit=t=>{t.preventDefault(),this.password.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:this.password},bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close()}}show(){this.open=!0,this.password="",this.error=""}close(){this.open=!1,this.password="",this.error="",this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}updated(t){t.has("open")&&this.open&&(this.password="",this.updateComplete.then(()=>{this.passwordInput?.focus()}))}render(){return Jt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        ${this.open?Jt`
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

                ${this.error?Jt`<div class="error-message">${this.error}</div>`:""}

                <div class="button-row">
                  <button type="button" @click=${this.handleCancel}>Cancel</button>
                  <button type="submit">Login</button>
                </div>
              </form>
            `:Gt}
      </qd-modal>
    `}};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
var He;Me.styles=pt`
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
  `,ze([ue({type:Boolean,reflect:!0})],Me.prototype,"open",2),ze([ue({type:String})],Me.prototype,"title",2),ze([ue({type:String})],Me.prototype,"error",2),ze([he()],Me.prototype,"password",2),ze([(He='input[type="password"]',(t,s,n)=>((t,s,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&"object"!=typeof s&&Object.defineProperty(t,s,n),n))(t,s,{get(){return(t=>t.renderRoot?.querySelector(He)??null)(this)}}))],Me.prototype,"passwordInput",2),Me=ze([ce("qd-password-modal")],Me);
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Ue=2;class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,s,n){this._$Ct=t,this._$AM=s,this._$Ci=n}_$AS(t,s){return this.update(t,s)}update(t,s){return this.render(...s)}}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class e extends i{constructor(t){if(super(t),this.it=Gt,t.type!==Ue)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===Gt||null==t)return this._t=void 0,this.it=t;if(t===Yt)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const s=[t];return s.raw=s,this._t={_$litType$:this.constructor.resultType,strings:s,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;const je=(t=>(...s)=>({_$litDirective$:t,values:s}))(e);var Be=Object.defineProperty,Fe=Object.getOwnPropertyDescriptor,Ve=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?Fe(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Be(s,n,a),a};let Qe=class extends ie{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}render(){return Jt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${je(this.message)}</div>

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
    `}};Qe.styles=pt`
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
  `,Ve([ue({type:Boolean,reflect:!0})],Qe.prototype,"open",2),Ve([ue({type:String})],Qe.prototype,"title",2),Ve([ue({type:String})],Qe.prototype,"message",2),Ve([ue({type:String})],Qe.prototype,"confirmText",2),Ve([ue({type:String})],Qe.prototype,"cancelText",2),Ve([ue({type:Boolean})],Qe.prototype,"destructive",2),Qe=Ve([ce("qd-confirm-dialog")],Qe);var Ke=Object.defineProperty,We=Object.getOwnPropertyDescriptor,Je=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?We(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Ke(s,n,a),a};let Ye=class extends ie{constructor(){super(...arguments),this.panelType="login",this.handleClick=()=>{this.dispatchEvent(new CustomEvent("qd:help-open",{detail:{panelType:this.panelType},bubbles:!0,composed:!0}))}}render(){return Jt`
      <button class="help-icon" @click=${this.handleClick} aria-label="Help" title="Help">?</button>
    `}};Ye.styles=pt`
    :host {
      display: inline-block;
    }

    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0066cc;
      color: white;
      font-size: 12px;
      font-weight: bold;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      cursor: pointer;
      border: none;
      padding: 0;
      transition: background 0.15s ease;
    }

    .help-icon:hover {
      background: #0052a3;
    }

    .help-icon:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }

    .help-icon:active {
      background: #004080;
    }
  `,Je([ue({type:String})],Ye.prototype,"panelType",2),Ye=Je([ce("qd-help-trigger")],Ye);var Ge=Object.defineProperty,Ze=Object.getOwnPropertyDescriptor,Xe=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?Ze(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Ge(s,n,a),a};let ts=class extends ie{constructor(){super(...arguments),this.portalElement=null,this.previouslyFocused=null,this.open=!1,this.title="Help",this.content="",this._isOpen=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this._isOpen&&this.close()},this.handleBackdropClick=()=>{this.close()},this.handleCloseClick=()=>{this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown),this.ensureStyles()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),this.removePortal()}updated(t){t.has("open")&&(this.open&&!this._isOpen?this.handleOpen():!this.open&&this._isOpen&&this.handleClose())}ensureStyles(){ts.styleElement||(ts.styleElement=document.createElement("style"),ts.styleElement.textContent="\n.qd-help-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif}\n.qd-help-content{background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:450px;max-height:80vh;overflow:auto}\n.qd-help-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}\n.qd-help-title{font-weight:600;font-size:18px;color:#333;margin:0}\n.qd-help-close{background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:0;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}\n.qd-help-close:hover{background:#f0f0f0;color:#333}\n.qd-help-close:focus{outline:2px solid #0066cc;outline-offset:2px}\n.qd-help-body{padding:20px;line-height:1.6;color:#444}\n.qd-help-body h3{margin-top:0;margin-bottom:12px;color:#333;font-size:16px}\n.qd-help-body p{margin:0 0 12px 0}\n.qd-help-body p:last-child{margin-bottom:0}\n.qd-help-body strong{color:#333}",document.head.appendChild(ts.styleElement))}createPortal(){this.removePortal(),this.portalElement=document.createElement("div"),this.portalElement.className="qd-help-backdrop",this.portalElement.addEventListener("click",this.handleBackdropClick);const t=document.createElement("div");t.className="qd-help-content",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-labelledby","qd-help-title"),t.addEventListener("click",this.stopPropagation);const s=document.createElement("div");s.className="qd-help-header";const n=document.createElement("h2");n.className="qd-help-title",n.id="qd-help-title",n.textContent=this.title;const o=document.createElement("button");o.className="qd-help-close",o.setAttribute("aria-label","Close"),o.innerHTML="×",o.addEventListener("click",this.handleCloseClick),s.appendChild(n),s.appendChild(o);const r=document.createElement("div");r.className="qd-help-body",r.innerHTML=this.content,t.appendChild(s),t.appendChild(r),this.portalElement.appendChild(t),document.body.appendChild(this.portalElement),requestAnimationFrame(()=>{o.focus()})}removePortal(){this.portalElement&&(this.portalElement.remove(),this.portalElement=null)}handleOpen(){this._isOpen=!0,this.previouslyFocused=document.activeElement,this.createPortal()}handleClose(){this._isOpen=!1,this.removePortal(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}close(){this.open=!1,this.dispatchEvent(new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0}))}render(){return Gt}};ts.styleElement=null,Xe([ue({type:Boolean,reflect:!0})],ts.prototype,"open",2),Xe([ue({type:String})],ts.prototype,"title",2),Xe([ue({type:String})],ts.prototype,"content",2),Xe([he()],ts.prototype,"_isOpen",2),ts=Xe([ce("qd-help-popup")],ts);const es={login:{title:"Login Help",body:'<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'},status:{title:"Student View",body:'<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>'},instructor:{title:"Instructor Tools",body:"<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"}};function ss(t){return es[t]}var ns=Object.defineProperty,os=Object.getOwnPropertyDescriptor,rs=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?os(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&ns(s,n,a),a};let is=class extends ie{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.showInstructorModal=!1,this.instructorError="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutSeconds=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.lockoutInterval=null,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.instructorError="",this.pin="",this.lockoutSeconds=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null),this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handleInstructorPasswordSubmit=t=>{this.handleInstructorLogin(t.detail.password)},this.handleInstructorModalClose=()=>{this.showInstructorModal=!1,this.instructorError=""},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){$(u.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return Jt`
      <div class="login-container">
        <div class="title">
          ${this.title}
          <qd-build-info></qd-build-info>
          <qd-help-trigger panelType="login" @qd:help-open=${this.handleHelpOpen}></qd-help-trigger>
        </div>

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

          ${this.errorMessage?Jt`<div class="error-message">${this.errorMessage}</div>`:""}
          ${this.lockoutSeconds>0?Jt`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
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

      <qd-help-popup
        .open=${this.helpOpen}
        .title=${ss("login").title}
        .content=${ss("login").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}handleNameInput(t){const s=t.target;this.name=s.value,this.errorMessage=""}handleServiceIdInput(t){const s=t.target;this.serviceId=s.value,this.errorMessage=""}handlePinInput(t){const s=t.target;this.pin=function(t){return t.replace(/\D/g,"")}(s.value),this.errorMessage=""}isValid(){return 0===function(t,s,n){const o=[];t&&""!==t.trim()||o.push("Name required"),s?/^[a-zA-Z0-9]{2,10}$/.test(s)||o.push("Service ID must be 2-10 alphanumeric characters"):o.push("Service ID required");n?/^\d{4}$/.test(n)||o.push("PIN must be exactly 4 digits"):o.push("PIN required");return o}(this.name,this.serviceId,this.pin).length}getRelease(){const t=document.getElementById(be),s=t?.textContent?.trim()||".wh_publication_title .title",n=document.querySelector(s);return n?.textContent?.trim()||""}async handleStudentLogin(t){if(t.preventDefault(),this.isValid()){this.isSubmitting=!0,this.errorMessage="";try{const t=this.getRelease();if(!t)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const n=this.serviceId.trim(),o=this.name.trim(),r=Ce(n);if(r.isLocked)return this.startLockoutCountdown(r.remainingMs),void(this.isSubmitting=!1);const c=document.getElementById(ve);if(!c?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${ve}">dbName</span> to page.`);const d=U(c.textContent.trim());await d.init();const l=await d.getStudent(t,n);if(!l){const s=await xe(this.pin),r={schema:2,docId:"",release:t,serviceId:n,name:o,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:s,pinCreatedAt:(new Date).toISOString()};return await d.saveStudent(r),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,o,t)}if(l.schema<2||!function(t){return Boolean(t.pinHash&&t.pinHash.length>0)}(l)){const s=function(t,s){return{...t,schema:2,pinHash:s,pinCreatedAt:(new Date).toISOString()}}(l,await xe(this.pin));return await d.saveStudent(s),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,o,t)}if(!(await async function(t,s){return function(t,s){if(t.length!==s.length)return!1;let n=0;for(let o=0;o<t.length;o++)n|=t.charCodeAt(o)^s.charCodeAt(o);return 0===n}(await xe(t),s)}(this.pin,l.pinHash||""))){const t=function(t){const n=(new Date).toISOString();let o=$e(t);if(o||(o={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:n}),o.attempts+=1,o.lastAttempt=n,o.attempts>=h){const n=new Date(Date.now()+p);o.lockoutUntil=n.toISOString(),a(`PIN lockout triggered for ${s(t)} after ${o.attempts} failed attempts`)}else o.attempts,s(t);const r=Ee(t);return sessionStorage.setItem(r,JSON.stringify(o)),o}(n),o=function(t){const s=$e(t);return s?Ce(t).isLocked?0:Math.max(0,h-s.attempts):h}(n);if(t.lockoutUntil){const s=new Date(t.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(s)}else this.errorMessage=`Incorrect PIN. ${o} attempt${1!==o?"s":""} remaining`;return this.pin="",void(this.isSubmitting=!1)}qe(n),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}));this.completeLogin(n,o,t)}catch(n){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",n),this.isSubmitting=!1}}else this.errorMessage="Please enter name, service ID, and 4-digit PIN"}showPinStoredConfirmation(){this.showPinConfirmation=!0}startLockoutCountdown(t){this.lockoutSeconds=Math.ceil(t/1e3),this.errorMessage="",this.lockoutInterval&&clearInterval(this.lockoutInterval),this.lockoutInterval=window.setInterval(()=>{this.lockoutSeconds--,this.lockoutSeconds<=0&&this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)},1e3)}completeLogin(t,s,n){(new SessionService).createSession(t,s,n);const o=new CustomEvent("qd:login",{detail:{serviceId:t,name:s,release:n,role:"student"},bubbles:!0,composed:!0});this.dispatchEvent(o),this.pin="",this.isSubmitting=!1,this.updateVisibility()}openInstructorModal(){this.showInstructorModal=!0,this.instructorError=""}async hashPassword(t){const s=(new TextEncoder).encode(t),n=await crypto.subtle.digest("SHA-256",s);return Array.from(new Uint8Array(n)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){const t=document.getElementById(ye);return t?.textContent?.trim()||""}async handleInstructorLogin(t){try{const s=await this.hashPassword(t),n=this.getExpectedHash();if(!n)return void(this.instructorError="Instructor password not configured");if(s!==n)return void(this.instructorError="Incorrect password");const o=this.getRelease();(new SessionService).createSession("INSTRUCTOR","Instructor",o||""),sessionStorage.setItem(u.INSTRUCTOR,"true");const r=new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:o||"",role:"instructor"},bubbles:!0,composed:!0});this.dispatchEvent(r),this.showInstructorModal=!1,this.instructorError="",this.updateVisibility()}catch(s){this.instructorError="Login failed. Please try again.",console.error("Instructor login error:",s)}}};is.styles=pt`
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
  `,rs([ue({type:String})],is.prototype,"title",2),rs([he()],is.prototype,"name",2),rs([he()],is.prototype,"serviceId",2),rs([he()],is.prototype,"showInstructorModal",2),rs([he()],is.prototype,"instructorError",2),rs([he()],is.prototype,"errorMessage",2),rs([he()],is.prototype,"isSubmitting",2),rs([he()],is.prototype,"pin",2),rs([he()],is.prototype,"lockoutSeconds",2),rs([he()],is.prototype,"showPinConfirmation",2),rs([he()],is.prototype,"helpOpen",2),is=rs([ce("qd-login")],is);var as=Object.defineProperty,cs=Object.getOwnPropertyDescriptor,ds=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?cs(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&as(s,n,a),a};let ls=class extends ie{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.helpOpen=!1,this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleCacheRebuild=()=>{this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:cache-rebuild",this.handleCacheRebuild)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:cache-rebuild",this.handleCacheRebuild)}render(){const t=this.serviceId.slice(-4);return Jt`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${t}
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
        .title=${ss("status").title}
        .content=${ss("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}loadCache(){const t=$(u.SESSION);t?(this.name=t.name||"",this.serviceId=t.serviceId||""):(this.name="",this.serviceId="");const s=$(u.CACHE);if(!s)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");this.total=s.totals.total,this.correct=s.totals.correct,this.percentage=this.calculatePercentage(s.totals.total,s.totals.correct),this.statusColor=this.calculateStatusColor(s.totals.total,s.totals.correct)}calculatePercentage(t,s){return 0===t?0:Math.round(s/t*100)}calculateStatusColor(t,s){return function(t,s){return 0===t||0===s?"red":s===t?"green":"amber"}(t,s)}updateVisibility(){const t=$(u.SESSION),s="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&!s?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const t=$(u.SESSION);(new SessionService).clearSession();const s=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(s)}};ls.styles=pt`
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
  `,ds([he()],ls.prototype,"total",2),ds([he()],ls.prototype,"correct",2),ds([he()],ls.prototype,"percentage",2),ds([he()],ls.prototype,"statusColor",2),ds([he()],ls.prototype,"name",2),ds([he()],ls.prototype,"serviceId",2),ds([he()],ls.prototype,"helpOpen",2),ls=ds([ce("qd-status")],ls);const us=pt`
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
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],s=t[Math.min(this.failureCount-1,t.length-1)]??3e4;this.lockoutUntil=Date.now()+s}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const hs="instructor.password.hash";var ps=Object.defineProperty,gs=Object.getOwnPropertyDescriptor,ms=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?gs(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&ps(s,n,a),a};let fs=class extends ie{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=t=>{const s=t.target;this.password=s.value,this.error=""},this.handleSubmit=async t=>{t.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const t=function(){const t=document.getElementById(hs);if(!t){const t=`Instructor password hash not found. Expected element with id="${hs}". Check Oxygen XSL transform configuration.`;throw r(t),new Error(t)}const s=t.textContent?.trim();if(!s){const t="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw r(t),new Error(t)}if(!/^[a-f0-9]{64}$/i.test(s)){const t=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${s.substring(0,20)}...`;throw r(t),new Error(t)}return s.toLowerCase()}(),s=(new TextEncoder).encode(this.password),n=await crypto.subtle.digest("SHA-256",s),o=Array.from(new Uint8Array(n)).map(t=>t.toString(16).padStart(2,"0")).join(""),a=await async function(t,s){if(t.length!==s.length)return!1;if(0===t.length)return!0;const n=new TextEncoder,o=n.encode(t),r=n.encode(s);try{const t=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),s=await crypto.subtle.sign("HMAC",t,r),n=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),a=await crypto.subtle.sign("HMAC",n,o);if(s.byteLength!==a.byteLength)return!1;const c=new Uint8Array(s),d=new Uint8Array(a);let l=0;for(let o=0;o<c.length;o++)l|=(c[o]??0)^(d[o]??0);return 0===l}catch(a){return console.error("Constant-time comparison failed:",a),!1}}(o,t);a?(this.rateLimiter.reset(),this.password="",this.error="",E(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return Jt`
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

          ${this.error?Jt`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};fs.styles=us,ms([he()],fs.prototype,"password",2),ms([he()],fs.prototype,"error",2),ms([he()],fs.prototype,"remainingSeconds",2),fs=ms([ce("qd-instructor-unlock")],fs);var bs=Object.defineProperty,ys=Object.getOwnPropertyDescriptor,vs=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?ys(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&bs(s,n,a),a};let ws=class extends ie{constructor(){super(...arguments),this.open=!1,this.students=[],this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}render(){return Jt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Student Scores</span>
        <style>
          .scores-content {
            min-width: 500px;
            max-width: 800px;
          }
          .scores-content .empty-message {
            color: #666;
            padding: 20px;
            text-align: center;
          }
          .scores-content table {
            width: 100%;
            border-collapse: collapse;
          }
          .scores-content thead th {
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            background: #f5f5f5;
            font-weight: 600;
            font-size: 12px;
          }
          .scores-content .student-row td {
            padding: 4px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: middle;
            font-size: 12px;
          }
          .scores-content .student-row:nth-child(even) {
            background: #e8e8e8;
          }
          .scores-content .student-row:hover {
            background: #f0f0f0;
          }
          .scores-content .score-perfect {
            color: #28a745;
            font-weight: 500;
          }
          .scores-content .score-zero {
            color: #dc3545;
          }
          .scores-content .answers-cell {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .scores-content .page-row {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .scores-content .page-name {
            font-weight: 500;
            font-size: 10px;
            color: #555;
            min-width: 80px;
          }
          .scores-content .page-answers {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
          }
          .scores-content .answer-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
          }
          .scores-content .answer-badge.correct {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .scores-content .answer-badge.incorrect {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .scores-content .no-answers {
            color: #999;
            font-style: italic;
            font-size: 11px;
          }
        </style>
        <div class="scores-content">
          ${0===this.students.length?Jt`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const t=[...this.students].sort((t,s)=>t.name.localeCompare(s.name));return Jt`
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Service ID</th>
            <th>Score</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          ${t.map(t=>this.renderStudentRow(t))}
        </tbody>
      </table>
    `}renderStudentRow(t){const s=this.calculateSummary(t),n=Object.entries(t.pages);return Jt`
      <tr class="student-row">
        <td>${s.name}</td>
        <td>${s.serviceId}</td>
        <td class=${this.getScoreClass(s)}>
          ${s.correct}/${s.attempted} (${s.percentage}%)
        </td>
        <td>
          ${0===n.length?Jt`<span class="no-answers">—</span>`:Jt`
                <div class="answers-cell">
                  ${n.map(([t,s])=>Jt`
                      <div class="page-row">
                        <span class="page-name">${t}</span>
                        <div class="page-answers">
                          ${s.answers.map((t,s)=>Jt`
                              <span
                                class="answer-badge ${t?.success?"correct":"incorrect"}"
                              >
                                Q${s+1}: ${t?.answer??"—"}
                              </span>
                            `)}
                        </div>
                      </div>
                    `)}
                </div>
              `}
        </td>
      </tr>
    `}getScoreClass(t){return 0===t.attempted?"":100===t.percentage?"score-perfect":0===t.percentage?"score-zero":""}calculateSummary(t){const s=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:s}}show(){this.open=!0}close(){this.open=!1}};ws.styles=pt`
    :host {
      display: contents;
    }
  `,vs([ue({type:Boolean,reflect:!0})],ws.prototype,"open",2),vs([ue({type:Array})],ws.prototype,"students",2),ws=vs([ce("qd-scores-modal")],ws);var Ss=Object.defineProperty,xs=Object.getOwnPropertyDescriptor,Es=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?xs(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Ss(s,n,a),a};let $s=class extends ie{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return Jt`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};$s.styles=us,Es([ue({type:Array})],$s.prototype,"students",2),Es([ue({type:Boolean})],$s.prototype,"showModal",2),$s=Es([ce("qd-instructor-scores")],$s);var Cs=Object.defineProperty,qs=Object.getOwnPropertyDescriptor,Is=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?qs(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Cs(s,n,a),a};let As=class extends ie{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),s=new Blob([t],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(s),o=document.createElement("a");o.href=n;const r=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);o.download=`quiz-data-${r}.csv`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(n)}}escapeCSVField(t){const s=String(t);return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const s of this.students)for(const[n,o]of Object.entries(s.pages)){(o.answers||[]).forEach((o,r)=>{o&&t.push([this.escapeCSVField(s.serviceId),this.escapeCSVField(s.name),this.escapeCSVField(s.release),this.escapeCSVField(n),this.escapeCSVField(r),this.escapeCSVField(o.answer),this.escapeCSVField(o.success),this.escapeCSVField(o.timestamp)].join(","))})}return t.join("\n")}render(){const t=this.students.length>0&&this.students.some(t=>t.attempted>0),s=t?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return Jt`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${s}
      >
        Export CSV
      </button>
    `}};As.styles=us,Is([ue({type:Array})],As.prototype,"students",2),As=Is([ce("qd-instructor-export")],As);var ks=Object.defineProperty,Ts=Object.getOwnPropertyDescriptor,Os=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?Ts(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&ks(s,n,a),a};let _s=class extends ie{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const s=t.target;this.confirmText=s.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{q(),E(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),oe(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return Jt`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?Jt`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t="DELETE ALL DATA"===this.confirmText;return Jt`
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

          ${this.error?Jt`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};_s.styles=us,Os([he()],_s.prototype,"showConfirmDialog",2),Os([he()],_s.prototype,"confirmText",2),Os([he()],_s.prototype,"error",2),Os([he()],_s.prototype,"success",2),_s=Os([ce("qd-instructor-manage")],_s);var Ps=Object.defineProperty,Ns=Object.getOwnPropertyDescriptor,Ls=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?Ns(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Ps(s,n,a),a};let Ds=class extends ie{constructor(){super(...arguments),this.students=[],this.open=!1,this.searchText="",this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleSearchInput=t=>{const s=t.target;this.searchText=s.value},this.handleResetClick=t=>{this.confirmingStudent=t,this.confirmDialogOpen=!0},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(t){this.open=t}get showModal(){return this.open}get filteredStudents(){if(!this.searchText.trim())return this.students;const t=this.searchText.toLowerCase().trim();return this.students.filter(s=>s.name.toLowerCase().includes(t)||s.serviceId.toLowerCase().includes(t))}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.searchText="",this.errorMessage=""}show(){this.open=!0}async executeReset(t){try{const n=document.getElementById(ve);if(!n?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${ve}">dbName</span> to page.`);const o=U(n.textContent.trim());await o.init();const r=(s=t,{...s,pinHash:"",pinResetAt:(new Date).toISOString()});await o.saveStudent(r);const a={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:t.release};await o.saveAuditEvent(a);const c=this.students.findIndex(s=>s.serviceId===t.serviceId);c>=0&&(this.students[c]=r,this.students=[...this.students]),this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.confirmDialogOpen=!1,this.confirmingStudent=null,this.errorMessage=""}catch(n){console.error("PIN reset error:",n),this.errorMessage="Failed to reset PIN. Please try again.",this.confirmDialogOpen=!1,this.confirmingStudent=null}var s}render(){const t=this.confirmingStudent,s=t?`Reset PIN for <strong>${t.name}</strong> (${t.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return Jt`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open?Jt`
              <div class="pin-reset-content">
                <input
                  type="text"
                  class="search-input"
                  placeholder="Search by name or ID..."
                  .value=${this.searchText}
                  @input=${this.handleSearchInput}
                />

                <div class="student-table-container">
                  ${0===this.filteredStudents.length?Jt`<div class="empty-message">
                        ${this.searchText?"No matching students":"No students found"}
                      </div>`:Jt`
                        <table class="student-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Service ID</th>
                              <th>Reset PIN</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${this.filteredStudents.map(t=>Jt`
                                <tr>
                                  <td>${t.name}</td>
                                  <td>${t.serviceId}</td>
                                  <td>
                                    <button
                                      class="reset-btn"
                                      type="button"
                                      @click=${()=>this.handleResetClick(t)}
                                    >
                                      Reset
                                    </button>
                                  </td>
                                </tr>
                              `)}
                          </tbody>
                        </table>
                      `}
                </div>

                ${this.errorMessage?Jt`<div class="error-message">${this.errorMessage}</div>`:""}
              </div>
            `:Gt}
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
    `}};Ds.styles=pt`
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

    .student-table-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .student-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .student-table th {
      text-align: left;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      position: sticky;
      top: 0;
    }

    .student-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .student-table tbody tr:nth-child(even) {
      background: #f8f8f8;
    }

    .student-table tbody tr:hover {
      background: #f0f0f0;
    }

    .student-table tr:last-child td {
      border-bottom: none;
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
  `,Ls([ue({type:Array})],Ds.prototype,"students",2),Ls([ue({type:Boolean,reflect:!0})],Ds.prototype,"open",2),Ls([he()],Ds.prototype,"searchText",2),Ls([he()],Ds.prototype,"confirmingStudent",2),Ls([he()],Ds.prototype,"confirmDialogOpen",2),Ls([he()],Ds.prototype,"errorMessage",2),Ls([ue({type:Boolean})],Ds.prototype,"showModal",1),Ds=Ls([ce("qd-pin-reset-dialog")],Ds);var Rs=Object.defineProperty,zs=Object.getOwnPropertyDescriptor,Ms=(t,s,n,o)=>{for(var r,a=o>1?void 0:o?zs(s,n):s,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(s,n,a):r(a))||a);return o&&a&&Rs(s,n,a),a};let Hs=class extends ie{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.helpOpen=!1,this.handleLoginEvent=t=>{const s=t,n=s.detail?.role;this.updateVisibility(),"instructor"===n&&(this.unlock(),this.loadStudents())},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{const t=$(u.SESSION);if(t){try{const s=V(),n=await s.getStudentsByRelease(t.release);this.students=n}catch(s){console.error("Failed to load students:",s),this.students=[]}this.showPinReset=!0}},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const t=$(u.SESSION);if(t){try{const s=V(),n=await s.getStudentsByRelease(t.release);this.students=n}catch(s){console.error("Failed to load students:",s),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=$(u.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const s=t.target;if(this.showStudentAnswers=s.checked,this.showStudentAnswers&&0===this.students.length){const t=$(u.SESSION);if(t)try{const s=V(),n=await s.getStudentsByRelease(t.release);this.students=n}catch(o){console.error("Failed to load students for toggle:",o)}}const n=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(n,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&(this.unlock(),this.loadStudents());const s=sessionStorage.getItem("qd/instructor/showAnswers");null!==s&&(this.showStudentAnswers="true"===s,this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){"true"===sessionStorage.getItem(u.INSTRUCTOR)?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(t){this.students=t}async loadStudents(){const t=$(u.SESSION);if(t)try{const s=V(),n=await s.getStudentsByRelease(t.release);this.students=n}catch(s){console.error("Failed to load students:",s),this.students=[]}}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?Jt`
      <div class="instructor-panel">
        <div class="instructor-title">
          Instructor Mode
          <qd-help-trigger
            panelType="instructor"
            @qd:help-open=${this.handleHelpOpen}
          ></qd-help-trigger>
          <qd-build-info></qd-build-info>
        </div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show current answers
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

        <qd-help-popup
          .open=${this.helpOpen}
          .title=${ss("instructor").title}
          .content=${ss("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `:Jt`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};Hs.styles=[us,pt`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],Ms([he()],Hs.prototype,"unlocked",2),Ms([he()],Hs.prototype,"showScores",2),Ms([he()],Hs.prototype,"students",2),Ms([he()],Hs.prototype,"showStudentAnswers",2),Ms([he()],Hs.prototype,"showPinReset",2),Ms([he()],Hs.prototype,"helpOpen",2),Hs=Ms([ce("qd-instructor")],Hs);const Us={statusPanel:".wh_top_menu_and_indexterms_link"};function js(t={}){const s=t.statusPanelContainer||Us.statusPanel;!function(t){const s=document.querySelector(t);if(!s)return null;const n=document.createElement("qd-login");s.appendChild(n)}(s),function(t){const s=document.querySelector(t);if(!s)return null;const n=document.createElement("qd-status");s.appendChild(n)}(s),function(t){const s=document.querySelector(t);if(!s)return null;const n=document.createElement("qd-instructor");s.appendChild(n)}(s)}const Bs={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},Fs={unstarted:"red",incomplete:"amber",complete:"green"};function Vs(t){const s=function(t,s){if(!t||!s?.pages)return"unstarted";const n=s.pages[t];return n?.state??"unstarted"}(t.getAttribute("data-page-id"),$(u.CACHE));!function(t,s){Object.values(Bs).forEach(s=>{t.classList.remove(s)});const n=Bs[Fs[s]];t.classList.add(n)}(t,s)}function Qs(){const t=document.querySelectorAll(".quizPageBtn"),s=$(u.CACHE),n="true"===sessionStorage.getItem(u.INSTRUCTOR);if(!s||n)return t.forEach(t=>{Object.values(Bs).forEach(s=>{t.classList.remove(s)})}),void t.length;t.forEach(t=>{Vs(t)}),t.length}function Ks(t){const s=t,{pageId:n}=s.detail,o=document.querySelector(`[data-page-id="${n}"]`);o&&o.classList.contains("quizPageBtn")&&Vs(o)}function Ws(){Qs()}function Js(){const t=document.querySelectorAll(".quizPageBtn");t.forEach(t=>{Object.values(Bs).forEach(s=>{t.classList.remove(s)})}),t.length}const Ys={initialized:!1};async function Gs(t={}){if(Ys.initialized)return void a("Bootstrap already initialized, skipping");if(function(){if(document.getElementById("qd-global-styles"))return;const t=document.createElement("style");t.id="qd-global-styles",t.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: inherit;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Ensure select elements inherit font properly */\n    .qd-quiz-interactive select.qd-quiz-input {\n      font-family: inherit;\n      font-size: inherit;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor mode: Student answers display */\n    .qd-student-answers {\n      margin-top: 12px;\n      padding: 8px;\n      background: #f8f9fa;\n      border-radius: 4px;\n      border: 1px solid #dee2e6;\n    }\n\n    .qd-student-answer {\n      font-size: 12px;\n      padding: 4px 0;\n      line-height: 1.4;\n    }\n\n    .qd-student-answer.qd-correct {\n      color: #28a745;\n    }\n\n    .qd-student-answer.qd-incorrect {\n      color: #dc3545;\n    }\n\n    .qd-student-name {\n      font-weight: 600;\n    }\n\n    .qd-student-answer-text {\n      margin: 0 4px;\n    }\n\n    .qd-timestamp {\n      color: #6c757d;\n      font-size: 11px;\n      margin-left: 8px;\n    }\n\n    /* Modal error message styles (needed because qd-modal moves to body) */\n    .error-message {\n      color: #d32f2f;\n      font-size: 12px;\n      padding: 8px;\n      background: #ffebee;\n      border-radius: 4px;\n      border-left: 3px solid #d32f2f;\n    }\n  ",document.head.appendChild(t)}(),!t.dbName){const t="FATAL: dbName not provided in bootstrap config. Processing stopped.";throw console.error(t),new Error(t)}const s=V(t.dbName);await s.init();const n=new EventCoordinator;n.initialize(),Ys.eventCoordinator=n;const o=new SessionCoordinator;o.initialize(),Ys.sessionCoordinator=o,js({statusPanelContainer:t.statusPanelContainer,dbName:t.dbName}),!1!==t.autoEnhanceQuizTables&&function(){const t=document.querySelectorAll("table.qd-quiz");if(0===t.length)return;t.length;for(const n of Array.from(t))try{K(n,{interactive:!1})}catch(s){a(`Failed to enhance quiz table: ${s.message}`)}t.length}(),!1!==t.autoEnhanceAnalysisTables&&function(){const t=document.querySelectorAll("table.qd-analysis");if(0===t.length)return;t.length;for(const n of Array.from(t))try{it(n,{interactive:!1})}catch(s){a(`Failed to enhance analysis table: ${s.message}`)}t.length}(),!1!==t.autoEnhanceHomeBadges&&function(){const t=document.querySelectorAll(".quizPageBtn");if(0===t.length)return;t.length;try{document.querySelectorAll(".quizPageBtn").forEach(t=>{const s=function(t){const s=t.getAttribute("href");return s&&s.substring(s.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(t);s?(t.setAttribute("data-page-id",s),t.textContent?.trim()):t.getAttribute("href")}),Qs(),document.addEventListener("qd:state-changed",Ks),document.addEventListener("qd:cache-rebuild",Ws),document.addEventListener("qd:logout",Js)}catch(s){a(`Failed to enhance home badges: ${s.message}`)}}(),await async function(){const t=$(u.SESSION);if(!t)return;if("true"===sessionStorage.getItem(u.INSTRUCTOR))return void Zs();t.serviceId;const s=V();let n=$(u.CACHE);if(!n)try{const o=await s.loadStudentRecord(t);n=s.buildCache(o),C(u.CACHE,n),n.totals.total}catch{a("Failed to rebuild cache from IndexedDB, using empty cache"),n={totals:{total:0,answered:0,correct:0},pages:{}},C(u.CACHE,n)}const o=window.location.pathname,r=o.substring(o.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!r)return;const c=document.querySelectorAll("table.qd-quiz");c.length>0&&(c.length,c.forEach(t=>{K(t,{interactive:!0,pageId:r})}));const d=document.querySelectorAll("table.qd-analysis");d.length>0&&(d.length,d.forEach(t=>{it(t,{interactive:!0,pageId:r})}))}(),document.addEventListener("qd:login",t=>{const s=t.detail;"instructor"===s?.role&&Zs()}),Ys.initialized=!0}function Zs(){const t=window.location.pathname,s=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,""),n=document.querySelectorAll("table.qd-quiz");0!==n.length&&(n.forEach(t=>{const n=G(t);if(!n)return;n.pageId=s;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,s)=>{const o=n.parsed.questions[s];o&&t instanceof HTMLTableCellElement&&(t.textContent=o.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const o=()=>{Z(t,n)};document.addEventListener("qd:instructor-show-answers",o),document.addEventListener("qd:instructor-hide-answers",()=>{X(t)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&o()}),n.length)}if("undefined"!=typeof window){const t=()=>{const t=Se();Gs({dbName:t.dbName,statusPanelContainer:t.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(t=>{console.error("[FATAL] Bootstrap failed:",t)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{t()}):t()}return t.BUILD_DATE="27/Nov/2025",t.DEFAULT_CONTAINERS=Us,t.Debouncer=Debouncer,t.SCHEMA_VERSION=2,t.SESSION_TIMEOUT_MS=l,t.STORAGE_KEYS=u,t.VERSION="0.1.0-phase3.1",t.bootstrap=Gs,t.calculateCompletionState=j,t.cleanup=function(){Ys.initialized?(Ys.eventCoordinator?.cleanup(),Ys.sessionCoordinator?.cleanup(),Ys.initialized=!1,Ys.eventCoordinator=void 0,Ys.sessionCoordinator=void 0):a("Bootstrap not initialized, nothing to cleanup")},t.clearQuizData=q,t.enhanceAnalysisTable=it,t.enhanceQuizTable=K,t.error=r,t.generateCellKey=st,t.generateTableId=et,t.getAnalysisTableMetadata=function(t){return rt.get(t)},t.getJSON=$,t.getQuizTableMetadata=G,t.info=o,t.injectComponents=js,t.isAnalysisTableEnhanced=function(t){return rt.has(t)},t.isCellEditable=nt,t.isInitialized=function(){return Ys.initialized},t.isQuizTableEnhanced=function(t){return Q.has(t)},t.parseAnalysisTable=ot,t.parseQuizTable=c,t.setJSON=C,t.validateAnswer=d,t.warn=a,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),t}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
