var SonarQuiz=function(e){"use strict";function t(e){if(e.length<2)return"**";if(2===e.length)return e;return e.slice(0,2)+"*".repeat(e.length-2)}function n(e){if(null===e||"object"!=typeof e)return e;const s={};for(const[r,o]of Object.entries(e))"name"!==r&&"passwordHash"!==r&&(s[r]="serviceId"!==r||"string"!=typeof o?"object"!=typeof o||null===o?o:n(o):t(o));return s}function s(e,t){void 0!==t?console.log(`[INFO] ${e}`,n(t)):console.log(`[INFO] ${e}`)}function r(e,t){if(t instanceof Error){const n={name:t.name,message:t.message};console.error(`[ERROR] ${e}`,n)}else void 0!==t?console.error(`[ERROR] ${e}`,n(t)):console.error(`[ERROR] ${e}`)}function o(e,t){void 0!==t?console.warn(`[WARN] ${e}`,n(t)):console.warn(`[WARN] ${e}`)}function a(e){const t=[],n=[];if(!e.classList.contains("qd-quiz"))return t.push('Table must have class "qd-quiz"'),{element:e,questions:n,errors:t};const s=Array.from(e.querySelectorAll("tbody tr"));return 0===s.length?(t.push("Quiz table has no data rows"),{element:e,questions:n,errors:t}):(s.forEach((e,s)=>{const r=Array.from(e.querySelectorAll("td"));if(3!==r.length)return void t.push(`Row ${s+1} has ${r.length} columns, expected 3 (Question | Answer | Detail)`);const o=r[0],a=r[1],d=r[2];if(!o||!a||!d)return;const c=o.textContent?.trim()||"";if(!c)return void t.push(`Row ${s+1} has empty question text`);const l=a.textContent?.trim()||"";if(!l)return void t.push(`Row ${s+1} has empty answer`);const u=d.querySelector("ol");if(u){const e=(h=u,Array.from(h.querySelectorAll("li")).map(e=>e.textContent?.trim()||"").filter(e=>e.length>0));if(0===e.length)return void t.push(`Row ${s+1} MCQ has no options in <ol>`);n.push({text:c,kind:"mcq",correctAnswer:l,options:e})}else{const e=d.textContent?.trim()||"",r=parseFloat(e);if(isNaN(r))return void t.push(`Row ${s+1} appears to be numeric but has invalid tolerance: "${e}"`);n.push({text:c,kind:"numeric",correctAnswer:l,tolerance:r})}var h}),{element:e,questions:n,errors:t.length>0?t:void 0})}function d(e,t){if(!t||""===t.trim())return!1;const n=t.trim();if("mcq"===e.kind)return n===e.correctAnswer;{const t=parseFloat(n),s=parseFloat(e.correctAnswer);if(isNaN(t)||isNaN(s))return!1;const r=e.tolerance??0;return Math.abs(t-s)<=r}}const c=18e5,l={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor"};class SessionService{createSession(e,t,n){const r=new Date,o=r.toISOString(),a={serviceId:e,name:t,release:n,loginTime:o,lastActivity:o,expiresAt:new Date(r.getTime()+c).toISOString(),instructorUnlocked:!1};return this.saveSession(a),s(`Session created for ${e} (${t})`),this.emitEvent("qd:login",{serviceId:e,name:t,release:n,loginTime:o}),a}getSession(){try{const e=sessionStorage.getItem(l.SESSION);if(!e)return null;const t=JSON.parse(e);return t.serviceId&&t.release&&t.expiresAt?t:(o("Invalid session data, missing required fields"),null)}catch(e){return r("Failed to parse session data",e),null}}updateActivity(){const e=this.getSession();if(!e)return;const t=new Date;e.lastActivity=t.toISOString(),e.expiresAt=new Date(t.getTime()+c).toISOString(),this.saveSession(e)}isExpired(){const e=this.getSession();if(!e)return!0;return new Date>=new Date(e.expiresAt)}clearSession(){const e=this.getSession();sessionStorage.removeItem(l.SESSION),sessionStorage.removeItem(l.CACHE),sessionStorage.removeItem(l.INSTRUCTOR),sessionStorage.removeItem("qd/instructor/showAnswers"),e&&(s(`Session cleared for ${e.serviceId}`),this.emitEvent("qd:logout",{serviceId:e.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!0,e.unlockTime=(new Date).toISOString(),this.saveSession(e),s("Instructor mode unlocked"),this.emitEvent("qd:instructor-unlock",{timestamp:e.unlockTime}))}lockInstructor(){const e=this.getSession();e&&(e.instructorUnlocked=!1,delete e.unlockTime,this.saveSession(e),s("Instructor mode locked"),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const e=this.getSession();return!0===e?.instructorUnlocked}getCache(){try{const e=sessionStorage.getItem(l.CACHE);return e?JSON.parse(e):null}catch(e){return r("Failed to parse cache data",e),null}}saveCache(e){try{sessionStorage.setItem(l.CACHE,JSON.stringify(e))}catch(t){r("Failed to save cache",t)}}clearCache(){sessionStorage.removeItem(l.CACHE)}saveSession(e){try{sessionStorage.setItem(l.SESSION,JSON.stringify(e))}catch(t){r("Failed to save session",t)}}emitEvent(e,t){try{const n=new CustomEvent(e,{detail:t});window.dispatchEvent(n)}catch(n){r(`Failed to emit event ${e}`,n)}}}function u(e,t){const n=t.answers.length,s=t.answers.filter(e=>""!==e.answer.trim()).length,r=t.answers.filter(e=>e.success).length;return{state:t.state,total:n,answered:s,correct:r,last:t.lastAttempted,answers:t.answers,analysis:t.analysis}}class Debouncer{constructor(){this.timers=new Map}debounce(e,t,n=200){const s=this.timers.get(e);void 0!==s&&clearTimeout(s);const r=setTimeout(()=>{this.timers.delete(e),t()},n);this.timers.set(e,r)}cancel(e){const t=this.timers.get(e);return void 0!==t&&(clearTimeout(t),this.timers.delete(e),!0)}cancelAll(){let e=0;for(const t of this.timers.values())clearTimeout(t),e++;return this.timers.clear(),e}isPending(e){return this.timers.has(e)}getPendingCount(){return this.timers.size}}function h(e){const t=e.querySelector("tbody");return t?Array.from(t.querySelectorAll("tr")):[]}function p(e){return Array.from(e.cells)}function g(e){return e&&e.textContent?.trim()||""}function m(e,t,n){return document.createElement(e)}function f(e,...t){e.classList.add(...t)}function b(e,...t){e.classList.remove(...t)}function v(e,t,n){const s=new CustomEvent(e,{detail:t,bubbles:!0,composed:!0,cancelable:!1});return document.dispatchEvent(s)}function y(e,t,n,s){const r=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0,cancelable:!1});return e.dispatchEvent(r)}function w(e){try{const t=sessionStorage.getItem(e);return t?JSON.parse(t):null}catch(t){return o(`Failed to parse JSON from sessionStorage key: ${e}`,t),null}}function S(e,t){try{const n=JSON.stringify(t);return sessionStorage.setItem(e,n),!0}catch(n){return o(`Failed to store JSON in sessionStorage key: ${e}`,n),!1}}function x(){const e=[];for(let t=0;t<sessionStorage.length;t++){const n=sessionStorage.key(t);n&&n.startsWith("qd/")&&e.push(n)}for(const t of e)sessionStorage.removeItem(t);return e.length}function E(e,t){return`qd/${e}/u${t}`}class StorageError extends Error{constructor(e,t,n){super(e),this.operation=t,this.cause=n,this.name="StorageError",n?r(`Storage error in ${t}: ${e}`,n):r(`Storage error in ${t}: ${e}`)}}class StorageNotInitializedError extends StorageError{constructor(e){super("Storage adapter not initialized. Call init() first.",e),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(e){super("Storage quota exceeded. Please clear old data or free up space.",e),this.name="StorageQuotaError"}}const $="BrowserTest",C="students",A="backups";class IndexedDBStorageAdapter{constructor(e=$){this.db=null,this.initPromise=null,this.dbName=e}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=new Promise((e,t)=>{const n=indexedDB.open(this.dbName,2);n.onerror=()=>{this.initPromise=null,t(new StorageError("Failed to open database","init",n.error))},n.onsuccess=()=>{if(this.db=n.result,s(`IndexedDB opened: ${this.dbName} v${this.db.version}, stores: [${Array.from(this.db.objectStoreNames).join(", ")}]`),!this.db.objectStoreNames.contains(C)||!this.db.objectStoreNames.contains(A)){o(`Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`),this.db.close(),this.db=null;const n=indexedDB.deleteDatabase(this.dbName);return n.onsuccess=()=>{o("Corrupted database deleted, retrying init..."),this.initPromise=null,this.init().then(e).catch(t)},void(n.onerror=()=>{this.initPromise=null,t(new StorageError("Failed to delete corrupted database","init",n.error))})}this.initPromise=null,e()},n.onupgradeneeded=e=>{const t=e,n=e.target.result;s(`IndexedDB upgrade: ${this.dbName} v${t.oldVersion} → v${t.newVersion}`);try{if(n.objectStoreNames.contains(C))s("Students store already exists, skipping");else{s("Creating students object store...");const e=n.createObjectStore(C,{keyPath:null});e.createIndex("by-release","release",{unique:!1}),e.createIndex("by-service-id","serviceId",{unique:!1}),s("Students store created with indexes")}if(n.objectStoreNames.contains(A))s("Backups store already exists, skipping");else{s("Creating backups object store...");const e=n.createObjectStore(A,{keyPath:null});e.createIndex("by-original-key","originalKey",{unique:!1}),e.createIndex("by-timestamp","timestamp",{unique:!1}),s("Backups store created with indexes")}s(`Upgrade complete. Stores: [${Array.from(n.objectStoreNames).join(", ")}]`)}catch(o){throw r("Error during database upgrade",o),o}},n.onblocked=()=>{o("IndexedDB upgrade blocked by another connection")}}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(e,t){const n=this.ensureInitialized(),s=E(e,t);return new Promise((e,t)=>{try{const r=n.transaction(C,"readonly"),o=r.objectStore(C).get(s);o.onsuccess=()=>{e(o.result||null)},o.onerror=()=>{t(new StorageError("Failed to get student record","getStudent",o.error))}}catch(r){t(new StorageError("Failed to get student record","getStudent",r))}})}async saveStudent(e){const t=this.ensureInitialized(),n=E(e.release,e.serviceId);return new Promise((s,r)=>{try{const o=t.transaction(C,"readwrite"),a=o.objectStore(C).put(e,n);a.onsuccess=()=>{s()},a.onerror=()=>{"QuotaExceededError"===a.error?.name?r(new StorageQuotaError("saveStudent")):r(new StorageError("Failed to save student record","saveStudent",a.error))},o.onerror=()=>{r(new StorageError("Transaction failed while saving student","saveStudent",o.error))}}catch(o){r(new StorageError("Failed to save student record","saveStudent",o))}})}async getStudentsByRelease(e){const t=this.ensureInitialized();return new Promise((n,s)=>{try{const r=t.transaction(C,"readonly").objectStore(C),o=r.index("by-release").getAll(e);o.onsuccess=()=>{n(o.result||[])},o.onerror=()=>{s(new StorageError("Failed to get students by release","getStudentsByRelease",o.error))}}catch(r){s(new StorageError("Failed to get students by release","getStudentsByRelease",r))}})}async clearAll(){const e=this.ensureInitialized();return new Promise((t,n)=>{try{const s=e.transaction([C,A],"readwrite"),r=s.objectStore(C),o=s.objectStore(A),a=r.clear(),d=o.clear();let c=!1,l=!1;a.onsuccess=()=>{c=!0,l&&t()},d.onsuccess=()=>{l=!0,c&&t()},a.onerror=()=>{n(new StorageError("Failed to clear students","clearAll",a.error))},d.onerror=()=>{n(new StorageError("Failed to clear backups","clearAll",d.error))},s.onerror=()=>{n(new StorageError("Transaction failed during clearAll","clearAll",s.error))}}catch(s){n(new StorageError("Failed to clear all data","clearAll",s))}})}async backup(e){const t=this.ensureInitialized(),n=(new Date).toISOString(),s=`backup_${n}_${e.serviceId}`,r=E(e.release,e.serviceId),o={...e,originalKey:r,timestamp:n};return new Promise((e,n)=>{try{const r=t.transaction(A,"readwrite"),a=r.objectStore(A).put(o,s);a.onsuccess=()=>{e()},a.onerror=()=>{"QuotaExceededError"===a.error?.name?n(new StorageQuotaError("backup")):n(new StorageError("Failed to create backup","backup",a.error))},r.onerror=()=>{n(new StorageError("Transaction failed during backup","backup",r.error))}}catch(r){n(new StorageError("Failed to create backup","backup",r))}})}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let q=null,_=null;function T(e,t){return 0===t||function(e){return 0===e.length}(e)?"unstarted":function(e,t){if(e.length!==t)return!1;return e.every(e=>!0===e.success)}(e,t)?"complete":"incomplete"}class StorageService{constructor(e="BrowserTest"){this.dbName=e,this.adapter=function(e=$){return q&&_!==e&&(q.close(),q=null),q||(q=new IndexedDBStorageAdapter(e),_=e),q}(e)}async init(){try{await this.adapter.init(),s(`Storage service initialized (IndexedDB "${this.dbName}" ready)`)}catch(e){throw r("Failed to initialize storage service",e),e}}async loadStudentRecord(e){try{const t=await this.adapter.getStudent(e.release,e.serviceId);if(t)return s(`Loaded student record for ${e.serviceId} from IndexedDB`),t;const n={schema:1,docId:e.release,release:e.release,serviceId:e.serviceId,name:e.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}};return s(`Created new student record for ${e.serviceId}`),n}catch(t){o(`IndexedDB error, creating new record: ${t.message}`);return{schema:1,docId:e.release,release:e.release,serviceId:e.serviceId,name:e.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}}async saveStudentRecord(e){try{e.updated=(new Date).toISOString();let t=0,n=0;for(const s of Object.values(e.pages)){const e=s.answers.filter(e=>""!==e.answer.trim());t+=e.length,n+=e.filter(e=>e.success).length}e.attempted=t,e.correct=n,await this.adapter.saveStudent(e),s(`Saved student record for ${e.serviceId} to IndexedDB`)}catch(t){throw r("Failed to save student record",t),t}}updateRecordWithAnswer(e,t,n,s,r){const o=e.pages[t]||{answers:[],state:"unstarted"};for(;o.answers.length<=n;)o.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});o.answers[n]=s;const a=(new Date).toISOString();return o.firstAttempted||(o.firstAttempted=a),o.lastAttempted=a,o.state=T(o.answers,r),{...e,pages:{...e.pages,[t]:o}}}buildCache(e){return function(e){const t={totals:{total:0,answered:0,correct:0},pages:{}};for(const[n,s]of Object.entries(e.pages)){const e=u(0,s);t.pages[n]=e,t.totals.total+=e.total,t.totals.answered+=e.answered,t.totals.correct+=e.correct}return t}(e)}async getStudentsByRelease(e){try{return await this.adapter.getStudentsByRelease(e)}catch(t){throw r("Failed to get students by release",t),t}}async clearAll(){try{await this.adapter.clearAll(),s("Cleared all data from IndexedDB")}catch(e){throw r("Failed to clear all data",e),e}}async backup(e){try{await this.adapter.backup(e),s(`Created backup for ${e.serviceId}`)}catch(t){o(`Failed to create backup for ${e.serviceId}`,t)}}}let O=null,D=null;function P(e){if(O&&!e)return O;if(O&&e&&D!==e)return o(`Storage service already initialized with dbName="${D}", ignoring new dbName="${e}"`),O;if(!O){const t=e||"BrowserTest";O=new StorageService(t),D=t}return O}const j=Object.freeze(Object.defineProperty({__proto__:null,StorageService:StorageService,getStorageService:P},Symbol.toStringTag,{value:"Module"}));function U(e){return function(e,t="display"){const n="string"==typeof e?new Date(e):e;return isNaN(n.getTime())?(console.warn("Invalid date provided to formatTimestamp:",e),"Invalid Date"):"csv"===t?function(e){return e.toISOString()}(n):function(e){return`${e.toLocaleDateString("en-US",{month:"short"})} ${e.getDate()} ${e.getHours().toString().padStart(2,"0")}:${e.getMinutes().toString().padStart(2,"0")}`}(n)}(e,"display")}const B=new WeakMap;function F(e,t){const n=B.get(e);let c;if(n){if(n.interactive||!t.interactive)return s("Quiz table already enhanced, skipping"),!0;s("Upgrading quiz table from non-interactive to interactive mode"),c=n.parsed}else c=a(e),c.errors&&c.errors.length>0&&r("Quiz table has validation errors:",c.errors);const u={parsed:c,interactive:t.interactive,pageId:t.pageId};if(t.interactive){if(!t.pageId)return r("Interactive mode requires pageId option"),!1;s(`Preparing interactive enhancement for pageId: ${t.pageId}`),u.debouncer=new Debouncer,u.inputs=[]}if(B.set(e,u),t.interactive){const t=function(e,t){const{parsed:n,pageId:a,debouncer:c}=t;if(!a||!c)return r("Interactive mode requires pageId and debouncer"),!1;(function(e){const t=e.querySelectorAll("thead th, thead td");t[1]&&b(t[1],"qd-hidden");const n=e.querySelectorAll("tbody tr");n.forEach(e=>{const t=e.querySelectorAll("td");t[1]&&b(t[1],"qd-hidden")})})(e),K(e);if(!w(l.SESSION))return r("No active session found"),!1;let u=w(l.CACHE);u?s(`Cache loaded: ${u.totals.total} total questions, ${Object.keys(u.pages).length} pages`):(s("No cache found, creating empty cache"),u={totals:{total:0,answered:0,correct:0},pages:{}});const h=n.questions.length;u=function(e,t,n){const s=e.pages[t];if(s&&s.total>=n)return e;const r=n-(s?.total||0),o={state:s?.state||"unstarted",total:n,answered:s?.answered||0,correct:s?.correct||0,last:s?.last,answers:s?.answers,analysis:s?.analysis};return{totals:{total:e.totals.total+r,answered:e.totals.answered,correct:e.totals.correct},pages:{...e.pages,[t]:o}}}(u,a,h),S(l.CACHE,u);const p=u?.pages[a],g=p?.answers||[];s(`Page ${a}: ${g.length} existing answers, state: ${p?.state||"none"}`);const y=e.querySelector("tbody");if(!y)return r("Quiz table has no tbody element"),!1;const x=Array.from(y.querySelectorAll("tr")),E=[];n.questions.forEach((n,a)=>{const c=x[a];if(!c)return;const u=Array.from(c.querySelectorAll("td"));if(3!==u.length)return;const h=u[0],p=u[1];if(!h||!p)return;const f=g[a];f&&f.answer&&s(`Q${a+1}: Pre-filling with "${f.answer}" (${f.success?"correct":"incorrect"})`);const b=function(e,t){if("mcq"===e.kind&&e.options){const n=m("select");n.className="qd-quiz-input";const s=m("option");return s.value="",s.textContent="Select an answer...",s.disabled=!0,n.appendChild(s),e.options.forEach((e,t)=>{const s=m("option");s.value=String(t+1),s.textContent=`${t+1}. ${e}`,n.appendChild(s)}),n.value=t?t.answer:"",n}{const e=m("input");return e.type="text",e.className="qd-quiz-input",e.placeholder="Enter value",t&&(e.value=t.answer),e}}(n,f);E.push(b),p.textContent="",p.appendChild(b),f&&V(p,f.success);const y="SELECT"===b.tagName?"change":"input";b.addEventListener(y,()=>{!function(e,t,n,a){const{debouncer:c,pageId:u,parsed:h}=t;if(!c||!u)return;const p=h.questions[n];if(!p)return;c.debounce(`save-answer-${n}`,()=>{!async function(e,t,n,a){const{pageId:c,parsed:u,inputs:h}=t;if(!c||!h)return;const p=u.questions[n];if(!p)return;const g=w(l.SESSION);if(!g)return void r("No active session found");const m=d(p,a),f={answer:a.trim(),success:m,timestamp:(new Date).toISOString()},b=P();let y;try{y=await b.loadStudentRecord(g)}catch(q){return void o("Failed to load student record, answer not saved",q)}const x=u.questions.length,E=b.updateRecordWithAnswer(y,c,n,f,x);try{await b.saveStudentRecord(E)}catch(q){o("Failed to save student record to IndexedDB",q)}const $=b.buildCache(E);S(l.CACHE,$);const C=e.querySelector(`tbody tr:nth-child(${n+1})`);if(C){const e=C.querySelector("td:nth-child(2)");e&&V(e,m)}v("qd:answer-saved",{pageId:c,answer:f});const A=E.pages[c];A&&v("qd:state-changed",{pageId:c,state:A.state});s(`Answer saved for question ${n+1} on page ${c}: ${m?"correct":"incorrect"}`)}(e,t,n,a)},200)}(e,t,a,b.value)})}),t.inputs=E;const $=()=>{J(e,t)},C=()=>{G(e)};document.addEventListener("qd:instructor-show-answers",$),document.addEventListener("qd:instructor-hide-answers",C);const A="true"===sessionStorage.getItem(l.INSTRUCTOR),q="true"===sessionStorage.getItem("qd/instructor/showAnswers");A&&q&&J(e,t);const _=()=>{e.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(e=>{b(e,"qd-answer-correct","qd-answer-incorrect")}),G(e),s("Cleared student UI state from quiz table on logout")};return document.addEventListener("qd:logout",_),t.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",$),document.removeEventListener("qd:instructor-hide-answers",C),document.removeEventListener("qd:logout",_)},f(e,"qd-quiz-interactive"),s(`Quiz table enhanced in interactive mode for page ${a}`),!0}(e,u);return t?s(`Interactive enhancement succeeded for table with ${c.questions.length} questions`):r("Interactive enhancement failed"),t}return function(e){return function(e){const t=e.querySelector("colgroup");t&&t.remove()}(e),Q(e),K(e),f(e,"qd-quiz-non-interactive"),s("Quiz table enhanced in non-interactive mode"),!0}(e)}function V(e,t){b(e,"qd-answer-correct","qd-answer-incorrect"),f(e,t?"qd-answer-correct":"qd-answer-incorrect")}function Q(e){const t=e.querySelectorAll("thead th, thead td");t[1]&&f(t[1],"qd-hidden");e.querySelectorAll("tbody tr").forEach(e=>{const t=e.querySelectorAll("td");t[1]&&(f(t[1],"qd-hidden"),t[1].textContent="")})}function K(e){const t=e.querySelectorAll("thead th, thead td");t[2]&&f(t[2],"qd-hidden");e.querySelectorAll("tbody tr").forEach(e=>{const t=e.querySelectorAll("td");t[2]&&f(t[2],"qd-hidden")})}function W(e){return B.get(e)}async function J(e,t){const{pageId:n,parsed:o}=t;if(!n)return;const a=w(l.SESSION);if(!a)return;const{getStorageService:d}=await Promise.resolve().then(()=>j),c=d();try{const t=await c.getStudentsByRelease(a.release);if(0===t.length)return s("No student data available for this release"),void alert("No student data available for this release. Students need to log in and answer questions first.");const r=e.querySelector("tbody");if(!r)return;const d=Array.from(r.querySelectorAll("tr"));o.questions.forEach((e,s)=>{const r=d[s];if(!r)return;const o=Array.from(r.querySelectorAll("td"))[1];if(!o)return;const a=o.querySelector(".qd-student-answers");a&&a.remove();const c=[];if(t.forEach(e=>{const t=e.pages[n];if(!t||!t.answers)return;const r=t.answers[s];r&&c.push({name:e.name,serviceId:e.serviceId,answer:r.answer,success:r.success,timestamp:r.timestamp})}),c.length>0){const e=document.createElement("div");e.className="qd-student-answers",c.forEach(t=>{const n=document.createElement("div");n.className="qd-student-answer "+(t.success?"qd-correct":"qd-incorrect");const s=t.serviceId.slice(-4),r=U(t.timestamp);n.innerHTML=`\n            <span class="qd-student-name">${t.name} (${s})</span>:\n            <span class="qd-student-answer-text">${t.answer}</span>\n            <span class="qd-timestamp">${r}</span>\n          `,e.appendChild(n)}),o.appendChild(e)}}),s(`Displayed student answers for ${t.length} students on page ${n}`)}catch(u){r("Failed to load student answers",u)}}function G(e){e.querySelectorAll(".qd-student-answers").forEach(e=>e.remove()),s("Hid student answers from quiz table")}function Z(e,t=16){let n=5381;for(let r=0;r<e.length;r++){n=(n<<5)+n+e.charCodeAt(r),n&=n}const s=Math.abs(n).toString(16).padStart(8,"0");return s.repeat(Math.ceil(t/s.length)).substring(0,t)}function X(e){const t=h(e),n=t[0],s=n?p(n).length:0,r=e.className||"qd-analysis";return Z(`${t.length}x${s}:${r}`,16)}function Y(e,t,n){return`R${e}C${t}#f:${Z(n.replace(/\s+/g," ").trim(),8)}`}function ee(e){return e.classList.contains("interactive")}function te(e){const t=[];e.querySelector("tbody")||t.push("Analysis table must have a tbody element");const n=h(e);0===n.length&&t.push("Analysis table must have at least one row");const s=X(e),r=[];return n.forEach((e,t)=>{p(e).forEach((e,n)=>{if(ee(e)){const s=g(e),o=Y(t,n,s);r.push({row:t,col:n,key:o})}})}),{element:e,tableId:s,editableCells:r,errors:t.length>0?t:void 0}}const ne=new WeakMap;function se(e,t){const n=te(e);n.errors&&n.errors.length>0&&r("Analysis table has validation errors:",n.errors);const a={parsed:n,interactive:t.interactive,pageId:t.pageId};if(t.interactive){if(!t.pageId)return r("Interactive mode requires pageId option"),!1;a.debouncer=new Debouncer,a.cellKeyMap=new Map}return ne.set(e,a),t.interactive?function(e,t){const{parsed:n,pageId:a,debouncer:d,cellKeyMap:c}=t;if(!a||!d||!c)return r("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!w(l.SESSION))return r("No active session found"),!1;const u=w(l.CACHE),m=u?.pages[a],b=m?.analysis,y=b?.cells||{},x=h(e);return n.editableCells.forEach(({row:e,col:n,key:a})=>{const d=x[e];if(!d)return;const u=p(d)[n];u&&(ee(u)?(c.set(u,a),y[a]&&(u.textContent=y[a]),u.contentEditable="true",f(u,"qd-editable"),u.addEventListener("input",()=>{!function(e,t,n){const{debouncer:a,pageId:d}=e;if(!a||!d)return;const c=g(t);a.debounce(`save-cell-${n}`,()=>{!async function(e,t,n){const{pageId:a,parsed:d}=e;if(!a)return;const c=w(l.SESSION);if(!c)return void r("No active session found");const u=P();let h;try{h=await u.loadStudentRecord(c)}catch(b){return void o("Failed to load student record, analysis not saved",b)}const p=h.pages[a]||{answers:[],state:"unstarted"},g=p.analysis||{tableId:d.tableId,cells:{}};g.cells[t]=n;const m=(new Date).toISOString();g.firstEdited||(g.firstEdited=m);g.lastEdited=m,p.analysis=g,h.pages[a]=p,h.updated=m;try{await u.saveStudentRecord(h)}catch(b){o("Failed to save student record to IndexedDB",b)}const f=u.buildCache(h);S(l.CACHE,f),v("qd:analysis-saved",{pageId:a,tableId:d.tableId,cellKey:t,content:n}),s(`Analysis cell saved for ${t} on page ${a}`)}(e,n,c)},500)}(t,u,a)})):r(`Cell at R${e}C${n} is no longer editable`))}),f(e,"qd-analysis-interactive"),s(`Analysis table enhanced in interactive mode for page ${a}`),!0}(e,a):function(e){f(e,"qd-analysis-non-interactive");const t=()=>{!async function(e){const t=ne.get(e);if(!t)return void o("Cannot show student entries: table not enhanced");const n=t.pageId||function(){const e=document.body.dataset.pageId;if(e)return e;const t=window.location.pathname,n=(t.split("/").pop()||"").replace(".html","");return n||void 0}();if(!n)return void o("Cannot show student entries: page ID not found");const a=w(l.SESSION);if(!a)return void o("Cannot show student entries: no active session");const d=P();let c;try{c=await d.getStudentsByRelease(a.release)}catch(f){return void r("Failed to load students for instructor view:",f)}const u=function(e,t){const n={};return e.forEach(e=>{const s=e.pages[t];if(!s||!s.analysis)return;const{cells:r}=s.analysis,o=s.analysis.lastEdited||e.updated;Object.entries(r).forEach(([t,s])=>{n[t]||(n[t]=[]),n[t].push({serviceId:e.serviceId,name:e.name,content:s,timestamp:o})})}),n}(c,n),{editableCells:g}=t.parsed,m=h(e);g.forEach(({row:e,col:t,key:n})=>{const s=m[e];if(!s)return;const r=p(s)[t];if(!r)return;const o=function(e){const t=document.createElement("div");if(t.className="qd-student-entries",0===e.length)return t.className+=" qd-no-entries",t.textContent="(No entries yet)",t.style.cssText="color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;",t;const n=function(e){return[...e].sort((e,t)=>{const n=new Date(e.timestamp).getTime();return new Date(t.timestamp).getTime()-n})}(e);return n.forEach(e=>{const n=document.createElement("div");n.className="qd-entry",n.style.cssText="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";const s=e.serviceId.slice(-4),r=U(e.timestamp),o=document.createElement("span");o.style.cssText="font-weight: 600; color: #374151;",o.textContent=`${e.name} (${s}) • ${r}: `;const a=document.createElement("span");a.style.cssText="white-space: pre-wrap;",a.textContent=e.content,n.appendChild(o),n.appendChild(a),t.appendChild(n)}),t.style.cssText="margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;",t}(u[n]||[]);o.setAttribute("data-qd-student-entries","true");const a=r.querySelector("[data-qd-student-entries]");a&&a.remove(),r.appendChild(o)}),s(`Displayed student entries for ${g.length} cells`)}(e)},n=()=>{re(e)};return document.addEventListener("qd:instructor-show-answers",t),document.addEventListener("qd:instructor-hide-answers",n),s("Analysis table enhanced in non-interactive mode with instructor view support"),!0}(e)}function re(e){e.querySelectorAll("[data-qd-student-entries]").forEach(e=>e.remove()),s("Hidden student entries from analysis table")}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers(),s("Event coordinator initialized")}registerLoginHandlers(){this.addEventListener("qd:login",e=>{(async()=>{const t=e.detail;s(`Login event: ${t.serviceId} (${t.name})`);const n=w(l.SESSION);if(!n)return void s("No session found in storage, skipping cache rebuild");const r=P();let o,a;try{o=await r.loadStudentRecord(n),await r.saveStudentRecord(o),a=r.buildCache(o),S(l.CACHE,a),s(`Cache built from IndexedDB: ${a.totals.total} total questions`)}catch{s("Failed to load from IndexedDB, initializing empty cache");S(l.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}this.dispatchEvent("qd:cache-rebuild",{}),this.upgradeTablesAfterLogin()})()})}upgradeTablesAfterLogin(){const e=window.location.pathname,t=e.substring(e.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!t)return void s("No pageId found, skipping table upgrade to interactive mode");if("true"===sessionStorage.getItem(l.INSTRUCTOR)){s("Instructor session detected, tables remain in non-interactive mode with answers visible");return void document.querySelectorAll("table.qd-quiz").forEach(e=>{const n=W(e);if(!n)return;n.pageId=t;e.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(e=>{e.classList.remove("qd-hidden")});e.querySelectorAll("tbody td:nth-child(2)").forEach((e,t)=>{const s=n.parsed.questions[t];s&&e instanceof HTMLTableCellElement&&(e.textContent=s.correctAnswer)});e.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(e=>e.classList.remove("qd-hidden"));const s=()=>{J(e,n)};document.addEventListener("qd:instructor-show-answers",s),document.addEventListener("qd:instructor-hide-answers",()=>{G(e)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&s()})}const n=document.querySelectorAll("table.qd-quiz");n.length>0&&(s(`Upgrading ${n.length} quiz table(s) to interactive mode...`),n.forEach(e=>{F(e,{interactive:!0,pageId:t})}));const r=document.querySelectorAll("table.qd-analysis");r.length>0&&(s(`Upgrading ${r.length} analysis table(s) to interactive mode...`),r.forEach(e=>{se(e,{interactive:!0,pageId:t})}))}registerLogoutHandlers(){this.addEventListener("qd:logout",e=>{s(`Logout event: ${e.detail.serviceId}`);document.querySelectorAll("table.qd-quiz").forEach(e=>{!function(e){const t=B.get(e);t&&(t.interactive=!1,t.pageId=void 0,t.inputs=void 0,t.cleanupInstructorListeners?.(),t.cleanupInstructorListeners=void 0,Q(e),K(e),b(e,"qd-quiz-interactive"),s("Quiz table reset to non-interactive mode"))}(e)});document.querySelectorAll("table.qd-analysis").forEach(e=>{!function(e){const t=ne.get(e);t&&(re(e),t.interactive&&(e.querySelectorAll(".qd-editable").forEach(e=>{e instanceof HTMLTableCellElement&&(e.contentEditable="false",e.classList.remove("qd-editable"),e.textContent="")}),e.classList.remove("qd-analysis-interactive"),t.debouncer?.cancelAll()),t.interactive=!1,t.pageId=void 0,t.debouncer=void 0,t.cellKeyMap=void 0,s("Reset analysis table to non-interactive mode"))}(e)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",e=>{const t=e.detail;s(`Answer saved: ${t.pageId} Q${t.questionIndex} = ${t.answer} (${t.success?"correct":"incorrect"})`),this.dispatchEvent("qd:cache-update",{pageId:t.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",e=>{const t=e.detail;s(`State changed: ${t.pageId} → ${t.state}`),this.dispatchEvent("qd:badge-update",{pageId:t.pageId,state:t.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",e=>{s(`Instructor mode unlocked at ${e.detail.unlockTime}`)}),this.addEventListener("qd:instructor-lock",()=>{s("Instructor mode locked")})}registerDataHandlers(){this.addEventListener("qd:data-cleared",e=>{s(`All data cleared at ${e.detail.timestamp}`),this.dispatchEvent("qd:cache-clear",{})})}addEventListener(e,t){document.addEventListener(e,t);const n=this.listeners.get(e)||[];n.push(t),this.listeners.set(e,n)}dispatchEvent(e,t){const n=new CustomEvent(e,{detail:t,bubbles:!0,composed:!0});document.dispatchEvent(n)}cleanup(){for(const[e,t]of this.listeners)for(const n of t)document.removeEventListener(e,n);this.listeners.clear(),s("Event coordinator cleaned up")}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const e=this.sessionService.getSession();if(e){if(s(`Existing session loaded for ${e.serviceId}`),this.sessionService.isExpired())return o("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(e),this.setupActivityTracking()}else s("No existing session found")}scheduleExpiryCheck(e){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const t=(new Date).getTime(),n=new Date(e.expiresAt).getTime()-t;n<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{s("Session expired (timeout)"),this.sessionService.clearSession()},n)}setupActivityTracking(){const e=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const e=this.sessionService.getSession();e&&this.scheduleExpiryCheck(e)};let t;const n=()=>{void 0!==t&&window.clearTimeout(t),t=window.setTimeout(()=>{e()},5e3)};["click","keydown","scroll","mousemove"].forEach(e=>{document.addEventListener(e,n,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const oe=globalThis,ie=oe.ShadowRoot&&(void 0===oe.ShadyCSS||oe.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ae=Symbol(),de=new WeakMap;let ce=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==ae)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(ie&&void 0===e){const n=void 0!==t&&1===t.length;n&&(e=de.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&de.set(t,e))}return e}toString(){return this.cssText}};const le=(e,...t)=>{const n=1===e.length?e[0]:t.reduce((t,n,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+e[s+1],e[0]);return new ce(n,e,ae)},ue=ie?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const n of e.cssRules)t+=n.cssText;return(e=>new ce("string"==typeof e?e:e+"",void 0,ae))(t)})(e):e,{is:he,defineProperty:pe,getOwnPropertyDescriptor:ge,getOwnPropertyNames:me,getOwnPropertySymbols:fe,getPrototypeOf:be}=Object,ve=globalThis,ye=ve.trustedTypes,we=ye?ye.emptyScript:"",Se=ve.reactiveElementPolyfillSupport,xe=(e,t)=>e,Ee={toAttribute(e,t){switch(t){case Boolean:e=e?we:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=null!==e;break;case Number:n=null===e?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch(s){n=null}}return n}},$e=(e,t)=>!he(e,t),Ce={attribute:!0,type:String,converter:Ee,reflect:!1,useDefault:!1,hasChanged:$e};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),ve.litPropertyMetadata??=new WeakMap;let Ae=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Ce){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const n=Symbol(),s=this.getPropertyDescriptor(e,n,t);void 0!==s&&pe(this.prototype,e,s)}}static getPropertyDescriptor(e,t,n){const{get:s,set:r}=ge(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const o=s?.call(this);r?.call(this,t),this.requestUpdate(e,o,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ce}static _$Ei(){if(this.hasOwnProperty(xe("elementProperties")))return;const e=be(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(xe("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(xe("properties"))){const e=this.properties,t=[...me(e),...fe(e)];for(const n of t)this.createProperty(n,e[n])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(const[t,n]of this.elementProperties){const e=this._$Eu(t,n);void 0!==e&&this._$Eh.set(e,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const e of n)t.unshift(ue(e))}else void 0!==e&&t.push(ue(e));return t}static _$Eu(e,t){const n=t.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{if(ie)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const n of t){const t=document.createElement("style"),s=oe.litNonce;void 0!==s&&t.setAttribute("nonce",s),t.textContent=n.cssText,e.appendChild(t)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){const n=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,n);if(void 0!==s&&!0===n.reflect){const r=(void 0!==n.converter?.toAttribute?n.converter:Ee).toAttribute(t,n.type);this._$Em=e,null==r?this.removeAttribute(s):this.setAttribute(s,r),this._$Em=null}}_$AK(e,t){const n=this.constructor,s=n._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=n.getPropertyOptions(s),r="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:Ee;this._$Em=s;const o=r.fromAttribute(t,e.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(e,t,n){if(void 0!==e){const s=this.constructor,r=this[e];if(n??=s.getPropertyOptions(e),!((n.hasChanged??$e)(r,t)||n.useDefault&&n.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:s,wrapped:r},o){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),!0!==r||void 0!==o)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,n]of e){const{wrapped:e}=n,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,n,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(n){throw e=!1,this._$EM(),n}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};Ae.elementStyles=[],Ae.shadowRootOptions={mode:"open"},Ae[xe("elementProperties")]=new Map,Ae[xe("finalized")]=new Map,Se?.({ReactiveElement:Ae}),(ve.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Ie=globalThis,qe=Ie.trustedTypes,ke=qe?qe.createPolicy("lit-html",{createHTML:e=>e}):void 0,_e="$lit$",Te=`lit$${Math.random().toFixed(9).slice(2)}$`,Ne="?"+Te,Oe=`<${Ne}>`,Le=document,ze=()=>Le.createComment(""),De=e=>null===e||"object"!=typeof e&&"function"!=typeof e,Pe=Array.isArray,Me="[ \t\n\f\r]",Re=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,je=/-->/g,He=/>/g,Ue=RegExp(`>|${Me}(?:([^\\s"'>=/]+)(${Me}*=${Me}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Be=/'/g,Fe=/"/g,Ve=/^(?:script|style|textarea|title)$/i,Qe=(Ze=1,(e,...t)=>({_$litType$:Ze,strings:e,values:t})),Ke=Symbol.for("lit-noChange"),We=Symbol.for("lit-nothing"),Je=new WeakMap,Ge=Le.createTreeWalker(Le,129);var Ze;function Xe(e,t){if(!Pe(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==ke?ke.createHTML(t):t}class N{constructor({strings:e,_$litType$:t},n){let s;this.parts=[];let r=0,o=0;const a=e.length-1,d=this.parts,[c,l]=((e,t)=>{const n=e.length-1,s=[];let r,o=2===t?"<svg>":3===t?"<math>":"",a=Re;for(let d=0;d<n;d++){const t=e[d];let n,c,l=-1,u=0;for(;u<t.length&&(a.lastIndex=u,c=a.exec(t),null!==c);)u=a.lastIndex,a===Re?"!--"===c[1]?a=je:void 0!==c[1]?a=He:void 0!==c[2]?(Ve.test(c[2])&&(r=RegExp("</"+c[2],"g")),a=Ue):void 0!==c[3]&&(a=Ue):a===Ue?">"===c[0]?(a=r??Re,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,n=c[1],a=void 0===c[3]?Ue:'"'===c[3]?Fe:Be):a===Fe||a===Be?a=Ue:a===je||a===He?a=Re:(a=Ue,r=void 0);const h=a===Ue&&e[d+1].startsWith("/>")?" ":"";o+=a===Re?t+Oe:l>=0?(s.push(n),t.slice(0,l)+_e+t.slice(l)+Te+h):t+Te+(-2===l?d:h)}return[Xe(e,o+(e[n]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]})(e,t);if(this.el=N.createElement(c,n),Ge.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=Ge.nextNode())&&d.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(_e)){const t=l[o++],n=s.getAttribute(e).split(Te),a=/([.?@])?(.*)/.exec(t);d.push({type:1,index:r,name:a[2],strings:n,ctor:"."===a[1]?H:"?"===a[1]?I:"@"===a[1]?L:k}),s.removeAttribute(e)}else e.startsWith(Te)&&(d.push({type:6,index:r}),s.removeAttribute(e));if(Ve.test(s.tagName)){const e=s.textContent.split(Te),t=e.length-1;if(t>0){s.textContent=qe?qe.emptyScript:"";for(let n=0;n<t;n++)s.append(e[n],ze()),Ge.nextNode(),d.push({type:2,index:++r});s.append(e[t],ze())}}}else if(8===s.nodeType)if(s.data===Ne)d.push({type:2,index:r});else{let e=-1;for(;-1!==(e=s.data.indexOf(Te,e+1));)d.push({type:7,index:r}),e+=Te.length-1}r++}}static createElement(e,t){const n=Le.createElement("template");return n.innerHTML=e,n}}function Ye(e,t,n=e,s){if(t===Ke)return t;let r=void 0!==s?n._$Co?.[s]:n._$Cl;const o=De(t)?void 0:t._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(e),r._$AT(e,n,s)),void 0!==s?(n._$Co??=[])[s]=r:n._$Cl=r),void 0!==r&&(t=Ye(e,r._$AS(e,t.values),r,s)),t}class M{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:n}=this._$AD,s=(e?.creationScope??Le).importNode(t,!0);Ge.currentNode=s;let r=Ge.nextNode(),o=0,a=0,d=n[0];for(;void 0!==d;){if(o===d.index){let t;2===d.type?t=new R(r,r.nextSibling,this,e):1===d.type?t=new d.ctor(r,d.name,d.strings,this,e):6===d.type&&(t=new z(r,this,e)),this._$AV.push(t),d=n[++a]}o!==d?.index&&(r=Ge.nextNode(),o++)}return Ge.currentNode=Le,s}p(e){let t=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,s){this.type=2,this._$AH=We,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Ye(this,e,t),De(e)?e===We||null==e||""===e?(this._$AH!==We&&this._$AR(),this._$AH=We):e!==this._$AH&&e!==Ke&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>Pe(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==We&&De(this._$AH)?this._$AA.nextSibling.data=e:this.T(Le.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:n}=e,s="number"==typeof n?this._$AC(e):(void 0===n.el&&(n.el=N.createElement(Xe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new M(s,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Je.get(e.strings);return void 0===t&&Je.set(e.strings,t=new N(e)),t}k(e){Pe(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,s=0;for(const r of e)s===t.length?t.push(n=new R(this.O(ze()),this.O(ze()),this,this.options)):n=t[s],n._$AI(r),s++;s<t.length&&(this._$AR(n&&n._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,s,r){this.type=1,this._$AH=We,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=r,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=We}_$AI(e,t=this,n,s){const r=this.strings;let o=!1;if(void 0===r)e=Ye(this,e,t,0),o=!De(e)||e!==this._$AH&&e!==Ke,o&&(this._$AH=e);else{const s=e;let a,d;for(e=r[0],a=0;a<r.length-1;a++)d=Ye(this,s[n+a],t,a),d===Ke&&(d=this._$AH[a]),o||=!De(d)||d!==this._$AH[a],d===We?e=We:e!==We&&(e+=(d??"")+r[a+1]),this._$AH[a]=d}o&&!s&&this.j(e)}j(e){e===We?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===We?void 0:e}}class I extends k{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==We)}}class L extends k{constructor(e,t,n,s,r){super(e,t,n,s,r),this.type=5}_$AI(e,t=this){if((e=Ye(this,e,t,0)??We)===Ke)return;const n=this._$AH,s=e===We&&n!==We||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,r=e!==We&&(n===We||s);s&&this.element.removeEventListener(this.name,this,n),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class z{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){Ye(this,e)}}const et=Ie.litHtmlPolyfillSupport;et?.(N,R),(Ie.litHtmlVersions??=[]).push("3.3.1");const tt=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class i extends Ae{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,n)=>{const s=n?.renderBefore??t;let r=s._$litPart$;if(void 0===r){const e=n?.renderBefore??null;s._$litPart$=r=new R(t.insertBefore(ze(),e),e,void 0,n??{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ke}}i._$litElement$=!0,i.finalized=!0,tt.litElementHydrateSupport?.({LitElement:i});const nt=tt.litElementPolyfillSupport;nt?.({LitElement:i}),(tt.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const st=e=>(t,n)=>{void 0!==n?n.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},rt={attribute:!0,type:String,converter:Ee,reflect:!1,hasChanged:$e},ot=(e=rt,t,n)=>{const{kind:s,metadata:r}=n;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),"setter"===s&&((e=Object.create(e)).wrapped=!0),o.set(n.name,e),"accessor"===s){const{name:s}=n;return{set(n){const r=t.get.call(this);t.set.call(this,n),this.requestUpdate(s,r,e)},init(t){return void 0!==t&&this.C(s,void 0,e,t),t}}}if("setter"===s){const{name:s}=n;return function(n){const r=this[s];t.call(this,n),this.requestUpdate(s,r,e)}}throw Error("Unsupported decorator location: "+s)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function it(e){return(t,n)=>"object"==typeof n?ot(e,t,n):((e,t,n)=>{const s=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),s?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function at(e){return it({...e,state:!0,attribute:!1})}const dt=".wh_top_menu_and_indexterms_link",ct=".wh_publication_title .title",lt="",ut="BrowserTest",ht="qd-status-container",pt="qd-title-selector",gt="qd-instructor-hash",mt="qd-db-name";function ft(e,t){const n=document.querySelector(`#${e}`);if(!n)return t;const r=n.textContent?.trim()||"";return""===r?(o(`Config element #${e} found but empty, using default: "${t}"`),t):(s(`Config read from #${e}: "${r}"`),r)}var bt=Object.defineProperty,vt=Object.getOwnPropertyDescriptor,yt=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?vt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&bt(t,n,o),o};let wt=class extends i{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.instructorPassword="",this.showInstructorModal=!1,this.modalOverlay=null,this.errorMessage="",this.instructorError="",this.isSubmitting=!1,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.instructorPassword="",this.errorMessage="",this.instructorError="",this.isSubmitting=!1,this.showInstructorModal=!1,this.cleanupModal(),this.updateVisibility()},this.handleEscape=e=>{"Escape"===e.key&&this.showInstructorModal&&this.closeInstructorModal()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("keydown",this.handleEscape),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.cleanupModal()}cleanupModal(){this.modalOverlay&&(this.modalOverlay.remove(),this.modalOverlay=null)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){w(l.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return Qe`
      <div class="login-container">
        <div class="title">${this.title}</div>

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

          <button type="submit" class="login-btn" ?disabled=${this.isSubmitting||!this.isValid()}>
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

          ${this.errorMessage?Qe`<div class="error-message">${this.errorMessage}</div>`:""}
        </form>
      </div>
    `}renderInstructorModalToBody(){const e=document.createElement("div");e.className="qd-instructor-modal-overlay",e.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n      font-family: system-ui, -apple-system, sans-serif;\n    ";const t=document.createElement("div");t.className="qd-instructor-modal",t.style.cssText="\n      background: white;\n      border-radius: 8px;\n      padding: 24px;\n      min-width: 320px;\n      max-width: 400px;\n      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);\n      pointer-events: auto;\n      position: relative;\n      z-index: 100000;\n    ";const n=document.createElement("div");n.style.cssText="\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 20px;\n    ";const s=document.createElement("h3");s.textContent="Instructor Login",s.style.cssText="font-size: 18px; font-weight: 600; color: #333; margin: 0;";const r=document.createElement("button");r.textContent="×",r.type="button",r.style.cssText="\n      background: none;\n      border: none;\n      font-size: 24px;\n      color: #666;\n      cursor: pointer;\n      padding: 0;\n      width: 28px;\n      height: 28px;\n      line-height: 1;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",r.onclick=()=>this.closeInstructorModal(),n.appendChild(s),n.appendChild(r);const o=document.createElement("form"),a=document.createElement("div");a.style.marginBottom="20px";const d=document.createElement("input");d.type="password",d.placeholder="Password",d.required=!0,d.style.cssText="\n      width: 100%;\n      box-sizing: border-box;\n      padding: 6px 10px;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n      font-size: 11px;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",d.oninput=e=>{this.instructorPassword=e.target.value,this.instructorError="",c&&c.remove()},a.appendChild(d);let c=null;this.instructorError&&(c=document.createElement("div"),c.textContent=this.instructorError,c.style.cssText="\n        color: #d32f2f;\n        font-size: 11px;\n        margin-top: 3px;\n        padding: 4px 8px;\n        background: #ffebee;\n        border-radius: 3px;\n        border-left: 3px solid #d32f2f;\n      ",a.appendChild(c));const l=document.createElement("div");l.style.cssText="display: flex; gap: 8px; justify-content: flex-end;";const u=document.createElement("button");u.textContent="Cancel",u.type="button",u.style.cssText="\n      background: #e0e0e0;\n      color: #333;\n      border: none;\n      border-radius: 4px;\n      font-size: 11px;\n      font-weight: 500;\n      cursor: pointer;\n      padding: 6px 12px;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",u.onclick=()=>this.closeInstructorModal();const h=document.createElement("button");h.textContent="Login",h.type="submit",h.style.cssText="\n      background: #0066cc;\n      color: white;\n      border: none;\n      border-radius: 4px;\n      font-size: 11px;\n      font-weight: 500;\n      cursor: pointer;\n      padding: 6px 12px;\n      pointer-events: auto;\n      position: relative;\n      z-index: 1;\n    ",l.appendChild(u),l.appendChild(h),o.appendChild(a),o.appendChild(l),o.onsubmit=e=>{e.preventDefault(),this.handleInstructorLogin(e)},t.appendChild(n),t.appendChild(o),e.appendChild(t),e.onclick=t=>{t.target===e&&this.closeInstructorModal()},document.body.appendChild(e),this.modalOverlay=e,setTimeout(()=>d.focus(),50)}handleNameInput(e){const t=e.target;this.name=t.value,this.errorMessage=""}handleServiceIdInput(e){const t=e.target;this.serviceId=t.value,this.errorMessage=""}isValid(){const e=this.name.trim(),t=this.serviceId.trim();if(!e)return!1;return!!/^[A-Za-z0-9]{2,10}$/.test(t)}getRelease(){const e=document.getElementById(pt),t=e?.textContent?.trim()||".wh_publication_title .title",n=document.querySelector(t);return n?.textContent?.trim()||""}handleStudentLogin(e){if(e.preventDefault(),this.isValid()){this.isSubmitting=!0,this.errorMessage="";try{const e=this.getRelease();if(!e)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);(new SessionService).createSession(this.serviceId.trim(),this.name.trim(),e);const t={serviceId:this.serviceId.trim(),name:this.name.trim(),release:e,role:"student"},n=new CustomEvent("qd:login",{detail:t,bubbles:!0,composed:!0});this.dispatchEvent(n),this.updateVisibility()}catch(t){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",t),this.isSubmitting=!1}}else this.errorMessage="Please enter valid name and service ID (2-10 alphanumeric)"}openInstructorModal(){this.showInstructorModal=!0,this.instructorPassword="",this.instructorError="",this.renderInstructorModalToBody()}closeInstructorModal(){this.showInstructorModal=!1,this.instructorPassword="",this.instructorError="",this.cleanupModal()}async hashPassword(e){const t=(new TextEncoder).encode(e),n=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){const e=document.getElementById(gt);return e?.textContent?.trim()||""}async handleInstructorLogin(e){if(e.preventDefault(),this.instructorPassword)try{const e=await this.hashPassword(this.instructorPassword),t=this.getExpectedHash();if(!t)return void(this.instructorError="Instructor password not configured");if(e!==t)return this.instructorError="Incorrect password",void(this.instructorPassword="");const n=this.getRelease();(new SessionService).createSession("INSTRUCTOR","Instructor",n||""),sessionStorage.setItem(l.INSTRUCTOR,"true");const s=new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:n||"",role:"instructor"},bubbles:!0,composed:!0});this.dispatchEvent(s),this.closeInstructorModal(),this.updateVisibility()}catch(t){this.instructorError="Login failed. Please try again.",console.error("Instructor login error:",t)}else this.instructorError="Password is required"}};wt.styles=le`
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
  `,yt([it({type:String})],wt.prototype,"title",2),yt([at()],wt.prototype,"name",2),yt([at()],wt.prototype,"serviceId",2),yt([at()],wt.prototype,"instructorPassword",2),yt([at()],wt.prototype,"showInstructorModal",2),yt([at()],wt.prototype,"errorMessage",2),yt([at()],wt.prototype,"instructorError",2),yt([at()],wt.prototype,"isSubmitting",2),wt=yt([st("qd-login")],wt);var St=Object.defineProperty,xt=Object.getOwnPropertyDescriptor,Et=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?xt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&St(t,n,o),o};let $t=class extends i{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent)}render(){return Qe`
      <div class="status-panel">
        <div class="status-indicator ${this.statusColor}"></div>
        <div class="progress-label">Progress:</div>
        <div class="progress-text">${this.correct}/${this.total} Correct (${this.percentage}%)</div>
        <button class="logout-button" @click=${()=>this.handleLogout()}>Logout</button>
      </div>
    `}loadCache(){const e=w(l.CACHE);if(!e)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");this.total=e.totals.total,this.correct=e.totals.correct,this.percentage=this.calculatePercentage(e.totals.total,e.totals.correct),this.statusColor=this.calculateStatusColor(e.totals.total,e.totals.correct)}calculatePercentage(e,t){return 0===e?0:Math.round(t/e*100)}calculateStatusColor(e,t){return 0===e||0===t?"red":t===e?"green":"amber"}updateVisibility(){const e=w(l.SESSION),t="true"===sessionStorage.getItem(l.INSTRUCTOR);e&&!t?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const e=w(l.SESSION);(new SessionService).clearSession();const t=new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(t)}};$t.styles=le`
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
  `,Et([at()],$t.prototype,"total",2),Et([at()],$t.prototype,"correct",2),Et([at()],$t.prototype,"percentage",2),Et([at()],$t.prototype,"statusColor",2),$t=Et([st("qd-status")],$t);const Ct=le`
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
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const e=[2e3,4e3,8e3,16e3,3e4],t=e[Math.min(this.failureCount-1,e.length-1)]??3e4;this.lockoutUntil=Date.now()+t}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const e=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(e/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const At="instructor.password.hash";var It=Object.defineProperty,qt=Object.getOwnPropertyDescriptor,kt=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?qt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&It(t,n,o),o};let _t=class extends i{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=e=>{const t=e.target;this.password=t.value,this.error=""},this.handleSubmit=async e=>{e.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const e=function(){const e=document.getElementById(At);if(!e){const e=`Instructor password hash not found. Expected element with id="${At}". Check Oxygen XSL transform configuration.`;throw r(e),new Error(e)}const t=e.textContent?.trim();if(!t){const e="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw r(e),new Error(e)}if(!/^[a-f0-9]{64}$/i.test(t)){const e=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${t.substring(0,20)}...`;throw r(e),new Error(e)}return t.toLowerCase()}(),t=(new TextEncoder).encode(this.password),n=await crypto.subtle.digest("SHA-256",t),s=Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,"0")).join(""),o=await async function(e,t){if(e.length!==t.length)return!1;if(0===e.length)return!0;const n=new TextEncoder,s=n.encode(e),r=n.encode(t);try{const e=await crypto.subtle.importKey("raw",s,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),t=await crypto.subtle.sign("HMAC",e,r),n=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),o=await crypto.subtle.sign("HMAC",n,s);if(t.byteLength!==o.byteLength)return!1;const a=new Uint8Array(t),d=new Uint8Array(o);let c=0;for(let s=0;s<a.length;s++)c|=(a[s]??0)^(d[s]??0);return 0===c}catch(o){return console.error("Constant-time comparison failed:",o),!1}}(s,e);o?(this.rateLimiter.reset(),this.password="",this.error="",y(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const e=this.remainingSeconds>0;return Qe`
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

          ${this.error?Qe`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${e||!this.password}>
            ${e?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};_t.styles=Ct,kt([at()],_t.prototype,"password",2),kt([at()],_t.prototype,"error",2),kt([at()],_t.prototype,"remainingSeconds",2),_t=kt([st("qd-instructor-unlock")],_t);var Tt=Object.defineProperty,Nt=Object.getOwnPropertyDescriptor,Ot=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?Nt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&Tt(t,n,o),o};let Lt=class extends i{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.expandedStudents=new Set,this.modalElement=null,this.handleEscape=e=>{"Escape"===e.key&&this.showModal&&this.handleClose()},this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleEscape),this.removeModalFromBody()}updated(e){e.has("showModal")&&(this.showModal?(this.expandedStudents.clear(),this.students.forEach(e=>{this.expandedStudents.add(e.serviceId)}),this.renderModalToBody()):this.removeModalFromBody())}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}renderModalToBody(){this.removeModalFromBody();const e=document.createElement("div");e.className="qd-scores-modal-overlay",e.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n      font-family: system-ui, -apple-system, sans-serif;\n      pointer-events: auto;\n    ",e.onclick=t=>{t.target===e&&this.handleClose()};const t=document.createElement("div");t.className="qd-scores-modal",t.style.cssText="\n      background: white;\n      color: #333;\n      border-radius: 8px;\n      padding: 24px;\n      max-width: 800px;\n      max-height: 80vh;\n      overflow: auto;\n      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);\n      pointer-events: auto;\n      position: relative;\n      z-index: 100000;\n    ",t.onclick=e=>e.stopPropagation();const n=document.createElement("div");n.style.cssText="\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 16px;\n    ";const s=document.createElement("h2");s.textContent="Student Scores",s.style.cssText="font-size: 18px; font-weight: 600; color: #000; margin: 0;";const r=document.createElement("button");r.textContent="✕",r.type="button",r.style.cssText="\n      background: none;\n      border: none;\n      font-size: 20px;\n      color: #666;\n      cursor: pointer;\n      padding: 4px 8px;\n      pointer-events: auto;\n    ",r.onclick=()=>this.handleClose(),n.appendChild(s),n.appendChild(r);const o=document.createElement("div"),a=[...this.students].sort((e,t)=>e.name.localeCompare(t.name));if(0===a.length)o.innerHTML='<p style="color: #333;">No student data available.</p>';else{const e=this.createScoresTable(a);o.appendChild(e)}t.appendChild(n),t.appendChild(o),e.appendChild(t),document.body.appendChild(e),this.modalElement=e}removeModalFromBody(){this.modalElement&&(this.modalElement.remove(),this.modalElement=null)}toggleStudent(e){this.expandedStudents.has(e)?this.expandedStudents.delete(e):this.expandedStudents.add(e),this.showModal&&this.renderModalToBody()}createScoresTable(e){const t=document.createElement("table");t.style.cssText="\n      width: 100%;\n      border-collapse: collapse;\n      margin: 16px 0;\n    ";const n=document.createElement("thead");n.innerHTML='\n      <tr>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Student</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Service ID</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Attempted</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Correct</th>\n        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; background: #f5f5f5; font-weight: 600; color: #000;">Percentage</th>\n      </tr>\n    ',t.appendChild(n);const s=document.createElement("tbody");return e.forEach(e=>{const t=this.calculateSummary(e),n=this.expandedStudents.has(e.serviceId),r=document.createElement("tr");if(r.style.cssText="cursor: pointer; color: #333;",r.innerHTML=`\n        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">\n          <span style="display: inline-block; width: 16px; margin-right: 4px;">${n?"▼":"▶"}</span>\n          ${t.name}\n        </td>\n        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${t.serviceId}</td>\n        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${t.attempted}</td>\n        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${t.correct===t.attempted?"color: #28a745;":""}">${t.correct}</td>\n        <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd; ${100===t.percentage?"color: #28a745;":0===t.percentage?"color: #dc3545;":""}">${t.percentage}%</td>\n      `,r.onclick=()=>this.toggleStudent(e.serviceId),s.appendChild(r),n){const t=this.createExpandedRow(e);s.appendChild(t)}}),t.appendChild(s),t}createExpandedRow(e){const t=document.createElement("tr");t.style.backgroundColor="#f9f9f9";const n=document.createElement("td");n.colSpan=5,n.style.cssText="padding: 8px 8px 8px 40px; border-bottom: 1px solid #ddd;";const s=Object.entries(e.pages);if(0===s.length)n.innerHTML='<em style="color: #666;">No quiz pages attempted</em>';else{const e=document.createElement("div");e.style.cssText="display: flex; flex-direction: column; gap: 6px;",s.forEach(([t,n])=>{const s=document.createElement("div");s.style.cssText="display: flex; align-items: center; gap: 12px;";const r=document.createElement("span");r.style.cssText="font-weight: 600; color: #000; min-width: 120px; flex-shrink: 0;",r.textContent=t,s.appendChild(r);const o=document.createElement("div");o.style.cssText="display: flex; flex-wrap: wrap; gap: 4px; flex: 1;",n.answers.forEach((e,t)=>{const n=document.createElement("span");n.style.cssText=`\n            display: inline-block;\n            padding: 2px 6px;\n            border-radius: 3px;\n            font-size: 11px;\n            font-weight: 500;\n            ${null===e?"background: #e0e0e0; color: #666;":e.success?"background: #d4edda; color: #155724; border: 1px solid #c3e6cb;":"background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"}\n          `,n.textContent=`Q${t+1}: ${e?e.answer:"—"}`,o.appendChild(n)}),s.appendChild(o),e.appendChild(s)}),n.appendChild(e)}return t.appendChild(n),t}render(){return Qe``}};Lt.styles=Ct,Ot([it({type:Array})],Lt.prototype,"students",2),Ot([it({type:Boolean})],Lt.prototype,"showModal",2),Ot([at()],Lt.prototype,"expandedStudents",2),Lt=Ot([st("qd-instructor-scores")],Lt);var zt=Object.defineProperty,Dt=Object.getOwnPropertyDescriptor,Pt=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?Dt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&zt(t,n,o),o};let Mt=class extends i{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const e=this.generateCSV(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(t),s=document.createElement("a");s.href=n;const r=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);s.download=`quiz-data-${r}.csv`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(n)}}escapeCSVField(e){const t=String(e);return t.includes(",")||t.includes('"')||t.includes("\n")?`"${t.replace(/"/g,'""')}"`:t}generateCSV(){const e=[];e.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const t of this.students)for(const[n,s]of Object.entries(t.pages)){(s.answers||[]).forEach((s,r)=>{s&&e.push([this.escapeCSVField(t.serviceId),this.escapeCSVField(t.name),this.escapeCSVField(t.release),this.escapeCSVField(n),this.escapeCSVField(r),this.escapeCSVField(s.answer),this.escapeCSVField(s.success),this.escapeCSVField(s.timestamp)].join(","))})}return e.join("\n")}render(){const e=this.students.length>0&&this.students.some(e=>e.attempted>0),t=e?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return Qe`
      <button
        @click=${this.handleExport}
        ?disabled=${!e}
        class="primary compact"
        title=${t}
      >
        Export CSV
      </button>
    `}};Mt.styles=Ct,Pt([it({type:Array})],Mt.prototype,"students",2),Mt=Pt([st("qd-instructor-export")],Mt);var Rt=Object.defineProperty,jt=Object.getOwnPropertyDescriptor,Ht=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?jt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&Rt(t,n,o),o};let Ut=class extends i{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=e=>{const t=e.target;this.confirmText=t.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{x(),y(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}render(){return Qe`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.showConfirmDialog?this.renderConfirmDialog():""}
      ${this.success?Qe`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const e="DELETE ALL DATA"===this.confirmText;return Qe`
      <div class="modal-overlay" @click=${this.handleCancelClear}>
        <div class="modal-content" @click=${e=>e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">Confirm Data Deletion</h2>
            <button class="close-button" @click=${this.handleCancelClear}>✕</button>
          </div>

          <p style="color: #dc3545; font-weight: 600;">
            ⚠️ This will permanently delete all student quiz data, answers, and progress.
          </p>

          <p>This action cannot be undone. All students will need to start over.</p>

          <p>Type <strong>DELETE ALL DATA</strong> to confirm:</p>

          <input
            type="text"
            .value=${this.confirmText}
            @input=${this.handleConfirmInput}
            placeholder="DELETE ALL DATA"
            style="width: 100%; margin: 16px 0;"
            autocomplete="off"
          />

          ${this.error?Qe`<div class="error">${this.error}</div>`:""}

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
            <button @click=${this.handleCancelClear}>Cancel</button>
            <button @click=${this.handleConfirmClear} class="danger" ?disabled=${!e}>
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    `}};Ut.styles=Ct,Ht([at()],Ut.prototype,"showConfirmDialog",2),Ht([at()],Ut.prototype,"confirmText",2),Ht([at()],Ut.prototype,"error",2),Ht([at()],Ut.prototype,"success",2),Ut=Ht([st("qd-instructor-manage")],Ut);var Bt=Object.defineProperty,Ft=Object.getOwnPropertyDescriptor,Vt=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?Ft(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&Bt(t,n,o),o};let Qt=class extends i{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.handleLoginEvent=e=>{const t=e,n=t.detail?.role;this.updateVisibility(),"instructor"===n&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const e=w(l.SESSION);if(e){try{const{getStorageService:t}=await Promise.resolve().then(()=>j),n=t(),s=await n.getStudentsByRelease(e.release);this.students=s}catch(t){console.error("Failed to load students:",t),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const e=w(l.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:e?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async e=>{const t=e.target;if(this.showStudentAnswers=t.checked,this.showStudentAnswers&&0===this.students.length){const e=w(l.SESSION);if(e)try{const{getStorageService:t}=await Promise.resolve().then(()=>j),n=t(),s=await n.getStudentsByRelease(e.release);this.students=s}catch(s){console.error("Failed to load students for toggle:",s)}}const n=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(n,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const e="true"===sessionStorage.getItem(l.INSTRUCTOR);e&&this.unlock();const t=sessionStorage.getItem("qd/instructor/showAnswers");null!==t&&(this.showStudentAnswers="true"===t,this.showStudentAnswers&&e&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){"true"===sessionStorage.getItem(l.INSTRUCTOR)?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(e){this.students=e}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1}render(){return this.unlocked?Qe`
      <div class="instructor-panel">
        <div class="instructor-title">Instructor Mode</div>

        <label class="toggle-label">
          <input
            type="checkbox"
            .checked=${this.showStudentAnswers}
            @change=${this.handleToggleStudentAnswers}
          />
          Show student answers on page
        </label>

        <button @click=${this.handleViewScores} class="primary compact">View All Scores</button>

        <qd-instructor-export .students=${this.students}></qd-instructor-export>

        <qd-instructor-manage @qd:data-cleared=${this.handleDataCleared}></qd-instructor-manage>

        <button @click=${this.handleLogout} class="logout">Logout</button>

        <qd-instructor-scores
          .students=${this.students}
          .showModal=${this.showScores}
          @close=${this.handleCloseScores}
        ></qd-instructor-scores>
      </div>
    `:Qe`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};Qt.styles=[Ct,le`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],Vt([at()],Qt.prototype,"unlocked",2),Vt([at()],Qt.prototype,"showScores",2),Vt([at()],Qt.prototype,"students",2),Vt([at()],Qt.prototype,"showStudentAnswers",2),Qt=Vt([st("qd-instructor")],Qt);var Kt=Object.defineProperty,Wt=Object.getOwnPropertyDescriptor,Jt=(e,t,n,s)=>{for(var r,o=s>1?void 0:s?Wt(t,n):t,a=e.length-1;a>=0;a--)(r=e[a])&&(o=(s?r(t,n,o):r(o))||o);return s&&o&&Kt(t,n,o),o};let Gt=class extends i{constructor(){super(...arguments),this.dbName="quiz-scores",this.hidden=!0,this.visible=!1,this.indexedDBEntries=[],this.sessionStorageEntries=[],this.handleToggleEntry=e=>{e.expanded=!e.expanded,this.requestUpdate()},this.handleClearSessionStorage=()=>{confirm("Clear all sessionStorage?")&&(sessionStorage.clear(),this.refreshData())},this.handleClearIndexedDB=async()=>{if(confirm(`Clear IndexedDB "${this.dbName}"?`))try{const e=await this.openDatabase();for(const t of Array.from(e.objectStoreNames)){const n=e.transaction(t,"readwrite");n.objectStore(t).clear()}await this.refreshData()}catch(e){console.error("Failed to clear IndexedDB:",e)}},this.handleClose=()=>{this.visible=!1,this.hidden=!0}}connectedCallback(){super.connectedCallback(),this.setupKeyboardShortcut(),this.startRefresh()}disconnectedCallback(){super.disconnectedCallback(),this.stopRefresh()}setupKeyboardShortcut(){document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&"D"===e.key&&(e.preventDefault(),this.toggleVisibility())})}toggleVisibility(){this.visible=!this.visible,this.hidden=!this.visible}startRefresh(){this.refreshData(),this.refreshInterval=window.setInterval(()=>{this.refreshData()},1e3)}stopRefresh(){this.refreshInterval&&window.clearInterval(this.refreshInterval)}async refreshData(){await this.refreshIndexedDB(),this.refreshSessionStorage()}async refreshIndexedDB(){try{const e=await this.openDatabase(),t=[];for(const n of Array.from(e.objectStoreNames)){const s=e.transaction(n,"readonly"),r=s.objectStore(n).getAll();await new Promise((e,s)=>{r.onsuccess=()=>{r.result.forEach((e,s)=>{t.push({key:`${n}[${s}]`,value:e,expanded:!1})}),e()},r.onerror=()=>s(new Error(r.error?.message||"IndexedDB request failed"))})}this.indexedDBEntries=t}catch{this.indexedDBEntries=[]}}refreshSessionStorage(){const e=[];for(let t=0;t<sessionStorage.length;t++){const n=sessionStorage.key(t);if(n)try{const t=sessionStorage.getItem(n);e.push({key:n,value:t?JSON.parse(t):t,expanded:!1})}catch{e.push({key:n,value:sessionStorage.getItem(n),expanded:!1})}}this.sessionStorageEntries=e}openDatabase(){return new Promise((e,t)=>{const n=indexedDB.open(this.dbName);n.onsuccess=()=>e(n.result),n.onerror=()=>t(new Error(n.error?.message||"Failed to open database"))})}renderEntry(e){return Qe`
      <div class="entry">
        <div class="entry-key" @click=${()=>this.handleToggleEntry(e)}>
          ${e.expanded?"▼":"▶"} ${e.key}
        </div>
        ${e.expanded?Qe` <div class="entry-value">${JSON.stringify(e.value,null,2)}</div> `:""}
      </div>
    `}render(){return Qe`
      <div class="header">
        <span class="title">Storage Monitor (Ctrl+Shift+D)</span>
        <div class="controls">
          <button @click=${this.handleClose}>✕</button>
        </div>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-title">
            IndexedDB: ${this.dbName}
            <button
              class="danger"
              @click=${this.handleClearIndexedDB}
              style="float: right; margin-top: -2px;"
            >
              Clear
            </button>
          </div>
          ${0===this.indexedDBEntries.length?Qe`<div class="empty">No entries</div>`:this.indexedDBEntries.map(e=>this.renderEntry(e))}
        </div>

        <div class="section">
          <div class="section-title">
            sessionStorage
            <button
              class="danger"
              @click=${this.handleClearSessionStorage}
              style="float: right; margin-top: -2px;"
            >
              Clear
            </button>
          </div>
          ${0===this.sessionStorageEntries.length?Qe`<div class="empty">No entries</div>`:this.sessionStorageEntries.map(e=>this.renderEntry(e))}
        </div>
      </div>
    `}};Gt.styles=le`
    :host {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      max-height: 500px;
      background: white;
      border: 2px solid #333;
      border-radius: 4px 0 0 0;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      font-family: monospace;
      font-size: 12px;
      z-index: 9999; /* Below modal overlays (10001) */
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    }

    :host([hidden]) {
      display: none;
      pointer-events: none;
    }

    .header {
      background: #333;
      color: white;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title {
      font-weight: bold;
    }

    .controls {
      display: flex;
      gap: 8px;
    }

    button {
      background: #555;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }

    button:hover {
      background: #777;
    }

    button.danger {
      background: #dc3545;
    }

    button.danger:hover {
      background: #c82333;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 4px;
      padding: 4px;
      background: #f0f0f0;
    }

    .entry {
      margin: 4px 0;
      padding: 4px;
      border-left: 2px solid #ddd;
      padding-left: 8px;
    }

    .entry-key {
      color: #0066cc;
      cursor: pointer;
      user-select: none;
    }

    .entry-key:hover {
      text-decoration: underline;
    }

    .entry-value {
      color: #666;
      margin-left: 16px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .entry-actions {
      margin-left: 16px;
      margin-top: 4px;
    }

    .empty {
      color: #999;
      font-style: italic;
    }
  `,Jt([it({type:String})],Gt.prototype,"dbName",2),Jt([it({type:Boolean,reflect:!0})],Gt.prototype,"hidden",2),Jt([at()],Gt.prototype,"visible",2),Jt([at()],Gt.prototype,"indexedDBEntries",2),Jt([at()],Gt.prototype,"sessionStorageEntries",2),Gt=Jt([st("qd-storage-monitor")],Gt);const Zt={statusPanel:".wh_top_menu_and_indexterms_link",storageMonitor:"body"};function Xt(e={}){const t=e.statusPanelContainer||Zt.statusPanel;!function(e){const t=document.querySelector(e);if(!t)return s(`Login component not injected: container '${e}' not found`),null;const n=document.createElement("qd-login");t.appendChild(n),s("Login component injected")}(t),function(e){const t=document.querySelector(e);if(!t)return s(`Status component not injected: container '${e}' not found`),null;const n=document.createElement("qd-status");t.appendChild(n),s("Status component injected")}(t),function(e){const t=document.querySelector(e);if(!t)return s(`Instructor component not injected: container '${e}' not found`),null;const n=document.createElement("qd-instructor");t.appendChild(n),s("Instructor component injected")}(t),function(e){if(!e.debug)return null;const t=e.storageMonitorContainer||Zt.storageMonitor,n=document.querySelector(t);if(!n)return s(`Storage monitor not injected: container '${t}' not found`),null;const r=document.createElement("qd-storage-monitor");e.dbName&&r.setAttribute("dbName",e.dbName),n.appendChild(r),s("Storage monitor injected (debug mode)")}({storageMonitorContainer:e.storageMonitorContainer,dbName:e.dbName,debug:e.debug})}const Yt={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},en={unstarted:"red",incomplete:"amber",complete:"green"};function tn(e){const t=function(e,t){if(!e||!t?.pages)return"unstarted";const n=t.pages[e];return n?.state??"unstarted"}(e.getAttribute("data-page-id"),w(l.CACHE));!function(e,t){Object.values(Yt).forEach(t=>{e.classList.remove(t)});const n=Yt[en[t]];e.classList.add(n)}(e,t)}function nn(){const e=document.querySelectorAll(".quizPageBtn"),t=w(l.CACHE),n="true"===sessionStorage.getItem(l.INSTRUCTOR);if(!t||n)return e.forEach(e=>{Object.values(Yt).forEach(t=>{e.classList.remove(t)})}),void s(n?`Removed badge styling from ${e.length} page links (instructor mode)`:`Removed badge styling from ${e.length} page links (no session)`);e.forEach(e=>{tn(e)}),s(`Updated ${e.length} page badges`)}function sn(e){const t=e,{pageId:n}=t.detail,r=document.querySelector(`[data-page-id="${n}"]`);r&&r.classList.contains("quizPageBtn")&&(tn(r),s(`Updated badge for page ${n}`))}function rn(){s("Cache rebuilt, refreshing all badges"),nn()}function on(){s("Logout detected, removing all badge styling");const e=document.querySelectorAll(".quizPageBtn");e.forEach(e=>{Object.values(Yt).forEach(t=>{e.classList.remove(t)})}),s(`Removed badge styling from ${e.length} page links`)}const an={initialized:!1};async function dn(e={}){if(an.initialized)return void o("Bootstrap already initialized, skipping");s("Bootstrapping Sonar Quiz System..."),function(){if(document.getElementById("qd-global-styles"))return;const e=document.createElement("style");e.id="qd-global-styles",e.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: 1rem;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor mode: Student answers display */\n    .qd-student-answers {\n      margin-top: 12px;\n      padding: 8px;\n      background: #f8f9fa;\n      border-radius: 4px;\n      border: 1px solid #dee2e6;\n    }\n\n    .qd-student-answer {\n      font-size: 12px;\n      padding: 4px 0;\n      line-height: 1.4;\n    }\n\n    .qd-student-answer.qd-correct {\n      color: #28a745;\n    }\n\n    .qd-student-answer.qd-incorrect {\n      color: #dc3545;\n    }\n\n    .qd-student-name {\n      font-weight: 600;\n    }\n\n    .qd-student-answer-text {\n      margin: 0 4px;\n    }\n\n    .qd-timestamp {\n      color: #6c757d;\n      font-size: 11px;\n      margin-left: 8px;\n    }\n  ",document.head.appendChild(e),s("Global styles injected")}();const t=P(e.dbName||"BrowserTest");await t.init();const n=new EventCoordinator;n.initialize(),an.eventCoordinator=n;const r=new SessionCoordinator;r.initialize(),an.sessionCoordinator=r,Xt({statusPanelContainer:e.statusPanelContainer,storageMonitorContainer:e.storageMonitorContainer,dbName:e.dbName,debug:e.debug}),!1!==e.autoEnhanceQuizTables&&function(){const e=document.querySelectorAll("table.qd-quiz");if(0===e.length)return void s("No quiz tables found to enhance");s(`Enhancing ${e.length} quiz table(s) in non-interactive mode...`);let t=0;for(const s of Array.from(e))try{F(s,{interactive:!1}),t++}catch(n){o(`Failed to enhance quiz table: ${n.message}`)}s(`Enhanced ${t} of ${e.length} quiz table(s) (non-interactive)`)}(),!1!==e.autoEnhanceAnalysisTables&&function(){const e=document.querySelectorAll("table.qd-analysis");if(0===e.length)return void s("No analysis tables found to enhance");s(`Enhancing ${e.length} analysis table(s) in non-interactive mode...`);let t=0;for(const s of Array.from(e))try{se(s,{interactive:!1}),t++}catch(n){o(`Failed to enhance analysis table: ${n.message}`)}s(`Enhanced ${t} of ${e.length} analysis table(s) (non-interactive)`)}(),!1!==e.autoEnhanceHomeBadges&&function(){const e=document.querySelectorAll(".quizPageBtn");if(0===e.length)return void s("No .quizPageBtn links found, skipping badge enhancement");s(`Enhancing home page badges for ${e.length} link(s)...`);try{document.querySelectorAll(".quizPageBtn").forEach(e=>{const t=function(e){const t=e.getAttribute("href");return t&&t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(e);t?(e.setAttribute("data-page-id",t),s(`Set data-page-id="${t}" for link: ${e.textContent?.trim()}`)):s(`Failed to extract pageId from href: ${e.getAttribute("href")}`)}),nn(),document.addEventListener("qd:state-changed",sn),document.addEventListener("qd:cache-rebuild",rn),document.addEventListener("qd:logout",on),s("Home page badges enhanced with event listeners"),s("Home page badges enhanced")}catch(t){o(`Failed to enhance home badges: ${t.message}`)}}(),await async function(){const e=w(l.SESSION);if(!e)return void s("No existing session, tables remain in non-interactive mode");if("true"===sessionStorage.getItem(l.INSTRUCTOR)){s("Instructor session detected, revealing answers in non-interactive tables");const e=window.location.pathname,t=e.substring(e.lastIndexOf("/")+1).replace(/\.html?$/i,"");return void document.querySelectorAll("table.qd-quiz").forEach(e=>{const n=W(e);if(!n)return;n.pageId=t;e.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(e=>{e.classList.remove("qd-hidden")});e.querySelectorAll("tbody td:nth-child(2)").forEach((e,t)=>{const s=n.parsed.questions[t];s&&e instanceof HTMLTableCellElement&&(e.textContent=s.correctAnswer)});e.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(e=>e.classList.remove("qd-hidden"));const s=()=>{J(e,n)},r=()=>{G(e)};document.addEventListener("qd:instructor-show-answers",s),document.addEventListener("qd:instructor-hide-answers",r);"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&s()})}s(`Existing session detected for ${e.serviceId}, upgrading tables to interactive mode`);const t=P();let n=w(l.CACHE);if(!n){s("Cache not found, rebuilding from IndexedDB...");try{const r=await t.loadStudentRecord(e);n=t.buildCache(r),S(l.CACHE,n),s(`Cache rebuilt from IndexedDB: ${n.totals.total} total questions`)}catch{o("Failed to rebuild cache from IndexedDB, using empty cache"),n={totals:{total:0,answered:0,correct:0},pages:{}},S(l.CACHE,n)}}const r=window.location.pathname,a=r.substring(r.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!a)return void s("No pageId found, skipping table upgrade");const d=document.querySelectorAll("table.qd-quiz");d.length>0&&(s(`Upgrading ${d.length} quiz table(s) to interactive mode...`),d.forEach(e=>{F(e,{interactive:!0,pageId:a})}));const c=document.querySelectorAll("table.qd-analysis");c.length>0&&(s(`Upgrading ${c.length} analysis table(s) to interactive mode...`),c.forEach(e=>{se(e,{interactive:!0,pageId:a})}))}(),an.initialized=!0,s("Bootstrap complete")}if("undefined"!=typeof window){const e=()=>{s("Auto-initializing Sonar Quiz System");const e=function(){s("Reading configuration from DOM...");const e={statusPanelContainer:ft(ht,dt),titleSelector:ft(pt,ct),instructorHash:ft(gt,lt),dbName:ft(mt,ut)};return s("Configuration loaded:",e),e}();dn({debug:true,dbName:e.dbName,statusPanelContainer:e.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{e()}):e()}return e.BUILD_DATE="2025-11-20",e.DEFAULT_CONTAINERS=Zt,e.Debouncer=Debouncer,e.SCHEMA_VERSION=1,e.SESSION_TIMEOUT_MS=c,e.STORAGE_KEYS=l,e.VERSION="0.1.0-phase3.1",e.bootstrap=dn,e.calculateCompletionState=T,e.cleanup=function(){an.initialized?(s("Cleaning up bootstrap resources..."),an.eventCoordinator?.cleanup(),an.sessionCoordinator?.cleanup(),an.initialized=!1,an.eventCoordinator=void 0,an.sessionCoordinator=void 0,s("Bootstrap cleanup complete")):o("Bootstrap not initialized, nothing to cleanup")},e.clearQuizData=x,e.enhanceAnalysisTable=se,e.enhanceQuizTable=F,e.error=r,e.generateCellKey=Y,e.generateTableId=X,e.getAnalysisTableMetadata=function(e){return ne.get(e)},e.getJSON=w,e.getQuizTableMetadata=W,e.info=s,e.injectComponents=Xt,e.isAnalysisTableEnhanced=function(e){return ne.has(e)},e.isCellEditable=ee,e.isInitialized=function(){return an.initialized},e.isQuizTableEnhanced=function(e){return B.has(e)},e.parseAnalysisTable=te,e.parseQuizTable=a,e.setJSON=S,e.validateAnswer=d,e.warn=o,Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),e}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
