/**
 * Converts a validated lesson-plan JSON object into a Word (.docx) file
 * formatted the way a Zambian head teacher expects: bordered tables for the
 * header, clearly labelled sections, parallel Teacher's / Pupils' Activities
 * columns for each lesson-development phase.
 *
 * Uses `docx` (npm install docx) and `file-saver` (optional — falls back to
 * an anchor-click download if file-saver isn't installed).
 *
 *   npm install docx
 *   (optional) npm install file-saver
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

const CELL_BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  left:   { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  right:  { style: BorderStyle.SINGLE, size: 4, color: '888888' },
}

function text(str, opts = {}) {
  return new TextRun({ text: str == null ? '' : String(str), ...opts })
}

function para(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: { after: 120 },
    ...opts,
  })
}

function h1(str) {
  return new Paragraph({
    children: [text(str, { bold: true, size: 32 })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  })
}

function h2(str) {
  return new Paragraph({
    children: [text(str, { bold: true, size: 24, color: '1f2937' })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
  })
}

function labelCell(label, widthPct = 30) {
  return new TableCell({
    children: [para(text(label, { bold: true, size: 20 }))],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDER,
    shading: { fill: 'f3f4f6' },
  })
}

function valueCell(value, widthPct = 70) {
  return new TableCell({
    children: [para(text(value, { size: 20 }))],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDER,
  })
}

function bulletList(items = []) {
  if (!items?.length) return [para(text('—', { italics: true, color: '9ca3af' }))]
  return items.map((line) =>
    new Paragraph({
      children: [text(line, { size: 20 })],
      bullet: { level: 0 },
      spacing: { after: 60 },
    }),
  )
}

function numberedList(items = []) {
  if (!items?.length) return [para(text('—', { italics: true, color: '9ca3af' }))]
  return items.map((line, i) =>
    new Paragraph({
      children: [text(`${i + 1}. `, { bold: true, size: 20 }), text(line, { size: 20 })],
      spacing: { after: 60 },
    }),
  )
}

function headerTable(header = {}) {
  const rows = [
    ['School', header.school],
    ['Teacher', header.teacherName],
    ['Date', header.date],
    ['Time', header.time],
    ['Duration', header.durationMinutes ? `${header.durationMinutes} minutes` : ''],
    ['Class', header.class],
    ['Subject', header.subject],
    ['Topic', header.topic],
    ['Sub-topic', header.subtopic],
    ['Term & Week', header.termAndWeek],
    ['Number of Pupils', header.numberOfPupils],
    ['Medium of Instruction', header.mediumOfInstruction],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '')

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => new TableRow({
      children: [labelCell(k), valueCell(String(v))],
    })),
  })
}

function phaseTable(phase, minutes, teacher = [], pupils = []) {
  const title = minutes != null ? `${phase} (${minutes} minutes)` : phase

  const titleRow = new TableRow({
    children: [
      new TableCell({
        children: [para(text(title, { bold: true, size: 22 }))],
        columnSpan: 2,
        borders: CELL_BORDER,
        shading: { fill: 'e0e7ff' },
      }),
    ],
  })

  const headersRow = new TableRow({
    children: [
      new TableCell({
        children: [para(text("Teacher's Activities", { bold: true, size: 20 }))],
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'f9fafb' },
      }),
      new TableCell({
        children: [para(text("Pupils' Activities", { bold: true, size: 20 }))],
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'f9fafb' },
      }),
    ],
  })

  const contentRow = new TableRow({
    children: [
      new TableCell({ children: bulletList(teacher), borders: CELL_BORDER }),
      new TableCell({ children: bulletList(pupils), borders: CELL_BORDER }),
    ],
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [titleRow, headersRow, contentRow],
  })
}

function referencesBlock(refs = []) {
  if (!refs.length) return bulletList([])
  return refs.map((r) => new Paragraph({
    children: [
      text(r.title || '', { bold: true, size: 20 }),
      text(r.publisher ? ` — ${r.publisher}` : '', { size: 20 }),
      text(r.pages ? ` (pp. ${r.pages})` : '', { size: 20, italics: true, color: '6b7280' }),
    ],
    bullet: { level: 0 },
    spacing: { after: 60 },
  }))
}

/**
 * Build a docx Document from a lesson plan JSON object.
 */
export function buildLessonPlanDocument(plan) {
  const children = []

  children.push(h1('LESSON PLAN'))
  children.push(headerTable(plan.header || {}))

  children.push(h2('Specific Outcomes'))
  children.push(...numberedList(plan.specificOutcomes))

  children.push(h2('Key Competencies'))
  children.push(...bulletList(plan.keyCompetencies))

  children.push(h2('Values'))
  children.push(...bulletList(plan.values))

  children.push(h2('Prerequisite Knowledge'))
  children.push(...bulletList(plan.prerequisiteKnowledge))

  children.push(h2('Teaching / Learning Materials'))
  children.push(...bulletList(plan.teachingLearningMaterials))

  if (plan.references?.length) {
    children.push(h2('References'))
    children.push(...referencesBlock(plan.references))
  }

  children.push(h2('Lesson Development'))

  const intro = plan.lessonDevelopment?.introduction || {}
  children.push(phaseTable(
    'Introduction',
    intro.durationMinutes,
    intro.teacherActivities,
    intro.pupilActivities,
  ))
  children.push(para([]))

  for (const step of plan.lessonDevelopment?.development || []) {
    children.push(phaseTable(
      `Development — Step ${step.stepNumber}: ${step.title}`,
      step.durationMinutes,
      step.teacherActivities,
      step.pupilActivities,
    ))
    children.push(para([]))
  }

  const concl = plan.lessonDevelopment?.conclusion || {}
  children.push(phaseTable(
    'Conclusion',
    concl.durationMinutes,
    concl.teacherActivities,
    concl.pupilActivities,
  ))

  children.push(h2('Assessment'))
  children.push(para(text('Formative:', { bold: true, size: 20 })))
  children.push(...bulletList(plan.assessment?.formative))
  if (plan.assessment?.summative?.description) {
    children.push(para(text('Summative:', { bold: true, size: 20 })))
    children.push(para(text(plan.assessment.summative.description, { size: 20 })))
    if (plan.assessment.summative.successCriteria) {
      children.push(para([
        text('Success criteria: ', { bold: true, size: 20 }),
        text(plan.assessment.summative.successCriteria, { size: 20 }),
      ]))
    }
  }

  children.push(h2('Differentiation'))
  children.push(para(text('For struggling pupils:', { bold: true, size: 20 })))
  children.push(...bulletList(plan.differentiation?.forStruggling))
  children.push(para(text('For advanced pupils:', { bold: true, size: 20 })))
  children.push(...bulletList(plan.differentiation?.forAdvanced))

  if (plan.homework?.description) {
    children.push(h2('Homework'))
    children.push(para(text(plan.homework.description, { size: 20 })))
    if (plan.homework.estimatedMinutes > 0) {
      children.push(para(text(
        `Estimated time: ${plan.homework.estimatedMinutes} minutes`,
        { size: 18, italics: true, color: '6b7280' },
      )))
    }
  }

  children.push(h2("Teacher's Reflection"))
  children.push(para(text('What went well?', { bold: true, size: 20 })))
  children.push(para(text('__________________________________________________', { size: 20 })))
  children.push(para(text('What to improve next time?', { bold: true, size: 20 })))
  children.push(para(text('__________________________________________________', { size: 20 })))
  children.push(para(text('Pupils who need follow-up:', { bold: true, size: 20 })))
  children.push(para(text('__________________________________________________', { size: 20 })))

  return new Document({
    creator: 'zedexams.com',
    title: `Lesson Plan — ${plan.header?.subject || ''} — ${plan.header?.topic || ''}`,
    description: 'Generated by ZedExams Teacher Tools',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 20 } },
      },
    },
    sections: [{ children }],
  })
}

/**
 * Trigger a browser download of the .docx.
 */
export async function downloadLessonPlanDocx(plan, filename = 'lesson-plan.docx') {
  const doc = buildLessonPlanDocument(plan)
  const blob = await Packer.toBlob(doc)

  // Try file-saver first (nicer cross-browser UX), fall back to anchor click.
  try {
    const { saveAs } = await import('file-saver')
    saveAs(blob, filename)
    return
  } catch {
    // fall through
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
