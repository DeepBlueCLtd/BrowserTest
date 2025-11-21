import{x as s}from"./lit-element-CSmQN0ht.js";import"./qd-login-DOnPSXu3.js";import"./qd-status-Cmfbfimk.js";import"./qd-instructor-7aY0cd-J.js";import"./property-Cqq8i_uy.js";import"./state-BjYqokDn.js";import"./storage-helpers-B4dxqHb-.js";import"./session-BjIMOy9d.js";import"./iframe-Ca7qNH9T.js";import"./event-helpers-DOv9sfVv.js";const v={title:"Workflows/Login Flow",tags:["autodocs"],parameters:{layout:"fullscreen"}},n={render:()=>s`
    <!-- Release title element (required by qd-login) -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }
      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .demo-section h3 {
        margin-top: 0;
        color: #0066cc;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
    </style>
    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Student Login Flow Demo:</strong>
        <ol>
          <li>Fill in Service ID (e.g., TEST001)</li>
          <li>Fill in Name (e.g., John Doe)</li>
          <li>Fill in Release (e.g., 01-2025)</li>
          <li>Click "Login" button</li>
          <li>Observe student status panel appear</li>
        </ol>
      </div>

      <div class="demo-section">
        <h3>Login Form</h3>
        <qd-login></qd-login>
      </div>

      <div class="demo-section">
        <h3>Student Status Panel (appears after login)</h3>
        <qd-status></qd-status>
      </div>
    </div>
  `},e={render:()=>s`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }
      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .demo-section h3 {
        margin-top: 0;
        color: #0066cc;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .password-info {
        background: #d1ecf1;
        padding: 0.75rem;
        border-radius: 4px;
        margin-top: 0.5rem;
        font-family: monospace;
        font-size: 0.85rem;
      }
    </style>

    <!-- Inject password hash (simulating Oxygen XSL) -->
    <span id="instructor.password.hash" style="display:none;"
      >c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5</span
    >

    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Instructor Login Flow Demo:</strong>
        <ol>
          <li>Click "Instructor" button (no student login needed)</li>
          <li>Password modal appears</li>
          <li>Enter password: <code>instructor123</code></li>
          <li>Click "Unlock"</li>
          <li>Observe instructor panel with controls</li>
        </ol>
        <div class="password-info">
          Test Password: <strong>instructor123</strong><br />
          Hash: c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5
        </div>
      </div>

      <div class="demo-section">
        <h3>Login Form</h3>
        <qd-login></qd-login>
      </div>

      <div class="demo-section">
        <h3>Instructor Panel (appears after unlock)</h3>
        <qd-instructor></qd-instructor>
      </div>
    </div>
  `},i={render:()=>s`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
      }
      .page-header {
        background: #0066cc;
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      .nav-container {
        display: flex;
        align-items: center;
        gap: 2rem;
      }
      nav ul {
        list-style: none;
        display: flex;
        gap: 1rem;
        margin: 0;
        padding: 0;
      }
      nav a {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .status-panel-container {
        min-width: 200px;
      }
      .page-content {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .welcome-section {
        background: #f9f9f9;
        padding: 2rem;
        border-radius: 8px;
        margin-bottom: 2rem;
      }
      .welcome-section h2 {
        color: #0066cc;
        margin-top: 0;
      }
      .quiz-links {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      .quiz-card {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.5rem;
        background: white;
        transition: all 0.2s;
      }
      .quiz-card:hover {
        border-color: #0066cc;
        box-shadow: 0 4px 8px rgba(0, 102, 204, 0.15);
      }
      .quiz-card h3 {
        color: #0066cc;
        margin-top: 0;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
      }
    </style>

    <div class="page-header">
      <h1>Sonar Quiz System</h1>
      <div class="nav-container">
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#quizzes">Quizzes</a></li>
            <li><a href="#analysis">Analysis</a></li>
          </ul>
        </nav>
        <div class="status-panel-container">
          <!-- Login panel shown when not logged in -->
          <qd-login></qd-login>
          <!-- Status panel shown when logged in -->
          <qd-status></qd-status>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div class="demo-instructions">
        <strong>Full Page Demo:</strong>
        <p>This story shows a complete quiz index page with integrated login/status panels.</p>
        <p>
          <strong>Try it:</strong> Login as a student to see the status panel replace the login form
          in the header.
        </p>
      </div>

      <div class="welcome-section">
        <h2>Welcome to the Sonar Quiz System</h2>
        <p>
          This offline-first training platform helps you master sonar operations through interactive
          quizzes and analysis exercises.
        </p>
        <ul>
          <li><strong>Login:</strong> Enter your credentials in the header to begin</li>
          <li><strong>Track Progress:</strong> Your progress is automatically saved</li>
          <li><strong>Offline:</strong> Works completely offline - no internet required</li>
        </ul>
      </div>

      <h2>Available Quizzes</h2>
      <div class="quiz-links">
        <div class="quiz-card">
          <h3>Mixed Quiz</h3>
          <p>Combination of multiple choice and numeric questions</p>
        </div>
        <div class="quiz-card">
          <h3>MCQ Quiz</h3>
          <p>Multiple choice questions only</p>
        </div>
        <div class="quiz-card">
          <h3>Numeric Quiz</h3>
          <p>Numeric questions with tolerance values</p>
        </div>
        <div class="quiz-card">
          <h3>Contact Analysis</h3>
          <p>Classify and analyze sonar contacts</p>
        </div>
      </div>
    </div>
  `},o={render:()=>s`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 1000px;
        margin: 0 auto;
      }
      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .demo-section h3 {
        margin-top: 0;
        color: #0066cc;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .control-item {
        padding: 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .control-item h4 {
        margin-top: 0;
        color: #0066cc;
        font-size: 0.9rem;
      }
      .control-item p {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
      }
    </style>

    <!-- Inject password hash -->
    <span id="instructor.password.hash" style="display:none;"
      >c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5</span
    >

    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Instructor Control Panel:</strong>
        <p>
          After unlocking (password: <code>instructor123</code>), the instructor panel provides
          these controls:
        </p>
      </div>

      <div class="demo-section">
        <h3>Instructor Panel</h3>
        <qd-instructor></qd-instructor>
      </div>

      <div class="demo-section">
        <h3>Available Controls (after unlock)</h3>
        <div class="controls-grid">
          <div class="control-item">
            <h4>Show/Hide Answers</h4>
            <p>Toggle visibility of student answers on quiz pages</p>
          </div>
          <div class="control-item">
            <h4>View All Scores</h4>
            <p>Open modal showing all students' scores and completion status</p>
          </div>
          <div class="control-item">
            <h4>Export to CSV</h4>
            <p>Download detailed student data including all answers</p>
          </div>
          <div class="control-item">
            <h4>Erase All Data</h4>
            <p>Clear all student data for cohort reset (with confirmation)</p>
          </div>
        </div>
      </div>
    </div>
  `},t={render:()=>s`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
      }
      .transition-demo {
        border: 2px solid #0066cc;
        border-radius: 8px;
        padding: 2rem;
        background: #f9f9f9;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .state-indicator {
        background: #d1ecf1;
        padding: 0.75rem;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
        color: #0c5460;
      }
    </style>

    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Watch the Transition:</strong>
        <p>
          When you login, the login form will hide and the status panel will appear in the same
          space.
        </p>
        <p>This is the behavior you'll see in the header of the actual quiz pages.</p>
      </div>

      <div class="state-indicator">Not Logged In → Login Form Visible</div>

      <div class="transition-demo">
        <qd-login></qd-login>
        <qd-status></qd-status>
      </div>

      <div class="state-indicator">After Login → Status Panel Visible</div>
    </div>
  `};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <!-- Release title element (required by qd-login) -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }
      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .demo-section h3 {
        margin-top: 0;
        color: #0066cc;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
    </style>
    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Student Login Flow Demo:</strong>
        <ol>
          <li>Fill in Service ID (e.g., TEST001)</li>
          <li>Fill in Name (e.g., John Doe)</li>
          <li>Fill in Release (e.g., 01-2025)</li>
          <li>Click "Login" button</li>
          <li>Observe student status panel appear</li>
        </ol>
      </div>

      <div class="demo-section">
        <h3>Login Form</h3>
        <qd-login></qd-login>
      </div>

      <div class="demo-section">
        <h3>Student Status Panel (appears after login)</h3>
        <qd-status></qd-status>
      </div>
    </div>
  \`
}`,...n.parameters?.docs?.source},description:{story:`Student Login Flow
Complete flow: Login form → Student status panel`,...n.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }
      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .demo-section h3 {
        margin-top: 0;
        color: #0066cc;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .password-info {
        background: #d1ecf1;
        padding: 0.75rem;
        border-radius: 4px;
        margin-top: 0.5rem;
        font-family: monospace;
        font-size: 0.85rem;
      }
    </style>

    <!-- Inject password hash (simulating Oxygen XSL) -->
    <span id="instructor.password.hash" style="display:none;"
      >c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5</span
    >

    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Instructor Login Flow Demo:</strong>
        <ol>
          <li>Click "Instructor" button (no student login needed)</li>
          <li>Password modal appears</li>
          <li>Enter password: <code>instructor123</code></li>
          <li>Click "Unlock"</li>
          <li>Observe instructor panel with controls</li>
        </ol>
        <div class="password-info">
          Test Password: <strong>instructor123</strong><br />
          Hash: c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5
        </div>
      </div>

      <div class="demo-section">
        <h3>Login Form</h3>
        <qd-login></qd-login>
      </div>

      <div class="demo-section">
        <h3>Instructor Panel (appears after unlock)</h3>
        <qd-instructor></qd-instructor>
      </div>
    </div>
  \`
}`,...e.parameters?.docs?.source},description:{story:`Instructor Login Flow
Complete flow: Login form → Instructor button → Password modal → Instructor panel`,...e.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
      }
      .page-header {
        background: #0066cc;
        color: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      .nav-container {
        display: flex;
        align-items: center;
        gap: 2rem;
      }
      nav ul {
        list-style: none;
        display: flex;
        gap: 1rem;
        margin: 0;
        padding: 0;
      }
      nav a {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .status-panel-container {
        min-width: 200px;
      }
      .page-content {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .welcome-section {
        background: #f9f9f9;
        padding: 2rem;
        border-radius: 8px;
        margin-bottom: 2rem;
      }
      .welcome-section h2 {
        color: #0066cc;
        margin-top: 0;
      }
      .quiz-links {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      .quiz-card {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.5rem;
        background: white;
        transition: all 0.2s;
      }
      .quiz-card:hover {
        border-color: #0066cc;
        box-shadow: 0 4px 8px rgba(0, 102, 204, 0.15);
      }
      .quiz-card h3 {
        color: #0066cc;
        margin-top: 0;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
      }
    </style>

    <div class="page-header">
      <h1>Sonar Quiz System</h1>
      <div class="nav-container">
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#quizzes">Quizzes</a></li>
            <li><a href="#analysis">Analysis</a></li>
          </ul>
        </nav>
        <div class="status-panel-container">
          <!-- Login panel shown when not logged in -->
          <qd-login></qd-login>
          <!-- Status panel shown when logged in -->
          <qd-status></qd-status>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div class="demo-instructions">
        <strong>Full Page Demo:</strong>
        <p>This story shows a complete quiz index page with integrated login/status panels.</p>
        <p>
          <strong>Try it:</strong> Login as a student to see the status panel replace the login form
          in the header.
        </p>
      </div>

      <div class="welcome-section">
        <h2>Welcome to the Sonar Quiz System</h2>
        <p>
          This offline-first training platform helps you master sonar operations through interactive
          quizzes and analysis exercises.
        </p>
        <ul>
          <li><strong>Login:</strong> Enter your credentials in the header to begin</li>
          <li><strong>Track Progress:</strong> Your progress is automatically saved</li>
          <li><strong>Offline:</strong> Works completely offline - no internet required</li>
        </ul>
      </div>

      <h2>Available Quizzes</h2>
      <div class="quiz-links">
        <div class="quiz-card">
          <h3>Mixed Quiz</h3>
          <p>Combination of multiple choice and numeric questions</p>
        </div>
        <div class="quiz-card">
          <h3>MCQ Quiz</h3>
          <p>Multiple choice questions only</p>
        </div>
        <div class="quiz-card">
          <h3>Numeric Quiz</h3>
          <p>Numeric questions with tolerance values</p>
        </div>
        <div class="quiz-card">
          <h3>Contact Analysis</h3>
          <p>Classify and analyze sonar contacts</p>
        </div>
      </div>
    </div>
  \`
}`,...i.parameters?.docs?.source},description:{story:`Complete Page with Login and Status
Simulates a full quiz index page with login → status transition`,...i.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 1000px;
        margin: 0 auto;
      }
      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
      }
      .demo-section h3 {
        margin-top: 0;
        color: #0066cc;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .control-item {
        padding: 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .control-item h4 {
        margin-top: 0;
        color: #0066cc;
        font-size: 0.9rem;
      }
      .control-item p {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
      }
    </style>

    <!-- Inject password hash -->
    <span id="instructor.password.hash" style="display:none;"
      >c1437a55f6e93b7049c4064af1b0920974e383a435283f5d0b0496ee4a8a47b5</span
    >

    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Instructor Control Panel:</strong>
        <p>
          After unlocking (password: <code>instructor123</code>), the instructor panel provides
          these controls:
        </p>
      </div>

      <div class="demo-section">
        <h3>Instructor Panel</h3>
        <qd-instructor></qd-instructor>
      </div>

      <div class="demo-section">
        <h3>Available Controls (after unlock)</h3>
        <div class="controls-grid">
          <div class="control-item">
            <h4>Show/Hide Answers</h4>
            <p>Toggle visibility of student answers on quiz pages</p>
          </div>
          <div class="control-item">
            <h4>View All Scores</h4>
            <p>Open modal showing all students' scores and completion status</p>
          </div>
          <div class="control-item">
            <h4>Export to CSV</h4>
            <p>Download detailed student data including all answers</p>
          </div>
          <div class="control-item">
            <h4>Erase All Data</h4>
            <p>Clear all student data for cohort reset (with confirmation)</p>
          </div>
        </div>
      </div>
    </div>
  \`
}`,...o.parameters?.docs?.source},description:{story:`Instructor Mode with Full Controls
Shows instructor panel with all control buttons`,...o.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <!-- Release title element -->
    <div class="wh_publication_title" style="display:none;">
      <span class="title">Test Release 01-2025</span>
    </div>

    <style>
      .demo-container {
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
      }
      .transition-demo {
        border: 2px solid #0066cc;
        border-radius: 8px;
        padding: 2rem;
        background: #f9f9f9;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .demo-instructions {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      .state-indicator {
        background: #d1ecf1;
        padding: 0.75rem;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
        color: #0c5460;
      }
    </style>

    <div class="demo-container">
      <div class="demo-instructions">
        <strong>Watch the Transition:</strong>
        <p>
          When you login, the login form will hide and the status panel will appear in the same
          space.
        </p>
        <p>This is the behavior you'll see in the header of the actual quiz pages.</p>
      </div>

      <div class="state-indicator">Not Logged In → Login Form Visible</div>

      <div class="transition-demo">
        <qd-login></qd-login>
        <qd-status></qd-status>
      </div>

      <div class="state-indicator">After Login → Status Panel Visible</div>
    </div>
  \`
}`,...t.parameters?.docs?.source},description:{story:`Login to Status Transition
Demonstrates the transition from login form to status panel`,...t.parameters?.docs?.description}}};const f=["StudentLoginFlow","InstructorLoginFlow","FullPageWithLoginStatus","InstructorModeFullControls","LoginToStatusTransition"];export{i as FullPageWithLoginStatus,e as InstructorLoginFlow,o as InstructorModeFullControls,t as LoginToStatusTransition,n as StudentLoginFlow,f as __namedExportsOrder,v as default};
