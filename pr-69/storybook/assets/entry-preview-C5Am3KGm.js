import{B as _}from"./lit-element-CSmQN0ht.js";import{d as a}from"./index-DrFu-skq.js";/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const l=(t,r)=>r===void 0?t?._$litType$!==void 0:t?._$litType$===r,{simulatePageLoad:s,simulateDOMContentLoaded:u}=__STORYBOOK_MODULE_PREVIEW_API__,{global:y}=__STORYBOOK_MODULE_GLOBAL__;var O=Object.defineProperty,T=(t,r)=>{for(var n in r)O(t,n,{get:r[n],enumerable:!0})},h={};T(h,{parameters:()=>c,render:()=>m,renderToCanvas:()=>M});var{Node:L}=y,m=(t,r)=>{let{id:n,component:i}=r;if(!i)throw new Error(`Unable to render story ${n} as the component annotation is missing from the default export`);let d=document.createElement(i);return Object.entries(t).forEach(([p,e])=>{d[p]=e}),d};function M({storyFn:t,kind:r,name:n,showMain:i,showError:d,forceRemount:p},e){let o=t();if(i(),l(o)){(p||!e.querySelector('[id="root-inner"]'))&&(e.innerHTML='<div id="root-inner"></div>');let f=e.querySelector('[id="root-inner"]');_(o,f),s(e)}else if(typeof o=="string")e.innerHTML=o,s(e);else if(o instanceof L){if(e.firstChild===o&&!p)return;e.innerHTML="",e.appendChild(o),u()}else d({title:`Expecting an HTML snippet or DOM node from the story: "${n}" of "${r}".`,description:a`
        Did you forget to return the HTML snippet from the story?
        Use "() => <your snippet or node>" or when defining the story.
      `})}var c={renderer:"web-components"};export{c as parameters,m as render,M as renderToCanvas};
