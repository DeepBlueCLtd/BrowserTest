import{x as l}from"./lit-element-CSmQN0ht.js";import{e as c}from"./analysis-table-20YPZ0tO.js";import{e as p}from"./quiz-table-gjGINYXx.js";import{S as o}from"./storage-helpers-B4dxqHb-.js";import"./debouncer-WBxe4mJ7.js";import"./event-helpers-DOv9sfVv.js";import"./storage-service-CKMCIiLV.js";import"./session-B4sBU_x4.js";import"./iframe-dnmwWRY2.js";const C={title:"Enhancers/Combined Tables",tags:["autodocs"],parameters:{docs:{description:{component:`
Combined analysis and quiz tables on the same page.

**Use Case:**
Instructors create pages where students:
1. Fill in analysis table (free-form answers)
2. Answer quiz questions (verify understanding)

Both tables share the same pageId and their data must coexist in storage.

**Data Structure:**
\`\`\`typescript
cache.pages[pageId] = {
  state: 'incomplete',
  answered: 2,
  correct: 1,
  answers: [...],      // Quiz answers
  analysis: {          // Analysis data
    tableId: '...',
    cells: {...}
  }
}
\`\`\`
        `}}}};function u(){const e=new Date,t=new Date(e.getTime()+30*60*1e3);return{serviceId:"RN2344",name:"Demo User",release:"11-2024",loginTime:e.toISOString(),lastActivity:e.toISOString(),expiresAt:t.toISOString(),instructorUnlocked:!1}}function g(){const e=u();if(sessionStorage.setItem(o.SESSION,JSON.stringify(e)),!sessionStorage.getItem(o.CACHE)){const d={totals:{total:0,answered:0,correct:0},pages:{}};sessionStorage.setItem(o.CACHE,JSON.stringify(d))}}const s={render:()=>(g(),l`
      <div style="padding: 20px; max-width: 900px;">
        <h2>Combined Page: Analysis + Quiz</h2>
        <p>
          <strong>Scenario:</strong> Students analyze a circuit diagram, then answer verification
          questions.
        </p>

        <!-- Analysis Table Section -->
        <h3>Part 1: Circuit Analysis</h3>
        <p>Complete your analysis in the table below (cells with light yellow background):</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Component</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Your Calculation
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Resistance (R_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Ω (ohms)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Current (I_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">A (amps)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Power Dissipated (P)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">W (watts)</td>
            </tr>
          </tbody>
        </table>

        <div
          style="padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0;"
        >
          <strong>💡 Note:</strong> Your analysis work is auto-saved after 500ms.
        </div>

        <!-- Quiz Table Section -->
        <h3>Part 2: Verification Questions</h3>
        <p>Answer the following questions to verify your understanding:</p>

        <table class="qd-quiz" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Answer</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                If resistance increases, what happens to current?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">2</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Current increases</li>
                  <li>Current decreases</li>
                  <li>Current stays the same</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                What is the unit for electrical power?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">1</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Watt (W)</li>
                  <li>Volt (V)</li>
                  <li>Ampere (A)</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style="padding: 10px; background: #fff3e0; border-left: 4px solid #ff9800; margin: 20px 0;"
        >
          <strong>📊 Storage:</strong> Both analysis and quiz data are stored under the same pageId
          (<code>combined-page-1</code>). Check browser DevTools → Application → Session Storage →
          <code>qd/cache</code> to see the combined data structure.
        </div>

        <!-- CSS Styles -->
        <style>
          .qd-hidden {
            display: none;
          }
          .qd-quiz-input {
            width: 100%;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .qd-answer-correct {
            background-color: #d4edda !important;
            border-color: #c3e6cb !important;
          }
          .qd-answer-incorrect {
            background-color: #f8d7da !important;
            border-color: #f5c6cb !important;
          }
          .qd-editable {
            cursor: text;
          }
          .qd-editable:focus {
            outline: 2px solid #2196f3;
            outline-offset: 2px;
          }
        </style>
      </div>
    `),play:({canvasElement:e})=>{const t=e.querySelector("table.qd-analysis");t&&c(t,{interactive:!0,pageId:"combined-page-1"});const d=e.querySelector("table.qd-quiz");d&&p(d,{interactive:!0,pageId:"combined-page-1"}),document.addEventListener("qd:analysis-saved",a=>{console.log("✅ Analysis saved:",a.detail)}),document.addEventListener("qd:answer-saved",a=>{console.log("✅ Quiz answer saved:",a.detail)}),document.addEventListener("qd:state-changed",a=>{console.log("📊 Page state changed:",a.detail)})}},r={render:()=>{g();const e=sessionStorage.getItem(o.CACHE),t=e?JSON.parse(e):{totals:{total:0,answered:0,correct:0},pages:{}};t.pages["combined-page-2"]={state:"incomplete",total:2,answered:1,correct:1,answers:[{answer:"2",success:!0,timestamp:new Date().toISOString()}],analysis:{tableId:"test-table-id",cells:{"R0C1#f:00001505":"100","R1C1#f:00001505":"2.5"},firstEdited:new Date(Date.now()-3e5).toISOString(),lastEdited:new Date(Date.now()-6e4).toISOString()}};let d=0,a=0,b=0;for(const n of Object.values(t.pages))d+=n.total,a+=n.answered,b+=n.correct;return t.totals={total:d,answered:a,correct:b},sessionStorage.setItem(o.CACHE,JSON.stringify(t)),l`
      <div style="padding: 20px; max-width: 900px;">
        <h2>Combined Page: With Pre-filled Data</h2>
        <p><strong>Scenario:</strong> Student returns to continue their work.</p>

        <div
          style="padding: 10px; background: #e8f5e9; border-left: 4px solid #4caf50; margin: 20px 0;"
        >
          <strong>✅ Loaded from cache:</strong>
          <ul style="margin: 5px 0;">
            <li>Analysis: 2 cells have data (R_total: 100, I_total: 2.5)</li>
            <li>Quiz: Question 1 answered correctly (2)</li>
            <li>Quiz: Question 2 not yet answered</li>
          </ul>
        </div>

        <!-- Analysis Table Section -->
        <h3>Part 1: Circuit Analysis</h3>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Component</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Your Calculation
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Resistance (R_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Will be pre-filled with "100" -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Ω (ohms)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Current (I_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Will be pre-filled with "2.5" -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">A (amps)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Power Dissipated (P)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">W (watts)</td>
            </tr>
          </tbody>
        </table>

        <!-- Quiz Table Section -->
        <h3>Part 2: Verification Questions</h3>

        <table class="qd-quiz" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Answer</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                If resistance increases, what happens to current?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">2</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Current increases</li>
                  <li>Current decreases</li>
                  <li>Current stays the same</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                What is the unit for electrical power?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">1</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Watt (W)</li>
                  <li>Volt (V)</li>
                  <li>Ampere (A)</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- CSS Styles -->
        <style>
          .qd-hidden {
            display: none;
          }
          .qd-quiz-input {
            width: 100%;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .qd-answer-correct {
            background-color: #d4edda !important;
            border-color: #c3e6cb !important;
          }
          .qd-answer-incorrect {
            background-color: #f8d7da !important;
            border-color: #f5c6cb !important;
          }
          .qd-editable {
            cursor: text;
          }
          .qd-editable:focus {
            outline: 2px solid #2196f3;
            outline-offset: 2px;
          }
        </style>
      </div>
    `},play:({canvasElement:e})=>{const t=e.querySelector("table.qd-analysis");t&&c(t,{interactive:!0,pageId:"combined-page-2"});const d=e.querySelector("table.qd-quiz");d&&p(d,{interactive:!0,pageId:"combined-page-2"})}},i={render:()=>l`
      <div style="padding: 20px; max-width: 900px;">
        <h2>Combined Page: Non-Interactive (Pre-Login)</h2>
        <p><strong>Note:</strong> Both tables are read-only before login.</p>

        <!-- Analysis Table Section -->
        <h3>Part 1: Circuit Analysis</h3>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Component</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Your Calculation
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Resistance (R_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Not editable in non-interactive mode -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Ω (ohms)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Current (I_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Not editable in non-interactive mode -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">A (amps)</td>
            </tr>
          </tbody>
        </table>

        <!-- Quiz Table Section -->
        <h3>Part 2: Verification Questions</h3>

        <table class="qd-quiz" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Answer</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                If resistance increases, what happens to current?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">2</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Current increases</li>
                  <li>Current decreases</li>
                  <li>Current stays the same</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style="padding: 10px; background: #ffebee; border-left: 4px solid #f44336; margin: 20px 0;"
        >
          <strong>🔒 Security:</strong> Answer column and Detail column are hidden in quiz table.
          Analysis table cells are not editable.
        </div>

        <!-- CSS Styles -->
        <style>
          .qd-hidden {
            display: none;
          }
        </style>
      </div>
    `,play:({canvasElement:e})=>{const t=e.querySelector("table.qd-analysis");t&&c(t,{interactive:!1});const d=e.querySelector("table.qd-quiz");d&&p(d,{interactive:!1})}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    setupSession();
    return html\`
      <div style="padding: 20px; max-width: 900px;">
        <h2>Combined Page: Analysis + Quiz</h2>
        <p>
          <strong>Scenario:</strong> Students analyze a circuit diagram, then answer verification
          questions.
        </p>

        <!-- Analysis Table Section -->
        <h3>Part 1: Circuit Analysis</h3>
        <p>Complete your analysis in the table below (cells with light yellow background):</p>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Component</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Your Calculation
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Resistance (R_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Ω (ohms)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Current (I_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">A (amps)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Power Dissipated (P)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Editable -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">W (watts)</td>
            </tr>
          </tbody>
        </table>

        <div
          style="padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0;"
        >
          <strong>💡 Note:</strong> Your analysis work is auto-saved after 500ms.
        </div>

        <!-- Quiz Table Section -->
        <h3>Part 2: Verification Questions</h3>
        <p>Answer the following questions to verify your understanding:</p>

        <table class="qd-quiz" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Answer</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                If resistance increases, what happens to current?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">2</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Current increases</li>
                  <li>Current decreases</li>
                  <li>Current stays the same</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                What is the unit for electrical power?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">1</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Watt (W)</li>
                  <li>Volt (V)</li>
                  <li>Ampere (A)</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style="padding: 10px; background: #fff3e0; border-left: 4px solid #ff9800; margin: 20px 0;"
        >
          <strong>📊 Storage:</strong> Both analysis and quiz data are stored under the same pageId
          (<code>combined-page-1</code>). Check browser DevTools → Application → Session Storage →
          <code>qd/cache</code> to see the combined data structure.
        </div>

        <!-- CSS Styles -->
        <style>
          .qd-hidden {
            display: none;
          }
          .qd-quiz-input {
            width: 100%;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .qd-answer-correct {
            background-color: #d4edda !important;
            border-color: #c3e6cb !important;
          }
          .qd-answer-incorrect {
            background-color: #f8d7da !important;
            border-color: #f5c6cb !important;
          }
          .qd-editable {
            cursor: text;
          }
          .qd-editable:focus {
            outline: 2px solid #2196f3;
            outline-offset: 2px;
          }
        </style>
      </div>
    \`;
  },
  play: ({
    canvasElement
  }) => {
    // Enhance analysis table first
    const analysisTable = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (analysisTable) {
      enhanceAnalysisTable(analysisTable, {
        interactive: true,
        pageId: 'combined-page-1'
      });
    }

    // Enhance quiz table second
    const quizTable = canvasElement.querySelector('table.qd-quiz') as HTMLTableElement;
    if (quizTable) {
      enhanceQuizTable(quizTable, {
        interactive: true,
        pageId: 'combined-page-1'
      });
    }

    // Listen for events (log to console)
    document.addEventListener('qd:analysis-saved', ((e: CustomEvent) => {
      // eslint-disable-next-line no-console
      console.log('✅ Analysis saved:', e.detail);
    }) as EventListener);
    document.addEventListener('qd:answer-saved', ((e: CustomEvent) => {
      // eslint-disable-next-line no-console
      console.log('✅ Quiz answer saved:', e.detail);
    }) as EventListener);
    document.addEventListener('qd:state-changed', ((e: CustomEvent) => {
      // eslint-disable-next-line no-console
      console.log('📊 Page state changed:', e.detail);
    }) as EventListener);
  }
}`,...s.parameters?.docs?.source},description:{story:`Combined: Analysis Table + Quiz Table (Interactive Mode)

Demonstrates both table types on the same page, sharing the same pageId.
This is the typical instructor-created page structure.`,...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    setupSession();

    // Create cache with both analysis and quiz data
    const existingCacheJson = sessionStorage.getItem(STORAGE_KEYS.CACHE);
    const existingCache: SessionCache = existingCacheJson ? JSON.parse(existingCacheJson) as SessionCache : {
      totals: {
        total: 0,
        answered: 0,
        correct: 0
      },
      pages: {}
    };

    // Add pre-existing data for this page
    // NOTE: Cell keys use hash of INITIAL (empty) content
    // Empty string hash (DJB2): 5381 -> hex "1505" -> padded "00001505"
    existingCache.pages['combined-page-2'] = {
      state: 'incomplete',
      total: 2,
      answered: 1,
      correct: 1,
      answers: [{
        answer: '2',
        success: true,
        timestamp: new Date().toISOString()
      }
      // Second question not answered yet
      ],
      analysis: {
        tableId: 'test-table-id',
        cells: {
          'R0C1#f:00001505': '100',
          // Row 0, Col 1 (Total Resistance)
          'R1C1#f:00001505': '2.5' // Row 1, Col 1 (Total Current)
          // Row 2, Col 1 (Power) left empty
        },
        firstEdited: new Date(Date.now() - 300000).toISOString(),
        // 5 minutes ago
        lastEdited: new Date(Date.now() - 60000).toISOString() // 1 minute ago
      }
    };

    // Recalculate totals
    let totalQuestions = 0;
    let totalAnswered = 0;
    let totalCorrect = 0;
    for (const page of Object.values(existingCache.pages)) {
      totalQuestions += page.total;
      totalAnswered += page.answered;
      totalCorrect += page.correct;
    }
    existingCache.totals = {
      total: totalQuestions,
      answered: totalAnswered,
      correct: totalCorrect
    };
    sessionStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(existingCache));
    return html\`
      <div style="padding: 20px; max-width: 900px;">
        <h2>Combined Page: With Pre-filled Data</h2>
        <p><strong>Scenario:</strong> Student returns to continue their work.</p>

        <div
          style="padding: 10px; background: #e8f5e9; border-left: 4px solid #4caf50; margin: 20px 0;"
        >
          <strong>✅ Loaded from cache:</strong>
          <ul style="margin: 5px 0;">
            <li>Analysis: 2 cells have data (R_total: 100, I_total: 2.5)</li>
            <li>Quiz: Question 1 answered correctly (2)</li>
            <li>Quiz: Question 2 not yet answered</li>
          </ul>
        </div>

        <!-- Analysis Table Section -->
        <h3>Part 1: Circuit Analysis</h3>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Component</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Your Calculation
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Resistance (R_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Will be pre-filled with "100" -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Ω (ohms)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Current (I_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Will be pre-filled with "2.5" -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">A (amps)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Power Dissipated (P)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Empty -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">W (watts)</td>
            </tr>
          </tbody>
        </table>

        <!-- Quiz Table Section -->
        <h3>Part 2: Verification Questions</h3>

        <table class="qd-quiz" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Answer</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                If resistance increases, what happens to current?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">2</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Current increases</li>
                  <li>Current decreases</li>
                  <li>Current stays the same</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                What is the unit for electrical power?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">1</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Watt (W)</li>
                  <li>Volt (V)</li>
                  <li>Ampere (A)</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- CSS Styles -->
        <style>
          .qd-hidden {
            display: none;
          }
          .qd-quiz-input {
            width: 100%;
            padding: 4px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .qd-answer-correct {
            background-color: #d4edda !important;
            border-color: #c3e6cb !important;
          }
          .qd-answer-incorrect {
            background-color: #f8d7da !important;
            border-color: #f5c6cb !important;
          }
          .qd-editable {
            cursor: text;
          }
          .qd-editable:focus {
            outline: 2px solid #2196f3;
            outline-offset: 2px;
          }
        </style>
      </div>
    \`;
  },
  play: ({
    canvasElement
  }) => {
    // Enhance analysis table first
    const analysisTable = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (analysisTable) {
      enhanceAnalysisTable(analysisTable, {
        interactive: true,
        pageId: 'combined-page-2'
      });
    }

    // Enhance quiz table second
    const quizTable = canvasElement.querySelector('table.qd-quiz') as HTMLTableElement;
    if (quizTable) {
      enhanceQuizTable(quizTable, {
        interactive: true,
        pageId: 'combined-page-2'
      });
    }
  }
}`,...r.parameters?.docs?.source},description:{story:`Combined: With Pre-filled Data

Shows both tables loading existing data from cache.
Demonstrates that analysis and quiz data coexist properly.`,...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    // NOTE: Do NOT manipulate storage - enhancer handles mode via interactive parameter

    return html\`
      <div style="padding: 20px; max-width: 900px;">
        <h2>Combined Page: Non-Interactive (Pre-Login)</h2>
        <p><strong>Note:</strong> Both tables are read-only before login.</p>

        <!-- Analysis Table Section -->
        <h3>Part 1: Circuit Analysis</h3>

        <table class="qd-analysis" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Component</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">
                Your Calculation
              </th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Units</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Resistance (R_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Not editable in non-interactive mode -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">Ω (ohms)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Total Current (I_total)</td>
              <td
                class="interactive"
                style="border: 1px solid #ccc; padding: 8px; background: #fff8dc;"
              >
                <!-- Not editable in non-interactive mode -->
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">A (amps)</td>
            </tr>
          </tbody>
        </table>

        <!-- Quiz Table Section -->
        <h3>Part 2: Verification Questions</h3>

        <table class="qd-quiz" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Question</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Answer</th>
              <th style="border: 1px solid #ccc; padding: 8px; background: #f0f0f0;">Options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">
                If resistance increases, what happens to current?
              </td>
              <td style="border: 1px solid #ccc; padding: 8px;">2</td>
              <td style="border: 1px solid #ccc; padding: 8px;">
                <ol>
                  <li>Current increases</li>
                  <li>Current decreases</li>
                  <li>Current stays the same</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style="padding: 10px; background: #ffebee; border-left: 4px solid #f44336; margin: 20px 0;"
        >
          <strong>🔒 Security:</strong> Answer column and Detail column are hidden in quiz table.
          Analysis table cells are not editable.
        </div>

        <!-- CSS Styles -->
        <style>
          .qd-hidden {
            display: none;
          }
        </style>
      </div>
    \`;
  },
  play: ({
    canvasElement
  }) => {
    // Enhance analysis table first (non-interactive)
    const analysisTable = canvasElement.querySelector('table.qd-analysis') as HTMLTableElement;
    if (analysisTable) {
      enhanceAnalysisTable(analysisTable, {
        interactive: false
      });
    }

    // Enhance quiz table second (non-interactive)
    const quizTable = canvasElement.querySelector('table.qd-quiz') as HTMLTableElement;
    if (quizTable) {
      enhanceQuizTable(quizTable, {
        interactive: false
      });
    }
  }
}`,...i.parameters?.docs?.source},description:{story:`Non-Interactive Mode

Shows both tables in read-only mode (pre-login state).
NOTE: Do NOT clear storage - students may navigate to reference pages while working.
Non-interactive mode just means tables aren't editable, not that we should wipe session data.`,...i.parameters?.docs?.description}}};const T=["AnalysisAndQuiz","WithExistingData","NonInteractive"];export{s as AnalysisAndQuiz,i as NonInteractive,r as WithExistingData,T as __namedExportsOrder,C as default};
