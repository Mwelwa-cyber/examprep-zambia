import{r as j,j as e}from"./react-vendor-n1G6Tmhm.js";import{u as F}from"./index-CzMQLBpd.js";import{T as O,a as R,D as G,b as z,g as B}from"./teacherTools-D_7OE_oY.js";import{d as W}from"./lessonPlanToDocx-CE9Ax1zJ.js";import{u as I}from"./useFormDefaultsFromUrl-hyQF78O6.js";import"./router-vendor-m0NUYPg4.js";import"./vendor-DXGGfMZf.js";import"./firebase-vendor-CMGKOjez.js";import"./sanitize-vendor-DKgZpLtg.js";import"./icons-vendor-CY4OHkc8.js";const C="#059669";function U(t,i="CBC Lesson Plan"){if(!t)throw new Error("No lesson plan to export.");const s=window.open("","_blank","noopener,noreferrer,width=900,height=1100");if(!s)throw new Error("Your browser blocked the print window. Please allow pop-ups and try again.");const n=_(t,i);s.document.open(),s.document.write(n),s.document.close();const r=()=>{try{s.focus(),s.print()}catch{}};s.document.readyState==="complete"?setTimeout(r,120):s.addEventListener("load",()=>setTimeout(r,120))}function _(t,i){var m,b,f,y,x,N,v,p,d,w;const s=t.header||{},n=a=>a==null?"":H(String(a)),r=[["School",s.school],["Teacher",s.teacherName],["Date",s.date],["Time",s.time],["Duration",s.durationMinutes?`${s.durationMinutes} min`:""],["Class",s.class],["Subject",s.subject],["Topic",s.topic],["Sub-topic",s.subtopic],["Term & Week",s.termAndWeek],["Number of Pupils",s.numberOfPupils],["Medium",s.mediumOfInstruction]].filter(([,a])=>a!=null&&a!==""),l=a=>(a||[]).length?`<ul>${(a||[]).map(h=>`<li>${n(h)}</li>`).join("")}</ul>`:'<p class="muted">—</p>',S=a=>(a||[]).length?`<ol>${(a||[]).map(h=>`<li>${n(h)}</li>`).join("")}</ol>`:'<p class="muted">—</p>',u=(a,h)=>h?`
      <div class="phase">
        <h4>${n(a)}${h.durationMinutes?` <span class="mins">· ${n(h.durationMinutes)} min</span>`:""}</h4>
        <div class="phase-grid">
          <div>
            <p class="sub">Teacher activities</p>
            ${l(h.teacherActivities)}
          </div>
          <div>
            <p class="sub">Pupil activities</p>
            ${l(h.pupilActivities)}
          </div>
        </div>
      </div>
    `:"",$=(((m=t.lessonDevelopment)==null?void 0:m.development)||[]).map(a=>u(`Development — Step ${n(a.stepNumber)}: ${n(a.title)}`,a)).join(""),g=(t.references||[]).length?`<ul>${t.references.map(a=>`<li>${a.title?`${n(a.title)}${a.publisher?" — "+n(a.publisher):""}${a.year?" ("+n(a.year)+")":""}`:n(a)}</li>`).join("")}</ul>`:'<p class="muted">—</p>';return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${n(i)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:"Times New Roman",Georgia,serif;color:#0f172a;background:#fff;font-size:12pt;line-height:1.5}
  body{padding:24px 32px;max-width:210mm;margin:0 auto}
  h1{font-size:22pt;font-weight:800;color:${C};letter-spacing:-0.4px;border-bottom:3px solid ${C};padding-bottom:10px;margin-bottom:18px}
  h2{font-size:12pt;font-weight:800;color:${C};text-transform:uppercase;letter-spacing:0.8px;border-left:3px solid ${C};padding-left:9px;margin:18px 0 8px}
  h3{font-size:11pt;font-weight:700;color:#334155;margin:12px 0 4px}
  h4{font-size:11pt;font-weight:700;color:#0f172a;margin:12px 0 6px;border-bottom:1px dashed #cbd5e1;padding-bottom:4px}
  h4 .mins{color:#64748b;font-weight:500;font-size:10pt}
  p{margin:4px 0}
  p.muted{color:#94a3b8;font-style:italic}
  p.sub{font-size:10pt;font-weight:700;color:#475569;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px}
  ul,ol{margin:4px 0 4px 22px}
  li{margin:2px 0}
  table{width:100%;border-collapse:collapse;margin:4px 0 12px}
  th,td{border:1px solid #cbd5e1;padding:7px 10px;text-align:left;vertical-align:top;font-size:11pt}
  th{background:#f1f5f9;font-weight:700;width:36%;color:#334155}
  .columns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .phase{margin-bottom:14px;page-break-inside:avoid}
  .phase-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .masthead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;border-bottom:2px solid ${C};padding-bottom:10px}
  .brand{font-size:16pt;font-weight:800;color:${C}}
  .brand-sub{font-size:9pt;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px}
  .masthead-meta{font-size:9pt;color:#64748b;text-align:right}
  .reflection{font-style:italic;color:#64748b}
  @media print{
    body{padding:14mm 16mm;max-width:none}
    h2{page-break-after:avoid}
    .phase{page-break-inside:avoid}
  }
</style>
</head>
<body>
  <div class="masthead">
    <div>
      <div class="brand">ZedExams</div>
      <div class="brand-sub">Zambian CBC · Lesson Plan</div>
    </div>
    <div class="masthead-meta">
      ${new Date().toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric"})}
    </div>
  </div>

  <h1>${n(s.topic||"Lesson Plan")}</h1>

  <table>
    <tbody>
      ${r.map(([a,h])=>`<tr><th>${n(a)}</th><td>${n(h)}</td></tr>`).join("")}
    </tbody>
  </table>

  ${(b=t.specificOutcomes)!=null&&b.length?`<h2>Specific Outcomes</h2>${S(t.specificOutcomes)}`:""}

  <div class="columns">
    <div>
      <h3>Key Competencies</h3>
      ${l(t.keyCompetencies)}
    </div>
    <div>
      <h3>Values</h3>
      ${l(t.values)}
    </div>
    <div>
      <h3>Prerequisite Knowledge</h3>
      ${l(t.prerequisiteKnowledge)}
    </div>
  </div>

  <div class="two-col">
    <div>
      <h3>Teaching / Learning Materials</h3>
      ${l(t.teachingLearningMaterials)}
    </div>
    <div>
      <h3>References</h3>
      ${g}
    </div>
  </div>

  <h2>Lesson Development</h2>
  ${u("Introduction",(f=t.lessonDevelopment)==null?void 0:f.introduction)}
  ${$}
  ${u("Conclusion",(y=t.lessonDevelopment)==null?void 0:y.conclusion)}

  <div class="two-col">
    <div>
      <h2>Assessment</h2>
      <h3>Formative</h3>
      ${l((x=t.assessment)==null?void 0:x.formative)}
      ${(v=(N=t.assessment)==null?void 0:N.summative)!=null&&v.description?`
        <h3>Summative</h3>
        <p>${n(t.assessment.summative.description)}</p>
        ${t.assessment.summative.successCriteria?`<p class="muted"><strong>Success criteria:</strong> ${n(t.assessment.summative.successCriteria)}</p>`:""}
      `:""}
    </div>
    <div>
      <h2>Differentiation</h2>
      <h3>For struggling pupils</h3>
      ${l((p=t.differentiation)==null?void 0:p.forStruggling)}
      <h3>For advanced pupils</h3>
      ${l((d=t.differentiation)==null?void 0:d.forAdvanced)}
    </div>
  </div>

  ${(w=t.homework)!=null&&w.description?`
    <h2>Homework</h2>
    <p>${n(t.homework.description)}</p>
    ${t.homework.estimatedMinutes?`<p class="muted">Estimated time: ${n(t.homework.estimatedMinutes)} minutes</p>`:""}
  `:""}

  <h2>Teacher's Reflection</h2>
  <p class="reflection">— What went well? What will you improve next time? Which pupils need follow-up?</p>

</body>
</html>`}function H(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function he(){const{userProfile:t}=F(),i=I(),[s,n]=j.useState(()=>({grade:"G5",subject:"mathematics",topic:"",subtopic:"",durationMinutes:40,language:"english",teacherName:(t==null?void 0:t.displayName)||(t==null?void 0:t.fullName)||"",school:(t==null?void 0:t.schoolName)||"",numberOfPupils:40,instructions:"",...i})),[r,l]=j.useState("idle"),[S,u]=j.useState(""),[$,g]=j.useState(""),[m,b]=j.useState(null),[f,y]=j.useState(null),[x,N]=j.useState(null),[v,p]=j.useState("");function d(o,c){n(E=>({...E,[o]:c}))}async function w(o){if(o.preventDefault(),!s.topic.trim()){u("Please enter a topic."),l("error");return}l("generating"),u(""),g(""),p(""),b(null);const c=await B(s);if(!c.ok){l("error"),u(c.error),g([c.code&&`code: ${c.code}`,c.rawMessage&&`detail: ${c.rawMessage}`].filter(Boolean).join(" · "));return}b(c.data.lessonPlan),y(c.data.generationId),N(c.data.usage),p(c.data.warning||""),l("success")}function a(){if(!m)return;const o=te(s,m);W(m,o)}function h(){var o;if(m)try{const c=(o=m.header)!=null&&o.topic?`CBC Lesson Plan — ${m.header.topic}`:"CBC Lesson Plan";U(m,c)}catch(c){u((c==null?void 0:c.message)||"Could not open the print window."),l("success"),g(""),p((c==null?void 0:c.message)||"Could not open the print window.")}}return e.jsx("div",{className:"min-h-screen theme-bg p-4 sm:p-6 lg:p-8",children:e.jsxs("div",{className:"max-w-7xl mx-auto",children:[e.jsxs("header",{className:"mb-6",children:[e.jsx("h1",{className:"text-2xl sm:text-3xl font-black theme-text",children:"Lesson Plan Generator"}),e.jsx("p",{className:"text-sm theme-text-secondary mt-1",children:"Zambian CBC format — Specific Outcomes, Key Competencies, Values, three-phase body, Assessment, Differentiation."})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6",children:[e.jsxs("form",{onSubmit:w,className:"theme-card border theme-border rounded-2xl p-5 space-y-4 h-fit sticky top-4",children:[e.jsx(P,{label:"Grade",value:s.grade,options:O,onChange:o=>d("grade",o)}),e.jsx(P,{label:"Subject",value:s.subject,options:R,onChange:o=>d("subject",o)}),e.jsx(L,{label:"Topic *",placeholder:"e.g. Fractions",value:s.topic,onChange:o=>d("topic",o),maxLength:120}),e.jsx(L,{label:"Sub-topic (optional)",placeholder:"e.g. Adding Fractions with Unlike Denominators",value:s.subtopic,onChange:o=>d("subtopic",o),maxLength:160}),e.jsx(P,{label:"Lesson duration",value:String(s.durationMinutes),options:G.map(o=>({value:String(o.value),label:o.label})),onChange:o=>d("durationMinutes",Number(o))}),e.jsx(P,{label:"Medium of instruction",value:s.language,options:z,onChange:o=>d("language",o)}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(K,{label:"# of pupils",value:s.numberOfPupils,onChange:o=>d("numberOfPupils",o),min:1,max:200}),e.jsx(L,{label:"School",placeholder:"School name",value:s.school,onChange:o=>d("school",o),maxLength:120})]}),e.jsx(L,{label:"Teacher name",placeholder:"Mr / Mrs ...",value:s.teacherName,onChange:o=>d("teacherName",o),maxLength:80}),e.jsx(q,{label:"Extra instructions (optional)",placeholder:"e.g. Include a group activity. Emphasise real-life market examples.",value:s.instructions,onChange:o=>d("instructions",o),maxLength:500}),e.jsx("button",{type:"submit",disabled:r==="generating",className:"w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition",children:r==="generating"?"Generating…":"✨ Generate Lesson Plan"}),x&&e.jsxs("div",{className:"text-xs theme-text-secondary text-center",children:[x.used,"/",x.limit," used on the"," ",e.jsx("span",{className:"font-bold capitalize",children:x.plan})," plan this month"]})]}),e.jsxs("section",{className:"theme-card border theme-border rounded-2xl p-5 min-h-[400px]",children:[r==="idle"&&e.jsx(V,{}),r==="generating"&&e.jsx(Y,{}),r==="error"&&e.jsx(Z,{message:S,detail:$,onDismiss:()=>l("idle")}),r==="success"&&m&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 mb-5",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-black theme-text",children:"Your Lesson Plan"}),e.jsx("p",{className:"text-xs theme-text-secondary",children:"Review, edit in your document editor, and print for your head teacher."})]}),e.jsxs("div",{className:"flex gap-2 flex-wrap",children:[e.jsx("button",{onClick:h,title:"Opens the system print dialog — choose 'Save as PDF' as the destination",className:"inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border theme-border theme-card theme-text transition-all duration-fast ease-out shadow-elev-sm hover:-translate-y-px hover:border-[var(--accent)] hover:shadow-elev-md",children:"📑 Download PDF"}),e.jsx("button",{onClick:a,className:"inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black border theme-border theme-card theme-text transition-all duration-fast ease-out shadow-elev-sm hover:-translate-y-px hover:border-[var(--accent)] hover:shadow-elev-md",children:"📄 Download .docx"}),e.jsx("button",{onClick:()=>l("idle"),className:"inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-elev-sm shadow-elev-inner-hl transition-all duration-fast ease-out hover:-translate-y-px hover:shadow-elev-md",children:"✨ Generate Another"})]})]}),v&&e.jsxs("div",{className:"mb-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm",children:["⚠️ ",v]}),e.jsx(J,{plan:m}),f&&e.jsxs("div",{className:"mt-6 text-xs theme-text-secondary",children:["Saved as generation ",e.jsx("code",{children:f}),". Visit your Library to find it again."]})]})]})]})]})})}function M({children:t}){return e.jsx("label",{className:"block text-xs font-bold uppercase tracking-wide theme-text-secondary mb-1",children:t})}function L({label:t,value:i,onChange:s,placeholder:n,maxLength:r}){return e.jsxs("div",{children:[e.jsx(M,{children:t}),e.jsx("input",{type:"text",value:i,onChange:l=>s(l.target.value),placeholder:n,maxLength:r,className:"w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500"})]})}function K({label:t,value:i,onChange:s,min:n,max:r}){return e.jsxs("div",{children:[e.jsx(M,{children:t}),e.jsx("input",{type:"number",value:i,onChange:l=>s(Number(l.target.value)),min:n,max:r,className:"w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500"})]})}function q({label:t,value:i,onChange:s,placeholder:n,maxLength:r}){return e.jsxs("div",{children:[e.jsx(M,{children:t}),e.jsx("textarea",{value:i,onChange:l=>s(l.target.value),placeholder:n,maxLength:r,rows:3,className:"w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"})]})}function P({label:t,value:i,options:s,onChange:n}){return e.jsxs("div",{children:[e.jsx(M,{children:t}),e.jsx("select",{value:i,onChange:r=>n(r.target.value),className:"w-full px-3 py-2 rounded-lg border theme-border bg-transparent theme-text focus:outline-none focus:ring-2 focus:ring-emerald-500",children:s.map(r=>e.jsx("option",{value:r.value,children:r.label},r.value))})]})}function V(){return e.jsxs("div",{className:"flex flex-col items-center justify-center h-full py-12 text-center",children:[e.jsx("div",{className:"text-5xl mb-3",children:"📝"}),e.jsx("h3",{className:"text-lg font-black theme-text mb-1",children:"Ready when you are"}),e.jsx("p",{className:"text-sm theme-text-secondary max-w-md",children:"Fill in the grade, subject and topic on the left, then tap Generate. Your lesson plan will appear here — fully formatted in the Zambian CBC style."})]})}function Y(){return e.jsxs("div",{className:"flex flex-col items-center justify-center h-full py-12 text-center",children:[e.jsx("div",{className:"text-5xl mb-3 animate-bounce",children:"🧠"}),e.jsx("h3",{className:"text-lg font-black theme-text mb-1",children:"Writing your lesson plan…"}),e.jsx("p",{className:"text-sm theme-text-secondary max-w-md",children:"Usually takes 15–30 seconds. Please don't refresh the page."})]})}function Z({message:t,detail:i,onDismiss:s}){return e.jsxs("div",{className:"flex flex-col items-center justify-center h-full py-12 text-center",children:[e.jsx("div",{className:"text-5xl mb-3",children:"⚠️"}),e.jsx("h3",{className:"text-lg font-black theme-text mb-1",children:"Something went wrong"}),e.jsx("p",{className:"text-sm theme-text-secondary max-w-md mb-3",children:t}),i&&e.jsx("p",{className:"text-xs theme-text-secondary/70 max-w-md mb-4 font-mono break-all px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800",children:i}),e.jsx("button",{onClick:s,className:"px-4 py-2 rounded-xl text-sm font-bold border theme-border",children:"Try again"}),e.jsx("p",{className:"text-[10px] theme-text-secondary/60 mt-4 max-w-md",children:"See DEBUG_LESSON_PLAN.md in your project root for the diagnostic checklist."})]})}function J({plan:t}){var i,s,n,r,l,S,u,$,g,m,b,f,y,x,N,v,p,d,w;return e.jsxs("article",{className:"space-y-6 print:space-y-4",children:[e.jsx(Q,{header:t.header}),e.jsx(k,{title:"Specific Outcomes",children:e.jsx(X,{items:t.specificOutcomes})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsx(A,{title:"Key Competencies",items:t.keyCompetencies}),e.jsx(A,{title:"Values",items:t.values}),e.jsx(A,{title:"Prerequisite Knowledge",items:t.prerequisiteKnowledge})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsx(A,{title:"Teaching / Learning Materials",items:t.teachingLearningMaterials}),e.jsx(ee,{refs:t.references})]}),e.jsxs(k,{title:"Lesson Development",children:[e.jsx(T,{phase:"Introduction",minutes:(s=(i=t.lessonDevelopment)==null?void 0:i.introduction)==null?void 0:s.durationMinutes,teacher:(r=(n=t.lessonDevelopment)==null?void 0:n.introduction)==null?void 0:r.teacherActivities,pupils:(S=(l=t.lessonDevelopment)==null?void 0:l.introduction)==null?void 0:S.pupilActivities}),(((u=t.lessonDevelopment)==null?void 0:u.development)||[]).map(a=>e.jsx(T,{phase:`Development — Step ${a.stepNumber}: ${a.title}`,minutes:a.durationMinutes,teacher:a.teacherActivities,pupils:a.pupilActivities},a.stepNumber)),e.jsx(T,{phase:"Conclusion",minutes:(g=($=t.lessonDevelopment)==null?void 0:$.conclusion)==null?void 0:g.durationMinutes,teacher:(b=(m=t.lessonDevelopment)==null?void 0:m.conclusion)==null?void 0:b.teacherActivities,pupils:(y=(f=t.lessonDevelopment)==null?void 0:f.conclusion)==null?void 0:y.pupilActivities})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsx(k,{title:"Assessment",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold text-sm mb-1",children:"Formative"}),e.jsx(D,{items:(x=t.assessment)==null?void 0:x.formative})]}),((v=(N=t.assessment)==null?void 0:N.summative)==null?void 0:v.description)&&e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold text-sm mb-1",children:"Summative"}),e.jsx("p",{className:"text-sm theme-text",children:t.assessment.summative.description}),t.assessment.summative.successCriteria&&e.jsxs("p",{className:"text-xs theme-text-secondary mt-1",children:[e.jsx("span",{className:"font-bold",children:"Success criteria: "}),t.assessment.summative.successCriteria]})]})]})}),e.jsx(k,{title:"Differentiation",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold text-sm mb-1",children:"For struggling pupils"}),e.jsx(D,{items:(p=t.differentiation)==null?void 0:p.forStruggling})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold text-sm mb-1",children:"For advanced pupils"}),e.jsx(D,{items:(d=t.differentiation)==null?void 0:d.forAdvanced})]})]})})]}),((w=t.homework)==null?void 0:w.description)&&e.jsxs(k,{title:"Homework",children:[e.jsx("p",{className:"text-sm theme-text",children:t.homework.description}),t.homework.estimatedMinutes>0&&e.jsxs("p",{className:"text-xs theme-text-secondary mt-1",children:["Estimated time: ",t.homework.estimatedMinutes," minutes"]})]}),e.jsx(k,{title:"Teacher's Reflection (fill in after teaching)",children:e.jsx("div",{className:"text-sm theme-text-secondary italic",children:"— What went well? What will you improve next time? Which pupils need follow-up?"})})]})}function Q({header:t={}}){const i=[["School",t.school],["Teacher",t.teacherName],["Date",t.date],["Time",t.time],["Duration",t.durationMinutes?`${t.durationMinutes} min`:""],["Class",t.class],["Subject",t.subject],["Topic",t.topic],["Sub-topic",t.subtopic],["Term & Week",t.termAndWeek],["Number of Pupils",t.numberOfPupils],["Medium",t.mediumOfInstruction]].filter(([,s])=>s!=null&&s!=="");return e.jsx("div",{className:"rounded-xl border theme-border overflow-hidden",children:e.jsx("table",{className:"w-full text-sm",children:e.jsx("tbody",{children:i.map(([s,n],r)=>e.jsxs("tr",{className:r%2===0?"bg-slate-50/50 dark:bg-slate-900/20":"",children:[e.jsx("th",{className:"px-3 py-2 text-left font-bold theme-text w-1/3",children:s}),e.jsx("td",{className:"px-3 py-2 theme-text",children:String(n)})]},s))})})})}function k({title:t,children:i}){return e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-black theme-text mb-2 border-b theme-border pb-1",children:t}),i]})}function A({title:t,items:i}){return e.jsxs("div",{className:"rounded-xl border theme-border p-3",children:[e.jsx("h4",{className:"font-bold text-sm mb-2 theme-text",children:t}),e.jsx(D,{items:i})]})}function X({items:t}){return t!=null&&t.length?e.jsx("ol",{className:"list-decimal list-inside space-y-1 text-sm theme-text",children:t.map((i,s)=>e.jsx("li",{children:i},s))}):e.jsx("p",{className:"text-sm theme-text-secondary italic",children:"—"})}function D({items:t}){return t!=null&&t.length?e.jsx("ul",{className:"list-disc list-inside space-y-1 text-sm theme-text",children:t.map((i,s)=>e.jsx("li",{children:i},s))}):e.jsx("p",{className:"text-sm theme-text-secondary italic",children:"—"})}function ee({refs:t}){return e.jsxs("div",{className:"rounded-xl border theme-border p-3",children:[e.jsx("h4",{className:"font-bold text-sm mb-2 theme-text",children:"References"}),t!=null&&t.length?e.jsx("ul",{className:"space-y-1 text-sm theme-text",children:t.map((i,s)=>e.jsxs("li",{children:[e.jsx("span",{className:"font-bold",children:i.title}),i.publisher&&e.jsxs("span",{children:[" — ",i.publisher]}),i.pages&&e.jsxs("span",{className:"theme-text-secondary",children:[" (pp. ",i.pages,")"]})]},s))}):e.jsx("p",{className:"text-sm theme-text-secondary italic",children:"—"})]})}function T({phase:t,minutes:i,teacher:s=[],pupils:n=[]}){return e.jsxs("div",{className:"rounded-xl border theme-border overflow-hidden mb-3",children:[e.jsxs("div",{className:"px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b theme-border flex justify-between",children:[e.jsx("h4",{className:"font-bold text-sm theme-text",children:t}),i!=null&&e.jsxs("span",{className:"text-xs theme-text-secondary",children:[i," min"]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x theme-border",children:[e.jsxs("div",{className:"p-3",children:[e.jsx("h5",{className:"text-xs uppercase font-bold theme-text-secondary mb-2",children:"Teacher's Activities"}),e.jsx(D,{items:s})]}),e.jsxs("div",{className:"p-3",children:[e.jsx("h5",{className:"text-xs uppercase font-bold theme-text-secondary mb-2",children:"Pupils' Activities"}),e.jsx(D,{items:n})]})]})]})}function te(t,i){var r;const s=l=>String(l||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);return`${[s(t.teacherName||"teacher"),s(t.grade),s(t.subject),s(((r=i==null?void 0:i.header)==null?void 0:r.topic)||t.topic),new Date().toISOString().slice(0,10)].filter(Boolean).join("_")}.docx`}export{he as default};
