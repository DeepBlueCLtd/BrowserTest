import{i as a,a as c,x as h}from"./lit-element-DR9D0stx.js";import{n as u,t as d}from"./property-BRFVFa-w.js";var f=Object.defineProperty,b=Object.getOwnPropertyDescriptor,p=(s,t,r,n)=>{for(var e=n>1?void 0:n?b(t,r):t,o=s.length-1,l;o>=0;o--)(l=s[o])&&(e=(n?l(t,r,e):l(e))||e);return n&&e&&f(t,r,e),e};let i=class extends c{constructor(){super(...arguments),this.panelType="login",this.handleClick=()=>{this.dispatchEvent(new CustomEvent("qd:help-open",{detail:{panelType:this.panelType},bubbles:!0,composed:!0}))}}render(){return h`
      <button class="help-icon" @click=${this.handleClick} aria-label="Help" title="Help">?</button>
    `}};i.styles=a`
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
  `;p([u({type:String})],i.prototype,"panelType",2);i=p([d("qd-help-trigger")],i);
