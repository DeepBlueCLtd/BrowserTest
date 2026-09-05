var SonarQuiz=function(t){"use strict";function n(t){if(t.length<2)return"**";if(2===t.length)return t;return t.slice(0,2)+"*".repeat(t.length-2)}function s(t){if(null===t||"object"!=typeof t)return t;const r={};for(const[o,a]of Object.entries(t))"name"!==o&&"passwordHash"!==o&&(r[o]="serviceId"!==o||"string"!=typeof a?"object"!=typeof a||null===a?a:s(a):n(a));return r}function r(t,n){}function o(t,n){if(n instanceof Error){const s={name:n.name,message:n.message};console.error(`[ERROR] ${t}`,s)}else void 0!==n?console.error(`[ERROR] ${t}`,s(n)):console.error(`[ERROR] ${t}`)}function a(t,n){void 0!==n?console.warn(`[WARN] ${t}`,s(n)):console.warn(`[WARN] ${t}`)}function d(t){const n=[],s=[];if(!t.classList.contains("qd-quiz"))return n.push('Table must have class "qd-quiz"'),{element:t,questions:s,errors:n};const r=Array.from(t.querySelectorAll("tbody tr"));return 0===r.length?(n.push("Quiz table has no data rows"),{element:t,questions:s,errors:n}):(r.forEach((t,r)=>{const o=Array.from(t.querySelectorAll("td"));if(3!==o.length)return void n.push(`Row ${r+1} has ${o.length} columns, expected 3 (Question | Answer | Detail)`);const a=o[0],d=o[1],c=o[2];if(!a||!d||!c)return;const l=a.textContent?.trim()||"";if(!l)return void n.push(`Row ${r+1} has empty question text`);const u=d.textContent?.trim()||"";if(!u)return void n.push(`Row ${r+1} has empty answer`);const h=c.querySelector("ol");if(h){const t=(p=h,Array.from(p.querySelectorAll("li")).map(t=>t.textContent?.trim()||"").filter(t=>t.length>0));if(0===t.length)return void n.push(`Row ${r+1} MCQ has no options in <ol>`);s.push({text:l,kind:"mcq",correctAnswer:u,options:t})}else{const t=c.textContent?.trim()||"",o=parseFloat(t);if(isNaN(o))return void n.push(`Row ${r+1} appears to be numeric but has invalid tolerance: "${t}"`);s.push({text:l,kind:"numeric",correctAnswer:u,tolerance:o})}var p}),{element:t,questions:s,errors:n.length>0?n:void 0})}function c(t,n){if(!n||""===n.trim())return!1;const s=n.trim();if("mcq"===t.kind)return s===t.correctAnswer;{const n=parseFloat(s),r=parseFloat(t.correctAnswer);if(isNaN(n)||isNaN(r))return!1;const o=t.tolerance??0;return Math.abs(n-r)<=o}}function l(t,n){const s=n.answers.length,r=n.answers.filter(t=>""!==t.answer.trim()).length,o=n.answers.filter(t=>t.success).length;return{state:n.state,total:s,answered:r,correct:o,last:n.lastAttempted,answers:n.answers,analysis:n.analysis}}class Debouncer{constructor(){this.timers=new Map}debounce(t,n,s=200){const r=this.timers.get(t);void 0!==r&&clearTimeout(r);const o=setTimeout(()=>{this.timers.delete(t),n()},s);this.timers.set(t,o)}cancel(t){const n=this.timers.get(t);return void 0!==n&&(clearTimeout(n),this.timers.delete(t),!0)}cancelAll(){let t=0;for(const n of this.timers.values())clearTimeout(n),t++;return this.timers.clear(),t}isPending(t){return this.timers.has(t)}getPendingCount(){return this.timers.size}}function u(t){const n=t.querySelector("tbody");return n?Array.from(n.querySelectorAll("tr")):[]}function h(t){return Array.from(t.cells)}function p(t){return t&&t.textContent?.trim()||""}function g(t,n,s){return document.createElement(t)}function m(t,...n){t.classList.add(...n)}function f(t,...n){t.classList.remove(...n)}const b="qd/instructor/showAnswers";function y(t){try{const n=sessionStorage.getItem(t);return n?JSON.parse(n):null}catch(n){return a(`Failed to parse JSON from sessionStorage key: ${t}`,n),null}}function v(t,n){try{const s=JSON.stringify(n);return sessionStorage.setItem(t,s),!0}catch(s){return a(`Failed to store JSON in sessionStorage key: ${t}`,s),!1}}function w(){const t=[];for(let n=0;n<sessionStorage.length;n++){const s=sessionStorage.key(n);s&&s.startsWith("qd/")&&t.push(s)}for(const n of t)sessionStorage.removeItem(n);return t.length}const x=18e5,S={SESSION:"qd/session",CACHE:"qd/state",INSTRUCTOR:"qd/instructor",PIN_ATTEMPTS:"qd:pin-attempts"},E=3,$=3e4;function q(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&m(n[1],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[1]&&(m(n[1],"qd-hidden"),n[1].textContent="")})}function C(t){const n=t.querySelectorAll("thead th, thead td");n[2]&&m(n[2],"qd-hidden");t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[2]&&m(n[2],"qd-hidden")})}function A(t,n){const s=function(t,n){if("mcq"===t.kind){const s=(t.options||[]).map((t,n)=>({value:String(n+1),text:`${n+1}. ${t}`}));return{type:"select",className:"qd-quiz-input",placeholder:"Select an answer...",value:n?.answer||"",options:s}}return{type:"text",className:"qd-quiz-input",placeholder:"Enter value",value:n?.answer||""}}(t,n);if("select"===s.type){const t=g("select");t.className=s.className;const n=g("option");return n.value="",n.textContent=s.placeholder,n.disabled=!0,t.appendChild(n),s.options&&s.options.forEach(n=>{const s=g("option");s.value=n.value,s.textContent=n.text,t.appendChild(s)}),t.value=s.value,t}const r=g("input");return r.type=s.type,r.className=s.className,r.placeholder=s.placeholder,r.value=s.value,r}function O(t,n){return`qd/${t}/u${n}`}class StorageError extends Error{constructor(t,n,s){super(t),this.operation=n,this.cause=s,this.name="StorageError",s?o(`Storage error in ${n}: ${t}`,s):o(`Storage error in ${n}: ${t}`)}}class StorageNotInitializedError extends StorageError{constructor(t){super("Storage adapter not initialized. Call init() first.",t),this.name="StorageNotInitializedError"}}class StorageQuotaError extends StorageError{constructor(t){super("Storage quota exceeded. Please clear old data or free up space.",t),this.name="StorageQuotaError"}}class StorageFormatError extends StorageError{constructor(t,n,s,r){super(t,"formatCheck"),this.name="StorageFormatError",this.expected=n,this.found=s,this.storageKey=r}}const P="students",T="backups",_="auditLog";function D(t){return new Promise((n,s)=>{let r,d=!1;const c=()=>{r&&(clearTimeout(r),r=void 0)};r=window.setTimeout(()=>{if(d)return;d=!0,a("IndexedDB open timed out after 5000ms - attempting recovery");const r=indexedDB.deleteDatabase(t);r.onsuccess=()=>{D(t).then(n).catch(s)},r.onerror=()=>{s(new StorageError(`Database "${t}" appears corrupted. Please clear site data in browser settings.`,"init"))},r.onblocked=()=>{s(new StorageError("Cannot recover database - close all other tabs with this site and reload.","init"))}},5e3);const l=indexedDB.open(t,3);l.onerror=()=>{d||(d=!0,c(),o(`IndexedDB open error: ${l.error?.message||"unknown"}`),s(new StorageError("Failed to open database","init",l.error)))},l.onblocked=()=>{a("IndexedDB open blocked - close other tabs with this database")},l.onsuccess=()=>{if(d)return;d=!0,c();const r=l.result;if(function(t){return!t.objectStoreNames.contains(P)||!t.objectStoreNames.contains(T)||!t.objectStoreNames.contains(_)}(r)){a(`Database corrupted (missing stores). Found: [${Array.from(r.objectStoreNames).join(", ")}]`),r.close();const o=indexedDB.deleteDatabase(t);return o.onsuccess=()=>{D(t).then(n).catch(s)},void(o.onerror=()=>{s(new StorageError("Failed to delete corrupted database","init",o.error))})}n(r)},l.onupgradeneeded=t=>{!function(t){const n=t.target.result,s=t.target.transaction;s&&(s.onerror=()=>{o(`Upgrade transaction error: ${s.error?.message||"unknown"}`)},s.onabort=()=>{o(`Upgrade transaction aborted: ${s.error?.message||"unknown"}`)});try{if(!n.objectStoreNames.contains(P)){const t=n.createObjectStore(P,{keyPath:null});t.createIndex("by-release","release",{unique:!1}),t.createIndex("by-service-id","serviceId",{unique:!1})}if(!n.objectStoreNames.contains(T)){const t=n.createObjectStore(T,{keyPath:null});t.createIndex("by-original-key","originalKey",{unique:!1}),t.createIndex("by-timestamp","timestamp",{unique:!1})}if(!n.objectStoreNames.contains(_)){const t=n.createObjectStore(_,{keyPath:"eventId"});t.createIndex("by-service-id","serviceId",{unique:!1}),t.createIndex("by-reset-at","resetAt",{unique:!1})}}catch(r){throw o("Error during database upgrade",r),r}}(t)}})}function U(t,n){return new Promise((s,r)=>{t.onsuccess=()=>s(t.result),t.onerror=()=>r(B(t.error,n))})}function j(t,n,s,r,o){return new Promise((a,d)=>{let c;try{const a=t.transaction(n,s),l=a.objectStore(n);c=r(l),a.onerror=()=>d(B(a.error,o))}catch(l){return void d(new StorageError(`Failed during ${o}`,o,l))}c.onsuccess=()=>a(c.result),c.onerror=()=>d(B(c.error,o))})}function B(t,n){return"QuotaExceededError"===t?.name?new StorageQuotaError(n):new StorageError(`Failed during ${n}`,n,t)}const F="OBF:";function V(t){return t?t.split("").map(t=>t.charCodeAt(0).toString()).join(""):""}function K(t){return(new TextEncoder).encode(t)}function Q(t,n){if(0===n.length)return t;const s=new Uint8Array(t.length);for(let r=0;r<t.length;r++){const o=t[r],a=n[r%n.length];void 0!==o&&void 0!==a&&(s[r]=o^a)}return s}function J(t,n){const s=function(t){let n="";for(let s=0;s<t.length;s++){const r=t[s];void 0!==r&&(n+=String.fromCharCode(r))}return btoa(n)}(Q(K(JSON.stringify(t)),K(n||"default")));return`${F}${s}`}function W(t,n){const s=t.slice(4);if(!s)throw new Error("Empty obfuscated payload");let r;try{r=function(t){const n=atob(t),s=new Uint8Array(n.length);for(let r=0;r<n.length;r++)s[r]=n.charCodeAt(r);return s}(s)}catch{throw new Error("Invalid base64 in obfuscated data")}const o=Q(r,K(n||"default"));let a;try{d=o,a=(new TextDecoder).decode(d)}catch{throw new Error("Failed to decode UTF-8 data - possibly corrupted")}var d;try{return JSON.parse(a)}catch{throw new Error("Failed to parse JSON - data may be corrupted or tampered")}}function Y(t){return"string"==typeof t&&t.startsWith(F)}class IndexedDBStorageAdapter{constructor(t){if(this.db=null,this.initPromise=null,!t)throw new Error("FATAL: dbName is required for IndexedDBStorageAdapter");this.dbName=t}async init(){return this.initPromise?this.initPromise:this.db?Promise.resolve():(this.initPromise=D(this.dbName).then(t=>{this.db=t}).finally(()=>{this.initPromise=null}),this.initPromise)}ensureInitialized(){if(!this.db)throw new StorageNotInitializedError("ensureInitialized");return this.db}async getStudent(t,n){const s=this.ensureInitialized(),r=O(t,n),o=await j(s,P,"readonly",t=>t.get(r),"getStudent");return null==o?null:function(t,n,s){if(Y(t))throw new StorageFormatError("Obfuscated data found with ENCRYPT_STORAGE disabled. Run migration to decrypt or re-enable encryption.","plain","obfuscated",s);return t}(o,0,r)}async saveStudent(t){const n=this.ensureInitialized(),s=O(t.release,t.serviceId),r=t;await j(n,P,"readwrite",t=>t.put(r,s),"saveStudent")}async getStudentsByRelease(t){const n=this.ensureInitialized();return await j(n,P,"readonly",n=>n.index("by-release").getAll(t),"getStudentsByRelease")||[]}getStudentsByReleaseEncrypted(t){const n=this.ensureInitialized();return new Promise((s,r)=>{const o=n.transaction(P,"readonly").objectStore(P).openCursor(),a=[];o.onsuccess=()=>{const n=o.result;if(n){const s=function(t,n){if(!Y(t))return null;try{return W(t,V(n))}catch{return null}}(n.value,t);s&&s.release===t&&a.push(s),n.continue()}else s(a)},o.onerror=()=>{r(new StorageError("Failed during getStudentsByRelease","getStudentsByRelease",o.error))}})}async clearAll(){const t=this.ensureInitialized().transaction([P,T,_],"readwrite");await Promise.all([U(t.objectStore(P).clear(),"clearAll"),U(t.objectStore(T).clear(),"clearAll"),U(t.objectStore(_).clear(),"clearAll")])}async backup(t){const n=this.ensureInitialized();await async function(t,n){const s=(new Date).toISOString(),r=`backup_${s}_${n.serviceId}`,o=O(n.release,n.serviceId),a={...n,originalKey:o,timestamp:s};await j(t,T,"readwrite",t=>t.put(a,r),"backup")}(n,t)}async saveAuditEvent(t){const n=this.ensureInitialized();await async function(t,n){await j(t,_,"readwrite",t=>t.add(n),"saveAuditEvent")}(n,t)}close(){this.db&&(this.db.close(),this.db=null,this.initPromise=null)}}let G=null,Z=null;function X(t){if(!t)throw new Error("FATAL: dbName is required for getStorageAdapter()");return G&&Z!==t&&(G.close(),G=null),G||(G=new IndexedDBStorageAdapter(t),Z=t),G}function ee(t,n){return 0===n||function(t){return 0===t.length}(t)?"unstarted":function(t,n){if(t.length!==n)return!1;return t.every(t=>!0===t.success)}(t,n)?"complete":"incomplete"}function te(t){return{schema:1,docId:t.release,release:t.release,serviceId:t.serviceId,name:t.name,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{}}}class StorageService{constructor(t){if(!t)throw new Error("FATAL: dbName is required for StorageService");this.dbName=t,this.adapter=X(t)}async init(){try{await this.adapter.init(),this.dbName}catch(t){throw o("Failed to initialize storage service",t),t}}async loadStudentRecord(t){try{const n=await this.adapter.getStudent(t.release,t.serviceId);if(n)return t.serviceId,n;const s=te(t);return t.serviceId,s}catch(n){return a(`IndexedDB error, creating new record: ${n.message}`),te(t)}}async saveStudentRecord(t){try{t.updated=(new Date).toISOString();const n=function(t){let n=0,s=0;for(const r in t){const o=t[r];if(o&&o.answers&&Array.isArray(o.answers)){const t=o.answers.filter(t=>""!==t.answer.trim());n+=t.length,s+=t.filter(t=>t.success).length}}return{attempted:n,correct:s}}(t.pages);t.attempted=n.attempted,t.correct=n.correct,await this.adapter.saveStudent(t),t.serviceId}catch(n){throw o("Failed to save student record",n),n}}updateRecordWithAnswer(t,n,s,r,o){const a=t.pages[n]||{answers:[],state:"unstarted"};for(;a.answers.length<=s;)a.answers.push({answer:"",success:!1,timestamp:(new Date).toISOString()});a.answers[s]=r;const d=(new Date).toISOString();return a.firstAttempted||(a.firstAttempted=d),a.lastAttempted=d,a.state=ee(a.answers,o),{...t,pages:{...t.pages,[n]:a}}}updateRecordWithAnalysis(t,n,s,r,o){const a=t.pages[n]||{answers:[],state:"unstarted"},d=a.analysis||{tableId:s,cells:{}};d.cells[r]=o;const c=(new Date).toISOString();return d.firstEdited||(d.firstEdited=c),d.lastEdited=c,a.analysis=d,t.pages[n]=a,t.updated=c,t}buildCache(t){return function(t){const n={totals:{total:0,answered:0,correct:0},pages:{}};for(const[s,r]of Object.entries(t.pages)){const t=l(0,r);n.pages[s]=t,n.totals.total+=t.total,n.totals.answered+=t.answered,n.totals.correct+=t.correct}return n}(t)}async getStudentsByRelease(t){try{return await this.adapter.getStudentsByRelease(t)}catch(n){throw o("Failed to get students by release",n),n}}async refreshCacheOnLogin(t){try{const n=await this.loadStudentRecord(t);await this.saveStudentRecord(n),v(S.CACHE,this.buildCache(n)),t.serviceId}catch{v(S.CACHE,{totals:{total:0,answered:0,correct:0},pages:{}})}}async clearAll(){try{await this.adapter.clearAll()}catch(t){throw o("Failed to clear all data",t),t}}async backup(t){try{await this.adapter.backup(t),t.serviceId}catch(n){a(`Failed to create backup for ${t.serviceId}`,n)}}}let ne=null,se=null;function re(t){if(ne&&!t)return ne;if(ne&&t&&se!==t)return a(`Storage service already initialized with dbName="${se}", ignoring new dbName="${t}"`),ne;if(!ne){if(!t)throw new Error("FATAL: dbName is required for first getStorageService() call");ne=new StorageService(t),se=t}return ne}function oe(t,n,s){const r=new CustomEvent(t,{detail:n,bubbles:s?.bubbles??!0,composed:s?.composed??!0,cancelable:s?.cancelable??!1});return document.dispatchEvent(r)}function ie(t,n,s,r){const o=new CustomEvent(n,{detail:s,bubbles:!0,composed:!0,cancelable:!1});return t.dispatchEvent(o)}async function ae(t,n){const s=re();try{await s.saveStudentRecord(t)}catch(d){a("Failed to save student record to IndexedDB",d)}const r=s.buildCache(t);v(S.CACHE,r),n.onSavedDom?.();const o=oe;for(const a of n.events)o(a.name,a.detail)}function de(t,n,s,r){const{debouncer:d,pageId:l,parsed:u}=n;if(!d||!l)return;u.questions[s]&&d.debounce(`save-answer-${s}`,()=>{!async function(t,n,s,r){const{pageId:d,parsed:l,inputs:u}=n;if(!d||!u)return;const h=l.questions[s];if(!h)return;const p=y(S.SESSION);if(!p)return void o("No active session found");const g=c(h,r),m={answer:r.trim(),success:g,timestamp:(new Date).toISOString()},f=re();let b;try{b=await f.loadStudentRecord(p)}catch(E){return void a("Failed to load student record, answer not saved",E)}const v=l.questions.length,w=f.updateRecordWithAnswer(b,d,s,m,v),x=w.pages[d];await ae(w,{onSavedDom:()=>{const n=t.querySelector(`tbody tr:nth-child(${s+1})`),r=n?.querySelector("td:nth-child(2)");r&&ce(r,g)},events:[{name:"qd:answer-saved",detail:{pageId:d,answer:m}},...x?[{name:"qd:state-changed",detail:{pageId:d,state:x.state}}]:[]]})}(t,n,s,r)},200)}function ce(t,n){f(t,"qd-answer-correct","qd-answer-incorrect"),m(t,n?"qd-answer-correct":"qd-answer-incorrect")}function le(t){return function(t,n="display"){if(null==t)return console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date";const s="string"==typeof t?new Date(t):t;return isNaN(s.getTime())?(console.warn("Invalid date provided to formatTimestamp:",t),"Invalid Date"):"csv"===n?function(t){return t.toISOString()}(s):function(t){return`${t.toLocaleDateString("en-US",{month:"short"})} ${t.getDate()} ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`}(s)}(t,"display")}
/**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const ue=globalThis,he=ue.ShadowRoot&&(void 0===ue.ShadyCSS||ue.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,pe=Symbol(),ge=new WeakMap;let me=class{constructor(t,n,s){if(this._$cssResult$=!0,s!==pe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=n}get styleSheet(){let t=this.o;const n=this.t;if(he&&void 0===t){const s=void 0!==n&&1===n.length;s&&(t=ge.get(n)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&ge.set(n,t))}return t}toString(){return this.cssText}};const fe=(t,...n)=>{const s=1===t.length?t[0]:n.reduce((n,s,r)=>n+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[r+1],t[0]);return new me(s,t,pe)},be=he?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let n="";for(const s of t.cssRules)n+=s.cssText;return(t=>new me("string"==typeof t?t:t+"",void 0,pe))(n)})(t):t,{is:ye,defineProperty:ve,getOwnPropertyDescriptor:we,getOwnPropertyNames:xe,getOwnPropertySymbols:Se,getPrototypeOf:Ee}=Object,$e=globalThis,qe=$e.trustedTypes,Ce=qe?qe.emptyScript:"",ke=$e.reactiveElementPolyfillSupport,Ie=(t,n)=>t,Ae={toAttribute(t,n){switch(n){case Boolean:t=t?Ce:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,n){let s=t;switch(n){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(r){s=null}}return s}},Oe=(t,n)=>!ye(t,n),Pe={attribute:!0,type:String,converter:Ae,reflect:!1,useDefault:!1,hasChanged:Oe};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */Symbol.metadata??=Symbol("metadata"),$e.litPropertyMetadata??=new WeakMap;let Te=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,n=Pe){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(t,n),!n.noAccessor){const s=Symbol(),r=this.getPropertyDescriptor(t,s,n);void 0!==r&&ve(this.prototype,t,r)}}static getPropertyDescriptor(t,n,s){const{get:r,set:o}=we(this.prototype,t)??{get(){return this[n]},set(t){this[n]=t}};return{get:r,set(n){const a=r?.call(this);o?.call(this,n),this.requestUpdate(t,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Pe}static _$Ei(){if(this.hasOwnProperty(Ie("elementProperties")))return;const t=Ee(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(Ie("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ie("properties"))){const t=this.properties,n=[...xe(t),...Se(t)];for(const s of n)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const n=litPropertyMetadata.get(t);if(void 0!==n)for(const[t,s]of n)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[n,s]of this.elementProperties){const t=this._$Eu(n,s);void 0!==t&&this._$Eh.set(t,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const n=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)n.unshift(be(t))}else void 0!==t&&n.push(be(t));return n}static _$Eu(t,n){const s=n.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,n=this.constructor.elementProperties;for(const s of n.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(he)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of n){const n=document.createElement("style"),r=ue.litNonce;void 0!==r&&n.setAttribute("nonce",r),n.textContent=s.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,n,s){this._$AK(t,s)}_$ET(t,n){const s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(void 0!==r&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:Ae).toAttribute(n,s.type);this._$Em=t,null==o?this.removeAttribute(r):this.setAttribute(r,o),this._$Em=null}}_$AK(t,n){const s=this.constructor,r=s._$Eh.get(t);if(void 0!==r&&this._$Em!==r){const t=s.getPropertyOptions(r),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:Ae;this._$Em=r;const a=o.fromAttribute(n,t.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(t,n,s){if(void 0!==t){const r=this.constructor,o=this[t];if(s??=r.getPropertyOptions(t),!((s.hasChanged??Oe)(o,n)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,n,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,n,{useDefault:s,reflect:r,wrapped:o},a){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??n??this[t]),!0!==o||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||s||(n=void 0),this._$AL.set(t,n)),!0===r&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,n]of this._$Ep)this[t]=n;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[n,s]of t){const{wrapped:t}=s,r=this[n];!0!==t||this._$AL.has(n)||void 0===r||this.C(n,void 0,s,r)}}let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(n)):this._$EM()}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(n)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};Te.elementStyles=[],Te.shadowRootOptions={mode:"open"},Te[Ie("elementProperties")]=new Map,Te[Ie("finalized")]=new Map,ke?.({ReactiveElement:Te}),($e.reactiveElementVersions??=[]).push("2.1.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const _e=globalThis,Le=_e.trustedTypes,Ne=Le?Le.createPolicy("lit-html",{createHTML:t=>t}):void 0,De="$lit$",Me=`lit$${Math.random().toFixed(9).slice(2)}$`,Re="?"+Me,ze=`<${Re}>`,He=document,Ue=()=>He.createComment(""),je=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Be=Array.isArray,Fe="[ \t\n\f\r]",Ve=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ke=/-->/g,Qe=/>/g,Je=RegExp(`>|${Fe}(?:([^\\s"'>=/]+)(${Fe}*=${Fe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),We=/'/g,Ye=/"/g,Ge=/^(?:script|style|textarea|title)$/i,Ze=(st=1,(t,...n)=>({_$litType$:st,strings:t,values:n})),Xe=Symbol.for("lit-noChange"),et=Symbol.for("lit-nothing"),tt=new WeakMap,nt=He.createTreeWalker(He,129);var st;function rt(t,n){if(!Be(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==Ne?Ne.createHTML(n):n}class N{constructor({strings:t,_$litType$:n},s){let r;this.parts=[];let o=0,a=0;const d=t.length-1,c=this.parts,[l,u]=((t,n)=>{const s=t.length-1,r=[];let o,a=2===n?"<svg>":3===n?"<math>":"",d=Ve;for(let c=0;c<s;c++){const n=t[c];let s,l,u=-1,h=0;for(;h<n.length&&(d.lastIndex=h,l=d.exec(n),null!==l);)h=d.lastIndex,d===Ve?"!--"===l[1]?d=Ke:void 0!==l[1]?d=Qe:void 0!==l[2]?(Ge.test(l[2])&&(o=RegExp("</"+l[2],"g")),d=Je):void 0!==l[3]&&(d=Je):d===Je?">"===l[0]?(d=o??Ve,u=-1):void 0===l[1]?u=-2:(u=d.lastIndex-l[2].length,s=l[1],d=void 0===l[3]?Je:'"'===l[3]?Ye:We):d===Ye||d===We?d=Je:d===Ke||d===Qe?d=Ve:(d=Je,o=void 0);const p=d===Je&&t[c+1].startsWith("/>")?" ":"";a+=d===Ve?n+ze:u>=0?(r.push(s),n.slice(0,u)+De+n.slice(u)+Me+p):n+Me+(-2===u?c:p)}return[rt(t,a+(t[s]||"<?>")+(2===n?"</svg>":3===n?"</math>":"")),r]})(t,n);if(this.el=N.createElement(l,s),nt.currentNode=this.el.content,2===n||3===n){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=nt.nextNode())&&c.length<d;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(De)){const n=u[a++],s=r.getAttribute(t).split(Me),d=/([.?@])?(.*)/.exec(n);c.push({type:1,index:o,name:d[2],strings:s,ctor:"."===d[1]?H:"?"===d[1]?I:"@"===d[1]?L:k}),r.removeAttribute(t)}else t.startsWith(Me)&&(c.push({type:6,index:o}),r.removeAttribute(t));if(Ge.test(r.tagName)){const t=r.textContent.split(Me),n=t.length-1;if(n>0){r.textContent=Le?Le.emptyScript:"";for(let s=0;s<n;s++)r.append(t[s],Ue()),nt.nextNode(),c.push({type:2,index:++o});r.append(t[n],Ue())}}}else if(8===r.nodeType)if(r.data===Re)c.push({type:2,index:o});else{let t=-1;for(;-1!==(t=r.data.indexOf(Me,t+1));)c.push({type:7,index:o}),t+=Me.length-1}o++}}static createElement(t,n){const s=He.createElement("template");return s.innerHTML=t,s}}function ot(t,n,s=t,r){if(n===Xe)return n;let o=void 0!==r?s._$Co?.[r]:s._$Cl;const a=je(n)?void 0:n._$litDirective$;return o?.constructor!==a&&(o?._$AO?.(!1),void 0===a?o=void 0:(o=new a(t),o._$AT(t,s,r)),void 0!==r?(s._$Co??=[])[r]=o:s._$Cl=o),void 0!==o&&(n=ot(t,o._$AS(t,n.values),o,r)),n}class M{constructor(t,n){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:n},parts:s}=this._$AD,r=(t?.creationScope??He).importNode(n,!0);nt.currentNode=r;let o=nt.nextNode(),a=0,d=0,c=s[0];for(;void 0!==c;){if(a===c.index){let n;2===c.type?n=new R(o,o.nextSibling,this,t):1===c.type?n=new c.ctor(o,c.name,c.strings,this,t):6===c.type&&(n=new z(o,this,t)),this._$AV.push(n),c=s[++d]}a!==c?.index&&(o=nt.nextNode(),a++)}return nt.currentNode=He,r}p(t){let n=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,n),n+=s.strings.length-2):s._$AI(t[n])),n++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,n,s,r){this.type=2,this._$AH=et,this._$AN=void 0,this._$AA=t,this._$AB=n,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const n=this._$AM;return void 0!==n&&11===t?.nodeType&&(t=n.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,n=this){t=ot(this,t,n),je(t)?t===et||null==t||""===t?(this._$AH!==et&&this._$AR(),this._$AH=et):t!==this._$AH&&t!==Xe&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Be(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==et&&je(this._$AH)?this._$AA.nextSibling.data=t:this.T(He.createTextNode(t)),this._$AH=t}$(t){const{values:n,_$litType$:s}=t,r="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(rt(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(n);else{const t=new M(r,this),s=t.u(this.options);t.p(n),this.T(s),this._$AH=t}}_$AC(t){let n=tt.get(t.strings);return void 0===n&&tt.set(t.strings,n=new N(t)),n}k(t){Be(this._$AH)||(this._$AH=[],this._$AR());const n=this._$AH;let s,r=0;for(const o of t)r===n.length?n.push(s=new R(this.O(Ue()),this.O(Ue()),this,this.options)):s=n[r],s._$AI(o),r++;r<n.length&&(this._$AR(s&&s._$AB.nextSibling,r),n.length=r)}_$AR(t=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);t!==this._$AB;){const n=t.nextSibling;t.remove(),t=n}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,n,s,r,o){this.type=1,this._$AH=et,this._$AN=void 0,this.element=t,this.name=n,this._$AM=r,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=et}_$AI(t,n=this,s,r){const o=this.strings;let a=!1;if(void 0===o)t=ot(this,t,n,0),a=!je(t)||t!==this._$AH&&t!==Xe,a&&(this._$AH=t);else{const r=t;let d,c;for(t=o[0],d=0;d<o.length-1;d++)c=ot(this,r[s+d],n,d),c===Xe&&(c=this._$AH[d]),a||=!je(c)||c!==this._$AH[d],c===et?t=et:t!==et&&(t+=(c??"")+o[d+1]),this._$AH[d]=c}a&&!r&&this.j(t)}j(t){t===et?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===et?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==et)}}class L extends k{constructor(t,n,s,r,o){super(t,n,s,r,o),this.type=5}_$AI(t,n=this){if((t=ot(this,t,n,0)??et)===Xe)return;const s=this._$AH,r=t===et&&s!==et||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==et&&(s===et||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,n,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=n,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){ot(this,t)}}const it=_e.litHtmlPolyfillSupport;it?.(N,R),(_e.litHtmlVersions??=[]).push("3.3.1");const at=(t,n,s)=>{const r=s?.renderBefore??n;let o=r._$litPart$;if(void 0===o){const t=s?.renderBefore??null;r._$litPart$=o=new R(n.insertBefore(Ue(),t),t,void 0,s??{})}return o._$AI(t),o},dt=globalThis;
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */let ct=class extends Te{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=at(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Xe}};ct._$litElement$=!0,ct.finalized=!0,dt.litElementHydrateSupport?.({LitElement:ct});const lt=dt.litElementPolyfillSupport;lt?.({LitElement:ct}),(dt.litElementVersions??=[]).push("4.2.1");
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const ut=t=>(n,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,n)}):customElements.define(t,n)},ht={attribute:!0,type:String,converter:Ae,reflect:!1,hasChanged:Oe},pt=(t=ht,n,s)=>{const{kind:r,metadata:o}=s;let a=globalThis.litPropertyMetadata.get(o);if(void 0===a&&globalThis.litPropertyMetadata.set(o,a=new Map),"setter"===r&&((t=Object.create(t)).wrapped=!0),a.set(s.name,t),"accessor"===r){const{name:r}=s;return{set(s){const o=n.get.call(this);n.set.call(this,s),this.requestUpdate(r,o,t)},init(n){return void 0!==n&&this.C(r,void 0,t,n),n}}}if("setter"===r){const{name:r}=s;return function(s){const o=this[r];n.call(this,s),this.requestUpdate(r,o,t)}}throw Error("Unsupported decorator location: "+r)};
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function gt(t){return(n,s)=>"object"==typeof s?pt(t,n,s):((t,n,s)=>{const r=n.hasOwnProperty(s);return n.constructor.createProperty(s,t),r?Object.getOwnPropertyDescriptor(n,s):void 0})(t,n,s)}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */function mt(t){return gt({...t,state:!0,attribute:!1})}
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
function ft(t,n){return(n,s,r)=>((t,n,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&"object"!=typeof n&&Object.defineProperty(t,n,s),s))(n,s,{get(){return(n=>n.renderRoot?.querySelector(t)??null)(this)}})}var bt=Object.defineProperty,yt=Object.getOwnPropertyDescriptor,vt=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?yt(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&bt(n,s,a),a};let wt=class extends ct{constructor(){super(...arguments),this.answers=[]}render(){return this.answers.map(t=>Ze`<div class="qd-student-answer ${t.cssClass}">
          <span class="qd-student-name">${t.name} (${t.maskedServiceId})</span>:
          <span class="qd-student-answer-text">${t.answer}</span>
          <span class="qd-timestamp">${t.formattedTimestamp}</span>
        </div>`)}};async function xt(t,n){const{pageId:s,parsed:r}=n;if(!s)return;const a=y(S.SESSION);if(!a)return;const d=re();try{const n=await d.getStudentsByRelease(a.release);if(0===n.length)return void alert("No student data available for this release. Students need to log in and answer questions first.");const o=t.querySelector("tbody");if(!o)return;const c=Array.from(o.querySelectorAll("tr"));r.questions.forEach((t,r)=>{const o=c[r];if(!o)return;const a=Array.from(o.querySelectorAll("td"))[1];if(!a)return;const d=a.querySelector(".qd-student-answers");d&&d.remove();const l=function(t,n,s){const r=[];for(const o of t){const t=o.pages[n];if(!t||!t.answers)continue;const a=t.answers[s];a&&r.push({name:o.name,maskedServiceId:o.serviceId.slice(-4),answer:a.answer,success:a.success,formattedTimestamp:le(a.timestamp),cssClass:a.success?"qd-correct":"qd-incorrect"})}return r}(n,s,r);if(l.length>0){const t=document.createElement("qd-student-answers");t.classList.add("qd-student-answers"),t.answers=l,a.appendChild(t)}}),n.length}catch(c){o("Failed to load student answers",c)}}function St(t){t.querySelectorAll(".qd-student-answers").forEach(t=>t.remove())}wt.styles=fe`
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
  `,vt([gt({attribute:!1})],wt.prototype,"answers",2),wt=vt([ut("qd-student-answers")],wt);const Et=new WeakMap;function $t(t,n){const s=Et.get(t);let r;if(s){if(s.interactive||!n.interactive)return!0;r=s.parsed}else r=d(t),r.errors&&r.errors.length>0&&o("Quiz table has validation errors:",r.errors);const a={parsed:r,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return o("Interactive mode requires pageId option"),!1;n.pageId,a.debouncer=new Debouncer,a.inputs=[]}if(Et.set(t,a),n.interactive){const n=function(t,n){const{parsed:s,pageId:r,debouncer:a}=n;if(!r||!a)return o("Interactive mode requires pageId and debouncer"),!1;(function(t){const n=t.querySelectorAll("thead th, thead td");n[1]&&f(n[1],"qd-hidden"),t.querySelectorAll("tbody tr").forEach(t=>{const n=t.querySelectorAll("td");n[1]&&f(n[1],"qd-hidden")})})(t),C(t);if(!y(S.SESSION))return o("No active session found"),!1;let d=y(S.CACHE);d?(d.totals.total,Object.keys(d.pages).length):d={totals:{total:0,answered:0,correct:0},pages:{}};const c=s.questions.length;d=function(t,n,s){const r=t.pages[n];if(r&&r.total>=s)return t;const o=s-(r?.total||0),a={state:r?.state||"unstarted",total:s,answered:r?.answered||0,correct:r?.correct||0,last:r?.last,answers:r?.answers,analysis:r?.analysis};return{totals:{total:t.totals.total+o,answered:t.totals.answered,correct:t.totals.correct},pages:{...t.pages,[n]:a}}}(d,r,c),v(S.CACHE,d);const l=d?.pages[r],u=l?.answers||[];u.length;const h=t.querySelector("tbody");if(!h)return o("Quiz table has no tbody element"),!1;const p=Array.from(h.querySelectorAll("tr")),g=[];s.questions.forEach((s,r)=>{const o=p[r];if(!o)return;const a=Array.from(o.querySelectorAll("td"));if(3!==a.length)return;const d=a[0],c=a[1];if(!d||!c)return;const l=u[r];l&&l.answer&&(l.answer,l.success);const h=A(s,l);g.push(h),f(c,"qd-answer-correct","qd-answer-incorrect"),c.textContent="",c.appendChild(h),l&&ce(c,l.success);const m="SELECT"===h.tagName?"change":"input";h.addEventListener(m,()=>{de(t,n,r,h.value)})}),n.inputs=g;const w=()=>{xt(t,n)},x=()=>{St(t)};document.addEventListener("qd:instructor-show-answers",w),document.addEventListener("qd:instructor-hide-answers",x);const E="true"===sessionStorage.getItem(S.INSTRUCTOR),$="true"===sessionStorage.getItem(b);E&&$&&xt(t,n);const q=()=>{if(t.querySelectorAll("td.qd-answer-correct, td.qd-answer-incorrect").forEach(t=>{f(t,"qd-answer-correct","qd-answer-incorrect")}),n.inputs)for(const t of n.inputs)t instanceof HTMLSelectElement?t.selectedIndex=0:t instanceof HTMLInputElement&&(t.value="");St(t)},O=()=>{q()},P=()=>{q()};return document.addEventListener("qd:logout",O),document.addEventListener("qd:login",P),n.cleanupInstructorListeners=()=>{document.removeEventListener("qd:instructor-show-answers",w),document.removeEventListener("qd:instructor-hide-answers",x),document.removeEventListener("qd:logout",O),document.removeEventListener("qd:login",P)},m(t,"qd-quiz-interactive"),!0}(t,a);return n?r.questions.length:o("Interactive enhancement failed"),n}return function(t){return function(t){const n=t.querySelector("colgroup");n&&n.remove()}(t),q(t),C(t),m(t,"qd-quiz-non-interactive"),!0}(t)}function qt(t){return Et.get(t)}function Ct(t,n=16){let s=5381;for(let o=0;o<t.length;o++){s=(s<<5)+s+t.charCodeAt(o),s&=s}const r=Math.abs(s).toString(16).padStart(8,"0");return r.repeat(Math.ceil(n/r.length)).substring(0,n)}function kt(t){const n=u(t),s=n[0],r=s?h(s).length:0,o=t.className||"qd-analysis";return Ct(`${n.length}x${r}:${o}`,16)}function It(t,n,s){return`R${t}C${n}#f:${Ct(s.replace(/\s+/g," ").trim(),8)}`}function At(t){return t.classList.contains("interactive")}function Ot(t){const n=[];t.querySelector("tbody")||n.push("Analysis table must have a tbody element");const s=u(t);0===s.length&&n.push("Analysis table must have at least one row");const r=kt(t),o=[];return s.forEach((t,n)=>{h(t).forEach((t,s)=>{if(At(t)){const r=p(t),a=It(n,s,r);o.push({row:n,col:s,key:a})}})}),{element:t,tableId:r,editableCells:o,errors:n.length>0?n:void 0}}function Pt(t,n,s){const{debouncer:r,pageId:d}=t;if(!r||!d)return;const c=p(n);r.debounce(`save-cell-${s}`,()=>{!async function(t,n,s){const{pageId:r,parsed:d}=t;if(!r)return;const c=y(S.SESSION);if(!c)return void o("No active session found");const l=re();let u;try{u=await l.loadStudentRecord(c)}catch(p){return void a("Failed to load student record, analysis not saved",p)}const h=l.updateRecordWithAnalysis(u,r,d.tableId,n,s);await ae(h,{events:[{name:"qd:analysis-saved",detail:{pageId:r,tableId:d.tableId,cellKey:n,content:s}}]})}(t,s,c)},500)}var Tt=Object.defineProperty,_t=Object.getOwnPropertyDescriptor,Lt=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?_t(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Tt(n,s,a),a};let Nt=class extends ct{constructor(){super(...arguments),this.entries=[]}render(){return 0===this.entries.length?(this.setAttribute("data-empty",""),Ze`<div class="qd-no-entries">(No entries yet)</div>`):(this.removeAttribute("data-empty"),(t=this.entries,[...t].sort((t,n)=>{const s=new Date(t.timestamp).getTime();return new Date(n.timestamp).getTime()-s})).map(t=>{const n=t.serviceId.slice(-4),s=le(t.timestamp);return Ze`<div class="qd-entry">
        <span class="qd-entry-name">${t.name} (${n}) • ${s}: </span>
        <span class="qd-entry-content">${t.content}</span>
      </div>`}));var t}};async function Dt(t,n){const s=n.pageId||function(){const t=document.body.dataset.pageId;if(t)return t;const n=window.location.pathname,s=(n.split("/").pop()||"").replace(".html","");return s||void 0}();if(!s)return void a("Cannot show student entries: page ID not found");const r=y(S.SESSION);if(!r)return void a("Cannot show student entries: no active session");const d=re();let c;try{c=await d.getStudentsByRelease(r.release)}catch(m){return void o("Failed to load students for instructor view:",m)}const l=function(t,n){const s={};return t.forEach(t=>{const r=t.pages[n];if(!r||!r.analysis)return;const{cells:o}=r.analysis,a=r.analysis.lastEdited||t.updated;Object.entries(o).forEach(([n,r])=>{s[n]||(s[n]=[]),s[n].push({serviceId:t.serviceId,name:t.name,content:r,timestamp:a})})}),s}(c,s),{editableCells:p}=n.parsed,g=u(t);p.forEach(({row:t,col:n,key:s})=>{const r=g[t];if(!r)return;const o=h(r)[n];if(!o)return;const a=function(t){const n=document.createElement("qd-student-entries");return n.entries=t,n}(l[s]||[]);a.setAttribute("data-qd-student-entries","true");const d=o.querySelector("[data-qd-student-entries]");d&&d.remove(),o.appendChild(a)}),p.length}function Mt(t){t.querySelectorAll("[data-qd-student-entries]").forEach(t=>t.remove())}Nt.styles=fe`
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
  `,Lt([gt({attribute:!1})],Nt.prototype,"entries",2),Nt=Lt([ut("qd-student-entries")],Nt);const Rt=new WeakMap;function zt(t,n){const s=Ot(t);s.errors&&s.errors.length>0&&o("Analysis table has validation errors:",s.errors);const r={parsed:s,interactive:n.interactive,pageId:n.pageId};if(n.interactive){if(!n.pageId)return o("Interactive mode requires pageId option"),!1;r.debouncer=new Debouncer,r.cellKeyMap=new Map}return Rt.set(t,r),n.interactive?function(t,n){const{parsed:s,pageId:r,debouncer:a,cellKeyMap:d}=n;if(!r||!a||!d)return o("Interactive mode requires pageId, debouncer, and cellKeyMap"),!1;if(!y(S.SESSION))return o("No active session found"),!1;const c=y(S.CACHE),l=c?.pages[r],p=l?.analysis,g=p?.cells||{},f=u(t);return s.editableCells.forEach(({row:t,col:s,key:r})=>{const a=f[t];if(!a)return;const c=h(a)[s];c&&(At(c)?(d.set(c,r),g[r]&&(c.textContent=g[r]),c.contentEditable="true",m(c,"qd-editable"),c.addEventListener("input",()=>{Pt(n,c,r)})):o(`Cell at R${t}C${s} is no longer editable`))}),m(t,"qd-analysis-interactive"),!0}(t,r):function(t){m(t,"qd-analysis-non-interactive");const n=()=>{const n=Rt.get(t);n&&Dt(t,n)},s=()=>{Mt(t)};return document.addEventListener("qd:instructor-show-answers",n),document.addEventListener("qd:instructor-hide-answers",s),!0}(t)}function Ht(t,n,s={}){s.addInstructorClass&&t.classList.add("qd-quiz-instructor");t.querySelectorAll("td:nth-child(2), th:nth-child(2)").forEach(t=>{t.classList.remove("qd-hidden")});t.querySelectorAll("tbody td:nth-child(2)").forEach((t,s)=>{const r=n.parsed.questions[s];r&&t instanceof HTMLTableCellElement&&(t.textContent=r.correctAnswer)});t.querySelectorAll("td:nth-child(3), th:nth-child(3)").forEach(t=>t.classList.remove("qd-hidden"));const r=()=>{xt(t,n)};document.addEventListener("qd:instructor-show-answers",r),document.addEventListener("qd:instructor-hide-answers",()=>{St(t)});"true"===sessionStorage.getItem(b)&&r()}function Ut(t){const n=window.location.pathname.split(/[?#]/)[0]??"";return n.substring(n.lastIndexOf("/")+1).replace(/\.html?$/i,"")}function jt(){const t=Ut();if(!t)return;if("true"===sessionStorage.getItem(S.INSTRUCTOR))return void function(t){const n=document.querySelectorAll("table.qd-quiz");n.forEach(n=>{const s=qt(n);s&&(s.pageId=t,Ht(n,s))})}(t);const n=document.querySelectorAll("table.qd-quiz");n.length>0&&(n.length,n.forEach(n=>$t(n,{interactive:!0,pageId:t})));const s=document.querySelectorAll("table.qd-analysis");s.length>0&&(s.length,s.forEach(n=>zt(n,{interactive:!0,pageId:t})))}class EventCoordinator{constructor(){this.listeners=new Map}initialize(){this.registerLoginHandlers(),this.registerLogoutHandlers(),this.registerAnswerHandlers(),this.registerStateHandlers(),this.registerInstructorHandlers(),this.registerDataHandlers()}registerLoginHandlers(){this.addEventListener("qd:login",t=>{(async()=>{const n=t.detail;if(n.serviceId,n.name,"INSTRUCTOR"===n.serviceId)return;const s=y(S.SESSION);s&&(await re().refreshCacheOnLogin(s),this.dispatchEvent("qd:cache-rebuild",{}),jt())})()})}registerLogoutHandlers(){this.addEventListener("qd:logout",t=>{t.detail.serviceId;document.querySelectorAll("table.qd-quiz").forEach(t=>{!function(t){const n=Et.get(t);n&&(n.interactive=!1,n.pageId=void 0,n.inputs=void 0,n.cleanupInstructorListeners?.(),n.cleanupInstructorListeners=void 0,q(t),C(t),f(t,"qd-quiz-interactive"))}(t)});document.querySelectorAll("table.qd-analysis").forEach(t=>{!function(t){const n=Rt.get(t);n&&(Mt(t),n.interactive&&(t.querySelectorAll(".qd-editable").forEach(t=>{t instanceof HTMLTableCellElement&&(t.contentEditable="false",t.classList.remove("qd-editable"),t.textContent="")}),t.classList.remove("qd-analysis-interactive"),n.debouncer?.cancelAll()),n.interactive=!1,n.pageId=void 0,n.debouncer=void 0,n.cellKeyMap=void 0)}(t)}),this.dispatchEvent("qd:cache-clear",{})})}registerAnswerHandlers(){this.addEventListener("qd:answer-saved",t=>{const n=t.detail;n.pageId,n.questionIndex,n.answer,n.success,this.dispatchEvent("qd:cache-update",{pageId:n.pageId})})}registerStateHandlers(){this.addEventListener("qd:state-changed",t=>{const n=t.detail;n.pageId,n.state,this.dispatchEvent("qd:badge-update",{pageId:n.pageId,state:n.state})})}registerInstructorHandlers(){this.addEventListener("qd:instructor-unlock",t=>{t.detail.unlockTime}),this.addEventListener("qd:instructor-lock",()=>{})}registerDataHandlers(){this.addEventListener("qd:data-cleared",t=>{t.detail.timestamp,this.dispatchEvent("qd:cache-clear",{})})}addEventListener(t,n){document.addEventListener(t,n);const s=this.listeners.get(t)||[];s.push(n),this.listeners.set(t,s)}dispatchEvent(t,n){const s=new CustomEvent(t,{detail:n,bubbles:!0,composed:!0});document.dispatchEvent(s)}cleanup(){for(const[t,n]of this.listeners)for(const s of n)document.removeEventListener(t,s);this.listeners.clear()}}class SessionService{createSession(t,n,s){const r=new Date,o=r.toISOString(),a={serviceId:t,name:n,release:s,loginTime:o,lastActivity:o,expiresAt:new Date(r.getTime()+x).toISOString(),instructorUnlocked:!1};return this.saveSession(a),this.emitEvent("qd:login",{serviceId:t,name:n,release:s,loginTime:o}),a}getSession(){try{const t=sessionStorage.getItem(S.SESSION);if(!t)return null;const n=JSON.parse(t);return n.serviceId&&n.release&&n.expiresAt?n:(a("Invalid session data, missing required fields"),null)}catch(t){return o("Failed to parse session data",t),null}}updateActivity(){const t=this.getSession();if(!t)return;const n=new Date;t.lastActivity=n.toISOString(),t.expiresAt=new Date(n.getTime()+x).toISOString(),this.saveSession(t)}isExpired(){const t=this.getSession();return!t||function(t,n=new Date){const s=new Date(t);return!!isNaN(s.getTime())||n>=s}(t.expiresAt)}clearSession(){const t=this.getSession();sessionStorage.removeItem(S.SESSION),sessionStorage.removeItem(S.CACHE),sessionStorage.removeItem(S.INSTRUCTOR),sessionStorage.removeItem(b),t&&(t.serviceId,this.emitEvent("qd:logout",{serviceId:t.serviceId,timestamp:(new Date).toISOString()}))}unlockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!0,t.unlockTime=(new Date).toISOString(),this.saveSession(t),this.emitEvent("qd:instructor-unlock",{timestamp:t.unlockTime}))}lockInstructor(){const t=this.getSession();t&&(t.instructorUnlocked=!1,delete t.unlockTime,this.saveSession(t),this.emitEvent("qd:instructor-lock",{timestamp:(new Date).toISOString()}))}isInstructorUnlocked(){const t=this.getSession();return!0===t?.instructorUnlocked}getCache(){try{const t=sessionStorage.getItem(S.CACHE);return t?JSON.parse(t):null}catch(t){return o("Failed to parse cache data",t),null}}saveCache(t){try{sessionStorage.setItem(S.CACHE,JSON.stringify(t))}catch(n){o("Failed to save cache",n)}}clearCache(){sessionStorage.removeItem(S.CACHE)}saveSession(t){try{sessionStorage.setItem(S.SESSION,JSON.stringify(t))}catch(n){o("Failed to save session",n)}}emitEvent(t,n){try{const s=new CustomEvent(t,{detail:n,bubbles:!0});document.dispatchEvent(s)}catch(s){o(`Failed to emit event ${t}`,s)}}}class SessionCoordinator{constructor(){this.sessionService=new SessionService}initialize(){const t=this.sessionService.getSession();if(t){if(t.serviceId,this.sessionService.isExpired())return a("Session expired, clearing"),void this.sessionService.clearSession();this.scheduleExpiryCheck(t),this.setupActivityTracking()}}scheduleExpiryCheck(t){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId);const n=(new Date).getTime(),s=new Date(t.expiresAt).getTime()-n;s<=0?this.sessionService.clearSession():this.expiryTimeoutId=window.setTimeout(()=>{this.sessionService.clearSession()},s)}setupActivityTracking(){const t=()=>{if(!this.sessionService.getSession())return;this.sessionService.updateActivity();const t=this.sessionService.getSession();t&&this.scheduleExpiryCheck(t)};let n;const s=()=>{void 0!==n&&window.clearTimeout(n),n=window.setTimeout(()=>{t()},5e3)};["click","keydown","scroll","mousemove"].forEach(t=>{document.addEventListener(t,s,{passive:!0})})}cleanup(){void 0!==this.expiryTimeoutId&&window.clearTimeout(this.expiryTimeoutId)}getSessionService(){return this.sessionService}}const Bt=fe`
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
`;function Ft(){return null!==y(S.SESSION)}function Vt(){return"true"===sessionStorage.getItem(S.INSTRUCTOR)}const Kt=".wh_top_menu_and_indexterms_link",Qt=".wh_publication_title .title",Jt="",Wt="qd-status-container",Yt="qd-title-selector",Gt="qd-instructor-hash",Zt="qd-db-name";function Xt(t,n){const s=document.querySelector(`#${t}`);if(!s)return n;const r=s.textContent?.trim()||"";return""===r?(a(`Config element #${t} found but empty, using default: "${n}"`),n):r}function en(){const t=function(t){const n=document.querySelector(`#${t}`);if(!n){const n=`FATAL: Required config element #${t} not found in DOM. Processing stopped.`;throw console.error(n),new Error(n)}const s=n.textContent?.trim()||"";if(""===s){const n=`FATAL: Required config element #${t} is empty. Processing stopped.`;throw console.error(n),new Error(n)}return s}(Zt);return{statusPanelContainer:Xt(Wt,Kt),titleSelector:Xt(Yt,Qt),instructorHash:Xt(Gt,Jt),dbName:t}}function tn(){const t=document.querySelector(`#${Zt}`);return t?.textContent?.trim()||""}function nn(){const t=document.querySelector(Xt(Yt,Qt));return t?.textContent?.trim()||""}async function sn(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("")}function rn(t){return`${S.PIN_ATTEMPTS}:${t}`}function on(t){const n=rn(t),s=sessionStorage.getItem(n);if(!s)return null;try{return JSON.parse(s)}catch{return null}}function an(t){const n=on(t);if(!n||!n.lockoutUntil)return{isLocked:!1,remainingMs:0};const s=new Date(n.lockoutUntil).getTime(),r=Date.now();return s>r?{isLocked:!0,remainingMs:s-r}:(dn(t),{isLocked:!1,remainingMs:0})}function dn(t){const s=on(t);s&&s.attempts>0&&(s.attempts,n(t));const r=rn(t);sessionStorage.removeItem(r)}function cn(t){const n=on(t);if(!n)return E;return an(t).isLocked?0:Math.max(0,E-n.attempts)}class AuthService{loginStudent(t){return this.runLogin(t,{checkLock:!0,surfaceMigration:!0,errorMessage:"Login failed. Please try again.",errorLabel:"Student login error:"})}retryAfterMigration(t){return this.runLogin(t,{checkLock:!1,surfaceMigration:!1,errorMessage:"Login failed after migration. Please try again.",errorLabel:"Post-migration login error:"})}async runLogin(t,s){const{serviceId:r,name:o,pin:d,release:c,dbName:l}=t;if(s.checkLock){const t=an(r);if(t.isLocked)return{kind:"lockout",lockoutMs:t.remainingMs}}try{const t=X(l);await t.init();const s=await t.getStudent(c,r);if(s){if(s.schema<2||!function(t){return Boolean(t.pinHash&&t.pinHash.length>0)}(s)){const n=function(t,n){return{...t,schema:2,pinHash:n,pinCreatedAt:(new Date).toISOString()}}(s,await sn(d));return await t.saveStudent(n),{kind:"pin-created",serviceId:r,name:o,release:c}}const l=await async function(t,n){return function(t,n){if(t.length!==n.length)return!1;let s=0;for(let r=0;r<t.length;r++)s|=t.charCodeAt(r)^n.charCodeAt(r);return 0===s}(await sn(t),n)}(d,s.pinHash||"");if(!l){const t=function(t){const s=(new Date).toISOString();let r=on(t);if(r||(r={serviceId:t,attempts:0,lockoutUntil:null,lastAttempt:s}),r.attempts+=1,r.lastAttempt=s,r.attempts>=E){const s=new Date(Date.now()+$);r.lockoutUntil=s.toISOString(),a(`PIN lockout triggered for ${n(t)} after ${r.attempts} failed attempts`)}else r.attempts,n(t);const o=rn(t);return sessionStorage.setItem(o,JSON.stringify(r)),r}(r);if(t.lockoutUntil){return{kind:"lockout",lockoutMs:new Date(t.lockoutUntil).getTime()-Date.now()}}return{kind:"bad-pin",remaining:cn(r)}}return dn(r),{kind:"pin-verified",serviceId:r,name:o,release:c}}const u=await sn(d),h={schema:2,docId:"",release:c,serviceId:r,name:o,attempted:0,correct:0,updated:(new Date).toISOString(),pages:{},pinHash:u,pinCreatedAt:(new Date).toISOString()};return await t.saveStudent(h),{kind:"pin-created",serviceId:r,name:o,release:c}}catch(u){return s.surfaceMigration&&u instanceof StorageFormatError?{kind:"needs-migration",error:u}:(console.error(s.errorLabel,u),{kind:"error",message:s.errorMessage})}}}var ln=Object.getOwnPropertyDescriptor;let un=class extends ct{render(){return Ze`
      <span class="info-icon" tabindex="0" role="button" aria-label="Build information">i</span>
      <div class="tooltip" role="tooltip">
        <span class="tooltip-line">BrowserTest, from Deep Blue C Ltd</span>
        <span class="tooltip-line">Built ${"5/Sep/2026"}</span>
      </div>
    `}};function hn(){const t=document.getElementById(Gt);return t?.textContent?.trim()||""}async function pn(t){const n=hn();if(!n)return!1;const s=await async function(t){const n=(new TextEncoder).encode(t),s=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join("").substring(0,12)}(t);return s===n}un.styles=fe`
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
  `,un=((t,n,s,r)=>{for(var o,a=r>1?void 0:r?ln(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=o(a)||a);return a})([ut("qd-build-info")],un);var gn=Object.defineProperty,mn=Object.getOwnPropertyDescriptor,fn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?mn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&gn(n,s,a),a};const bn="__qdModalCurrentRef__";function yn(){return globalThis[bn]??null}function vn(t){globalThis[bn]=t}let wn=class extends ct{constructor(){super(...arguments),this.open=!1,this.closable=!0,this.previouslyFocused=null,this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this.open&&this.closable&&(this.emitCloseEvent(),this.close())},this.handleBackdropClick=()=>{this.closable&&(this.emitCloseEvent(),this.close())},this.handleCloseClick=()=>{this.emitCloseEvent(),this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),yn()!==this||this.isInBody||vn(null)}updated(t){t.has("open")&&(this.open?this.handleOpen():this.handleClose())}moveToBody(){this.isInBody||(this.originalParent=this.parentNode,this.originalNextSibling=this.nextSibling,this.isInBody=!0,document.body.appendChild(this))}restorePosition(){this.isInBody&&this.originalParent&&(this.originalNextSibling?this.originalParent.insertBefore(this,this.originalNextSibling):this.originalParent.appendChild(this),this.originalParent=null,this.originalNextSibling=null,this.isInBody=!1)}render(){return Ze`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="content" role="dialog" aria-modal="true" @click=${this.stopPropagation}>
          <div class="header">
            <span class="header-title"><slot name="header"></slot></span>
            ${this.closable?Ze`<button
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
    `}show(){this.open=!0}close(){this.open=!1}handleOpen(){const t=yn();t&&t!==this&&t.close(),vn(this),this.previouslyFocused=document.activeElement,this.moveToBody(),requestAnimationFrame(()=>{this.focusFirstElement()})}handleClose(){yn()===this&&vn(null),this.restorePosition(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}focusFirstElement(){const t=this.shadowRoot?.querySelector(".content");if(!t)return;const n=this.shadowRoot?.querySelector("slot:not([name])");if(n){const t=n.assignedElements({flatten:!0});for(const n of t){const t=n.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t)return void t.focus();if(n instanceof HTMLElement&&n.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))return void n.focus()}}const s=this.shadowRoot?.querySelector(".close-button");s&&s.focus()}emitCloseEvent(){const t=new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0});this.dispatchEvent(t)}};wn.styles=fe`
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
  `,fn([gt({type:Boolean,reflect:!0})],wn.prototype,"open",2),fn([gt({type:Boolean})],wn.prototype,"closable",2),wn=fn([ut("qd-modal")],wn);var xn=Object.defineProperty,Sn=Object.getOwnPropertyDescriptor,En=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Sn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&xn(n,s,a),a};let $n=class extends ct{constructor(){super(...arguments),this.open=!1,this.title="Enter Password",this.error="",this.password="",this.handleModalClose=()=>{this.close()},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=t=>{t.preventDefault(),this.password.trim()&&this.dispatchEvent(new CustomEvent("qd:password-submit",{detail:{password:this.password},bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close()}}show(){this.open=!0,this.password="",this.error=""}close(){this.open=!1,this.password="",this.error="",this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}updated(t){t.has("open")&&this.open&&(this.password="",this.updateComplete.then(()=>{this.passwordInput?.focus()}))}render(){return Ze`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        ${this.open?Ze`
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

                ${this.error?Ze`<div class="error-message">${this.error}</div>`:""}

                <div class="button-row">
                  <button type="button" @click=${this.handleCancel}>Cancel</button>
                  <button type="submit">Login</button>
                </div>
              </form>
            `:et}
      </qd-modal>
    `}};$n.styles=fe`
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
  `,En([gt({type:Boolean,reflect:!0})],$n.prototype,"open",2),En([gt({type:String})],$n.prototype,"title",2),En([gt({type:String})],$n.prototype,"error",2),En([mt()],$n.prototype,"password",2),En([ft('input[type="password"]')],$n.prototype,"passwordInput",2),$n=En([ut("qd-password-modal")],$n);var qn=Object.defineProperty,Cn=Object.getOwnPropertyDescriptor,kn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Cn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&qn(n,s,a),a};let In=class extends ct{constructor(){super(...arguments),this.disabled=!1,this.showModal=!1,this.error="",this.open=()=>{this.showModal=!0,this.error=""},this.handleClose=()=>{this.showModal=!1,this.error=""},this.handleSubmit=t=>{this.login(t.detail.password)}}render(){return Ze`
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
    `}async login(t){if(hn())try{if(!(await pn(t)))return void(this.error="Incorrect password");const n=nn();(new SessionService).createSession("INSTRUCTOR","Instructor",n||""),sessionStorage.setItem(S.INSTRUCTOR,"true"),this.dispatchEvent(new CustomEvent("qd:login",{detail:{serviceId:"INSTRUCTOR",name:"Instructor",release:n||"",role:"instructor"},bubbles:!0,composed:!0})),this.showModal=!1,this.error=""}catch(n){this.error="Login failed. Please try again.",console.error("Instructor login error:",n)}else this.error="Instructor password not configured"}};In.styles=fe`
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
  `,kn([gt({type:Boolean})],In.prototype,"disabled",2),kn([mt()],In.prototype,"showModal",2),kn([mt()],In.prototype,"error",2),In=kn([ut("qd-instructor-login")],In);var An=Object.defineProperty,On=Object.getOwnPropertyDescriptor,Pn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?On(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&An(n,s,a),a};let Tn=class extends ct{constructor(){super(...arguments),this.untilMs=0,this.seconds=0,this.interval=null}disconnectedCallback(){super.disconnectedCallback(),this.clearTimer()}willUpdate(t){if(t.has("untilMs")){const t=this.untilMs-Date.now();this.seconds=t>0?Math.ceil(t/1e3):0}}updated(t){t.has("untilMs")&&this.startTimer()}render(){return this.seconds<=0?Ze``:Ze`<div class="lockout-message" role="alert" aria-live="polite" aria-atomic="true">
      Too many attempts. Try again in ${this.seconds}s
    </div>`}startTimer(){this.clearTimer(),this.seconds<=0||(this.interval=window.setInterval(()=>{this.seconds--,this.seconds<=0&&(this.clearTimer(),this.dispatchEvent(new CustomEvent("qd:lockout-expired",{bubbles:!0,composed:!0})))},1e3))}clearTimer(){this.interval&&(clearInterval(this.interval),this.interval=null)}};Tn.styles=fe`
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
  `,Pn([gt({type:Number})],Tn.prototype,"untilMs",2),Pn([mt()],Tn.prototype,"seconds",2),Tn=Pn([ut("qd-lockout-banner")],Tn);
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */
const _n=2;class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,n,s){this._$Ct=t,this._$AM=n,this._$Ci=s}_$AS(t,n){return this.update(t,n)}update(t,n){return this.render(...n)}}
/**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   */class e extends i{constructor(t){if(super(t),this.it=et,t.type!==_n)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===et||null==t)return this._t=void 0,this.it=t;if(t===Xe)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const n=[t];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}e.directiveName="unsafeHTML",e.resultType=1;const Ln=(t=>(...n)=>({_$litDirective$:t,values:n}))(e);var Nn=Object.defineProperty,Dn=Object.getOwnPropertyDescriptor,Mn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Dn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Nn(n,s,a),a};let Rn=class extends ct{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}render(){return Ze`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content">
          <div class="message">${Ln(this.message)}</div>

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
    `}};Rn.styles=fe`
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
  `,Mn([gt({type:Boolean,reflect:!0})],Rn.prototype,"open",2),Mn([gt({type:String})],Rn.prototype,"title",2),Mn([gt({type:String})],Rn.prototype,"message",2),Mn([gt({type:String})],Rn.prototype,"confirmText",2),Mn([gt({type:String})],Rn.prototype,"cancelText",2),Mn([gt({type:Boolean})],Rn.prototype,"destructive",2),Rn=Mn([ut("qd-confirm-dialog")],Rn);var zn=Object.defineProperty,Hn=Object.getOwnPropertyDescriptor,Un=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Hn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&zn(n,s,a),a};let jn=class extends ct{constructor(){super(...arguments),this.panelType="login",this.handleClick=()=>{this.dispatchEvent(new CustomEvent("qd:help-open",{detail:{panelType:this.panelType},bubbles:!0,composed:!0}))}}render(){return Ze`
      <button class="help-icon" @click=${this.handleClick} aria-label="Help" title="Help">?</button>
    `}};jn.styles=fe`
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
  `,Un([gt({type:String})],jn.prototype,"panelType",2),jn=Un([ut("qd-help-trigger")],jn);var Bn=Object.defineProperty,Fn=Object.getOwnPropertyDescriptor,Vn=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Fn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Bn(n,s,a),a};let Kn=class extends ct{constructor(){super(...arguments),this.portalElement=null,this.previouslyFocused=null,this.open=!1,this.title="Help",this.content="",this._isOpen=!1,this.handleKeyDown=t=>{"Escape"===t.key&&this._isOpen&&this.close()},this.handleBackdropClick=()=>{this.close()},this.handleCloseClick=()=>{this.close()},this.stopPropagation=t=>{t.stopPropagation()}}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this.handleKeyDown),this.ensureStyles()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleKeyDown),this.removePortal()}updated(t){t.has("open")&&(this.open&&!this._isOpen?this.handleOpen():!this.open&&this._isOpen&&this.handleClose())}ensureStyles(){Kn.styleElement||(Kn.styleElement=document.createElement("style"),Kn.styleElement.textContent="\n.qd-help-backdrop{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif}\n.qd-help-content{background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:450px;max-height:80vh;overflow:auto}\n.qd-help-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eee}\n.qd-help-title{font-weight:600;font-size:18px;color:#333;margin:0}\n.qd-help-close{background:none;border:none;font-size:24px;color:#666;cursor:pointer;padding:0;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}\n.qd-help-close:hover{background:#f0f0f0;color:#333}\n.qd-help-close:focus{outline:2px solid #0066cc;outline-offset:2px}\n.qd-help-body{padding:20px;line-height:1.6;color:#444}\n.qd-help-body h3{margin-top:0;margin-bottom:12px;color:#333;font-size:16px}\n.qd-help-body p{margin:0 0 12px 0}\n.qd-help-body p:last-child{margin-bottom:0}\n.qd-help-body strong{color:#333}",document.head.appendChild(Kn.styleElement))}createPortal(){this.removePortal(),this.portalElement=document.createElement("div"),this.portalElement.className="qd-help-backdrop",this.portalElement.addEventListener("click",this.handleBackdropClick);const t=document.createElement("div");t.className="qd-help-content",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-labelledby","qd-help-title"),t.addEventListener("click",this.stopPropagation);const n=document.createElement("div");n.className="qd-help-header";const s=document.createElement("h2");s.className="qd-help-title",s.id="qd-help-title",s.textContent=this.title;const r=document.createElement("button");r.className="qd-help-close",r.setAttribute("aria-label","Close"),r.innerHTML="×",r.addEventListener("click",this.handleCloseClick),n.appendChild(s),n.appendChild(r);const o=document.createElement("div");o.className="qd-help-body",o.innerHTML=this.content,t.appendChild(n),t.appendChild(o),this.portalElement.appendChild(t),document.body.appendChild(this.portalElement),requestAnimationFrame(()=>{r.focus()})}removePortal(){this.portalElement&&(this.portalElement.remove(),this.portalElement=null)}handleOpen(){this._isOpen=!0,this.previouslyFocused=document.activeElement,this.createPortal()}handleClose(){this._isOpen=!1,this.removePortal(),this.previouslyFocused instanceof HTMLElement&&this.previouslyFocused.focus()}close(){this.open=!1,this.dispatchEvent(new CustomEvent("qd:modal-close",{bubbles:!0,composed:!0}))}render(){return et}};Kn.styleElement=null,Vn([gt({type:Boolean,reflect:!0})],Kn.prototype,"open",2),Vn([gt({type:String})],Kn.prototype,"title",2),Vn([gt({type:String})],Kn.prototype,"content",2),Vn([mt()],Kn.prototype,"_isOpen",2),Kn=Vn([ut("qd-help-popup")],Kn);const Qn="students";async function Jn(t,n,s){const r=performance.now(),d={migrated:0,skipped:0,errors:[],durationMs:0},{releaseId:c,dryRun:l=!1}=s,u=V(c),h=await async function(t){return new Promise((n,s)=>{const r=indexedDB.open(t);r.onsuccess=()=>n(r.result),r.onerror=()=>{o(`Failed to open database: ${r.error?.message}`),s(new Error(`Failed to open database: ${r.error?.message}`))}})}(t);try{const t=await async function(t){return new Promise((n,s)=>{const r=t.transaction(Qn,"readonly").objectStore(Qn).openCursor(),o=[];r.onsuccess=()=>{const t=r.result;if(t){const n="string"==typeof t.key?t.key:JSON.stringify(t.key);o.push({key:n,value:t.value}),t.continue()}else n(o)},r.onerror=()=>{s(new Error(`Failed to read records: ${r.error?.message}`))}})}(h);for(const{key:s,value:r}of t)try{const t=Y(r);if("encrypt"===n){if(t){d.skipped++;continue}const n=J(r,u);l||await Wn(h,s,n),d.migrated++}else{if(!t){d.skipped++;continue}const n=W(r,u);l||await Wn(h,s,n),d.migrated++}}catch(p){const t=p instanceof Error?p.message:String(p);d.errors.push({key:s,error:t}),a(`Migration error for key ${s}: ${t}`)}}finally{h.close()}return d.durationMs=performance.now()-r,d.migrated,d.skipped,d.errors.length,d.durationMs.toFixed(2),d}async function Wn(t,n,s){return new Promise((r,o)=>{const a=t.transaction(Qn,"readwrite").objectStore(Qn).put(s,n);a.onsuccess=()=>r(),a.onerror=()=>{o(new Error(`Failed to save record: ${a.error?.message}`))}})}const Yn=fe`
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
`,Gn=fe`
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
`;var Zn=Object.getOwnPropertyDescriptor;let Xn=class extends ct{render(){return Ze`<div class="spinner" role="status" aria-label="Loading"></div>`}};Xn.styles=[Gn],Xn=((t,n,s,r)=>{for(var o,a=r>1?void 0:r?Zn(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=o(a)||a);return a})([ut("qd-spinner")],Xn);var es=Object.defineProperty,ts=Object.getOwnPropertyDescriptor,ns=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?ts(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&es(n,s,a),a};let ss=class extends ct{constructor(){super(...arguments),this.open=!1,this.expected="plain",this.found="plain",this.dbName="",this.releaseId="",this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.handleModalClose=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))},this.handleInput=t=>{const n=t.target;this.password=n.value,this.error&&(this.error="")},this.handleSubmit=async t=>{if(t.preventDefault(),!this.password.trim())return;await this.validatePassword(this.password)?await this.runMigration():this.error||(this.error="Incorrect instructor password")},this.handleContinue=()=>{this.dispatchEvent(new CustomEvent("qd:migration-complete",{detail:this.migrationResult,bubbles:!0,composed:!0}))},this.handleCancel=()=>{this.dispatchEvent(new CustomEvent("qd:migration-cancel",{bubbles:!0,composed:!0}))}}updated(t){t.has("open")&&this.open&&(this.dialogState="password",this.password="",this.error="",this.migrationResult=null,this.updateComplete.then(()=>{this.passwordInput?.focus()}))}async validatePassword(t){return hn()?pn(t):(this.error="Instructor password not configured",!1)}async runMigration(){this.dialogState="migrating",this.error="";try{const t="decrypt",n=await Jn(this.dbName,t,{releaseId:this.releaseId,dryRun:!1});if(n.errors.length>0)return this.dialogState="error",void(this.error=`Migration completed with ${n.errors.length} error(s). Some records may not have been migrated.`);this.migrationResult={migrated:n.migrated,skipped:n.skipped},this.dialogState="success"}catch(t){this.dialogState="error",this.error=`Migration failed: ${t instanceof Error?t.message:"Unknown error"}`}}render(){return Ze`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">Database Migration Required</span>

        ${this.open?this.renderContent():et}
      </qd-modal>
    `}renderContent(){switch(this.dialogState){case"password":return this.renderPasswordForm();case"migrating":return this.renderMigrating();case"error":return this.renderError();case"success":return this.renderSuccess()}}renderPasswordForm(){return Ze`
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

          ${this.error?Ze`<div class="error-message">${this.error}</div>`:et}

          <div class="button-row">
            <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary">Migrate Database</button>
          </div>
        </form>
      </div>
    `}renderMigrating(){return Ze`
      <div class="migration-content">
        <div class="migrating-state">
          <qd-spinner></qd-spinner>
          <p>Migrating database records...</p>
          <p class="format-info">Please wait, do not close this window.</p>
        </div>
      </div>
    `}renderError(){return Ze`
      <div class="migration-content">
        <div class="error-message">${this.error}</div>

        <div class="button-row">
          <button type="button" class="secondary" @click=${this.handleCancel}>Cancel</button>
          <button type="button" class="primary" @click=${()=>this.dialogState="password"}>
            Try Again
          </button>
        </div>
      </div>
    `}renderSuccess(){return Ze`
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
    `}};ss.styles=[Yn],ns([gt({type:Boolean,reflect:!0})],ss.prototype,"open",2),ns([gt({type:String})],ss.prototype,"expected",2),ns([gt({type:String})],ss.prototype,"found",2),ns([gt({type:String})],ss.prototype,"dbName",2),ns([gt({type:String})],ss.prototype,"releaseId",2),ns([mt()],ss.prototype,"dialogState",2),ns([mt()],ss.prototype,"password",2),ns([mt()],ss.prototype,"error",2),ns([mt()],ss.prototype,"migrationResult",2),ns([ft('input[type="password"]')],ss.prototype,"passwordInput",2),ss=ns([ut("qd-migration-dialog")],ss);const rs={login:{title:"Login Help",body:'<p>Enter <strong>Name</strong> and <strong>Service ID</strong> to log in.  Provide a new <strong>PIN</strong> if this is your first visit to this release of this document, otherwise use the PIN you previously created. Your instructor is able to reset PINs.  See the <b>Feedback</b> page for more support.</p><p> <strong>Instructors:</strong> click "Instructor" for instructor login page (password accompanies distribution).</p>'},status:{title:"Student View",body:'<p>Page color coding:<ul><li><strong style="color:#4caf50">Green</strong>=All correct </li><li><strong style="color:#ff9800">Amber</strong>=Some answered </li><li><strong style="color:#d32f2f">Red</strong>=None yet</li></ul></p><p>You can view your overall progress at attempted questions in the <b>Test Progress</b> panel.</p>'},instructor:{title:"Instructor Tools",body:"<p><ul><li><strong>Show current answers</strong>: Toggle for display of student answers for the current page.</li><li><strong>View All Scores</strong>: View table scores for all students.</li><li><strong>Reset PIN</strong>: Reset student PINs.</li><li><strong>Export CSV</strong>: CSV download of all scores/answers.</li><li><strong>Erase All Data</strong>: Clear all stored student data.</li></ul></p>"}};function os(t){return rs[t]}var is=Object.defineProperty,as=Object.getOwnPropertyDescriptor,ds=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?as(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&is(n,s,a),a};let cs=class extends ct{constructor(){super(...arguments),this.title="Sonar Quiz System",this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.authService=new AuthService,this.handleLoginEvent=()=>{this.updateVisibility()},this.handleLogoutEvent=()=>{this.name="",this.serviceId="",this.errorMessage="",this.isSubmitting=!1,this.pin="",this.lockoutUntil=0,this.showPinConfirmation=!1,this.helpOpen=!1,this.updateVisibility()},this.handleLockoutExpired=()=>{this.lockoutUntil=0},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1},this.handlePinConfirmationDismiss=()=>{this.showPinConfirmation=!1},this.handleMigrationComplete=()=>{if(this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData){const{serviceId:t,name:n,release:s}=this.pendingLoginData;this.pendingLoginData=null,this.retryLoginAfterMigration(t,n,s)}},this.handleMigrationCancel=()=>{this.showMigrationDialog=!1,this.migrationError=null,this.pendingLoginData=null,this.errorMessage="Data migration cancelled. Please contact your instructor for assistance.",this.isSubmitting=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:login",this.handleLoginEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:login",this.handleLoginEvent)}firstUpdated(){this.setAttribute("data-ready","")}updateVisibility(){this.toggleAttribute("data-show",!Ft())}isLockedOut(){return this.lockoutUntil>Date.now()}render(){return Ze`
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
            ?disabled=${this.isSubmitting||this.isLockedOut()}
            required
          />
          <button
            type="submit"
            class="login-btn"
            ?disabled=${this.isSubmitting||!this.isValid()||this.isLockedOut()}
          >
            Login
          </button>
          <qd-instructor-login ?disabled=${this.isSubmitting}></qd-instructor-login>
          ${this.errorMessage?Ze`<div class="error-message">${this.errorMessage}</div>`:""}
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
        .title=${os("login").title}
        .content=${os("login").body}
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
    `}handleNameInput(t){this.name=t.target.value,this.errorMessage=""}handleServiceIdInput(t){this.serviceId=t.target.value,this.errorMessage=""}handlePinInput(t){this.pin=t.target.value.replace(/\D/g,""),this.errorMessage=""}isValid(){return 0===function(t,n,s){const r=[];t&&""!==t.trim()||r.push("Name required"),n?/^[a-zA-Z0-9]{2,10}$/.test(n)||r.push("Service ID must be 2-10 alphanumeric characters"):r.push("Service ID required");s?/^\d{4}$/.test(s)||r.push("PIN must be exactly 4 digits"):r.push("PIN required");return r}(this.name,this.serviceId,this.pin).length}async handleStudentLogin(t){if(t.preventDefault(),!this.isValid())return void(this.errorMessage="Please enter name, service ID, and 4-digit PIN");this.isSubmitting=!0,this.errorMessage="";const n=nn();if(!n)return this.errorMessage="Release not found (missing publication title element)",void(this.isSubmitting=!1);const s=this.serviceId.trim(),r=this.name.trim(),o=tn(),a=this.pin,d=await this.authService.loginStudent({serviceId:s,name:r,pin:a,release:n,dbName:o});if("needs-migration"===d.kind)return this.migrationError=d.error,this.pendingLoginData={serviceId:s,name:r,release:n,pin:a,dbName:o},this.showMigrationDialog=!0,void(this.isSubmitting=!1);this.applyLoginResult(d)}applyLoginResult(t){switch(t.kind){case"pin-created":this.dispatchPinEvent("qd:pin-created",t.serviceId),this.showPinStoredConfirmation(),this.completeLogin(t.serviceId,t.name,t.release);break;case"pin-verified":this.dispatchPinEvent("qd:pin-verified",t.serviceId),this.completeLogin(t.serviceId,t.name,t.release);break;case"lockout":this.lockoutUntil=Date.now()+t.lockoutMs,this.errorMessage="",this.isSubmitting=!1;break;case"bad-pin":this.errorMessage=`Incorrect PIN. ${t.remaining} attempt${1!==t.remaining?"s":""} remaining`,this.pin="",this.isSubmitting=!1;break;case"error":this.errorMessage=t.message,this.isSubmitting=!1}}dispatchPinEvent(t,n){this.dispatchEvent(new CustomEvent(t,{detail:{serviceId:n,timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}))}showPinStoredConfirmation(){this.showPinConfirmation=!0}async retryLoginAfterMigration(t,n,s){this.isSubmitting=!0,this.errorMessage="";const r=await this.authService.retryAfterMigration({serviceId:t,name:n,pin:this.pin,release:s,dbName:tn()});this.applyLoginResult(r)}completeLogin(t,n,s){(new SessionService).createSession(t,n,s);const r={serviceId:t,name:n,release:s,role:"student"};this.dispatchEvent(new CustomEvent("qd:login",{detail:r,bubbles:!0,composed:!0})),this.pin="",this.isSubmitting=!1,this.updateVisibility()}};cs.styles=Bt,ds([gt({type:String})],cs.prototype,"title",2),ds([mt()],cs.prototype,"name",2),ds([mt()],cs.prototype,"serviceId",2),ds([mt()],cs.prototype,"errorMessage",2),ds([mt()],cs.prototype,"isSubmitting",2),ds([mt()],cs.prototype,"pin",2),ds([mt()],cs.prototype,"lockoutUntil",2),ds([mt()],cs.prototype,"showPinConfirmation",2),ds([mt()],cs.prototype,"helpOpen",2),ds([mt()],cs.prototype,"showMigrationDialog",2),ds([mt()],cs.prototype,"migrationError",2),ds([mt()],cs.prototype,"pendingLoginData",2),cs=ds([ut("qd-login")],cs);var ls=Object.defineProperty,us=Object.getOwnPropertyDescriptor,hs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?us(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&ls(n,s,a),a};let ps=class extends ct{constructor(){super(...arguments),this.total=0,this.correct=0,this.percentage=0,this.statusColor="red",this.name="",this.serviceId="",this.helpOpen=!1,this.handleStateChanged=()=>{this.loadCache()},this.handleLogin=()=>{this.updateVisibility(),this.loadCache()},this.handleCacheRebuild=()=>{this.loadCache()},this.handleLogoutEvent=()=>{this.updateVisibility()},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility(),this.loadCache(),document.addEventListener("qd:state-changed",this.handleStateChanged),document.addEventListener("qd:login",this.handleLogin),document.addEventListener("qd:logout",this.handleLogoutEvent),document.addEventListener("qd:cache-rebuild",this.handleCacheRebuild)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:state-changed",this.handleStateChanged),document.removeEventListener("qd:login",this.handleLogin),document.removeEventListener("qd:logout",this.handleLogoutEvent),document.removeEventListener("qd:cache-rebuild",this.handleCacheRebuild)}render(){const t=this.serviceId.slice(-4);return Ze`
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
        .title=${os("status").title}
        .content=${os("status").body}
        @qd:modal-close=${this.handleHelpClose}
      ></qd-help-popup>
    `}loadCache(){const t=y(S.SESSION);t?(this.name=t.name||"",this.serviceId=t.serviceId||""):(this.name="",this.serviceId="");const n=y(S.CACHE);if(!n)return this.total=0,this.correct=0,this.percentage=0,void(this.statusColor="red");var s,r;this.total=n.totals.total,this.correct=n.totals.correct,this.percentage=(s=n.totals.correct,0===(r=n.totals.total)?0:Math.round(s/r*100)),this.statusColor=this.calculateStatusColor(n.totals.total,n.totals.correct)}calculateStatusColor(t,n){return function(t,n){return 0===t||0===n?"red":n===t?"green":"amber"}(t,n)}updateVisibility(){this.toggleAttribute("data-show",Ft()&&!Vt())}handleLogout(){const t=y(S.SESSION);(new SessionService).clearSession();const n=new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0});this.dispatchEvent(n)}};ps.styles=fe`
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
  `,hs([mt()],ps.prototype,"total",2),hs([mt()],ps.prototype,"correct",2),hs([mt()],ps.prototype,"percentage",2),hs([mt()],ps.prototype,"statusColor",2),hs([mt()],ps.prototype,"name",2),hs([mt()],ps.prototype,"serviceId",2),hs([mt()],ps.prototype,"helpOpen",2),ps=hs([ut("qd-status")],ps);const gs=fe`
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
`;class RateLimiter{constructor(){this.failureCount=0,this.lockoutUntil=null}attempt(){return!(this.lockoutUntil&&Date.now()<this.lockoutUntil)&&(this.lockoutUntil&&Date.now()>=this.lockoutUntil&&(this.lockoutUntil=null),!0)}recordFailure(){this.failureCount++;const t=[2e3,4e3,8e3,16e3,3e4],n=t[Math.min(this.failureCount-1,t.length-1)]??3e4;this.lockoutUntil=Date.now()+n}reset(){this.failureCount=0,this.lockoutUntil=null}getRemainingSeconds(){if(!this.lockoutUntil)return 0;const t=Math.max(0,this.lockoutUntil-Date.now());return Math.ceil(t/1e3)}isLockedOut(){return null!==this.lockoutUntil&&Date.now()<this.lockoutUntil}}const ms="instructor.password.hash";var fs=Object.defineProperty,bs=Object.getOwnPropertyDescriptor,ys=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?bs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&fs(n,s,a),a};let vs=class extends ct{constructor(){super(...arguments),this.password="",this.error="",this.remainingSeconds=0,this.rateLimiter=new RateLimiter,this.handlePasswordInput=t=>{const n=t.target;this.password=n.value,this.error=""},this.handleSubmit=async t=>{t.preventDefault();if(!this.rateLimiter.attempt())return this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),this.startCountdown(),void(this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`);try{const t=function(){const t=document.getElementById(ms);if(!t){const t=`Instructor password hash not found. Expected element with id="${ms}". Check Oxygen XSL transform configuration.`;throw o(t),new Error(t)}const n=t.textContent?.trim();if(!n){const t="Instructor password hash element is empty. Check Oxygen parameter configuration.";throw o(t),new Error(t)}if(!/^[a-f0-9]{64}$/i.test(n)){const t=`Invalid password hash format. Expected 64 hex characters (SHA-256), got: ${n.substring(0,20)}...`;throw o(t),new Error(t)}return n.toLowerCase()}(),n=(new TextEncoder).encode(this.password),s=await crypto.subtle.digest("SHA-256",n),r=Array.from(new Uint8Array(s)).map(t=>t.toString(16).padStart(2,"0")).join(""),a=await async function(t,n){if(t.length!==n.length)return!1;if(0===t.length)return!0;const s=new TextEncoder,r=s.encode(t),o=s.encode(n);try{const t=await crypto.subtle.importKey("raw",r,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),n=await crypto.subtle.sign("HMAC",t,o),s=await crypto.subtle.importKey("raw",o,{name:"HMAC",hash:"SHA-256"},!1,["sign"]),a=await crypto.subtle.sign("HMAC",s,r);if(n.byteLength!==a.byteLength)return!1;const d=new Uint8Array(n),c=new Uint8Array(a);let l=0;for(let r=0;r<d.length;r++)l|=(d[r]??0)^(c[r]??0);return 0===l}catch(a){return console.error("Constant-time comparison failed:",a),!1}}(r,t);a?(this.rateLimiter.reset(),this.password="",this.error="",ie(this,"qd:instructor-unlock",{})):(this.error="Invalid password",this.password="")}catch{this.error="Authentication failed",this.password=""}}}disconnectedCallback(){super.disconnectedCallback(),this.countdownInterval&&window.clearInterval(this.countdownInterval)}startCountdown(){this.countdownInterval&&window.clearInterval(this.countdownInterval),this.countdownInterval=window.setInterval(()=>{this.remainingSeconds=this.rateLimiter.getRemainingSeconds(),0===this.remainingSeconds?(this.countdownInterval&&(window.clearInterval(this.countdownInterval),this.countdownInterval=void 0),this.error=""):this.error=`Too many attempts. Try again in ${this.remainingSeconds}s`},1e3)}render(){const t=this.remainingSeconds>0;return Ze`
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

          ${this.error?Ze`<div class="error" role="alert" aria-live="polite">${this.error}</div>`:""}

          <button type="submit" class="primary" ?disabled=${t||!this.password}>
            ${t?`Locked (${this.remainingSeconds}s)`:"Unlock"}
          </button>
        </form>
      </div>
    `}};vs.styles=gs,ys([mt()],vs.prototype,"password",2),ys([mt()],vs.prototype,"error",2),ys([mt()],vs.prototype,"remainingSeconds",2),vs=ys([ut("qd-instructor-unlock")],vs);var ws=Object.defineProperty,xs=Object.getOwnPropertyDescriptor,Ss=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?xs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&ws(n,s,a),a};let Es=class extends ct{constructor(){super(...arguments),this.open=!1,this.students=[],this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}render(){return Ze`
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
          ${0===this.students.length?Ze`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const t=[...this.students].sort((t,n)=>t.name.localeCompare(n.name));return Ze`
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
    `}renderStudentRow(t){const n=this.calculateSummary(t),s=Object.entries(t.pages);return Ze`
      <tr class="student-row">
        <td>${n.name}</td>
        <td>${n.serviceId}</td>
        <td class=${this.getScoreClass(n)}>
          ${n.correct}/${n.attempted} (${n.percentage}%)
        </td>
        <td>
          ${0===s.length?Ze`<span class="no-answers">—</span>`:Ze`
                <div class="answers-cell">
                  ${s.map(([t,n])=>Ze`
                      <div class="page-row">
                        <span class="page-name">${t}</span>
                        <div class="page-answers">
                          ${n.answers.map((t,n)=>Ze`
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
    `}getScoreClass(t){return 0===t.attempted?"":100===t.percentage?"score-perfect":0===t.percentage?"score-zero":""}calculateSummary(t){const n=t.attempted>0?Math.round(t.correct/t.attempted*100):0;return{serviceId:t.serviceId,name:t.name,attempted:t.attempted,correct:t.correct,percentage:n}}show(){this.open=!0}close(){this.open=!1}};Es.styles=fe`
    :host {
      display: contents;
    }
  `,Ss([gt({type:Boolean,reflect:!0})],Es.prototype,"open",2),Ss([gt({type:Array})],Es.prototype,"students",2),Es=Ss([ut("qd-scores-modal")],Es);var $s=Object.defineProperty,qs=Object.getOwnPropertyDescriptor,Cs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?qs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&$s(n,s,a),a};let ks=class extends ct{constructor(){super(...arguments),this.students=[],this.showModal=!1,this.handleClose=()=>{this.dispatchEvent(new CustomEvent("close"))}}render(){return Ze`
      <qd-scores-modal
        .open=${this.showModal}
        .students=${this.students}
        @close=${this.handleClose}
      ></qd-scores-modal>
    `}};ks.styles=gs,Cs([gt({type:Array})],ks.prototype,"students",2),Cs([gt({type:Boolean})],ks.prototype,"showModal",2),ks=Cs([ut("qd-instructor-scores")],ks);var Is=Object.defineProperty,As=Object.getOwnPropertyDescriptor,Os=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?As(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Is(n,s,a),a};let Ps=class extends ct{constructor(){super(...arguments),this.students=[],this.handleExport=()=>{const t=this.generateCSV(),n=new Blob([t],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(n),r=document.createElement("a");r.href=s;const o=(new Date).toISOString().replace(/[:.]/g,"-").slice(0,19);r.download=`quiz-data-${o}.csv`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(s)}}escapeCSVField(t){const n=String(t);return n.includes(",")||n.includes('"')||n.includes("\n")?`"${n.replace(/"/g,'""')}"`:n}generateCSV(){const t=[];t.push("Service ID,Name,Release,Page ID,Question Index,Answer,Success,Timestamp");for(const n of this.students)for(const[s,r]of Object.entries(n.pages)){(r.answers||[]).forEach((r,o)=>{r&&t.push([this.escapeCSVField(n.serviceId),this.escapeCSVField(n.name),this.escapeCSVField(n.release),this.escapeCSVField(s),this.escapeCSVField(o),this.escapeCSVField(r.answer),this.escapeCSVField(r.success),this.escapeCSVField(r.timestamp)].join(","))})}return t.join("\n")}render(){const t=this.students.length>0&&this.students.some(t=>t.attempted>0),n=t?`Export ${this.students.length} student${1===this.students.length?"":"s"} to CSV`:this.students.length>0?"No answers to export (students have not answered any questions)":"No data to export";return Ze`
      <button
        @click=${this.handleExport}
        ?disabled=${!t}
        class="primary compact"
        title=${n}
      >
        Export CSV
      </button>
    `}};Ps.styles=gs,Os([gt({type:Array})],Ps.prototype,"students",2),Ps=Os([ut("qd-instructor-export")],Ps);var Ts=Object.defineProperty,_s=Object.getOwnPropertyDescriptor,Ls=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?_s(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Ts(n,s,a),a};let Ns=class extends ct{constructor(){super(...arguments),this.showConfirmDialog=!1,this.confirmText="",this.error="",this.success="",this.modalContainer=null,this.handleClearRequest=()=>{this.showConfirmDialog=!0,this.confirmText="",this.error="",this.success=""},this.handleCancelClear=()=>{this.showConfirmDialog=!1,this.confirmText="",this.error=""},this.handleConfirmInput=t=>{const n=t.target;this.confirmText=n.value},this.handleConfirmClear=()=>{if("DELETE ALL DATA"===this.confirmText)try{w(),ie(this,"qd:data-cleared",{}),this.success="All quiz data cleared successfully",this.showConfirmDialog=!1,this.confirmText="",this.error="",setTimeout(()=>{this.success=""},3e3)}catch{this.error="Failed to clear data"}else this.error="Confirmation text does not match"}}disconnectedCallback(){super.disconnectedCallback(),this.removeModalFromBody()}updated(t){super.updated(t),t.has("showConfirmDialog")&&(this.showConfirmDialog?this.renderModalToBody():this.removeModalFromBody()),this.showConfirmDialog&&(t.has("confirmText")||t.has("error"))&&this.renderModalToBody()}renderModalToBody(){this.modalContainer||(this.modalContainer=document.createElement("div"),this.modalContainer.className="qd-manage-modal-container",document.body.appendChild(this.modalContainer)),at(this.renderConfirmDialog(),this.modalContainer)}removeModalFromBody(){this.modalContainer&&(this.modalContainer.remove(),this.modalContainer=null)}render(){return Ze`
      <button
        @click=${this.handleClearRequest}
        class="danger compact"
        title="Clear all student quiz data and progress"
      >
        Erase All Data
      </button>

      ${this.success?Ze`
            <div
              style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 12px 16px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10001;"
            >
              ${this.success}
            </div>
          `:""}
    `}renderConfirmDialog(){const t="DELETE ALL DATA"===this.confirmText;return Ze`
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

          ${this.error?Ze`<div style="color: #dc3545; font-size: 14px; margin: 8px 0;">${this.error}</div>`:""}

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
    `}};async function Ds(t){const n=tn();if(!n)return{ok:!1,error:`Database name not configured. Add <span id="${Zt}">dbName</span> to page.`};try{const r=X(n);await r.init();const o=(s=t,{...s,pinHash:"",pinResetAt:(new Date).toISOString()});await r.saveStudent(o);const a={eventId:crypto.randomUUID(),serviceId:t.serviceId,resetBy:"instructor",resetAt:(new Date).toISOString(),release:t.release};return await r.saveAuditEvent(a),{ok:!0,updated:o}}catch(r){return console.error("PIN reset error:",r),{ok:!1,error:"Failed to reset PIN. Please try again."}}var s}Ns.styles=gs,Ls([mt()],Ns.prototype,"showConfirmDialog",2),Ls([mt()],Ns.prototype,"confirmText",2),Ls([mt()],Ns.prototype,"error",2),Ls([mt()],Ns.prototype,"success",2),Ns=Ls([ut("qd-instructor-manage")],Ns);var Ms=Object.defineProperty,Rs=Object.getOwnPropertyDescriptor,zs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Rs(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Ms(n,s,a),a};let Hs=class extends ct{constructor(){super(...arguments),this.students=[],this.actionLabel="Select",this.searchText="",this.handleSearchInput=t=>{this.searchText=t.target.value}}get filteredStudents(){const t=this.searchText.toLowerCase().trim();return t?this.students.filter(n=>n.name.toLowerCase().includes(t)||n.serviceId.toLowerCase().includes(t)):this.students}emitSelect(t){this.dispatchEvent(new CustomEvent("select",{detail:t,bubbles:!0,composed:!0}))}render(){const t=this.filteredStudents;return Ze`
      <input
        type="text"
        class="search-input"
        placeholder="Search by name or ID..."
        .value=${this.searchText}
        @input=${this.handleSearchInput}
      />
      <div class="student-table-container">
        ${0===t.length?Ze`<div class="empty-message">
              ${this.searchText?"No matching students":"No students found"}
            </div>`:Ze`<table class="student-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Service ID</th>
                  <th>${this.actionLabel}</th>
                </tr>
              </thead>
              <tbody>
                ${t.map(t=>Ze`<tr>
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
    `}};Hs.styles=fe`
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
  `,zs([gt({type:Array})],Hs.prototype,"students",2),zs([gt({type:String})],Hs.prototype,"actionLabel",2),zs([mt()],Hs.prototype,"searchText",2),Hs=zs([ut("qd-student-table")],Hs);var Us=Object.defineProperty,js=Object.getOwnPropertyDescriptor,Bs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?js(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Us(n,s,a),a};let Fs=class extends ct{constructor(){super(...arguments),this.students=[],this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage="",this.handleModalClose=()=>{this.confirmDialogOpen||(this.close(),this.dispatchEvent(new CustomEvent("close")))},this.handleResetClick=t=>{this.confirmingStudent=t,this.confirmDialogOpen=!0},this.handleConfirmReset=()=>{this.confirmingStudent&&this.executeReset(this.confirmingStudent)},this.handleCancelReset=()=>{this.confirmDialogOpen=!1,this.confirmingStudent=null}}set showModal(t){this.open=t}get showModal(){return this.open}close(){this.open=!1,this.confirmingStudent=null,this.confirmDialogOpen=!1,this.errorMessage=""}show(){this.open=!0}async executeReset(t){const n=await Ds(t);if(this.confirmDialogOpen=!1,this.confirmingStudent=null,n.ok){if(n.updated){const s=this.students.findIndex(n=>n.serviceId===t.serviceId);s>=0&&(this.students[s]=n.updated,this.students=[...this.students])}this.errorMessage="",this.dispatchEvent(new CustomEvent("qd:pin-reset",{detail:{serviceId:t.serviceId,resetBy:"instructor",timestamp:(new Date).toISOString()},bubbles:!0,composed:!0}))}else this.errorMessage=n.error??"Failed to reset PIN. Please try again."}render(){const t=this.confirmingStudent,n=t?`Reset PIN for <strong>${t.name}</strong> (${t.serviceId})?<br><span style="font-size: 11px; color: #666;">They will need to create a new PIN on next login.</span>`:"";return Ze`
      <qd-modal
        .open=${this.open&&!this.confirmDialogOpen}
        @qd:modal-close=${this.handleModalClose}
      >
        <span slot="header">Reset Student PIN</span>

        ${this.open?Ze`
              <div class="pin-reset-content">
                <qd-student-table
                  .students=${this.students}
                  actionLabel="Reset"
                  @select=${t=>this.handleResetClick(t.detail)}
                ></qd-student-table>

                ${this.errorMessage?Ze`<div class="error-message">${this.errorMessage}</div>`:""}
              </div>
            `:et}
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
    `}};Fs.styles=fe`
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
  `,Bs([gt({type:Array})],Fs.prototype,"students",2),Bs([gt({type:Boolean,reflect:!0})],Fs.prototype,"open",2),Bs([mt()],Fs.prototype,"confirmingStudent",2),Bs([mt()],Fs.prototype,"confirmDialogOpen",2),Bs([mt()],Fs.prototype,"errorMessage",2),Bs([gt({type:Boolean})],Fs.prototype,"showModal",1),Fs=Bs([ut("qd-pin-reset-dialog")],Fs);var Vs=Object.defineProperty,Ks=Object.getOwnPropertyDescriptor,Qs=(t,n,s,r)=>{for(var o,a=r>1?void 0:r?Ks(n,s):n,d=t.length-1;d>=0;d--)(o=t[d])&&(a=(r?o(n,s,a):o(a))||a);return r&&a&&Vs(n,s,a),a};let Js=class extends ct{constructor(){super(...arguments),this.unlocked=!1,this.showScores=!1,this.students=[],this.showStudentAnswers=!1,this.showPinReset=!1,this.helpOpen=!1,this.handleLoginEvent=t=>{const n=t,s=n.detail?.role;this.updateVisibility(),"instructor"===s&&(this.unlock(),this.refreshStudents())},this.handleLogoutEvent=()=>{this.updateVisibility(),this.lock()},this.handleResetPins=async()=>{await this.refreshStudents(),this.showPinReset=!0},this.handleClosePinReset=()=>{this.showPinReset=!1},this.handlePinReset=()=>{this.dispatchEvent(new CustomEvent("qd:pin-reset",{bubbles:!0,composed:!0}))},this.handleUnlock=()=>{this.unlocked=!0,this.dispatchEvent(new CustomEvent("qd:instructor-unlock",{bubbles:!0,composed:!0}))},this.handleViewScores=async()=>{await this.refreshStudents(),this.showScores=!0},this.handleCloseScores=()=>{this.showScores=!1},this.handleDataCleared=()=>{this.dispatchEvent(new CustomEvent("qd:data-cleared",{bubbles:!0,composed:!0})),this.students=[]},this.handleLogout=()=>{const t=y(S.SESSION);(new SessionService).clearSession(),this.dispatchEvent(new CustomEvent("qd:logout",{detail:{serviceId:t?.serviceId||"unknown"},bubbles:!0,composed:!0}))},this.handleToggleStudentAnswers=async t=>{const n=t.target;this.showStudentAnswers=n.checked,this.showStudentAnswers&&0===this.students.length&&await this.refreshStudents();const s=this.showStudentAnswers?"qd:instructor-show-answers":"qd:instructor-hide-answers";this.dispatchEvent(new CustomEvent(s,{bubbles:!0,composed:!0})),sessionStorage.setItem(b,String(this.showStudentAnswers))},this.handleHelpOpen=()=>{this.helpOpen=!0},this.handleHelpClose=()=>{this.helpOpen=!1}}connectedCallback(){super.connectedCallback(),this.updateVisibility();const t=Vt();t&&(this.unlock(),this.refreshStudents());const n=sessionStorage.getItem(b);null!==n&&(this.showStudentAnswers="true"===n,this.showStudentAnswers&&t&&setTimeout(()=>{this.dispatchEvent(new CustomEvent("qd:instructor-show-answers",{bubbles:!0,composed:!0}))},100)),document.addEventListener("qd:login",this.handleLoginEvent),document.addEventListener("qd:logout",this.handleLogoutEvent)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("qd:login",this.handleLoginEvent),document.removeEventListener("qd:logout",this.handleLogoutEvent)}updateVisibility(){this.toggleAttribute("data-show",Vt())}setStudents(t){this.students=t}async refreshStudents(){const t=y(S.SESSION);if(t)try{const n=re();this.students=await n.getStudentsByRelease(t.release)}catch(n){console.error("Failed to load students:",n),this.students=[]}}unlock(){this.unlocked=!0}lock(){this.unlocked=!1,this.showScores=!1,this.showPinReset=!1}render(){return this.unlocked?Ze`
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
          .title=${os("instructor").title}
          .content=${os("instructor").body}
          @qd:modal-close=${this.handleHelpClose}
        ></qd-help-popup>
      </div>
    `:Ze`
        <qd-instructor-unlock @qd:instructor-unlock=${this.handleUnlock}></qd-instructor-unlock>
      `}};Js.styles=[gs,fe`
      :host {
        display: none; /* Hidden by default, shown when instructor logged in */
      }

      :host([data-show]) {
        display: block;
      }
    `],Qs([mt()],Js.prototype,"unlocked",2),Qs([mt()],Js.prototype,"showScores",2),Qs([mt()],Js.prototype,"students",2),Qs([mt()],Js.prototype,"showStudentAnswers",2),Qs([mt()],Js.prototype,"showPinReset",2),Qs([mt()],Js.prototype,"helpOpen",2),Js=Qs([ut("qd-instructor")],Js);const Ws={statusPanel:".wh_top_menu_and_indexterms_link"};function Ys(t={}){const n=t.statusPanelContainer||Ws.statusPanel;!function(t){const n=document.querySelector(t);if(!n)return null;const s=document.createElement("qd-login");n.appendChild(s)}(n),function(t){const n=document.querySelector(t);if(!n)return null;const s=document.createElement("qd-status");n.appendChild(s)}(n),function(t){const n=document.querySelector(t);if(!n)return null;const s=document.createElement("qd-instructor");n.appendChild(s)}(n)}const Gs={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},Zs={unstarted:"red",incomplete:"amber",complete:"green"};function Xs(t){Object.values(Gs).forEach(n=>{t.classList.remove(n)})}function er(t){const n=function(t,n){if(!t||!n?.pages)return"unstarted";const s=n.pages[t];return s?.state??"unstarted"}(t.getAttribute("data-page-id"),y(S.CACHE));!function(t,n){Xs(t);const s=Gs[Zs[n]];t.classList.add(s)}(t,n)}function tr(){const t=document.querySelectorAll(".quizPageBtn"),n=y(S.CACHE),s="true"===sessionStorage.getItem(S.INSTRUCTOR);if(!n||s)return t.forEach(t=>{Xs(t)}),void t.length;t.forEach(t=>{er(t)}),t.length}function nr(t){const n=t,{pageId:s}=n.detail,r=document.querySelector(`[data-page-id="${s}"]`);r&&r.classList.contains("quizPageBtn")&&er(r)}function sr(){tr()}function rr(){const t=document.querySelectorAll(".quizPageBtn");t.forEach(t=>{Xs(t)}),t.length}const or={initialized:!1};async function ir(t={}){if(or.initialized)return void a("Bootstrap already initialized, skipping");if(function(){if(document.getElementById("qd-global-styles"))return;const t=document.createElement("style");t.id="qd-global-styles",t.textContent="\n    /* Sonar Quiz System - Global Styles */\n    .qd-hidden {\n      display: none !important;\n    }\n\n    /* Quiz table interactive mode styles */\n    .qd-quiz-interactive .qd-quiz-input {\n      width: 100%;\n      padding: 0.5rem;\n      font-size: inherit;\n      border: 1px solid #ccc;\n      border-radius: 4px;\n    }\n\n    /* Ensure select elements inherit font properly */\n    .qd-quiz-interactive select.qd-quiz-input {\n      font-family: inherit;\n      font-size: inherit;\n    }\n\n    /* Validation styling for answer cells */\n    .qd-quiz-interactive .qd-answer-correct {\n      background-color: #d4edda !important;\n      border-color: #28a745 !important;\n    }\n\n    .qd-quiz-interactive .qd-answer-incorrect {\n      background-color: #f8d7da !important;\n      border-color: #dc3545 !important;\n    }\n\n    /* Home page badge styles (R/A/G indicators) */\n    .qd-badge-red {\n      border-left: 4px solid #d32f2f !important;\n      background-color: #ffebee !important;\n    }\n\n    .qd-badge-amber {\n      border-left: 4px solid #ff9800 !important;\n      background-color: #fff3e0 !important;\n    }\n\n    .qd-badge-green {\n      border-left: 4px solid #4caf50 !important;\n      background-color: #e8f5e9 !important;\n    }\n\n    /* Instructor-mode student answers/entries are now rendered by the\n       Shadow-DOM <qd-student-answers> / <qd-student-entries> components, which\n       own their styles. No global rules are needed here. */\n\n    /* Modal error message styles (needed because qd-modal moves to body) */\n    .error-message {\n      color: #d32f2f;\n      font-size: 12px;\n      padding: 8px;\n      background: #ffebee;\n      border-radius: 4px;\n      border-left: 3px solid #d32f2f;\n    }\n  ",document.head.appendChild(t)}(),!t.dbName){const t="FATAL: dbName not provided in bootstrap config. Processing stopped.";throw console.error(t),new Error(t)}const n=re(t.dbName);await n.init();const s=new EventCoordinator;s.initialize(),or.eventCoordinator=s;const r=new SessionCoordinator;r.initialize(),or.sessionCoordinator=r,Ys({statusPanelContainer:t.statusPanelContainer,dbName:t.dbName}),!1!==t.autoEnhanceQuizTables&&ar("table.qd-quiz","quiz",t=>$t(t,{interactive:!1})),!1!==t.autoEnhanceAnalysisTables&&ar("table.qd-analysis","analysis",t=>zt(t,{interactive:!1})),!1!==t.autoEnhanceHomeBadges&&function(){const t=document.querySelectorAll(".quizPageBtn");if(0===t.length)return;t.length;try{document.querySelectorAll(".quizPageBtn").forEach(t=>{const n=function(t){const n=t.getAttribute("href");return n&&n.substring(n.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}(t);n?(t.setAttribute("data-page-id",n),t.textContent?.trim()):t.getAttribute("href")}),tr(),document.addEventListener("qd:state-changed",nr),document.addEventListener("qd:cache-rebuild",sr),document.addEventListener("qd:logout",rr)}catch(n){a(`Failed to enhance home badges: ${n.message}`)}}(),await async function(){if("true"===sessionStorage.getItem(S.INSTRUCTOR))return void dr();const t=y(S.SESSION);if(!t)return;t.serviceId;const n=re();let s=y(S.CACHE);if(!s)try{const r=await n.loadStudentRecord(t);s=n.buildCache(r),v(S.CACHE,s),s.totals.total}catch{a("Failed to rebuild cache from IndexedDB, using empty cache"),s={totals:{total:0,answered:0,correct:0},pages:{}},v(S.CACHE,s)}const r=Ut();if(!r)return;const o=document.querySelectorAll("table.qd-quiz");o.length>0&&(o.length,o.forEach(t=>{$t(t,{interactive:!0,pageId:r})}));const d=document.querySelectorAll("table.qd-analysis");d.length>0&&(d.length,d.forEach(t=>{zt(t,{interactive:!0,pageId:r})}))}(),document.addEventListener("qd:login",t=>{const n=t.detail;"instructor"===n?.role&&dr()}),or.initialized=!0}function ar(t,n,s){const r=document.querySelectorAll(t);if(0===r.length)return;r.length;for(const d of Array.from(r))try{s(d)}catch(o){a(`Failed to enhance ${n} table: ${o.message}`)}r.length}function dr(){const t=Ut(),n=document.querySelectorAll("table.qd-quiz");0!==n.length&&(n.forEach(n=>{const s=qt(n);s&&(s.pageId=t,Ht(n,s,{addInstructorClass:!0}))}),n.length)}if("undefined"!=typeof window){const t=()=>{const t=en();ir({dbName:t.dbName,statusPanelContainer:t.statusPanelContainer,autoEnhanceQuizTables:!0,autoEnhanceAnalysisTables:!0,autoEnhanceHomeBadges:!0}).catch(t=>{console.error("[FATAL] Bootstrap failed:",t)})};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{t()}):t()}return t.BUILD_DATE="5/Sep/2026",t.DEFAULT_CONTAINERS=Ws,t.Debouncer=Debouncer,t.OBFUSCATION_PREFIX=F,t.SCHEMA_VERSION=2,t.SESSION_TIMEOUT_MS=x,t.STORAGE_KEYS=S,t.VERSION="0.1.0-phase3.1",t.bootstrap=ir,t.calculateCompletionState=ee,t.cleanup=function(){or.initialized?(or.eventCoordinator?.cleanup(),or.sessionCoordinator?.cleanup(),or.initialized=!1,or.eventCoordinator=void 0,or.sessionCoordinator=void 0):a("Bootstrap not initialized, nothing to cleanup")},t.clearQuizData=w,t.decode=W,t.deriveKey=V,t.encode=J,t.enhanceAnalysisTable=zt,t.enhanceQuizTable=$t,t.error=o,t.generateCellKey=It,t.generateTableId=kt,t.getAnalysisTableMetadata=function(t){return Rt.get(t)},t.getJSON=y,t.getQuizTableMetadata=qt,t.info=r,t.injectComponents=Ys,t.isAnalysisTableEnhanced=function(t){return Rt.has(t)},t.isCellEditable=At,t.isInitialized=function(){return or.initialized},t.isObfuscated=Y,t.isQuizTableEnhanced=function(t){return Et.has(t)},t.migrateObfuscation=Jn,t.parseAnalysisTable=Ot,t.parseQuizTable=d,t.setJSON=v,t.validateAnswer=c,t.warn=a,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),t}({});
//# sourceMappingURL=sonar-quiz.iife.js.map
