var SonarQuiz=function(t){"use strict";function n(t){if(t.length<2)return"**";if(2===t.length)return t;return t.slice(0,2)+"*".repeat(t.length-2)}function s(t){if(null===t||"object"!=typeof t)return t;const o={};for(const[r,a]of Object.entries(t))"name"!==r&&"passwordHash"!==r&&(o[r]="serviceId"!==r||"string"!=typeof a?"object"!=typeof a||null===a?a:s(a):n(a));return o}function o(t,n){}function r(t,n){if(n instanceof Error){const s={name:n.name,message:n.message};console.error(`[ERROR] ${t}`,s)}else void 0!==n?console.error(`[ERROR] ${t}`,s(n)):console.error(`[ERROR] ${t}`)}function a(t,n){void 0!==n?console.warn(`[WARN] ${t}`,s(n)):console.warn(`[WARN] ${t}`)}function c(t){const n=[],s=[];if(!t.classList.contains("qd-quiz"))return n.push('Table must have class "qd-quiz"'),{element:t,questions:s,errors:n};const o=Array.from(t.querySelectorAll("tbody tr"));return 0===o.length?(n.push("Quiz table has no data rows"),{element:t,questions:s,errors:n}):(o.forEach((t,o)=>{const r=Array.from(t.querySelectorAll("td"));if(3!==r.length)return void n.push(`Row ${o+1} has ${r.length} columns, expected 3 (Question | Answer | Detail)`);const a=r[0],c=r[1],d=r[2];if(!a||!c||!d)return;const l=a.textContent?.trim()||"";if(!l)return void n.push(`Row ${o+1} has empty question text`);const u=c.textContent?.trim()||"";if(!u)return void n.push(`Row ${o+1} has empty answer`);const h=d.querySelector("ol");if(h){const t=(p=h,Array.from(p.querySelectorAll("li")).map(t=>t.textContent?.trim()||"").filter(t=>t.length>0));if(0===t.length)return void n.push(`Row ${o+1} MCQ has no options in <ol>`);s.push({text:l,kind:"mcq",correctAnswer:u,options:t})}else{const t=d.textContent?.trim()||"",r=parseFloat(t);if(isNaN(r))return void n.push(`Row ${o+1} appears to be numeric but has invalid tolerance: "${t}"`);s.push({text:l,kind:"numeric",correctAnswer:u,tolerance:r})}var p}),{element:t,questions:s,errors:n.length>0?n:void 0})}function d(t,n){if(!n||""===n.trim())return!1;const s=n.trim();if("mcq"===t.kind)return s===t.correctAnswer;{const n=parseFloat(s),o=parseFloat(t.correctAnswer);if(isNaN(n)||isNaN(o))return!1;const r=t.tolerance??0;return Math.abs(n-o)<=r}}const l=18e5,u={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},h=3,p=3e4;class SessionService{createSession(t,n,s){const o=new Date,r=o.toISOString(),a={serviceId:t,name:n,release:s,loginTime:r,lastActivity:r,expiresAt:new Date(o.getTime()+l).toISOString(),instructorUnlocked:!1};return this.saveSession(a),this.emitEvent("qd:login",{serviceId:t,name:n,release:s,loginTime:r}),a}getSession(){try{const t=sessionStorage.getItem(u.SESSION);if(!t)return null;const n=JSON.parse(t);return n.serviceId&&n.release&&n.expiresAt?n:(a("Invalid session data, missing required fields"),null)}catch(t){return r("Failed to parse session data",t),null}}updateActivity(){const t=this.getSession();if(!t)return;const n=new Date;t.lastActivity=n.toISOString(),t.expiresAt=new Date(n.getTime()+l).toISOString(),this.saveSession(t)}isExpired(){const t=this.getSession();return!t||function(t,n=new Date){const s=new Date(t);return!!isNaN(s.getTime())||n>=s}(t.expiresAt)}clearSession(){const t=this.getSession();sessionStorage.removeItem(u.SESSION),sessionStorage.removeItem(u.CACHE),sessionStorage.removeItem(u.INSTRUCTOR),sessionStorage.removeItem("qd/instructor/showAnswers"),t&&(t.serviceId,this.emitEvent("qd:logout",{serviceId:t.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!0,t.unlockTime=(new Date).toISOString(),this.saveSession(t),this.emitEvent("qd:instructor-unlock",{timestamp:t.unlockTime}))}lockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!1,delete t.unlockTime,this.saveSession(t),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const t=this.getSession();return!0===t?.instructorUnlocked}getCache(){try{const t=sessionStorage.getItem(u.CACHE);return t?JSON.parse(t):null}catch(t){return r("Failed to parse cache data",t),null}}saveCache(t){try{sessionStorage.setItem(u.CACHE,JSON.stringify(t))}catch(n){r("Failed to save cache",n)}}clearCache(){sessionStorage.removeItem(u.CACHE)}saveSession(t){try{sessionStorage.setItem(u.SESSION,JSON.stringify(t))}catch(n){r("Failed to save session",n)}}emitEvent(t,n){try{const s=new CustomEvent(t,{detail:n,bubbles:!0});document.dispatchEvent(s)}catch(s){r(`Failed to emit event ${t}`,s)}}}function g(t,n){const s=n.answers.length,o=n.answers.filter(t=>""!==t.answer.trim()).length,r=n.answers.filter(t=>t.success).length;return{state:n.state,total:s,answered:o,correct:r,last:n.lastAttempted,answers:n.answers,analysis:n.analysis}}function m(t){return function(t,n="display"){if(null==t)return console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date";const s="string"==typeof t?new Date(t):t;return isNaN(s.getTime())?(console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date"):"csv"===n?function(t){return t.toISOString()}(s):function(t){return`${t.toLocaleDateString("en-US",{month:"short"})} ${t.getDate()} ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`}(s)}(t,"display")}class Debouncer{constructor(){this.timers=new Map}debounce(t,n,s=200){const o=this.timers.get(t);void 0!==o&&clearTimeout(o);const r=setTimeout(()=>{this.timers.delete(t),n()},s);this.timers.set(t,r)}cancel(t){const n=this.timers.get(t);return void 0!==n&&(clearTimeout(n),this.timers.delete(t),!0)}cancelAll(){let t=0;for(const n of this.timers.values())clearTimeout(n),t++;return this.timers.clear(),t}isPending(t){return this.timers.has(t)}getPendingCount(){return this.timers.size}}function f(t){const n=t.querySelector("tbody");return n?Array.from(n.querySelectorAll("tr")):[]}function b(t){return Array.from(t.cells)}function y(t){return t&&t.textContent?.trim()||""}function v(t,n,s){return document.createElement(t)}function w(t,...n){t.classList.add(...n)}function S(t,...n){t.classList.remove(...n)}function x(t,n,s){const o=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0,cancelable:!1});return document.dispatchEvent(o)}function E(t,n,s,o){const r=new CustomEvent(n,{detail:s,bubbles:!0,composed:!0,cancelable:!1});return t.dispatchEvent(r)}function C(t){try{const n=sessionStorage.getItem(t);return n?JSON.parse(n):null}catch(n){return a(`Failed to parse JSON from sessionStorage key: ${t}`,n),null}}function $(t,n){try{const s=JSON.stringify(n);return sessionStorage.setItem(t,s),!0}catch(s){return a(`Failed to store JSON in sessionStorage key: ${t}`,s),!1}}function q(){const t=[];for(let n=0;n<sessionStorage.length;n++){const s=sessionStorage.key(n);s&&s.startsWith("qd/")&&t.push(s)}for(const n of t)sessionStorage.removeItem(n);return t.length}function A(t,n){return`qd/${t}/u${n}`}class StorageError extends Error{constructor(t,n,s){super(t),this.operation=n,this.cause=s,this.name="StorageError",s?r(`Storage error in ${n}: ${t}`,s):r(`Storage error in ${n}: ${t}`)}}class StorageNotInitializedError extends StorageError{constructor(t){super("Storage adapter not initialized. Call init() first.",t),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(t){super("Storage quota exceeded. Please clear old data or free up space.",t),this.name="StorageQuotaError"}}class StorageFormatError extends StorageError{constructor(t,n,s,o){super(t,"formatCheck"),this.name="StorageFormatError",this.expected=n,this.found=s,this.storageKey=o}}const O="OBF:";function T(t){return t?t.split("").map(t=>t.charCodeAt(0).toString()).join(""):""}function P(t){return(new TextEncoder).encode(t)}function _(t,n){if(0===n.length)return t;const s=new Uint8Array(t.length);for(let o=0;o<t.length;o++){const r=t[o],a=n[o%n.length];void 0!==r&&void 0!==a&&(s[o]=r^a)}return s}function D(t,n){const s=function(t){let n="";for(let s=0;s<t.length;s++){const o=t[s];void 0!==o&&(n+=String.fromCharCode(o))}return btoa(n)}(_(P(JSON.stringify(t)),P(n||"default")));return`${O}${s}`}function U(t,n){const s=t.slice(4);if(!s)throw new Error("Empty obfuscated payload");let o;try{o=function(t){const n=atob(t),s=new Uint8Array(n.length);for(let o=0;o<n.length;o++)s[o]=n.charCodeAt(o);return s}(s)}catch{throw new Error("Invalid base64 in obfuscated data")}const r=_(o,P(n||"default"));let a;try{c=r,a=(new TextDecoder).decode(c)}catch{throw new Error("Failed to decode UTF-8 data - possibly corrupted")}var c;try{return JSON.parse(a)}catch{throw new Error("Failed to parse JSON - data may be corrupted or tampered")}}function j(t){return"string"==typeof t&&t.startsWith(O)}const F="students",B="backups",V="auditLog";class IndexedDBStorageAdapter{constructor(t){if(this.db=null,this.initPromise=null,!t)throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");this.dbName=t}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=new Promise((t,n)=>{let s,o=!1;const c=()=>{s&&(clearTimeout(s),s=void 0)};s=window.setTimeout(()=>{if(o)return;o=!0,this.initPromise=null,a("IndexedDB open timed out after 5000ms - attempting recovery");const s=indexedDB.deleteDatabase(this.dbName);s.onsuccess=()=>{this.init().then(t).catch(n)},s.onerror=()=>{n(new StorageError(`Database "${this.dbName}" appears corrupted. Please clear site data in browser settings.`,"init"))},s.onblocked=()=>{n(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const d=indexedDB.open(this.dbName,3);d.onerror=()=>{o||(o=!0,c(),r(`IndexedDB open error: ${d.error?.message||"unknown"}`),this.initPromise=null,n(new StorageError("Failed to open database","init",d.error)))},d.onblocked=()=>{a("IndexedDB open blocked - close other tabs with this database")},d.onsuccess=()=>{if(!o){if(o=!0,c(),this.db=d.result,!this.db.objectStoreNames.contains(F)||!this.db.objectStoreNames.contains(B)||!this.db.objectStoreNames.contains(V)){a(`Database corrupted (missing stores). Found: [${Array.from(this.db.objectStoreNames).join(", ")}]`),this.db.close(),this.db=null;const s=indexedDB.deleteDatabase(this.dbName);return s.onsuccess=()=>{this.initPromise=null,this.init().then(t).catch(n)},void(s.onerror=()=>{this.initPromise=null,n(new StorageError("Failed to delete corrupted database","init",s.error))})}this.initPromise=null,t()}},d.onupgradeneeded=t=>{const n=t.target.result,s=t.target.transaction;s&&(s.onerror=()=>{r(`Upgrade transaction error: ${s.error?.message||"unknown"}`)},s.onabort=()=>{r(`Upgrade transaction aborted: ${s.error?.message||"unknown"}`)});try{if(!n.objectStoreNames.contains(F)){const t=n.createObjectStore(F,{keyPath:null});t.createIndex("by-release","release",{unique:!1}),t.createIndex("by-service-id","serviceId",{unique:!1})}if(!n.objectStoreNames.contains(B)){const t=n.createObjectStore(B,{keyPath:null});t.createIndex("by-original-key","originalKey",{unique:!1}),t.createIndex("by-timestamp","timestamp",{unique:!1})}if(!n.objectStoreNames.contains(V)){const t=n.createObjectStore(V,{keyPath:"eventId"});t.createIndex("by-service-id","serviceId",{unique:!1}),t.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(o){throw r("Error during database upgrade",o),o}}}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(t,n){const s=this.ensureInitialized(),o=A(t,n);return new Promise((n,r)=>{try{const a=s.transaction(F,"readonly"),c=a.objectStore(F).get(o);c.onsuccess=()=>{const s=c.result;if(null!=s)try{const r=this.decodeStoredValue(s,t,o);n(r)}catch(a){r(a instanceof Error?a:new Error(String(a)))}else n(null)},c.onerror=()=>{r(new StorageError("Failed to get student record","getStudent",c.error))}}catch(a){r(new StorageError("Failed to get student record","getStudent",a))}})}decodeStoredValue(t,n,s){if(j(t))throw new StorageFormatError("Obfuscated data found with ENCRYPT_STORAGE disabled. Run migration to decrypt or re-enable encryption.","plain","obfuscated",s);return t}async saveStudent(t){const n=this.ensureInitialized(),s=A(t.release,t.serviceId),o=t;return new Promise((t,r)=>{try{const a=n.transaction(F,"readwrite"),c=a.objectStore(F).put(o,s);c.onsuccess=()=>{t()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?r(new StorageQuotaError("saveStudent")):r(new StorageError("Failed to save student record","saveStudent",c.error))},a.onerror=()=>{r(new StorageError("Transaction failed while saving student","saveStudent",a.error))}}catch(a){r(new StorageError("Failed to save student record","saveStudent",a))}})}async getStudentsByRelease(t){const n=this.ensureInitialized();return new Promise((s,o)=>{try{const r=n.transaction(F,"readonly").objectStore(F),a=r.index("by-release").getAll(t);a.onsuccess=()=>{s(a.result||[])},a.onerror=()=>{o(new StorageError("Failed to get students by release","getStudentsByRelease",a.error))}}catch(r){o(new StorageError("Failed to get students by release","getStudentsByRelease",r))}})}async getStudentsByReleaseEncrypted(t){const n=this.ensureInitialized(),s=T(t);return new Promise((o,r)=>{try{const c=n.transaction(F,"readonly"),d=c.objectStore(F).openCursor(),l=[];d.onsuccess=()=>{const n=d.result;if(n){const o=n.value;if(j(o))try{const n=U(o,s);n.release===t&&l.push(n)}catch{a(`Skipping corrupted record at key: ${"string"==typeof n.key?n.key:JSON.stringify(n.key)}`)}n.continue()}else o(l)},d.onerror=()=>{r(new StorageError("Failed to get students by release","getStudentsByRelease",d.error))}}catch(c){r(new StorageError("Failed to get students by release","getStudentsByRelease",c))}})}async clearAll(){const t=this.ensureInitialized();return new Promise((n,s)=>{try{const o=t.transaction([F,B,V],"readwrite"),r=o.objectStore(F),a=o.objectStore(B),c=o.objectStore(V),d=r.clear(),l=a.clear(),u=c.clear();let h=!1,p=!1,g=!1;d.onsuccess=()=>{h=!0,p&&g&&n()},l.onsuccess=()=>{p=!0,h&&g&&n()},u.onsuccess=()=>{g=!0,h&&p&&n()},d.onerror=()=>{s(new StorageError("Failed to clear students","clearAll",d.error))},l.onerror=()=>{s(new StorageError("Failed to clear backups","clearAll",l.error))},u.onerror=()=>{s(new StorageError("Failed to clear audit log","clearAll",u.error))},o.onerror=()=>{s(new StorageError("Transaction failed during clearAll","clearAll",o.error))}}catch(o){s(new StorageError("Failed to clear all data","clearAll",o))}})}async backup(t){const n=this.ensureInitialized(),s=(new Date).toISOString(),o=`backup_${s}_${t.serviceId}`,r=A(t.release,t.serviceId),a={...t,originalKey:r,timestamp:s};return new Promise((t,s)=>{try{const r=n.transaction(B,"readwrite"),c=r.objectStore(B).put(a,o);c.onsuccess=()=>{t()},c.onerror=()=>{"QuotaExceededError"===c.error?.name?s(new StorageQuotaError("backup")):s(new StorageError("Failed to create backup","backup",c.error))},r.onerror=()=>{s(new StorageError("Transaction failed during backup","backup",r.error))}}catch(r){s(new StorageError("Failed to create backup","backup",r))}})}async saveAuditEvent(t){const n=this.ensureInitialized();return new Promise((s,o)=>{try{const r=n.transaction(V,"readwrite"),a=r.objectStore(V).add(t);a.onsuccess=()=>{s()},a.onerror=()=>{o(new StorageError("Failed to save audit event","saveAuditEvent",a.error))}}catch(r){o(new StorageError("Failed to save audit event","saveAuditEvent",r))}})}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let Q=null,K=null;function J(t){if(!t)throw new Error("FATAL: dbName is required for getStorageAdapter()");return Q&&K!==t&&(Q.close(),Q=null),Q||(Q=new IndexedDBStorageAdapter(t),K=t),Q}function W(t,n){return 0===n||function(t){return 0===t.length}(t)?"unstarted":function(t,n){if(t.length!==n)return!1;return t.every(t=>!0===t.success)}(t,n)?"complete":"incomplete"}class StorageService{constructor(t){if(!t)throw new Error("FATAL: dbName is required for StorageService");this.dbName=t,this.adapter=J(t)}async init(){try{await this.adapter.init(),this.dbName}catch(t){throw r("Failed to initialize storage service",t),t}}async loadStudentRecord(t){try{const n=await this.adapter.getStudent(t.release,t.serviceId);if(n)return t.serviceId,n;const s={schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}};return t.serviceId,s}catch(n){a(`IndexedDB error, creating new record: ${n.message}`);return{schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}}async saveStudentRecord(t){try{t.updated=(new Date).toISOString();const n=function(t){let n=0,s=0;for(const o in t){const r=t[o];if(r&&r.answers&&Array.isArray(r.answers)){const t=r.answers.filter(t=>""!==t.answer.trim());n+=t.length,s+=t.filter(t=>t.success).length}}return{attempted:n,correct:s}}(t.pages);t.attempted=n.attempted,t.correct=n.correct,await this.adapter.saveStudent(t),t.serviceId}catch(n){throw r("Failed to save student record",n),n}}updateRecordWithAnswer(t,n,s,o,r){const a=t.pages[n]||{answers:[],state:"unstarted"};for(;a.answers.length<=s;)a.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});a.answers[s]=o;const c=(new Date).toISOString();return a.firstAttempted||(a.firstAttempted=c),a.lastAttempted=c,a.state=W(a.answers,r),{...t,pages:{...t.pages,[n]:a}}}buildCache(t){return function(t){const n={totals:{total:0,answered:0,correct:0},pages:{}};for(const[s,o]of Object.entries(t.pages)){const t=g(0,o);n.pages[s]=t,n.totals.total+=t.total,n.totals.answered+=t.answered,n.totals.correct+=t.correct}return n}(t)}async getStudentsByRelease(t){try{return await this.adapter.getStudentsByRelease(t)}catch(n){throw r("Failed to get students by release",n),n}}async clearAll(){try{await this.adapter.clearAll()}catch(t){throw r("Failed to clear all data",t),t}}async backup(t){try{await this.adapter.backup(t),t.serviceId}catch(n){a(`Failed to create backup for ${t.serviceId}`,n)}}}let Y=null,G=null;function Z(t){if(Y&&!t)return Y;if(Y&&t&&G!==t)return a(`Storage service already initialized with dbName="${G}", ignoring new dbName="${t}"`),Y;if(!Y){if(!t)throw new Error("FATAL: dbName is required for first getStorageService() call");Y=new StorageService(t),G=t}return Y}const X=new WeakMap;function tt(t,n){const s=X.get(t);let o;if(s){if(s.interactive||!n.interactive)return!0;o=s.parsed}else o=c(t),o.errors&&o.errors.length>0&&r("Quiz table has validation errors:",o.errors);const l={parsed:o,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return r("Interactive mode requires pageId option"),!1;n.pageId,l.debouncer=new Debouncer,l.inputs=[]}if(X.set(t,l),n.interactive){const n=function(t,n){const{parsed:s,pageId:o,debouncer:c}=n;if(!o||!c)return r("Interactive mode requires pageId and debouncer"),!1;(function(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&S(n[1],"qd-hidden");const s=t.querySelectorAll("tbody tr");s.forEach(t=>{const n=t.querySelectorAll("td");n[1]&&S(n[1],"qd-hidden")})})(t),st(t);if(!C(u.SESSION))return r("No active session found"),!1;let l=C(u.CACHE);l?(l.totals.total,Object.keys(l.pages).length):l={totals:{total:0,answered:0,correct:0},pages:{}};const h=s.questions.length;l=function(t,n,s){const o=t.pages[n];if(o&&o.total>=s)return t;const r=s-(o?.total||0),a={state:o?.state||"unstarted",total:s,answered:o?.answered||0,correct:o?.correct||0,last:o?.last,answers:o?.answers,analysis:o?.analysis};return{totals:{total:t.totals.total+r,answered:t.totals.answered,correct:t.totals.correct},pages:{...t.pages,[n]:a}}}(l,o,h),$(u.CACHE,l);const p=l?.pages[o],g=p?.answers||[];g.length;const m=t.querySelector("tbody");if(!m)return r("Quiz table has no tbody element"),!1;const f=Array.from(m.querySelectorAll("tr")),b=[];s.questions.forEach((s,o)=>{const c=f[o];if(!c)return;const l=Array.from(c.querySelectorAll("td"));if(3!==l.length)return;const h=l[0],p=l[1];if(!h||!p)return;const m=g[o];m&&m.answer&&(m.answer,m.success);const y=function(t,n){const s=function(t,n){if("mcq"===t.kind){const s=(t.options||[]).map((t,n)=>({value:String(n+1),text:`${n+1}. ${t}`}));return{type:"select",className:"qd-quiz-input",placeholder:"Select an answer...",value:n?.answer||"",options:s}}return{type:"text",className:"qd-quiz-input",placeholder:"Enter value",value:n?.answer||""}}(t,n);if("select"===s.type){const t=v("select");t.className=s.className;const n=v("option");return n.value="",n.textContent=s.placeholder,n.disabled=!0,t.appendChild(n),s.options&&s.options.forEach(n=>{const s=v("option");s.value=n.value,s.textContent=n.text,t.appendChild(s)}),t.value=s.value,t}{const t=v("input");return t.type=s.type,t.className=s.className,t.placeholder=s.placeholder,t.value=s.value,t}}(s,m);b.push(y),p.textContent="",p.appendChild(y),m&&et(p,m.success);const w="SELECT"===y.tagName?"change":"input";y.addEventListener(w,()=>{!function(t,n,s,o){const{debouncer:c,pageId:l,parsed:h}=n;if(!c||!l)return;const p=h.questions[s];if(!p)return;c.debounce(`save-answer-${s}`,()=>{!async function(t,n,s,o){const{pageId:c,parsed:l,inputs:h}=n;if(!c||!h)return;const p=l.questions[s];if(!p)return;const g=C(u.SESSION);if(!g)return void r("No active session found");const m=d(p,o),f={answer:o.trim(),success:m,timestamp:(new Date).toISOString()},b=Z();let y;try{y=await b.loadStudentRecord(g)}catch(A){return void a("Failed to load student record, answer not saved",A)}const v=l.questions.length,w=b.updateRecordWithAnswer(y,c,s,f,v);try{await b.saveStudentRecord(w)}catch(A){a("Failed to save student record to IndexedDB",A)}const S=b.buildCache(w);$(u.CACHE,S);const E=t.querySelector(`tbody tr:nth-child(${s+1})`);if(E){const t=E.querySelector("td:nth-child(2)");t&&et(t,m)}x("qd:answer-saved",{pageId:c,answer:f});const q=w.pages[c];q&&x("qd:state-changed",{pageId:c,state:q.state})}(t,n,s,o)},200)}(t,n,o,y.value)})}),n.inputs=b;const y=()=>{rt(t,n)},E=()=>{it(t)};document.addEventListener("qd:instructor-show-answers",y),document.addEventListener("qd:instructor-hide-answers",E);const q="true"===sessionStorage.getItem(u.INSTRUCTOR),A="true"===sessionStorage.getItem("qd/instructor/showAnswers");q&&A&&rt(t,n);const O=()=>{if(t.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(t=>{S(t,"qd-answer-correct","qd-answer-incorrect")}),n.inputs)for(const t of n.inputs)t instanceof HTMLSelectElement?t.selectedIndex=0:t instanceof HTMLInputElement&&(t.value="");it(t)},T=()=>{O()},P=()=>{O()};return document.addEventListener("qd:logout",T),document.addEventListener("qd:login",P),n.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",y),document.removeEventListener("qd:instructor-hide-answers",E),document.removeEventListener("qd:logout",T),document.removeEventListener("qd:login",P)},w(t,"qd-quiz-interactive"),!0}(t,l);return n?o.questions.length:r("Interactive enhancement failed"),n}return function(t){return function(t){const n=t.querySelector("colgroup");n&&n.remove()}(t),nt(t),st(t),w(t,"qd-quiz-non-interactive"),!0}(t)}function et(t,n){S(t,"qd-answer-correct","qd-answer-incorrect"),w(t,n?"qd-answer-correct":"qd-answer-incorrect")}function nt(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&w(n[1],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[1]&&(w(n[1],"qd-hidden"),n[1].textContent="")})}function st(t){const n=t.querySelectorAll("thead th, thead td");n[2]&&w(n[2],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[2]&&w(n[2],"qd-hidden")})}function ot(t){return X.get(t)}async function rt(t,n){const{pageId:s,parsed:o}=n;if(!s)return;const a=C(u.SESSION);if(!a)return;const c=Z();try{const n=await c.getStudentsByRelease(a.release);if(0===n.length)return void alert("No student data available for this release. Students need to log in and answer questions first.");const r=t.querySelector("tbody");if(!r)return;const d=Array.from(r.querySelectorAll("tr"));o.questions.forEach((t,o)=>{const r=d[o];if(!r)return;const a=Array.from(r.querySelectorAll("td"))[1];if(!a)return;const c=a.querySelector(".qd-student-answers");c&&c.remove();const l=function(t,n,s){const o=[];for(const r of t){const t=r.pages[n];if(!t||!t.answers)continue;const a=t.answers[s];a&&o.push({name:r.name,maskedServiceId:r.serviceId.slice(-4),answer:a.answer,success:a.success,formattedTimestamp:m(a.timestamp),cssClass:a.success?"qd-correct":"qd-incorrect"})}return o}(n,s,o);if(l.length>0){const t=document.createElement("div");t.className="qd-student-answers",l.forEach(n=>{const s=document.createElement("div");s.className=`qd-student-answer ${n.cssClass}`,s.innerHTML=`\n            <span class="qd-student-name">${n.name} (${n.maskedServiceId})</span>:\n            <span class="qd-student-answer-text">${n.answer}</span>\n            <span class="qd-timestamp">${n.formattedTimestamp}</span>\n          `,t.appendChild(s)}),a.appendChild(t)}}),n.length}catch(d){r("Failed to load student answers",d)}}function it(t){t.querySelectorAll(".qd-student-answers").forEach(t=>t.remove())}function at(t,n=16){let s=5381;for(let r=0;r<t.length;r++){s=(s<<5)+s+t.charCodeAt(r),s&=s}const o=Math.abs(s).toString(16).padStart(8,"0");return o.repeat(Math.ceil(n/o.length)).substring(0,n)}function ct(t){const n=f(t),s=n[0],o=s?b(s).length:0,r=t.className||"qd-analysis";return at(`${n.length}x${o}:${r}`,16)}function dt(t,n,s){return`R${t}C${n}#f:${at(s.replace(/\s+/g," ").trim(),8)}`}function lt(t){return t.classList.contains("interactive")}function ut(t){const n=[];t.querySelector("tbody")||n.push("Analysis table must have a tbody element");const s=f(t);0===s.length&&n.push("Analysis table must have at least one row");const o=ct(t),r=[];return s.forEach((t,n)=>{b(t).forEach((t,s)=>{if(lt(t)){const o=y(t),a=dt(n,s,o);r.push({row:n,col:s,key:a})}})}),{element:t,tableId:o,editableCells:r,errors:n.length>0?n:void 0}}const ht=new WeakMap;function pt(t,n){const s=ut(t);s.errors&&s.errors.length>0&&r("Analysis table has validation errors:",s.errors);const o={parsed:s,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return r("Interactive mode requires pageId option"),!1;o.debouncer=new Debouncer,o.cellKeyMap=new Map}return ht.set(t,o),n.interactive?function(t,n){const{parsed:s,pageId:o,debouncer:c,cellKeyMap:d}=n;if(!o||!c||!d)return r("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!C(u.SESSION))return r("No active session found"),!1;const l=C(u.CACHE),h=l?.pages[o],p=h?.analysis,g=p?.cells||{},m=f(t);return s.editableCells.forEach(({row:t,col:s,key:o})=>{const c=m[t];if(!c)return;const l=b(c)[s];l&&(lt(l)?(d.set(l,o),g[o]&&(l.textContent=g[o]),l.contentEditable="true",w(l,"qd-editable"),l.addEventListener("input",()=>{!function(t,n,s){const{debouncer:o,pageId:c}=t;if(!o||!c)return;const d=y(n);o.debounce(`save-cell-${s}`,()=>{!async function(t,n,s){const{pageId:o,parsed:c}=t;if(!o)return;const d=C(u.SESSION);if(!d)return void r("No active session found");const l=Z();let h;try{h=await l.loadStudentRecord(d)}catch(b){return void a("Failed to load student record, analysis not saved",b)}const p=h.pages[o]||{answers:[],state:"unstarted"},g=p.analysis||{tableId:c.tableId,cells:{}};g.cells[n]=s;const m=(new Date).toISOString();g.firstEdited||(g.firstEdited=m);g.lastEdited=m,p.analysis=g,h.pages[o]=p,h.updated=m;try{await l.saveStudentRecord(h)}catch(b){a("Failed to save student record to IndexedDB",b)}const f=l.buildCache(h);$(u.CACHE,f),x("qd:analysis-saved",{pageId:o,tableId:c.tableId,cellKey:n,content:s})}(t,s,d)},500)}(n,l,o)})):r(`Cell at R${t}C${s} is no longer editable`))}),w(t,"qd-analysis-interactive"),!0}(t,o):function(t){w(t,"qd-analysis-non-interactive");const n=()=>{!async function(t){const n=ht.get(t);if(!n)return void a("Cannot show student entries: table not enhanced");const s=n.pageId||function(){const t=document.body.dataset.pageId;if(t)return t;const n=window.location.pathname,s=(n.split("/").pop()||"").replace(".html","");return s||void 0}();if(!s)return void a("Cannot show student entries: page ID not found");const o=C(u.SESSION);if(!o)return void a("Cannot show student entries: no active session");const c=Z();let d;try{d=await c.getStudentsByRelease(o.release)}catch(g){return void r("Failed to load students for instructor view:",g)}const l=function(t,n){const s={};return t.forEach(t=>{const o=t.pages[n];if(!o||!o.analysis)return;const{cells:r}=o.analysis,a=o.analysis.lastEdited||t.updated;Object.entries(r).forEach(([n,o])=>{s[n]||(s[n]=[]),s[n].push({serviceId:t.serviceId,name:t.name,content:o,timestamp:a})})}),s}(d,s),{editableCells:h}=n.parsed,p=f(t);h.forEach(({row:t,col:n,key:s})=>{const o=p[t];if(!o)return;const r=b(o)[n];if(!r)return;const a=function(t){const n=document.createElement("div");if(n.className="qd-student-entries",0===t.length)return n.className+=" qd-no-entries",n.textContent="(No entries yet)",n.style.cssText="color: #9ca3af; font-style: italic; font-size: 13px; padding: 8px 0;",n;const s=function(t){return[...t].sort((t,n)=>{const s=new Date(t.timestamp).getTime();return new Date(n.timestamp).getTime()-s})}(t);return s.forEach(t=>{const s=document.createElement("div");s.className="qd-entry",s.style.cssText="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #1f2937;";const o=t.serviceId.slice(-4),r=m(t.timestamp),a=document.createElement("span");a.style.cssText="font-weight: 600; color: #374151;",a.textContent=`${t.name} (${o}) • ${r}: `;const c=document.createElement("span");c.style.cssText="white-space: pre-wrap;",c.textContent=t.content,s.appendChild(a),s.appendChild(c),n.appendChild(s)}),n.style.cssText="margin-top: 12px; padding-top: 8px; border-top: 2px solid #3b82f6;",n}(l[s]||[]);a.setAttribute("data-qd-student-entries","true");const c=r.querySelector("[data-qd-student-entries]");c&&c.remove(),r.appendChild(a)}),h.length}(t)},s=()=>{gt(t)};return document.addEventListener("qd:instructor-show-answers",n),document.addEventListener("qd:instructor-hide-answers",s),!0}(t)}function gt(t){t.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove())}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers()}registerLoginHandlers(){this.addEventListener("qd:login",t=>{(async()=>{const n=t.detail;if(n.serviceId,n.name,"INSTRUCTOR"===n.serviceId)return;const s=C(u.SESSION);if(!s)return;const o=Z();let r,a;try{r=await o.loadStudentRecord(s),await o.saveStudentRecord(r),a=o.buildCache(r),$(u.CACHE,a),a.totals.total}catch{$(u.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}this.dispatchEvent("qd:cache-rebuild",{}),this.upgradeTablesAfterLogin()})()})}upgradeTablesAfterLogin(){const t=window.location.pathname,n=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!n)return;if("true"===sessionStorage.getItem(u.INSTRUCTOR)){return void document.querySelectorAll("table.qd-quiz").forEach(t=>{const s=ot(t);if(!s)return;s.pageId=n;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,n)=>{const o=s.parsed.questions[n];o&&t instanceof HTMLTableCellElement&&(t.textContent=o.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const o=()=>{rt(t,s)};document.addEventListener("qd:instructor-show-answers",o),document.addEventListener("qd:instructor-hide-answers",()=>{it(t)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&o()})}const s=document.querySelectorAll("table.qd-quiz");s.length>0&&(s.length,s.forEach(t=>{tt(t,{interactive:!0,pageId:n})}));const o=document.querySelectorAll("table.qd-analysis");o.length>0&&(o.length,o.forEach(t=>{pt(t,{interactive:!0,pageId:n})}))}registerLogoutHandlers(){this.addEventListener("qd:logout",t=>{t.detail.serviceId;document.querySelectorAll("table.qd-quiz").forEach(t=>{!function(t){const n=X.get(t);n&&(n.interactive=!1,n.pageId=void 0,n.inputs=void 0,n.cleanupInstructorListeners?.(),n.cleanupInstructorListeners=void 0,nt(t),st(t),S(t,"qd-quiz-interactive"))}(t)});document.querySelectorAll("table.qd-analysis").forEach(t=>{!function(t){const n=ht.get(t);n&&(gt(t),n.interactive&&(t.querySelectorAll(".qd-editable").forEach(t=>{t instanceof HTMLTableCellElement&&(t.contentEditable="false",t.classList.remove("qd-editable"),t.textContent="")}),t.classList.remove("qd-analysis-interactive"),n.debouncer?.cancelAll()),n.interactive=!1,n.pageId=void 0,n.debouncer=void 0,n.cellKeyMap=void 0)}(t)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",t=>{const n=t.detail;n.pageId,n.questionIndex,n.answer,n.success,this.dispatchEvent("qd:cache-update",{pageId:n.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",t=>{const n=t.detail;n.pageId,n.state,this.dispatchEvent("qd:badge-update",{pageId:n.pageId,state:n.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",t=>{t.detail.unlockTime}),this.addEventListener("qd:instructor-lock",()=>{})}registerDataHandlers(){this.addEventListener("qd:data-cleared",t=>{t.detail.timestamp,this.dispatchEvent("qd:cache-clear",{})})}addEventListener(t,n){document.addEventListener(t,n);const s=this.listeners.get(t)||[];s.push(n),this.listeners.set(t,s)}dispatchEvent(t,n){const s=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0});document.dispatchEvent(s)}cleanup(){for(const[t,n]of this.listeners)for(const s of n)document.removeEventListener(t,s);this.listeners.clear()}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const t=this.sessionService.getSession();if(t){if(t.serviceId,this.sessionService.isExpired())return a("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(t),this.setupActivityTracking()}}scheduleExpiryCheck(t){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const n=(new Date).getTime(),s=new Date(t.expiresAt).getTime()-n;s<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{this.sessionService.clearSession()},s)}setupActivityTracking(){const t=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const t=this.sessionService.getSession();t&&this.scheduleExpiryCheck(t)};let n;const s=()=>{void 0!==n&&window.clearTimeout(n),n=window.setTimeout(()=>{t()},5e3)};["click","keydown","scroll","mousemove"].forEach(t=>{document.addEventListener(t,s,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */const mt=globalThis,ft=mt.ShadowRoot&&(void 0===mt.ShadyCSS||mt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,bt=Symbol(),yt=new WeakMap;let vt=class{constructor(t,n,s){if(this._$cssResult$=!0,s!==bt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o;const n=this.t;if(ft&&void 0===t){const s=void 0!==n&&1===n.length;s&&(t=yt.get(n)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&yt.set(n,t))}return t}toString(){return this.cssText}};const wt=(t,...n)=>{const s=1===t.length?t[0]:n.reduce((n,s,o)=>n+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new vt(s,t,bt)},St=ft?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let n="";for(const s of t.cssRules)n+=s.cssText;return(t=>new vt("string"==typeof t?t:t+"",void 0,bt))(n)})(t):t,{is:xt,defineProperty:Et,getOwnPropertyDescriptor:Ct,getOwnPropertyNames:$t,getOwnPropertySymbols:It,getPrototypeOf:qt}=Object,At=globalThis,kt=At.trustedTypes,Ot=kt?kt.emptyScript:"",Tt=At.reactiveElementPolyfillSupport,Pt=(t,n)=>t,_t={toAttribute(t,n){switch(n){case Boolean:t=t?Ot:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,n){let s=t;switch(n){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(o){s=null}}return s}},Nt=(t,n)=>!xt(t,n),Lt={attribute:!0,type:String,converter:_t,reflect:!1,useDefault:!1,hasChanged:Nt};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),At.litPropertyMetadata??=new WeakMap;let Dt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=Lt){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){const s=Symbol(),o=this.getPropertyDescriptor(t,s,n);void 0!==o&&Et(this.prototype,t,o)}}static getPropertyDescriptor(t,n,s){const{get:o,set:r}=Ct(this.prototype,t)??{get(){return this[n]},set(t){this[n]=t}};return{get:o,set(n){const a=o?.call(this);r?.call(this,n),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Lt}static _$Ei(){if(this.hasOwnProperty(Pt("elementProperties")))return;const t=qt(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Pt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Pt("properties"))){const t=this.properties,n=[...$t(t),...It(t)];for(const s of n)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const n=litPropertyMetadata.get(t);if(void 0!==n)for(const[t,s]of n)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[n,s]of this.elementProperties){const t=this._$Eu(n,s);void 0!==t&&this._$Eh.set(t,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const n=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)n.unshift(St(t))}else void 0!==t&&n.push(St(t));return n}static _$Eu(t,n){const s=n.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,n=this.constructor.elementProperties;for(const s of n.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(ft)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of n){const n=document.createElement("style"),o=mt.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=s.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,s){this._$AK(t,s)}_$ET(t,n){const s=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,s);if(void 0!==o&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:_t).toAttribute(n,s.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,n){const s=this.constructor,o=s._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=s.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:_t;this._$Em=o;const a=r.fromAttribute(n,t.type);this[o]=a??this._$Ej?.get(o)??a,this._$Em=null}}requestUpdate(t,n,s){if(void 0!==t){const o=this.constructor,r=this[t];if(s??=o.getPropertyOptions(t),!((s.hasChanged??Nt)(r,n)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,n,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,n,{useDefault:s,reflect:o,wrapped:r},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??n??this[t]),!0!==r||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||s||(n=void 0),this._$AL.set(t,n)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,n]of this._$Ep)this[t]=n;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[n,s]of t){const{wrapped:t}=s,o=this[n];!0!==t||this._$AL.has(n)||void 0===o||this.C(n,void 0,s,o)}}let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};Dt.elementStyles=[],Dt.shadowRootOptions={mode:"open"},Dt[Pt("elementProperties")]=new Map,Dt[Pt("finalized")]=new Map,Tt?.({ReactiveElement:Dt}),(At.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Rt=globalThis,Mt=Rt.trustedTypes,zt=Mt?Mt.createPolicy("lit-html",{createHTML:t=>t}):void 0,Ht="$lit$",Ut=`lit$${Math.random().toFixed(9).slice(2)}$`,jt="?"+Ut,Ft=`<${jt}>`,Bt=document,Vt=()=>Bt.createComment(""),Qt=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Kt=Array.isArray,Jt="[ \t\n\f\r]",Wt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Yt=/-->/g,Gt=/>/g,Zt=RegExp(`>|${Jt}(?:([^\\s"'>=/]+)(${Jt}*=${Jt}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Xt=/'/g,te=/"/g,ee=/^(?:script|style|textarea|title)$/i,ne=(ae=1,(t,...n)=>({_$litType$:ae,strings:t,values:n})),se=Symbol.for("lit-noChange"),oe=Symbol.for("lit-nothing"),re=new WeakMap,ie=Bt.createTreeWalker(Bt,129);var ae;function ce(t,n){if(!Kt(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==zt?zt.createHTML(n):n}class N{constructor({strings:t,_$litType$:n},s){let o;this.parts=[];let r=0,a=0;const c=t.length-1,d=this.parts,[l,u]=((t,n)=>{const s=t.length-1,o=[];let r,a=2===n?"<svg>":3===n?"<math>":"",c=Wt;for(let d=0;d<s;d++){const n=t[d];let s,l,u=-1,h=0;for(;h<n.length&&(c.lastIndex=h,l=c.exec(n),null!==l);)h=c.lastIndex,c===Wt?"!--"===l[1]?c=Yt:void 0!==l[1]?c=Gt:void 0!==l[2]?(ee.test(l[2])&&(r=RegExp("</"+l[2],"g")),c=Zt):void 0!==l[3]&&(c=Zt):c===Zt?">"===l[0]?(c=r??Wt,u=-1):void 0===l[1]?u=-2:(u=c.lastIndex-l[2].length,s=l[1],c=void 0===l[3]?Zt:'"'===l[3]?te:Xt):c===te||c===Xt?c=Zt:c===Yt||c===Gt?c=Wt:(c=Zt,r=void 0);const p=c===Zt&&t[d+1].startsWith("/>")?" ":"";a+=c===Wt?n+Ft:u>=0?(o.push(s),n.slice(0,u)+Ht+n.slice(u)+Ut+p):n+Ut+(-2===u?d:p)}return[ce(t,a+(t[s]||"<?>")+(2===n?"</svg>":3===n?"</math>":"")),o]})(t,n);if(this.el=N.createElement(l,s),ie.currentNode=this.el.content,2===n||3===n){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=ie.nextNode())&&d.length<c;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(Ht)){const n=u[a++],s=o.getAttribute(t).split(Ut),c=/([.?@])?(.*)/.exec(n);d.push({type:1,index:r,name:c[2],strings:s,ctor:"."===c[1]?H:"?"===c[1]?I:"@"===c[1]?L:k}),o.removeAttribute(t)}else t.startsWith(Ut)&&(d.push({type:6,index:r}),o.removeAttribute(t));if(ee.test(o.tagName)){const t=o.textContent.split(Ut),n=t.length-1;if(n>0){o.textContent=Mt?Mt.emptyScript:"";for(let s=0;s<n;s++)o.append(t[s],Vt()),ie.nextNode(),d.push({type:2,index:++r});o.append(t[n],Vt())}}}else if(8===o.nodeType)if(o.data===jt)d.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(Ut,t+1));)d.push({type:7,index:r}),t+=Ut.length-1}r++}}static createElement(t,n){const s=Bt.createElement("template");return s.innerHTML=t,s}}function de(t,n,s=t,o){if(n===se)return n;let r=void 0!==o?s._$Co?.[o]:s._$Cl;const a=Qt(n)?void 0:n._$litDirective$;return r?.constructor!==a&&(r?._$AO?.(!1),void 0===a?r=void 0:(r=new a(t),r._$AT(t,s,o)),void 0!==o?(s._$Co??=[])[o]=r:s._$Cl=r),void 0!==r&&(n=de(t,r._$AS(t,n.values),r,o)),n}class M{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:n},parts:s}=this._$AD,o=(t?.creationScope??Bt).importNode(n,!0);ie.currentNode=o;let r=ie.nextNode(),a=0,c=0,d=s[0];for(;void 0!==d;){if(a===d.index){let n;2===d.type?n=new R(r,r.nextSibling,this,t):1===d.type?n=new d.ctor(r,d.name,d.strings,this,t):6===d.type&&(n=new z(r,this,t)),this._$AV.push(n),d=s[++c]}a!==d?.index&&(r=ie.nextNode(),a++)}return ie.currentNode=Bt,o}p(t){let n=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,n),n+=s.strings.length-2):s._$AI(t[n])),n++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,s,o){this.type=2,this._$AH=oe,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=s,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const n=this._$AM;return void 0!==n&&11===t?.nodeType&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=de(this,t,n),Qt(t)?t===oe||null==t||""===t?(this._$AH!==oe&&this._$AR(),this._$AH=oe):t!==this._$AH&&t!==se&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Kt(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==oe&&Qt(this._$AH)?this._$AA.nextSibling.data=t:this.T(Bt.createTextNode(t)),this._$AH=t}$(t){const{values:n,_$litType$:s}=t,o="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(ce(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===o)this._$AH.p(n);else{const t=new M(o,this),s=t.u(this.options);t.p(n),this.T(s),this._$AH=t}}_$AC(t){let n=re.get(t.strings);return void 0===n&&re.set(t.strings,n=new N(t)),n}k(t){Kt(this._$AH)||(this._$AH=[],this._$AR());const n=this._$AH;let s,o=0;for(const r of t)o===n.length?n.push(s=new R(this.O(Vt()),this.O(Vt()),this,this.options)):s=n[o],s._$AI(r),o++;o<n.length&&(this._$AR(s&&s._$AB.nextSibling,o),n.length=o)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){const n=t.nextSibling;t.remove(),t=n}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,s,o,r){this.type=1,this._$AH=oe,this._$AN=void 0,this.element=t,this.name=n,this._$AM=o,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=oe}_$AI(t,n=this,s,o){const r=this.strings;let a=!1;if(void 0===r)t=de(this,t,n,0),a=!Qt(t)||t!==this._$AH&&t!==se,a&&(this._$AH=t);else{const o=t;let c,d;for(t=r[0],c=0;c<r.length-1;c++)d=de(this,o[s+c],n,c),d===se&&(d=this._$AH[c]),a||=!Qt(d)||d!==this._$AH[c],d===oe?t=oe:t!==oe&&(t+=(d??"")+r[c+1]),this._$AH[c]=d}a&&!o&&this.j(t)}j(t){t===oe?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===oe?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==oe)}}class L extends k{constructor(t,n,s,o,r){super(t,n,s,o,r),this.type=5}_$AI(t,n=this){if((t=de(this,t,n,0)??oe)===se)return;const s=this._$AH,o=t===oe&&s!==oe||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==oe&&(s===oe||o);o&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,n,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){de(this,t)}}const le=Rt.litHtmlPolyfillSupport;le?.(N,R),(Rt.litHtmlVersions??=[]).push("3.3.1");const ue=(t,n,s)=>{const o=s?.renderBefore??n;let r=o._$litPart$;if(void 0===r){const t=s?.renderBefore??null;o._$litPart$=r=new R(n.insertBefore(Vt(),t),t,void 0,s??{})}return r._$AI(t),r},he=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let pe=class extends Dt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ue(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return se}};pe._$litElement$=!0,pe.finalized=!0,he.litElementHydrateSupport?.({LitElement:pe});const ge=he.litElementPolyfillSupport;ge?.({LitElement:pe}),(he.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const me=t=>(n,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,n)}):customElements.define(t,n)},fe={attribute:!0,type:String,converter:_t,reflect:!1,hasChanged:Nt},be=(t=fe,n,s)=>{const{kind:o,metadata:r}=s;let a=globalThis.litPropertyMetadata.get(r);if(void 0===a&&globalThis.litPropertyMetadata.set(r,a=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),a.set(s.name,t),"accessor"===o){const{name:o}=s;return{set(s){const r=n.get.call(this);n.set.call(this,s),this.requestUpdate(o,r,t)},init(n){return void 0!==n&&this.C(o,void 0,t,n),n}}}if("setter"===o){const{name:o}=s;return function(s){const r=this[o];n.call(this,s),this.requestUpdate(o,r,t)}}throw Error("Unsupported decorator location: "+o)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function ye(t){return(n,s)=>"object"==typeof s?be(t,n,s):((t,n,s)=>{const o=n.hasOwnProperty(s);return n.constructor.createProperty(s,t),o?Object.getOwnPropertyDescriptor(n,s):void 0})(t,n,s)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function ve(t){return ye({...t,state:!0,attribute:!1})}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
function we(t,n){return(n,s,o)=>((t,n,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&"object"!=typeof n&&Object.defineProperty(t,n,s),s))(n,s,{get(){return(n=>n.renderRoot?.querySelector(t)??null)(this)}})}const Se=".wh_top_menu_and_indexterms_link",xe=".wh_publication_title .title",Ee="",Ce="qd-status-container",$e="qd-title-selector",Ie="qd-instructor-hash",qe="qd-db-name";function Ae(t,n){const s=document.querySelector(`#${t}`);if(!s)return n;const o=s.textContent?.trim()||"";return""===o?(a(`Config element #${t} found but empty, using default: "${n}"`),n):o}function ke(){const t=function(t){const n=document.querySelector(`#${t}`);if(!n){const n=`FATAL: Required config element #${t} not found in DOM. Processing stopped.`;throw console.error(n),new Error(n)}const s=n.textContent?.trim()||"";if(""===s){const n=`FATAL: Required config element #${t} is empty. Processing stopped.`;throw console.error(n),new Error(n)}return s}(qe);return{statusPanelContainer:Ae(Ce,Se),titleSelector:Ae($e,xe),instructorHash:Ae(Ie,Ee),dbName:t}}function Oe(t){return t.schema<2}function Te(t){return Boolean(t.pinHash&&t.pinHash.length>0)}function Pe(t,n){return{...t,schema:2,pinHash:n,pinCreatedAt:(new Date).toISOString()}}async function _e(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("")}async function Ne(t,n){return function(t,n){if(t.length!==n.length)return!1;let s=0;for(let o=0;o<t.length;o++)s|=t.charCodeAt(o)^n.charCodeAt(o);return 0===s}(await _e(t),n)}function Le(t){return`${u.PIN_ATTEMPTS}:${t}`}function De(t){const n=Le(t),s=sessionStorage.getItem(n);if(!s)return null;try{return JSON.parse(s)}catch{return null}}function Re(t){const n=De(t);if(!n||!n.lockoutUntil)return{isLocked:!1,remainingMs:0};const s=new Date(n.lockoutUntil).getTime(),o=Date.now();return s>o?{isLocked:!0,remainingMs:s-o}:(ze(t),{isLocked:!1,remainingMs:0})}function Me(t){const s=(new Date).toISOString();let o=De(t);if(o||(o={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:s}),o.attempts+=1,o.lastAttempt=s,o.attempts>=h){const s=new Date(Date.now()+p);o.lockoutUntil=s.toISOString(),a(`PIN lockout triggered for ${n(t)} after ${o.attempts} failed attempts`)}else o.attempts,n(t);const r=Le(t);return sessionStorage.setItem(r,JSON.stringify(o)),o}function ze(t){const s=De(t);s&&s.attempts>0&&(s.attempts,n(t));const o=Le(t);sessionStorage.removeItem(o)}function He(t){const n=De(t);if(!n)return h;return Re(t).isLocked?0:Math.max(0,h-n.attempts)}var Ue=Object.getOwnPropertyDescriptor;let je=class extends pe{render(){return ne`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"28/Nov/2025"}</span>
      </div>
    `}};je.styles=wt`
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
  `,je=((t,n,s,o)=>{for(var r,a=o>1?void 0:o?Ue(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=r(a)||a);return a})([me("qd-build-info")],je);var Fe=Object.defineProperty,Be=Object.getOwnPropertyDescriptor,Ve=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Be(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Fe(n,s,a),a};const Qe="__qdModalCurrentRef__";function Ke(){return globalThis[Qe]??null}function Je(t){globalThis[Qe]=t}let We=class extends pe{constructor(){super(...arguments),this.open=!1,this.closable=!0,this.previouslyFocused=null,this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this.open&&this.closable&&(this.emitCloseEvent(),this.close())},this.handleBackdropClick=()=>{this.closable&&(this.emitCloseEvent(),this.close())},this.handleCloseClick=()=>{this.emitCloseEvent(),this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),Ke()!==this||this.isInBody||Je(null)}updated(t){t.has("open")&&(this.open?this.handleOpen():this.handleClose())}moveToBody(){this.isInBody||(this.originalParent=this.parentNode,this.originalNextSibling=this.nextSibling,this.isInBody=!0,document.body.appendChild(this))}restorePosition(){this.isInBody&&this.originalParent&&(this.originalNextSibling?this.originalParent.insertBefore(this,this.originalNextSibling):this.originalParent.appendChild(this),this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1)}render(){return ne`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="header">
            <span class="header-title"><slot name="header"></slot></span>
            ${this.closable?ne`<button
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
    `}show(){this.open=!0}close(){this.open=!1}handleOpen(){const t=Ke();t&&t!==this&&t.close(),Je(this),this.previouslyFocused=document.activeElement,this.moveToBody(),requestAnimationFrame(()=>{this.focusFirstElement()})}handleClose(){Ke()===this&&Je(null),this.restorePosition(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}focusFirstElement(){const t=this.shadowRoot?.querySelector(".content");if(!t)return;const n=this.shadowRoot?.querySelector("slot:not([name])");if(n){const t=n.assignedElements({flatten:!0});for(const n of t){const t=n.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t)return void t.focus();if(n instanceof HTMLElement&&n.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))return void n.focus()}}const s=this.shadowRoot?.querySelector(".close-button");s&&s.focus()}emitCloseEvent(){const t=new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0});this.dispatchEvent(t)}};We.styles=wt`
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
  `,Ve([ye({type:Boolean,reflect:!0})],We.prototype,"open",2),Ve([ye({type:Boolean})],We.prototype,"closable",2),We=Ve([me("qd-modal")],We);var Ye=Object.defineProperty,Ge=Object.getOwnPropertyDescriptor,Ze=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Ge(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Ye(n,s,a),a};let Xe=class extends pe{constructor(){super(...arguments),this.open=!1,this.title="Enter Password",this.error="",this.password="",this.handleModalClose=()=>{this.close()},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=t=>{t.preventDefault(),this.password.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:this.password},bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close()}}show(){this.open=!0,this.password="",this.error=""}close(){this.open=!1,this.password="",this.error="",this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}updated(t){t.has("open")&&this.open&&(this.password="",this.updateComplete.then(()=>{this.passwordInput?.focus()}))}render(){return ne`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        ${this.open?ne`
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

                ${this.error?ne`<div class="error-message">${this.error}</div>`:""}

                <div class="button-row">
                  <button type="button" @click=${this.handleCancel}>Cancel</button>
                  <button type="submit">Login</button>
                </div>
              </form>
            `:oe}
      </qd-modal>
    `}};Xe.styles=wt`
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
  `,Ze([ye({type:Boolean,reflect:!0})],Xe.prototype,"open",2),Ze([ye({type:String})],Xe.prototype,"title",2),Ze([ye({type:String})],Xe.prototype,"error",2),Ze([ve()],Xe.prototype,"password",2),Ze([we('input[type="password"]')],Xe.prototype,"passwordInput",2),Xe=Ze([me("qd-password-modal")],Xe);
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const tn=2;class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,s){this._$Ct=t,this._$AM=n,this._$Ci=s}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class e extends i{constructor(t){if(super(t),this.it=oe,t.type!==tn)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===oe||null==t)return this._t=void 0,this.it=t;if(t===se)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;const en=(t=>(...n)=>({_$litDirective$:t,values:n}))(e);var nn=Object.defineProperty,sn=Object.getOwnPropertyDescriptor,on=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?sn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&nn(n,s,a),a};let rn=class extends pe{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}render(){return ne`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${en(this.message)}</div>

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
    `}};rn.styles=wt`
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
  `,on([ye({type:Boolean,reflect:!0})],rn.prototype,"open",2),on([ye({type:String})],rn.prototype,"title",2),on([ye({type:String})],rn.prototype,"message",2),on([ye({type:String})],rn.prototype,"confirmText",2),on([ye({type:String})],rn.prototype,"cancelText",2),on([ye({type:Boolean})],rn.prototype,"destructive",2),rn=on([me("qd-confirm-dialog")],rn);var an=Object.defineProperty,cn=Object.getOwnPropertyDescriptor,dn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?cn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&an(n,s,a),a};let ln=class extends pe{constructor(){super(...arguments),this.panelType="login",this.handleClick=()=>{this.dispatchEvent(new CustomEvent("qd:help-open",{detail:{panelType:this.panelType},bubbles:!0,composed:!0}))}}render(){return ne`
      <button class="help-icon" @click=${this.handleClick} aria-label="Help" title="Help">?</button>
    `}};ln.styles=wt`
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
  `,dn([ye({type:String})],ln.prototype,"panelType",2),ln=dn([me("qd-help-trigger")],ln);var un=Object.defineProperty,hn=Object.getOwnPropertyDescriptor,pn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?hn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&un(n,s,a),a};let gn=class extends pe{constructor(){super(...arguments),this.portalElement=null,this.previouslyFocused=null,this.open=!1,this.title="Help",this.content="",this._isOpen=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this._isOpen&&this.close()},this.handleBackdropClick=()=>{this.close()},this.handleCloseClick=()=>{this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown),this.ensureStyles()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),this.removePortal()}updated(t){t.has("open")&&(this.open&&!this._isOpen?this.handleOpen():!this.open&&this._isOpen&&this.handleClose())}ensureStyles(){gn.styleElement||(gn.styleElement=document.createElement("style"),gn.styleElement.textContent="\n.qd-help-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif}\n.qd-help-content{background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:450px;max-height:80vh;overflow:auto}\n.qd-help-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}\n.qd-help-title{font-weight:600;font-size:18px;color:#333;margin:0}\n.qd-help-close{background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:0;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}\n.qd-help-close:hover{background:#f0f0f0;color:#333}\n.qd-help-close:focus{outline:2px solid #0066cc;outline-offset:2px}\n.qd-help-body{padding:20px;line-height:1.6;color:#444}\n.qd-help-body h3{margin-top:0;margin-bottom:12px;color:#333;font-size:16px}\n.qd-help-body p{margin:0 0 12px 0}\n.qd-help-body p:last-child{margin-bottom:0}\n.qd-help-body strong{color:#333}",document.head.appendChild(gn.styleElement))}createPortal(){this.removePortal(),this.portalElement=document.createElement("div"),this.portalElement.className="qd-help-backdrop",this.portalElement.addEventListener("click",this.handleBackdropClick);const t=document.createElement("div");t.className="qd-help-content",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-labelledby","qd-help-title"),t.addEventListener("click",this.stopPropagation);const n=document.createElement("div");n.className="qd-help-header";const s=document.createElement("h2");s.className="qd-help-title",s.id="qd-help-title",s.textContent=this.title;const o=document.createElement("button");o.className="qd-help-close",o.setAttribute("aria-label","Close"),o.innerHTML="×",o.addEventListener("click",this.handleCloseClick),n.appendChild(s),n.appendChild(o);const r=document.createElement("div");r.className="qd-help-body",r.innerHTML=this.content,t.appendChild(n),t.appendChild(r),this.portalElement.appendChild(t),document.body.appendChild(this.portalElement),requestAnimationFrame(()=>{o.focus()})}removePortal(){this.portalElement&&(this.portalElement.remove(),this.portalElement=null)}handleOpen(){this._isOpen=!0,this.previouslyFocused=document.activeElement,this.createPortal()}handleClose(){this._isOpen=!1,this.removePortal(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}close(){this.open=!1,this.dispatchEvent(new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0}))}render(){return oe}};gn.styleElement=null,pn([ye({type:Boolean,reflect:!0})],gn.prototype,"open",2),pn([ye({type:String})],gn.prototype,"title",2),pn([ye({type:String})],gn.prototype,"content",2),pn([ve()],gn.prototype,"_isOpen",2),gn=pn([me("qd-help-popup")],gn);const mn="students";async function fn(t,n,s){const o=performance.now(),c={migrated:0,skipped:0,errors:[],durationMs:0},{releaseId:d,dryRun:l=!1}=s,u=T(d),h=await async function(t){return new Promise((n,s)=>{const o=indexedDB.open(t);o.onsuccess=()=>n(o.result),o.onerror=()=>{r(`Failed to open database: ${o.error?.message}`),s(new Error(`Failed to open database: ${o.error?.message}`))}})}(t);try{const t=await async function(t){return new Promise((n,s)=>{const o=t.transaction(mn,"readonly").objectStore(mn).openCursor(),r=[];o.onsuccess=()=>{const t=o.result;if(t){const n="string"==typeof t.key?t.key:JSON.stringify(t.key);r.push({key:n,value:t.value}),t.continue()}else n(r)},o.onerror=()=>{s(new Error(`Failed to read records: ${o.error?.message}`))}})}(h);for(const{key:s,value:o}of t)try{const t=j(o);if("encrypt"===n){if(t){c.skipped++;continue}const n=D(o,u);l||await bn(h,s,n),c.migrated++}else{if(!t){c.skipped++;continue}const n=U(o,u);l||await bn(h,s,n),c.migrated++}}catch(p){const t=p instanceof Error?p.message:String(p);c.errors.push({key:s,error:t}),a(`Migration error for key ${s}: ${t}`)}}finally{h.close()}return c.durationMs=performance.now()-o,c.migrated,c.skipped,c.errors.length,c.durationMs.toFixed(2),c}async function bn(t,n,s){return new Promise((o,r)=>{const a=t.transaction(mn,"readwrite").objectStore(mn).put(s,n);a.onsuccess=()=>o(),a.onerror=()=>{r(new Error(`Failed to save record: ${a.error?.message}`))}})}var yn=Object.defineProperty,vn=Object.getOwnPropertyDescriptor,wn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?vn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&yn(n,s,a),a};let Sn=class extends pe{constructor(){super(...arguments),this.open=!1,this.expected="plain",this.found="plain",this.dbName="",this.releaseId="",this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.handleModalClose=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=async t=>{if(t.preventDefault(),!this.password.trim())return;await this.validatePassword(this.password)?await this.runMigration():this.error||(this.error="Incorrect instructor password")},this.handleContinue=()=>{this.dispatchEvent(new CustomEvent("qd:migration-complete",{detail:this.migrationResult,bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))}}updated(t){t.has("open")&&this.open&&(this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.updateComplete.then(()=>{this.passwordInput?.focus()}))}async validatePassword(t){const n=document.getElementById(Ie),s=n?.textContent?.trim();if(!s)return this.error="Instructor password not configured",!1;const o=(new TextEncoder).encode(t),r=await crypto.subtle.digest("SHA-256",o);return Array.from(new Uint8Array(r)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)===s}async runMigration(){this.dialogState="migrating",this.error="";try{const t="decrypt",n=await fn(this.dbName,t,{releaseId:this.releaseId,dryRun:!1});if(n.errors.length>0)return this.dialogState="error",void(this.error=`Migration completed with ${n.errors.length} error(s). Some records may not have been migrated.`);this.migrationResult={migrated:n.migrated,skipped:n.skipped},this.dialogState="success"}catch(t){this.dialogState="error",this.error=`Migration failed: ${t instanceof Error?t.message:"Unknown error"}`}}render(){return ne`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Database Migration Required</span>

        ${this.open?this.renderContent():oe}
      </qd-modal>
    `}renderContent(){switch(this.dialogState){case"password":return this.renderPasswordForm();case"migrating":return this.renderMigrating();case"error":return this.renderError();case"success":return this.renderSuccess()}}renderPasswordForm(){return ne`
      <div class="migration-content">
        <div class="warning-banner">
          <span class="warning-icon">&#9888;</span>
          <div class="warning-text">
            <strong>Storage format mismatch detected</strong>
            <div class="format-info">
              <div class="format-row">
                <span class="format-label">Current data:</span>
                <span class="format-value">${this.found}</span>
              </div>
              <div class="format-row">
                <span class="format-label">Build expects:</span>
                <span class="format-value">${this.expected}</span>
              </div>
            </div>
          </div>
        </div>

        <p>Enter the instructor password to migrate all stored records to the new format.</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-field">
            <label for="migration-password">Instructor Password</label>
            <input
              id="migration-password"
              type="password"
              placeholder="Password"
              .value=${this.password}
              @input=${this.handleInput}
              required
              aria-label="Enter instructor password to authorize migration"
            />
          </div>

          ${this.error?ne`<div class="error-message">${this.error}</div>`:oe}

          <div class="button-row">
            <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary">Migrate Database</button>
          </div>
        </form>
      </div>
    `}renderMigrating(){return ne`
      <div class="migration-content">
        <div class="migrating-state">
          <div class="spinner"></div>
          <p>Migrating database records...</p>
          <p class="format-info">Please wait, do not close this window.</p>
        </div>
      </div>
    `}renderError(){return ne`
      <div class="migration-content">
        <div class="error-message">${this.error}</div>

        <div class="button-row">
          <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
          <button type="button" class="primary" @click=${()=>this.dialogState="password"}>
            Try Again
          </button>
        </div>
      </div>
    `}renderSuccess(){return ne`
      <div class="migration-content">
        <div class="success-message">
          Migration completed successfully!<br />
          <span class="format-info">
            ${this.migrationResult?.migrated??0} record(s) migrated,
            ${this.migrationResult?.skipped??0} already in correct format.
          </span>
        </div>

        <div class="button-row">
          <button type="button" class="primary" @click=${this.handleContinue}>Continue</button>
        </div>
      </div>
    `}};Sn.styles=wt`
    :host {
      display: contents;
    }

    .migration-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .warning-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #fff3cd;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
    }

    .warning-icon {
      font-size: 20px;
      line-height: 1;
    }

    .warning-text {
      flex: 1;
    }

    .warning-text strong {
      display: block;
      margin-bottom: 4px;
      color: #856404;
    }

    .format-info {
      font-size: 13px;
      color: #666;
    }

    .format-row {
      display: flex;
      gap: 8px;
      margin: 4px 0;
    }

    .format-label {
      font-weight: 500;
      min-width: 100px;
    }

    .format-value {
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
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

    .success-message {
      color: #2e7d32;
      font-size: 13px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 4px;
      border-left: 3px solid #4caf50;
    }

    .migrating-state {
      text-align: center;
      padding: 20px;
    }

    .spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid #e0e0e0;
      border-top-color: #0066cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
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

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    button.primary {
      background: #0066cc;
      color: white;
    }

    button.primary:hover:not(:disabled) {
      background: #0052a3;
    }

    button.secondary {
      background: #e0e0e0;
      color: #333;
    }

    button.secondary:hover:not(:disabled) {
      background: #d0d0d0;
    }
  `,wn([ye({type:Boolean,reflect:!0})],Sn.prototype,"open",2),wn([ye({type:String})],Sn.prototype,"expected",2),wn([ye({type:String})],Sn.prototype,"found",2),wn([ye({type:String})],Sn.prototype,"dbName",2),wn([ye({type:String})],Sn.prototype,"releaseId",2),wn([ve()],Sn.prototype,"dialogState",2),wn([ve()],Sn.prototype,"password",2),wn([ve()],Sn.prototype,"error",2),wn([ve()],Sn.prototype,"migrationResult",2),wn([we('input[type="password"]')],Sn.prototype,"passwordInput",2),Sn=wn([me("qd-migration-dialog")],Sn);const xn={login:{title:"Login Help",body:'<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'},status:{title:"Student View",body:'<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>'},instructor:{title:"Instructor Tools",body:"<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"}};function En(t){return xn[t]}var Cn=Object.defineProperty,$n=Object.getOwnPropertyDescriptor,In=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?$n(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Cn(n,s,a),a};let qn=class extends pe{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.showInstructorModal=!1,this.instructorError="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutSeconds=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.lockoutInterval=null,this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.showInstructorModal=!1,this.instructorError="",this.pin="",this.lockoutSeconds=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null),this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handleInstructorPasswordSubmit=t=>{this.handleInstructorLogin(t.detail.password)},this.handleInstructorModalClose=()=>{this.showInstructorModal=!1,this.instructorError=""},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1},this.handleMigrationComplete=()=>{if(this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData){const{serviceId:t,name:n,release:s}=this.pendingLoginData;this.pendingLoginData=null,this.retryLoginAfterMigration(t,n,s)}},this.handleMigrationCancel=()=>{this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.errorMessage="Data migration cancelled. Please contact your instructor for assistance.",this.isSubmitting=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:logout",this.handleLogoutEvent),this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){C(u.SESSION)?this.removeAttribute("data-show"):this.setAttribute("data-show","")}render(){return ne`
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

          ${this.errorMessage?ne`<div class="error-message">${this.errorMessage}</div>`:""}
          ${this.lockoutSeconds>0?ne`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
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
        .title=${En("login").title}
        .content=${En("login").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>

      <qd-migration-dialog
        .open=${this.showMigrationDialog}
        .expected=${this.migrationError?.expected??"plain"}
        .found=${this.migrationError?.found??"plain"}
        .dbName=${this.pendingLoginData?.dbName??""}
        .releaseId=${this.pendingLoginData?.release??""}
        @qd:migration-complete=${this.handleMigrationComplete}
        @qd:migration-cancel=${this.handleMigrationCancel}
      ></qd-migration-dialog>
    `}handleNameInput(t){const n=t.target;this.name=n.value,this.errorMessage=""}handleServiceIdInput(t){const n=t.target;this.serviceId=n.value,this.errorMessage=""}handlePinInput(t){const n=t.target;this.pin=function(t){return t.replace(/\D/g,"")}(n.value),this.errorMessage=""}isValid(){return 0===function(t,n,s){const o=[];t&&""!==t.trim()||o.push("Name required"),n?/^[a-zA-Z0-9]{2,10}$/.test(n)||o.push("Service ID must be 2-10 alphanumeric characters"):o.push("Service ID required");s?/^\d{4}$/.test(s)||o.push("PIN must be exactly 4 digits"):o.push("PIN required");return o}(this.name,this.serviceId,this.pin).length}getRelease(){const t=document.getElementById($e),n=t?.textContent?.trim()||".wh_publication_title .title",s=document.querySelector(n);return s?.textContent?.trim()||""}async handleStudentLogin(t){if(t.preventDefault(),this.isValid()){this.isSubmitting=!0,this.errorMessage="";try{const t=this.getRelease();if(!t)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const n=this.serviceId.trim(),s=this.name.trim(),o=Re(n);if(o.isLocked)return this.startLockoutCountdown(o.remainingMs),void(this.isSubmitting=!1);const r=document.getElementById(qe);if(!r?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${qe}">dbName</span> to page.`);const a=J(r.textContent.trim());await a.init();const c=await a.getStudent(t,n);if(!c){const o=await _e(this.pin),r={schema:2,docId:"",release:t,serviceId:n,name:s,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:o,pinCreatedAt:(new Date).toISOString()};return await a.saveStudent(r),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,s,t)}if(Oe(c)||!Te(c)){const o=Pe(c,await _e(this.pin));return await a.saveStudent(o),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(n,s,t)}if(!(await Ne(this.pin,c.pinHash||""))){const t=Me(n),s=He(n);if(t.lockoutUntil){const n=new Date(t.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(n)}else this.errorMessage=`Incorrect PIN. ${s} attempt${1!==s?"s":""} remaining`;return this.pin="",void(this.isSubmitting=!1)}ze(n),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}));this.completeLogin(n,s,t)}catch(n){if(n instanceof StorageFormatError){const t=document.getElementById(qe),s=t?.textContent?.trim()||"";return this.migrationError=n,this.pendingLoginData={serviceId:this.serviceId.trim(),name:this.name.trim(),release:this.getRelease(),pin:this.pin,dbName:s},this.showMigrationDialog=!0,void(this.isSubmitting=!1)}this.errorMessage="Login failed. Please try again.",console.error("Student login error:",n),this.isSubmitting=!1}}else this.errorMessage="Please enter name, service ID, and 4-digit PIN"}showPinStoredConfirmation(){this.showPinConfirmation=!0}async retryLoginAfterMigration(t,n,s){this.isSubmitting=!0,this.errorMessage="";try{const o=document.getElementById(qe),r=J(o?.textContent?.trim()||"");await r.init();const a=await r.getStudent(s,t);if(!a){const o=await _e(this.pin),a={schema:2,docId:"",release:s,serviceId:t,name:n,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:o,pinCreatedAt:(new Date).toISOString()};return await r.saveStudent(a),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:t,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(t,n,s)}if(Oe(a)||!Te(a)){const o=Pe(a,await _e(this.pin));return await r.saveStudent(o),this.dispatchEvent(new CustomEvent("qd:pin-created",{detail:{serviceId:t,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.showPinStoredConfirmation(),void this.completeLogin(t,n,s)}if(!(await Ne(this.pin,a.pinHash||""))){const n=Me(t),s=He(t);if(n.lockoutUntil){const t=new Date(n.lockoutUntil).getTime()-Date.now();this.startLockoutCountdown(t)}else this.errorMessage=`Incorrect PIN. ${s} attempt${1!==s?"s":""} remaining`;return this.pin="",void(this.isSubmitting=!1)}ze(t),this.dispatchEvent(new CustomEvent("qd:pin-verified",{detail:{serviceId:t,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}));this.completeLogin(t,n,s)}catch(o){this.errorMessage="Login failed after migration. Please try again.",console.error("Post-migration login error:",o),this.isSubmitting=!1}}startLockoutCountdown(t){this.lockoutSeconds=Math.ceil(t/1e3),this.errorMessage="",this.lockoutInterval&&clearInterval(this.lockoutInterval),this.lockoutInterval=window.setInterval(()=>{this.lockoutSeconds--,this.lockoutSeconds<=0&&this.lockoutInterval&&(clearInterval(this.lockoutInterval),this.lockoutInterval=null)},1e3)}completeLogin(t,n,s){(new SessionService).createSession(t,n,s);const o=new CustomEvent("qd:login",{detail:{serviceId:t,name:n,release:s,role:"student"},bubbles:!0,composed:!0});this.dispatchEvent(o),this.pin="",this.isSubmitting=!1,this.updateVisibility()}openInstructorModal(){this.showInstructorModal=!0,this.instructorError=""}async hashPassword(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)}getExpectedHash(){const t=document.getElementById(Ie);return t?.textContent?.trim()||""}async handleInstructorLogin(t){try{const n=await this.hashPassword(t),s=this.getExpectedHash();if(!s)return void(this.instructorError="Instructor password not configured");if(n!==s)return void(this.instructorError="Incorrect password");const o=this.getRelease();(new SessionService).createSession("INSTRUCTOR","Instructor",o||""),sessionStorage.setItem(u.INSTRUCTOR,"true");const r=new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:o||"",role:"instructor"},bubbles:!0,composed:!0});this.dispatchEvent(r),this.showInstructorModal=!1,this.instructorError="",this.updateVisibility()}catch(n){this.instructorError="Login failed. Please try again.",console.error("Instructor login error:",n)}}};qn.styles=wt`
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
  `,In([ye({type:String})],qn.prototype,"title",2),In([ve()],qn.prototype,"name",2),In([ve()],qn.prototype,"serviceId",2),In([ve()],qn.prototype,"showInstructorModal",2),In([ve()],qn.prototype,"instructorError",2),In([ve()],qn.prototype,"errorMessage",2),In([ve()],qn.prototype,"isSubmitting",2),In([ve()],qn.prototype,"pin",2),In([ve()],qn.prototype,"lockoutSeconds",2),In([ve()],qn.prototype,"showPinConfirmation",2),In([ve()],qn.prototype,"helpOpen",2),In([ve()],qn.prototype,"showMigrationDialog",2),In([ve()],qn.prototype,"migrationError",2),In([ve()],qn.prototype,"pendingLoginData",2),qn=In([me("qd-login")],qn);var An=Object.defineProperty,kn=Object.getOwnPropertyDescriptor,On=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?kn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&An(n,s,a),a};let Tn=class extends pe{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.helpOpen=!1,this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleCacheRebuild=()=>{this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:cache-rebuild",this.handleCacheRebuild)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:cache-rebuild",this.handleCacheRebuild)}render(){const t=this.serviceId.slice(-4);return ne`
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
        .title=${En("status").title}
        .content=${En("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}loadCache(){const t=C(u.SESSION);t?(this.name=t.name||"",this.serviceId=t.serviceId||""):(this.name="",this.serviceId="");const n=C(u.CACHE);if(!n)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");this.total=n.totals.total,this.correct=n.totals.correct,this.percentage=this.calculatePercentage(n.totals.total,n.totals.correct),this.statusColor=this.calculateStatusColor(n.totals.total,n.totals.correct)}calculatePercentage(t,n){return 0===t?0:Math.round(n/t*100)}calculateStatusColor(t,n){return function(t,n){return 0===t||0===n?"red":n===t?"green":"amber"}(t,n)}updateVisibility(){const t=C(u.SESSION),n="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&!n?this.setAttribute("data-show",""):this.removeAttribute("data-show")}handleLogout(){const t=C(u.SESSION);(new SessionService).clearSession();const n=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(n)}};Tn.styles=wt`
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
  `,On([ve()],Tn.prototype,"total",2),On([ve()],Tn.prototype,"correct",2),On([ve()],Tn.prototype,"percentage",2),On([ve()],Tn.prototype,"statusColor",2),On([ve()],Tn.prototype,"name",2),On([ve()],Tn.prototype,"serviceId",2),On([ve()],Tn.prototype,"helpOpen",2),Tn=On([me("qd-status")],Tn);const Pn=wt`
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
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],n=t[Math.min(this.failureCount-1,t.length-1)]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const _n="instructor.password.hash";var Nn=Object.defineProperty,Ln=Object.getOwnPropertyDescriptor,Dn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Ln(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Nn(n,s,a),a};let Rn=class extends pe{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=t=>{const n=t.target;this.password=n.value,this.error=""},this.handleSubmit=async t=>{t.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const t=function(){const t=document.getElementById(_n);if(!t){const t=`Instructor password hash not found. Expected element with id="${_n}". Check Oxygen XSL transform configuration.`;throw r(t),new Error(t)}const n=t.textContent?.trim();if(!n){const t="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw r(t),new Error(t)}if(!/^[a-f0-9]{64}$/i.test(n)){const t=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${n.substring(0,20)}...`;throw r(t),new Error(t)}return n.toLowerCase()}(),n=(new TextEncoder).encode(this.password),s=await crypto.subtle.digest("SHA-256",n),o=Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join(""),a=await async function(t,n){if(t.length!==n.length)return!1;if(0===t.length)return!0;const s=new TextEncoder,o=s.encode(t),r=s.encode(n);try{const t=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),n=await crypto.subtle.sign("HMAC",t,r),s=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),a=await crypto.subtle.sign("HMAC",s,o);if(n.byteLength!==a.byteLength)return!1;const c=new Uint8Array(n),d=new Uint8Array(a);let l=0;for(let o=0;o<c.length;o++)l|=(c[o]??0)^(d[o]??0);return 0===l}catch(a){return console.error("Constant-time comparison failed:",a),!1}}(o,t);a?(this.rateLimiter.reset(),this.password="",this.error="",E(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return ne`
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

          ${this.error?ne`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};Rn.styles=Pn,Dn([ve()],Rn.prototype,"password",2),Dn([ve()],Rn.prototype,"error",2),Dn([ve()],Rn.prototype,"remainingSeconds",2),Rn=Dn([me("qd-instructor-unlock")],Rn);var Mn=Object.defineProperty,zn=Object.getOwnPropertyDescriptor,Hn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?zn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Mn(n,s,a),a};let Un=class extends pe{constructor(){super(...arguments),this.open=!1,this.students=[],this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}render(){return ne`
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
          ${0===this.students.length?ne`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const t=[...this.students].sort((t,n)=>t.name.localeCompare(n.name));return ne`
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
    `}renderStudentRow(t){const n=this.calculateSummary(t),s=Object.entries(t.pages);return ne`
      <tr class="student-row">
        <td>${n.name}</td>
        <td>${n.serviceId}</td>
        <td class=${this.getScoreClass(n)}>
          ${n.correct}/${n.attempted} (${n.percentage}%)
        </td>
        <td>
          ${0===s.length?ne`<span class="no-answers">—</span>`:ne`
                <div class="answers-cell">
                  ${s.map(([t,n])=>ne`
                      <div class="page-row">
                        <span class="page-name">${t}</span>
                        <div class="page-answers">
                          ${n.answers.map((t,n)=>ne`
                              <span
                                class="answer-badge ${t?.success?"correct":"incorrect"}"
                              >
                                Q${n+1}: ${t?.answer??"—"}
                              </span>
                            `)}
                        </div>
                      </div>
                    `)}
                </div>
              `}
        </td>
      </tr>
    `}getScoreClass(t){return 0===t.attempted?"":100===t.percentage?"score-perfect":0===t.percentage?"score-zero":""}calculateSummary(t){const n=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:n}}show(){this.open=!0}close(){this.open=!1}};Un.styles=wt`
    :host {
      display: contents;
    }
  `,Hn([ye({type:Boolean,reflect:!0})],Un.prototype,"open",2),Hn([ye({type:Array})],Un.prototype,"students",2),Un=Hn([me("qd-scores-modal")],Un);var jn=Object.defineProperty,Fn=Object.getOwnPropertyDescriptor,Bn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Fn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&jn(n,s,a),a};let Vn=class extends pe{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return ne`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};Vn.styles=Pn,Bn([ye({type:Array})],Vn.prototype,"students",2),Bn([ye({type:Boolean})],Vn.prototype,"showModal",2),Vn=Bn([me("qd-instructor-scores")],Vn);var Qn=Object.defineProperty,Kn=Object.getOwnPropertyDescriptor,Jn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Kn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Qn(n,s,a),a};let Wn=class extends pe{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),n=new Blob([t],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(n),o=document.createElement("a");o.href=s;const r=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);o.download=`quiz-data-${r}.csv`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(s)}}escapeCSVField(t){const n=String(t);return n.includes(",")||n.includes('"')||n.includes("\n")?`"${n.replace(/"/g,'""')}"`:n}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const n of this.students)for(const[s,o]of Object.entries(n.pages)){(o.answers||[]).forEach((o,r)=>{o&&t.push([this.escapeCSVField(n.serviceId),this.escapeCSVField(n.name),this.escapeCSVField(n.release),this.escapeCSVField(s),this.escapeCSVField(r),this.escapeCSVField(o.answer),this.escapeCSVField(o.success),this.escapeCSVField(o.timestamp)].join(","))})}return t.join("\n")}render(){const t=this.students.length>0&&this.students.some(t=>t.attempted>0),n=t?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return ne`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${n}
      >
        Export CSV
      </button>
    `}};Wn.styles=Pn,Jn([ye({type:Array})],Wn.prototype,"students",2),Wn=Jn([me("qd-instructor-export")],Wn);var Yn=Object.defineProperty,Gn=Object.getOwnPropertyDescriptor,Zn=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?Gn(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&Yn(n,s,a),a};let Xn=class extends pe{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const n=t.target;this.confirmText=n.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{q(),E(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),ue(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return ne`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?ne`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t="DELETE ALL DATA"===this.confirmText;return ne`
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

          ${this.error?ne`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};Xn.styles=Pn,Zn([ve()],Xn.prototype,"showConfirmDialog",2),Zn([ve()],Xn.prototype,"confirmText",2),Zn([ve()],Xn.prototype,"error",2),Zn([ve()],Xn.prototype,"success",2),Xn=Zn([me("qd-instructor-manage")],Xn);var ts=Object.defineProperty,es=Object.getOwnPropertyDescriptor,ns=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?es(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&ts(n,s,a),a};let ss=class extends pe{constructor(){super(...arguments),this.students=[],this.open=!1,this.searchText="",this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleSearchInput=t=>{const n=t.target;this.searchText=n.value},this.handleResetClick=t=>{this.confirmingStudent=t,this.confirmDialogOpen=!0},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(t){this.open=t}get showModal(){return this.open}get filteredStudents(){if(!this.searchText.trim())return this.students;const t=this.searchText.toLowerCase().trim();return this.students.filter(n=>n.name.toLowerCase().includes(t)||n.serviceId.toLowerCase().includes(t))}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.searchText="",this.errorMessage=""}show(){this.open=!0}async executeReset(t){try{const s=document.getElementById(qe);if(!s?.textContent?.trim())throw new Error(`Database name not configured. Add <span id="${qe}">dbName</span> to page.`);const o=J(s.textContent.trim());await o.init();const r=(n=t,{...n,pinHash:"",pinResetAt:(new Date).toISOString()});await o.saveStudent(r);const a={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:t.release};await o.saveAuditEvent(a);const c=this.students.findIndex(n=>n.serviceId===t.serviceId);c>=0&&(this.students[c]=r,this.students=[...this.students]),this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0})),this.confirmDialogOpen=!1,this.confirmingStudent=null,this.errorMessage=""}catch(s){console.error("PIN reset error:",s),this.errorMessage="Failed to reset PIN. Please try again.",this.confirmDialogOpen=!1,this.confirmingStudent=null}var n}render(){const t=this.confirmingStudent,n=t?`Reset PIN for <strong>${t.name}</strong> (${t.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return ne`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open?ne`
              <div class="pin-reset-content">
                <input
                  type="text"
                  class="search-input"
                  placeholder="Search by name or ID..."
                  .value=${this.searchText}
                  @input=${this.handleSearchInput}
                />

                <div class="student-table-container">
                  ${0===this.filteredStudents.length?ne`<div class="empty-message">
                        ${this.searchText?"No matching students":"No students found"}
                      </div>`:ne`
                        <table class="student-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Service ID</th>
                              <th>Reset PIN</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${this.filteredStudents.map(t=>ne`
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

                ${this.errorMessage?ne`<div class="error-message">${this.errorMessage}</div>`:""}
              </div>
            `:oe}
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
    `}};ss.styles=wt`
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
  `,ns([ye({type:Array})],ss.prototype,"students",2),ns([ye({type:Boolean,reflect:!0})],ss.prototype,"open",2),ns([ve()],ss.prototype,"searchText",2),ns([ve()],ss.prototype,"confirmingStudent",2),ns([ve()],ss.prototype,"confirmDialogOpen",2),ns([ve()],ss.prototype,"errorMessage",2),ns([ye({type:Boolean})],ss.prototype,"showModal",1),ss=ns([me("qd-pin-reset-dialog")],ss);var os=Object.defineProperty,rs=Object.getOwnPropertyDescriptor,is=(t,n,s,o)=>{for(var r,a=o>1?void 0:o?rs(n,s):n,c=t.length-1;c>=0;c--)(r=t[c])&&(a=(o?r(n,s,a):r(a))||a);return o&&a&&os(n,s,a),a};let as=class extends pe{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.helpOpen=!1,this.handleLoginEvent=t=>{const n=t,s=n.detail?.role;this.updateVisibility(),"instructor"===s&&(this.unlock(),this.loadStudents())},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{const t=C(u.SESSION);if(t){try{const n=Z(),s=await n.getStudentsByRelease(t.release);this.students=s}catch(n){console.error("Failed to load students:",n),this.students=[]}this.showPinReset=!0}},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{const t=C(u.SESSION);if(t){try{const n=Z(),s=await n.getStudentsByRelease(t.release);this.students=s}catch(n){console.error("Failed to load students:",n),this.students=[]}this.showScores=!0}},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=C(u.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const n=t.target;if(this.showStudentAnswers=n.checked,this.showStudentAnswers&&0===this.students.length){const t=C(u.SESSION);if(t)try{const n=Z(),s=await n.getStudentsByRelease(t.release);this.students=s}catch(o){console.error("Failed to load students for toggle:",o)}}const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem("qd/instructor/showAnswers",String(this.showStudentAnswers))},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t="true"===sessionStorage.getItem(u.INSTRUCTOR);t&&(this.unlock(),this.loadStudents());const n=sessionStorage.getItem("qd/instructor/showAnswers");null!==n&&(this.showStudentAnswers="true"===n,this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){"true"===sessionStorage.getItem(u.INSTRUCTOR)?this.setAttribute("data-show",""):this.removeAttribute("data-show")}setStudents(t){this.students=t}async loadStudents(){const t=C(u.SESSION);if(t)try{const n=Z(),s=await n.getStudentsByRelease(t.release);this.students=s}catch(n){console.error("Failed to load students:",n),this.students=[]}}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?ne`
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
          .title=${En("instructor").title}
          .content=${En("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `:ne`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};as.styles=[Pn,wt`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],is([ve()],as.prototype,"unlocked",2),is([ve()],as.prototype,"showScores",2),is([ve()],as.prototype,"students",2),is([ve()],as.prototype,"showStudentAnswers",2),is([ve()],as.prototype,"showPinReset",2),is([ve()],as.prototype,"helpOpen",2),as=is([me("qd-instructor")],as);const cs={statusPanel:".wh_top_menu_and_indexterms_link"};function ds(t={}){const n=t.statusPanelContainer||cs.statusPanel;!function(t){const n=document.querySelector(t);if(!n)return null;const s=document.createElement("qd-login");n.appendChild(s)}(n),function(t){const n=document.querySelector(t);if(!n)return null;const s=document.createElement("qd-status");n.appendChild(s)}(n),function(t){const n=document.querySelector(t);if(!n)return null;const s=document.createElement("qd-instructor");n.appendChild(s)}(n)}const ls={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},us={unstarted:"red",incomplete:"amber",complete:"green"};function hs(t){const n=function(t,n){if(!t||!n?.pages)return"unstarted";const s=n.pages[t];return s?.state??"unstarted"}(t.getAttribute("data-page-id"),C(u.CACHE));!function(t,n){Object.values(ls).forEach(n=>{t.classList.remove(n)});const s=ls[us[n]];t.classList.add(s)}(t,n)}function ps(){const t=document.querySelectorAll(".quizPageBtn"),n=C(u.CACHE),s="true"===sessionStorage.getItem(u.INSTRUCTOR);if(!n||s)return t.forEach(t=>{Object.values(ls).forEach(n=>{t.classList.remove(n)})}),void t.length;t.forEach(t=>{hs(t)}),t.length}function gs(t){const n=t,{pageId:s}=n.detail,o=document.querySelector(`[data-page-id="${s}"]`);o&&o.classList.contains("quizPageBtn")&&hs(o)}function ms(){ps()}function fs(){const t=document.querySelectorAll(".quizPageBtn");t.forEach(t=>{Object.values(ls).forEach(n=>{t.classList.remove(n)})}),t.length}const bs={initialized:!1};async function ys(t={}){if(bs.initialized)return void a("Bootstrap already initialized, skipping");if(function(){if(document.getElementById("qd-global-styles"))return;const t=document.createElement("style");t.id="qd-global-styles",t.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: inherit;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Ensure select elements inherit font properly */\n    .qd-quiz-interactive select.qd-quiz-input {\n      font-family: inherit;\n      font-size: inherit;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor mode: Student answers display */\n    .qd-student-answers {\n      margin-top: 12px;\n      padding: 8px;\n      background: #f8f9fa;\n      border-radius: 4px;\n      border: 1px solid #dee2e6;\n    }\n\n    .qd-student-answer {\n      font-size: 12px;\n      padding: 4px 0;\n      line-height: 1.4;\n    }\n\n    .qd-student-answer.qd-correct {\n      color: #28a745;\n    }\n\n    .qd-student-answer.qd-incorrect {\n      color: #dc3545;\n    }\n\n    .qd-student-name {\n      font-weight: 600;\n    }\n\n    .qd-student-answer-text {\n      margin: 0 4px;\n    }\n\n    .qd-timestamp {\n      color: #6c757d;\n      font-size: 11px;\n      margin-left: 8px;\n    }\n\n    /* Modal error message styles (needed because qd-modal moves to body) */\n    .error-message {\n      color: #d32f2f;\n      font-size: 12px;\n      padding: 8px;\n      background: #ffebee;\n      border-radius: 4px;\n      border-left: 3px solid #d32f2f;\n    }\n  ",document.head.appendChild(t)}(),!t.dbName){const t="FATAL: dbName not provided in bootstrap config. Processing stopped.";throw console.error(t),new Error(t)}const n=Z(t.dbName);await n.init();const s=new EventCoordinator;s.initialize(),bs.eventCoordinator=s;const o=new SessionCoordinator;o.initialize(),bs.sessionCoordinator=o,ds({statusPanelContainer:t.statusPanelContainer,dbName:t.dbName}),!1!==t.autoEnhanceQuizTables&&function(){const t=document.querySelectorAll("table.qd-quiz");if(0===t.length)return;t.length;for(const s of Array.from(t))try{tt(s,{interactive:!1})}catch(n){a(`Failed to enhance quiz table: ${n.message}`)}t.length}(),!1!==t.autoEnhanceAnalysisTables&&function(){const t=document.querySelectorAll("table.qd-analysis");if(0===t.length)return;t.length;for(const s of Array.from(t))try{pt(s,{interactive:!1})}catch(n){a(`Failed to enhance analysis table: ${n.message}`)}t.length}(),!1!==t.autoEnhanceHomeBadges&&function(){const t=document.querySelectorAll(".quizPageBtn");if(0===t.length)return;t.length;try{document.querySelectorAll(".quizPageBtn").forEach(t=>{const n=function(t){const n=t.getAttribute("href");return n&&n.substring(n.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(t);n?(t.setAttribute("data-page-id",n),t.textContent?.trim()):t.getAttribute("href")}),ps(),document.addEventListener("qd:state-changed",gs),document.addEventListener("qd:cache-rebuild",ms),document.addEventListener("qd:logout",fs)}catch(n){a(`Failed to enhance home badges: ${n.message}`)}}(),await async function(){const t=C(u.SESSION);if(!t)return;if("true"===sessionStorage.getItem(u.INSTRUCTOR))return void vs();t.serviceId;const n=Z();let s=C(u.CACHE);if(!s)try{const o=await n.loadStudentRecord(t);s=n.buildCache(o),$(u.CACHE,s),s.totals.total}catch{a("Failed to rebuild cache from IndexedDB, using empty cache"),s={totals:{total:0,answered:0,correct:0},pages:{}},$(u.CACHE,s)}const o=window.location.pathname,r=o.substring(o.lastIndexOf("/")+1).replace(/\.html?$/i,"");if(!r)return;const c=document.querySelectorAll("table.qd-quiz");c.length>0&&(c.length,c.forEach(t=>{tt(t,{interactive:!0,pageId:r})}));const d=document.querySelectorAll("table.qd-analysis");d.length>0&&(d.length,d.forEach(t=>{pt(t,{interactive:!0,pageId:r})}))}(),document.addEventListener("qd:login",t=>{const n=t.detail;"instructor"===n?.role&&vs()}),bs.initialized=!0}function vs(){const t=window.location.pathname,n=t.substring(t.lastIndexOf("/")+1).replace(/\.html?$/i,""),s=document.querySelectorAll("table.qd-quiz");0!==s.length&&(s.forEach(t=>{const s=ot(t);if(!s)return;s.pageId=n;t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,n)=>{const o=s.parsed.questions[n];o&&t instanceof HTMLTableCellElement&&(t.textContent=o.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const o=()=>{rt(t,s)};document.addEventListener("qd:instructor-show-answers",o),document.addEventListener("qd:instructor-hide-answers",()=>{it(t)});"true"===sessionStorage.getItem("qd/instructor/showAnswers")&&o()}),s.length)}if("undefined"!=typeof window){const t=()=>{const t=ke();ys({dbName:t.dbName,statusPanelContainer:t.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(t=>{console.error("[FATAL] Bootstrap failed:",t)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{t()}):t()}return t.BUILD_DATE="28/Nov/2025",t.DEFAULT_CONTAINERS=cs,t.Debouncer=Debouncer,t.OBFUSCATION_PREFIX=O,t.SCHEMA_VERSION=2,t.SESSION_TIMEOUT_MS=l,t.STORAGE_KEYS=u,t.VERSION="0.1.0-phase3.1",t.bootstrap=ys,t.calculateCompletionState=W,t.cleanup=function(){bs.initialized?(bs.eventCoordinator?.cleanup(),bs.sessionCoordinator?.cleanup(),bs.initialized=!1,bs.eventCoordinator=void 0,bs.sessionCoordinator=void 0):a("Bootstrap not initialized, nothing to cleanup")},t.clearQuizData=q,t.decode=U,t.deriveKey=T,t.encode=D,t.enhanceAnalysisTable=pt,t.enhanceQuizTable=tt,t.error=r,t.generateCellKey=dt,t.generateTableId=ct,t.getAnalysisTableMetadata=function(t){return ht.get(t)},t.getJSON=C,t.getQuizTableMetadata=ot,t.info=o,t.injectComponents=ds,t.isAnalysisTableEnhanced=function(t){return ht.has(t)},t.isCellEditable=lt,t.isInitialized=function(){return bs.initialized},t.isObfuscated=j,t.isQuizTableEnhanced=function(t){return X.has(t)},t.migrateObfuscation=fn,t.parseAnalysisTable=ut,t.parseQuizTable=c,t.setJSON=$,t.validateAnswer=d,t.warn=a,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),t}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
