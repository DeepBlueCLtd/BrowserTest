import{i,a as h,x as o}from"./lit-element-DR9D0stx.js";import{n as l,t as g}from"./property-BRFVFa-w.js";import"./qd-modal-Co8ngVCc.js";var m=Object.defineProperty,f=Object.getOwnPropertyDescriptor,p=(e,t,r,n)=>{for(var s=n>1?void 0:n?f(t,r):t,a=e.length-1,c;a>=0;a--)(c=e[a])&&(s=(n?c(t,r,s):c(s))||s);return n&&s&&m(t,r,s),s};let d=class extends h{constructor(){super(...arguments),this.open=!1,this.students=[],this.handleModalClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("close"))}}render(){return o`
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
          .scores-content .no-answers {
            color: #999;
            font-style: italic;
            font-size: 11px;
          }
        </style>
        <div class="scores-content">
          ${this.students.length===0?o`<p class="empty-message">No student data available.</p>`:this.renderScoresTable()}
        </div>
      </qd-modal>
    `}renderScoresTable(){const e=[...this.students].sort((t,r)=>t.name.localeCompare(r.name));return o`
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Service ID</th>
            <th>Score</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          ${e.map(t=>this.renderStudentRow(t))}
        </tbody>
      </table>
    `}renderStudentRow(e){const t=this.calculateSummary(e),r=Object.entries(e.pages);return o`
      <tr class="student-row">
        <td>${t.name}</td>
        <td>${t.serviceId}</td>
        <td class=${this.getScoreClass(t)}>
          ${t.correct}/${t.attempted} (${t.percentage}%)
        </td>
        <td>
          ${r.length===0?o`<span class="no-answers">—</span>`:o`
                <div class="answers-cell">
                  ${r.map(([n,s])=>o`
                      <div class="page-row">
                        <span class="page-name">${n}</span>
                        <div class="page-answers">
                          ${s.answers.map((a,c)=>o`
                              <span
                                class="answer-badge ${a?.success?"correct":"incorrect"}"
                              >
                                Q${c+1}: ${a?.answer??"—"}
                              </span>
                            `)}
                        </div>
                      </div>
                    `)}
                </div>
              `}
        </td>
      </tr>
    `}getScoreClass(e){return e.attempted===0?"":e.percentage===100?"score-perfect":e.percentage===0?"score-zero":""}calculateSummary(e){const t=e.attempted>0?Math.round(e.correct/e.attempted*100):0;return{serviceId:e.serviceId,name:e.name,attempted:e.attempted,correct:e.correct,percentage:t}}show(){this.open=!0}close(){this.open=!1}};d.styles=i`
    :host {
      display: contents;
    }
  `;p([l({type:Boolean,reflect:!0})],d.prototype,"open",2);p([l({type:Array})],d.prototype,"students",2);d=p([g("qd-scores-modal")],d);
