import{E as l,T as f,i as m,a as b,x as h}from"./lit-element-DR9D0stx.js";import{n as a,t as w}from"./property-BRFVFa-w.js";import{r as y}from"./state-7B7Yt9om.js";import"./qd-modal-Co8ngVCc.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const $={CHILD:2},v=s=>(...t)=>({_$litDirective$:s,values:t});class g{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,c){this._$Ct=t,this._$AM=e,this._$Ci=c}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class u extends g{constructor(t){if(super(t),this.it=l,t.type!==$.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===l||t==null)return this._t=void 0,this.it=t;if(t===f)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const e=[t];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}}u.directiveName="unsafeHTML",u.resultType=1;const x=v(u);var C=Object.defineProperty,_=Object.getOwnPropertyDescriptor,i=(s,t,e,c)=>{for(var n=c>1?void 0:c?_(t,e):t,d=s.length-1,p;d>=0;d--)(p=s[d])&&(n=(c?p(t,e,n):p(n))||n);return c&&n&&C(t,e,n),n};const o={content:"padding: 8px 0;",message:"font-size: 14px; color: #333; line-height: 1.5; margin-bottom: 16px;",label:"display: block; font-size: 13px; color: #333; margin: 0 0 4px;",input:"width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin-bottom: 16px;",row:"display: flex; gap: 8px; justify-content: flex-end;",button:"padding: 8px 16px; border: none; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer;",cancel:"background: #e0e0e0; color: #333;",confirm:"background: #0066cc; color: white;",destructive:"background: #d32f2f; color: white;",disabled:"background: #ccc; color: white; cursor: not-allowed;"};let r=class extends b{constructor(){super(...arguments),this.open=!1,this.title="Confirm",this.message="",this.confirmText="Confirm",this.cancelText="Cancel",this.destructive=!1,this.requirePassword=!1,this.password="",this.handleModalClose=()=>{this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))},this.handleConfirm=()=>{if(this.requirePassword&&!this.password)return;const s=this.password;this.password="",this.close(),this.dispatchEvent(new CustomEvent("qd:confirm",{detail:this.requirePassword?{password:s}:void 0,bubbles:!0,composed:!0}))},this.handlePasswordInput=s=>{this.password=s.target.value},this.handleCancel=()=>{this.password="",this.close(),this.dispatchEvent(new CustomEvent("qd:cancel",{bubbles:!0,composed:!0}))}}show(){this.open=!0}close(){this.open=!1}get confirmBlocked(){return this.requirePassword&&!this.password}render(){return h`
      <qd-modal .open=${this.open} @qd:modal-close=${this.handleModalClose}>
        <span slot="header">${this.title}</span>

        <div class="confirm-content" style=${o.content}>
          <div class="message" style=${o.message}>${x(this.message)}</div>

          ${this.requirePassword?h`<label
                  class="password-label"
                  for="qd-confirm-password"
                  style=${o.label}
                  >Instructor password</label
                >
                <input
                  id="qd-confirm-password"
                  class="password-input"
                  type="password"
                  autocomplete="current-password"
                  .value=${this.password}
                  @input=${this.handlePasswordInput}
                  @keydown=${s=>s.key==="Enter"&&this.handleConfirm()}
                  style=${o.input}
                />`:l}

          <div class="button-row" style=${o.row}>
            ${this.cancelText?h`<button
                  type="button"
                  class="cancel-btn"
                  style=${o.button+o.cancel}
                  @click=${this.handleCancel}
                >
                  ${this.cancelText}
                </button>`:l}
            <button
              type="button"
              class="confirm-btn ${this.destructive?"destructive":""}"
              style=${o.button+(this.confirmBlocked?o.disabled:this.destructive?o.destructive:o.confirm)}
              ?disabled=${this.confirmBlocked}
              @click=${this.handleConfirm}
            >
              ${this.confirmText}
            </button>
          </div>
        </div>
      </qd-modal>
    `}};r.styles=m`
    :host {
      display: contents;
    }
  `;i([a({type:Boolean,reflect:!0})],r.prototype,"open",2);i([a({type:String})],r.prototype,"title",2);i([a({type:String})],r.prototype,"message",2);i([a({type:String})],r.prototype,"confirmText",2);i([a({type:String})],r.prototype,"cancelText",2);i([a({type:Boolean})],r.prototype,"destructive",2);i([a({type:Boolean})],r.prototype,"requirePassword",2);i([y()],r.prototype,"password",2);r=i([w("qd-confirm-dialog")],r);
