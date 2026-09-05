var SonarQuiz=function(t){"use strict";let n=!1;function s(t){if(t.length<2)return"**";if(2===t.length)return t;return t.slice(0,2)+"*".repeat(t.length-2)}function r(t){if(null===t||"object"!=typeof t)return t;const n={};for(const[o,a]of Object.entries(t))"name"!==o&&"passwordHash"!==o&&(n[o]="serviceId"!==o||"string"!=typeof a?"object"!=typeof a||null===a?a:r(a):s(a));return n}function o(t,s){n&&(void 0!==s?console.log(`[INFO] ${t}`,r(s)):console.log(`[INFO] ${t}`))}function a(t,s){if(s instanceof Error){const r={name:s.name,message:s.message};n&&s.stack&&(r.stack=s.stack),console.error(`[ERROR] ${t}`,r)}else void 0!==s?console.error(`[ERROR] ${t}`,r(s)):console.error(`[ERROR] ${t}`)}function d(t,n){void 0!==n?console.warn(`[WARN] ${t}`,r(n)):console.warn(`[WARN] ${t}`)}function c(t){const n=[],s=[];if(!t.classList.contains("qd-quiz"))return n.push('Table must have class "qd-quiz"'),{element:t,questions:s,errors:n};const r=Array.from(t.querySelectorAll("tbody tr"));return 0===r.length?(n.push("Quiz table has no data rows"),{element:t,questions:s,errors:n}):(r.forEach((t,r)=>{const o=Array.from(t.querySelectorAll("td"));if(3!==o.length)return void n.push(`Row ${r+1} has ${o.length} columns, expected 3 (Question | Answer | Detail)`);const a=o[0],d=o[1],c=o[2];if(!a||!d||!c)return;const l=a.textContent?.trim()||"";if(!l)return void n.push(`Row ${r+1} has empty question text`);const u=d.textContent?.trim()||"";if(!u)return void n.push(`Row ${r+1} has empty answer`);const h=c.querySelector("ol");if(h){const t=(p=h,Array.from(p.querySelectorAll("li")).map(t=>t.textContent?.trim()||"").filter(t=>t.length>0));if(0===t.length)return void n.push(`Row ${r+1} MCQ has no options in <ol>`);s.push({text:l,kind:"mcq",correctAnswer:u,options:t})}else{const t=c.textContent?.trim()||"",o=parseFloat(t);if(isNaN(o))return void n.push(`Row ${r+1} appears to be numeric but has invalid tolerance: "${t}"`);s.push({text:l,kind:"numeric",correctAnswer:u,tolerance:o})}var p}),{element:t,questions:s,errors:n.length>0?n:void 0})}function l(t,n){if(!n||""===n.trim())return!1;const s=n.trim();if("mcq"===t.kind)return s===t.correctAnswer;{const n=parseFloat(s),r=parseFloat(t.correctAnswer);if(isNaN(n)||isNaN(r))return!1;const o=t.tolerance??0;return Math.abs(n-r)<=o}}function u(t,n){const s=n.answers.length,r=n.answers.filter(t=>""!==t.answer.trim()).length,o=n.answers.filter(t=>t.success).length;return{state:n.state,total:s,answered:r,correct:o,last:n.lastAttempted,answers:n.answers,analysis:n.analysis}}class Debouncer{constructor(){this.timers=new Map}debounce(t,n,s=200){const r=this.timers.get(t);void 0!==r&&clearTimeout(r);const o=setTimeout(()=>{this.timers.delete(t),n()},s);this.timers.set(t,o)}cancel(t){const n=this.timers.get(t);return void 0!==n&&(clearTimeout(n),this.timers.delete(t),!0)}cancelAll(){let t=0;for(const n of this.timers.values())clearTimeout(n),t++;return this.timers.clear(),t}isPending(t){return this.timers.has(t)}getPendingCount(){return this.timers.size}}function h(t){const n=t.querySelector("tbody");return n?Array.from(n.querySelectorAll("tr")):[]}function p(t){return Array.from(t.cells)}function g(t){return t&&t.textContent?.trim()||""}function m(t,n,s){return document.createElement(t)}function f(t,...n){t.classList.add(...n)}function b(t,...n){t.classList.remove(...n)}function y(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const v="qd/instructor/showAnswers";function w(t){try{const n=sessionStorage.getItem(t);return n?JSON.parse(n):null}catch(n){return d(`Failed to parse JSON from sessionStorage key: ${t}`,n),null}}function x(t,n){try{const s=JSON.stringify(n);return sessionStorage.setItem(t,s),!0}catch(s){return d(`Failed to store JSON in sessionStorage key: ${t}`,s),!1}}function S(){const t=[];for(let n=0;n<sessionStorage.length;n++){const s=sessionStorage.key(n);s&&(s.startsWith("qd/")||s.startsWith("qd:"))&&t.push(s)}for(const n of t)sessionStorage.removeItem(n);return t.length}const $=18e5,E={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},q=3,C=3e4,A=new WeakMap;function P(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&f(n[1],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[1]&&(f(n[1],"qd-hidden"),n[1].textContent="")})}function O(t){const n=t.querySelectorAll("thead th, thead td");n[2]&&f(n[2],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td")[2];n&&(f(n,"qd-hidden"),A.has(n)||A.set(n,n.innerHTML),n.textContent="")})}function T(t,n){const s=function(t,n){if("mcq"===t.kind){const s=(t.options||[]).map((t,n)=>({value:String(n+1),text:`${n+1}. ${t}`}));return{type:"select",className:"qd-quiz-input",placeholder:"Select an answer...",value:n?.answer||"",options:s}}return{type:"text",className:"qd-quiz-input",placeholder:"Enter value",value:n?.answer||""}}(t,n);if("select"===s.type){const t=m("select");t.className=s.className;const n=m("option");return n.value="",n.textContent=s.placeholder,n.disabled=!0,t.appendChild(n),s.options&&s.options.forEach(n=>{const s=m("option");s.value=n.value,s.textContent=n.text,t.appendChild(s)}),t.value=s.value,t}const r=m("input");return r.type=s.type,r.className=s.className,r.placeholder=s.placeholder,r.value=s.value,r}function _(t,n){return`qd/${t}/u${n}`}class StorageError extends Error{constructor(t,n,s){super(t),this.operation=n,this.cause=s,this.name="StorageError",s?a(`Storage error in ${n}: ${t}`,s):a(`Storage error in ${n}: ${t}`)}}class StorageNotInitializedError extends StorageError{constructor(t){super("Storage adapter not initialized. Call init() first.",t),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(t){super("Storage quota exceeded. Please clear old data or free up space.",t),this.name="StorageQuotaError"}}class StorageFormatError extends StorageError{constructor(t,n,s,r){super(t,"formatCheck"),this.name="StorageFormatError",this.expected=n,this.found=s,this.storageKey=r}}const D="students",U="backups",j="auditLog";function B(t){return new Promise((n,s)=>{let r,o=!1;const c=()=>{r&&(clearTimeout(r),r=void 0)};r=window.setTimeout(()=>{if(o)return;o=!0,d("IndexedDB open timed out after 5000ms - attempting recovery");const r=indexedDB.deleteDatabase(t);r.onsuccess=()=>{B(t).then(n).catch(s)},r.onerror=()=>{s(new StorageError(`Database "${t}" appears corrupted. Please clear site data in browser settings.`,"init"))},r.onblocked=()=>{s(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const l=indexedDB.open(t,3);l.onerror=()=>{o||(o=!0,c(),a(`IndexedDB open error: ${l.error?.message||"unknown"}`),s(new StorageError("Failed to open database","init",l.error)))},l.onblocked=()=>{d("IndexedDB open blocked - close other tabs with this database")},l.onsuccess=()=>{if(o)return;o=!0,c();const r=l.result;if(function(t){return!t.objectStoreNames.contains(D)||!t.objectStoreNames.contains(U)||!t.objectStoreNames.contains(j)}(r)){d(`Database corrupted (missing stores). Found: [${Array.from(r.objectStoreNames).join(", ")}]`),r.close();const o=indexedDB.deleteDatabase(t);return o.onsuccess=()=>{B(t).then(n).catch(s)},void(o.onerror=()=>{s(new StorageError("Failed to delete corrupted database","init",o.error))})}n(r)},l.onupgradeneeded=t=>{!function(t){const n=t.target.result,s=t.target.transaction;s&&(s.onerror=()=>{a(`Upgrade transaction error: ${s.error?.message||"unknown"}`)},s.onabort=()=>{a(`Upgrade transaction aborted: ${s.error?.message||"unknown"}`)});try{if(!n.objectStoreNames.contains(D)){const t=n.createObjectStore(D,{keyPath:null});t.createIndex("by-release","release",{unique:!1}),t.createIndex("by-service-id","serviceId",{unique:!1})}if(!n.objectStoreNames.contains(U)){const t=n.createObjectStore(U,{keyPath:null});t.createIndex("by-original-key","originalKey",{unique:!1}),t.createIndex("by-timestamp","timestamp",{unique:!1})}if(!n.objectStoreNames.contains(j)){const t=n.createObjectStore(j,{keyPath:"eventId"});t.createIndex("by-service-id","serviceId",{unique:!1}),t.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(r){throw a("Error during database upgrade",r),r}}(t)}})}function F(t,n){return new Promise((s,r)=>{t.onsuccess=()=>s(t.result),t.onerror=()=>r(Q(t.error,n))})}function V(t,n,s,r,o){return new Promise((a,d)=>{let c;try{const a=t.transaction(n,s),l=a.objectStore(n);c=r(l),a.onerror=()=>d(Q(a.error,o))}catch(l){return void d(new StorageError(`Failed during ${o}`,o,l))}c.onsuccess=()=>a(c.result),c.onerror=()=>d(Q(c.error,o))})}function Q(t,n){return"QuotaExceededError"===t?.name?new StorageQuotaError(n):new StorageError(`Failed during ${n}`,n,t)}const K="OBF:";function W(t){return t?t.split("").map(t=>t.charCodeAt(0).toString()).join(""):""}function J(t){return(new TextEncoder).encode(t)}function Y(t,n){if(0===n.length)return t;const s=new Uint8Array(t.length);for(let r=0;r<t.length;r++){const o=t[r],a=n[r%n.length];void 0!==o&&void 0!==a&&(s[r]=o^a)}return s}function G(t,n){const s=function(t){let n="";for(let s=0;s<t.length;s++){const r=t[s];void 0!==r&&(n+=String.fromCharCode(r))}return btoa(n)}(Y(J(JSON.stringify(t)),J(n||"default")));return`${K}${s}`}function Z(t,n){const s=t.slice(4);if(!s)throw new Error("Empty obfuscated payload");let r;try{r=function(t){const n=atob(t),s=new Uint8Array(n.length);for(let r=0;r<n.length;r++)s[r]=n.charCodeAt(r);return s}(s)}catch{throw new Error("Invalid base64 in obfuscated data")}const o=Y(r,J(n||"default"));let a;try{d=o,a=(new TextDecoder).decode(d)}catch{throw new Error("Failed to decode UTF-8 data - possibly corrupted")}var d;try{return JSON.parse(a)}catch{throw new Error("Failed to parse JSON - data may be corrupted or tampered")}}function X(t){return"string"==typeof t&&t.startsWith(K)}class IndexedDBStorageAdapter{constructor(t){if(this.db=null,this.initPromise=null,!t)throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");this.dbName=t}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=B(this.dbName).then(t=>{this.db=t}).finally(()=>{this.initPromise=null}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(t,n){const s=this.ensureInitialized(),r=_(t,n),o=await V(s,D,"readonly",t=>t.get(r),"getStudent");return null==o?null:function(t,n,s){if(X(t))throw new StorageFormatError("Obfuscated data found with ENCRYPT_STORAGE disabled. Run migration to decrypt or re-enable encryption.","plain","obfuscated",s);return t}(o,0,r)}async saveStudent(t){const n=this.ensureInitialized(),s=_(t.release,t.serviceId),r=t;await V(n,D,"readwrite",t=>t.put(r,s),"saveStudent")}async getStudentsByRelease(t){const n=this.ensureInitialized();return await V(n,D,"readonly",n=>n.index("by-release").getAll(t),"getStudentsByRelease")||[]}getStudentsByReleaseEncrypted(t){const n=this.ensureInitialized();return new Promise((s,r)=>{const o=n.transaction(D,"readonly").objectStore(D).openCursor(),a=[];o.onsuccess=()=>{const n=o.result;if(n){const s=function(t,n){if(!X(t))return null;try{return Z(t,W(n))}catch{return null}}(n.value,t);s&&s.release===t&&a.push(s),n.continue()}else s(a)},o.onerror=()=>{r(new StorageError("Failed during getStudentsByRelease","getStudentsByRelease",o.error))}})}async clearAll(){const t=this.ensureInitialized().transaction([D,U,j],"readwrite");await Promise.all([F(t.objectStore(D).clear(),"clearAll"),F(t.objectStore(U).clear(),"clearAll"),F(t.objectStore(j).clear(),"clearAll")])}async backup(t){const n=this.ensureInitialized();await async function(t,n){const s=(new Date).toISOString(),r=`backup_${s}_${n.serviceId}`,o=_(n.release,n.serviceId),a={...n,originalKey:o,timestamp:s};await V(t,U,"readwrite",t=>t.put(a,r),"backup")}(n,t)}async saveAuditEvent(t){const n=this.ensureInitialized();await async function(t,n){await V(t,j,"readwrite",t=>t.add(n),"saveAuditEvent")}(n,t)}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let ee=null,te=null;function ne(t){if(!t)throw new Error("FATAL: dbName is required for getStorageAdapter()");return ee&&te!==t&&(ee.close(),ee=null),ee||(ee=new IndexedDBStorageAdapter(t),te=t),ee}function se(t,n){return 0===n||function(t){return 0===t.length}(t)?"unstarted":function(t,n){if(t.length!==n)return!1;return t.every(t=>!0===t.success)}(t,n)?"complete":"incomplete"}function re(t){return{schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}class StorageService{constructor(t){if(!t)throw new Error("FATAL: dbName is required for StorageService");this.dbName=t,this.adapter=ne(t)}async init(){try{await this.adapter.init(),o(`Storage service initialized (IndexedDB "${this.dbName}" ready)`)}catch(t){throw a("Failed to initialize storage service",t),t}}async loadStudentRecord(t){try{const n=await this.adapter.getStudent(t.release,t.serviceId);if(n)return o(`Loaded student record for ${t.serviceId} from IndexedDB`),n;const s=re(t);return o(`Created new student record for ${t.serviceId}`),s}catch(n){return d(`IndexedDB error, creating new record: ${n.message}`),re(t)}}async saveStudentRecord(t){try{t.updated=(new Date).toISOString();const n=function(t){let n=0,s=0;for(const r in t){const o=t[r];if(o&&o.answers&&Array.isArray(o.answers)){const t=o.answers.filter(t=>""!==t.answer.trim());n+=t.length,s+=t.filter(t=>t.success).length}}return{attempted:n,correct:s}}(t.pages);t.attempted=n.attempted,t.correct=n.correct,await this.adapter.saveStudent(t),o(`Saved student record for ${t.serviceId} to IndexedDB`)}catch(n){throw a("Failed to save student record",n),n}}updateRecordWithAnswer(t,n,s,r,o){const a=t.pages[n]||{answers:[],state:"unstarted"};for(;a.answers.length<=s;)a.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});a.answers[s]=r;const d=(new Date).toISOString();return a.firstAttempted||(a.firstAttempted=d),a.lastAttempted=d,a.state=se(a.answers,o),{...t,pages:{...t.pages,[n]:a}}}updateRecordWithAnalysis(t,n,s,r,o){const a=t.pages[n]||{answers:[],state:"unstarted"},d=a.analysis||{tableId:s,cells:{}};d.cells[r]=o;const c=(new Date).toISOString();return d.firstEdited||(d.firstEdited=c),d.lastEdited=c,a.analysis=d,t.pages[n]=a,t.updated=c,t}buildCache(t){return function(t){const n={totals:{total:0,answered:0,correct:0},pages:{}};for(const[s,r]of Object.entries(t.pages)){const t=u(0,r);n.pages[s]=t,n.totals.total+=t.total,n.totals.answered+=t.answered,n.totals.correct+=t.correct}return n}(t)}async getStudentsByRelease(t){try{return await this.adapter.getStudentsByRelease(t)}catch(n){throw a("Failed to get students by release",n),n}}async refreshCacheOnLogin(t){try{const n=await this.loadStudentRecord(t);await this.saveStudentRecord(n),x(E.CACHE,this.buildCache(n)),o(`Cache built from IndexedDB for ${t.serviceId}`)}catch{o("Failed to load from IndexedDB, initializing empty cache"),x(E.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}}async clearAll(){try{await this.adapter.clearAll(),o("Cleared all data from IndexedDB")}catch(t){throw a("Failed to clear all data",t),t}}async backup(t){try{await this.adapter.backup(t),o(`Created backup for ${t.serviceId}`)}catch(n){d(`Failed to create backup for ${t.serviceId}`,n)}}}let oe=null,ie=null;function ae(t){if(oe&&!t)return oe;if(oe&&t&&ie!==t)return d(`Storage service already initialized with dbName="${ie}", ignoring new dbName="${t}"`),oe;if(!oe){if(!t)throw new Error("FATAL: dbName is required for first getStorageService() call");oe=new StorageService(t),ie=t}return oe}function de(t,n,s){const r=new CustomEvent(t,{detail:n,bubbles:s?.bubbles??!0,composed:s?.composed??!0,cancelable:s?.cancelable??!1});return document.dispatchEvent(r)}function ce(t,n,s,r){const o=new CustomEvent(n,{detail:s,bubbles:!0,composed:!0,cancelable:!1});return t.dispatchEvent(o)}async function le(t,n){const s=ae();try{await s.saveStudentRecord(t)}catch(a){d("Failed to save student record to IndexedDB",a)}const r=s.buildCache(t);x(E.CACHE,r),n.onSavedDom?.();const o=de;for(const d of n.events)o(d.name,d.detail)}function ue(t,n,s,r){const{debouncer:c,pageId:u,parsed:h}=n;if(!c||!u)return;h.questions[s]&&c.debounce(`save-answer-${s}`,()=>{!async function(t,n,s,r){const{pageId:c,parsed:u,inputs:h}=n;if(!c||!h)return;const p=u.questions[s];if(!p)return;const g=w(E.SESSION);if(!g)return void a("No active session found");const m=l(p,r),f={answer:r.trim(),success:m,timestamp:(new Date).toISOString()},b=ae();let y;try{y=await b.loadStudentRecord(g)}catch($){return void d("Failed to load student record, answer not saved",$)}const v=u.questions.length,x=b.updateRecordWithAnswer(y,c,s,f,v),S=x.pages[c];await le(x,{onSavedDom:()=>{const n=t.querySelector(`tbody tr:nth-child(${s+1})`),r=n?.querySelector("td:nth-child(2)");r&&he(r,m)},events:[{name:"qd:answer-saved",detail:{pageId:c,answer:f}},...S?[{name:"qd:state-changed",detail:{pageId:c,state:S.state}}]:[]]}),o(`Answer saved for question ${s+1} on page ${c}: ${m?"correct":"incorrect"}`)}(t,n,s,r)},200)}function he(t,n){b(t,"qd-answer-correct","qd-answer-incorrect"),f(t,n?"qd-answer-correct":"qd-answer-incorrect")}function pe(t){return function(t,n="display"){if(null==t)return console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date";const s="string"==typeof t?new Date(t):t;return isNaN(s.getTime())?(console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date"):"csv"===n?function(t){return t.toISOString()}(s):function(t){return`${t.toLocaleDateString("en-US",{month:"short"})} ${t.getDate()} ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`}(s)}(t,"display")}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const ge=globalThis,me=ge.ShadowRoot&&(void 0===ge.ShadyCSS||ge.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,fe=Symbol(),be=new WeakMap;let ye=class{constructor(t,n,s){if(this._$cssResult$=!0,s!==fe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o;const n=this.t;if(me&&void 0===t){const s=void 0!==n&&1===n.length;s&&(t=be.get(n)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&be.set(n,t))}return t}toString(){return this.cssText}};const ve=(t,...n)=>{const s=1===t.length?t[0]:n.reduce((n,s,r)=>n+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[r+1],t[0]);return new ye(s,t,fe)},we=me?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let n="";for(const s of t.cssRules)n+=s.cssText;return(t=>new ye("string"==typeof t?t:t+"",void 0,fe))(n)})(t):t,{is:xe,defineProperty:Se,getOwnPropertyDescriptor:$e,getOwnPropertyNames:Ee,getOwnPropertySymbols:qe,getPrototypeOf:Ce}=Object,Ie=globalThis,ke=Ie.trustedTypes,Ae=ke?ke.emptyScript:"",Pe=Ie.reactiveElementPolyfillSupport,Oe=(t,n)=>t,Te={toAttribute(t,n){switch(n){case Boolean:t=t?Ae:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,n){let s=t;switch(n){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(r){s=null}}return s}},Le=(t,n)=>!xe(t,n),Ne={attribute:!0,type:String,converter:Te,reflect:!1,useDefault:!1,hasChanged:Le};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),Ie.litPropertyMetadata??=new WeakMap;let _e=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=Ne){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){const s=Symbol(),r=this.getPropertyDescriptor(t,s,n);void 0!==r&&Se(this.prototype,t,r)}}static getPropertyDescriptor(t,n,s){const{get:r,set:o}=$e(this.prototype,t)??{get(){return this[n]},set(t){this[n]=t}};return{get:r,set(n){const a=r?.call(this);o?.call(this,n),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ne}static _$Ei(){if(this.hasOwnProperty(Oe("elementProperties")))return;const t=Ce(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Oe("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Oe("properties"))){const t=this.properties,n=[...Ee(t),...qe(t)];for(const s of n)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const n=litPropertyMetadata.get(t);if(void 0!==n)for(const[t,s]of n)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[n,s]of this.elementProperties){const t=this._$Eu(n,s);void 0!==t&&this._$Eh.set(t,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const n=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)n.unshift(we(t))}else void 0!==t&&n.push(we(t));return n}static _$Eu(t,n){const s=n.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,n=this.constructor.elementProperties;for(const s of n.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(me)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of n){const n=document.createElement("style"),r=ge.litNonce;void 0!==r&&n.setAttribute("nonce",r),n.textContent=s.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,s){this._$AK(t,s)}_$ET(t,n){const s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(void 0!==r&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:Te).toAttribute(n,s.type);this._$Em=t,null==o?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,n){const s=this.constructor,r=s._$Eh.get(t);if(void 0!==r&&this._$Em!==r){const t=s.getPropertyOptions(r),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:Te;this._$Em=r;const a=o.fromAttribute(n,t.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(t,n,s){if(void 0!==t){const r=this.constructor,o=this[t];if(s??=r.getPropertyOptions(t),!((s.hasChanged??Le)(o,n)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,n,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,n,{useDefault:s,reflect:r,wrapped:o},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??n??this[t]),!0!==o||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||s||(n=void 0),this._$AL.set(t,n)),!0===r&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,n]of this._$Ep)this[t]=n;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[n,s]of t){const{wrapped:t}=s,r=this[n];!0!==t||this._$AL.has(n)||void 0===r||this.C(n,void 0,s,r)}}let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};_e.elementStyles=[],_e.shadowRootOptions={mode:"open"},_e[Oe("elementProperties")]=new Map,_e[Oe("finalized")]=new Map,Pe?.({ReactiveElement:_e}),(Ie.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const De=globalThis,Re=De.trustedTypes,ze=Re?Re.createPolicy("lit-html",{createHTML:t=>t}):void 0,Me="$lit$",He=`lit$${Math.random().toFixed(9).slice(2)}$`,Ue="?"+He,je=`<${Ue}>`,Be=document,Fe=()=>Be.createComment(""),Ve=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Qe=Array.isArray,Ke="[ \t\n\f\r]",We=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Je=/-->/g,Ye=/>/g,Ge=RegExp(`>|${Ke}(?:([^\\s"'>=/]+)(${Ke}*=${Ke}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Ze=/'/g,Xe=/"/g,et=/^(?:script|style|textarea|title)$/i,tt=(it=1,(t,...n)=>({_$litType$:it,strings:t,values:n})),nt=Symbol.for("lit-noChange"),st=Symbol.for("lit-nothing"),rt=new WeakMap,ot=Be.createTreeWalker(Be,129);var it;function at(t,n){if(!Qe(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==ze?ze.createHTML(n):n}class N{constructor({strings:t,_$litType$:n},s){let r;this.parts=[];let o=0,a=0;const d=t.length-1,c=this.parts,[l,u]=((t,n)=>{const s=t.length-1,r=[];let o,a=2===n?"<svg>":3===n?"<math>":"",d=We;for(let c=0;c<s;c++){const n=t[c];let s,l,u=-1,h=0;for(;h<n.length&&(d.lastIndex=h,l=d.exec(n),null!==l);)h=d.lastIndex,d===We?"!--"===l[1]?d=Je:void 0!==l[1]?d=Ye:void 0!==l[2]?(et.test(l[2])&&(o=RegExp("</"+l[2],"g")),d=Ge):void 0!==l[3]&&(d=Ge):d===Ge?">"===l[0]?(d=o??We,u=-1):void 0===l[1]?u=-2:(u=d.lastIndex-l[2].length,s=l[1],d=void 0===l[3]?Ge:'"'===l[3]?Xe:Ze):d===Xe||d===Ze?d=Ge:d===Je||d===Ye?d=We:(d=Ge,o=void 0);const p=d===Ge&&t[c+1].startsWith("/>")?" ":"";a+=d===We?n+je:u>=0?(r.push(s),n.slice(0,u)+Me+n.slice(u)+He+p):n+He+(-2===u?c:p)}return[at(t,a+(t[s]||"<?>")+(2===n?"</svg>":3===n?"</math>":"")),r]})(t,n);if(this.el=N.createElement(l,s),ot.currentNode=this.el.content,2===n||3===n){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=ot.nextNode())&&c.length<d;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(Me)){const n=u[a++],s=r.getAttribute(t).split(He),d=/([.?@])?(.*)/.exec(n);c.push({type:1,index:o,name:d[2],strings:s,ctor:"."===d[1]?H:"?"===d[1]?I:"@"===d[1]?L:k}),r.removeAttribute(t)}else t.startsWith(He)&&(c.push({type:6,index:o}),r.removeAttribute(t));if(et.test(r.tagName)){const t=r.textContent.split(He),n=t.length-1;if(n>0){r.textContent=Re?Re.emptyScript:"";for(let s=0;s<n;s++)r.append(t[s],Fe()),ot.nextNode(),c.push({type:2,index:++o});r.append(t[n],Fe())}}}else if(8===r.nodeType)if(r.data===Ue)c.push({type:2,index:o});else{let t=-1;for(;-1!==(t=r.data.indexOf(He,t+1));)c.push({type:7,index:o}),t+=He.length-1}o++}}static createElement(t,n){const s=Be.createElement("template");return s.innerHTML=t,s}}function dt(t,n,s=t,r){if(n===nt)return n;let o=void 0!==r?s._$Co?.[r]:s._$Cl;const a=Ve(n)?void 0:n._$litDirective$;return o?.constructor!==a&&(o?._$AO?.(!1),void 0===a?o=void 0:(o=new a(t),o._$AT(t,s,r)),void 0!==r?(s._$Co??=[])[r]=o:s._$Cl=o),void 0!==o&&(n=dt(t,o._$AS(t,n.values),o,r)),n}class M{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:n},parts:s}=this._$AD,r=(t?.creationScope??Be).importNode(n,!0);ot.currentNode=r;let o=ot.nextNode(),a=0,d=0,c=s[0];for(;void 0!==c;){if(a===c.index){let n;2===c.type?n=new R(o,o.nextSibling,this,t):1===c.type?n=new c.ctor(o,c.name,c.strings,this,t):6===c.type&&(n=new z(o,this,t)),this._$AV.push(n),c=s[++d]}a!==c?.index&&(o=ot.nextNode(),a++)}return ot.currentNode=Be,r}p(t){let n=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,n),n+=s.strings.length-2):s._$AI(t[n])),n++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,s,r){this.type=2,this._$AH=st,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const n=this._$AM;return void 0!==n&&11===t?.nodeType&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=dt(this,t,n),Ve(t)?t===st||null==t||""===t?(this._$AH!==st&&this._$AR(),this._$AH=st):t!==this._$AH&&t!==nt&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Qe(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==st&&Ve(this._$AH)?this._$AA.nextSibling.data=t:this.T(Be.createTextNode(t)),this._$AH=t}$(t){const{values:n,_$litType$:s}=t,r="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(at(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(n);else{const t=new M(r,this),s=t.u(this.options);t.p(n),this.T(s),this._$AH=t}}_$AC(t){let n=rt.get(t.strings);return void 0===n&&rt.set(t.strings,n=new N(t)),n}k(t){Qe(this._$AH)||(this._$AH=[],this._$AR());const n=this._$AH;let s,r=0;for(const o of t)r===n.length?n.push(s=new R(this.O(Fe()),this.O(Fe()),this,this.options)):s=n[r],s._$AI(o),r++;r<n.length&&(this._$AR(s&&s._$AB.nextSibling,r),n.length=r)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){const n=t.nextSibling;t.remove(),t=n}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,s,r,o){this.type=1,this._$AH=st,this._$AN=void 0,this.element=t,this.name=n,this._$AM=r,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=st}_$AI(t,n=this,s,r){const o=this.strings;let a=!1;if(void 0===o)t=dt(this,t,n,0),a=!Ve(t)||t!==this._$AH&&t!==nt,a&&(this._$AH=t);else{const r=t;let d,c;for(t=o[0],d=0;d<o.length-1;d++)c=dt(this,r[s+d],n,d),c===nt&&(c=this._$AH[d]),a||=!Ve(c)||c!==this._$AH[d],c===st?t=st:t!==st&&(t+=(c??"")+o[d+1]),this._$AH[d]=c}a&&!r&&this.j(t)}j(t){t===st?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===st?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==st)}}class L extends k{constructor(t,n,s,r,o){super(t,n,s,r,o),this.type=5}_$AI(t,n=this){if((t=dt(this,t,n,0)??st)===nt)return;const s=this._$AH,r=t===st&&s!==st||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==st&&(s===st||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,n,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){dt(this,t)}}const ct=De.litHtmlPolyfillSupport;ct?.(N,R),(De.litHtmlVersions??=[]).push("3.3.1");const lt=(t,n,s)=>{const r=s?.renderBefore??n;let o=r._$litPart$;if(void 0===o){const t=s?.renderBefore??null;r._$litPart$=o=new R(n.insertBefore(Fe(),t),t,void 0,s??{})}return o._$AI(t),o},ut=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let ht=class extends _e{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=lt(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return nt}};ht._$litElement$=!0,ht.finalized=!0,ut.litElementHydrateSupport?.({LitElement:ht});const pt=ut.litElementPolyfillSupport;pt?.({LitElement:ht}),(ut.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const gt=t=>(n,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,n)}):customElements.define(t,n)},mt={attribute:!0,type:String,converter:Te,reflect:!1,hasChanged:Le},ft=(t=mt,n,s)=>{const{kind:r,metadata:o}=s;let a=globalThis.litPropertyMetadata.get(o);if(void 0===a&&globalThis.litPropertyMetadata.set(o,a=new Map),"setter"===r&&((t=Object.create(t)).wrapped=!0),a.set(s.name,t),"accessor"===r){const{name:r}=s;return{set(s){const o=n.get.call(this);n.set.call(this,s),this.requestUpdate(r,o,t)},init(n){return void 0!==n&&this.C(r,void 0,t,n),n}}}if("setter"===r){const{name:r}=s;return function(s){const o=this[r];n.call(this,s),this.requestUpdate(r,o,t)}}throw Error("Unsupported decorator location: "+r)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function bt(t){return(n,s)=>"object"==typeof s?ft(t,n,s):((t,n,s)=>{const r=n.hasOwnProperty(s);return n.constructor.createProperty(s,t),r?Object.getOwnPropertyDescriptor(n,s):void 0})(t,n,s)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function yt(t){return bt({...t,state:!0,attribute:!1})}
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
function vt(t,n){return(n,s,r)=>((t,n,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&"object"!=typeof n&&Object.defineProperty(t,n,s),s))(n,s,{get(){return(n=>n.renderRoot?.querySelector(t)??null)(this)}})}var wt=Object.defineProperty,xt=Object.getOwnPropertyDescriptor,St=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?xt(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&wt(n,s,a),a};let $t=class extends ht{constructor(){super(...arguments),this.answers=[]}render(){return this.answers.map(t=>tt`<div class="qd-student-answer ${t.cssClass}">
          <span class="qd-student-name">${t.name} (${t.maskedServiceId})</span>:
          <span class="qd-student-answer-text">${t.answer}</span>
          <span class="qd-timestamp">${t.formattedTimestamp}</span>
        </div>`)}};async function Et(t,n){const{pageId:s,parsed:r}=n;if(!s)return;const d=w(E.SESSION);if(!d)return;const c=ae();try{const n=await c.getStudentsByRelease(d.release);if(0===n.length)return o("No student data available for this release"),void alert("No student data available for this release. Students need to log in and answer questions first.");const a=t.querySelector("tbody");if(!a)return;const l=Array.from(a.querySelectorAll("tr"));r.questions.forEach((t,r)=>{const o=l[r];if(!o)return;const a=Array.from(o.querySelectorAll("td"))[1];if(!a)return;const d=a.querySelector(".qd-student-answers");d&&d.remove();const c=function(t,n,s){const r=[];for(const o of t){const t=o.pages[n];if(!t||!t.answers)continue;const a=t.answers[s];a&&r.push({name:o.name,maskedServiceId:o.serviceId.slice(-4),answer:a.answer,success:a.success,formattedTimestamp:pe(a.timestamp),cssClass:a.success?"qd-correct":"qd-incorrect"})}return r}(n,s,r);if(c.length>0){const t=document.createElement("qd-student-answers");t.classList.add("qd-student-answers"),t.answers=c,a.appendChild(t)}}),o(`Displayed student answers for ${n.length} students on page ${s}`)}catch(l){a("Failed to load student answers",l)}}function qt(t){t.querySelectorAll(".qd-student-answers").forEach(t=>t.remove()),o("Hid student answers from quiz table")}$t.styles=ve`
    :host {
      display: block;
      margin-top: 12px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .qd-student-answer {
      font-size: 12px;
      padding: 4px 0;
      line-height: 1.4;
    }

    .qd-student-answer.qd-correct {
      color: #28a745;
    }

    .qd-student-answer.qd-incorrect {
      color: #dc3545;
    }

    .qd-student-name {
      font-weight: 600;
    }

    .qd-student-answer-text {
      margin: 0 4px;
    }

    .qd-timestamp {
      color: #6c757d;
      font-size: 11px;
      margin-left: 8px;
    }
  `,St([bt({attribute:!1})],$t.prototype,"answers",2),$t=St([gt("qd-student-answers")],$t);const Ct=new WeakMap;function It(t,n){const s=Ct.get(t);let r;if(s){if(s.interactive||!n.interactive)return o("Quiz table already enhanced, skipping"),!0;o("Upgrading quiz table from non-interactive to interactive mode"),r=s.parsed}else r=c(t),r.errors&&r.errors.length>0&&a("Quiz table has validation errors:",r.errors);const d={parsed:r,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return a("Interactive mode requires pageId option"),!1;o(`Preparing interactive enhancement for pageId: ${n.pageId}`),d.debouncer=new Debouncer,d.inputs=[]}if(Ct.set(t,d),n.interactive){const n=function(t,n){const{parsed:s,pageId:r,debouncer:d}=n;if(!r||!d)return a("Interactive mode requires pageId and debouncer"),!1;(function(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&b(n[1],"qd-hidden"),t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[1]&&b(n[1],"qd-hidden")})})(t),O(t);if(!w(E.SESSION))return a("No active session found"),!1;let c=w(E.CACHE);c?o(`Cache loaded: ${c.totals.total} total questions, ${Object.keys(c.pages).length} pages`):(o("No cache found, creating empty cache"),c={totals:{total:0,answered:0,correct:0},pages:{}});const l=s.questions.length;c=function(t,n,s){const r=t.pages[n];if(r&&r.total>=s)return t;const o=s-(r?.total||0),a={state:r?.state||"unstarted",total:s,answered:r?.answered||0,correct:r?.correct||0,last:r?.last,answers:r?.answers,analysis:r?.analysis};return{totals:{total:t.totals.total+o,answered:t.totals.answered,correct:t.totals.correct},pages:{...t.pages,[n]:a}}}(c,r,l),x(E.CACHE,c);const u=c?.pages[r],h=u?.answers||[];o(`Page ${r}: ${h.length} existing answers, state: ${u?.state||"none"}`);const p=t.querySelector("tbody");if(!p)return a("Quiz table has no tbody element"),!1;const g=Array.from(p.querySelectorAll("tr")),m=[];s.questions.forEach((s,r)=>{const a=g[r];if(!a)return;const d=Array.from(a.querySelectorAll("td"));if(3!==d.length)return;const c=d[0],l=d[1];if(!c||!l)return;const u=h[r];u&&u.answer&&o(`Q${r+1}: Pre-filling with "${u.answer}" (${u.success?"correct":"incorrect"})`);const p=T(s,u);m.push(p),b(l,"qd-answer-correct","qd-answer-incorrect"),l.textContent="",l.appendChild(p),u&&he(l,u.success);const f="SELECT"===p.tagName?"change":"input";p.addEventListener(f,()=>{ue(t,n,r,p.value)})}),n.inputs=m;const y=()=>{Et(t,n)},S=()=>{qt(t)};document.addEventListener("qd:instructor-show-answers",y),document.addEventListener("qd:instructor-hide-answers",S);const $="true"===sessionStorage.getItem(E.INSTRUCTOR),q="true"===sessionStorage.getItem(v);$&&q&&Et(t,n);const C=()=>{if(t.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(t=>{b(t,"qd-answer-correct","qd-answer-incorrect")}),n.inputs)for(const t of n.inputs)t instanceof HTMLSelectElement?t.selectedIndex=0:t instanceof HTMLInputElement&&(t.value="");qt(t)},A=()=>{C(),o("Cleared student UI state from quiz table on logout")},P=()=>{C(),o("Reset quiz table UI on login")};return document.addEventListener("qd:logout",A),document.addEventListener("qd:login",P),n.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",y),document.removeEventListener("qd:instructor-hide-answers",S),document.removeEventListener("qd:logout",A),document.removeEventListener("qd:login",P)},f(t,"qd-quiz-interactive"),o(`Quiz table enhanced in interactive mode for page ${r}`),!0}(t,d);return n?o(`Interactive enhancement succeeded for table with ${r.questions.length} questions`):a("Interactive enhancement failed"),n}return function(t){return function(t){const n=t.querySelector("colgroup");n&&n.remove()}(t),P(t),O(t),f(t,"qd-quiz-non-interactive"),o("Quiz table enhanced in non-interactive mode"),!0}(t)}function kt(t){return Ct.get(t)}function At(t,n=16){let s=5381;for(let o=0;o<t.length;o++){s=(s<<5)+s+t.charCodeAt(o),s&=s}const r=Math.abs(s).toString(16).padStart(8,"0");return r.repeat(Math.ceil(n/r.length)).substring(0,n)}function Pt(t){const n=h(t),s=n[0],r=s?p(s).length:0,o=t.className||"qd-analysis";return At(`${n.length}x${r}:${o}`,16)}function Ot(t,n,s){return`R${t}C${n}#f:${At(s.replace(/\s+/g," ").trim(),8)}`}function Tt(t){return t.classList.contains("interactive")}function Lt(t){const n=[];t.querySelector("tbody")||n.push("Analysis table must have a tbody element");const s=h(t);0===s.length&&n.push("Analysis table must have at least one row");const r=Pt(t),o=[];return s.forEach((t,n)=>{p(t).forEach((t,s)=>{if(Tt(t)){const r=g(t),a=Ot(n,s,r);o.push({row:n,col:s,key:a})}})}),{element:t,tableId:r,editableCells:o,errors:n.length>0?n:void 0}}function Nt(t,n,s){const{debouncer:r,pageId:c}=t;if(!r||!c)return;const l=g(n);r.debounce(`save-cell-${s}`,()=>{!async function(t,n,s){const{pageId:r,parsed:c}=t;if(!r)return;const l=w(E.SESSION);if(!l)return void a("No active session found");const u=ae();let h;try{h=await u.loadStudentRecord(l)}catch(g){return void d("Failed to load student record, analysis not saved",g)}const p=u.updateRecordWithAnalysis(h,r,c.tableId,n,s);await le(p,{events:[{name:"qd:analysis-saved",detail:{pageId:r,tableId:c.tableId,cellKey:n,content:s}}]}),o(`Analysis cell saved for ${n} on page ${r}`)}(t,s,l)},500)}var _t=Object.defineProperty,Dt=Object.getOwnPropertyDescriptor,Rt=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Dt(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&_t(n,s,a),a};let zt=class extends ht{constructor(){super(...arguments),this.entries=[]}render(){return 0===this.entries.length?(this.setAttribute("data-empty",""),tt`<div class="qd-no-entries">(No entries yet)</div>`):(this.removeAttribute("data-empty"),(t=this.entries,[...t].sort((t,n)=>{const s=new Date(t.timestamp).getTime();return new Date(n.timestamp).getTime()-s})).map(t=>{const n=t.serviceId.slice(-4),s=pe(t.timestamp);return tt`<div class="qd-entry">
        <span class="qd-entry-name">${t.name} (${n}) • ${s}: </span>
        <span class="qd-entry-content">${t.content}</span>
      </div>`}));var t}};async function Mt(t,n){const s=n.pageId||function(){const t=document.body.dataset.pageId;if(t)return t;const n=window.location.pathname,s=(n.split("/").pop()||"").replace(".html","");return s||void 0}();if(!s)return void d("Cannot show student entries: page ID not found");const r=w(E.SESSION);if(!r)return void d("Cannot show student entries: no active session");const c=ae();let l;try{l=await c.getStudentsByRelease(r.release)}catch(f){return void a("Failed to load students for instructor view:",f)}const u=function(t,n){const s={};return t.forEach(t=>{const r=t.pages[n];if(!r||!r.analysis)return;const{cells:o}=r.analysis,a=r.analysis.lastEdited||t.updated;Object.entries(o).forEach(([n,r])=>{s[n]||(s[n]=[]),s[n].push({serviceId:t.serviceId,name:t.name,content:r,timestamp:a})})}),s}(l,s),{editableCells:g}=n.parsed,m=h(t);g.forEach(({row:t,col:n,key:s})=>{const r=m[t];if(!r)return;const o=p(r)[n];if(!o)return;const a=function(t){const n=document.createElement("qd-student-entries");return n.entries=t,n}(u[s]||[]);a.setAttribute("data-qd-student-entries","true");const d=o.querySelector("[data-qd-student-entries]");d&&d.remove(),o.appendChild(a)}),o(`Displayed student entries for ${g.length} cells`)}function Ht(t){t.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove()),o("Hidden student entries from analysis table")}zt.styles=ve`
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
  `,Rt([bt({attribute:!1})],zt.prototype,"entries",2),zt=Rt([gt("qd-student-entries")],zt);const Ut=new WeakMap;function jt(t,n){const s=Lt(t);s.errors&&s.errors.length>0&&a("Analysis table has validation errors:",s.errors);const r={parsed:s,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return a("Interactive mode requires pageId option"),!1;r.debouncer=new Debouncer,r.cellKeyMap=new Map}return Ut.set(t,r),n.interactive?function(t,n){const{parsed:s,pageId:r,debouncer:d,cellKeyMap:c}=n;if(!r||!d||!c)return a("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!w(E.SESSION))return a("No active session found"),!1;const l=w(E.CACHE),u=l?.pages[r],g=u?.analysis,m=g?.cells||{},b=h(t);return s.editableCells.forEach(({row:t,col:s,key:r})=>{const o=b[t];if(!o)return;const d=p(o)[s];d&&(Tt(d)?(c.set(d,r),m[r]&&(d.textContent=m[r]),d.contentEditable="true",f(d,"qd-editable"),d.addEventListener("input",()=>{Nt(n,d,r)})):a(`Cell at R${t}C${s} is no longer editable`))}),f(t,"qd-analysis-interactive"),o(`Analysis table enhanced in interactive mode for page ${r}`),!0}(t,r):function(t){f(t,"qd-analysis-non-interactive");const n=()=>{const n=Ut.get(t);n&&Mt(t,n)},s=()=>{Ht(t)};return document.addEventListener("qd:instructor-show-answers",n),document.addEventListener("qd:instructor-hide-answers",s),o("Analysis table enhanced in non-interactive mode with instructor view support"),!0}(t)}function Bt(t,n,s={}){s.addInstructorClass&&t.classList.add("qd-quiz-instructor");t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,s)=>{const r=n.parsed.questions[s];r&&t instanceof HTMLTableCellElement&&(t.textContent=r.correctAnswer)}),function(t){const n=t.querySelectorAll("thead th, thead td");n[2]&&b(n[2],"qd-hidden"),t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td")[2];if(n){b(n,"qd-hidden");const t=A.get(n);void 0!==t&&(n.innerHTML=t)}})}(t);const r=()=>{Et(t,n)};document.addEventListener("qd:instructor-show-answers",r),document.addEventListener("qd:instructor-hide-answers",()=>{qt(t)});"true"===sessionStorage.getItem(v)&&r()}function Ft(t){const n=window.location.pathname.split(/[?#]/)[0]??"";return n.substring(n.lastIndexOf("/")+1).replace(/\.html?$/i,"")}function Vt(){const t=Ft();if(!t)return void o("No pageId found, skipping table upgrade to interactive mode");if("true"===sessionStorage.getItem(E.INSTRUCTOR))return void function(t){o("Instructor session detected, tables remain in non-interactive mode with answers visible");const n=document.querySelectorAll("table.qd-quiz");n.forEach(n=>{const s=kt(n);s&&(s.pageId=t,Bt(n,s))})}(t);const n=document.querySelectorAll("table.qd-quiz");n.length>0&&(o(`Upgrading ${n.length} quiz table(s) to interactive mode...`),n.forEach(n=>It(n,{interactive:!0,pageId:t})));const s=document.querySelectorAll("table.qd-analysis");s.length>0&&(o(`Upgrading ${s.length} analysis table(s) to interactive mode...`),s.forEach(n=>jt(n,{interactive:!0,pageId:t})))}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers(),o("Event coordinator initialized")}registerLoginHandlers(){this.addEventListener("qd:login",t=>{(async()=>{const n=t.detail;if(o(`Login event: ${n.serviceId} (${n.name})`),"INSTRUCTOR"===n.serviceId)return void o("Instructor login - skipping student record handling");const s=w(E.SESSION);s?(await ae().refreshCacheOnLogin(s),this.dispatchEvent("qd:cache-rebuild",{}),Vt()):o("No session found in storage, skipping cache rebuild")})()})}registerLogoutHandlers(){this.addEventListener("qd:logout",t=>{o(`Logout event: ${t.detail.serviceId}`);document.querySelectorAll("table.qd-quiz").forEach(t=>{!function(t){const n=Ct.get(t);n&&(n.interactive=!1,n.pageId=void 0,n.inputs=void 0,n.cleanupInstructorListeners?.(),n.cleanupInstructorListeners=void 0,P(t),O(t),b(t,"qd-quiz-interactive"),o("Quiz table reset to non-interactive mode"))}(t)});document.querySelectorAll("table.qd-analysis").forEach(t=>{!function(t){const n=Ut.get(t);n&&(Ht(t),n.interactive&&(t.querySelectorAll(".qd-editable").forEach(t=>{t instanceof HTMLTableCellElement&&(t.contentEditable="false",t.classList.remove("qd-editable"),t.textContent="")}),t.classList.remove("qd-analysis-interactive"),n.debouncer?.cancelAll()),n.interactive=!1,n.pageId=void 0,n.debouncer=void 0,n.cellKeyMap=void 0,o("Reset analysis table to non-interactive mode"))}(t)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",t=>{const n=t.detail;o(`Answer saved: ${n.pageId} Q${n.questionIndex} = ${n.answer} (${n.success?"correct":"incorrect"})`),this.dispatchEvent("qd:cache-update",{pageId:n.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",t=>{const n=t.detail;o(`State changed: ${n.pageId} → ${n.state}`),this.dispatchEvent("qd:badge-update",{pageId:n.pageId,state:n.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",t=>{o(`Instructor mode unlocked at ${t.detail.unlockTime}`)}),this.addEventListener("qd:instructor-lock",()=>{o("Instructor mode locked")})}registerDataHandlers(){this.addEventListener("qd:data-cleared",t=>{o(`All data cleared at ${t.detail.timestamp}`),this.dispatchEvent("qd:cache-clear",{})})}addEventListener(t,n){document.addEventListener(t,n);const s=this.listeners.get(t)||[];s.push(n),this.listeners.set(t,s)}dispatchEvent(t,n){const s=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0});document.dispatchEvent(s)}cleanup(){for(const[t,n]of this.listeners)for(const s of n)document.removeEventListener(t,s);this.listeners.clear(),o("Event coordinator cleaned up")}}class SessionService{createSession(t,n,s){const r=new Date,a=r.toISOString(),d={serviceId:t,name:n,release:s,loginTime:a,lastActivity:a,expiresAt:new Date(r.getTime()+$).toISOString(),instructorUnlocked:!1};return this.saveSession(d),o(`Session created for ${t} (${n})`),this.emitEvent("qd:login",{serviceId:t,name:n,release:s,loginTime:a}),d}getSession(){try{const t=sessionStorage.getItem(E.SESSION);if(!t)return null;const n=JSON.parse(t);return n.serviceId&&n.release&&n.expiresAt?n:(d("Invalid session data, missing required fields"),null)}catch(t){return a("Failed to parse session data",t),null}}updateActivity(){const t=this.getSession();if(!t)return;const n=new Date;t.lastActivity=n.toISOString(),t.expiresAt=new Date(n.getTime()+$).toISOString(),this.saveSession(t)}isExpired(){const t=this.getSession();return!t||function(t,n=new Date){const s=new Date(t);return!!isNaN(s.getTime())||n>=s}(t.expiresAt)}clearSession(){const t=this.getSession();sessionStorage.removeItem(E.SESSION),sessionStorage.removeItem(E.CACHE),sessionStorage.removeItem(E.INSTRUCTOR),sessionStorage.removeItem(v),t&&(o(`Session cleared for ${t.serviceId}`),this.emitEvent("qd:logout",{serviceId:t.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!0,t.unlockTime=(new Date).toISOString(),this.saveSession(t),o("Instructor mode unlocked"),this.emitEvent("qd:instructor-unlock",{timestamp:t.unlockTime}))}lockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!1,delete t.unlockTime,this.saveSession(t),o("Instructor mode locked"),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const t=this.getSession();return!0===t?.instructorUnlocked}getCache(){try{const t=sessionStorage.getItem(E.CACHE);return t?JSON.parse(t):null}catch(t){return a("Failed to parse cache data",t),null}}saveCache(t){try{sessionStorage.setItem(E.CACHE,JSON.stringify(t))}catch(n){a("Failed to save cache",n)}}clearCache(){sessionStorage.removeItem(E.CACHE)}saveSession(t){try{sessionStorage.setItem(E.SESSION,JSON.stringify(t))}catch(n){a("Failed to save session",n)}}emitEvent(t,n){try{const s=new CustomEvent(t,{detail:n,bubbles:!0});document.dispatchEvent(s)}catch(s){a(`Failed to emit event ${t}`,s)}}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const t=this.sessionService.getSession();if(t){if(o(`Existing session loaded for ${t.serviceId}`),this.sessionService.isExpired())return d("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(t),this.setupActivityTracking()}else o("No existing session found")}scheduleExpiryCheck(t){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const n=(new Date).getTime(),s=new Date(t.expiresAt).getTime()-n;s<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{o("Session expired (timeout)"),this.sessionService.clearSession()},s)}setupActivityTracking(){const t=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const t=this.sessionService.getSession();t&&this.scheduleExpiryCheck(t)};let n;const s=()=>{void 0!==n&&window.clearTimeout(n),n=window.setTimeout(()=>{t()},5e3)};["click","keydown","scroll","mousemove"].forEach(t=>{document.addEventListener(t,s,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}const Qt=ve`
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
      /* Wide enough to keep every control on one row, including the PIN field
         with its "PIN (4 digits)" placeholder. The surrounding header has
         ample horizontal space; this panel was the constraint, not the page. */
      max-width: 560px;
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
      /* Sized to show the "PIN (4 digits)" placeholder in full, so the field
         states its own rule rather than reading as an unexplained box. */
      width: 88px;
      min-width: 88px;
      max-width: 88px;
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

    .hint-message {
      width: 100%;
      color: #555;
      font-size: 11px;
      margin-top: 3px;
      padding: 4px 8px;
      background: #f1f3f4;
      border-radius: 3px;
      border-left: 3px solid #9aa0a6;
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
`;function Kt(){return null!==w(E.SESSION)}function Wt(){return"true"===sessionStorage.getItem(E.INSTRUCTOR)}function Jt(t,n,s){const r=[];if(t&&""!==t.trim()||r.push("Name required"),n){/^[a-zA-Z0-9]{2,10}$/.test(n)||r.push("Service ID must be 2-10 alphanumeric characters")}else r.push("Service ID required");if(s){/^\d{4}$/.test(s)||r.push("PIN must be exactly 4 digits")}else r.push("PIN required");return r}const Yt=".wh_top_menu_and_indexterms_link",Gt=".wh_publication_title .title",Zt="",Xt="qd-status-container",en="qd-title-selector",tn="qd-instructor-hash",nn="qd-db-name";function sn(t,n){const s=document.querySelector(`#${t}`);if(!s)return n;const r=s.textContent?.trim()||"";return""===r?(d(`Config element #${t} found but empty, using default: "${n}"`),n):(o(`Config read from #${t}: "${r}"`),r)}function rn(){o("Reading configuration from DOM...");const t=function(t){const n=document.querySelector(`#${t}`);if(!n){const n=`FATAL: Required config element #${t} not found in DOM. Processing stopped.`;throw console.error(n),new Error(n)}const s=n.textContent?.trim()||"";if(""===s){const n=`FATAL: Required config element #${t} is empty. Processing stopped.`;throw console.error(n),new Error(n)}return o(`Required config read from #${t}: "${s}"`),s}(nn),n={statusPanelContainer:sn(Xt,Yt),titleSelector:sn(en,Gt),instructorHash:sn(tn,Zt),dbName:t};return o("Configuration loaded:",n),n}function on(){const t=document.querySelector(`#${nn}`);return t?.textContent?.trim()||""}function an(){const t=document.querySelector(sn(en,Gt));return t?.textContent?.trim()||""}function dn(t){return t.schema<2}function cn(t){return Boolean(t.pinHash&&t.pinHash.length>0)}async function ln(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("")}function un(t){return`${E.PIN_ATTEMPTS}:${t}`}function hn(t){const n=un(t),s=sessionStorage.getItem(n);if(!s)return null;try{return JSON.parse(s)}catch{return null}}function pn(t){const n=hn(t);if(!n||!n.lockoutUntil)return{isLocked:!1,remainingMs:0};const s=new Date(n.lockoutUntil).getTime(),r=Date.now();return s>r?{isLocked:!0,remainingMs:s-r}:(gn(t),{isLocked:!1,remainingMs:0})}function gn(t){const n=hn(t);n&&n.attempts>0&&o(`Cleared ${n.attempts} failed PIN attempts for ${s(t)} on successful login`);const r=un(t);sessionStorage.removeItem(r)}function mn(t){const n=hn(t);if(!n)return q;return pn(t).isLocked?0:Math.max(0,q-n.attempts)}class AuthService{loginStudent(t){return this.runLogin(t,{checkLock:!0,surfaceMigration:!0,errorMessage:"Login failed. Please try again.",errorLabel:"Student login error:"})}retryAfterMigration(t){return this.runLogin(t,{checkLock:!1,surfaceMigration:!1,errorMessage:"Login failed after migration. Please try again.",errorLabel:"Post-migration login error:"})}async isRegistered(t,n,s){try{const r=ne(s);await r.init();const o=await r.getStudent(n,t);return!!o&&(cn(o)&&!dn(o))}catch{return null}}async runLogin(t,n){const{serviceId:r,name:a,pin:c,release:l,dbName:u}=t;if(n.checkLock){const t=pn(r);if(t.isLocked)return{kind:"lockout",lockoutMs:t.remainingMs}}try{const t=ne(u);await t.init();const n=await t.getStudent(l,r);if(n){if(dn(n)||!cn(n)){const s=function(t,n){return{...t,schema:2,pinHash:n,pinCreatedAt:(new Date).toISOString()}}(n,await ln(c));return await t.saveStudent(s),{kind:"pin-created",serviceId:r,name:a,release:l}}const u=await async function(t,n){return function(t,n){if(t.length!==n.length)return!1;let s=0;for(let r=0;r<t.length;r++)s|=t.charCodeAt(r)^n.charCodeAt(r);return 0===s}(await ln(t),n)}(c,n.pinHash||"");if(!u){const t=function(t){const n=(new Date).toISOString();let r=hn(t);if(r||(r={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:n}),r.attempts+=1,r.lastAttempt=n,r.attempts>=q){const n=new Date(Date.now()+C);r.lockoutUntil=n.toISOString(),d(`PIN lockout triggered for ${s(t)} after ${r.attempts} failed attempts`)}else o(`Failed PIN attempt ${r.attempts}/${q} for ${s(t)}`);const a=un(t);return sessionStorage.setItem(a,JSON.stringify(r)),r}(r);if(t.lockoutUntil){return{kind:"lockout",lockoutMs:new Date(t.lockoutUntil).getTime()-Date.now()}}return{kind:"bad-pin",remaining:mn(r)}}return gn(r),{kind:"pin-verified",serviceId:r,name:a,release:l}}const h=await ln(c),p={schema:2,docId:"",release:l,serviceId:r,name:a,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:h,pinCreatedAt:(new Date).toISOString()};return await t.saveStudent(p),{kind:"pin-created",serviceId:r,name:a,release:l}}catch(h){return n.surfaceMigration&&h instanceof StorageFormatError?{kind:"needs-migration",error:h}:(console.error(n.errorLabel,h),{kind:"error",message:n.errorMessage})}}}var fn=Object.getOwnPropertyDescriptor;let bn=class extends ht{render(){return tt`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"5/Sep/2026"}</span>
      </div>
    `}};bn.styles=ve`
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
  `,bn=((t,n,s,r)=>{for(var o,a=r>1?void 0:r?fn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=o(a)||a);return a})([gt("qd-build-info")],bn);class RateLimiter{constructor(t=0){this.freeFailures=t,this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){if(this.failureCount++,this.failureCount<=this.freeFailures)return;const t=[2e3,4e3,8e3,16e3,3e4],n=t[Math.min(this.failureCount-this.freeFailures-1,t.length-1)]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}async function yn(t,n){if(t.length!==n.length)return!1;if(0===t.length)return!0;const s=new TextEncoder,r=s.encode(t),o=s.encode(n);try{const t=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),n=await crypto.subtle.sign("HMAC",t,o),s=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),a=await crypto.subtle.sign("HMAC",s,r);if(n.byteLength!==a.byteLength)return!1;const d=new Uint8Array(n),c=new Uint8Array(a);let l=0;for(let r=0;r<d.length;r++)l|=(d[r]??0)^(c[r]??0);return 0===l}catch(a){return console.error("Constant-time comparison failed:",a),!1}}async function vn(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)}function wn(){const t=document.getElementById(tn);return t?.textContent?.trim()||""}async function xn(t){const n=wn();if(!n)return!1;return yn(await vn(t),n)}var Sn=Object.defineProperty,$n=Object.getOwnPropertyDescriptor,En=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?$n(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Sn(n,s,a),a};const qn="__qdModalCurrentRef__";function Cn(){return globalThis[qn]??null}function In(t){globalThis[qn]=t}let kn=class extends ht{constructor(){super(...arguments),this.open=!1,this.closable=!0,this.previouslyFocused=null,this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this.open&&this.closable&&(this.emitCloseEvent(),this.close())},this.handleBackdropClick=()=>{this.closable&&(this.emitCloseEvent(),this.close())},this.handleCloseClick=()=>{this.emitCloseEvent(),this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),Cn()!==this||this.isInBody||In(null)}updated(t){t.has("open")&&(this.open?this.handleOpen():this.handleClose())}moveToBody(){this.isInBody||(this.originalParent=this.parentNode,this.originalNextSibling=this.nextSibling,this.isInBody=!0,document.body.appendChild(this))}restorePosition(){this.isInBody&&this.originalParent&&(this.originalNextSibling?this.originalParent.insertBefore(this,this.originalNextSibling):this.originalParent.appendChild(this),this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1)}render(){return tt`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="header">
            <span class="header-title"><slot name="header"></slot></span>
            ${this.closable?tt`<button
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
    `}show(){this.open=!0}close(){this.open=!1}handleOpen(){const t=Cn();t&&t!==this&&t.close(),In(this),this.previouslyFocused=document.activeElement,this.moveToBody(),requestAnimationFrame(()=>{this.focusFirstElement()})}handleClose(){Cn()===this&&In(null),this.restorePosition(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}focusFirstElement(){const t=this.shadowRoot?.querySelector(".content");if(!t)return;const n=this.shadowRoot?.querySelector("slot:not([name])");if(n){const t=n.assignedElements({flatten:!0});for(const n of t){const t=n.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t)return void t.focus();if(n instanceof HTMLElement&&n.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))return void n.focus()}}const s=this.shadowRoot?.querySelector(".close-button");s&&s.focus()}emitCloseEvent(){const t=new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0});this.dispatchEvent(t)}};kn.styles=ve`
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
  `,En([bt({type:Boolean,reflect:!0})],kn.prototype,"open",2),En([bt({type:Boolean})],kn.prototype,"closable",2),kn=En([gt("qd-modal")],kn);var An=Object.defineProperty,Pn=Object.getOwnPropertyDescriptor,On=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Pn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&An(n,s,a),a};let Tn=class extends ht{constructor(){super(...arguments),this.open=!1,this.title="Enter Password",this.error="",this.password="",this.handleModalClose=()=>{this.close()},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=t=>{t.preventDefault(),this.password.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:this.password},bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close()}}show(){this.open=!0,this.password="",this.error=""}close(){this.open=!1,this.password="",this.error="",this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}updated(t){t.has("open")&&this.open&&(this.password="",this.updateComplete.then(()=>{this.passwordInput?.focus()}))}render(){return tt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        ${this.open?tt`
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

                ${this.error?tt`<div class="error-message">${this.error}</div>`:""}

                <div class="button-row">
                  <button type="button" @click=${this.handleCancel}>Cancel</button>
                  <button type="submit">Login</button>
                </div>
              </form>
            `:st}
      </qd-modal>
    `}};Tn.styles=ve`
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
  `,On([bt({type:Boolean,reflect:!0})],Tn.prototype,"open",2),On([bt({type:String})],Tn.prototype,"title",2),On([bt({type:String})],Tn.prototype,"error",2),On([yt()],Tn.prototype,"password",2),On([vt('input[type="password"]')],Tn.prototype,"passwordInput",2),Tn=On([gt("qd-password-modal")],Tn);var Ln=Object.defineProperty,Nn=Object.getOwnPropertyDescriptor,_n=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Nn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Ln(n,s,a),a};let Dn=class extends ht{constructor(){super(...arguments),this.disabled=!1,this.showModal=!1,this.error="",this.rateLimiter=new RateLimiter(q-1),this.open=()=>{this.showModal=!0,this.error=""},this.handleClose=()=>{this.showModal=!1,this.error=""},this.handleSubmit=t=>{this.login(t.detail.password)}}render(){return tt`
      <button type="button" class="instructor-btn" @click=${this.open} ?disabled=${this.disabled}>
        Instructor
      </button>

      <qd-password-modal
        .open=${this.showModal}
        title="Instructor Login"
        .error=${this.error}
        @qd:password-submit=${this.handleSubmit}
        @close=${this.handleClose}
      ></qd-password-modal>
    `}async login(t){if(wn())if(this.rateLimiter.attempt())try{if(!(await xn(t)))return this.rateLimiter.recordFailure(),void(this.error="Incorrect password");this.rateLimiter.reset();const n=an();(new SessionService).createSession("INSTRUCTOR","Instructor",n||""),sessionStorage.setItem(E.INSTRUCTOR,"true"),this.dispatchEvent(new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:n||"",role:"instructor"},bubbles:!0,composed:!0})),this.showModal=!1,this.error=""}catch(n){this.error="Login failed. Please try again.",console.error("Instructor login error:",n)}else this.error=`Too many attempts. Try again in ${this.rateLimiter.getRemainingSeconds()}s`;else this.error="Instructor password not configured"}};Dn.styles=ve`
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      background: #6c757d;
      color: white;
    }

    button:hover:not(:disabled) {
      background: #5a6268;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  `,_n([bt({type:Boolean})],Dn.prototype,"disabled",2),_n([yt()],Dn.prototype,"showModal",2),_n([yt()],Dn.prototype,"error",2),Dn=_n([gt("qd-instructor-login")],Dn);var Rn=Object.defineProperty,zn=Object.getOwnPropertyDescriptor,Mn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?zn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Rn(n,s,a),a};let Hn=class extends ht{constructor(){super(...arguments),this.untilMs=0,this.seconds=0,this.interval=null}disconnectedCallback(){super.disconnectedCallback(),this.clearTimer()}willUpdate(t){if(t.has("untilMs")){const t=this.untilMs-Date.now();this.seconds=t>0?Math.ceil(t/1e3):0}}updated(t){t.has("untilMs")&&this.startTimer()}render(){return this.seconds<=0?tt``:tt`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
      Too many attempts. Try again in ${this.seconds}s
    </div>`}startTimer(){this.clearTimer(),this.seconds<=0||(this.interval=window.setInterval(()=>{this.seconds--,this.seconds<=0&&(this.clearTimer(),this.dispatchEvent(new CustomEvent("qd:lockout-expired",{bubbles:!0,composed:!0})))},1e3))}clearTimer(){this.interval&&(clearInterval(this.interval),this.interval=null)}};Hn.styles=ve`
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
  `,Mn([bt({type:Number})],Hn.prototype,"untilMs",2),Mn([yt()],Hn.prototype,"seconds",2),Hn=Mn([gt("qd-lockout-banner")],Hn);
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const Un=2;class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,s){this._$Ct=t,this._$AM=n,this._$Ci=s}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class e extends i{constructor(t){if(super(t),this.it=st,t.type!==Un)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===st||null==t)return this._t=void 0,this.it=t;if(t===nt)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;const jn=(t=>(...n)=>({_$litDirective$:t,values:n}))(e);var Bn=Object.defineProperty,Fn=Object.getOwnPropertyDescriptor,Vn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Fn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Bn(n,s,a),a};let Qn=class extends ht{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}render(){return tt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${jn(this.message)}</div>

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
    `}};Qn.styles=ve`
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
  `,Vn([bt({type:Boolean,reflect:!0})],Qn.prototype,"open",2),Vn([bt({type:String})],Qn.prototype,"title",2),Vn([bt({type:String})],Qn.prototype,"message",2),Vn([bt({type:String})],Qn.prototype,"confirmText",2),Vn([bt({type:String})],Qn.prototype,"cancelText",2),Vn([bt({type:Boolean})],Qn.prototype,"destructive",2),Qn=Vn([gt("qd-confirm-dialog")],Qn);var Kn=Object.defineProperty,Wn=Object.getOwnPropertyDescriptor,Jn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Wn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Kn(n,s,a),a};let Yn=class extends ht{constructor(){super(...arguments),this.panelType="login",this.handleClick=()=>{this.dispatchEvent(new CustomEvent("qd:help-open",{detail:{panelType:this.panelType},bubbles:!0,composed:!0}))}}render(){return tt`
      <button class="help-icon" @click=${this.handleClick} aria-label="Help" title="Help">?</button>
    `}};Yn.styles=ve`
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
  `,Jn([bt({type:String})],Yn.prototype,"panelType",2),Yn=Jn([gt("qd-help-trigger")],Yn);var Gn=Object.defineProperty,Zn=Object.getOwnPropertyDescriptor,Xn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Zn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Gn(n,s,a),a};let es=class extends ht{constructor(){super(...arguments),this.portalElement=null,this.previouslyFocused=null,this.open=!1,this.title="Help",this.content="",this._isOpen=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this._isOpen&&this.close()},this.handleBackdropClick=()=>{this.close()},this.handleCloseClick=()=>{this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown),this.ensureStyles()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),this.removePortal()}updated(t){t.has("open")&&(this.open&&!this._isOpen?this.handleOpen():!this.open&&this._isOpen&&this.handleClose())}ensureStyles(){es.styleElement||(es.styleElement=document.createElement("style"),es.styleElement.textContent="\n.qd-help-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif}\n.qd-help-content{background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:450px;max-height:80vh;overflow:auto}\n.qd-help-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}\n.qd-help-title{font-weight:600;font-size:18px;color:#333;margin:0}\n.qd-help-close{background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:0;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}\n.qd-help-close:hover{background:#f0f0f0;color:#333}\n.qd-help-close:focus{outline:2px solid #0066cc;outline-offset:2px}\n.qd-help-body{padding:20px;line-height:1.6;color:#444}\n.qd-help-body h3{margin-top:0;margin-bottom:12px;color:#333;font-size:16px}\n.qd-help-body p{margin:0 0 12px 0}\n.qd-help-body p:last-child{margin-bottom:0}\n.qd-help-body strong{color:#333}",document.head.appendChild(es.styleElement))}createPortal(){this.removePortal(),this.portalElement=document.createElement("div"),this.portalElement.className="qd-help-backdrop",this.portalElement.addEventListener("click",this.handleBackdropClick);const t=document.createElement("div");t.className="qd-help-content",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-labelledby","qd-help-title"),t.addEventListener("click",this.stopPropagation);const n=document.createElement("div");n.className="qd-help-header";const s=document.createElement("h2");s.className="qd-help-title",s.id="qd-help-title",s.textContent=this.title;const r=document.createElement("button");r.className="qd-help-close",r.setAttribute("aria-label","Close"),r.innerHTML="×",r.addEventListener("click",this.handleCloseClick),n.appendChild(s),n.appendChild(r);const o=document.createElement("div");o.className="qd-help-body",o.innerHTML=this.content,t.appendChild(n),t.appendChild(o),this.portalElement.appendChild(t),document.body.appendChild(this.portalElement),requestAnimationFrame(()=>{r.focus()})}removePortal(){this.portalElement&&(this.portalElement.remove(),this.portalElement=null)}handleOpen(){this._isOpen=!0,this.previouslyFocused=document.activeElement,this.createPortal()}handleClose(){this._isOpen=!1,this.removePortal(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}close(){this.open=!1,this.dispatchEvent(new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0}))}render(){return st}};es.styleElement=null,Xn([bt({type:Boolean,reflect:!0})],es.prototype,"open",2),Xn([bt({type:String})],es.prototype,"title",2),Xn([bt({type:String})],es.prototype,"content",2),Xn([yt()],es.prototype,"_isOpen",2),es=Xn([gt("qd-help-popup")],es);const ts="students";async function ns(t,n,s){const r=performance.now(),c={migrated:0,skipped:0,errors:[],durationMs:0},{releaseId:l,dryRun:u=!1}=s,h=W(l);o(`Starting obfuscation migration: direction=${n}, dryRun=${u}`);const p=await async function(t){return new Promise((n,s)=>{const r=indexedDB.open(t);r.onsuccess=()=>n(r.result),r.onerror=()=>{a(`Failed to open database: ${r.error?.message}`),s(new Error(`Failed to open database: ${r.error?.message}`))}})}(t);try{const t=await async function(t){return new Promise((n,s)=>{const r=t.transaction(ts,"readonly").objectStore(ts).openCursor(),o=[];r.onsuccess=()=>{const t=r.result;if(t){const n="string"==typeof t.key?t.key:JSON.stringify(t.key);o.push({key:n,value:t.value}),t.continue()}else n(o)},r.onerror=()=>{s(new Error(`Failed to read records: ${r.error?.message}`))}})}(p);for(const{key:s,value:r}of t)try{const t=X(r);if("encrypt"===n){if(t){c.skipped++;continue}const n=G(r,h);u||await ss(p,s,n),c.migrated++}else{if(!t){c.skipped++;continue}const n=Z(r,h);u||await ss(p,s,n),c.migrated++}}catch(g){const t=g instanceof Error?g.message:String(g);c.errors.push({key:s,error:t}),d(`Migration error for key ${s}: ${t}`)}}finally{p.close()}return c.durationMs=performance.now()-r,o(`Migration complete: migrated=${c.migrated}, skipped=${c.skipped}, errors=${c.errors.length}, duration=${c.durationMs.toFixed(2)}ms`),c}async function ss(t,n,s){return new Promise((r,o)=>{const a=t.transaction(ts,"readwrite").objectStore(ts).put(s,n);a.onsuccess=()=>r(),a.onerror=()=>{o(new Error(`Failed to save record: ${a.error?.message}`))}})}const rs=ve`
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
`,os=ve`
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
`;var is=Object.getOwnPropertyDescriptor;let as=class extends ht{render(){return tt`<div class="spinner" role="status" aria-label="Loading"></div>`}};as.styles=[os],as=((t,n,s,r)=>{for(var o,a=r>1?void 0:r?is(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=o(a)||a);return a})([gt("qd-spinner")],as);var ds=Object.defineProperty,cs=Object.getOwnPropertyDescriptor,ls=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?cs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&ds(n,s,a),a};let us=class extends ht{constructor(){super(...arguments),this.open=!1,this.expected="plain",this.found="plain",this.dbName="",this.releaseId="",this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.handleModalClose=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=async t=>{if(t.preventDefault(),!this.password.trim())return;await this.validatePassword(this.password)?await this.runMigration():this.error||(this.error="Incorrect instructor password")},this.handleContinue=()=>{this.dispatchEvent(new CustomEvent("qd:migration-complete",{detail:this.migrationResult,bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))}}updated(t){t.has("open")&&this.open&&(this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.updateComplete.then(()=>{this.passwordInput?.focus()}))}async validatePassword(t){return wn()?xn(t):(this.error="Instructor password not configured",!1)}async runMigration(){this.dialogState="migrating",this.error="";try{const t="decrypt",n=await ns(this.dbName,t,{releaseId:this.releaseId,dryRun:!1});if(n.errors.length>0)return this.dialogState="error",void(this.error=`Migration completed with ${n.errors.length} error(s). Some records may not have been migrated.`);this.migrationResult={migrated:n.migrated,skipped:n.skipped},this.dialogState="success"}catch(t){this.dialogState="error",this.error=`Migration failed: ${t instanceof Error?t.message:"Unknown error"}`}}render(){return tt`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Database Migration Required</span>

        ${this.open?this.renderContent():st}
      </qd-modal>
    `}renderContent(){switch(this.dialogState){case"password":return this.renderPasswordForm();case"migrating":return this.renderMigrating();case"error":return this.renderError();case"success":return this.renderSuccess()}}renderPasswordForm(){return tt`
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

          ${this.error?tt`<div class="error-message">${this.error}</div>`:st}

          <div class="button-row">
            <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary">Migrate Database</button>
          </div>
        </form>
      </div>
    `}renderMigrating(){return tt`
      <div class="migration-content">
        <div class="migrating-state">
          <qd-spinner></qd-spinner>
          <p>Migrating database records...</p>
          <p class="format-info">Please wait, do not close this window.</p>
        </div>
      </div>
    `}renderError(){return tt`
      <div class="migration-content">
        <div class="error-message">${this.error}</div>

        <div class="button-row">
          <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
          <button type="button" class="primary" @click=${()=>this.dialogState="password"}>
            Try Again
          </button>
        </div>
      </div>
    `}renderSuccess(){return tt`
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
    `}};us.styles=[rs],ls([bt({type:Boolean,reflect:!0})],us.prototype,"open",2),ls([bt({type:String})],us.prototype,"expected",2),ls([bt({type:String})],us.prototype,"found",2),ls([bt({type:String})],us.prototype,"dbName",2),ls([bt({type:String})],us.prototype,"releaseId",2),ls([yt()],us.prototype,"dialogState",2),ls([yt()],us.prototype,"password",2),ls([yt()],us.prototype,"error",2),ls([yt()],us.prototype,"migrationResult",2),ls([vt('input[type="password"]')],us.prototype,"passwordInput",2),us=ls([gt("qd-migration-dialog")],us);const hs={login:{title:"Login Help",body:'<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>4-digit PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'},status:{title:"Student View",body:'<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>'},instructor:{title:"Instructor Tools",body:"<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"}};function ps(t){return hs[t]}var gs=Object.defineProperty,ms=Object.getOwnPropertyDescriptor,fs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?ms(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&gs(n,s,a),a};let bs=class extends ht{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.isRegistered=null,this.pendingPin="",this.helpOpen=!1,this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.authService=new AuthService,this.handleLoginEvent=()=>{this.updateVisibility()},this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.isRegistered=null,this.pendingPin="",this.updateVisibility()},this.handleLockoutExpired=()=>{this.lockoutUntil=0},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1},this.handleMigrationComplete=()=>{if(this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData){const{serviceId:t,name:n,release:s}=this.pendingLoginData;this.pendingLoginData=null,this.retryLoginAfterMigration(t,n,s)}},this.handleMigrationCancel=()=>{this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.errorMessage="Data migration cancelled. Please contact your instructor for assistance.",this.isSubmitting=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:login",this.handleLoginEvent)}disconnectedCallback(){super.disconnectedCallback(),window.clearTimeout(this.registrationTimer),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:login",this.handleLoginEvent)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){this.toggleAttribute("data-show",!Kt())}isLockedOut(){return this.lockoutUntil>Date.now()}render(){return tt`
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
            placeholder=${this.pendingPin?"Re-enter PIN":"PIN (4 digits)"}
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            autocomplete="off"
            aria-label="Enter your 4-digit PIN"
            .value=${this.pin}
            @input=${t=>this.handlePinInput(t)}
            ?disabled=${this.isSubmitting||this.isLockedOut()}
            required
          />
          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting||!this.isValid()||this.isLockedOut()}
          >
            ${this.submitLabel}
          </button>
          <qd-instructor-login ?disabled=${this.isSubmitting}></qd-instructor-login>
          ${this.errorMessage?tt`<div class="error-message">${this.errorMessage}</div>`:this.validationHint?tt`<div class="hint-message" role="status">${this.validationHint}</div>`:""}
          <qd-lockout-banner
            .untilMs=${this.lockoutUntil}
            @qd:lockout-expired=${this.handleLockoutExpired}
          ></qd-lockout-banner>
        </form>
      </div>
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
        .title=${ps("login").title}
        .content=${ps("login").body}
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
    `}handleNameInput(t){this.name=t.target.value,this.errorMessage=""}handleServiceIdInput(t){this.serviceId=t.target.value,this.errorMessage="",this.pendingPin="",this.scheduleRegistrationCheck()}scheduleRegistrationCheck(){window.clearTimeout(this.registrationTimer),this.isRegistered=null;const t=this.serviceId.trim();/^[a-zA-Z0-9]{2,10}$/.test(t)&&(this.registrationTimer=window.setTimeout(()=>{this.checkRegistration(t)},300))}async checkRegistration(t){let n=null;try{const s=an();n=s?await this.authService.isRegistered(t,s,on()):null}catch{n=null}t===this.serviceId.trim()&&(this.isRegistered=n)}get submitLabel(){return this.pendingPin?"Confirm":!1===this.isRegistered?"Create":"Login"}handlePinInput(t){this.pin=t.target.value.replace(/\D/g,""),this.errorMessage=""}isValid(){return 0===Jt(this.name,this.serviceId,this.pin).length}get validationHint(){return this.pendingPin?"Re-enter your PIN to confirm":this.name||this.serviceId||this.pin?Jt(this.name,this.serviceId,this.pin)[0]??"":""}async handleStudentLogin(t){if(t.preventDefault(),!this.isValid())return void(this.errorMessage="Please enter name, service ID, and 4-digit PIN");if(null!==this.isRegistered||this.pendingPin||await this.checkRegistration(this.serviceId.trim()),this.pendingPin){if(this.pin!==this.pendingPin)return this.pendingPin="",this.pin="",void(this.errorMessage="PINs did not match. Please enter your PIN again.");this.pendingPin=""}else if(!1===this.isRegistered)return this.pendingPin=this.pin,this.pin="",void(this.errorMessage="");this.isSubmitting=!0,this.errorMessage="";const n=an();if(!n)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const s=this.serviceId.trim(),r=this.name.trim(),o=on(),a=this.pin,d=await this.authService.loginStudent({serviceId:s,name:r,pin:a,release:n,dbName:o});if("needs-migration"===d.kind)return this.migrationError=d.error,this.pendingLoginData={serviceId:s,name:r,release:n,pin:a,dbName:o},this.showMigrationDialog=!0,void(this.isSubmitting=!1);this.applyLoginResult(d)}applyLoginResult(t){switch(t.kind){case"pin-created":this.dispatchPinEvent("qd:pin-created",t.serviceId),this.showPinStoredConfirmation(),this.completeLogin(t.serviceId,t.name,t.release);break;case"pin-verified":this.dispatchPinEvent("qd:pin-verified",t.serviceId),this.completeLogin(t.serviceId,t.name,t.release);break;case"lockout":this.lockoutUntil=Date.now()+t.lockoutMs,this.errorMessage="",this.isSubmitting=!1;break;case"bad-pin":this.errorMessage=`Incorrect PIN. ${t.remaining} attempt${1!==t.remaining?"s":""} remaining`,this.pin="",this.isSubmitting=!1;break;case"error":this.errorMessage=t.message,this.isSubmitting=!1}}dispatchPinEvent(t,n){this.dispatchEvent(new CustomEvent(t,{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}))}showPinStoredConfirmation(){this.showPinConfirmation=!0}async retryLoginAfterMigration(t,n,s){this.isSubmitting=!0,this.errorMessage="";const r=await this.authService.retryAfterMigration({serviceId:t,name:n,pin:this.pin,release:s,dbName:on()});this.applyLoginResult(r)}completeLogin(t,n,s){(new SessionService).createSession(t,n,s);const r={serviceId:t,name:n,release:s,role:"student"};this.dispatchEvent(new CustomEvent("qd:login",{detail:r,bubbles:!0,composed:!0})),this.pin="",this.isSubmitting=!1,this.updateVisibility()}};bs.styles=Qt,fs([bt({type:String})],bs.prototype,"title",2),fs([yt()],bs.prototype,"name",2),fs([yt()],bs.prototype,"serviceId",2),fs([yt()],bs.prototype,"errorMessage",2),fs([yt()],bs.prototype,"isSubmitting",2),fs([yt()],bs.prototype,"pin",2),fs([yt()],bs.prototype,"lockoutUntil",2),fs([yt()],bs.prototype,"showPinConfirmation",2),fs([yt()],bs.prototype,"isRegistered",2),fs([yt()],bs.prototype,"pendingPin",2),fs([yt()],bs.prototype,"helpOpen",2),fs([yt()],bs.prototype,"showMigrationDialog",2),fs([yt()],bs.prototype,"migrationError",2),fs([yt()],bs.prototype,"pendingLoginData",2),bs=fs([gt("qd-login")],bs);var ys=Object.defineProperty,vs=Object.getOwnPropertyDescriptor,ws=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?vs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&ys(n,s,a),a};let xs=class extends ht{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.helpOpen=!1,this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleCacheRebuild=()=>{this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:cache-rebuild",this.handleCacheRebuild)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:cache-rebuild",this.handleCacheRebuild)}render(){const t=this.serviceId.slice(-4);return tt`
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
        .title=${ps("status").title}
        .content=${ps("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}loadCache(){const t=w(E.SESSION);t?(this.name=t.name||"",this.serviceId=t.serviceId||""):(this.name="",this.serviceId="");const n=w(E.CACHE);if(!n)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");var s,r;this.total=n.totals.total,this.correct=n.totals.correct,this.percentage=(s=n.totals.correct,0===(r=n.totals.total)?0:Math.round(s/r*100)),this.statusColor=this.calculateStatusColor(n.totals.total,n.totals.correct)}calculateStatusColor(t,n){return function(t,n){return 0===t||0===n?"red":n===t?"green":"amber"}(t,n)}updateVisibility(){this.toggleAttribute("data-show",Kt()&&!Wt())}handleLogout(){const t=w(E.SESSION);(new SessionService).clearSession();const n=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(n)}};xs.styles=ve`
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
  `,ws([yt()],xs.prototype,"total",2),ws([yt()],xs.prototype,"correct",2),ws([yt()],xs.prototype,"percentage",2),ws([yt()],xs.prototype,"statusColor",2),ws([yt()],xs.prototype,"name",2),ws([yt()],xs.prototype,"serviceId",2),ws([yt()],xs.prototype,"helpOpen",2),xs=ws([gt("qd-status")],xs);const Ss=ve`
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
`;var $s=Object.defineProperty,Es=Object.getOwnPropertyDescriptor,qs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Es(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&$s(n,s,a),a};let Cs=class extends ht{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter(q-1),this.handlePasswordInput=t=>{const n=t.target;this.password=n.value,this.error=""},this.handleSubmit=async t=>{t.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const t=wn();if(!t)throw new Error("Instructor password hash not configured");const n=await vn(this.password);await yn(n,t)?(this.rateLimiter.reset(),this.password="",this.error="",ce(this,"qd:instructor-unlock",{})):(this.rateLimiter.recordFailure(),this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return tt`
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

          ${this.error?tt`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};Cs.styles=Ss,qs([yt()],Cs.prototype,"password",2),qs([yt()],Cs.prototype,"error",2),qs([yt()],Cs.prototype,"remainingSeconds",2),Cs=qs([gt("qd-instructor-unlock")],Cs);var Is=Object.defineProperty,ks=Object.getOwnPropertyDescriptor,As=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?ks(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Is(n,s,a),a};let Ps=class extends ht{constructor(){super(...arguments),this.open=!1,this.students=[],this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}render(){return tt`
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
          ${0===this.students.length?tt`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const t=[...this.students].sort((t,n)=>t.name.localeCompare(n.name));return tt`
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
    `}renderStudentRow(t){const n=this.calculateSummary(t),s=Object.entries(t.pages);return tt`
      <tr class="student-row">
        <td>${n.name}</td>
        <td>${n.serviceId}</td>
        <td class=${this.getScoreClass(n)}>
          ${n.correct}/${n.attempted} (${n.percentage}%)
        </td>
        <td>
          ${0===s.length?tt`<span class="no-answers">—</span>`:tt`
                <div class="answers-cell">
                  ${s.map(([t,n])=>tt`
                      <div class="page-row">
                        <span class="page-name">${t}</span>
                        <div class="page-answers">
                          ${n.answers.map((t,n)=>tt`
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
    `}getScoreClass(t){return 0===t.attempted?"":100===t.percentage?"score-perfect":0===t.percentage?"score-zero":""}calculateSummary(t){const n=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:n}}show(){this.open=!0}close(){this.open=!1}};Ps.styles=ve`
    :host {
      display: contents;
    }
  `,As([bt({type:Boolean,reflect:!0})],Ps.prototype,"open",2),As([bt({type:Array})],Ps.prototype,"students",2),Ps=As([gt("qd-scores-modal")],Ps);var Os=Object.defineProperty,Ts=Object.getOwnPropertyDescriptor,Ls=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Ts(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Os(n,s,a),a};let Ns=class extends ht{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return tt`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};Ns.styles=Ss,Ls([bt({type:Array})],Ns.prototype,"students",2),Ls([bt({type:Boolean})],Ns.prototype,"showModal",2),Ns=Ls([gt("qd-instructor-scores")],Ns);var _s=Object.defineProperty,Ds=Object.getOwnPropertyDescriptor,Rs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Ds(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&_s(n,s,a),a};let zs=class extends ht{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),n=new Blob([t],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(n),r=document.createElement("a");r.href=s;const o=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);r.download=`quiz-data-${o}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(s)}}escapeCSVField(t){let n=String(t);return/^[=+\-@\t\r]/.test(n)&&(n=`'${n}`),n.includes(",")||n.includes('"')||n.includes("\n")?`"${n.replace(/"/g,'""')}"`:n}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const n of this.students)for(const[s,r]of Object.entries(n.pages)){(r.answers||[]).forEach((r,o)=>{r&&t.push([this.escapeCSVField(n.serviceId),this.escapeCSVField(n.name),this.escapeCSVField(n.release),this.escapeCSVField(s),this.escapeCSVField(o),this.escapeCSVField(r.answer),this.escapeCSVField(r.success),this.escapeCSVField(r.timestamp)].join(","))})}return t.join("\n")}render(){const t=this.students.length>0&&this.students.some(t=>t.attempted>0),n=t?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return tt`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${n}
      >
        Export CSV
      </button>
    `}};zs.styles=Ss,Rs([bt({type:Array})],zs.prototype,"students",2),zs=Rs([gt("qd-instructor-export")],zs);var Ms=Object.defineProperty,Hs=Object.getOwnPropertyDescriptor,Us=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Hs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Ms(n,s,a),a};let js=class extends ht{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const n=t.target;this.confirmText=n.value},this.handleConfirmClear=async()=>{if("DELETE ALL DATA"===this.confirmText)try{await ae().clearAll(),S(),ce(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),lt(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return tt`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?tt`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t="DELETE ALL DATA"===this.confirmText;return tt`
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

          ${this.error?tt`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};async function Bs(t){const n=on();if(!n)return{ok:!1,error:`Database name not configured. Add <span id="${nn}">dbName</span> to page.`};try{const r=ne(n);await r.init();const o=(s=t,{...s,pinHash:"",pinResetAt:(new Date).toISOString()});await r.saveStudent(o);const a={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:t.release};return await r.saveAuditEvent(a),{ok:!0,updated:o}}catch(r){return console.error("PIN reset error:",r),{ok:!1,error:"Failed to reset PIN. Please try again."}}var s}js.styles=Ss,Us([yt()],js.prototype,"showConfirmDialog",2),Us([yt()],js.prototype,"confirmText",2),Us([yt()],js.prototype,"error",2),Us([yt()],js.prototype,"success",2),js=Us([gt("qd-instructor-manage")],js);var Fs=Object.defineProperty,Vs=Object.getOwnPropertyDescriptor,Qs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Vs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Fs(n,s,a),a};let Ks=class extends ht{constructor(){super(...arguments),this.students=[],this.actionLabel="Select",this.searchText="",this.handleSearchInput=t=>{this.searchText=t.target.value}}get filteredStudents(){const t=this.searchText.toLowerCase().trim();return t?this.students.filter(n=>n.name.toLowerCase().includes(t)||n.serviceId.toLowerCase().includes(t)):this.students}emitSelect(t){this.dispatchEvent(new CustomEvent("select",{detail:t,bubbles:!0,composed:!0}))}render(){const t=this.filteredStudents;return tt`
      <input
        type="text"
        class="search-input"
        placeholder="Search by name or ID..."
        .value=${this.searchText}
        @input=${this.handleSearchInput}
      />
      <div class="student-table-container">
        ${0===t.length?tt`<div class="empty-message">
              ${this.searchText?"No matching students":"No students found"}
            </div>`:tt`<table class="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Service ID</th>
                  <th>${this.actionLabel}</th>
                </tr>
              </thead>
              <tbody>
                ${t.map(t=>tt`<tr>
                      <td>${t.name}</td>
                      <td>${t.serviceId}</td>
                      <td>
                        <button class="action-btn" type="button" @click=${()=>this.emitSelect(t)}>
                          ${this.actionLabel}
                        </button>
                      </td>
                    </tr>`)}
              </tbody>
            </table>`}
      </div>
    `}};Ks.styles=ve`
    :host {
      display: block;
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

    .action-btn {
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
      cursor: pointer;
    }

    .action-btn:hover {
      background: #e64a19;
    }

    .empty-message {
      padding: 16px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  `,Qs([bt({type:Array})],Ks.prototype,"students",2),Qs([bt({type:String})],Ks.prototype,"actionLabel",2),Qs([yt()],Ks.prototype,"searchText",2),Ks=Qs([gt("qd-student-table")],Ks);var Ws=Object.defineProperty,Js=Object.getOwnPropertyDescriptor,Ys=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Js(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Ws(n,s,a),a};let Gs=class extends ht{constructor(){super(...arguments),this.students=[],this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleResetClick=t=>{this.confirmingStudent=t,this.confirmDialogOpen=!0},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(t){this.open=t}get showModal(){return this.open}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage=""}show(){this.open=!0}async executeReset(t){const n=await Bs(t);if(this.confirmDialogOpen=!1,this.confirmingStudent=null,n.ok){if(n.updated){const s=this.students.findIndex(n=>n.serviceId===t.serviceId);s>=0&&(this.students[s]=n.updated,this.students=[...this.students])}this.errorMessage="",this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}))}else this.errorMessage=n.error??"Failed to reset PIN. Please try again."}render(){const t=this.confirmingStudent,n=t?`Reset PIN for <strong>${y(t.name)}</strong> (${y(t.serviceId)})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return tt`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open?tt`
              <div class="pin-reset-content">
                <qd-student-table
                  .students=${this.students}
                  actionLabel="Reset"
                  @select=${t=>this.handleResetClick(t.detail)}
                ></qd-student-table>

                ${this.errorMessage?tt`<div class="error-message">${this.errorMessage}</div>`:""}
              </div>
            `:st}
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
    `}};Gs.styles=ve`
    :host {
      display: contents;
    }

    .pin-reset-content {
      min-width: 400px;
      max-width: 500px;
    }

    .error-message {
      color: #d32f2f;
      font-size: 11px;
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
    }
  `,Ys([bt({type:Array})],Gs.prototype,"students",2),Ys([bt({type:Boolean,reflect:!0})],Gs.prototype,"open",2),Ys([yt()],Gs.prototype,"confirmingStudent",2),Ys([yt()],Gs.prototype,"confirmDialogOpen",2),Ys([yt()],Gs.prototype,"errorMessage",2),Ys([bt({type:Boolean})],Gs.prototype,"showModal",1),Gs=Ys([gt("qd-pin-reset-dialog")],Gs);var Zs=Object.defineProperty,Xs=Object.getOwnPropertyDescriptor,er=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Xs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Zs(n,s,a),a};let tr=class extends ht{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.helpOpen=!1,this.handleLoginEvent=t=>{const n=t,s=n.detail?.role;this.updateVisibility(),"instructor"===s&&(this.unlock(),this.refreshStudents())},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{await this.refreshStudents(),this.showPinReset=!0},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{await this.refreshStudents(),this.showScores=!0},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=w(E.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const n=t.target;this.showStudentAnswers=n.checked,this.showStudentAnswers&&0===this.students.length&&await this.refreshStudents();const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem(v,String(this.showStudentAnswers))},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t=Wt();t&&(this.unlock(),this.refreshStudents());const n=sessionStorage.getItem(v);null!==n&&(this.showStudentAnswers="true"===n,this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){this.toggleAttribute("data-show",Wt())}setStudents(t){this.students=t}async refreshStudents(){const t=w(E.SESSION);if(t)try{const n=ae();this.students=await n.getStudentsByRelease(t.release)}catch(n){console.error("Failed to load students:",n),this.students=[]}}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?tt`
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
          .title=${ps("instructor").title}
          .content=${ps("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `:tt`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};tr.styles=[Ss,ve`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],er([yt()],tr.prototype,"unlocked",2),er([yt()],tr.prototype,"showScores",2),er([yt()],tr.prototype,"students",2),er([yt()],tr.prototype,"showStudentAnswers",2),er([yt()],tr.prototype,"showPinReset",2),er([yt()],tr.prototype,"helpOpen",2),tr=er([gt("qd-instructor")],tr);const nr={statusPanel:".wh_top_menu_and_indexterms_link"};function sr(t={}){const n=t.statusPanelContainer||nr.statusPanel;!function(t){const n=document.querySelector(t);if(!n)return o(`Login component not injected: container '${t}' not found`),null;const s=document.createElement("qd-login");n.appendChild(s),o("Login component injected")}(n),function(t){const n=document.querySelector(t);if(!n)return o(`Status component not injected: container '${t}' not found`),null;const s=document.createElement("qd-status");n.appendChild(s),o("Status component injected")}(n),function(t){const n=document.querySelector(t);if(!n)return o(`Instructor component not injected: container '${t}' not found`),null;const s=document.createElement("qd-instructor");n.appendChild(s),o("Instructor component injected")}(n)}const rr={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},or={unstarted:"red",incomplete:"amber",complete:"green"};function ir(t){Object.values(rr).forEach(n=>{t.classList.remove(n)})}function ar(t){const n=function(t,n){if(!t||!n?.pages)return"unstarted";const s=n.pages[t];return s?.state??"unstarted"}(t.getAttribute("data-page-id"),w(E.CACHE));!function(t,n){ir(t);const s=rr[or[n]];t.classList.add(s)}(t,n)}function dr(){const t=document.querySelectorAll(".quizPageBtn"),n=w(E.CACHE),s="true"===sessionStorage.getItem(E.INSTRUCTOR);if(!n||s)return t.forEach(t=>{ir(t)}),void o(s?`Removed badge styling from ${t.length} page links (instructor mode)`:`Removed badge styling from ${t.length} page links (no session)`);t.forEach(t=>{ar(t)}),o(`Updated ${t.length} page badges`)}function cr(t){const n=t,{pageId:s}=n.detail,r=document.querySelector(`[data-page-id="${s}"]`);r&&r.classList.contains("quizPageBtn")&&(ar(r),o(`Updated badge for page ${s}`))}function lr(){o("Cache rebuilt, refreshing all badges"),dr()}function ur(){o("Logout detected, removing all badge styling");const t=document.querySelectorAll(".quizPageBtn");t.forEach(t=>{ir(t)}),o(`Removed badge styling from ${t.length} page links`)}const hr={initialized:!1};async function pr(t={}){if(hr.initialized)return void d("Bootstrap already initialized, skipping");if(o("Bootstrapping Sonar Quiz System..."),function(){if(document.getElementById("qd-global-styles"))return;const t=document.createElement("style");t.id="qd-global-styles",t.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: inherit;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Ensure select elements inherit font properly */\n    .qd-quiz-interactive select.qd-quiz-input {\n      font-family: inherit;\n      font-size: inherit;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor-mode student answers/entries are now rendered by the\n       Shadow-DOM <qd-student-answers> / <qd-student-entries> components, which\n       own their styles. No global rules are needed here. */\n\n    /* Modal error message styles (needed because qd-modal moves to body) */\n    .error-message {\n      color: #d32f2f;\n      font-size: 12px;\n      padding: 8px;\n      background: #ffebee;\n      border-radius: 4px;\n      border-left: 3px solid #d32f2f;\n    }\n  ",document.head.appendChild(t),o("Global styles injected")}(),!t.dbName){const t="FATAL: dbName not provided in bootstrap config. Processing stopped.";throw console.error(t),new Error(t)}const n=ae(t.dbName);await n.init();const s=new EventCoordinator;s.initialize(),hr.eventCoordinator=s;const r=new SessionCoordinator;r.initialize(),hr.sessionCoordinator=r,sr({statusPanelContainer:t.statusPanelContainer,dbName:t.dbName}),!1!==t.autoEnhanceQuizTables&&gr("table.qd-quiz","quiz",t=>It(t,{interactive:!1})),!1!==t.autoEnhanceAnalysisTables&&gr("table.qd-analysis","analysis",t=>jt(t,{interactive:!1})),!1!==t.autoEnhanceHomeBadges&&function(){const t=document.querySelectorAll(".quizPageBtn");if(0===t.length)return void o("No .quizPageBtn links found, skipping badge enhancement");o(`Enhancing home page badges for ${t.length} link(s)...`);try{document.querySelectorAll(".quizPageBtn").forEach(t=>{const n=function(t){const n=t.getAttribute("href");return n&&n.substring(n.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(t);n?(t.setAttribute("data-page-id",n),o(`Set data-page-id="${n}" for link: ${t.textContent?.trim()}`)):o(`Failed to extract pageId from href: ${t.getAttribute("href")}`)}),dr(),document.addEventListener("qd:state-changed",cr),document.addEventListener("qd:cache-rebuild",lr),document.addEventListener("qd:logout",ur),o("Home page badges enhanced with event listeners"),o("Home page badges enhanced")}catch(n){d(`Failed to enhance home badges: ${n.message}`)}}(),await async function(){if("true"===sessionStorage.getItem(E.INSTRUCTOR))return o("Instructor session detected, revealing answers in non-interactive tables"),void mr();const t=w(E.SESSION);if(!t)return void o("No existing session, tables remain in non-interactive mode");o(`Existing session detected for ${t.serviceId}, upgrading tables to interactive mode`);const n=ae();let s=w(E.CACHE);if(!s){o("Cache not found, rebuilding from IndexedDB...");try{const r=await n.loadStudentRecord(t);s=n.buildCache(r),x(E.CACHE,s),o(`Cache rebuilt from IndexedDB: ${s.totals.total} total questions`)}catch{d("Failed to rebuild cache from IndexedDB, using empty cache"),s={totals:{total:0,answered:0,correct:0},pages:{}},x(E.CACHE,s)}}const r=Ft();if(!r)return void o("No pageId found, skipping table upgrade");const a=document.querySelectorAll("table.qd-quiz");a.length>0&&(o(`Upgrading ${a.length} quiz table(s) to interactive mode...`),a.forEach(t=>{It(t,{interactive:!0,pageId:r})}));const c=document.querySelectorAll("table.qd-analysis");c.length>0&&(o(`Upgrading ${c.length} analysis table(s) to interactive mode...`),c.forEach(t=>{jt(t,{interactive:!0,pageId:r})}))}(),document.addEventListener("qd:login",t=>{const n=t.detail;"instructor"===n?.role&&(o("Instructor login event received, revealing quiz answers"),mr())}),hr.initialized=!0,o("Bootstrap complete")}function gr(t,n,s){const r=document.querySelectorAll(t);if(0===r.length)return void o(`No ${n} tables found to enhance`);o(`Enhancing ${r.length} ${n} table(s) in non-interactive mode...`);let a=0;for(const o of Array.from(r))try{s(o),a++}catch(c){d(`Failed to enhance ${n} table: ${c.message}`)}o(`Enhanced ${a} of ${r.length} ${n} table(s) (non-interactive)`)}function mr(){const t=Ft(),n=document.querySelectorAll("table.qd-quiz");0!==n.length?(n.forEach(n=>{const s=kt(n);s&&(s.pageId=t,Bt(n,s,{addInstructorClass:!0}))}),o(`Revealed answers for instructor on ${n.length} quiz table(s)`)):o("No quiz tables found to reveal answers for")}if("undefined"!=typeof window){const t=()=>{o("Auto-initializing Sonar Quiz System");const t=rn();pr({dbName:t.dbName,statusPanelContainer:t.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(t=>{console.error("[FATAL] Bootstrap failed:",t)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{t()}):t()}return t.BUILD_DATE="5/Sep/2026",t.DEFAULT_CONTAINERS=nr,t.Debouncer=Debouncer,t.OBFUSCATION_PREFIX=K,t.SCHEMA_VERSION=2,t.SESSION_TIMEOUT_MS=$,t.STORAGE_KEYS=E,t.VERSION="0.2.0",t.bootstrap=pr,t.calculateCompletionState=se,t.cleanup=function(){hr.initialized?(o("Cleaning up bootstrap resources..."),hr.eventCoordinator?.cleanup(),hr.sessionCoordinator?.cleanup(),hr.initialized=!1,hr.eventCoordinator=void 0,hr.sessionCoordinator=void 0,o("Bootstrap cleanup complete")):d("Bootstrap not initialized, nothing to cleanup")},t.clearQuizData=S,t.decode=Z,t.deriveKey=W,t.encode=G,t.enhanceAnalysisTable=jt,t.enhanceQuizTable=It,t.error=a,t.generateCellKey=Ot,t.generateTableId=Pt,t.getAnalysisTableMetadata=function(t){return Ut.get(t)},t.getJSON=w,t.getQuizTableMetadata=kt,t.info=o,t.injectComponents=sr,t.isAnalysisTableEnhanced=function(t){return Ut.has(t)},t.isCellEditable=Tt,t.isInitialized=function(){return hr.initialized},t.isObfuscated=X,t.isQuizTableEnhanced=function(t){return Ct.has(t)},t.migrateObfuscation=ns,t.parseAnalysisTable=Lt,t.parseQuizTable=c,t.setDebugMode=function(t){n=t},t.setJSON=x,t.validateAnswer=l,t.warn=d,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),t}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
