import{x as o}from"./lit-element-CSmQN0ht.js";import"./qd-login-3WD8BnTY.js";import"./property-Cqq8i_uy.js";import"./state-BjYqokDn.js";import"./storage-helpers-B4dxqHb-.js";import"./session-B4sBU_x4.js";const v={title:"Components/Login",component:"qd-login",tags:["autodocs"],parameters:{docs:{description:{component:`
Compact authentication component for students and instructors.

**Features:**
- Horizontal single-row layout (responsive)
- Student login: Name + Service ID (2-10 alphanumeric)
- Instructor button opens password modal
- Release version read from document title (.wh_publication_title .title)
- SHA-256 password hashing for instructor auth
- Emits \`qd:login\` event with role: 'student' | 'instructor'

**Event Detail:**
\`\`\`typescript
{
  serviceId: string,
  name: string,
  release: string,  // from document title
  role: 'student' | 'instructor'
}
\`\`\`

**Required Setup:**
\`\`\`html
<div class="wh_publication_title">
  <span class="title">TRV Connectors Autumn 2025</span>
</div>
\`\`\`

**Instructor Setup:**
\`\`\`html
<!-- SHA-256 hash of password -->
<div id="instructor.password.hash" style="display: none;">
  hash_here
</div>
\`\`\`
        `}}}},l={render:()=>{if(!document.querySelector(".wh_publication_title")){const t=document.createElement("div");t.className="wh_publication_title";const e=document.createElement("span");e.className="title",e.textContent="TRV Connectors Autumn 2025",t.appendChild(e),document.body.insertBefore(t,document.body.firstChild)}return setTimeout(()=>{const t=document.querySelector("qd-login");t&&t.addEventListener("qd:login",e=>{console.log("Login event:",e.detail);const n=e.detail;alert(`Login successful!\\n\\nRole: ${n.role}\\nService ID: ${n.serviceId}\\nName: ${n.name}\\nRelease: ${n.release}`)})},100),o`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Try Student Login:</p>
          <ul style="margin: 0 0 15px 0; padding-left: 20px;">
            <li><strong>Name:</strong> John Smith</li>
            <li><strong>Service ID:</strong> RN2344 (2-10 alphanumeric)</li>
          </ul>

          <p style="margin: 0 0 10px 0; font-weight: 500;">Or Click "Instructor":</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Opens password modal</li>
            <li>For demo: Password hash not configured (will show error)</li>
          </ul>

          <p style="margin: 15px 0 0 0; color: #666;">
            Check browser console for <code>qd:login</code> event details.
          </p>
        </div>
      </div>
    `}},s={render:()=>{if(!document.querySelector(".wh_publication_title")){const t=document.createElement("div");t.className="wh_publication_title";const e=document.createElement("span");e.className="title",e.textContent="TRV Connectors Autumn 2025",t.appendChild(e),document.body.insertBefore(t,document.body.firstChild)}return setTimeout(()=>{document.querySelector("qd-login")?.addEventListener("qd:login",e=>{console.log("Login event:",e.detail)})},100),o`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login title="Training Quiz System"></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">✓ Title customized via <code>title</code> property</p>
        </div>
      </div>
    `}},r={render:()=>{if(!document.querySelector(".wh_publication_title")){const e=document.createElement("div");e.className="wh_publication_title";const n=document.createElement("span");n.className="title",n.textContent="TRV Connectors Autumn 2025",e.appendChild(n),document.body.insertBefore(e,document.body.firstChild)}if(!document.getElementById("instructor.password.hash")){const e=document.createElement("div");e.id="instructor.password.hash",e.style.display="none",e.textContent="ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae",document.body.appendChild(e)}return setTimeout(()=>{const e=document.querySelector("qd-login");e&&e.addEventListener("qd:login",n=>{console.log("Login event:",n.detail);const p=n.detail;alert(`${p.role.toUpperCase()} LOGIN!\\n\\nService ID: ${p.serviceId}\\nName: ${p.name}\\nRelease: ${p.release}`)})},100),o`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Instructor Login Demo:</p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click "Instructor" button</li>
            <li>Enter password: <code>test123</code></li>
            <li>Click "Login" in modal</li>
            <li>Event emits with <code>role: 'instructor'</code></li>
          </ol>

          <p style="margin: 15px 0 0 0; color: #666;">
            Password is hashed with SHA-256 before comparison.
          </p>
        </div>
      </div>
    `}},a={render:()=>{if(!document.querySelector(".wh_publication_title")){const t=document.createElement("div");t.className="wh_publication_title";const e=document.createElement("span");e.className="title",e.textContent="TRV Connectors Autumn 2025",t.appendChild(e),document.body.insertBefore(t,document.body.firstChild)}return setTimeout(()=>{document.querySelector("qd-login")?.addEventListener("qd:login",e=>{console.log("Login event:",e.detail)})},100),o`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <h2 style="margin-top: 0;">Validation Rules</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div
            style="padding: 15px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;"
          >
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #2e7d32;">Valid Inputs</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li><strong>Name:</strong> Any non-empty string</li>
              <li><strong>Service ID:</strong> 2-10 alphanumeric</li>
              <li>Examples: RN2344, ABC123, XY</li>
            </ul>
          </div>

          <div
            style="padding: 15px; background: #ffebee; border-radius: 4px; border-left: 3px solid #d32f2f;"
          >
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #c62828;">Invalid Inputs</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Empty name or service ID</li>
              <li>Service ID: &lt; 2 or &gt; 10 chars</li>
              <li>Service ID: Non-alphanumeric (e.g., "RN-234")</li>
            </ul>
          </div>
        </div>

        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Try submitting with invalid data to see real-time validation errors.
          </p>
        </div>
      </div>
    `}},d={render:()=>{const i=document.querySelector(".wh_publication_title");return i&&i.remove(),setTimeout(()=>{document.querySelector("qd-login")?.addEventListener("qd:login",e=>{console.log("Login event:",e.detail)})},100),o`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #ffebee; border-left: 4px solid #d32f2f; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500; color: #c62828;">
            ⚠️ Release title element is missing
          </p>
          <p style="margin: 0;">
            Try logging in - you'll see an error: "Release not found (missing .wh_publication_title
            .title element)"
          </p>
          <p style="margin: 15px 0 0 0; color: #666;">
            Required:
            <code
              >&lt;div class="wh_publication_title"&gt;&lt;span class="title"&gt;TRV Connectors
              Autumn 2025&lt;/span&gt;&lt;/div&gt;</code
            >
          </p>
        </div>
      </div>
    `}},c={render:()=>{if(!document.querySelector(".wh_publication_title")){const t=document.createElement("div");t.className="wh_publication_title";const e=document.createElement("span");e.className="title",e.textContent="TRV Connectors Autumn 2025",t.appendChild(e),document.body.insertBefore(t,document.body.firstChild)}return setTimeout(()=>{document.querySelector("qd-login")?.addEventListener("qd:login",e=>{console.log("Login event:",e.detail)})},100),o`<qd-login></qd-login>`}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Add release title element
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }
    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      if (loginComponent) {
        loginComponent.addEventListener('qd:login', ((e: CustomEvent) => {
          // eslint-disable-next-line no-console
          console.log('Login event:', e.detail);
          const detail = e.detail as {
            role: string;
            serviceId: string;
            name: string;
            release: string;
          };
          alert(\`Login successful!\\\\n\\\\nRole: \${detail.role}\\\\nService ID: \${detail.serviceId}\\\\nName: \${detail.name}\\\\nRelease: \${detail.release}\`);
        }) as EventListener);
      }
    }, 100);
    return html\`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Try Student Login:</p>
          <ul style="margin: 0 0 15px 0; padding-left: 20px;">
            <li><strong>Name:</strong> John Smith</li>
            <li><strong>Service ID:</strong> RN2344 (2-10 alphanumeric)</li>
          </ul>

          <p style="margin: 0 0 10px 0; font-weight: 500;">Or Click "Instructor":</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Opens password modal</li>
            <li>For demo: Password hash not configured (will show error)</li>
          </ul>

          <p style="margin: 15px 0 0 0; color: #666;">
            Check browser console for <code>qd:login</code> event details.
          </p>
        </div>
      </div>
    \`;
  }
}`,...l.parameters?.docs?.source},description:{story:`Default Login Form

Shows horizontal layout with Name, Service ID, Login, and Instructor buttons.`,...l.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }
    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);
    return html\`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login title="Training Quiz System"></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">✓ Title customized via <code>title</code> property</p>
        </div>
      </div>
    \`;
  }
}`,...s.parameters?.docs?.source},description:{story:`With Custom Title

Demonstrates customizable title property.`,...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }

    // Add instructor password hash (SHA-256 of "test123")
    const hashExists = document.getElementById('instructor.password.hash');
    if (!hashExists) {
      const hashElement = document.createElement('div');
      hashElement.id = 'instructor.password.hash';
      hashElement.style.display = 'none';
      hashElement.textContent = 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae';
      document.body.appendChild(hashElement);
    }
    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      if (loginComponent) {
        loginComponent.addEventListener('qd:login', ((e: CustomEvent) => {
          // eslint-disable-next-line no-console
          console.log('Login event:', e.detail);
          const detail = e.detail as {
            role: string;
            serviceId: string;
            name: string;
            release: string;
          };
          alert(\`\${detail.role.toUpperCase()} LOGIN!\\\\n\\\\nService ID: \${detail.serviceId}\\\\nName: \${detail.name}\\\\nRelease: \${detail.release}\`);
        }) as EventListener);
      }
    }, 100);
    return html\`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500;">Instructor Login Demo:</p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click "Instructor" button</li>
            <li>Enter password: <code>test123</code></li>
            <li>Click "Login" in modal</li>
            <li>Event emits with <code>role: 'instructor'</code></li>
          </ol>

          <p style="margin: 15px 0 0 0; color: #666;">
            Password is hashed with SHA-256 before comparison.
          </p>
        </div>
      </div>
    \`;
  }
}`,...r.parameters?.docs?.source},description:{story:`Instructor Password Demo

Shows instructor modal with working password authentication.`,...r.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }
    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);
    return html\`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <h2 style="margin-top: 0;">Validation Rules</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div
            style="padding: 15px; background: #e8f5e9; border-radius: 4px; border-left: 3px solid #4caf50;"
          >
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #2e7d32;">Valid Inputs</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li><strong>Name:</strong> Any non-empty string</li>
              <li><strong>Service ID:</strong> 2-10 alphanumeric</li>
              <li>Examples: RN2344, ABC123, XY</li>
            </ul>
          </div>

          <div
            style="padding: 15px; background: #ffebee; border-radius: 4px; border-left: 3px solid #d32f2f;"
          >
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #c62828;">Invalid Inputs</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Empty name or service ID</li>
              <li>Service ID: &lt; 2 or &gt; 10 chars</li>
              <li>Service ID: Non-alphanumeric (e.g., "RN-234")</li>
            </ul>
          </div>
        </div>

        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0;">
            Try submitting with invalid data to see real-time validation errors.
          </p>
        </div>
      </div>
    \`;
  }
}`,...a.parameters?.docs?.source},description:{story:`Validation Examples

Shows various validation scenarios.`,...a.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Explicitly remove title element if it exists
    const titleExists = document.querySelector('.wh_publication_title');
    if (titleExists) {
      titleExists.remove();
    }
    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);
    return html\`
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <qd-login></qd-login>

        <div
          style="margin-top: 20px; padding: 15px; background: #ffebee; border-left: 4px solid #d32f2f; border-radius: 4px; font-size: 14px;"
        >
          <p style="margin: 0 0 10px 0; font-weight: 500; color: #c62828;">
            ⚠️ Release title element is missing
          </p>
          <p style="margin: 0;">
            Try logging in - you'll see an error: "Release not found (missing .wh_publication_title
            .title element)"
          </p>
          <p style="margin: 15px 0 0 0; color: #666;">
            Required:
            <code
              >&lt;div class="wh_publication_title"&gt;&lt;span class="title"&gt;TRV Connectors
              Autumn 2025&lt;/span&gt;&lt;/div&gt;</code
            >
          </p>
        </div>
      </div>
    \`;
  }
}`,...d.parameters?.docs?.source},description:{story:`Missing Release Title

Demonstrates error when release title element is missing.`,...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    const titleExists = document.querySelector('.wh_publication_title');
    if (!titleExists) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'wh_publication_title';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = 'TRV Connectors Autumn 2025';
      titleContainer.appendChild(titleSpan);
      document.body.insertBefore(titleContainer, document.body.firstChild);
    }
    setTimeout(() => {
      const loginComponent = document.querySelector('qd-login');
      loginComponent?.addEventListener('qd:login', ((e: CustomEvent) => {
        // eslint-disable-next-line no-console
        console.log('Login event:', e.detail);
      }) as EventListener);
    }, 100);
    return html\`<qd-login></qd-login>\`;
  }
}`,...c.parameters?.docs?.source},description:{story:`Minimal Example

Bare component without extra decoration.`,...c.parameters?.docs?.description}}};const y=["Default","CustomTitle","InstructorPasswordDemo","ValidationExamples","MissingReleaseTitle","MinimalExample"];export{s as CustomTitle,l as Default,r as InstructorPasswordDemo,c as MinimalExample,d as MissingReleaseTitle,a as ValidationExamples,y as __namedExportsOrder,v as default};
