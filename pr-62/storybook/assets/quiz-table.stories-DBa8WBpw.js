import{x as n}from"./lit-element-CSmQN0ht.js";import{e as u}from"./quiz-table-BU8eZErf.js";import{S as d}from"./storage-helpers-B4dxqHb-.js";import"./iframe-BwcKbeg7.js";import"./session-BY0Y0_gx.js";import"./date-helpers-DnOSSXb9.js";import"./event-helpers-DOv9sfVv.js";import"./storage-service-CiD2Vlrz.js";const Q={title:"Enhancers/Quiz Table",tags:["autodocs"],parameters:{docs:{description:{component:"Single-phase quiz table enhancement. Shows non-interactive (pre-login) and interactive (post-login) modes."}}}},g=()=>n`
  <table class="qd-quiz">
    <thead>
      <tr>
        <th>Question</th>
        <th>Answer</th>
        <th>Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is 2 + 2?</td>
        <td>1</td>
        <td>
          <ol>
            <li>4</li>
            <li>5</li>
            <li>6</li>
          </ol>
        </td>
      </tr>
      <tr>
        <td>What is 3 + 3?</td>
        <td>2</td>
        <td>
          <ol>
            <li>5</li>
            <li>6</li>
            <li>7</li>
          </ol>
        </td>
      </tr>
      <tr>
        <td>What is the capital of France?</td>
        <td>2</td>
        <td>
          <ol>
            <li>London</li>
            <li>Paris</li>
            <li>Berlin</li>
          </ol>
        </td>
      </tr>
    </tbody>
  </table>

  <style>
    table.qd-quiz {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    table.qd-quiz th,
    table.qd-quiz td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    table.qd-quiz th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    table.qd-quiz tbody tr:hover {
      background-color: #f5f5f5;
    }
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
  </style>
`,w=()=>n`
  <table class="qd-quiz">
    <thead>
      <tr>
        <th>Question</th>
        <th>Answer</th>
        <th>Tolerance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is the value of π (pi) to 2 decimal places?</td>
        <td>3.14</td>
        <td>0.01</td>
      </tr>
      <tr>
        <td>What is the answer to life, the universe, and everything?</td>
        <td>42</td>
        <td>0.5</td>
      </tr>
      <tr>
        <td>How many degrees in a right angle?</td>
        <td>90</td>
        <td>0</td>
      </tr>
    </tbody>
  </table>

  <style>
    table.qd-quiz {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    table.qd-quiz th,
    table.qd-quiz td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    table.qd-quiz th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    table.qd-quiz tbody tr:hover {
      background-color: #f5f5f5;
    }
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
  </style>
`;function m(){const e={serviceId:"RN2344",name:"Demo User",release:"11-2024",loginTime:new Date().toISOString(),lastActivity:new Date().toISOString(),expiresAt:new Date(Date.now()+18e5).toISOString(),instructorUnlocked:!1};if(sessionStorage.setItem(d.SESSION,JSON.stringify(e)),!sessionStorage.getItem(d.CACHE)){const r={totals:{total:0,answered:0,correct:0},pages:{}};sessionStorage.setItem(d.CACHE,JSON.stringify(r))}}const o={render:()=>(setTimeout(()=>{const e=document.querySelector("table.qd-quiz");e&&u(e,{interactive:!1})},100),n`
      <div>
        <h2>Non-Interactive Mode (Pre-Login)</h2>
        <p>
          Answer column is hidden for security. Users cannot see or interact with correct answers
          before logging in.
        </p>
        ${g()}
      </div>
    `)},a={render:()=>(m(),setTimeout(()=>{const e=document.querySelector("table.qd-quiz");e&&u(e,{interactive:!0,pageId:"demo-mcq-page"})},100),n`
      <div>
        <h2>Interactive Mode - MCQ Questions</h2>
        <p>
          Answer column shows input controls. Try entering answers (use option numbers: 1, 2, or 3):
        </p>
        <ul>
          <li><strong>Question 1:</strong> Correct answer is 1 (= 4)</li>
          <li><strong>Question 2:</strong> Correct answer is 2 (= 6)</li>
          <li><strong>Question 3:</strong> Correct answer is 2 (= Paris)</li>
        </ul>
        <p>
          <small
            >Answers are auto-saved after 200ms. Correct answers show green, incorrect show
            red.</small
          >
        </p>
        ${g()}
      </div>
    `)},i={render:()=>(m(),setTimeout(()=>{const e=document.querySelector("table.qd-quiz");e&&u(e,{interactive:!0,pageId:"demo-numeric-page"})},100),n`
      <div>
        <h2>Interactive Mode - Numeric Questions</h2>
        <p>Numeric questions with tolerance validation. Try these answers:</p>
        <ul>
          <li><strong>Question 1 (π):</strong> Correct: 3.14 (±0.01) - Try: 3.14, 3.13, 3.15</li>
          <li><strong>Question 2:</strong> Correct: 42 (±0.5) - Try: 42, 41.5, 42.5, 43</li>
          <li><strong>Question 3:</strong> Correct: 90 (±0) - Exact match required</li>
        </ul>
        <p>
          <small
            >Answers within tolerance show green, outside tolerance show red. Auto-save after
            200ms.</small
          >
        </p>
        ${w()}
      </div>
    `)},l={render:()=>{m();const e=sessionStorage.getItem(d.CACHE),t=e?JSON.parse(e):{totals:{total:0,answered:0,correct:0},pages:{}};t.pages["demo-prefilled-page"]={state:"incomplete",total:5,answered:2,correct:1,answers:[{answer:"1",success:!0,timestamp:new Date().toISOString()},{answer:"3",success:!1,timestamp:new Date().toISOString()}]};let r=0,p=0,h=0;for(const s of Object.values(t.pages))h+=s.total,r+=s.answered,p+=s.correct;return t.totals={total:h,answered:r,correct:p},sessionStorage.setItem(d.CACHE,JSON.stringify(t)),setTimeout(()=>{const s=document.querySelector("table.qd-quiz");s&&u(s,{interactive:!0,pageId:"demo-prefilled-page"})},100),n`
      <div>
        <h2>With Pre-filled Answers</h2>
        <p>
          Table loads existing answers from session cache. First two questions have previous
          answers:
        </p>
        <ul>
          <li><strong>Question 1:</strong> Previously answered "1" (correct) ✓</li>
          <li><strong>Question 2:</strong> Previously answered "3" (incorrect) ✗</li>
          <li><strong>Question 3:</strong> Not yet answered</li>
        </ul>
        <p><small>Validation styling is applied on load based on previous answers.</small></p>
        ${g()}
      </div>
    `}},c={render:()=>{m();const e=document.createElement("div");return e.id="state-display",e.style.cssText="padding: 10px; margin: 10px 0; background: #f0f0f0; border-radius: 4px;",e.innerHTML="<strong>Current State:</strong> unstarted",document.addEventListener("qd:state-changed",t=>{const{pageId:r,state:p}=t.detail;e.innerHTML=`<strong>Page ${r} State:</strong> ${p}`}),setTimeout(()=>{const t=document.querySelector("table.qd-quiz");t&&u(t,{interactive:!0,pageId:"state-demo-page"})},100),n`
      <div>
        <h2>State Progression Demo</h2>
        <p>Watch the state change as you answer questions:</p>
        <ul>
          <li><strong>Unstarted:</strong> No answers provided</li>
          <li>
            <strong>Incomplete:</strong> Some answered OR any incorrect (Answer Q1 with "2" to see)
          </li>
          <li>
            <strong>Complete:</strong> All answered AND all correct (Answer all correctly: 1, 2, 2)
          </li>
        </ul>
        ${e} ${g()}
      </div>
    `}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    // NOTE: Do NOT manipulate storage - enhancer handles mode via interactive parameter

    // Enhancement must run after Lit renders the DOM
    setTimeout(() => {
      const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
      if (table) {
        enhanceQuizTable(table, {
          interactive: false
        });
      }
    }, 100); // Increased delay to ensure Lit has rendered

    return html\`
      <div>
        <h2>Non-Interactive Mode (Pre-Login)</h2>
        <p>
          Answer column is hidden for security. Users cannot see or interact with correct answers
          before logging in.
        </p>
        \${createMCQTableHTML()}
      </div>
    \`;
  }
}`,...o.parameters?.docs?.source},description:{story:`Story: Non-Interactive Mode (Pre-Login)

Shows quiz table with answer column hidden for security.
This is how tables appear before user login.`,...o.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Setup session
    setupSession();
    setTimeout(() => {
      const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
      if (table) {
        enhanceQuizTable(table, {
          interactive: true,
          pageId: 'demo-mcq-page'
        });
      }
    }, 100);
    return html\`
      <div>
        <h2>Interactive Mode - MCQ Questions</h2>
        <p>
          Answer column shows input controls. Try entering answers (use option numbers: 1, 2, or 3):
        </p>
        <ul>
          <li><strong>Question 1:</strong> Correct answer is 1 (= 4)</li>
          <li><strong>Question 2:</strong> Correct answer is 2 (= 6)</li>
          <li><strong>Question 3:</strong> Correct answer is 2 (= Paris)</li>
        </ul>
        <p>
          <small
            >Answers are auto-saved after 200ms. Correct answers show green, incorrect show
            red.</small
          >
        </p>
        \${createMCQTableHTML()}
      </div>
    \`;
  }
}`,...a.parameters?.docs?.source},description:{story:`Story: Interactive Mode - MCQ Questions

Shows quiz table with interactive controls for MCQ questions.
Demonstrates input injection, validation, and visual feedback.`,...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Setup session
    setupSession();
    setTimeout(() => {
      const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
      if (table) {
        enhanceQuizTable(table, {
          interactive: true,
          pageId: 'demo-numeric-page'
        });
      }
    }, 100);
    return html\`
      <div>
        <h2>Interactive Mode - Numeric Questions</h2>
        <p>Numeric questions with tolerance validation. Try these answers:</p>
        <ul>
          <li><strong>Question 1 (π):</strong> Correct: 3.14 (±0.01) - Try: 3.14, 3.13, 3.15</li>
          <li><strong>Question 2:</strong> Correct: 42 (±0.5) - Try: 42, 41.5, 42.5, 43</li>
          <li><strong>Question 3:</strong> Correct: 90 (±0) - Exact match required</li>
        </ul>
        <p>
          <small
            >Answers within tolerance show green, outside tolerance show red. Auto-save after
            200ms.</small
          >
        </p>
        \${createNumericTableHTML()}
      </div>
    \`;
  }
}`,...i.parameters?.docs?.source},description:{story:`Story: Interactive Mode - Numeric Questions

Shows quiz table with interactive controls for numeric questions.
Demonstrates tolerance-based validation.`,...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Setup session with pre-existing answers
    setupSession();

    // Preserve existing cache and add pre-filled answers for this page
    const existingCacheJson = sessionStorage.getItem(STORAGE_KEYS.CACHE);
    const existingCache: SessionCache = existingCacheJson ? JSON.parse(existingCacheJson) as SessionCache : {
      totals: {
        total: 0,
        answered: 0,
        correct: 0
      },
      pages: {}
    };

    // Add pre-filled answers for this specific page
    existingCache.pages['demo-prefilled-page'] = {
      state: 'incomplete',
      total: 5,
      answered: 2,
      correct: 1,
      answers: [{
        answer: '1',
        success: true,
        timestamp: new Date().toISOString()
      }, {
        answer: '3',
        success: false,
        timestamp: new Date().toISOString()
      }]
    };

    // Recalculate totals across all pages
    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
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
    setTimeout(() => {
      const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
      if (table) {
        enhanceQuizTable(table, {
          interactive: true,
          pageId: 'demo-prefilled-page'
        });
      }
    }, 100);
    return html\`
      <div>
        <h2>With Pre-filled Answers</h2>
        <p>
          Table loads existing answers from session cache. First two questions have previous
          answers:
        </p>
        <ul>
          <li><strong>Question 1:</strong> Previously answered "1" (correct) ✓</li>
          <li><strong>Question 2:</strong> Previously answered "3" (incorrect) ✗</li>
          <li><strong>Question 3:</strong> Not yet answered</li>
        </ul>
        <p><small>Validation styling is applied on load based on previous answers.</small></p>
        \${createMCQTableHTML()}
      </div>
    \`;
  }
}`,...l.parameters?.docs?.source},description:{story:`Story: Interactive Mode with Pre-filled Answers

Shows quiz table that loads existing answers from session cache.`,...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => {
    setupSession();

    // Listen for state changes and display them
    const stateDisplay = document.createElement('div');
    stateDisplay.id = 'state-display';
    stateDisplay.style.cssText = 'padding: 10px; margin: 10px 0; background: #f0f0f0; border-radius: 4px;';
    stateDisplay.innerHTML = '<strong>Current State:</strong> unstarted';
    document.addEventListener('qd:state-changed', ((event: CustomEvent) => {
      const {
        pageId,
        state
      } = event.detail as {
        pageId: string;
        state: string;
      };
      stateDisplay.innerHTML = \`<strong>Page \${pageId} State:</strong> \${state}\`;
    }) as EventListener);
    setTimeout(() => {
      const table = document.querySelector('table.qd-quiz') as HTMLTableElement;
      if (table) {
        enhanceQuizTable(table, {
          interactive: true,
          pageId: 'state-demo-page'
        });
      }
    }, 100);
    return html\`
      <div>
        <h2>State Progression Demo</h2>
        <p>Watch the state change as you answer questions:</p>
        <ul>
          <li><strong>Unstarted:</strong> No answers provided</li>
          <li>
            <strong>Incomplete:</strong> Some answered OR any incorrect (Answer Q1 with "2" to see)
          </li>
          <li>
            <strong>Complete:</strong> All answered AND all correct (Answer all correctly: 1, 2, 2)
          </li>
        </ul>
        \${stateDisplay} \${createMCQTableHTML()}
      </div>
    \`;
  }
}`,...c.parameters?.docs?.source},description:{story:`Story: State Progression Demo

Interactive demo showing state progression from unstarted → incomplete → complete`,...c.parameters?.docs?.description}}};const I=["NonInteractiveMode","InteractiveMCQ","InteractiveNumeric","WithExistingAnswers","StateProgression"];export{a as InteractiveMCQ,i as InteractiveNumeric,o as NonInteractiveMode,c as StateProgression,l as WithExistingAnswers,I as __namedExportsOrder,Q as default};
