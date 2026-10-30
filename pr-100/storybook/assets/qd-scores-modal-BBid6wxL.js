import{i as p,a as f,x as a}from"./lit-element-DR9D0stx.js";import{n as i,t as m}from"./property-BRFVFa-w.js";import"./qd-modal-Co8ngVCc.js";import{r as h}from"./dom-config-reader-DImSGrCl.js";function u(e){return e?Object.values(e.cells).filter(t=>t.trim()!=="").length:0}function g(e){let t=0,o=0,n=0;for(const s of Object.values(e.pages))for(const r of s.answers??[])!r||r.answer.trim()===""||(r.firstSuccess===void 0?n++:(t++,r.firstSuccess&&o++));return{tracked:t,correctFirstTime:o,untracked:n}}var x=Object.defineProperty,w=Object.getOwnPropertyDescriptor,l=(e,t,o,n)=>{for(var s=n>1?void 0:n?w(t,o):t,r=e.length-1,c;r>=0;r--)(c=e[r])&&(s=(n?c(t,o,s):c(s))||s);return n&&s&&x(t,o,s),s};let d=class extends f{constructor(){super(...arguments),this.open=!1,this.students=[],this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}render(){return a`
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
          .scores-content .analysis-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            background: #e8eaf6;
            color: #283593;
          }

          .scores-content .no-answers {
            color: #999;
            font-style: italic;
            font-size: 11px;
          }
        </style>
        <div class="scores-content">
          ${this.students.length===0?a`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const e=[...this.students].sort((t,o)=>t.name.localeCompare(o.name));return a`
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Service ID</th>
            <th>Answered</th>
            <th>Correct</th>
            <th>Right first time</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          ${e.map(t=>this.renderStudentRow(t))}
        </tbody>
      </table>
    `}renderStudentRow(e){const t=this.calculateSummary(e),o=Object.entries(e.pages);return a`
      <tr class="student-row">
        <td>${t.name}</td>
        <td>${t.serviceId}</td>
        <td>${this.answeredText(t.attempted)}</td>
        <td class=${this.getScoreClass(t)}>
          ${t.attempted>0?`${t.correct} (${t.percentage}% of answered)`:"0"}
        </td>
        <td>${this.firstTimeText(e)}</td>
        <td>
          ${o.length===0?a`<span class="no-answers">—</span>`:a`
                <div class="answers-cell">
                  ${o.map(([n,s])=>a`
                      <div class="page-row">
                        <span class="page-name">${n}</span>
                        <div class="page-answers">
                          ${s.analysis?a`<span class="analysis-badge"
                                >${this.analysisSummary(s.analysis)}</span
                              >`:""}
                          ${s.answers.map((r,c)=>a`
                              <span
                                class="answer-badge ${r?.success?"correct":"incorrect"}"
                              >
                                Q${c+1}:
                                ${r?.answer??"—"}${r?.attempts&&r.attempts>1?` (${r.attempts} tries)`:""}
                              </span>
                            `)}
                        </div>
                      </div>
                    `)}
                </div>
              `}
        </td>
      </tr>
    `}analysisSummary(e){const t=u(e);return e.totalCells!==void 0?`Analysis: ${t} of ${e.totalCells} cells`:`Analysis: ${t} cell${t===1?"":"s"}`}answeredText(e){const t=h();return t!==void 0?`${e} of ${t}`:String(e)}firstTimeText(e){const{tracked:t,correctFirstTime:o,untracked:n}=g(e);if(t===0)return"–";const s=`${o} of ${t}`;return n>0?`${s} (${n} older answer${n===1?"":"s"} –)`:s}getScoreClass(e){return e.attempted===0?"":e.percentage===100?"score-perfect":e.percentage===0?"score-zero":""}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}show(){this.open=!0}close(){this.open=!1}};d.styles=p`
    :host {
      display: contents;
    }
  `;l([i({type:Boolean,reflect:!0})],d.prototype,"open",2);l([i({type:Array})],d.prototype,"students",2);d=l([m("qd-scores-modal")],d);export{u as c};
