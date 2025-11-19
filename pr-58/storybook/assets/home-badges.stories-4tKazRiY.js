import{x as m}from"./lit-element-CSmQN0ht.js";import{i as s,g as b,S as d,s as g}from"./storage-helpers-B4dxqHb-.js";const c={red:"qd-badge-red",amber:"qd-badge-amber",green:"qd-badge-green"},x={unstarted:"red",incomplete:"amber",complete:"green"};function v(e,a){Object.values(c).forEach(o=>{e.classList.remove(o)});const t=x[a],n=c[t];e.classList.add(n)}function y(e,a){return!e||!a?.pages?"unstarted":a.pages[e]?.state??"unstarted"}function h(e){const a=e.getAttribute("data-page-id"),t=b(d.CACHE),n=y(a,t);v(e,n)}function f(){const e=document.querySelectorAll(".quizPageBtn"),a=b(d.CACHE),t=sessionStorage.getItem(d.INSTRUCTOR)==="true";if(!a||t){e.forEach(n=>{Object.values(c).forEach(o=>{n.classList.remove(o)})}),t?s(`Removed badge styling from ${e.length} page links (instructor mode)`):s(`Removed badge styling from ${e.length} page links (no session)`);return}e.forEach(n=>{h(n)}),s(`Updated ${e.length} page badges`)}function q(e){const a=e,{pageId:t}=a.detail,n=document.querySelector(`[data-page-id="${t}"]`);n&&n.classList.contains("quizPageBtn")&&(h(n),s(`Updated badge for page ${t}`))}function B(){s("Cache rebuilt, refreshing all badges"),f()}function S(){s("Logout detected, removing all badge styling");const e=document.querySelectorAll(".quizPageBtn");e.forEach(a=>{Object.values(c).forEach(t=>{a.classList.remove(t)})}),s(`Removed badge styling from ${e.length} page links`)}function k(e){const a=e.getAttribute("href");return a&&a.substring(a.lastIndexOf("/")+1).replace(/\.html?$/i,"")||null}function u(){document.querySelectorAll(".quizPageBtn").forEach(a=>{const t=k(a);t?(a.setAttribute("data-page-id",t),s(`Set data-page-id="${t}" for link: ${a.textContent?.trim()}`)):s(`Failed to extract pageId from href: ${a.getAttribute("href")}`)}),f(),document.addEventListener("qd:state-changed",q),document.addEventListener("qd:cache-rebuild",B),document.addEventListener("qd:logout",S),s("Home page badges enhanced with event listeners")}const E={title:"Enhancers/Home Badges",tags:["autodocs"],parameters:{docs:{description:{component:`
Home page badge enhancement applies R/A/G badges to navigation links based on quiz completion status.

**Badge Colors:**
- 🔴 Red: Unstarted (no answers provided)
- 🟠 Amber: Incomplete (some answered OR any incorrect)
- 🟢 Green: Complete (all answered AND all correct)

**Features:**
- Real-time updates via qd:state-changed events
- Handles missing cache gracefully
- Preserves existing link styling
        `}}}};function p(e){const a={totals:{total:0,answered:0,correct:0},pages:{}};return Object.entries(e).forEach(([t,n])=>{a.pages[t]={state:n,total:3,answered:n==="unstarted"?0:3,correct:n==="complete"?3:n==="incomplete"?1:0,answers:[]}}),a}const r={render:()=>{const e=p({"lesson-1":"complete","lesson-2":"incomplete","lesson-3":"unstarted"});return g(d.CACHE,e),setTimeout(()=>{u()},100),m`
      <style>
        .demo-nav {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .demo-nav h2 {
          margin-top: 0;
        }
        .demo-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .demo-nav li {
          margin: 10px 0;
        }
        .quizPageBtn {
          display: inline-block;
          padding: 10px 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          transition: all 0.3s;
        }
        .quizPageBtn:hover {
          border-color: #999;
          transform: translateX(5px);
        }
        .qd-badge-red {
          border-left: 6px solid #dc3545;
        }
        .qd-badge-amber {
          border-left: 6px solid #ffc107;
        }
        .qd-badge-green {
          border-left: 6px solid #28a745;
        }
        .badge-legend {
          margin-top: 30px;
          padding: 15px;
          background: white;
          border-radius: 4px;
        }
        .badge-legend h3 {
          margin-top: 0;
        }
        .legend-item {
          margin: 8px 0;
        }
        .legend-badge {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          margin-right: 10px;
        }
        .legend-badge.red {
          background: #dc3545;
        }
        .legend-badge.amber {
          background: #ffc107;
        }
        .legend-badge.green {
          background: #28a745;
        }
      </style>

      <div class="demo-nav">
        <h2>Course Navigation</h2>
        <p>Badges show completion status for each lesson:</p>
        <nav>
          <ul>
            <li>
              <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">
                Lesson 1: Basic Arithmetic
              </a>
            </li>
            <li>
              <a href="#lesson2" class="quizPageBtn" data-page-id="lesson-2">
                Lesson 2: Algebra Concepts
              </a>
            </li>
            <li>
              <a href="#lesson3" class="quizPageBtn" data-page-id="lesson-3">
                Lesson 3: Geometry Basics
              </a>
            </li>
          </ul>
        </nav>

        <div class="badge-legend">
          <h3>Badge Legend</h3>
          <div class="legend-item">
            <span class="legend-badge red"></span>
            <strong>Red:</strong> Unstarted (no answers provided)
          </div>
          <div class="legend-item">
            <span class="legend-badge amber"></span>
            <strong>Amber:</strong> Incomplete (some answered OR any incorrect)
          </div>
          <div class="legend-item">
            <span class="legend-badge green"></span>
            <strong>Green:</strong> Complete (all answered AND all correct)
          </div>
        </div>
      </div>
    `}},i={render:()=>{const e=p({"lesson-1":"unstarted"});g(d.CACHE,e),setTimeout(()=>{u()},100);const a=t=>{const n=p({"lesson-1":t});g(d.CACHE,n);const o=new CustomEvent("qd:state-changed",{detail:{pageId:"lesson-1",state:t}});document.dispatchEvent(o)};return m`
      <style>
        .demo-dynamic {
          padding: 20px;
        }
        .quizPageBtn {
          display: inline-block;
          padding: 15px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          font-size: 16px;
          margin: 20px 0;
        }
        .qd-badge-red {
          border-left: 8px solid #dc3545;
        }
        .qd-badge-amber {
          border-left: 8px solid #ffc107;
        }
        .qd-badge-green {
          border-left: 8px solid #28a745;
        }
        .controls {
          margin-top: 20px;
        }
        .controls button {
          padding: 10px 20px;
          margin-right: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-incomplete {
          background: #ffc107;
          color: #000;
        }
        .btn-complete {
          background: #28a745;
          color: white;
        }
      </style>

      <div class="demo-dynamic">
        <h2>Dynamic Badge Updates</h2>
        <p>Click buttons to simulate quiz completion and watch the badge update in real-time:</p>

        <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">
          Lesson 1: Mathematics Quiz
        </a>

        <div class="controls">
          <button class="btn-incomplete" @click="${()=>a("incomplete")}">
            Mark Incomplete
          </button>
          <button class="btn-complete" @click="${()=>a("complete")}">
            Mark Complete
          </button>
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          <em>Note: In the real application, state changes are triggered by quiz interactions.</em>
        </p>
      </div>
    `}},l={render:()=>(setTimeout(()=>{u()},100),m`
      <style>
        .demo-empty {
          padding: 20px;
        }
        .quizPageBtn {
          display: block;
          padding: 10px 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          margin: 10px 0;
          max-width: 300px;
        }
        .qd-badge-red {
          border-left: 6px solid #dc3545;
        }
      </style>

      <div class="demo-empty">
        <h2>Default Badge State</h2>
        <p>Pages without cached state show red badges (unstarted):</p>

        <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">Lesson 1</a>
        <a href="#lesson2" class="quizPageBtn" data-page-id="lesson-2">Lesson 2</a>
        <a href="#lesson3" class="quizPageBtn" data-page-id="lesson-3">Lesson 3</a>

        <p style="margin-top: 20px; color: #666;">
          Demonstrates default badge state for pages not yet in cache.
        </p>
      </div>
    `)};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Set up cache with different states
    const cache = createCacheWithStates({
      'lesson-1': 'complete',
      'lesson-2': 'incomplete',
      'lesson-3': 'unstarted'
    });
    setJSON(STORAGE_KEYS.CACHE, cache);

    // Enhance badges after DOM renders
    setTimeout(() => {
      enhanceHomeBadges();
    }, 100);
    return html\`
      <style>
        .demo-nav {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .demo-nav h2 {
          margin-top: 0;
        }
        .demo-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .demo-nav li {
          margin: 10px 0;
        }
        .quizPageBtn {
          display: inline-block;
          padding: 10px 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          transition: all 0.3s;
        }
        .quizPageBtn:hover {
          border-color: #999;
          transform: translateX(5px);
        }
        .qd-badge-red {
          border-left: 6px solid #dc3545;
        }
        .qd-badge-amber {
          border-left: 6px solid #ffc107;
        }
        .qd-badge-green {
          border-left: 6px solid #28a745;
        }
        .badge-legend {
          margin-top: 30px;
          padding: 15px;
          background: white;
          border-radius: 4px;
        }
        .badge-legend h3 {
          margin-top: 0;
        }
        .legend-item {
          margin: 8px 0;
        }
        .legend-badge {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          margin-right: 10px;
        }
        .legend-badge.red {
          background: #dc3545;
        }
        .legend-badge.amber {
          background: #ffc107;
        }
        .legend-badge.green {
          background: #28a745;
        }
      </style>

      <div class="demo-nav">
        <h2>Course Navigation</h2>
        <p>Badges show completion status for each lesson:</p>
        <nav>
          <ul>
            <li>
              <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">
                Lesson 1: Basic Arithmetic
              </a>
            </li>
            <li>
              <a href="#lesson2" class="quizPageBtn" data-page-id="lesson-2">
                Lesson 2: Algebra Concepts
              </a>
            </li>
            <li>
              <a href="#lesson3" class="quizPageBtn" data-page-id="lesson-3">
                Lesson 3: Geometry Basics
              </a>
            </li>
          </ul>
        </nav>

        <div class="badge-legend">
          <h3>Badge Legend</h3>
          <div class="legend-item">
            <span class="legend-badge red"></span>
            <strong>Red:</strong> Unstarted (no answers provided)
          </div>
          <div class="legend-item">
            <span class="legend-badge amber"></span>
            <strong>Amber:</strong> Incomplete (some answered OR any incorrect)
          </div>
          <div class="legend-item">
            <span class="legend-badge green"></span>
            <strong>Green:</strong> Complete (all answered AND all correct)
          </div>
        </div>
      </div>
    \`;
  }
}`,...r.parameters?.docs?.source},description:{story:`Story: All Badge States

Shows navigation links with all three badge states.`,...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Initialize with all unstarted
    const cache = createCacheWithStates({
      'lesson-1': 'unstarted'
    });
    setJSON(STORAGE_KEYS.CACHE, cache);

    // Enhance badges
    setTimeout(() => {
      enhanceHomeBadges();
    }, 100);

    // Helper to update state
    const updateState = (state: 'incomplete' | 'complete') => {
      const cache = createCacheWithStates({
        'lesson-1': state
      });
      setJSON(STORAGE_KEYS.CACHE, cache);

      // Emit state changed event
      const event = new CustomEvent('qd:state-changed', {
        detail: {
          pageId: 'lesson-1',
          state
        }
      });
      document.dispatchEvent(event);
    };
    return html\`
      <style>
        .demo-dynamic {
          padding: 20px;
        }
        .quizPageBtn {
          display: inline-block;
          padding: 15px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          font-size: 16px;
          margin: 20px 0;
        }
        .qd-badge-red {
          border-left: 8px solid #dc3545;
        }
        .qd-badge-amber {
          border-left: 8px solid #ffc107;
        }
        .qd-badge-green {
          border-left: 8px solid #28a745;
        }
        .controls {
          margin-top: 20px;
        }
        .controls button {
          padding: 10px 20px;
          margin-right: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-incomplete {
          background: #ffc107;
          color: #000;
        }
        .btn-complete {
          background: #28a745;
          color: white;
        }
      </style>

      <div class="demo-dynamic">
        <h2>Dynamic Badge Updates</h2>
        <p>Click buttons to simulate quiz completion and watch the badge update in real-time:</p>

        <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">
          Lesson 1: Mathematics Quiz
        </a>

        <div class="controls">
          <button class="btn-incomplete" @click="\${() => updateState('incomplete')}">
            Mark Incomplete
          </button>
          <button class="btn-complete" @click="\${() => updateState('complete')}">
            Mark Complete
          </button>
        </div>

        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          <em>Note: In the real application, state changes are triggered by quiz interactions.</em>
        </p>
      </div>
    \`;
  }
}`,...i.parameters?.docs?.source},description:{story:`Story: Dynamic Badge Updates

Demonstrates real-time badge updates when state changes.
Includes buttons to simulate state transitions.`,...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => {
    // NOTE: Do NOT clear cache - demonstrates default state for uncached pages

    setTimeout(() => {
      enhanceHomeBadges();
    }, 100);
    return html\`
      <style>
        .demo-empty {
          padding: 20px;
        }
        .quizPageBtn {
          display: block;
          padding: 10px 15px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          margin: 10px 0;
          max-width: 300px;
        }
        .qd-badge-red {
          border-left: 6px solid #dc3545;
        }
      </style>

      <div class="demo-empty">
        <h2>Default Badge State</h2>
        <p>Pages without cached state show red badges (unstarted):</p>

        <a href="#lesson1" class="quizPageBtn" data-page-id="lesson-1">Lesson 1</a>
        <a href="#lesson2" class="quizPageBtn" data-page-id="lesson-2">Lesson 2</a>
        <a href="#lesson3" class="quizPageBtn" data-page-id="lesson-3">Lesson 3</a>

        <p style="margin-top: 20px; color: #666;">
          Demonstrates default badge state for pages not yet in cache.
        </p>
      </div>
    \`;
  }
}`,...l.parameters?.docs?.source},description:{story:`Story: Empty Cache Handling

Shows how badges behave for pages not in cache.
Links without cached state display red badges (unstarted).`,...l.parameters?.docs?.description}}};const z=["AllBadgeStates","DynamicUpdates","EmptyCache"];export{r as AllBadgeStates,i as DynamicUpdates,l as EmptyCache,z as __namedExportsOrder,E as default};
