var SonarQuiz=function(e){"use strict";function t(e){if(e.length<2)return"**";if(2===e.length)return e;return e.slice(0,2)+"*".repeat(e.length-2)}function n(e){if(null===e||"object"!=typeof e)return e;const s={};for(const[o,r]of Object.entries(e))"name"!==o&&"passwordHash"!==o&&(s[o]="serviceId"!==o||"string"!=typeof r?"object"!=typeof r||null===r?r:n(r):t(r));return s}function s(e,t){void 0!==t?console.log(`[INFO] ${e}`,n(t)):console.log(`[INFO] ${e}`)}function o(e,t){if(t instanceof Error){const n={name:t.name,message:t.message};console.error(`[ERROR] ${e}`,n)}else void 0!==t?console.error(`[ERROR] ${e}`,n(t)):console.error(`[ERROR] ${e}`)}function r(e,t){void 0!==t?console.warn(`[WARN] ${e}`,n(t)):console.warn(`[WARN] ${e}`)}function a(e){const t=[],n=[];if(!e.classList.contains("qd-quiz"))return t.push('Table must have class "qd-quiz"'),{element:e,questions:n,errors:t};const s=Array.from(e.querySelectorAll("tbody tr"));return 0===s.length?(t.push("Quiz table has no data rows"),{element:e,questions:n,errors:t}):(s.forEach((e,s)=>{const o=Array.from(e.querySelectorAll("td"));if(3!==o.length)return void t.push(`Row ${s+1} has ${o.length} columns, expected 3 (Question | Answer | Detail)`);const r=o[0],a=o[1],d=o[2];if(!r||!a||!d)return;const c=r.textContent?.trim()||"";if(!c)return void t.push(`Row ${s+1} has empty question text`);const l=a.textContent?.trim()||"";if(!l)return void t.push(`Row ${s+1} has empty answer`);const u=d.querySelector("ol");if(u){const e=(h=u,Array.from(h.querySelectorAll("li")).map(e=>e.textContent?.trim()||"").filter(e=>e.length>0));if(0===e.length)return void t.push(`Row ${s+1} MCQ has no options in <ol>`);n.push({text:c,kind:"mcq",correctAnswer:l,options:e})}else{const e=d.textContent?.trim()||"",o=parseFloat(e);if(isNaN(o))return void t.push(`Row ${s+1} appears to be numeric but has invalid tolerance: "${e}"`);n.push({text:c,kind:"numeric",correctAnswer:l,tolerance:o})}var h}),{element:e,questions:n,errors:t.length>0?t:void 0})}function d(e,t){if(!t||""===t.trim())return!1;const n=t.trim();if("mcq"===e.kind)return n===e.correctAnswer;{const t=parseFloat(n),s=parseFloat(e.correctAnswer);if(isNaN(t)||isNaN(s))return!1;const o=e.tolerance??0;return Math.abs(t-s)<=o}}const c=18e5,l={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},u=3,h=3e4;class SessionService{createSession(e,t,n){const o=new Date,r=o.toISOString(),a={serviceId:e,name:t,release:n,loginTime:r,lastActivity:r,expiresAt:new Date(o.getTime()+c).toISOString(),instructorUnlocked:!1};return this.saveSession(a),s(`Session created for ${e} (${t})`),this.emitEvent("qd:login",{serviceId:e,name:t,release:n,loginTime:r}),a}getSession(){try{const e=sessionStorage.getItem(l.SESSION);if(!e)return null;const t=JSON.parse(e);return t.serviceId&&t.release&&t.expiresAt?t:(r("Invalid session data, missing required fields"),null)}catch(e){return o("Failed to parse session data",e),null}}updateActivity(){const e=this.getSession();if(!e)return;const t=new Date;e.lastActivity=t.toISOString(),e.expiresAt=new Date(t.getTime()+c).toISOString(),this.saveSession(e)}isExpired(){const e=this.getSession();if(!e)return!0;return new Date>=new Date(e.expiresAt)}clearSession(){const e=this.getSession();sessionStorage.removeItem(l.SESSION),sessionStorage.removeItem(l.CACHE),sessionStorage.removeItem(l.INSTRUCTOR),sessionStorage.removeItem("qd/instructor/showAnswers"),e&&(s(`Session cleared for ${e.serviceId}`),this.emitEvent("qd:logout",{serviceId:e.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!0,e.unlockTime=(new Date).toISOString(),this.saveSession(e),s("Instructor mode unlocked"),this.emitEvent("qd:instructor-unlock",{timestamp:e.unlockTime}))}lockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!1,delete e.unlockTime,this.saveSession(e),s("Instructor mode locked"),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const e=this.getSession();return!0===e?.instructorUnlocked}getCache(){try{const e=sessionStorage.getItem(l.CACHE);return e?JSON.parse(e):null}catch(e){return o("Failed to parse cache data",e),null}}saveCache(e){try{sessionStorage.setItem(l.CACHE,JSON.stringify(e))}catch(t){o("Failed to save cache",t)}}clearCache(){sessionStorage.removeItem(l.CACHE)}saveSession(e){try{sessionStorage.setItem(l.SESSION,JSON.stringify(e))}catch(t){o("Failed to save session",t)}}emitEvent(e,t){try{const n=new CustomEvent(e,{detail:t,bubbles:!0});document.dispatchEvent(n)}catch(n){o(`Failed to emit event ${e}`,n)}}}function p(e,t){const n=t.answers.length,s=t.answers.filter(e=>""!==e.answer.trim()).length,o=t.answers.filter(e=>e.success).length;return{state:t.state,total:n,answered:s,correct:o,last:t.lastAttempted,answers:t.answers,analysis:t.analysis}}class Debouncer{constructor(){this.timers=new Map}debounce(e,t,n=200){const s=this.timers.get(e);void 0!==s&&clearTimeout(s);const o=setTimeout(()=>{this.timers.delete(e),t()},n);this.timers.set(e,o)}cancel(e){const t=this.timers.get(e);return void 0!==t&&(clearTimeout(t),this.timers.delete(e),!0)}cancelAll(){let e=0;for(const t of this.timers.values())clearTimeout(t),e++;return this.timers.clear(),e}isPending(e){return this.timers.has(e)}getPendingCount(){return this.timers.size}}function m(e){const t=e.querySelector("tbody");return t?Array.from(t.querySelectorAll("tr")):[]}function g(e){return Array.from(e.cells)}function f(e){return e&&e.textContent?.trim()||""}function b(e,t,n){return document.createElement(e)}function v(e,...t){e.classList.add(...t)}function y(e,...t){e.classList.remove(...t)}function w(e,t,n){const s=new CustomEvent(e,{detail:t,bubbles:!0,composed:!0,cancelable:!1});return document.dispatchEvent(s)}function x(e,t,n,s){const o=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0,cancelable:!1});return e.dispatchEvent(o)}function S(e){try{const t=sessionStorage.getItem(e);return t?JSON.parse(t):null}catch(t){return r(`Failed to parse JSON from sessionStorage key: ${e}`,t),null}}function E(e,t){try{const n=JSON.stringify(t);return sessionStorage.setItem(e,n),!0}catch(n){return r(`Failed to store JSON in sessionStorage key: ${e}`,n),!1}}function C(){const e=[];for(let t=0;t<sessionStorage.length;t++){const n=sessionStorage.key(t);n&&n.startsWith("qd/")&&e.push(n)}for(const t of e)sessionStorage.removeItem(t);return e.length}function $(e,t){return`qd/${e}/u${t}`}class StorageError extends Error{constructor(e,t,n){super(e),this.operation=t,this.cause=n,this.name="StorageError",n?o(`Storage error in ${t}: ${e}`,n):o(`Storage error in ${t}: ${e}`)}}class StorageNotInitializedError extends StorageError{constructor(e){super("Storage adapter not initialized. Call init() first.",e),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(e){super("Storage quota exceeded. Please clear old data or free up space.",e),this.name="StorageQuotaError"}}const A="BrowserTest",q="students",T="backups",_="auditLog";class IndexedDBStorageAdapter{constructor(e=A){this.db=null,this.initPromise=null,this.dbName=e}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=new Promise((e,t)=>{let n,s=!1;const a=()=>{n&&(clearTimeout(n),n=void 0)};n=window.setTimeout(()=>{if(s)return;s=!0,this.initPromise=null,r("IndexedDB open timed out after 5000ms - attempting recovery");const n=indexedDB.deleteDatabase(this.dbName);n.onsuccess=()=>{this.init().then(e).catch(t)},n.onerror=()=>{t(new StorageError(`Database "${this.dbName}" appears corrupted. Please clear site data in browser settings.`,"init"))},n.onblocked=()=>{t(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const d=indexedDB.open(this.dbName,3);d.onerror=()=>{s||(s=!0,a(),o(`IndexedDB open error: ${d.error?.message||"unknown"}`),this.initPromise=null,t(new StorageError("Failed to open database","init",d.error)))},d.onblocked=()=>{r("IndexedDB open blocked - close other tabs with this database")},d.onsuccess=()=>{if(!s){if(s=!0,a(),this.db=d.result,!this.db.objectStoreNames.contains(q)||!this.db.objectStoreNames.contains(T)||!this.db.objectStoreNames.contains(_)){r(`Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`),this.db.close(),this.db=null;const n=indexedDB.deleteDatabase(this.dbName);return n.onsuccess=()=>{this.initPromise=null,this.init().then(e).catch(t)},void(n.onerror=()=>{this.initPromise=null,t(new StorageError("Failed to delete corrupted database","init",n.error))})}this.initPromise=null,e()}},d.onupgradeneeded=e=>{const t=e.target.result,n=e.target.transaction;n&&(n.onerror=()=>{o(`Upgrade transaction error: ${n.error?.message||"unknown"}`)},n.onabort=()=>{o(`Upgrade transaction aborted: ${n.error?.message||"unknown"}`)});try{if(!t.objectStoreNames.contains(q)){const e=t.createObjectStore(q,{keyPath:null});e.createIndex("by-release","release",{unique:!1}),e.createIndex("by-service-id","serviceId",{unique:!1})}if(!t.objectStoreNames.contains(T)){const e=t.createObjectStore(T,{keyPath:null});e.createIndex("by-original-key","originalKey",{unique:!1}),e.createIndex("by-timestamp","timestamp",{unique:!1})}if(!t.objectStoreNames.contains(_)){const e=t.createObjectStore(_,{keyPath:"eventId"});e.createIndex("by-service-id","serviceId",{unique:!1}),e.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(s){throw o("Error during database upgrade",s),s}}}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(e,t){const n=this.ensureInitialized(),s=$(e,t);return new Promise((e,t)=>{try{const o=n.transaction(q,"readonly"),r=o.objectStore(q).get(s);r.onsuccess=()=>{e(r.result||null)},r.onerror=()=>{t(new StorageError("Failed to get student record","getStudent",r.error))}}catch(o){t(new StorageError("Failed to get student record","getStudent",o))}})}async saveStudent(e){const t=this.ensureInitialized(),n=$(e.release,e.serviceId);return new Promise((s,o)=>{try{const r=t.transaction(q,"readwrite"),a=r.objectStore(q).put(e,n);a.onsuccess=()=>{s()},a.onerror=()=>{"QuotaExceededError"===a.error?.name?o(new StorageQuotaError("saveStudent")):o(new StorageError("Failed to save student record","saveStudent",a.error))},r.onerror=()=>{o(new StorageError("Transaction failed while saving student","saveStudent",r.error))}}catch(r){o(new StorageError("Failed to save student record","saveStudent",r))}})}async getStudentsByRelease(e){const t=this.ensureInitialized();return new Promise((n,s)=>{try{const o=t.transaction(q,"readonly").objectStore(q),r=o.index("by-release").getAll(e);r.onsuccess=()=>{n(r.result||[])},r.onerror=()=>{s(new StorageError("Failed to get students by release","getStudentsByRelease",r.error))}}catch(o){s(new StorageError("Failed to get students by release","getStudentsByRelease",o))}})}async clearAll(){const e=this.ensureInitialized();return new Promise((t,n)=>{try{const s=e.transaction([q,T,_],"readwrite"),o=s.objectStore(q),r=s.objectStore(T),a=s.objectStore(_),d=o.clear(),c=r.clear(),l=a.clear();let u=!1,h=!1,p=!1;d.onsuccess=()=>{u=!0,h&&p&&t()},c.onsuccess=()=>{h=!0,u&&p&&t()},l.onsuccess=()=>{p=!0,u&&h&&t()},d.onerror=()=>{n(new StorageError("Failed to clear students","clearAll",d.error))},c.onerror=()=>{n(new StorageError("Failed to clear backups","clearAll",c.error))},l.onerror=()=>{n(new StorageError("Failed to clear audit log","clearAll",l.error))},s.onerror=()=>{n(new StorageError("Transaction failed during clearAll","clearAll",s.error))}}catch(s){n(new StorageError("Failed to clear all data","clearAll",s))}})}async backup(e){const t=this.ensureInitialized(),n=(new Date).toISOString(),s=`backup_${n}_${e.serviceId}`,o=$(e.release,e.serviceId),r={...e,originalKey:o,timestamp:n};return new Promise((e,n)=>{try{const o=t.transaction(T,"readwrite"),a=o.objectStore(T).put(r,s);a.onsuccess=()=>{e()},a.onerror=()=>{"QuotaExceededError"===a.error?.name?n(new StorageQuotaError("backup")):n(new StorageError("Failed to create backup","backup",a.error))},o.onerror=()=>{n(new StorageError("Transaction failed during backup","backup",o.error))}}catch(o){n(new StorageError("Failed to create backup","backup",o))}})}async saveAuditEvent(e){const t=this.ensureInitialized();return new Promise((n,s)=>{try{const o=t.transaction(_,"readwrite"),r=o.objectStore(_).add(e);r.onsuccess=()=>{n()},r.onerror=()=>{s(new StorageError("Failed to save audit event","saveAuditEvent",r.error))}}catch(o){s(new StorageError("Failed to save audit event","saveAuditEvent",o))}})}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let P=null,O=null;function D(e=A){return P&&O!==e&&(P.close(),P=null),P||(P=new IndexedDBStorageAdapter(e),O=e),P}function U(e,t){return 0===t||function(e){return 0===e.length}(e)?"unstarted":function(e,t){if(e.length!==t)return!1;return e.every(e=>!0===e.success)}(e,t)?"complete":"incomplete"}class StorageService{constructor(e="BrowserTest"){this.dbName=e,this.adapter=D(e)}async init(){try{await this.adapter.init(),s(`Storage service initialized (IndexedDB "${this.dbName}" ready)`)}catch(e){throw o("Failed to initialize storage service",e),e}}async loadStudentRecord(e){try{const t=await this.adapter.getStudent(e.release,e.serviceId);if(t)return s(`Loaded student record for ${e.serviceId} from IndexedDB`),t;const n={schema:1,docId:e.release,release:e.release,serviceId:e.serviceId,name:e.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}};return s(`Created new student record for ${e.serviceId}`),n}catch(t){r(`IndexedDB error, creating new record: ${t.message}`);return{schema:1,docId:e.release,release:e.release,serviceId:e.serviceId,name:e.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}}async saveStudentRecord(e){try{e.updated=(new Date).toISOString();let t=0,n=0;for(const s of Object.values(e.pages)){const e=s.answers.filter(e=>""!==e.answer.trim());t+=e.length,n+=e.filter(e=>e.success).length}e.attempted=t,e.correct=n,await this.adapter.saveStudent(e),s(`Saved student record for ${e.serviceId} to IndexedDB`)}catch(t){throw o("Failed to save student record",t),t}}updateRecordWithAnswer(e,t,n,s,o){const r=e.pages[t]||{answers:[],state:"unstarted"};for(;r.answers.length<=n;)r.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});r.answers[n]=s;const a=(new Date).toISOString();return r.firstAttempted||(r.firstAttempted=a),r.lastAttempted=a,r.state=U(r.answers,o),{...e,pages:{...e.pages,[t]:r}}}buildCache(e){return function(e){const t={totals:{total:0,answered:0,correct:0},pages:{}};for(const[n,s]of Object.entries(e.pages)){const e=p(0,s);t.pages[n]=e,t.totals.total+=e.total,t.totals.answered+=e.answered,t.totals.correct+=e.correct}return t}(e)}async getStudentsByRelease(e){try{return await this.adapter.getStudentsByRelease(e)}catch(t){throw o("Failed to get students by release",t),t}}async clearAll(){try{await this.adapter.clearAll(),s("Cleared all data from IndexedDB")}catch(e){throw o("Failed to clear all data",e),e}}async backup(e){try{await this.adapter.backup(e),s(`Created backup for ${e.serviceId}`)}catch(t){r(`Failed to create backup for ${e.serviceId}`,t)}}}let j=null,B=null;function F(e){if(j&&!e)return j;if(j&&e&&B!==e)return r(`Storage service already initialized with dbName="${B}", ignoring new dbName="${e}"`),j;if(!j){const t=e||"BrowserTest";j=new StorageService(t),B=t}return j}const V=Object.freeze(Object.defineProperty({__proto__:null,StorageService:StorageService,getStorageService:F},Symbol.toStringTag,{value:"Module"}));function Q(e){return function(e,t="display"){if(null==e)return console.warn("Invalid date provided to formatTimestamp:",e),"Invalid Date";const n="string"==typeof e?new Date(e):e;return isNaN(n.getTime())?(console.warn("Invalid date provided to formatTimestamp:",e),"Invalid Date"):"csv"===t?function(e){return e.toISOString()}(n):function(e){return`${e.toLocaleDateString("en-US",{month:"short"})} ${e.getDate()} ${e.getHours().toString().padStart(2,"0")}:${e.getMinutes().toString().padStart(2,"0")}`}(n)}(e,"display")}const W=new WeakMap;function J(e,t){const n=W.get(e);let c;if(n){if(n.interactive||!t.interactive)return s("Quiz table already enhanced, skipping"),!0;s("Upgrading quiz table from non-interactive to interactive mode"),c=n.parsed}else c=a(e),c.errors&&c.errors.length>0&&o("Quiz table has validation errors:",c.errors);const u={parsed:c,interactive:t.interactive,pageId:t.pageId};if(t.interactive){if(!t.pageId)return o("Interactive mode requires pageId option"),!1;s(`Preparing interactive enhancement for pageId: ${t.pageId}`),u.debouncer=new Debouncer,u.inputs=[]}if(W.set(e,u),t.interactive){const t=function(e,t){const{parsed:n,pageId:a,debouncer:c}=t;if(!a||!c)return o("Interactive mode requires pageId and debouncer"),!1;(function(e){const t=e.querySelectorAll("thead th, thead td");t[1]&&y(t[1],"qd-hidden");const n=e.querySelectorAll("tbody tr");n.forEach(e=>{const t=e.querySelectorAll("td");t[1]&&y(t[1],"qd-hidden")})})(e),Y(e);if(!S(l.SESSION))return o("No active session found"),!1;let u=S(l.CACHE);u?s(`Cache loaded: ${u.totals.total} total questions, ${Object.keys(u.pages).length} pages`):(s("No cache found, creating empty cache"),u={totals:{total:0,answered:0,correct:0},pages:{}});const h=n.questions.length;u=function(e,t,n){const s=e.pages[t];if(s&&s.total>=n)return e;const o=n-(s?.total||0),r={state:s?.state||"unstarted",total:n,answered:s?.answered||0,correct:s?.correct||0,last:s?.last,answers:s?.answers,analysis:s?.analysis};return{totals:{total:e.totals.total+o,answered:e.totals.answered,correct:e.totals.correct},pages:{...e.pages,[t]:r}}}(u,a,h),E(l.CACHE,u);const p=u?.pages[a],m=p?.answers||[];s(`Page ${a}: ${m.length} existing answers, state: ${p?.state||"none"}`);const g=e.querySelector("tbody");if(!g)return o("Quiz table has no tbody element"),!1;const f=Array.from(g.querySelectorAll("tr")),x=[];n.questions.forEach((n,a)=>{const c=f[a];if(!c)return;const u=Array.from(c.querySelectorAll("td"));if(3!==u.length)return;const h=u[0],p=u[1];if(!h||!p)return;const g=m[a];g&&g.answer&&s(`Q${a+1}: Pre-filling with "${g.answer}" (${g.success?"correct":"incorrect"})`);const v=function(e,t){if("mcq"===e.kind&&e.options){const n=b("select");n.className="qd-quiz-input";const s=b("option");return s.value="",s.textContent="Select an answer...",s.disabled=!0,n.appendChild(s),e.options.forEach((e,t)=>{const s=b("option");s.value=String(t+1),s.textContent=`${t+1}. ${e}`,n.appendChild(s)}),n.value=t?t.answer:"",n}{const e=b("input");return e.type="text",e.className="qd-quiz-input",e.placeholder="Enter value",t&&(e.value=t.answer),e}}(n,g);x.push(v),p.textContent="",p.appendChild(v),g&&K(p,g.success);const y="SELECT"===v.tagName?"change":"input";v.addEventListener(y,()=>{!function(e,t,n,a){const{debouncer:c,pageId:u,parsed:h}=t;if(!c||!u)return;const p=h.questions[n];if(!p)return;c.debounce(`save-answer-${n}`,()=>{!async function(e,t,n,a){const{pageId:c,parsed:u,inputs:h}=t;if(!c||!h)return;const p=u.questions[n];if(!p)return;const m=S(l.SESSION);if(!m)return void o("No active session found");const g=d(p,a),f={answer:a.trim(),success:g,timestamp:(new Date).toISOString()},b=F();let v;try{v=await b.loadStudentRecord(m)}catch(q){return void r("Failed to load student record, answer not saved",q)}const y=u.questions.length,x=b.updateRecordWithAnswer(v,c,n,f,y);try{await b.saveStudentRecord(x)}catch(q){r("Failed to save student record to IndexedDB",q)}const C=b.buildCache(x);E(l.CACHE,C);const $=e.querySelector(`tbody tr:nth-child(${n+1})`);if($){const e=$.querySelector("td:nth-child(2)");e&&K(e,g)}w("qd:answer-saved",{pageId:c,answer:f});const A=x.pages[c];A&&w("qd:state-changed",{pageId:c,state:A.state});s(`Answer saved for question ${n+1} on page ${c}: ${g?"correct":"incorrect"}`)}(e,t,n,a)},200)}(e,t,a,v.value)})}),t.inputs=x;const C=()=>{X(e,t)},$=()=>{ee(e)};document.addEventListener("qd:instructor-show-answers",C),document.addEventListener("qd:instructor-hide-answers",$);const A="true"===sessionStorage.getItem(l.INSTRUCTOR),q="true"===sessionStorage.getItem("qd/instructor/showAnswers");A&&q&&X(e,t);const T=()=>{e.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(e=>{y(e,"qd-answer-correct","qd-answer-incorrect")}),ee(e),s("Cleared student UI state from quiz table on logout")};return document.addEventListener("qd:logout",T),t.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",C),document.removeEventListener("qd:instructor-hide-answers",$),document.removeEventListener("qd:logout",T)},v(e,"qd-quiz-interactive"),s(`Quiz table enhanced in interactive mode for page ${a}`),!0}(e,u);return t?s(`Interactive enhancement succeeded for table with ${c.questions.length} questions`):o("Interactive enhancement failed"),t}return function(e){return function(e){const t=e.querySelector("colgroup");t&&t.remove()}(e),G(e),Y(e),v(e,"qd-quiz-non-interactive"),s("Quiz table enhanced in non-interactive mode"),!0}(e)}function K(e,t){y(e,"qd-answer-correct","qd-answer-incorrect"),v(e,t?"qd-answer-correct":"qd-answer-incorrect")}function G(e){const t=e.querySelectorAll("thead th, thead td");t[1]&&v(t[1],"qd-hidden");e.querySelectorAll("tbody tr").forEach(e=>{const t=e.querySelectorAll("td");t[1]&&(v(t[1],"qd-hidden"),t[1].textContent="")})}function Y(e){const t=e.querySelectorAll("thead th, thead td");t[2]&&v(t[2],"qd-hidden");e.querySelectorAll("tbody tr").forEach(e=>{const t=e.querySelectorAll("td");t[2]&&v(t[2],"qd-hidden")})}function Z(e){return W.get(e)}async function X(e,t){const{pageId:n,parsed:r}=t;if(!n)return;const a=S(l.SESSION);if(!a)return;const{getStorageService:d}=await Promise.resolve().then(()=>V),c=d();try{const t=await c.getStudentsByRelease(a.release);if(0===t.length)return s("No student data available for this release"),void alert("No student data available for this release. Students need to log in and answer questions first.");const o=e.querySelector("tbody");if(!o)return;const d=Array.from(o.querySelectorAll("tr"));r.questions.forEach((e,s)=>{const o=d[s];if(!o)return;const r=Array.from(o.querySelectorAll("td"))[1];if(!r)return;const a=r.querySelector(".qd-student-answers");a&&a.remove();const c=[];if(t.forEach(e=>{const t=e.pages[n];if(!t||!t.answers)return;const o=t.answers[s];o&&c.push({name:e.name,serviceId:e.serviceId,answer:o.answer,success:o.success,timestamp:o.timestamp})}),c.length>0){const e=document.createElement("div");e.className="qd-student-answers",c.forEach(t=>{const n=document.createElement("div");n.className="qd-student-answer "+(t.success?"qd-correct":"qd-incorrect");const s=t.serviceId.slice(-4),o=Q(t.timestamp);n.innerHTML=`\n            <span class="qd-student-name">${t.name} (${s})</span>:\n            <span class="qd-student-answer-text">${t.answer}</span>\n            <span class="qd-timestamp">${o}</span>\n          `,e.appendChild(n)}),r.appendChild(e)}}),s(`Displayed student answers for ${t.length} students on page ${n}`)}catch(u){o("Failed to load student answers",u)}}function ee(e){e.querySelectorAll(".qd-student-answers").forEach(e=>e.remove()),s("Hid student answers from quiz table")}function te(e,t=16){let n=5381;for(let o=0;o<e.length;o++){n=(n<<5)+n+e.charCodeAt(o),n&=n}const s=Math.abs(n).toString(16).padStart(8,"0");return s.repeat(Math.ceil(t/s.length)).substring(0,t)}function ne(e){const t=m(e),n=t[0],s=n?g(n).length:0,o=e.className||"qd-analysis";return te(`${t.length}x${s}:${o}`,16)}function se(e,t,n){return`R${e}C${t}#f:${te(n.replace(/\s+/g," ").trim(),8)}`}function oe(e){return e.classList.contains("interactive")}function re(e){const t=[];e.querySelector("tbody")||t.push("Analysis table must have a tbody element");const n=m(e);0===n.length&&t.push("Analysis table must have at least one row");const s=ne(e),o=[];return n.forEach((e,t)=>{g(e).forEach((e,n)=>{if(oe(e)){const s=f(e),r=se(t,n,s);o.push({row:t,col:n,key:r})}})}),{element:e,tableId:s,editableCells:o,errors:t.length>0?t:void 0}}const ie=new WeakMap;function ae(e,t){const n=re(e);n.errors&&n.errors.length>0&&o("Analysis table has validation errors:",n.errors);const a={parsed:n,interactive:t.interactive,pageId:t.pageId};if(t.interactive){if(!t.pageId)return o("Interactive mode requires pageId option"),!1;a.debouncer=new Debouncer,a.cellKeyMap=new Map}return ie.set(e,a),t.interactive?function(e,t){const{parsed:n,pageId:a,debouncer:d,cellKeyMap:c}=t;if(!a||!d||!c)return o("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!S(l.SESSION))return o("No active session found"),!1;const u=S(l.CACHE),h=u?.pages[a],p=h?.analysis,b=p?.cells||{},y=m(e);return n.editableCells.forEach(({row:e,col:n,key:a})=>{const d=y[e];if(!d)return;const u=g(d)[n];u&&(oe(u)?(c.set(u,a),b[a]&&(u.textContent=b[a]),u.contentEditable="true",v(u,"qd-editable"),u.addEventListener("input",()=>{!function(e,t,n){const{debouncer:a,pageId:d}=e;if(!a||!d)return;const c=f(t);a.debounce(`save-cell-${n}`,()=>{!async function(e,t,n){const{pageId:a,parsed:d}=e;if(!a)return;const c=S(l.SESSION);if(!c)return void o("No active session found");const u=F();let h;try{h=await u.loadStudentRecord(c)}catch(b){return void r("Failed to load student record, analysis not saved",b)}const p=h.pages[a]||{answers:[],state:"unstarted"},m=p.analysis||{tableId:d.tableId,cells:{}};m.cells[t]=n;const g=(new Date).toISOString();m.firstEdited||(m.firstEdited=g);m.lastEdited=g,p.analysis=m,h.pages[a]=p,h.updated=g;try{await u.saveStudentRecord(h)}catch(b){r("Failed to save student record to IndexedDB",b)}const f=u.buildCache(h);E(l.CACHE,f),w("qd:analysis-saved",{pageId:a,tableId:d.tableId,cellKey:t,content:n}),s(`Analysis cell saved for ${t} on page ${a}`)}(e,n,c)},500)}(t,u,a)})):o(`Cell at R${e}C${n} is no longer editable`))}),v(e,"qd-analysis-interactive"),s(`Analysis table enhanced in interactive mode for page ${a}`),!0}(e,a):function(e){v(e,"qd-analysis-non-interactive");const t=()=>{!async function(e){const t=ie.get(e);if(!t)return void r("Cannot show student entries: table not enhanced");const n=t.pageId||function(){const e=document.body.dataset.pageId;if(e)return e;const t=window.location.pathname,n=(t.split("/").pop()||"").replace(".html","");return n||void 0}();if(!n)return void r("Cannot show student entries: page ID not found");const a=S(l.SESSION);if(!a)return void r("Cannot show student entries: no active session");const d=F();let c;try{c=await d.getStudentsByRelease(a.release)}catch(f){return void o("Failed to load students for instructor view:",f)}const u=function(e,t){const n={};return e.forEach(e=>{const s=e.pages[t];if(!s||!s.analysis)return;const{cells:o}=s.analysis,r=s.analysis.lastEdited||e.updated;Object.entries(o).forEach(([t,s])=>{n[t]||(n[t]=[]),n[t].push({serviceId:e.serviceId,name:e.name,content:s,timestamp:r})})}),n}(c,n),{editableCells:h}=t.parsed,p=m(e);h.forEach(({row:e,col:t,key:n})=>{const s=p[e];if(!s)return;const o=g(s)[t];if(!o)return;const r=function(e){const t=document.createElement("div");if(t.className="qd-student-entries",0===e.length)return t.className+=" qd-no-entries",t.textContent="(No entries yet)",t.style.cssText="color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;",t;const n=function(e){return[...e].sort((e,t)=>{const n=new Date(e.timestamp).getTime();return new Date(t.timestamp).getTime()-n})}(e);return n.forEach(e=>{const n=document.createElement("div");n.className="qd-entry",n.style.cssText="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";const s=e.serviceId.slice(-4),o=Q(e.timestamp),r=document.createElement("span");r.style.cssText="font-weight: 600; color: #374151;",r.textContent=`${e.name} (${s}) • ${o}: `;const a=document.createElement("span");a.style.cssText="white-space: pre-wrap;",a.textContent=e.content,n.appendChild(r),n.appendChild(a),t.appendChild(n)}),t.style.cssText="margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;",t}(u[n]||[]);r.setAttribute("data-qd-student-entries","true");const a=o.querySelector("[data-qd-student-entries]");a&&a.remove(),o.appendChild(r)}),s(`Displayed student entries for ${h.length} cells`)}(e)},n=()=>{de(e)};return document.addEventListener("qd:instructor-show-answers",t),document.addEventListener("qd:instructor-hide-answers",n),s("Analysis table enhanced in non-interactive mode with instructor view support"),!0}(e)}function de(e){e.querySelectorAll("[data-qd-student-entries]").forEach(e=>e.remove()),s("Hidden student entries from analysis table")}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers(),s("Event coordinator initialized")}registerLoginHandlers(){this.addEventListener("qd:login",e=>{(async()=>{const t=e.detail;if(s(`Login event: ${t.serviceId} (${t.name})`),"INSTRUCTOR"===t.serviceId)return void s("Instructor login - skipping student record handling");const n=S(l.SESSION);if(!n)return void s("No session found in storage, skipping cache rebuild");const o=F();let r,a;try{r=await o.loadStudentRecord(n),await o.saveStudentRecord(r),a=o.buildCache(r),E(l.CACHE,a),s(`Cache built from IndexedDB: ${a.totals.total} total questions`)}catch{s("Failed to load from IndexedDB, initializing empty cache");E(l.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}this.dispatchEvent("qd:cache-rebuild",{}),this.upgradeTablesAfterLogin()})()})}upgradeTablesAfterLogin(){const e=window.location.pathname,t=e.substring(e.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!t)return void s("No pageId found, skipping table upgrade to interactive mode");if("true"===sessionStorage.getItem(l.INSTRUCTOR)){s("Instructor session detected, tables remain in non-interactive mode with answers visible");return void document.querySelectorAll("table.qd-quiz").forEach(e=>{const n=Z(e);if(!n)return;n.pageId=t;e.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(e=>{e.classList.remove("qd-hidden")});e.querySelectorAll("tbody td:nth-child(2)").forEach((e,t)=>{const s=n.parsed.questions[t];s&&e instanceof HTMLTableCellElement&&(e.textContent=s.correctAnswer)});e.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(e=>e.classList.remove("qd-hidden"));const s=()=>{X(e,n)};document.addEventListener("qd:instructor-show-answers",s),document.addEventListener("qd:instructor-hide-answers",()=>{ee(e)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&s()})}const n=document.querySelectorAll("table.qd-quiz");n.length>0&&(s(`Upgrading ${n.length} quiz table(s) to interactive mode...`),n.forEach(e=>{J(e,{interactive:!0,pageId:t})}));const o=document.querySelectorAll("table.qd-analysis");o.length>0&&(s(`Upgrading ${o.length} analysis table(s) to interactive mode...`),o.forEach(e=>{ae(e,{interactive:!0,pageId:t})}))}registerLogoutHandlers(){this.addEventListener("qd:logout",e=>{s(`Logout event: ${e.detail.serviceId}`);document.querySelectorAll("table.qd-quiz").forEach(e=>{!function(e){const t=W.get(e);t&&(t.interactive=!1,t.pageId=void 0,t.inputs=void 0,t.cleanupInstructorListeners?.(),t.cleanupInstructorListeners=void 0,G(e),Y(e),y(e,"qd-quiz-interactive"),s("Quiz table reset to non-interactive mode"))}(e)});document.querySelectorAll("table.qd-analysis").forEach(e=>{!function(e){const t=ie.get(e);t&&(de(e),t.interactive&&(e.querySelectorAll(".qd-editable").forEach(e=>{e instanceof HTMLTableCellElement&&(e.contentEditable="false",e.classList.remove("qd-editable"),e.textContent="")}),e.classList.remove("qd-analysis-interactive"),t.debouncer?.cancelAll()),t.interactive=!1,t.pageId=void 0,t.debouncer=void 0,t.cellKeyMap=void 0,s("Reset analysis table to non-interactive mode"))}(e)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",e=>{const t=e.detail;s(`Answer saved: ${t.pageId} Q${t.questionIndex} = ${t.answer} (${t.success?"correct":"incorrect"})`),this.dispatchEvent("qd:cache-update",{pageId:t.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",e=>{const t=e.detail;s(`State changed: ${t.pageId} → ${t.state}`),this.dispatchEvent("qd:badge-update",{pageId:t.pageId,state:t.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",e=>{s(`Instructor mode unlocked at ${e.detail.unlockTime}`)}),this.addEventListener("qd:instructor-lock",()=>{s("Instructor mode locked")})}registerDataHandlers(){this.addEventListener("qd:data-cleared",e=>{s(`All data cleared at ${e.detail.timestamp}`),this.dispatchEvent("qd:cache-clear",{})})}addEventListener(e,t){document.addEventListener(e,t);const n=this.listeners.get(e)||[];n.push(t),this.listeners.set(e,n)}dispatchEvent(e,t){const n=new CustomEvent(e,{detail:t,bubbles:!0,composed:!0});document.dispatchEvent(n)}cleanup(){for(const[e,t]of this.listeners)for(const n of t)document.removeEventListener(e,n);this.listeners.clear(),s("Event coordinator cleaned up")}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const e=this.sessionService.getSession();if(e){if(s(`Existing session loaded for ${e.serviceId}`),this.sessionService.isExpired())return r("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(e),this.setupActivityTracking()}else s("No existing session found")}scheduleExpiryCheck(e){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const t=(new Date).getTime(),n=new Date(e.expiresAt).getTime()-t;n<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{s("Session expired (timeout)"),this.sessionService.clearSession()},n)}setupActivityTracking(){const e=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const e=this.sessionService.getSession();e&&this.scheduleExpiryCheck(e)};let t;const n=()=>{void 0!==t&&window.clearTimeout(t),t=window.setTimeout(()=>{e()},5e3)};["click","keydown","scroll","mousemove"].forEach(e=>{document.addEventListener(e,n,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const ce=globalThis,le=ce.ShadowRoot&&(void 0===ce.ShadyCSS||ce.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ue=Symbol(),he=new WeakMap;let pe=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==ue)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(le&&void 0===e){const n=void 0!==t&&1===t.length;n&&(e=he.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&he.set(t,e))}return e}toString(){return this.cssText}};const me=(e,...t)=>{const n=1===e.length?e[0]:t.reduce((t,n,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+e[s+1],e[0]);return new pe(n,e,ue)},ge=le?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const n of e.cssRules)t+=n.cssText;return(e=>new pe("string"==typeof e?e:e+"",void 0,ue))(t)})(e):e,{is:fe,defineProperty:be,getOwnPropertyDescriptor:ve,getOwnPropertyNames:ye,getOwnPropertySymbols:we,getPrototypeOf:xe}=Object,Se=globalThis,Ee=Se.trustedTypes,Ce=Ee?Ee.emptyScript:"",Ie=Se.reactiveElementPolyfillSupport,$e=(e,t)=>e,Ae={toAttribute(e,t){switch(t){case Boolean:e=e?Ce:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=null!==e;break;case Number:n=null===e?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch(s){n=null}}return n}},ke=(e,t)=>!fe(e,t),qe={attribute:!0,type:String,converter:Ae,reflect:!1,useDefault:!1,hasChanged:ke};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),Se.litPropertyMetadata??=new WeakMap;let Te=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=qe){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const n=Symbol(),s=this.getPropertyDescriptor(e,n,t);void 0!==s&&be(this.prototype,e,s)}}static getPropertyDescriptor(e,t,n){const{get:s,set:o}=ve(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const r=s?.call(this);o?.call(this,t),this.requestUpdate(e,r,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??qe}static _$Ei(){if(this.hasOwnProperty($e("elementProperties")))return;const e=xe(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty($e("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($e("properties"))){const e=this.properties,t=[...ye(e),...we(e)];for(const n of t)this.createProperty(n,e[n])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(const[t,n]of this.elementProperties){const e=this._$Eu(t,n);void 0!==e&&this._$Eh.set(e,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const e of n)t.unshift(ge(e))}else void 0!==e&&t.push(ge(e));return t}static _$Eu(e,t){const n=t.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{if(le)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const n of t){const t=document.createElement("style"),s=ce.litNonce;void 0!==s&&t.setAttribute("nonce",s),t.textContent=n.cssText,e.appendChild(t)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){const n=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,n);if(void 0!==s&&!0===n.reflect){const o=(void 0!==n.converter?.toAttribute?n.converter:Ae).toAttribute(t,n.type);this._$Em=e,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(e,t){const n=this.constructor,s=n._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=n.getPropertyOptions(s),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:Ae;this._$Em=s;const r=o.fromAttribute(t,e.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(e,t,n){if(void 0!==e){const s=this.constructor,o=this[e];if(n??=s.getPropertyOptions(e),!((n.hasChanged??ke)(o,t)||n.useDefault&&n.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:s,wrapped:o},r){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==o||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,n]of e){const{wrapped:e}=n,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,n,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(n){throw e=!1,this._$EM(),n}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};Te.elementStyles=[],Te.shadowRootOptions={mode:"open"},Te[$e("elementProperties")]=new Map,Te[$e("finalized")]=new Map,Ie?.({ReactiveElement:Te}),(Se.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const _e=globalThis,Le=_e.trustedTypes,Ne=Le?Le.createPolicy("lit-html",{createHTML:e=>e}):void 0,ze="$lit$",Pe=`lit$${Math.random().toFixed(9).slice(2)}$`,Oe="?"+Pe,De=`<${Oe}>`,Me=document,Re=()=>Me.createComment(""),He=e=>null===e||"object"!=typeof e&&"function"!=typeof e,Ue=Array.isArray,je="[ \t\n\f\r]",Be=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Fe=/-->/g,Ve=/>/g,Qe=RegExp(`>|${je}(?:([^\\s"'>=/]+)(${je}*=${je}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),We=/'/g,Je=/"/g,Ke=/^(?:script|style|textarea|title)$/i,Ge=(tt=1,(e,...t)=>({_$litType$:tt,strings:e,values:t})),Ye=Symbol.for("lit-noChange"),Ze=Symbol.for("lit-nothing"),Xe=new WeakMap,et=Me.createTreeWalker(Me,129);var tt;function nt(e,t){if(!Ue(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==Ne?Ne.createHTML(t):t}class N{constructor({strings:e,_$litType$:t},n){let s;this.parts=[];let o=0,r=0;const a=e.length-1,d=this.parts,[c,l]=((e,t)=>{const n=e.length-1,s=[];let o,r=2===t?"<svg>":3===t?"<math>":"",a=Be;for(let d=0;d<n;d++){const t=e[d];let n,c,l=-1,u=0;for(;u<t.length&&(a.lastIndex=u,c=a.exec(t),null!==c);)u=a.lastIndex,a===Be?"!--"===c[1]?a=Fe:void 0!==c[1]?a=Ve:void 0!==c[2]?(Ke.test(c[2])&&(o=RegExp("</"+c[2],"g")),a=Qe):void 0!==c[3]&&(a=Qe):a===Qe?">"===c[0]?(a=o??Be,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,n=c[1],a=void 0===c[3]?Qe:'"'===c[3]?Je:We):a===Je||a===We?a=Qe:a===Fe||a===Ve?a=Be:(a=Qe,o=void 0);const h=a===Qe&&e[d+1].startsWith("/>")?" ":"";r+=a===Be?t+De:l>=0?(s.push(n),t.slice(0,l)+ze+t.slice(l)+Pe+h):t+Pe+(-2===l?d:h)}return[nt(e,r+(e[n]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]})(e,t);if(this.el=N.createElement(c,n),et.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=et.nextNode())&&d.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(ze)){const t=l[r++],n=s.getAttribute(e).split(Pe),a=/([.?@])?(.*)/.exec(t);d.push({type:1,index:o,name:a[2],strings:n,ctor:"."===a[1]?H:"?"===a[1]?I:"@"===a[1]?L:k}),s.removeAttribute(e)}else e.startsWith(Pe)&&(d.push({type:6,index:o}),s.removeAttribute(e));if(Ke.test(s.tagName)){const e=s.textContent.split(Pe),t=e.length-1;if(t>0){s.textContent=Le?Le.emptyScript:"";for(let n=0;n<t;n++)s.append(e[n],Re()),et.nextNode(),d.push({type:2,index:++o});s.append(e[t],Re())}}}else if(8===s.nodeType)if(s.data===Oe)d.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(Pe,e+1));)d.push({type:7,index:o}),e+=Pe.length-1}o++}}static createElement(e,t){const n=Me.createElement("template");return n.innerHTML=e,n}}function st(e,t,n=e,s){if(t===Ye)return t;let o=void 0!==s?n._$Co?.[s]:n._$Cl;const r=He(t)?void 0:t._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(e),o._$AT(e,n,s)),void 0!==s?(n._$Co??=[])[s]=o:n._$Cl=o),void 0!==o&&(t=st(e,o._$AS(e,t.values),o,s)),t}class M{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:n}=this._$AD,s=(e?.creationScope??Me).importNode(t,!0);et.currentNode=s;let o=et.nextNode(),r=0,a=0,d=n[0];for(;void 0!==d;){if(r===d.index){let t;2===d.type?t=new R(o,o.nextSibling,this,e):1===d.type?t=new d.ctor(o,d.name,d.strings,this,e):6===d.type&&(t=new z(o,this,e)),this._$AV.push(t),d=n[++a]}r!==d?.index&&(o=et.nextNode(),r++)}return et.currentNode=Me,s}p(e){let t=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,s){this.type=2,this._$AH=Ze,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=st(this,e,t),He(e)?e===Ze||null==e||""===e?(this._$AH!==Ze&&this._$AR(),this._$AH=Ze):e!==this._$AH&&e!==Ye&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>Ue(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Ze&&He(this._$AH)?this._$AA.nextSibling.data=e:this.T(Me.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:n}=e,s="number"==typeof n?this._$AC(e):(void 0===n.el&&(n.el=N.createElement(nt(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new M(s,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Xe.get(e.strings);return void 0===t&&Xe.set(e.strings,t=new N(e)),t}k(e){Ue(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,s=0;for(const o of e)s===t.length?t.push(n=new R(this.O(Re()),this.O(Re()),this,this.options)):n=t[s],n._$AI(o),s++;s<t.length&&(this._$AR(n&&n._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,s,o){this.type=1,this._$AH=Ze,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=Ze}_$AI(e,t=this,n,s){const o=this.strings;let r=!1;if(void 0===o)e=st(this,e,t,0),r=!He(e)||e!==this._$AH&&e!==Ye,r&&(this._$AH=e);else{const s=e;let a,d;for(e=o[0],a=0;a<o.length-1;a++)d=st(this,s[n+a],t,a),d===Ye&&(d=this._$AH[a]),r||=!He(d)||d!==this._$AH[a],d===Ze?e=Ze:e!==Ze&&(e+=(d??"")+o[a+1]),this._$AH[a]=d}r&&!s&&this.j(e)}j(e){e===Ze?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Ze?void 0:e}}class I extends k{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Ze)}}class L extends k{constructor(e,t,n,s,o){super(e,t,n,s,o),this.type=5}_$AI(e,t=this){if((e=st(this,e,t,0)??Ze)===Ye)return;const n=this._$AH,s=e===Ze&&n!==Ze||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,o=e!==Ze&&(n===Ze||s);s&&this.element.removeEventListener(this.name,this,n),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class z{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){st(this,e)}}const ot=_e.litHtmlPolyfillSupport;ot?.(N,R),(_e.litHtmlVersions??=[]).push("3.3.1");const rt=(e,t,n)=>{const s=n?.renderBefore??t;let o=s._$litPart$;if(void 0===o){const e=n?.renderBefore??null;s._$litPart$=o=new R(t.insertBefore(Re(),e),e,void 0,n??{})}return o._$AI(e),o},it=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class i extends Te{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=rt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ye}}i._$litElement$=!0,i.finalized=!0,it.litElementHydrateSupport?.({LitElement:i});const at=it.litElementPolyfillSupport;at?.({LitElement:i}),(it.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const dt=e=>(t,n)=>{void 0!==n?n.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},ct={attribute:!0,type:String,converter:Ae,reflect:!1,hasChanged:ke},lt=(e=ct,t,n)=>{const{kind:s,metadata:o}=n;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((e=Object.create(e)).wrapped=!0),r.set(n.name,e),"accessor"===s){const{name:s}=n;return{set(n){const o=t.get.call(this);t.set.call(this,n),this.requestUpdate(s,o,e)},init(t){return void 0!==t&&this.C(s,void 0,e,t),t}}}if("setter"===s){const{name:s}=n;return function(n){const o=this[s];t.call(this,n),this.requestUpdate(s,o,e)}}throw Error("Unsupported decorator location: "+s)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function ut(e){return(t,n)=>"object"==typeof n?lt(e,t,n):((e,t,n)=>{const s=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),s?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function ht(e){return ut({...e,state:!0,attribute:!1})}const pt=".wh_top_menu_and_indexterms_link",mt=".wh_publication_title .title",gt="",ft="BrowserTest",bt="qd-status-container",vt="qd-title-selector",yt="qd-instructor-hash",wt="qd-db-name";function xt(e,t){const n=document.querySelector(`#${e}`);if(!n)return t;const o=n.textContent?.trim()||"";return""===o?(r(`Config element #${e} found but empty, using default: "${t}"`),t):(s(`Config read from #${e}: "${o}"`),o)}async function St(e){const t=(new TextEncoder).encode(e),n=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,"0")).join("")}function Et(e){return`${l.PIN_ATTEMPTS}:${e}`}function Ct(e){const t=Et(e),n=sessionStorage.getItem(t);if(!n)return null;try{return JSON.parse(n)}catch{return null}}function It(e){const t=Ct(e);if(!t||!t.lockoutUntil)return{isLocked:!1,remainingMs:0};const n=new Date(t.lockoutUntil).getTime(),s=Date.now();return n>s?{isLocked:!0,remainingMs:n-s}:($t(e),{isLocked:!1,remainingMs:0})}function $t(e){const n=Ct(e);n&&n.attempts>0&&s(`Cleared ${n.attempts} failed PIN attempts for ${t(e)} on successful login`);const o=Et(e);sessionStorage.removeItem(o)}var At=Object.getOwnPropertyDescriptor;let kt=class extends i{render(){return Ge`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"24/Nov/2025"}</span>
      </div>
    `}};kt.styles=me`
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
  `,kt=((e,t,n,s)=>{for(var o,r=s>1?void 0:s?At(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=o(r)||r);return r})([dt("qd-build-info")],kt);var qt=Object.defineProperty,Tt=Object.getOwnPropertyDescriptor,_t=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?Tt(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&qt(t,n,r),r};let Lt=class extends i{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.instructorPassword="",this.showInstructorModal=!1,this.modalOverlay=null,this.modalErrorDiv=null,this.modalPasswordInput=null,this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutSeconds=0,this.lockoutInterval=null,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.instructorPassword="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.pin="",this.lockoutSeconds=0,this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null),this.cleanupModal(),this.updateVisibility()},this.handleEscape=e=>{"Escape"===e.key&&this.showInstructorModal&&this.closeInstructorModal()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("keydown",this.handleEscape),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.cleanupModal(),this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)}cleanupModal(){this.modalOverlay&&(this.modalOverlay.remove(),this.modalOverlay=null),this.modalErrorDiv=null,this.modalPasswordInput=null}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){S(l.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return Ge`
      <div class="login-container">
        <div class="title">${this.title} <qd-build-info></qd-build-info></div>

        <form class="login-form" @submit=${e=>this.handleStudentLogin(e)}>
          <input
            type="text"
            name="name"
            placeholder="Name (J Smith)"
            .value=${this.name}
            @input=${e=>this.handleNameInput(e)}
            ?disabled=${this.isSubmitting}
            required
          />

          <input
            type="text"
            name="serviceId"
            placeholder="Service ID (30012345)"
            .value=${this.serviceId}
            @input=${e=>this.handleServiceIdInput(e)}
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
            @input=${e=>this.handlePinInput(e)}
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

          ${this.errorMessage?Ge`<div class="error-message">${this.errorMessage}</div>`:""}
          ${this.lockoutSeconds>0?Ge`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
                Too many attempts. Try again in ${this.lockoutSeconds}s
              </div>`:""}
        </form>
      </div>
    `}renderInstructorModalToBody(){const e=document.createElement("div");e.className="qd-instructor-modal-overlay",e.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n      font-family: system-ui, -apple-system, sans-serif;\n    ";const t=document.createElement("div");t.className="qd-instructor-modal",t.style.cssText="\n      background: white;\n      border-radius: 8px;\n      padding: 24px;\n      min-width: 320px;\n      max-width: 400px;\n      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);\n      pointer-events: auto;\n      position: relative;\n      z-index: 100000;\n    ";const n=document.createElement("div");n.style.cssText="\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 20px;\n    ";const s=document.createElement("h3");s.textContent="Instructor Login",s.style.cssText="font-size: 18px; font-weight: 600; color: #333; margin: 0;";const o=document.createElement("button");o.textContent="×",o.type="button",o.style.cssText="\n      background: none;\n      border: none;\n      font-size: 24px;\n      color: #666;\n      cursor: pointer;\n      padding: 0;\n      width: 28px;\n      height: 28px;\n      line-height: 1;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",o.onclick=()=>this.closeInstructorModal(),n.appendChild(s),n.appendChild(o);const r=document.createElement("form"),a=document.createElement("div");a.style.marginBottom="20px";const d=document.createElement("input");d.id="qd-instructor-password",d.type="password",d.placeholder="Password",d.required=!0,d.style.cssText="\n      width: 100%;\n      box-sizing: border-box;\n      padding: 6px 10px;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n      font-size: 11px;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",d.oninput=e=>{this.instructorPassword=e.target.value,this.modalErrorDiv&&(this.modalErrorDiv.style.display="none",this.modalErrorDiv.textContent="")},a.appendChild(d),this.modalPasswordInput=d;const c=document.createElement("div");c.id="qd-instructor-modal-error",c.style.cssText="\n      color: #d32f2f;\n      font-size: 11px;\n      margin-top: 8px;\n      padding: 4px 8px;\n      background: #ffebee;\n      border-radius: 3px;\n      border-left: 3px solid #d32f2f;\n      display: none;\n    ",a.appendChild(c),this.modalErrorDiv=c;const l=document.createElement("div");l.style.cssText="display: flex; gap: 8px; justify-content: flex-end;";const u=document.createElement("button");u.textContent="Cancel",u.type="button",u.style.cssText="\n      background: #e0e0e0;\n      color: #333;\n      border: none;\n      border-radius: 4px;\n      font-size: 11px;\n      font-weight: 500;\n      cursor: pointer;\n      padding: 6px 12px;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",u.onclick=()=>this.closeInstructorModal();const h=document.createElement("button");h.id="qd-instructor-submit",h.textContent="Login",h.type="submit",h.style.cssText="\n      background: #0066cc;\n      color: white;\n      border: none;\n      border-radius: 4px;\n      font-size: 11px;\n      font-weight: 500;\n      cursor: pointer;\n      padding: 6px 12px;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",l.appendChild(u),l.appendChild(h),r.appendChild(a),r.appendChild(l),r.onsubmit=e=>{e.preventDefault(),this.handleInstructorLogin(e)},t.appendChild(n),t.appendChild(r),e.appendChild(t),e.onclick=t=>{t.target===e&&this.closeInstructorModal()},document.body.appendChild(e),this.modalOverlay=e,setTimeout(()=>d.focus(),50)}handleNameInput(e){const t=e.target;this.name=t.value,this.errorMessage=""}handleServiceIdInput(e){const t=e.target;this.serviceId=t.value,this.errorMessage=""}handlePinInput(e){const t=e.target;this.pin=t.value.replace(/\D/g,""),this.errorMessage=""}isValid(){const e=this.name.trim(),t=this.serviceId.trim();if(!e)return!1;return!!/^[A-Za-z0-9]{2,10}$/.test(t)&&4===this.pin.length}getRelease(){const e=document.getElementById(vt),t=e?.textContent?.trim()||".wh_publication_title .title",n=document.querySelector(t);return n?.textContent?.trim()||""}async handleStudentLogin(e){if(e.preventDefault(),this.isValid()){this.isSubmitting=!0,this.errorMessage="";try{const e=this.getRelease();if(!e)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const n=this.serviceId.trim(),o=this.name.trim(),a=It(n);if(a.isLocked)return this.startLockoutCountdown(a.remainingMs),void(this.isSubmitting=!1);const d=document.getElementById(wt);if(!d?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${wt}">dbName</span> to page.`);const c=D(d.textContent.trim());await c.init();const l=await c.getStudent(e,n);if(!l){const t=await St(this.pin),s={schema:2,docId:"",release:e,serviceId:n,name:o,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:t,pinCreatedAt:(new Date).toISOString()};return await c.saveStudent(s),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,o,e)}if(l.schema<2||!function(e){return Boolean(e.pinHash&&e.pinHash.length>0)}(l)){const t=function(e,t){return{...e,schema:2,pinHash:t,pinCreatedAt:(new Date).toISOString()}}(l,await St(this.pin));return await c.saveStudent(t),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,o,e)}if(!(await async function(e,t){return function(e,t){if(e.length!==t.length)return!1;let n=0;for(let s=0;s<e.length;s++)n|=e.charCodeAt(s)^t.charCodeAt(s);return 0===n}(await St(e),t)}(this.pin,l.pinHash||""))){const e=function(e){const n=(new Date).toISOString();let o=Ct(e);if(o||(o={serviceId:e,attempts:0,lockoutUntil:null,lastAttempt:n}),o.attempts+=1,o.lastAttempt=n,o.attempts>=u){const n=new Date(Date.now()+h);o.lockoutUntil=n.toISOString(),r(`PIN lockout triggered for ${t(e)} after ${o.attempts} failed attempts`)}else s(`Failed PIN attempt ${o.attempts}/${u} for ${t(e)}`);const a=Et(e);return sessionStorage.setItem(a,JSON.stringify(o)),o}(n),o=function(e){const t=Ct(e);return t?It(e).isLocked?0:Math.max(0,u-t.attempts):u}(n);if(e.lockoutUntil){const t=new Date(e.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(t)}else this.errorMessage=`Incorrect PIN. ${o} attempt${1!==o?"s":""} remaining`;return this.pin="",void(this.isSubmitting=!1)}$t(n),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}));this.completeLogin(n,o,e)}catch(n){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",n),this.isSubmitting=!1}}else this.errorMessage="Please enter name, service ID, and 4-digit PIN"}showPinStoredConfirmation(){const e=document.createElement("div");e.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n    ";const t=document.createElement("div");t.style.cssText="\n      background: white;\n      border-radius: 8px;\n      padding: 24px;\n      max-width: 320px;\n      text-align: center;\n      font-family: system-ui, -apple-system, sans-serif;\n    ",t.innerHTML='\n      <div style="font-size: 32px; margin-bottom: 12px;">✓</div>\n      <h3 style="margin: 0 0 8px 0; font-size: 16px;">PIN Stored</h3>\n      <p style="margin: 0 0 16px 0; font-size: 13px; color: #666;">\n        Your PIN has been saved. Use it with your name and service ID on future logins.\n      </p>\n      <button id="qd-pin-confirmation-ok" style="\n        background: #0066cc;\n        color: white;\n        border: none;\n        padding: 8px 24px;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 13px;\n      ">OK</button>\n    ';const n=t.querySelector("button");n?.addEventListener("click",()=>{document.body.removeChild(e)}),e.addEventListener("click",t=>{t.target===e&&document.body.removeChild(e)}),e.appendChild(t),document.body.appendChild(e),setTimeout(()=>{document.body.contains(e)&&document.body.removeChild(e)},3e4)}startLockoutCountdown(e){this.lockoutSeconds=Math.ceil(e/1e3),this.errorMessage="",this.lockoutInterval&&clearInterval(this.lockoutInterval),this.lockoutInterval=window.setInterval(()=>{this.lockoutSeconds--,this.lockoutSeconds<=0&&this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)},1e3)}completeLogin(e,t,n){(new SessionService).createSession(e,t,n);const s=new CustomEvent("qd:login",{detail:{serviceId:e,name:t,release:n,role:"student"},bubbles:!0,composed:!0});this.dispatchEvent(s),this.pin="",this.isSubmitting=!1,this.cleanupModal(),this.updateVisibility()}openInstructorModal(){this.showInstructorModal=!0,this.instructorPassword="",this.renderInstructorModalToBody()}closeInstructorModal(){this.showInstructorModal=!1,this.instructorPassword="",this.cleanupModal()}async hashPassword(e){const t=(new TextEncoder).encode(e),n=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){const e=document.getElementById(yt);return e?.textContent?.trim()||""}showModalError(e){this.modalErrorDiv&&(this.modalErrorDiv.textContent=e,this.modalErrorDiv.style.display="block")}async handleInstructorLogin(e){if(e.preventDefault(),this.instructorPassword)try{const e=await this.hashPassword(this.instructorPassword),t=this.getExpectedHash();if(!t)return void this.showModalError("Instructor password not configured");if(e!==t)return this.showModalError("Incorrect password"),this.instructorPassword="",void(this.modalPasswordInput&&(this.modalPasswordInput.value="",this.modalPasswordInput.focus()));const n=this.getRelease();(new SessionService).createSession("INSTRUCTOR","Instructor",n||""),sessionStorage.setItem(l.INSTRUCTOR,"true");const s=new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:n||"",role:"instructor"},bubbles:!0,composed:!0});this.dispatchEvent(s),this.closeInstructorModal(),this.updateVisibility()}catch(t){this.showModalError("Login failed. Please try again."),console.error("Instructor login error:",t)}else this.showModalError("Password is required")}};Lt.styles=me`
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

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001; /* Above storage monitor (10000) */
    }

    .modal {
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 28px;
      height: 28px;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      margin-bottom: 20px;
    }

    .modal-body input {
      width: 100%;
      box-sizing: border-box;
    }

    .modal-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .cancel-btn {
      background: #e0e0e0;
      color: #333;
    }

    .cancel-btn:hover {
      background: #d0d0d0;
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
  `,_t([ut({type:String})],Lt.prototype,"title",2),_t([ht()],Lt.prototype,"name",2),_t([ht()],Lt.prototype,"serviceId",2),_t([ht()],Lt.prototype,"instructorPassword",2),_t([ht()],Lt.prototype,"showInstructorModal",2),_t([ht()],Lt.prototype,"errorMessage",2),_t([ht()],Lt.prototype,"isSubmitting",2),_t([ht()],Lt.prototype,"pin",2),_t([ht()],Lt.prototype,"lockoutSeconds",2),Lt=_t([dt("qd-login")],Lt);var Nt=Object.defineProperty,zt=Object.getOwnPropertyDescriptor,Pt=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?zt(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&Nt(t,n,r),r};let Ot=class extends i{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent)}render(){const e=this.serviceId.slice(-4);return Ge`
      <div class="status-panel">
        <div class="top-row">
          <span class="user-info">
            <span class="user-label">Test progress:</span>
            ${this.name} **${e}
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
    `}loadCache(){const e=S(l.SESSION);e?(this.name=e.name||"",this.serviceId=e.serviceId||""):(this.name="",this.serviceId="");const t=S(l.CACHE);if(!t)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");this.total=t.totals.total,this.correct=t.totals.correct,this.percentage=this.calculatePercentage(t.totals.total,t.totals.correct),this.statusColor=this.calculateStatusColor(t.totals.total,t.totals.correct)}calculatePercentage(e,t){return 0===e?0:Math.round(t/e*100)}calculateStatusColor(e,t){return 0===e||0===t?"red":t===e?"green":"amber"}updateVisibility(){const e=S(l.SESSION),t="true"===sessionStorage.getItem(l.INSTRUCTOR);e&&!t?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const e=S(l.SESSION);(new SessionService).clearSession();const t=new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(t)}};Ot.styles=me`
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
  `,Pt([ht()],Ot.prototype,"total",2),Pt([ht()],Ot.prototype,"correct",2),Pt([ht()],Ot.prototype,"percentage",2),Pt([ht()],Ot.prototype,"statusColor",2),Pt([ht()],Ot.prototype,"name",2),Pt([ht()],Ot.prototype,"serviceId",2),Ot=Pt([dt("qd-status")],Ot);const Dt=me`
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
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const e=[2e3,4e3,8e3,16e3,3e4],t=e[Math.min(this.failureCount-1,e.length-1)]??3e4;this.lockoutUntil=Date.now()+t}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const e=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(e/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const Mt="instructor.password.hash";var Rt=Object.defineProperty,Ht=Object.getOwnPropertyDescriptor,Ut=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?Ht(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&Rt(t,n,r),r};let jt=class extends i{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=e=>{const t=e.target;this.password=t.value,this.error=""},this.handleSubmit=async e=>{e.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const e=function(){const e=document.getElementById(Mt);if(!e){const e=`Instructor password hash not found. Expected element with id="${Mt}". Check Oxygen XSL transform configuration.`;throw o(e),new Error(e)}const t=e.textContent?.trim();if(!t){const e="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw o(e),new Error(e)}if(!/^[a-f0-9]{64}$/i.test(t)){const e=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${t.substring(0,20)}...`;throw o(e),new Error(e)}return t.toLowerCase()}(),t=(new TextEncoder).encode(this.password),n=await crypto.subtle.digest("SHA-256",t),s=Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,"0")).join(""),r=await async function(e,t){if(e.length!==t.length)return!1;if(0===e.length)return!0;const n=new TextEncoder,s=n.encode(e),o=n.encode(t);try{const e=await crypto.subtle.importKey("raw",s,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),t=await crypto.subtle.sign("HMAC",e,o),n=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),r=await crypto.subtle.sign("HMAC",n,s);if(t.byteLength!==r.byteLength)return!1;const a=new Uint8Array(t),d=new Uint8Array(r);let c=0;for(let s=0;s<a.length;s++)c|=(a[s]??0)^(d[s]??0);return 0===c}catch(r){return console.error("Constant-time comparison failed:",r),!1}}(s,e);r?(this.rateLimiter.reset(),this.password="",this.error="",x(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const e=this.remainingSeconds>0;return Ge`
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
              ?disabled=${e}
              autocomplete="current-password"
              required
            />
          </div>

          ${this.error?Ge`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${e||!this.password}>
            ${e?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};jt.styles=Dt,Ut([ht()],jt.prototype,"password",2),Ut([ht()],jt.prototype,"error",2),Ut([ht()],jt.prototype,"remainingSeconds",2),jt=Ut([dt("qd-instructor-unlock")],jt);var Bt=Object.defineProperty,Ft=Object.getOwnPropertyDescriptor,Vt=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?Ft(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&Bt(t,n,r),r};let Qt=class extends i{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.expandedStudents=new Set,this.modalElement=null,this.handleEscape=e=>{"Escape"===e.key&&this.showModal&&this.handleClose()},this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(e){e.has("showModal")&&(this.showModal?(this.expandedStudents.clear(),this.students.forEach(e=>{this.expandedStudents.add(e.serviceId)}),this.renderModalToBody()):this.removeModalFromBody())}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}renderModalToBody(){this.removeModalFromBody();const e=document.createElement("div");e.className="qd-scores-modal-overlay",e.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n      font-family: system-ui, -apple-system, sans-serif;\n      pointer-events: auto;\n    ",e.onclick=t=>{t.target===e&&this.handleClose()};const t=document.createElement("div");t.className="qd-scores-modal",t.style.cssText="\n      background: white;\n      color: #333;\n      border-radius: 8px;\n      padding: 24px;\n      max-width: 800px;\n      max-height: 80vh;\n      overflow: auto;\n      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);\n      pointer-events: auto;\n      position: relative;\n      z-index: 100000;\n    ",t.onclick=e=>e.stopPropagation();const n=document.createElement("div");n.style.cssText="\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 16px;\n    ";const s=document.createElement("h2");s.textContent="Student Scores",s.style.cssText="font-size: 18px; font-weight: 600; color: #000; margin: 0;";const o=document.createElement("button");o.textContent="✕",o.type="button",o.style.cssText="\n      background: none;\n      border: none;\n      font-size: 20px;\n      color: #666;\n      cursor: pointer;\n      padding: 4px 8px;\n      pointer-events: auto;\n    ",o.onclick=()=>this.handleClose(),n.appendChild(s),n.appendChild(o);const r=document.createElement("div"),a=[...this.students].sort((e,t)=>e.name.localeCompare(t.name));if(0===a.length)r.innerHTML='<p style="color: #333;">No student data available.</p>';else{const e=this.createScoresTable(a);r.appendChild(e)}t.appendChild(n),t.appendChild(r),e.appendChild(t),document.body.appendChild(e),this.modalElement=e}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}toggleStudent(e){this.expandedStudents.has(e)?this.expandedStudents.delete(e):this.expandedStudents.add(e),this.showModal&&this.renderModalToBody()}createScoresTable(e){const t=document.createElement("table");t.style.cssText="\n      width: 100%;\n      border-collapse: collapse;\n      margin: 16px 0;\n    ";const n=document.createElement("thead");n.innerHTML='\n      <tr>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Student</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Service ID</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Attempted</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Correct</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Percentage</th>\n      </tr>\n    ',t.appendChild(n);const s=document.createElement("tbody");return e.forEach(e=>{const t=this.calculateSummary(e),n=this.expandedStudents.has(e.serviceId),o=document.createElement("tr");o.style.cssText="cursor: pointer; color: #333;";const r=document.createElement("td");r.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;",r.innerHTML=`<span style="display: inline-block; width: 16px; margin-right: 4px;">${n?"▼":"▶"}</span>${t.name}`,r.onclick=()=>this.toggleStudent(e.serviceId),o.appendChild(r);const a=document.createElement("td");a.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;",a.textContent=t.serviceId,a.onclick=()=>this.toggleStudent(e.serviceId),o.appendChild(a);const d=document.createElement("td");d.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;",d.textContent=String(t.attempted),d.onclick=()=>this.toggleStudent(e.serviceId),o.appendChild(d);const c=document.createElement("td");c.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; "+(t.correct===t.attempted?"color: #28a745;":""),c.textContent=String(t.correct),c.onclick=()=>this.toggleStudent(e.serviceId),o.appendChild(c);const l=document.createElement("td");if(l.style.cssText="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; "+(100===t.percentage?"color: #28a745;":0===t.percentage?"color: #dc3545;":""),l.textContent=`${t.percentage}%`,l.onclick=()=>this.toggleStudent(e.serviceId),o.appendChild(l),s.appendChild(o),n){const t=this.createExpandedRow(e);s.appendChild(t)}}),t.appendChild(s),t}createExpandedRow(e){const t=document.createElement("tr");t.style.backgroundColor="#f9f9f9";const n=document.createElement("td");n.colSpan=5,n.style.cssText="padding: 8px 8px 8px 40px; border-bottom: 1px solid #ddd;";const s=Object.entries(e.pages);if(0===s.length)n.innerHTML='<em style="color: #666;">No quiz pages attempted</em>';else{const e=document.createElement("div");e.style.cssText="display: flex; flex-direction: column; gap: 6px;",s.forEach(([t,n])=>{const s=document.createElement("div");s.style.cssText="display: flex; align-items: center; gap: 12px;";const o=document.createElement("span");o.style.cssText="font-weight: 600; color: #000; min-width: 120px; flex-shrink: 0;",o.textContent=t,s.appendChild(o);const r=document.createElement("div");r.style.cssText="display: flex; flex-wrap: wrap; gap: 4px; flex: 1;",n.answers.forEach((e,t)=>{const n=document.createElement("span");n.style.cssText=`\n            display: inline-block;\n            padding: 2px 6px;\n            border-radius: 3px;\n            font-size: 11px;\n            font-weight: 500;\n            ${null===e?"background: #e0e0e0; color: #666;":e.success?"background: #d4edda; color: #155724; border: 1px solid #c3e6cb;":"background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"}\n          `,n.textContent=`Q${t+1}: ${e?e.answer:"—"}`,r.appendChild(n)}),s.appendChild(r),e.appendChild(s)}),n.appendChild(e)}return t.appendChild(n),t}render(){return Ge``}};Qt.styles=Dt,Vt([ut({type:Array})],Qt.prototype,"students",2),Vt([ut({type:Boolean})],Qt.prototype,"showModal",2),Vt([ht()],Qt.prototype,"expandedStudents",2),Qt=Vt([dt("qd-instructor-scores")],Qt);var Wt=Object.defineProperty,Jt=Object.getOwnPropertyDescriptor,Kt=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?Jt(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&Wt(t,n,r),r};let Gt=class extends i{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const e=this.generateCSV(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n;const o=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);s.download=`quiz-data-${o}.csv`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)}}escapeCSVField(e){const t=String(e);return t.includes(",")||t.includes('"')||t.includes("\n")?`"${t.replace(/"/g,'""')}"`:t}generateCSV(){const e=[];e.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const t of this.students)for(const[n,s]of Object.entries(t.pages)){(s.answers||[]).forEach((s,o)=>{s&&e.push([this.escapeCSVField(t.serviceId),this.escapeCSVField(t.name),this.escapeCSVField(t.release),this.escapeCSVField(n),this.escapeCSVField(o),this.escapeCSVField(s.answer),this.escapeCSVField(s.success),this.escapeCSVField(s.timestamp)].join(","))})}return e.join("\n")}render(){const e=this.students.length>0&&this.students.some(e=>e.attempted>0),t=e?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return Ge`
      <button
        @click=${this.handleExport}
        ?disabled=${!e}
        class="primary compact"
        title=${t}
      >
        Export CSV
      </button>
    `}};Gt.styles=Dt,Kt([ut({type:Array})],Gt.prototype,"students",2),Gt=Kt([dt("qd-instructor-export")],Gt);var Yt=Object.defineProperty,Zt=Object.getOwnPropertyDescriptor,Xt=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?Zt(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&Yt(t,n,r),r};let en=class extends i{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=e=>{const t=e.target;this.confirmText=t.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{C(),x(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(e){super.updated(e),e.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(e.has("confirmText")||e.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),rt(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return Ge`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?Ge`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const e="DELETE ALL DATA"===this.confirmText;return Ge`
      <div
        class="qd-manage-modal-overlay"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;"
        @click=${e=>{e.target===e.currentTarget&&this.handleCancelClear()}}
      >
        <div
          style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);"
          @click=${e=>e.stopPropagation()}
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

          ${this.error?Ge`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button
              style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer; font-size: 14px;"
              @click=${this.handleCancelClear}
            >
              Cancel
            </button>
            <button
              style="padding: 8px 16px; border: none; border-radius: 4px; background: ${e?"#dc3545":"#ccc"}; color: white; cursor: ${e?"pointer":"not-allowed"}; font-size: 14px;"
              @click=${this.handleConfirmClear}
              ?disabled=${!e}
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};en.styles=Dt,Xt([ht()],en.prototype,"showConfirmDialog",2),Xt([ht()],en.prototype,"confirmText",2),Xt([ht()],en.prototype,"error",2),Xt([ht()],en.prototype,"success",2),en=Xt([dt("qd-instructor-manage")],en);var tn=Object.defineProperty,nn=Object.getOwnPropertyDescriptor,sn=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?nn(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&tn(t,n,r),r};let on=class extends i{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.searchText="",this.confirmingStudent=null,this.modalElement=null,this.handleEscape=e=>{"Escape"===e.key&&this.showModal&&(this.confirmingStudent?this.confirmingStudent=null:this.handleClose())},this.handleClose=()=>{this.confirmingStudent=null,this.searchText="",this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(e){e.has("showModal")&&(this.showModal?this.renderModalToBody():this.removeModalFromBody())}get filteredStudents(){if(!this.searchText.trim())return this.students;const e=this.searchText.toLowerCase().trim();return this.students.filter(t=>t.name.toLowerCase().includes(e)||t.serviceId.toLowerCase().includes(e))}renderModalToBody(){this.removeModalFromBody();const e=document.createElement("div");e.className="qd-pin-reset-overlay",e.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n      font-family: system-ui, -apple-system, sans-serif;\n    ";const t=document.createElement("div");t.style.cssText="\n      background: white;\n      border-radius: 8px;\n      padding: 24px;\n      min-width: 400px;\n      max-width: 500px;\n      max-height: 80vh;\n      overflow: hidden;\n      display: flex;\n      flex-direction: column;\n      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);\n    ";const n=document.createElement("div");n.style.cssText="\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 16px;\n    ";const s=document.createElement("h3");s.textContent="Reset Student PIN",s.style.cssText="font-size: 18px; font-weight: 600; margin: 0;";const o=document.createElement("button");o.textContent="×",o.type="button",o.style.cssText="\n      background: none;\n      border: none;\n      font-size: 24px;\n      cursor: pointer;\n      color: #666;\n    ",o.onclick=()=>this.handleClose(),n.appendChild(s),n.appendChild(o);const r=document.createElement("input");r.type="text",r.placeholder="Search by name or ID...",r.style.cssText="\n      width: 100%;\n      box-sizing: border-box;\n      padding: 8px 12px;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n      margin-bottom: 12px;\n      font-size: 12px;\n    ",r.oninput=e=>{this.searchText=e.target.value,this.updateStudentList(t)};const a=document.createElement("div");a.className="student-list",a.style.cssText="\n      flex: 1;\n      overflow-y: auto;\n      max-height: 300px;\n      border: 1px solid #e0e0e0;\n      border-radius: 4px;\n    ",t.appendChild(n),t.appendChild(r),t.appendChild(a);const d=document.createElement("div");d.className="error-message",d.style.cssText="\n      display: none;\n      color: #d32f2f;\n      font-size: 11px;\n      margin-top: 8px;\n      padding: 8px;\n      background: #ffebee;\n      border-radius: 4px;\n    ",t.appendChild(d),e.appendChild(t),e.onclick=t=>{t.target===e&&this.handleClose()},document.body.appendChild(e),this.modalElement=e,this.updateStudentList(t),r.focus()}updateStudentList(e){const t=e.querySelector(".student-list");if(!t)return;t.innerHTML="";const n=this.filteredStudents;if(0===n.length){const e=document.createElement("div");return e.textContent=this.searchText?"No matching students":"No students found",e.style.cssText="padding: 16px; text-align: center; color: #666; font-size: 12px;",void t.appendChild(e)}n.forEach(n=>{const s=document.createElement("div");s.style.cssText="\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        padding: 8px 12px;\n        border-bottom: 1px solid #f0f0f0;\n      ";const o=document.createElement("div"),r=document.createElement("div");r.textContent=n.name,r.style.cssText="font-size: 12px; font-weight: 500;";const a=document.createElement("div");a.textContent=`ID: ${n.serviceId}`,a.style.cssText="font-size: 10px; color: #666;";const d=document.createElement("div"),c=n.pinHash&&n.pinHash.length>0;d.textContent=c?"PIN set":"No PIN",d.style.cssText=`font-size: 10px; color: ${c?"#4caf50":"#ff9800"};`,o.appendChild(r),o.appendChild(a),o.appendChild(d);const l=document.createElement("button");l.textContent="Reset PIN",l.type="button",l.style.cssText="\n        background: #ff5722;\n        color: white;\n        border: none;\n        border-radius: 4px;\n        padding: 4px 8px;\n        font-size: 10px;\n        cursor: pointer;\n      ",l.onclick=()=>this.showConfirmation(n,e),s.appendChild(o),s.appendChild(l),t.appendChild(s)})}showConfirmation(e,t){this.confirmingStudent=e;const n=document.createElement("div");n.className="confirm-overlay",n.style.cssText="\n      position: absolute;\n      top: 0;\n      left: 0;\n      right: 0;\n      bottom: 0;\n      background: rgba(255, 255, 255, 0.95);\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      padding: 24px;\n    ";const s=document.createElement("p");s.innerHTML=`Reset PIN for <strong>${e.name}</strong> (${e.serviceId})?`,s.style.cssText="margin: 0 0 16px; text-align: center; font-size: 14px;";const o=document.createElement("p");o.textContent="They will need to create a new PIN on next login.",o.style.cssText="margin: 0 0 16px; text-align: center; font-size: 11px; color: #666;";const r=document.createElement("div");r.style.cssText="display: flex; gap: 8px;";const a=document.createElement("button");a.textContent="Cancel",a.type="button",a.style.cssText="\n      background: #e0e0e0;\n      color: #333;\n      border: none;\n      border-radius: 4px;\n      padding: 8px 16px;\n      font-size: 12px;\n      cursor: pointer;\n    ",a.onclick=()=>{this.confirmingStudent=null,n.remove()};const d=document.createElement("button");d.textContent="Reset PIN",d.type="button",d.style.cssText="\n      background: #ff5722;\n      color: white;\n      border: none;\n      border-radius: 4px;\n      padding: 8px 16px;\n      font-size: 12px;\n      cursor: pointer;\n    ",d.onclick=()=>this.executeReset(e,n,t),r.appendChild(a),r.appendChild(d),n.appendChild(s),n.appendChild(o),n.appendChild(r);const c=t.querySelector("div:first-child")?.parentElement||t;c.style.position="relative",c.appendChild(n)}async executeReset(e,t,n){try{const o=document.getElementById(wt);if(!o?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${wt}">dbName</span> to page.`);const r=D(o.textContent.trim());await r.init();const a=(s=e,{...s,pinHash:"",pinResetAt:(new Date).toISOString()});await r.saveStudent(a);const d={eventId:crypto.randomUUID(),serviceId:e.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:e.release};await r.saveAuditEvent(d);const c=this.students.findIndex(t=>t.serviceId===e.serviceId);c>=0&&(this.students[c]=a,this.students=[...this.students]),this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:e.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.confirmingStudent=null,t.remove(),this.updateStudentList(n)}catch(o){console.error("PIN reset error:",o);const e=n.querySelector(".error-message");e&&(e.textContent="Failed to reset PIN. Please try again.",e.style.display="block")}var s}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}render(){return Ge``}};on.styles=me`
    :host {
      display: block;
    }
  `,sn([ut({type:Array})],on.prototype,"students",2),sn([ut({type:Boolean})],on.prototype,"showModal",2),sn([ht()],on.prototype,"searchText",2),sn([ht()],on.prototype,"confirmingStudent",2),on=sn([dt("qd-pin-reset-dialog")],on);var rn=Object.defineProperty,an=Object.getOwnPropertyDescriptor,dn=(e,t,n,s)=>{for(var o,r=s>1?void 0:s?an(t,n):t,a=e.length-1;a>=0;a--)(o=e[a])&&(r=(s?o(t,n,r):o(r))||r);return s&&r&&rn(t,n,r),r};let cn=class extends i{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.handleLoginEvent=e=>{const t=e,n=t.detail?.role;this.updateVisibility(),"instructor"===n&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{const e=S(l.SESSION);if(e){try{const{getStorageService:t}=await Promise.resolve().then(()=>V),n=t(),s=await n.getStudentsByRelease(e.release);this.students=s}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showPinReset=!0}},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const e=S(l.SESSION);if(e){try{const{getStorageService:t}=await Promise.resolve().then(()=>V),n=t(),s=await n.getStudentsByRelease(e.release);this.students=s}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const e=S(l.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async e=>{const t=e.target;if(this.showStudentAnswers=t.checked,this.showStudentAnswers&&0===this.students.length){const e=S(l.SESSION);if(e)try{const{getStorageService:t}=await Promise.resolve().then(()=>V),n=t(),s=await n.getStudentsByRelease(e.release);this.students=s}catch(s){console.error("Failed to load students for toggle:",s)}}const n=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(n,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const e="true"===sessionStorage.getItem(l.INSTRUCTOR);e&&this.unlock();const t=sessionStorage.getItem("qd/instructor/showAnswers");null!==t&&(this.showStudentAnswers="true"===t,this.showStudentAnswers&&e&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){"true"===sessionStorage.getItem(l.INSTRUCTOR)?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(e){this.students=e}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?Ge`
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
    `:Ge`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};cn.styles=[Dt,me`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],dn([ht()],cn.prototype,"unlocked",2),dn([ht()],cn.prototype,"showScores",2),dn([ht()],cn.prototype,"students",2),dn([ht()],cn.prototype,"showStudentAnswers",2),dn([ht()],cn.prototype,"showPinReset",2),cn=dn([dt("qd-instructor")],cn);const ln={statusPanel:".wh_top_menu_and_indexterms_link"};function un(e={}){const t=e.statusPanelContainer||ln.statusPanel;!function(e){const t=document.querySelector(e);if(!t)return s(`Login component not injected: container '${e}' not found`),null;const n=document.createElement("qd-login");t.appendChild(n),s("Login component injected")}(t),function(e){const t=document.querySelector(e);if(!t)return s(`Status component not injected: container '${e}' not found`),null;const n=document.createElement("qd-status");t.appendChild(n),s("Status component injected")}(t),function(e){const t=document.querySelector(e);if(!t)return s(`Instructor component not injected: container '${e}' not found`),null;const n=document.createElement("qd-instructor");t.appendChild(n),s("Instructor component injected")}(t)}const hn={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},pn={unstarted:"red",incomplete:"amber",complete:"green"};function mn(e){const t=function(e,t){if(!e||!t?.pages)return"unstarted";const n=t.pages[e];return n?.state??"unstarted"}(e.getAttribute("data-page-id"),S(l.CACHE));!function(e,t){Object.values(hn).forEach(t=>{e.classList.remove(t)});const n=hn[pn[t]];e.classList.add(n)}(e,t)}function gn(){const e=document.querySelectorAll(".quizPageBtn"),t=S(l.CACHE),n="true"===sessionStorage.getItem(l.INSTRUCTOR);if(!t||n)return e.forEach(e=>{Object.values(hn).forEach(t=>{e.classList.remove(t)})}),void s(n?`Removed badge styling from ${e.length} page links (instructor mode)`:`Removed badge styling from ${e.length} page links (no session)`);e.forEach(e=>{mn(e)}),s(`Updated ${e.length} page badges`)}function fn(e){const t=e,{pageId:n}=t.detail,o=document.querySelector(`[data-page-id="${n}"]`);o&&o.classList.contains("quizPageBtn")&&(mn(o),s(`Updated badge for page ${n}`))}function bn(){s("Cache rebuilt, refreshing all badges"),gn()}function vn(){s("Logout detected, removing all badge styling");const e=document.querySelectorAll(".quizPageBtn");e.forEach(e=>{Object.values(hn).forEach(t=>{e.classList.remove(t)})}),s(`Removed badge styling from ${e.length} page links`)}const yn={initialized:!1};async function wn(e={}){if(yn.initialized)return void r("Bootstrap already initialized, skipping");s("Bootstrapping Sonar Quiz System..."),function(){if(document.getElementById("qd-global-styles"))return;const e=document.createElement("style");e.id="qd-global-styles",e.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: 1rem;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor mode: Student answers display */\n    .qd-student-answers {\n      margin-top: 12px;\n      padding: 8px;\n      background: #f8f9fa;\n      border-radius: 4px;\n      border: 1px solid #dee2e6;\n    }\n\n    .qd-student-answer {\n      font-size: 12px;\n      padding: 4px 0;\n      line-height: 1.4;\n    }\n\n    .qd-student-answer.qd-correct {\n      color: #28a745;\n    }\n\n    .qd-student-answer.qd-incorrect {\n      color: #dc3545;\n    }\n\n    .qd-student-name {\n      font-weight: 600;\n    }\n\n    .qd-student-answer-text {\n      margin: 0 4px;\n    }\n\n    .qd-timestamp {\n      color: #6c757d;\n      font-size: 11px;\n      margin-left: 8px;\n    }\n  ",document.head.appendChild(e),s("Global styles injected")}();const t=F(e.dbName||"BrowserTest");await t.init();const n=new EventCoordinator;n.initialize(),yn.eventCoordinator=n;const o=new SessionCoordinator;o.initialize(),yn.sessionCoordinator=o,un({statusPanelContainer:e.statusPanelContainer,dbName:e.dbName}),!1!==e.autoEnhanceQuizTables&&function(){const e=document.querySelectorAll("table.qd-quiz");if(0===e.length)return void s("No quiz tables found to enhance");s(`Enhancing ${e.length} quiz table(s) in non-interactive mode...`);let t=0;for(const s of Array.from(e))try{J(s,{interactive:!1}),t++}catch(n){r(`Failed to enhance quiz table: ${n.message}`)}s(`Enhanced ${t} of ${e.length} quiz table(s) (non-interactive)`)}(),!1!==e.autoEnhanceAnalysisTables&&function(){const e=document.querySelectorAll("table.qd-analysis");if(0===e.length)return void s("No analysis tables found to enhance");s(`Enhancing ${e.length} analysis table(s) in non-interactive mode...`);let t=0;for(const s of Array.from(e))try{ae(s,{interactive:!1}),t++}catch(n){r(`Failed to enhance analysis table: ${n.message}`)}s(`Enhanced ${t} of ${e.length} analysis table(s) (non-interactive)`)}(),!1!==e.autoEnhanceHomeBadges&&function(){const e=document.querySelectorAll(".quizPageBtn");if(0===e.length)return void s("No .quizPageBtn links found, skipping badge enhancement");s(`Enhancing home page badges for ${e.length} link(s)...`);try{document.querySelectorAll(".quizPageBtn").forEach(e=>{const t=function(e){const t=e.getAttribute("href");return t&&t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(e);t?(e.setAttribute("data-page-id",t),s(`Set data-page-id="${t}" for link: ${e.textContent?.trim()}`)):s(`Failed to extract pageId from href: ${e.getAttribute("href")}`)}),gn(),document.addEventListener("qd:state-changed",fn),document.addEventListener("qd:cache-rebuild",bn),document.addEventListener("qd:logout",vn),s("Home page badges enhanced with event listeners"),s("Home page badges enhanced")}catch(t){r(`Failed to enhance home badges: ${t.message}`)}}(),await async function(){const e=S(l.SESSION);if(!e)return void s("No existing session, tables remain in non-interactive mode");if("true"===sessionStorage.getItem(l.INSTRUCTOR)){s("Instructor session detected, revealing answers in non-interactive tables");const e=window.location.pathname,t=e.substring(e.lastIndexOf("/")+1).replace(/\.html?$/i,"");return void document.querySelectorAll("table.qd-quiz").forEach(e=>{const n=Z(e);if(!n)return;n.pageId=t;e.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(e=>{e.classList.remove("qd-hidden")});e.querySelectorAll("tbody td:nth-child(2)").forEach((e,t)=>{const s=n.parsed.questions[t];s&&e instanceof HTMLTableCellElement&&(e.textContent=s.correctAnswer)});e.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(e=>e.classList.remove("qd-hidden"));const s=()=>{X(e,n)},o=()=>{ee(e)};document.addEventListener("qd:instructor-show-answers",s),document.addEventListener("qd:instructor-hide-answers",o);"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&s()})}s(`Existing session detected for ${e.serviceId}, upgrading tables to interactive mode`);const t=F();let n=S(l.CACHE);if(!n){s("Cache not found, rebuilding from IndexedDB...");try{const o=await t.loadStudentRecord(e);n=t.buildCache(o),E(l.CACHE,n),s(`Cache rebuilt from IndexedDB: ${n.totals.total} total questions`)}catch{r("Failed to rebuild cache from IndexedDB, using empty cache"),n={totals:{total:0,answered:0,correct:0},pages:{}},E(l.CACHE,n)}}const o=window.location.pathname,a=o.substring(o.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!a)return void s("No pageId found, skipping table upgrade");const d=document.querySelectorAll("table.qd-quiz");d.length>0&&(s(`Upgrading ${d.length} quiz table(s) to interactive mode...`),d.forEach(e=>{J(e,{interactive:!0,pageId:a})}));const c=document.querySelectorAll("table.qd-analysis");c.length>0&&(s(`Upgrading ${c.length} analysis table(s) to interactive mode...`),c.forEach(e=>{ae(e,{interactive:!0,pageId:a})}))}(),yn.initialized=!0,s("Bootstrap complete")}if("undefined"!=typeof window){const e=()=>{s("Auto-initializing Sonar Quiz System");const e=function(){s("Reading configuration from DOM...");const e={statusPanelContainer:xt(bt,pt),titleSelector:xt(vt,mt),instructorHash:xt(yt,gt),dbName:xt(wt,ft)};return s("Configuration loaded:",e),e}();wn({dbName:e.dbName,statusPanelContainer:e.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(e=>{console.error("[FATAL] Bootstrap failed:",e)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{e()}):e()}return e.BUILD_DATE="24/Nov/2025",e.DEFAULT_CONTAINERS=ln,e.Debouncer=Debouncer,e.SCHEMA_VERSION=2,e.SESSION_TIMEOUT_MS=c,e.STORAGE_KEYS=l,e.VERSION="0.1.0-phase3.1",e.bootstrap=wn,e.calculateCompletionState=U,e.cleanup=function(){yn.initialized?(s("Cleaning up bootstrap resources..."),yn.eventCoordinator?.cleanup(),yn.sessionCoordinator?.cleanup(),yn.initialized=!1,yn.eventCoordinator=void 0,yn.sessionCoordinator=void 0,s("Bootstrap cleanup complete")):r("Bootstrap not initialized, nothing to cleanup")},e.clearQuizData=C,e.enhanceAnalysisTable=ae,e.enhanceQuizTable=J,e.error=o,e.generateCellKey=se,e.generateTableId=ne,e.getAnalysisTableMetadata=function(e){return ie.get(e)},e.getJSON=S,e.getQuizTableMetadata=Z,e.info=s,e.injectComponents=un,e.isAnalysisTableEnhanced=function(e){return ie.has(e)},e.isCellEditable=oe,e.isInitialized=function(){return yn.initialized},e.isQuizTableEnhanced=function(e){return W.has(e)},e.parseAnalysisTable=re,e.parseQuizTable=a,e.setJSON=E,e.validateAnswer=d,e.warn=r,Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),e}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
