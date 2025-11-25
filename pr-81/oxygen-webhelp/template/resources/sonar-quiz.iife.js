var SonarQuiz=function(t){"use strict";function n(t){if(t.length<2)return"**";if(2===t.length)return t;return t.slice(0,2)+"*".repeat(t.length-2)}function s(t){if(null===t||"object"!=typeof t)return t;const o={};for(const[r,a]of Object.entries(t))"name"!==r&&"passwordHash"!==r&&(o[r]="serviceId"!==r||"string"!=typeof a?"object"!=typeof a||null===a?a:s(a):n(a));return o}function o(t,n){void 0!==n?console.log(`[INFO] ${t}`,s(n)):console.log(`[INFO] ${t}`)}function r(t,n){if(n instanceof Error){const s={name:n.name,message:n.message};console.error(`[ERROR] ${t}`,s)}else void 0!==n?console.error(`[ERROR] ${t}`,s(n)):console.error(`[ERROR] ${t}`)}function a(t,n){void 0!==n?console.warn(`[WARN] ${t}`,s(n)):console.warn(`[WARN] ${t}`)}function c(t){const n=[],s=[];if(!t.classList.contains("qd-quiz"))return n.push('Table must have class "qd-quiz"'),{element:t,questions:s,errors:n};const o=Array.from(t.querySelectorAll("tbody tr"));return 0===o.length?(n.push("Quiz table has no data rows"),{element:t,questions:s,errors:n}):(o.forEach((t,o)=>{const r=Array.from(t.querySelectorAll("td"));if(3!==r.length)return void n.push(`Row ${o+1} has ${r.length} columns, expected 3 (Question | Answer | Detail)`);const a=r[0],c=r[1],d=r[2];if(!a||!c||!d)return;const l=a.textContent?.trim()||"";if(!l)return void n.push(`Row ${o+1} has empty question text`);const u=c.textContent?.trim()||"";if(!u)return void n.push(`Row ${o+1} has empty answer`);const h=d.querySelector("ol");if(h){const t=(p=h,Array.from(p.querySelectorAll("li")).map(t=>t.textContent?.trim()||"").filter(t=>t.length>0));if(0===t.length)return void n.push(`Row ${o+1} MCQ has no options in <ol>`);s.push({text:l,kind:"mcq",correctAnswer:u,options:t})}else{const t=d.textContent?.trim()||"",r=parseFloat(t);if(isNaN(r))return void n.push(`Row ${o+1} appears to be numeric but has invalid tolerance: "${t}"`);s.push({text:l,kind:"numeric",correctAnswer:u,tolerance:r})}var p}),{element:t,questions:s,errors:n.length>0?n:void 0})}function d(t,n){if(!n||""===n.trim())return!1;const s=n.trim();if("mcq"===t.kind)return s===t.correctAnswer;{const n=parseFloat(s),o=parseFloat(t.correctAnswer);if(isNaN(n)||isNaN(o))return!1;const r=t.tolerance??0;return Math.abs(n-o)<=r}}const l=18e5,u={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},h=3,p=3e4;class SessionService{createSession(t,n,s){const r=new Date,a=r.toISOString(),c={serviceId:t,name:n,release:s,loginTime:a,lastActivity:a,expiresAt:new Date(r.getTime()+l).toISOString(),instructorUnlocked:!1};return this.saveSession(c),o(`Session created for ${t} (${n})`),this.emitEvent("qd:login",{serviceId:t,name:n,release:s,loginTime:a}),c}getSession(){try{const t=sessionStorage.getItem(u.SESSION);if(!t)return null;const n=JSON.parse(t);return n.serviceId&&n.release&&n.expiresAt?n:(a("Invalid session data, missing required fields"),null)}catch(t){return r("Failed to parse session data",t),null}}updateActivity(){const t=this.getSession();if(!t)return;const n=new Date;t.lastActivity=n.toISOString(),t.expiresAt=new Date(n.getTime()+l).toISOString(),this.saveSession(t)}isExpired(){const t=this.getSession();return!t||function(t,n=new Date){const s=new Date(t);return!!isNaN(s.getTime())||n>=s}(t.expiresAt)}clearSession(){const t=this.getSession();sessionStorage.removeItem(u.SESSION),sessionStorage.removeItem(u.CACHE),sessionStorage.removeItem(u.INSTRUCTOR),sessionStorage.removeItem("qd/instructor/showAnswers"),t&&(o(`Session cleared for ${t.serviceId}`),this.emitEvent("qd:logout",{serviceId:t.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!0,t.unlockTime=(new Date).toISOString(),this.saveSession(t),o("Instructor mode unlocked"),this.emitEvent("qd:instructor-unlock",{timestamp:t.unlockTime}))}lockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!1,delete t.unlockTime,this.saveSession(t),o("Instructor mode locked"),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const t=this.getSession();return!0===t?.instructorUnlocked}getCache(){try{const t=sessionStorage.getItem(u.CACHE);return t?JSON.parse(t):null}catch(t){return r("Failed to parse cache data",t),null}}saveCache(t){try{sessionStorage.setItem(u.CACHE,JSON.stringify(t))}catch(n){r("Failed to save cache",n)}}clearCache(){sessionStorage.removeItem(u.CACHE)}saveSession(t){try{sessionStorage.setItem(u.SESSION,JSON.stringify(t))}catch(n){r("Failed to save session",n)}}emitEvent(t,n){try{const s=new CustomEvent(t,{detail:n,bubbles:!0});document.dispatchEvent(s)}catch(s){r(`Failed to emit event ${t}`,s)}}}function g(t,n){const s=n.answers.length,o=n.answers.filter(t=>""!==t.answer.trim()).length,r=n.answers.filter(t=>t.success).length;return{state:n.state,total:s,answered:o,correct:r,last:n.lastAttempted,answers:n.answers,analysis:n.analysis}}function m(t){return function(t,n="display"){if(null==t)return console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date";const s="string"==typeof t?new Date(t):t;return isNaN(s.getTime())?(console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date"):"csv"===n?function(t){return t.toISOString()}(s):function(t){return`${t.toLocaleDateString("en-US",{month:"short"})} ${t.getDate()} ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`}(s)}(t,"display")}class Debouncer{constructor(){this.timers=new Map}debounce(t,n,s=200){const o=this.timers.get(t);void 0!==o&&clearTimeout(o);const r=setTimeout(()=>{this.timers.delete(t),n()},s);this.timers.set(t,r)}cancel(t){const n=this.timers.get(t);return void 0!==n&&(clearTimeout(n),this.timers.delete(t),!0)}cancelAll(){let t=0;for(const n of this.timers.values())clearTimeout(n),t++;return this.timers.clear(),t}isPending(t){return this.timers.has(t)}getPendingCount(){return this.timers.size}}function f(t){const n=t.querySelector("tbody");return n?Array.from(n.querySelectorAll("tr")):[]}function b(t){return Array.from(t.cells)}function v(t){return t&&t.textContent?.trim()||""}function w(t,n,s){return document.createElement(t)}function y(t,...n){t.classList.add(...n)}function S(t,...n){t.classList.remove(...n)}function x(t,n,s){const o=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0,cancelable:!1});return document.dispatchEvent(o)}function $(t,n,s,o){const r=new CustomEvent(n,{detail:s,bubbles:!0,composed:!0,cancelable:!1});return t.dispatchEvent(r)}function E(t){try{const n=sessionStorage.getItem(t);return n?JSON.parse(n):null}catch(n){return a(`Failed to parse JSON from sessionStorage key: ${t}`,n),null}}function C(t,n){try{const s=JSON.stringify(n);return sessionStorage.setItem(t,s),!0}catch(s){return a(`Failed to store JSON in sessionStorage key: ${t}`,s),!1}}function A(){const t=[];for(let n=0;n<sessionStorage.length;n++){const s=sessionStorage.key(n);s&&s.startsWith("qd/")&&t.push(s)}for(const n of t)sessionStorage.removeItem(n);return t.length}function q(t,n){return`qd/${t}/u${n}`}class StorageError extends Error{constructor(t,n,s){super(t),this.operation=n,this.cause=s,this.name="StorageError",s?r(`Storage error in ${n}: ${t}`,s):r(`Storage error in ${n}: ${t}`)}}class StorageNotInitializedError extends StorageError{constructor(t){super("Storage adapter not initialized. Call init() first.",t),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(t){super("Storage quota exceeded. Please clear old data or free up space.",t),this.name="StorageQuotaError"}}const T="students",_="backups",O="auditLog";class IndexedDBStorageAdapter{constructor(t){if(this.db=null,this.initPromise=null,!t)throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");this.dbName=t}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=new Promise((t,n)=>{let s,o=!1;const c=()=>{s&&(clearTimeout(s),s=void 0)};s=window.setTimeout(()=>{if(o)return;o=!0,this.initPromise=null,a("IndexedDB open timed out after 5000ms - attempting recovery");const s=indexedDB.deleteDatabase(this.dbName);s.onsuccess=()=>{this.init().then(t).catch(n)},s.onerror=()=>{n(new StorageError(`Database "${this.dbName}" appears corrupted. Please clear site data in browser settings.`,"init"))},s.onblocked=()=>{n(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const d=indexedDB.open(this.dbName,3);d.onerror=()=>{o||(o=!0,c(),r(`IndexedDB open error: ${d.error?.message||"unknown"}`),this.initPromise=null,n(new StorageError("Failed to open database","init",d.error)))},d.onblocked=()=>{a("IndexedDB open blocked - close other tabs with this database")},d.onsuccess=()=>{if(!o){if(o=!0,c(),this.db=d.result,!this.db.objectStoreNames.contains(T)||!this.db.objectStoreNames.contains(_)||!this.db.objectStoreNames.contains(O)){a(`Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`),this.db.close(),this.db=null;const s=indexedDB.deleteDatabase(this.dbName);return s.onsuccess=()=>{this.initPromise=null,this.init().then(t).catch(n)},void(s.onerror=()=>{this.initPromise=null,n(new StorageError("Failed to delete corrupted database","init",s.error))})}this.initPromise=null,t()}},d.onupgradeneeded=t=>{const n=t.target.result,s=t.target.transaction;s&&(s.onerror=()=>{r(`Upgrade transaction error: ${s.error?.message||"unknown"}`)},s.onabort=()=>{r(`Upgrade transaction aborted: ${s.error?.message||"unknown"}`)});try{if(!n.objectStoreNames.contains(T)){const t=n.createObjectStore(T,{keyPath:null});t.createIndex("by-release","release",{unique:!1}),t.createIndex("by-service-id","serviceId",{unique:!1})}if(!n.objectStoreNames.contains(_)){const t=n.createObjectStore(_,{keyPath:null});t.createIndex("by-original-key","originalKey",{unique:!1}),t.createIndex("by-timestamp","timestamp",{unique:!1})}if(!n.objectStoreNames.contains(O)){const t=n.createObjectStore(O,{keyPath:"eventId"});t.createIndex("by-service-id","serviceId",{unique:!1}),t.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(o){throw r("Error during database upgrade",o),o}}}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(t,n){const s=this.ensureInitialized(),o=q(t,n);return new Promise((t,n)=>{try{const r=s.transaction(T,"readonly"),a=r.objectStore(T).get(o);a.onsuccess=()=>{t(a.result||null)},a.onerror=()=>{n(new StorageError("Failed to get student record","getStudent",a.error))}}catch(r){n(new StorageError("Failed to get student record","getStudent",r))}})}async saveStudent(t){const n=this.ensureInitialized(),s=q(t.release,t.serviceId);return new Promise((o,r)=>{try{const a=n.transaction(T,"readwrite"),c=a.objectStore(T).put(t,s);c.onsuccess=()=>{o()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?r(new StorageQuotaError("saveStudent")):r(new StorageError("Failed to save student record","saveStudent",c.error))},a.onerror=()=>{r(new StorageError("Transaction failed while saving student","saveStudent",a.error))}}catch(a){r(new StorageError("Failed to save student record","saveStudent",a))}})}async getStudentsByRelease(t){const n=this.ensureInitialized();return new Promise((s,o)=>{try{const r=n.transaction(T,"readonly").objectStore(T),a=r.index("by-release").getAll(t);a.onsuccess=()=>{s(a.result||[])},a.onerror=()=>{o(new StorageError("Failed to get students by release","getStudentsByRelease",a.error))}}catch(r){o(new StorageError("Failed to get students by release","getStudentsByRelease",r))}})}async clearAll(){const t=this.ensureInitialized();return new Promise((n,s)=>{try{const o=t.transaction([T,_,O],"readwrite"),r=o.objectStore(T),a=o.objectStore(_),c=o.objectStore(O),d=r.clear(),l=a.clear(),u=c.clear();let h=!1,p=!1,g=!1;d.onsuccess=()=>{h=!0,p&&g&&n()},l.onsuccess=()=>{p=!0,h&&g&&n()},u.onsuccess=()=>{g=!0,h&&p&&n()},d.onerror=()=>{s(new StorageError("Failed to clear students","clearAll",d.error))},l.onerror=()=>{s(new StorageError("Failed to clear backups","clearAll",l.error))},u.onerror=()=>{s(new StorageError("Failed to clear audit log","clearAll",u.error))},o.onerror=()=>{s(new StorageError("Transaction failed during clearAll","clearAll",o.error))}}catch(o){s(new StorageError("Failed to clear all data","clearAll",o))}})}async backup(t){const n=this.ensureInitialized(),s=(new Date).toISOString(),o=`backup_${s}_${t.serviceId}`,r=q(t.release,t.serviceId),a={...t,originalKey:r,timestamp:s};return new Promise((t,s)=>{try{const r=n.transaction(_,"readwrite"),c=r.objectStore(_).put(a,o);c.onsuccess=()=>{t()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?s(new StorageQuotaError("backup")):s(new StorageError("Failed to create backup","backup",c.error))},r.onerror=()=>{s(new StorageError("Transaction failed during backup","backup",r.error))}}catch(r){s(new StorageError("Failed to create backup","backup",r))}})}async saveAuditEvent(t){const n=this.ensureInitialized();return new Promise((s,o)=>{try{const r=n.transaction(O,"readwrite"),a=r.objectStore(O).add(t);a.onsuccess=()=>{s()},a.onerror=()=>{o(new StorageError("Failed to save audit event","saveAuditEvent",a.error))}}catch(r){o(new StorageError("Failed to save audit event","saveAuditEvent",r))}})}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let P=null,D=null;function U(t){if(!t)throw new Error("FATAL: dbName is required for getStorageAdapter()");return P&&D!==t&&(P.close(),P=null),P||(P=new IndexedDBStorageAdapter(t),D=t),P}function j(t,n){return 0===n||function(t){return 0===t.length}(t)?"unstarted":function(t,n){if(t.length!==n)return!1;return t.every(t=>!0===t.success)}(t,n)?"complete":"incomplete"}class StorageService{constructor(t){if(!t)throw new Error("FATAL: dbName is required for StorageService");this.dbName=t,this.adapter=U(t)}async init(){try{await this.adapter.init(),o(`Storage service initialized (IndexedDB "${this.dbName}" ready)`)}catch(t){throw r("Failed to initialize storage service",t),t}}async loadStudentRecord(t){try{const n=await this.adapter.getStudent(t.release,t.serviceId);if(n)return o(`Loaded student record for ${t.serviceId} from IndexedDB`),n;const s={schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}};return o(`Created new student record for ${t.serviceId}`),s}catch(n){a(`IndexedDB error, creating new record: ${n.message}`);return{schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}}async saveStudentRecord(t){try{t.updated=(new Date).toISOString();const n=function(t){let n=0,s=0;for(const o in t){const r=t[o];if(r&&r.answers&&Array.isArray(r.answers)){const t=r.answers.filter(t=>""!==t.answer.trim());n+=t.length,s+=t.filter(t=>t.success).length}}return{attempted:n,correct:s}}(t.pages);t.attempted=n.attempted,t.correct=n.correct,await this.adapter.saveStudent(t),o(`Saved student record for ${t.serviceId} to IndexedDB`)}catch(n){throw r("Failed to save student record",n),n}}updateRecordWithAnswer(t,n,s,o,r){const a=t.pages[n]||{answers:[],state:"unstarted"};for(;a.answers.length<=s;)a.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});a.answers[s]=o;const c=(new Date).toISOString();return a.firstAttempted||(a.firstAttempted=c),a.lastAttempted=c,a.state=j(a.answers,r),{...t,pages:{...t.pages,[n]:a}}}buildCache(t){return function(t){const n={totals:{total:0,answered:0,correct:0},pages:{}};for(const[s,o]of Object.entries(t.pages)){const t=g(0,o);n.pages[s]=t,n.totals.total+=t.total,n.totals.answered+=t.answered,n.totals.correct+=t.correct}return n}(t)}async getStudentsByRelease(t){try{return await this.adapter.getStudentsByRelease(t)}catch(n){throw r("Failed to get students by release",n),n}}async clearAll(){try{await this.adapter.clearAll(),o("Cleared all data from IndexedDB")}catch(t){throw r("Failed to clear all data",t),t}}async backup(t){try{await this.adapter.backup(t),o(`Created backup for ${t.serviceId}`)}catch(n){a(`Failed to create backup for ${t.serviceId}`,n)}}}let B=null,F=null;function V(t){if(B&&!t)return B;if(B&&t&&F!==t)return a(`Storage service already initialized with dbName="${F}", ignoring new dbName="${t}"`),B;if(!B){if(!t)throw new Error("FATAL: dbName is required for first getStorageService() call");B=new StorageService(t),F=t}return B}const Q=Object.freeze(Object.defineProperty({__proto__:null,StorageService:StorageService,getStorageService:V},Symbol.toStringTag,{value:"Module"})),K=new WeakMap;function W(t,n){const s=K.get(t);let l;if(s){if(s.interactive||!n.interactive)return o("Quiz table already enhanced, skipping"),!0;o("Upgrading quiz table from non-interactive to interactive mode"),l=s.parsed}else l=c(t),l.errors&&l.errors.length>0&&r("Quiz table has validation errors:",l.errors);const h={parsed:l,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return r("Interactive mode requires pageId option"),!1;o(`Preparing interactive enhancement for pageId: ${n.pageId}`),h.debouncer=new Debouncer,h.inputs=[]}if(K.set(t,h),n.interactive){const n=function(t,n){const{parsed:s,pageId:c,debouncer:l}=n;if(!c||!l)return r("Interactive mode requires pageId and debouncer"),!1;(function(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&S(n[1],"qd-hidden");const s=t.querySelectorAll("tbody tr");s.forEach(t=>{const n=t.querySelectorAll("td");n[1]&&S(n[1],"qd-hidden")})})(t),G(t);if(!E(u.SESSION))return r("No active session found"),!1;let h=E(u.CACHE);h?o(`Cache loaded: ${h.totals.total} total questions, ${Object.keys(h.pages).length} pages`):(o("No cache found, creating empty cache"),h={totals:{total:0,answered:0,correct:0},pages:{}});const p=s.questions.length;h=function(t,n,s){const o=t.pages[n];if(o&&o.total>=s)return t;const r=s-(o?.total||0),a={state:o?.state||"unstarted",total:s,answered:o?.answered||0,correct:o?.correct||0,last:o?.last,answers:o?.answers,analysis:o?.analysis};return{totals:{total:t.totals.total+r,answered:t.totals.answered,correct:t.totals.correct},pages:{...t.pages,[n]:a}}}(h,c,p),C(u.CACHE,h);const g=h?.pages[c],m=g?.answers||[];o(`Page ${c}: ${m.length} existing answers, state: ${g?.state||"none"}`);const f=t.querySelector("tbody");if(!f)return r("Quiz table has no tbody element"),!1;const b=Array.from(f.querySelectorAll("tr")),v=[];s.questions.forEach((s,c)=>{const l=b[c];if(!l)return;const h=Array.from(l.querySelectorAll("td"));if(3!==h.length)return;const p=h[0],g=h[1];if(!p||!g)return;const f=m[c];f&&f.answer&&o(`Q${c+1}: Pre-filling with "${f.answer}" (${f.success?"correct":"incorrect"})`);const y=function(t,n){const s=function(t,n){if("mcq"===t.kind){const s=(t.options||[]).map((t,n)=>({value:String(n+1),text:`${n+1}. ${t}`}));return{type:"select",className:"qd-quiz-input",placeholder:"Select an answer...",value:n?.answer||"",options:s}}return{type:"text",className:"qd-quiz-input",placeholder:"Enter value",value:n?.answer||""}}(t,n);if("select"===s.type){const t=w("select");t.className=s.className;const n=w("option");return n.value="",n.textContent=s.placeholder,n.disabled=!0,t.appendChild(n),s.options&&s.options.forEach(n=>{const s=w("option");s.value=n.value,s.textContent=n.text,t.appendChild(s)}),t.value=s.value,t}{const t=w("input");return t.type=s.type,t.className=s.className,t.placeholder=s.placeholder,t.value=s.value,t}}(s,f);v.push(y),g.textContent="",g.appendChild(y),f&&J(g,f.success);const S="SELECT"===y.tagName?"change":"input";y.addEventListener(S,()=>{!function(t,n,s,c){const{debouncer:l,pageId:h,parsed:p}=n;if(!l||!h)return;const g=p.questions[s];if(!g)return;l.debounce(`save-answer-${s}`,()=>{!async function(t,n,s,c){const{pageId:l,parsed:h,inputs:p}=n;if(!l||!p)return;const g=h.questions[s];if(!g)return;const m=E(u.SESSION);if(!m)return void r("No active session found");const f=d(g,c),b={answer:c.trim(),success:f,timestamp:(new Date).toISOString()},v=V();let w;try{w=await v.loadStudentRecord(m)}catch(T){return void a("Failed to load student record, answer not saved",T)}const y=h.questions.length,S=v.updateRecordWithAnswer(w,l,s,b,y);try{await v.saveStudentRecord(S)}catch(T){a("Failed to save student record to IndexedDB",T)}const $=v.buildCache(S);C(u.CACHE,$);const A=t.querySelector(`tbody tr:nth-child(${s+1})`);if(A){const t=A.querySelector("td:nth-child(2)");t&&J(t,f)}x("qd:answer-saved",{pageId:l,answer:b});const q=S.pages[l];q&&x("qd:state-changed",{pageId:l,state:q.state});o(`Answer saved for question ${s+1} on page ${l}: ${f?"correct":"incorrect"}`)}(t,n,s,c)},200)}(t,n,c,y.value)})}),n.inputs=v;const $=()=>{X(t,n)},A=()=>{ee(t)};document.addEventListener("qd:instructor-show-answers",$),document.addEventListener("qd:instructor-hide-answers",A);const q="true"===sessionStorage.getItem(u.INSTRUCTOR),T="true"===sessionStorage.getItem("qd/instructor/showAnswers");q&&T&&X(t,n);const _=()=>{t.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(t=>{S(t,"qd-answer-correct","qd-answer-incorrect")}),ee(t),o("Cleared student UI state from quiz table on logout")};return document.addEventListener("qd:logout",_),n.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",$),document.removeEventListener("qd:instructor-hide-answers",A),document.removeEventListener("qd:logout",_)},y(t,"qd-quiz-interactive"),o(`Quiz table enhanced in interactive mode for page ${c}`),!0}(t,h);return n?o(`Interactive enhancement succeeded for table with ${l.questions.length} questions`):r("Interactive enhancement failed"),n}return function(t){return function(t){const n=t.querySelector("colgroup");n&&n.remove()}(t),Y(t),G(t),y(t,"qd-quiz-non-interactive"),o("Quiz table enhanced in non-interactive mode"),!0}(t)}function J(t,n){S(t,"qd-answer-correct","qd-answer-incorrect"),y(t,n?"qd-answer-correct":"qd-answer-incorrect")}function Y(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&y(n[1],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[1]&&(y(n[1],"qd-hidden"),n[1].textContent="")})}function G(t){const n=t.querySelectorAll("thead th, thead td");n[2]&&y(n[2],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[2]&&y(n[2],"qd-hidden")})}function Z(t){return K.get(t)}async function X(t,n){const{pageId:s,parsed:a}=n;if(!s)return;const c=E(u.SESSION);if(!c)return;const{getStorageService:d}=await Promise.resolve().then(()=>Q),l=d();try{const n=await l.getStudentsByRelease(c.release);if(0===n.length)return o("No student data available for this release"),void alert("No student data available for this release. Students need to log in and answer questions first.");const r=t.querySelector("tbody");if(!r)return;const d=Array.from(r.querySelectorAll("tr"));a.questions.forEach((t,o)=>{const r=d[o];if(!r)return;const a=Array.from(r.querySelectorAll("td"))[1];if(!a)return;const c=a.querySelector(".qd-student-answers");c&&c.remove();const l=function(t,n,s){const o=[];for(const r of t){const t=r.pages[n];if(!t||!t.answers)continue;const a=t.answers[s];a&&o.push({name:r.name,maskedServiceId:r.serviceId.slice(-4),answer:a.answer,success:a.success,formattedTimestamp:m(a.timestamp),cssClass:a.success?"qd-correct":"qd-incorrect"})}return o}(n,s,o);if(l.length>0){const t=document.createElement("div");t.className="qd-student-answers",l.forEach(n=>{const s=document.createElement("div");s.className=`qd-student-answer ${n.cssClass}`,s.innerHTML=`\n            <span class="qd-student-name">${n.name} (${n.maskedServiceId})</span>:\n            <span class="qd-student-answer-text">${n.answer}</span>\n            <span class="qd-timestamp">${n.formattedTimestamp}</span>\n          `,t.appendChild(s)}),a.appendChild(t)}}),o(`Displayed student answers for ${n.length} students on page ${s}`)}catch(h){r("Failed to load student answers",h)}}function ee(t){t.querySelectorAll(".qd-student-answers").forEach(t=>t.remove()),o("Hid student answers from quiz table")}function te(t,n=16){let s=5381;for(let r=0;r<t.length;r++){s=(s<<5)+s+t.charCodeAt(r),s&=s}const o=Math.abs(s).toString(16).padStart(8,"0");return o.repeat(Math.ceil(n/o.length)).substring(0,n)}function ne(t){const n=f(t),s=n[0],o=s?b(s).length:0,r=t.className||"qd-analysis";return te(`${n.length}x${o}:${r}`,16)}function se(t,n,s){return`R${t}C${n}#f:${te(s.replace(/\s+/g," ").trim(),8)}`}function oe(t){return t.classList.contains("interactive")}function re(t){const n=[];t.querySelector("tbody")||n.push("Analysis table must have a tbody element");const s=f(t);0===s.length&&n.push("Analysis table must have at least one row");const o=ne(t),r=[];return s.forEach((t,n)=>{b(t).forEach((t,s)=>{if(oe(t)){const o=v(t),a=se(n,s,o);r.push({row:n,col:s,key:a})}})}),{element:t,tableId:o,editableCells:r,errors:n.length>0?n:void 0}}const ie=new WeakMap;function ae(t,n){const s=re(t);s.errors&&s.errors.length>0&&r("Analysis table has validation errors:",s.errors);const c={parsed:s,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return r("Interactive mode requires pageId option"),!1;c.debouncer=new Debouncer,c.cellKeyMap=new Map}return ie.set(t,c),n.interactive?function(t,n){const{parsed:s,pageId:c,debouncer:d,cellKeyMap:l}=n;if(!c||!d||!l)return r("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!E(u.SESSION))return r("No active session found"),!1;const h=E(u.CACHE),p=h?.pages[c],g=p?.analysis,m=g?.cells||{},w=f(t);return s.editableCells.forEach(({row:t,col:s,key:c})=>{const d=w[t];if(!d)return;const h=b(d)[s];h&&(oe(h)?(l.set(h,c),m[c]&&(h.textContent=m[c]),h.contentEditable="true",y(h,"qd-editable"),h.addEventListener("input",()=>{!function(t,n,s){const{debouncer:c,pageId:d}=t;if(!c||!d)return;const l=v(n);c.debounce(`save-cell-${s}`,()=>{!async function(t,n,s){const{pageId:c,parsed:d}=t;if(!c)return;const l=E(u.SESSION);if(!l)return void r("No active session found");const h=V();let p;try{p=await h.loadStudentRecord(l)}catch(v){return void a("Failed to load student record, analysis not saved",v)}const g=p.pages[c]||{answers:[],state:"unstarted"},m=g.analysis||{tableId:d.tableId,cells:{}};m.cells[n]=s;const f=(new Date).toISOString();m.firstEdited||(m.firstEdited=f);m.lastEdited=f,g.analysis=m,p.pages[c]=g,p.updated=f;try{await h.saveStudentRecord(p)}catch(v){a("Failed to save student record to IndexedDB",v)}const b=h.buildCache(p);C(u.CACHE,b),x("qd:analysis-saved",{pageId:c,tableId:d.tableId,cellKey:n,content:s}),o(`Analysis cell saved for ${n} on page ${c}`)}(t,s,l)},500)}(n,h,c)})):r(`Cell at R${t}C${s} is no longer editable`))}),y(t,"qd-analysis-interactive"),o(`Analysis table enhanced in interactive mode for page ${c}`),!0}(t,c):function(t){y(t,"qd-analysis-non-interactive");const n=()=>{!async function(t){const n=ie.get(t);if(!n)return void a("Cannot show student entries: table not enhanced");const s=n.pageId||function(){const t=document.body.dataset.pageId;if(t)return t;const n=window.location.pathname,s=(n.split("/").pop()||"").replace(".html","");return s||void 0}();if(!s)return void a("Cannot show student entries: page ID not found");const c=E(u.SESSION);if(!c)return void a("Cannot show student entries: no active session");const d=V();let l;try{l=await d.getStudentsByRelease(c.release)}catch(v){return void r("Failed to load students for instructor view:",v)}const h=function(t,n){const s={};return t.forEach(t=>{const o=t.pages[n];if(!o||!o.analysis)return;const{cells:r}=o.analysis,a=o.analysis.lastEdited||t.updated;Object.entries(r).forEach(([n,o])=>{s[n]||(s[n]=[]),s[n].push({serviceId:t.serviceId,name:t.name,content:o,timestamp:a})})}),s}(l,s),{editableCells:p}=n.parsed,g=f(t);p.forEach(({row:t,col:n,key:s})=>{const o=g[t];if(!o)return;const r=b(o)[n];if(!r)return;const a=function(t){const n=document.createElement("div");if(n.className="qd-student-entries",0===t.length)return n.className+=" qd-no-entries",n.textContent="(No entries yet)",n.style.cssText="color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;",n;const s=function(t){return[...t].sort((t,n)=>{const s=new Date(t.timestamp).getTime();return new Date(n.timestamp).getTime()-s})}(t);return s.forEach(t=>{const s=document.createElement("div");s.className="qd-entry",s.style.cssText="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";const o=t.serviceId.slice(-4),r=m(t.timestamp),a=document.createElement("span");a.style.cssText="font-weight: 600; color: #374151;",a.textContent=`${t.name} (${o}) • ${r}: `;const c=document.createElement("span");c.style.cssText="white-space: pre-wrap;",c.textContent=t.content,s.appendChild(a),s.appendChild(c),n.appendChild(s)}),n.style.cssText="margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;",n}(h[s]||[]);a.setAttribute("data-qd-student-entries","true");const c=r.querySelector("[data-qd-student-entries]");c&&c.remove(),r.appendChild(a)}),o(`Displayed student entries for ${p.length} cells`)}(t)},s=()=>{ce(t)};return document.addEventListener("qd:instructor-show-answers",n),document.addEventListener("qd:instructor-hide-answers",s),o("Analysis table enhanced in non-interactive mode with instructor view support"),!0}(t)}function ce(t){t.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove()),o("Hidden student entries from analysis table")}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers(),o("Event coordinator initialized")}registerLoginHandlers(){this.addEventListener("qd:login",t=>{(async()=>{const n=t.detail;if(o(`Login event: ${n.serviceId} (${n.name})`),"INSTRUCTOR"===n.serviceId)return void o("Instructor login - skipping student record handling");const s=E(u.SESSION);if(!s)return void o("No session found in storage, skipping cache rebuild");const r=V();let a,c;try{a=await r.loadStudentRecord(s),await r.saveStudentRecord(a),c=r.buildCache(a),C(u.CACHE,c),o(`Cache built from IndexedDB: ${c.totals.total} total questions`)}catch{o("Failed to load from IndexedDB, initializing empty cache");C(u.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}this.dispatchEvent("qd:cache-rebuild",{}),this.upgradeTablesAfterLogin()})()})}upgradeTablesAfterLogin(){const t=window.location.pathname,n=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!n)return void o("No pageId found, skipping table upgrade to interactive mode");if("true"===sessionStorage.getItem(u.INSTRUCTOR)){o("Instructor session detected, tables remain in non-interactive mode with answers visible");return void document.querySelectorAll("table.qd-quiz").forEach(t=>{const s=Z(t);if(!s)return;s.pageId=n;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,n)=>{const o=s.parsed.questions[n];o&&t instanceof HTMLTableCellElement&&(t.textContent=o.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const o=()=>{X(t,s)};document.addEventListener("qd:instructor-show-answers",o),document.addEventListener("qd:instructor-hide-answers",()=>{ee(t)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&o()})}const s=document.querySelectorAll("table.qd-quiz");s.length>0&&(o(`Upgrading ${s.length} quiz table(s) to interactive mode...`),s.forEach(t=>{W(t,{interactive:!0,pageId:n})}));const r=document.querySelectorAll("table.qd-analysis");r.length>0&&(o(`Upgrading ${r.length} analysis table(s) to interactive mode...`),r.forEach(t=>{ae(t,{interactive:!0,pageId:n})}))}registerLogoutHandlers(){this.addEventListener("qd:logout",t=>{o(`Logout event: ${t.detail.serviceId}`);document.querySelectorAll("table.qd-quiz").forEach(t=>{!function(t){const n=K.get(t);n&&(n.interactive=!1,n.pageId=void 0,n.inputs=void 0,n.cleanupInstructorListeners?.(),n.cleanupInstructorListeners=void 0,Y(t),G(t),S(t,"qd-quiz-interactive"),o("Quiz table reset to non-interactive mode"))}(t)});document.querySelectorAll("table.qd-analysis").forEach(t=>{!function(t){const n=ie.get(t);n&&(ce(t),n.interactive&&(t.querySelectorAll(".qd-editable").forEach(t=>{t instanceof HTMLTableCellElement&&(t.contentEditable="false",t.classList.remove("qd-editable"),t.textContent="")}),t.classList.remove("qd-analysis-interactive"),n.debouncer?.cancelAll()),n.interactive=!1,n.pageId=void 0,n.debouncer=void 0,n.cellKeyMap=void 0,o("Reset analysis table to non-interactive mode"))}(t)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",t=>{const n=t.detail;o(`Answer saved: ${n.pageId} Q${n.questionIndex} = ${n.answer} (${n.success?"correct":"incorrect"})`),this.dispatchEvent("qd:cache-update",{pageId:n.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",t=>{const n=t.detail;o(`State changed: ${n.pageId} → ${n.state}`),this.dispatchEvent("qd:badge-update",{pageId:n.pageId,state:n.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",t=>{o(`Instructor mode unlocked at ${t.detail.unlockTime}`)}),this.addEventListener("qd:instructor-lock",()=>{o("Instructor mode locked")})}registerDataHandlers(){this.addEventListener("qd:data-cleared",t=>{o(`All data cleared at ${t.detail.timestamp}`),this.dispatchEvent("qd:cache-clear",{})})}addEventListener(t,n){document.addEventListener(t,n);const s=this.listeners.get(t)||[];s.push(n),this.listeners.set(t,s)}dispatchEvent(t,n){const s=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0});document.dispatchEvent(s)}cleanup(){for(const[t,n]of this.listeners)for(const s of n)document.removeEventListener(t,s);this.listeners.clear(),o("Event coordinator cleaned up")}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const t=this.sessionService.getSession();if(t){if(o(`Existing session loaded for ${t.serviceId}`),this.sessionService.isExpired())return a("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(t),this.setupActivityTracking()}else o("No existing session found")}scheduleExpiryCheck(t){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const n=(new Date).getTime(),s=new Date(t.expiresAt).getTime()-n;s<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{o("Session expired (timeout)"),this.sessionService.clearSession()},s)}setupActivityTracking(){const t=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const t=this.sessionService.getSession();t&&this.scheduleExpiryCheck(t)};let n;const s=()=>{void 0!==n&&window.clearTimeout(n),n=window.setTimeout(()=>{t()},5e3)};["click","keydown","scroll","mousemove"].forEach(t=>{document.addEventListener(t,s,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const de=globalThis,le=de.ShadowRoot&&(void 0===de.ShadyCSS||de.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ue=Symbol(),he=new WeakMap;let pe=class{constructor(t,n,s){if(this._$cssResult$=!0,s!==ue)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o;const n=this.t;if(le&&void 0===t){const s=void 0!==n&&1===n.length;s&&(t=he.get(n)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&he.set(n,t))}return t}toString(){return this.cssText}};const ge=(t,...n)=>{const s=1===t.length?t[0]:n.reduce((n,s,o)=>n+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new pe(s,t,ue)},me=le?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let n="";for(const s of t.cssRules)n+=s.cssText;return(t=>new pe("string"==typeof t?t:t+"",void 0,ue))(n)})(t):t,{is:fe,defineProperty:be,getOwnPropertyDescriptor:ve,getOwnPropertyNames:we,getOwnPropertySymbols:ye,getPrototypeOf:Se}=Object,xe=globalThis,$e=xe.trustedTypes,Ee=$e?$e.emptyScript:"",Ie=xe.reactiveElementPolyfillSupport,Ce=(t,n)=>t,Ae={toAttribute(t,n){switch(n){case Boolean:t=t?Ee:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,n){let s=t;switch(n){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(o){s=null}}return s}},qe=(t,n)=>!fe(t,n),ke={attribute:!0,type:String,converter:Ae,reflect:!1,useDefault:!1,hasChanged:qe};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),xe.litPropertyMetadata??=new WeakMap;let Te=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=ke){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){const s=Symbol(),o=this.getPropertyDescriptor(t,s,n);void 0!==o&&be(this.prototype,t,o)}}static getPropertyDescriptor(t,n,s){const{get:o,set:r}=ve(this.prototype,t)??{get(){return this[n]},set(t){this[n]=t}};return{get:o,set(n){const a=o?.call(this);r?.call(this,n),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??ke}static _$Ei(){if(this.hasOwnProperty(Ce("elementProperties")))return;const t=Se(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Ce("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ce("properties"))){const t=this.properties,n=[...we(t),...ye(t)];for(const s of n)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const n=litPropertyMetadata.get(t);if(void 0!==n)for(const[t,s]of n)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[n,s]of this.elementProperties){const t=this._$Eu(n,s);void 0!==t&&this._$Eh.set(t,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const n=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)n.unshift(me(t))}else void 0!==t&&n.push(me(t));return n}static _$Eu(t,n){const s=n.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,n=this.constructor.elementProperties;for(const s of n.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(le)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of n){const n=document.createElement("style"),o=de.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=s.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,s){this._$AK(t,s)}_$ET(t,n){const s=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,s);if(void 0!==o&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:Ae).toAttribute(n,s.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,n){const s=this.constructor,o=s._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=s.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:Ae;this._$Em=o;const a=r.fromAttribute(n,t.type);this[o]=a??this._$Ej?.get(o)??a,this._$Em=null}}requestUpdate(t,n,s){if(void 0!==t){const o=this.constructor,r=this[t];if(s??=o.getPropertyOptions(t),!((s.hasChanged??qe)(r,n)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,n,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,n,{useDefault:s,reflect:o,wrapped:r},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??n??this[t]),!0!==r||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||s||(n=void 0),this._$AL.set(t,n)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,n]of this._$Ep)this[t]=n;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[n,s]of t){const{wrapped:t}=s,o=this[n];!0!==t||this._$AL.has(n)||void 0===o||this.C(n,void 0,s,o)}}let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};Te.elementStyles=[],Te.shadowRootOptions={mode:"open"},Te[Ce("elementProperties")]=new Map,Te[Ce("finalized")]=new Map,Ie?.({ReactiveElement:Te}),(xe.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const _e=globalThis,Ne=_e.trustedTypes,Oe=Ne?Ne.createPolicy("lit-html",{createHTML:t=>t}):void 0,Pe="$lit$",Le=`lit$${Math.random().toFixed(9).slice(2)}$`,De="?"+Le,ze=`<${De}>`,Re=document,Me=()=>Re.createComment(""),Ue=t=>null===t||"object"!=typeof t&&"function"!=typeof t,He=Array.isArray,je="[ \t\n\f\r]",Be=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Fe=/-->/g,Ve=/>/g,Qe=RegExp(`>|${je}(?:([^\\s"'>=/]+)(${je}*=${je}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Ke=/'/g,We=/"/g,Je=/^(?:script|style|textarea|title)$/i,Ye=(tt=1,(t,...n)=>({_$litType$:tt,strings:t,values:n})),Ge=Symbol.for("lit-noChange"),Ze=Symbol.for("lit-nothing"),Xe=new WeakMap,et=Re.createTreeWalker(Re,129);var tt;function nt(t,n){if(!He(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==Oe?Oe.createHTML(n):n}class N{constructor({strings:t,_$litType$:n},s){let o;this.parts=[];let r=0,a=0;const c=t.length-1,d=this.parts,[l,u]=((t,n)=>{const s=t.length-1,o=[];let r,a=2===n?"<svg>":3===n?"<math>":"",c=Be;for(let d=0;d<s;d++){const n=t[d];let s,l,u=-1,h=0;for(;h<n.length&&(c.lastIndex=h,l=c.exec(n),null!==l);)h=c.lastIndex,c===Be?"!--"===l[1]?c=Fe:void 0!==l[1]?c=Ve:void 0!==l[2]?(Je.test(l[2])&&(r=RegExp("</"+l[2],"g")),c=Qe):void 0!==l[3]&&(c=Qe):c===Qe?">"===l[0]?(c=r??Be,u=-1):void 0===l[1]?u=-2:(u=c.lastIndex-l[2].length,s=l[1],c=void 0===l[3]?Qe:'"'===l[3]?We:Ke):c===We||c===Ke?c=Qe:c===Fe||c===Ve?c=Be:(c=Qe,r=void 0);const p=c===Qe&&t[d+1].startsWith("/>")?" ":"";a+=c===Be?n+ze:u>=0?(o.push(s),n.slice(0,u)+Pe+n.slice(u)+Le+p):n+Le+(-2===u?d:p)}return[nt(t,a+(t[s]||"<?>")+(2===n?"</svg>":3===n?"</math>":"")),o]})(t,n);if(this.el=N.createElement(l,s),et.currentNode=this.el.content,2===n||3===n){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=et.nextNode())&&d.length<c;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(Pe)){const n=u[a++],s=o.getAttribute(t).split(Le),c=/([.?@])?(.*)/.exec(n);d.push({type:1,index:r,name:c[2],strings:s,ctor:"."===c[1]?H:"?"===c[1]?I:"@"===c[1]?L:k}),o.removeAttribute(t)}else t.startsWith(Le)&&(d.push({type:6,index:r}),o.removeAttribute(t));if(Je.test(o.tagName)){const t=o.textContent.split(Le),n=t.length-1;if(n>0){o.textContent=Ne?Ne.emptyScript:"";for(let s=0;s<n;s++)o.append(t[s],Me()),et.nextNode(),d.push({type:2,index:++r});o.append(t[n],Me())}}}else if(8===o.nodeType)if(o.data===De)d.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(Le,t+1));)d.push({type:7,index:r}),t+=Le.length-1}r++}}static createElement(t,n){const s=Re.createElement("template");return s.innerHTML=t,s}}function st(t,n,s=t,o){if(n===Ge)return n;let r=void 0!==o?s._$Co?.[o]:s._$Cl;const a=Ue(n)?void 0:n._$litDirective$;return r?.constructor!==a&&(r?._$AO?.(!1),void 0===a?r=void 0:(r=new a(t),r._$AT(t,s,o)),void 0!==o?(s._$Co??=[])[o]=r:s._$Cl=r),void 0!==r&&(n=st(t,r._$AS(t,n.values),r,o)),n}class M{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:n},parts:s}=this._$AD,o=(t?.creationScope??Re).importNode(n,!0);et.currentNode=o;let r=et.nextNode(),a=0,c=0,d=s[0];for(;void 0!==d;){if(a===d.index){let n;2===d.type?n=new R(r,r.nextSibling,this,t):1===d.type?n=new d.ctor(r,d.name,d.strings,this,t):6===d.type&&(n=new z(r,this,t)),this._$AV.push(n),d=s[++c]}a!==d?.index&&(r=et.nextNode(),a++)}return et.currentNode=Re,o}p(t){let n=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,n),n+=s.strings.length-2):s._$AI(t[n])),n++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,s,o){this.type=2,this._$AH=Ze,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const n=this._$AM;return void 0!==n&&11===t?.nodeType&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=st(this,t,n),Ue(t)?t===Ze||null==t||""===t?(this._$AH!==Ze&&this._$AR(),this._$AH=Ze):t!==this._$AH&&t!==Ge&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>He(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==Ze&&Ue(this._$AH)?this._$AA.nextSibling.data=t:this.T(Re.createTextNode(t)),this._$AH=t}$(t){const{values:n,_$litType$:s}=t,o="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(nt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(n);else{const t=new M(o,this),s=t.u(this.options);t.p(n),this.T(s),this._$AH=t}}_$AC(t){let n=Xe.get(t.strings);return void 0===n&&Xe.set(t.strings,n=new N(t)),n}k(t){He(this._$AH)||(this._$AH=[],this._$AR());const n=this._$AH;let s,o=0;for(const r of t)o===n.length?n.push(s=new R(this.O(Me()),this.O(Me()),this,this.options)):s=n[o],s._$AI(r),o++;o<n.length&&(this._$AR(s&&s._$AB.nextSibling,o),n.length=o)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){const n=t.nextSibling;t.remove(),t=n}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,s,o,r){this.type=1,this._$AH=Ze,this._$AN=void 0,this.element=t,this.name=n,this._$AM=o,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=Ze}_$AI(t,n=this,s,o){const r=this.strings;let a=!1;if(void 0===r)t=st(this,t,n,0),a=!Ue(t)||t!==this._$AH&&t!==Ge,a&&(this._$AH=t);else{const o=t;let c,d;for(t=r[0],c=0;c<r.length-1;c++)d=st(this,o[s+c],n,c),d===Ge&&(d=this._$AH[c]),a||=!Ue(d)||d!==this._$AH[c],d===Ze?t=Ze:t!==Ze&&(t+=(d??"")+r[c+1]),this._$AH[c]=d}a&&!o&&this.j(t)}j(t){t===Ze?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===Ze?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==Ze)}}class L extends k{constructor(t,n,s,o,r){super(t,n,s,o,r),this.type=5}_$AI(t,n=this){if((t=st(this,t,n,0)??Ze)===Ge)return;const s=this._$AH,o=t===Ze&&s!==Ze||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==Ze&&(s===Ze||o);o&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,n,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){st(this,t)}}const ot=_e.litHtmlPolyfillSupport;ot?.(N,R),(_e.litHtmlVersions??=[]).push("3.3.1");const rt=(t,n,s)=>{const o=s?.renderBefore??n;let r=o._$litPart$;if(void 0===r){const t=s?.renderBefore??null;o._$litPart$=r=new R(n.insertBefore(Me(),t),t,void 0,s??{})}return r._$AI(t),r},it=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let at=class extends Te{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=rt(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ge}};at._$litElement$=!0,at.finalized=!0,it.litElementHydrateSupport?.({LitElement:at});const ct=it.litElementPolyfillSupport;ct?.({LitElement:at}),(it.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const dt=t=>(n,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,n)}):customElements.define(t,n)},lt={attribute:!0,type:String,converter:Ae,reflect:!1,hasChanged:qe},ut=(t=lt,n,s)=>{const{kind:o,metadata:r}=s;let a=globalThis.litPropertyMetadata.get(r);if(void 0===a&&globalThis.litPropertyMetadata.set(r,a=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),a.set(s.name,t),"accessor"===o){const{name:o}=s;return{set(s){const r=n.get.call(this);n.set.call(this,s),this.requestUpdate(o,r,t)},init(n){return void 0!==n&&this.C(o,void 0,t,n),n}}}if("setter"===o){const{name:o}=s;return function(s){const r=this[o];n.call(this,s),this.requestUpdate(o,r,t)}}throw Error("Unsupported decorator location: "+o)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function ht(t){return(n,s)=>"object"==typeof s?ut(t,n,s):((t,n,s)=>{const o=n.hasOwnProperty(s);return n.constructor.createProperty(s,t),o?Object.getOwnPropertyDescriptor(n,s):void 0})(t,n,s)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function pt(t){return ht({...t,state:!0,attribute:!1})}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const gt=".wh_top_menu_and_indexterms_link",mt=".wh_publication_title .title",ft="",bt="qd-status-container",vt="qd-title-selector",wt="qd-instructor-hash",yt="qd-db-name";function St(t,n){const s=document.querySelector(`#${t}`);if(!s)return n;const r=s.textContent?.trim()||"";return""===r?(a(`Config element #${t} found but empty, using default: "${n}"`),n):(o(`Config read from #${t}: "${r}"`),r)}function xt(){o("Reading configuration from DOM...");const t=function(t){const n=document.querySelector(`#${t}`);if(!n){const n=`FATAL: Required config element #${t} not found in DOM. Processing stopped.`;throw console.error(n),new Error(n)}const s=n.textContent?.trim()||"";if(""===s){const n=`FATAL: Required config element #${t} is empty. Processing stopped.`;throw console.error(n),new Error(n)}return o(`Required config read from #${t}: "${s}"`),s}(yt),n={statusPanelContainer:St(bt,gt),titleSelector:St(vt,mt),instructorHash:St(wt,ft),dbName:t};return o("Configuration loaded:",n),n}async function $t(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("")}function Et(t){return`${u.PIN_ATTEMPTS}:${t}`}function It(t){const n=Et(t),s=sessionStorage.getItem(n);if(!s)return null;try{return JSON.parse(s)}catch{return null}}function Ct(t){const n=It(t);if(!n||!n.lockoutUntil)return{isLocked:!1,remainingMs:0};const s=new Date(n.lockoutUntil).getTime(),o=Date.now();return s>o?{isLocked:!0,remainingMs:s-o}:(At(t),{isLocked:!1,remainingMs:0})}function At(t){const s=It(t);s&&s.attempts>0&&o(`Cleared ${s.attempts} failed PIN attempts for ${n(t)} on successful login`);const r=Et(t);sessionStorage.removeItem(r)}var qt=Object.getOwnPropertyDescriptor;let kt=class extends at{render(){return Ye`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"25/Nov/2025"}</span>
      </div>
    `}};kt.styles=ge`
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
  `,kt=((t,n,s,o)=>{for(var r,a=o>1?void 0:o?qt(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=r(a)||a);return a})([dt("qd-build-info")],kt);var Tt=Object.defineProperty,_t=Object.getOwnPropertyDescriptor,Nt=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?_t(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Tt(n,s,a),a};let Ot=null,Pt=class extends at{constructor(){super(...arguments),this.open=!1,this.closable=!0,this.previouslyFocused=null,this.handleKeyDown=t=>{"Escape"===t.key&&this.open&&this.closable&&(this.emitCloseEvent(),this.close())},this.handleBackdropClick=()=>{this.closable&&(this.emitCloseEvent(),this.close())},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this.handleKeyDown),Ot===this&&(Ot=null)}updated(t){t.has("open")&&(this.open?this.handleOpen():this.handleClose())}render(){return this.open?Ye`
      <div class="modal-backdrop" @click=${this.handleBackdropClick}>
        <div class="modal-content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="modal-header">
            <slot name="header"></slot>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    `:Ze}show(){this.open=!0}close(){this.open=!1}handleOpen(){Ot&&Ot!==this&&Ot.close(),Ot=this,this.previouslyFocused=document.activeElement,this.updateComplete.then(()=>{this.focusFirstElement()})}handleClose(){Ot===this&&(Ot=null),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}focusFirstElement(){const t=this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');t&&t.focus()}emitCloseEvent(){const t=new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0});this.dispatchEvent(t)}};Pt.styles=ge`
    :host {
      display: contents;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: slideIn 0.15s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      font-size: 18px;
    }

    .modal-header:empty {
      display: none;
    }

    .modal-body {
      padding: 20px;
    }
  `,Nt([ht({type:Boolean,reflect:!0})],Pt.prototype,"open",2),Nt([ht({type:Boolean})],Pt.prototype,"closable",2),Pt=Nt([dt("qd-modal")],Pt);var Lt=Object.defineProperty,Dt=Object.getOwnPropertyDescriptor,zt=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Dt(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Lt(n,s,a),a};let Rt=class extends at{constructor(){super(...arguments),this.open=!1,this.title="Enter Password",this.error="",this.password="",this.handleModalClose=()=>{this.close()},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=t=>{t.preventDefault(),this.password.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:this.password},bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close()}}show(){this.open=!0,this.password="",this.error=""}close(){this.open=!1,this.password="",this.error="",this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}updated(t){t.has("open")&&this.open&&(this.password="",this.updateComplete.then(()=>{this.passwordInput?.focus()}))}render(){return Ye`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
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

          ${this.error?Ye`<div class="error-message">${this.error}</div>`:""}

          <div class="button-row">
            <button type="button" @click=${this.handleCancel}>Cancel</button>
            <button type="submit">Login</button>
          </div>
        </form>
      </qd-modal>
    `}};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
var Mt;Rt.styles=ge`
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
  `,zt([ht({type:Boolean,reflect:!0})],Rt.prototype,"open",2),zt([ht({type:String})],Rt.prototype,"title",2),zt([ht({type:String})],Rt.prototype,"error",2),zt([pt()],Rt.prototype,"password",2),zt([(Mt='input[type="password"]',(t,n,s)=>((t,n,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&"object"!=typeof n&&Object.defineProperty(t,n,s),s))(t,n,{get(){return(t=>t.renderRoot?.querySelector(Mt)??null)(this)}}))],Rt.prototype,"passwordInput",2),Rt=zt([dt("qd-password-modal")],Rt);var Ut=Object.defineProperty,Ht=Object.getOwnPropertyDescriptor,jt=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Ht(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Ut(n,s,a),a};let Bt=class extends at{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.showInstructorModal=!1,this.instructorError="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutSeconds=0,this.lockoutInterval=null,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.instructorError="",this.pin="",this.lockoutSeconds=0,this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null),this.updateVisibility()},this.handleInstructorPasswordSubmit=t=>{this.handleInstructorLogin(t.detail.password)},this.handleInstructorModalClose=()=>{this.showInstructorModal=!1,this.instructorError=""}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){E(u.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return Ye`
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

          ${this.errorMessage?Ye`<div class="error-message">${this.errorMessage}</div>`:""}
          ${this.lockoutSeconds>0?Ye`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
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
    `}handleNameInput(t){const n=t.target;this.name=n.value,this.errorMessage=""}handleServiceIdInput(t){const n=t.target;this.serviceId=n.value,this.errorMessage=""}handlePinInput(t){const n=t.target;this.pin=function(t){return t.replace(/\D/g,"")}(n.value),this.errorMessage=""}isValid(){return 0===function(t,n,s){const o=[];t&&""!==t.trim()||o.push("Name required"),n?/^[a-zA-Z0-9]{2,10}$/.test(n)||o.push("Service ID must be 2-10 alphanumeric characters"):o.push("Service ID required");s?/^\d{4}$/.test(s)||o.push("PIN must be exactly 4 digits"):o.push("PIN required");return o}(this.name,this.serviceId,this.pin).length}getRelease(){const t=document.getElementById(vt),n=t?.textContent?.trim()||".wh_publication_title .title",s=document.querySelector(n);return s?.textContent?.trim()||""}async handleStudentLogin(t){if(t.preventDefault(),this.isValid()){this.isSubmitting=!0,this.errorMessage="";try{const t=this.getRelease();if(!t)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const s=this.serviceId.trim(),r=this.name.trim(),c=Ct(s);if(c.isLocked)return this.startLockoutCountdown(c.remainingMs),void(this.isSubmitting=!1);const d=document.getElementById(yt);if(!d?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${yt}">dbName</span> to page.`);const l=U(d.textContent.trim());await l.init();const u=await l.getStudent(t,s);if(!u){const n=await $t(this.pin),o={schema:2,docId:"",release:t,serviceId:s,name:r,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:n,pinCreatedAt:(new Date).toISOString()};return await l.saveStudent(o),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:s,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(s,r,t)}if(u.schema<2||!function(t){return Boolean(t.pinHash&&t.pinHash.length>0)}(u)){const n=function(t,n){return{...t,schema:2,pinHash:n,pinCreatedAt:(new Date).toISOString()}}(u,await $t(this.pin));return await l.saveStudent(n),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:s,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(s,r,t)}if(!(await async function(t,n){return function(t,n){if(t.length!==n.length)return!1;let s=0;for(let o=0;o<t.length;o++)s|=t.charCodeAt(o)^n.charCodeAt(o);return 0===s}(await $t(t),n)}(this.pin,u.pinHash||""))){const t=function(t){const s=(new Date).toISOString();let r=It(t);if(r||(r={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:s}),r.attempts+=1,r.lastAttempt=s,r.attempts>=h){const s=new Date(Date.now()+p);r.lockoutUntil=s.toISOString(),a(`PIN lockout triggered for ${n(t)} after ${r.attempts} failed attempts`)}else o(`Failed PIN attempt ${r.attempts}/${h} for ${n(t)}`);const c=Et(t);return sessionStorage.setItem(c,JSON.stringify(r)),r}(s),r=function(t){const n=It(t);return n?Ct(t).isLocked?0:Math.max(0,h-n.attempts):h}(s);if(t.lockoutUntil){const n=new Date(t.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(n)}else this.errorMessage=`Incorrect PIN. ${r} attempt${1!==r?"s":""} remaining`;return this.pin="",void(this.isSubmitting=!1)}At(s),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:s,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}));this.completeLogin(s,r,t)}catch(s){this.errorMessage="Login failed. Please try again.",console.error("Student login error:",s),this.isSubmitting=!1}}else this.errorMessage="Please enter name, service ID, and 4-digit PIN"}showPinStoredConfirmation(){const t=document.createElement("div");t.style.cssText="\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 99999;\n    ";const n=document.createElement("div");n.style.cssText="\n      background: white;\n      border-radius: 8px;\n      padding: 24px;\n      max-width: 320px;\n      text-align: center;\n      font-family: system-ui, -apple-system, sans-serif;\n    ",n.innerHTML='\n      <div style="font-size: 32px; margin-bottom: 12px;">✓</div>\n      <h3 style="margin: 0 0 8px 0; font-size: 16px;">PIN Stored</h3>\n      <p style="margin: 0 0 16px 0; font-size: 13px; color: #666;">\n        Your PIN has been saved. Use it with your name and service ID on future logins.\n      </p>\n      <button id="qd-pin-confirmation-ok" style="\n        background: #0066cc;\n        color: white;\n        border: none;\n        padding: 8px 24px;\n        border-radius: 4px;\n        cursor: pointer;\n        font-size: 13px;\n      ">OK</button>\n    ';const s=n.querySelector("button");s?.addEventListener("click",()=>{document.body.removeChild(t)}),t.addEventListener("click",n=>{n.target===t&&document.body.removeChild(t)}),t.appendChild(n),document.body.appendChild(t),setTimeout(()=>{document.body.contains(t)&&document.body.removeChild(t)},3e4)}startLockoutCountdown(t){this.lockoutSeconds=Math.ceil(t/1e3),this.errorMessage="",this.lockoutInterval&&clearInterval(this.lockoutInterval),this.lockoutInterval=window.setInterval(()=>{this.lockoutSeconds--,this.lockoutSeconds<=0&&this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)},1e3)}completeLogin(t,n,s){(new SessionService).createSession(t,n,s);const o=new CustomEvent("qd:login",{detail:{serviceId:t,name:n,release:s,role:"student"},bubbles:!0,composed:!0});this.dispatchEvent(o),this.pin="",this.isSubmitting=!1,this.updateVisibility()}openInstructorModal(){this.showInstructorModal=!0,this.instructorError=""}async hashPassword(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){const t=document.getElementById(wt);return t?.textContent?.trim()||""}async handleInstructorLogin(t){try{const n=await this.hashPassword(t),s=this.getExpectedHash();if(!s)return void(this.instructorError="Instructor password not configured");if(n!==s)return void(this.instructorError="Incorrect password");const o=this.getRelease();(new SessionService).createSession("INSTRUCTOR","Instructor",o||""),sessionStorage.setItem(u.INSTRUCTOR,"true");const r=new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:o||"",role:"instructor"},bubbles:!0,composed:!0});this.dispatchEvent(r),this.showInstructorModal=!1,this.instructorError="",this.updateVisibility()}catch(n){this.instructorError="Login failed. Please try again.",console.error("Instructor login error:",n)}}};Bt.styles=ge`
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
  `,jt([ht({type:String})],Bt.prototype,"title",2),jt([pt()],Bt.prototype,"name",2),jt([pt()],Bt.prototype,"serviceId",2),jt([pt()],Bt.prototype,"showInstructorModal",2),jt([pt()],Bt.prototype,"instructorError",2),jt([pt()],Bt.prototype,"errorMessage",2),jt([pt()],Bt.prototype,"isSubmitting",2),jt([pt()],Bt.prototype,"pin",2),jt([pt()],Bt.prototype,"lockoutSeconds",2),Bt=jt([dt("qd-login")],Bt);var Ft=Object.defineProperty,Vt=Object.getOwnPropertyDescriptor,Qt=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Vt(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Ft(n,s,a),a};let Kt=class extends at{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent)}render(){const t=this.serviceId.slice(-4);return Ye`
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
    `}loadCache(){const t=E(u.SESSION);t?(this.name=t.name||"",this.serviceId=t.serviceId||""):(this.name="",this.serviceId="");const n=E(u.CACHE);if(!n)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");this.total=n.totals.total,this.correct=n.totals.correct,this.percentage=this.calculatePercentage(n.totals.total,n.totals.correct),this.statusColor=this.calculateStatusColor(n.totals.total,n.totals.correct)}calculatePercentage(t,n){return 0===t?0:Math.round(n/t*100)}calculateStatusColor(t,n){return function(t,n){return 0===t||0===n?"red":n===t?"green":"amber"}(t,n)}updateVisibility(){const t=E(u.SESSION),n="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&!n?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const t=E(u.SESSION);(new SessionService).clearSession();const n=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(n)}};Kt.styles=ge`
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
  `,Qt([pt()],Kt.prototype,"total",2),Qt([pt()],Kt.prototype,"correct",2),Qt([pt()],Kt.prototype,"percentage",2),Qt([pt()],Kt.prototype,"statusColor",2),Qt([pt()],Kt.prototype,"name",2),Qt([pt()],Kt.prototype,"serviceId",2),Kt=Qt([dt("qd-status")],Kt);const Wt=ge`
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
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],n=t[Math.min(this.failureCount-1,t.length-1)]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const Jt="instructor.password.hash";var Yt=Object.defineProperty,Gt=Object.getOwnPropertyDescriptor,Zt=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Gt(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Yt(n,s,a),a};let Xt=class extends at{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=t=>{const n=t.target;this.password=n.value,this.error=""},this.handleSubmit=async t=>{t.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const t=function(){const t=document.getElementById(Jt);if(!t){const t=`Instructor password hash not found. Expected element with id="${Jt}". Check Oxygen XSL transform configuration.`;throw r(t),new Error(t)}const n=t.textContent?.trim();if(!n){const t="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw r(t),new Error(t)}if(!/^[a-f0-9]{64}$/i.test(n)){const t=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${n.substring(0,20)}...`;throw r(t),new Error(t)}return n.toLowerCase()}(),n=(new TextEncoder).encode(this.password),s=await crypto.subtle.digest("SHA-256",n),o=Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join(""),a=await async function(t,n){if(t.length!==n.length)return!1;if(0===t.length)return!0;const s=new TextEncoder,o=s.encode(t),r=s.encode(n);try{const t=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),n=await crypto.subtle.sign("HMAC",t,r),s=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),a=await crypto.subtle.sign("HMAC",s,o);if(n.byteLength!==a.byteLength)return!1;const c=new Uint8Array(n),d=new Uint8Array(a);let l=0;for(let o=0;o<c.length;o++)l|=(c[o]??0)^(d[o]??0);return 0===l}catch(a){return console.error("Constant-time comparison failed:",a),!1}}(o,t);a?(this.rateLimiter.reset(),this.password="",this.error="",$(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return Ye`
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

          ${this.error?Ye`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};Xt.styles=Wt,Zt([pt()],Xt.prototype,"password",2),Zt([pt()],Xt.prototype,"error",2),Zt([pt()],Xt.prototype,"remainingSeconds",2),Xt=Zt([dt("qd-instructor-unlock")],Xt);var en=Object.defineProperty,tn=Object.getOwnPropertyDescriptor,nn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?tn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&en(n,s,a),a};let sn=class extends at{constructor(){super(...arguments),this.open=!1,this.students=[],this.expandedStudents=new Set,this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}updated(t){t.has("open")&&this.open&&(this.expandedStudents=new Set(this.students.map(t=>t.serviceId)))}render(){return Ye`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Student Scores</span>
        <div class="scores-content">
          ${0===this.students.length?Ye`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const t=[...this.students].sort((t,n)=>t.name.localeCompare(n.name));return Ye`
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
    `}renderStudentRow(t){const n=this.calculateSummary(t),s=this.expandedStudents.has(t.serviceId);return Ye`
      <tr class="student-row" @click=${()=>this.toggleStudent(t.serviceId)}>
        <td>
          <span class="expand-icon">${s?"▼":"▶"}</span>
          ${n.name}
        </td>
        <td>${n.serviceId}</td>
        <td>${n.attempted}</td>
        <td
          class=${n.correct===n.attempted&&n.attempted>0?"correct-highlight":""}
        >
          ${n.correct}
        </td>
        <td class=${this.getPercentageClass(n.percentage)}>${n.percentage}%</td>
      </tr>
      ${s?this.renderDetailRow(t):Ze}
    `}renderDetailRow(t){const n=Object.entries(t.pages);return Ye`
      <tr class="detail-row">
        <td colspan="5">
          ${0===n.length?Ye`<span class="no-pages">No quiz pages attempted</span>`:Ye`
                <div class="page-breakdown">
                  ${n.map(([t,n])=>Ye`
                      <div class="page-row">
                        <span class="page-name">${t}</span>
                        <div class="answers-list">
                          ${n.answers.map((t,n)=>Ye`
                              <span class="answer-badge ${this.getAnswerClass(t)}">
                                Q${n+1}: ${t?t.answer:"—"}
                              </span>
                            `)}
                        </div>
                      </div>
                    `)}
                </div>
              `}
        </td>
      </tr>
    `}calculateSummary(t){const n=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:n}}getPercentageClass(t){return 100===t?"correct-highlight":0===t?"incorrect-highlight":""}getAnswerClass(t){return t?t.success?"correct":"incorrect":"unanswered"}toggleStudent(t){const n=new Set(this.expandedStudents);n.has(t)?n.delete(t):n.add(t),this.expandedStudents=n}show(){this.open=!0}close(){this.open=!1}};sn.styles=ge`
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
  `,nn([ht({type:Boolean,reflect:!0})],sn.prototype,"open",2),nn([ht({type:Array})],sn.prototype,"students",2),nn([pt()],sn.prototype,"expandedStudents",2),sn=nn([dt("qd-scores-modal")],sn);var on=Object.defineProperty,rn=Object.getOwnPropertyDescriptor,an=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?rn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&on(n,s,a),a};let cn=class extends at{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return Ye`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};cn.styles=Wt,an([ht({type:Array})],cn.prototype,"students",2),an([ht({type:Boolean})],cn.prototype,"showModal",2),cn=an([dt("qd-instructor-scores")],cn);var dn=Object.defineProperty,ln=Object.getOwnPropertyDescriptor,un=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?ln(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&dn(n,s,a),a};let hn=class extends at{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),n=new Blob([t],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(n),o=document.createElement("a");o.href=s;const r=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);o.download=`quiz-data-${r}.csv`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(s)}}escapeCSVField(t){const n=String(t);return n.includes(",")||n.includes('"')||n.includes("\n")?`"${n.replace(/"/g,'""')}"`:n}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const n of this.students)for(const[s,o]of Object.entries(n.pages)){(o.answers||[]).forEach((o,r)=>{o&&t.push([this.escapeCSVField(n.serviceId),this.escapeCSVField(n.name),this.escapeCSVField(n.release),this.escapeCSVField(s),this.escapeCSVField(r),this.escapeCSVField(o.answer),this.escapeCSVField(o.success),this.escapeCSVField(o.timestamp)].join(","))})}return t.join("\n")}render(){const t=this.students.length>0&&this.students.some(t=>t.attempted>0),n=t?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return Ye`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${n}
      >
        Export CSV
      </button>
    `}};hn.styles=Wt,un([ht({type:Array})],hn.prototype,"students",2),hn=un([dt("qd-instructor-export")],hn);var pn=Object.defineProperty,gn=Object.getOwnPropertyDescriptor,mn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?gn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&pn(n,s,a),a};let fn=class extends at{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const n=t.target;this.confirmText=n.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{A(),$(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),rt(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return Ye`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?Ye`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t="DELETE ALL DATA"===this.confirmText;return Ye`
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

          ${this.error?Ye`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};fn.styles=Wt,mn([pt()],fn.prototype,"showConfirmDialog",2),mn([pt()],fn.prototype,"confirmText",2),mn([pt()],fn.prototype,"error",2),mn([pt()],fn.prototype,"success",2),fn=mn([dt("qd-instructor-manage")],fn);
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const bn=2;class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,s){this._$Ct=t,this._$AM=n,this._$Ci=s}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class e extends i{constructor(t){if(super(t),this.it=Ze,t.type!==bn)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===Ze||null==t)return this._t=void 0,this.it=t;if(t===Ge)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;const vn=(t=>(...n)=>({_$litDirective$:t,values:n}))(e);var wn=Object.defineProperty,yn=Object.getOwnPropertyDescriptor,Sn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?yn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&wn(n,s,a),a};let xn=class extends at{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}render(){return Ye`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${vn(this.message)}</div>

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
    `}};xn.styles=ge`
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
  `,Sn([ht({type:Boolean,reflect:!0})],xn.prototype,"open",2),Sn([ht({type:String})],xn.prototype,"title",2),Sn([ht({type:String})],xn.prototype,"message",2),Sn([ht({type:String})],xn.prototype,"confirmText",2),Sn([ht({type:String})],xn.prototype,"cancelText",2),Sn([ht({type:Boolean})],xn.prototype,"destructive",2),xn=Sn([dt("qd-confirm-dialog")],xn);var $n=Object.defineProperty,En=Object.getOwnPropertyDescriptor,In=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?En(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&$n(n,s,a),a};let Cn=class extends at{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.searchText="",this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleClose=()=>{this.confirmingStudent=null,this.confirmDialogOpen=!1,this.searchText="",this.errorMessage="",this.dispatchEvent(new CustomEvent("close"))},this.handleModalClose=()=>{this.confirmDialogOpen||this.handleClose()},this.handleSearchInput=t=>{this.searchText=t.target.value},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}get filteredStudents(){if(!this.searchText.trim())return this.students;const t=this.searchText.toLowerCase().trim();return this.students.filter(n=>n.name.toLowerCase().includes(t)||n.serviceId.toLowerCase().includes(t))}showConfirmation(t){this.confirmingStudent=t,this.confirmDialogOpen=!0}async executeReset(t){try{const s=document.getElementById(yt);if(!s?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${yt}">dbName</span> to page.`);const o=U(s.textContent.trim());await o.init();const r=(n=t,{...n,pinHash:"",pinResetAt:(new Date).toISOString()});await o.saveStudent(r);const a={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:t.release};await o.saveAuditEvent(a);const c=this.students.findIndex(n=>n.serviceId===t.serviceId);c>=0&&(this.students[c]=r,this.students=[...this.students]),this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.confirmDialogOpen=!1,this.confirmingStudent=null,this.errorMessage=""}catch(s){console.error("PIN reset error:",s),this.errorMessage="Failed to reset PIN. Please try again.",this.confirmDialogOpen=!1,this.confirmingStudent=null}var n}renderStudentItem(t){const n=t.pinHash&&t.pinHash.length>0;return Ye`
      <div class="student-item">
        <div>
          <div class="student-name">${t.name}</div>
          <div class="student-id">ID: ${t.serviceId}</div>
          <div class="pin-status ${n?"has-pin":"no-pin"}">
            ${n?"PIN set":"No PIN"}
          </div>
        </div>
        <button type="button" class="reset-btn" @click=${()=>this.showConfirmation(t)}>
          Reset PIN
        </button>
      </div>
    `}renderStudentList(){const t=this.filteredStudents;return 0===t.length?Ye`
        <div class="empty-message">
          ${this.searchText?"No matching students":"No students found"}
        </div>
      `:t.map(t=>this.renderStudentItem(t))}render(){const t=this.confirmingStudent,n=t?`Reset PIN for <strong>${t.name}</strong> (${t.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return Ye`
      <qd-modal .open=${this.showModal} @qd:modal-close=${this.handleModalClose}>
        <div class="header">
          <h3>Reset Student PIN</h3>
          <button type="button" class="close-btn" @click=${this.handleClose}>×</button>
        </div>

        <input
          type="text"
          class="search-input"
          placeholder="Search by name or ID..."
          .value=${this.searchText}
          @input=${this.handleSearchInput}
        />

        <div class="student-list">${this.renderStudentList()}</div>

        ${this.errorMessage?Ye`<div class="error-message">${this.errorMessage}</div>`:Ze}
      </qd-modal>

      <qd-confirm-dialog
        .open=${this.confirmDialogOpen}
        title="Reset PIN"
        .message=${n}
        confirmText="Reset PIN"
        cancelText="Cancel"
        destructive
        @qd:confirm=${this.handleConfirmReset}
        @qd:cancel=${this.handleCancelReset}
      ></qd-confirm-dialog>
    `}};Cn.styles=ge`
    :host {
      display: block;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .header h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
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

    .student-list {
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
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
  `,In([ht({type:Array})],Cn.prototype,"students",2),In([ht({type:Boolean})],Cn.prototype,"showModal",2),In([pt()],Cn.prototype,"searchText",2),In([pt()],Cn.prototype,"confirmingStudent",2),In([pt()],Cn.prototype,"confirmDialogOpen",2),In([pt()],Cn.prototype,"errorMessage",2),Cn=In([dt("qd-pin-reset-dialog")],Cn);var An=Object.defineProperty,qn=Object.getOwnPropertyDescriptor,kn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?qn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&An(n,s,a),a};let Tn=class extends at{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.handleLoginEvent=t=>{const n=t,s=n.detail?.role;this.updateVisibility(),"instructor"===s&&this.unlock()},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{const t=E(u.SESSION);if(t){try{const{getStorageService:n}=await Promise.resolve().then(()=>Q),s=n(),o=await s.getStudentsByRelease(t.release);this.students=o}catch(n){console.error("Failed to load students:",n),this.students=[]}this.showPinReset=!0}},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const t=E(u.SESSION);if(t){try{const{getStorageService:n}=await Promise.resolve().then(()=>Q),s=n(),o=await s.getStudentsByRelease(t.release);this.students=o}catch(n){console.error("Failed to load students:",n),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=E(u.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const n=t.target;if(this.showStudentAnswers=n.checked,this.showStudentAnswers&&0===this.students.length){const t=E(u.SESSION);if(t)try{const{getStorageService:n}=await Promise.resolve().then(()=>Q),s=n(),o=await s.getStudentsByRelease(t.release);this.students=o}catch(o){console.error("Failed to load students for toggle:",o)}}const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&this.unlock();const n=sessionStorage.getItem("qd/instructor/showAnswers");null!==n&&(this.showStudentAnswers="true"===n,this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){"true"===sessionStorage.getItem(u.INSTRUCTOR)?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(t){this.students=t}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?Ye`
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
    `:Ye`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};Tn.styles=[Wt,ge`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],kn([pt()],Tn.prototype,"unlocked",2),kn([pt()],Tn.prototype,"showScores",2),kn([pt()],Tn.prototype,"students",2),kn([pt()],Tn.prototype,"showStudentAnswers",2),kn([pt()],Tn.prototype,"showPinReset",2),Tn=kn([dt("qd-instructor")],Tn);const _n={statusPanel:".wh_top_menu_and_indexterms_link"};function Nn(t={}){const n=t.statusPanelContainer||_n.statusPanel;!function(t){const n=document.querySelector(t);if(!n)return o(`Login component not injected: container '${t}' not found`),null;const s=document.createElement("qd-login");n.appendChild(s),o("Login component injected")}(n),function(t){const n=document.querySelector(t);if(!n)return o(`Status component not injected: container '${t}' not found`),null;const s=document.createElement("qd-status");n.appendChild(s),o("Status component injected")}(n),function(t){const n=document.querySelector(t);if(!n)return o(`Instructor component not injected: container '${t}' not found`),null;const s=document.createElement("qd-instructor");n.appendChild(s),o("Instructor component injected")}(n)}const On={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},Pn={unstarted:"red",incomplete:"amber",complete:"green"};function Ln(t){const n=function(t,n){if(!t||!n?.pages)return"unstarted";const s=n.pages[t];return s?.state??"unstarted"}(t.getAttribute("data-page-id"),E(u.CACHE));!function(t,n){Object.values(On).forEach(n=>{t.classList.remove(n)});const s=On[Pn[n]];t.classList.add(s)}(t,n)}function Dn(){const t=document.querySelectorAll(".quizPageBtn"),n=E(u.CACHE),s="true"===sessionStorage.getItem(u.INSTRUCTOR);if(!n||s)return t.forEach(t=>{Object.values(On).forEach(n=>{t.classList.remove(n)})}),void o(s?`Removed badge styling from ${t.length} page links (instructor mode)`:`Removed badge styling from ${t.length} page links (no session)`);t.forEach(t=>{Ln(t)}),o(`Updated ${t.length} page badges`)}function zn(t){const n=t,{pageId:s}=n.detail,r=document.querySelector(`[data-page-id="${s}"]`);r&&r.classList.contains("quizPageBtn")&&(Ln(r),o(`Updated badge for page ${s}`))}function Rn(){o("Cache rebuilt, refreshing all badges"),Dn()}function Mn(){o("Logout detected, removing all badge styling");const t=document.querySelectorAll(".quizPageBtn");t.forEach(t=>{Object.values(On).forEach(n=>{t.classList.remove(n)})}),o(`Removed badge styling from ${t.length} page links`)}const Un={initialized:!1};async function Hn(t={}){if(Un.initialized)return void a("Bootstrap already initialized, skipping");if(o("Bootstrapping Sonar Quiz System..."),function(){if(document.getElementById("qd-global-styles"))return;const t=document.createElement("style");t.id="qd-global-styles",t.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: 1rem;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor mode: Student answers display */\n    .qd-student-answers {\n      margin-top: 12px;\n      padding: 8px;\n      background: #f8f9fa;\n      border-radius: 4px;\n      border: 1px solid #dee2e6;\n    }\n\n    .qd-student-answer {\n      font-size: 12px;\n      padding: 4px 0;\n      line-height: 1.4;\n    }\n\n    .qd-student-answer.qd-correct {\n      color: #28a745;\n    }\n\n    .qd-student-answer.qd-incorrect {\n      color: #dc3545;\n    }\n\n    .qd-student-name {\n      font-weight: 600;\n    }\n\n    .qd-student-answer-text {\n      margin: 0 4px;\n    }\n\n    .qd-timestamp {\n      color: #6c757d;\n      font-size: 11px;\n      margin-left: 8px;\n    }\n  ",document.head.appendChild(t),o("Global styles injected")}(),!t.dbName){const t="FATAL: dbName not provided in bootstrap config. Processing stopped.";throw console.error(t),new Error(t)}const n=V(t.dbName);await n.init();const s=new EventCoordinator;s.initialize(),Un.eventCoordinator=s;const r=new SessionCoordinator;r.initialize(),Un.sessionCoordinator=r,Nn({statusPanelContainer:t.statusPanelContainer,dbName:t.dbName}),!1!==t.autoEnhanceQuizTables&&function(){const t=document.querySelectorAll("table.qd-quiz");if(0===t.length)return void o("No quiz tables found to enhance");o(`Enhancing ${t.length} quiz table(s) in non-interactive mode...`);let n=0;for(const o of Array.from(t))try{W(o,{interactive:!1}),n++}catch(s){a(`Failed to enhance quiz table: ${s.message}`)}o(`Enhanced ${n} of ${t.length} quiz table(s) (non-interactive)`)}(),!1!==t.autoEnhanceAnalysisTables&&function(){const t=document.querySelectorAll("table.qd-analysis");if(0===t.length)return void o("No analysis tables found to enhance");o(`Enhancing ${t.length} analysis table(s) in non-interactive mode...`);let n=0;for(const o of Array.from(t))try{ae(o,{interactive:!1}),n++}catch(s){a(`Failed to enhance analysis table: ${s.message}`)}o(`Enhanced ${n} of ${t.length} analysis table(s) (non-interactive)`)}(),!1!==t.autoEnhanceHomeBadges&&function(){const t=document.querySelectorAll(".quizPageBtn");if(0===t.length)return void o("No .quizPageBtn links found, skipping badge enhancement");o(`Enhancing home page badges for ${t.length} link(s)...`);try{document.querySelectorAll(".quizPageBtn").forEach(t=>{const n=function(t){const n=t.getAttribute("href");return n&&n.substring(n.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(t);n?(t.setAttribute("data-page-id",n),o(`Set data-page-id="${n}" for link: ${t.textContent?.trim()}`)):o(`Failed to extract pageId from href: ${t.getAttribute("href")}`)}),Dn(),document.addEventListener("qd:state-changed",zn),document.addEventListener("qd:cache-rebuild",Rn),document.addEventListener("qd:logout",Mn),o("Home page badges enhanced with event listeners"),o("Home page badges enhanced")}catch(n){a(`Failed to enhance home badges: ${n.message}`)}}(),await async function(){const t=E(u.SESSION);if(!t)return void o("No existing session, tables remain in non-interactive mode");if("true"===sessionStorage.getItem(u.INSTRUCTOR)){o("Instructor session detected, revealing answers in non-interactive tables");const t=window.location.pathname,n=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"");return void document.querySelectorAll("table.qd-quiz").forEach(t=>{const s=Z(t);if(!s)return;s.pageId=n;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,n)=>{const o=s.parsed.questions[n];o&&t instanceof HTMLTableCellElement&&(t.textContent=o.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const o=()=>{X(t,s)},r=()=>{ee(t)};document.addEventListener("qd:instructor-show-answers",o),document.addEventListener("qd:instructor-hide-answers",r);"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&o()})}o(`Existing session detected for ${t.serviceId}, upgrading tables to interactive mode`);const n=V();let s=E(u.CACHE);if(!s){o("Cache not found, rebuilding from IndexedDB...");try{const r=await n.loadStudentRecord(t);s=n.buildCache(r),C(u.CACHE,s),o(`Cache rebuilt from IndexedDB: ${s.totals.total} total questions`)}catch{a("Failed to rebuild cache from IndexedDB, using empty cache"),s={totals:{total:0,answered:0,correct:0},pages:{}},C(u.CACHE,s)}}const r=window.location.pathname,c=r.substring(r.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!c)return void o("No pageId found, skipping table upgrade");const d=document.querySelectorAll("table.qd-quiz");d.length>0&&(o(`Upgrading ${d.length} quiz table(s) to interactive mode...`),d.forEach(t=>{W(t,{interactive:!0,pageId:c})}));const l=document.querySelectorAll("table.qd-analysis");l.length>0&&(o(`Upgrading ${l.length} analysis table(s) to interactive mode...`),l.forEach(t=>{ae(t,{interactive:!0,pageId:c})}))}(),Un.initialized=!0,o("Bootstrap complete")}if("undefined"!=typeof window){const t=()=>{o("Auto-initializing Sonar Quiz System");const t=xt();Hn({dbName:t.dbName,statusPanelContainer:t.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(t=>{console.error("[FATAL] Bootstrap failed:",t)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{t()}):t()}return t.BUILD_DATE="25/Nov/2025",t.DEFAULT_CONTAINERS=_n,t.Debouncer=Debouncer,t.SCHEMA_VERSION=2,t.SESSION_TIMEOUT_MS=l,t.STORAGE_KEYS=u,t.VERSION="0.1.0-phase3.1",t.bootstrap=Hn,t.calculateCompletionState=j,t.cleanup=function(){Un.initialized?(o("Cleaning up bootstrap resources..."),Un.eventCoordinator?.cleanup(),Un.sessionCoordinator?.cleanup(),Un.initialized=!1,Un.eventCoordinator=void 0,Un.sessionCoordinator=void 0,o("Bootstrap cleanup complete")):a("Bootstrap not initialized, nothing to cleanup")},t.clearQuizData=A,t.enhanceAnalysisTable=ae,t.enhanceQuizTable=W,t.error=r,t.generateCellKey=se,t.generateTableId=ne,t.getAnalysisTableMetadata=function(t){return ie.get(t)},t.getJSON=E,t.getQuizTableMetadata=Z,t.info=o,t.injectComponents=Nn,t.isAnalysisTableEnhanced=function(t){return ie.has(t)},t.isCellEditable=oe,t.isInitialized=function(){return Un.initialized},t.isQuizTableEnhanced=function(t){return K.has(t)},t.parseAnalysisTable=re,t.parseQuizTable=c,t.setJSON=C,t.validateAnswer=d,t.warn=a,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),t}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
