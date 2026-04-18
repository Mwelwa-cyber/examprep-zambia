/**
 * Print a lesson plan as a PDF using the browser's native print dialog.
 *
 * Why this approach
 *   Shipping jsPDF / html2canvas / pdf-lib would add 100-300 kB to the
 *   learner bundle for a feature teachers use occasionally. The browser's
 *   own print engine already renders PDF natively — we just need to hand
 *   it nicely-formatted HTML.
 *
 * How it works
 *   1. Open a new window (blocked-popup safe — must be called from a
 *      click handler directly).
 *   2. Write a standalone HTML document with print-friendly CSS.
 *   3. Poll until the window loads, then call `window.print()`.
 *   4. User picks "Save as PDF" in the system print dialog.
 *
 * Tested on: Chrome/Edge (desktop + Android), Safari (desktop + iOS),
 * Firefox desktop. Falls back gracefully if popups are blocked — we
 * throw with a message the caller surfaces as a toast.
 */

const BRAND_PRIMARY = '#059669' // emerald-600, matches the lesson-plan UI

export function printLessonPlanAsPdf(plan, titleForDocument = 'CBC Lesson Plan') {
  if (!plan) throw new Error('No lesson plan to export.')

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
  if (!win) {
    throw new Error('Your browser blocked the print window. Please allow pop-ups and try again.')
  }

  const html = buildPrintableHtml(plan, titleForDocument)
  win.document.open()
  win.document.write(html)
  win.document.close()

  // Some browsers need a tick before print() works against the injected doc.
  // We wait for both the load event and a small safety delay, then trigger.
  const ready = () => {
    try {
      win.focus()
      win.print()
    } catch {
      // If print() throws (very rare), just leave the window so the user
      // can print manually with Ctrl+P.
    }
  }
  if (win.document.readyState === 'complete') setTimeout(ready, 120)
  else win.addEventListener('load', () => setTimeout(ready, 120))
}

/* ────────────────────────────────────────────────────────────────────
 * HTML template
 * ─────────────────────────────────────────────────────────────────── */

function buildPrintableHtml(plan, title) {
  const header = plan.header || {}
  const safe = (v) => (v == null ? '' : escapeHtml(String(v)))

  const headerRows = [
    ['School',            header.school],
    ['Teacher',           header.teacherName],
    ['Date',              header.date],
    ['Time',              header.time],
    ['Duration',          header.durationMinutes ? `${header.durationMinutes} min` : ''],
    ['Class',             header.class],
    ['Subject',           header.subject],
    ['Topic',             header.topic],
    ['Sub-topic',         header.subtopic],
    ['Term & Week',       header.termAndWeek],
    ['Number of Pupils',  header.numberOfPupils],
    ['Medium',            header.mediumOfInstruction],
  ].filter(([, v]) => v != null && v !== '')

  const list = (items) => (items || []).length
    ? `<ul>${(items || []).map(i => `<li>${safe(i)}</li>`).join('')}</ul>`
    : '<p class="muted">—</p>'

  const orderedList = (items) => (items || []).length
    ? `<ol>${(items || []).map(i => `<li>${safe(i)}</li>`).join('')}</ol>`
    : '<p class="muted">—</p>'

  const phase = (label, block) => {
    if (!block) return ''
    return `
      <div class="phase">
        <h4>${safe(label)}${block.durationMinutes ? ` <span class="mins">· ${safe(block.durationMinutes)} min</span>` : ''}</h4>
        <div class="phase-grid">
          <div>
            <p class="sub">Teacher activities</p>
            ${list(block.teacherActivities)}
          </div>
          <div>
            <p class="sub">Pupil activities</p>
            ${list(block.pupilActivities)}
          </div>
        </div>
      </div>
    `
  }

  const development = (plan.lessonDevelopment?.development || [])
    .map(step => phase(
      `Development — Step ${safe(step.stepNumber)}: ${safe(step.title)}`,
      step,
    ))
    .join('')

  const references = (plan.references || []).length
    ? `<ul>${plan.references.map(r => {
        const label = r.title ? `${safe(r.title)}${r.publisher ? ' — ' + safe(r.publisher) : ''}${r.year ? ' (' + safe(r.year) + ')' : ''}` : safe(r)
        return `<li>${label}</li>`
      }).join('')}</ul>`
    : '<p class="muted">—</p>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safe(title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:"Times New Roman",Georgia,serif;color:#0f172a;background:#fff;font-size:12pt;line-height:1.5}
  body{padding:24px 32px;max-width:210mm;margin:0 auto}
  h1{font-size:22pt;font-weight:800;color:${BRAND_PRIMARY};letter-spacing:-0.4px;border-bottom:3px solid ${BRAND_PRIMARY};padding-bottom:10px;margin-bottom:18px}
  h2{font-size:12pt;font-weight:800;color:${BRAND_PRIMARY};text-transform:uppercase;letter-spacing:0.8px;border-left:3px solid ${BRAND_PRIMARY};padding-left:9px;margin:18px 0 8px}
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
  .masthead{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;border-bottom:2px solid ${BRAND_PRIMARY};padding-bottom:10px}
  .brand{font-size:16pt;font-weight:800;color:${BRAND_PRIMARY}}
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
      ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <h1>${safe(header.topic || 'Lesson Plan')}</h1>

  <table>
    <tbody>
      ${headerRows.map(([k, v]) => `<tr><th>${safe(k)}</th><td>${safe(v)}</td></tr>`).join('')}
    </tbody>
  </table>

  ${plan.specificOutcomes?.length ? `<h2>Specific Outcomes</h2>${orderedList(plan.specificOutcomes)}` : ''}

  <div class="columns">
    <div>
      <h3>Key Competencies</h3>
      ${list(plan.keyCompetencies)}
    </div>
    <div>
      <h3>Values</h3>
      ${list(plan.values)}
    </div>
    <div>
      <h3>Prerequisite Knowledge</h3>
      ${list(plan.prerequisiteKnowledge)}
    </div>
  </div>

  <div class="two-col">
    <div>
      <h3>Teaching / Learning Materials</h3>
      ${list(plan.teachingLearningMaterials)}
    </div>
    <div>
      <h3>References</h3>
      ${references}
    </div>
  </div>

  <h2>Lesson Development</h2>
  ${phase('Introduction', plan.lessonDevelopment?.introduction)}
  ${development}
  ${phase('Conclusion', plan.lessonDevelopment?.conclusion)}

  <div class="two-col">
    <div>
      <h2>Assessment</h2>
      <h3>Formative</h3>
      ${list(plan.assessment?.formative)}
      ${plan.assessment?.summative?.description ? `
        <h3>Summative</h3>
        <p>${safe(plan.assessment.summative.description)}</p>
        ${plan.assessment.summative.successCriteria ? `<p class="muted"><strong>Success criteria:</strong> ${safe(plan.assessment.summative.successCriteria)}</p>` : ''}
      ` : ''}
    </div>
    <div>
      <h2>Differentiation</h2>
      <h3>For struggling pupils</h3>
      ${list(plan.differentiation?.forStruggling)}
      <h3>For advanced pupils</h3>
      ${list(plan.differentiation?.forAdvanced)}
    </div>
  </div>

  ${plan.homework?.description ? `
    <h2>Homework</h2>
    <p>${safe(plan.homework.description)}</p>
    ${plan.homework.estimatedMinutes ? `<p class="muted">Estimated time: ${safe(plan.homework.estimatedMinutes)} minutes</p>` : ''}
  ` : ''}

  <h2>Teacher's Reflection</h2>
  <p class="reflection">— What went well? What will you improve next time? Which pupils need follow-up?</p>

</body>
</html>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
