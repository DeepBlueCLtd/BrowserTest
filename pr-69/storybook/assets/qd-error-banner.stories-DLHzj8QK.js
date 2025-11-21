import{i as y,a as v,x as e}from"./lit-element-CSmQN0ht.js";import{n as u,t as f}from"./property-Cqq8i_uy.js";var h=Object.defineProperty,$=Object.getOwnPropertyDescriptor,d=(s,c,b,l)=>{for(var r=l>1?void 0:l?$(c,b):c,p=s.length-1,g;p>=0;p--)(g=s[p])&&(r=(l?g(c,b,r):g(r))||r);return l&&r&&h(c,b,r),r};let i=class extends v{constructor(){super(...arguments),this.message="",this.severity="error",this.dismissable=!0,this.autoDismissMs=0,this.handleClose=()=>{this.dismiss()}}connectedCallback(){super.connectedCallback(),this.autoDismissMs>0&&this.scheduleDismiss()}disconnectedCallback(){super.disconnectedCallback(),this.dismissTimeout&&window.clearTimeout(this.dismissTimeout)}scheduleDismiss(){this.dismissTimeout&&window.clearTimeout(this.dismissTimeout),this.dismissTimeout=window.setTimeout(()=>{this.dismiss()},this.autoDismissMs)}dismiss(){this.dispatchEvent(new CustomEvent("dismiss",{bubbles:!0,composed:!0})),this.hidden=!0}render(){return this.message?e`
      <div class="banner ${this.severity}" role="alert" aria-live="polite">
        <div class="message">${this.message}</div>
        ${this.dismissable?e`
              <button class="close-button" @click=${this.handleClose} aria-label="Dismiss">
                ✕
              </button>
            `:""}
      </div>
    `:e``}};i.styles=y`
    :host {
      display: block;
      margin: 16px 0;
    }

    .banner {
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    .banner.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .banner.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .banner.info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    .message {
      flex: 1;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0 0 0 16px;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .close-button:hover {
      opacity: 1;
    }

    :host([hidden]) {
      display: none;
    }
  `;d([u({type:String})],i.prototype,"message",2);d([u({type:String})],i.prototype,"severity",2);d([u({type:Boolean})],i.prototype,"dismissable",2);d([u({type:Number})],i.prototype,"autoDismissMs",2);i=d([f("qd-error-banner")],i);const x={title:"Components/QdErrorBanner",component:"qd-error-banner",tags:["autodocs"],argTypes:{message:{control:"text"},severity:{control:"select",options:["error","warning","info"]},dismissable:{control:"boolean"},autoDismissMs:{control:"number"}}},a={args:{message:"Invalid quiz table format: Expected 3 columns, found 2",severity:"error",dismissable:!0,autoDismissMs:0},render:s=>e`
    <qd-error-banner
      message=${s.message}
      severity=${s.severity}
      ?dismissable=${s.dismissable}
      autoDismissMs=${s.autoDismissMs}
    ></qd-error-banner>
  `},n={args:{message:"Question 5 has no correct answer specified",severity:"warning",dismissable:!0,autoDismissMs:0},render:s=>e`
    <qd-error-banner
      message=${s.message}
      severity=${s.severity}
      ?dismissable=${s.dismissable}
      autoDismissMs=${s.autoDismissMs}
    ></qd-error-banner>
  `},o={args:{message:"Quiz data saved successfully",severity:"info",dismissable:!0,autoDismissMs:0},render:s=>e`
    <qd-error-banner
      message=${s.message}
      severity=${s.severity}
      ?dismissable=${s.dismissable}
      autoDismissMs=${s.autoDismissMs}
    ></qd-error-banner>
  `},t={args:{message:"This message will disappear in 3 seconds",severity:"info",dismissable:!0,autoDismissMs:3e3},render:s=>e`
    <div>
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
        ℹ️ This banner will auto-dismiss after 3 seconds
      </p>
      <qd-error-banner
        message=${s.message}
        severity=${s.severity}
        ?dismissable=${s.dismissable}
        autoDismissMs=${s.autoDismissMs}
      ></qd-error-banner>
    </div>
  `},m={args:{message:"Critical error: Cannot proceed without fixing this issue",severity:"error",dismissable:!1,autoDismissMs:0},render:s=>e`
    <qd-error-banner
      message=${s.message}
      severity=${s.severity}
      ?dismissable=${s.dismissable}
      autoDismissMs=${s.autoDismissMs}
    ></qd-error-banner>
  `};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Invalid quiz table format: Expected 3 columns, found 2',
    severity: 'error',
    dismissable: true,
    autoDismissMs: 0
  },
  render: args => html\`
    <qd-error-banner
      message=\${args.message}
      severity=\${args.severity}
      ?dismissable=\${args.dismissable}
      autoDismissMs=\${args.autoDismissMs}
    ></qd-error-banner>
  \`
}`,...a.parameters?.docs?.source},description:{story:"Error severity banner for validation errors and critical issues",...a.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Question 5 has no correct answer specified',
    severity: 'warning',
    dismissable: true,
    autoDismissMs: 0
  },
  render: args => html\`
    <qd-error-banner
      message=\${args.message}
      severity=\${args.severity}
      ?dismissable=\${args.dismissable}
      autoDismissMs=\${args.autoDismissMs}
    ></qd-error-banner>
  \`
}`,...n.parameters?.docs?.source},description:{story:"Warning severity banner for non-critical issues",...n.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Quiz data saved successfully',
    severity: 'info',
    dismissable: true,
    autoDismissMs: 0
  },
  render: args => html\`
    <qd-error-banner
      message=\${args.message}
      severity=\${args.severity}
      ?dismissable=\${args.dismissable}
      autoDismissMs=\${args.autoDismissMs}
    ></qd-error-banner>
  \`
}`,...o.parameters?.docs?.source},description:{story:"Info severity banner for helpful information",...o.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'This message will disappear in 3 seconds',
    severity: 'info',
    dismissable: true,
    autoDismissMs: 3000
  },
  render: args => html\`
    <div>
      <p style="color: #666; font-size: 13px; margin-bottom: 8px;">
        ℹ️ This banner will auto-dismiss after 3 seconds
      </p>
      <qd-error-banner
        message=\${args.message}
        severity=\${args.severity}
        ?dismissable=\${args.dismissable}
        autoDismissMs=\${args.autoDismissMs}
      ></qd-error-banner>
    </div>
  \`
}`,...t.parameters?.docs?.source},description:{story:"Auto-dismissing banner (dismisses after 3 seconds)",...t.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Critical error: Cannot proceed without fixing this issue',
    severity: 'error',
    dismissable: false,
    autoDismissMs: 0
  },
  render: args => html\`
    <qd-error-banner
      message=\${args.message}
      severity=\${args.severity}
      ?dismissable=\${args.dismissable}
      autoDismissMs=\${args.autoDismissMs}
    ></qd-error-banner>
  \`
}`,...m.parameters?.docs?.source},description:{story:"Non-dismissable banner (no close button)",...m.parameters?.docs?.description}}};const q=["Error","Warning","Info","AutoDismiss","NonDismissable"];export{t as AutoDismiss,a as Error,o as Info,m as NonDismissable,n as Warning,q as __namedExportsOrder,x as default};
