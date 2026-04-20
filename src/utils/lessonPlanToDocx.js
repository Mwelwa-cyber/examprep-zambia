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
  const hasAttendance =
    header.boysPresent != null || header.girlsPresent != null || header.totalPupils != null
  const attendance = hasAttendance
    ? `${header.boysPresent ?? '—'} boys · ${header.girlsPresent ?? '—'} girls · Total: ${header.totalPupils ?? header.numberOfPupils ?? '—'}`
    : header.numberOfPupils
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
    ['Attendance', attendance],
    ['Medium of Instruction', header.mediumOfInstruction],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '')

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => new TableRow({
      children: [labelCell(k), valueCell(String(v))],
    })),
  })
}

function phaseTableV2(phase, minutes, teacher = [], learners = [], criteria = []) {
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
        children: [para(text('Teacher Activities', { bold: true, size: 20 }))],
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'f9fafb' },
      }),
      new TableCell({
        children: [para(text('Learner Activities', { bold: true, size: 20 }))],
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'f9fafb' },
      }),
    ],
  })
  const contentRow = new TableRow({
    children: [
      new TableCell({ children: bulletList(teacher), borders: CELL_BORDER }),
      new TableCell({ children: bulletList(learners), borders: CELL_BORDER }),
    ],
  })
  const criteriaRow = criteria && criteria.length > 0 ? new TableRow({
    children: [
      new TableCell({
        children: [
          para(text('Assessment Criteria:', { bold: true, size: 20 })),
          ...bulletList(criteria),
        ],
        columnSpan: 2,
        borders: CELL_BORDER,
        shading: { fill: 'fef3c7' },
      }),
    ],
  }) : null
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: criteriaRow ? [titleRow, headersRow, contentRow, criteriaRow] : [titleRow, headersRow, contentRow],
  })
}

function interdisciplinaryTable(connections = []) {
  if (!connections.length) return null
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [para(text('Subject', { bold: true, size: 20 }))],
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'f3f4f6' },
      }),
      new TableCell({
        children: [para(text('How the concept connects', { bold: true, size: 20 }))],
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: CELL_BORDER,
        shading: { fill: 'f3f4f6' },
      }),
    ],
  })
  const bodyRows = connections.map((c) => new TableRow({
    children: [
      new TableCell({ children: [para(text(c.subject || '', { bold: true, size: 20 }))], borders: CELL_BORDER }),
      new TableCell({ children: [para(text(c.connection || '', { size: 20 }))], borders: CELL_BORDER }),
    ],
  }))
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
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

function buildV2Body(plan) {
  const children = []
  children.push(headerTable(plan.header || {}))

  if (plan.lessonGoal) {
    children.push(h2('Lesson Goal (SMART)'))
    children.push(para(text(plan.lessonGoal, { size: 20 })))
  }

  children.push(h2('Competences'))
  if (plan.broadCompetences?.length) {
    children.push(para(text('Broad Competences:', { bold: true, size: 20 })))
    children.push(...bulletList(plan.broadCompetences))
  }
  if (plan.expectedTargetCompetence) {
    children.push(para(text('Expected Target Competence:', { bold: true, size: 20 })))
    children.push(para(text(plan.expectedTargetCompetence, { size: 20 })))
  }
  const lc = plan.lessonCompetencies || {}
  if (lc.competency1 || lc.competency2 || lc.competency3) {
    children.push(para(text('Lesson Competencies:', { bold: true, size: 20 })))
    const lcItems = [
      lc.competency1 && `Higher-order thinking — ${lc.competency1}`,
      lc.competency2 && `Thinking process — ${lc.competency2}`,
      lc.competency3 && `Tangible output — ${lc.competency3}`,
    ].filter(Boolean)
    children.push(...numberedList(lcItems))
  }

  const m = plan.methodology || {}
  if (m.approach || m.strategies?.length) {
    children.push(h2('Methodology and Strategies'))
    if (m.approach) {
      children.push(para([
        text('Approach: ', { bold: true, size: 20 }),
        text(m.approach, { size: 20 }),
      ]))
    }
    if (m.strategies?.length) {
      children.push(para(text('Strategies:', { bold: true, size: 20 })))
      children.push(...bulletList(m.strategies))
    }
  }

  const le = plan.learningEnvironment || {}
  if (le.category || le.specific || le.rationale) {
    children.push(h2('Learning Environment'))
    const catLine = [le.category ? le.category.charAt(0).toUpperCase() + le.category.slice(1) : '', le.specific].filter(Boolean).join(' — ')
    if (catLine) children.push(para(text(catLine, { bold: true, size: 20 })))
    if (le.rationale) children.push(para(text(le.rationale, { size: 20, italics: true, color: '6b7280' })))
  }

  if (plan.teachingLearningMaterials?.length) {
    children.push(h2('Teaching / Learning Materials'))
    children.push(...bulletList(plan.teachingLearningMaterials))
  }
  if (plan.prerequisiteKnowledge?.length) {
    children.push(h2('Prior Knowledge'))
    children.push(...bulletList(plan.prerequisiteKnowledge))
  }
  if (plan.interdisciplinaryConnections?.length) {
    children.push(h2('Interdisciplinary Connections'))
    const tbl = interdisciplinaryTable(plan.interdisciplinaryConnections)
    if (tbl) children.push(tbl)
    children.push(para([]))
  }

  children.push(h2('Lesson Progression (5E)'))
  const lp = plan.lessonProgression || {}
  const phaseSpecs = [
    ['1. Engagement — Introduction', lp.engagement],
    ['2. Exploration — Development', lp.exploration],
    ['3. Explanation — Conceptualization', lp.explanation],
    ['4. Synthesis — Continuity & Extension', lp.synthesis],
    ['5. Evaluation & Reflection — Conclusion', lp.evaluation],
  ]
  for (const [title, phase] of phaseSpecs) {
    const p = phase || {}
    children.push(phaseTableV2(
      title,
      p.durationMinutes,
      p.teacherActivities || [],
      p.learnerActivities || [],
      p.assessmentCriteria || [],
    ))
    children.push(para([]))
  }
  return children
}

function buildV1Body(plan) {
  const children = []
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
  return children
}

/**
 * Build a docx Document from a lesson plan JSON object.
 * Detects schema version by field presence so older saved plans still export.
 */
export function buildLessonPlanDocument(plan) {
  const isV2 = !!plan.lessonProgression || !!plan.lessonCompetencies || plan.schemaVersion === '2.0'

  const children = []
  children.push(h1('LESSON PLAN'))

  const bodyChildren = isV2 ? buildV2Body(plan) : buildV1Body(plan)
  children.push(...bodyChildren)

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

  // v2-only: Competence Continuity (Section 3 of CBC template)
  if (isV2) {
    const cc = plan.competenceContinuity || {}
    const hasCC = (cc.longTermProjects?.length || 0) + (cc.homeworkExtensions?.length || 0)
      + (cc.upcomingConnections?.length || 0) + (cc.teacherActions?.length || 0) > 0
    if (hasCC) {
      children.push(h2('Competence Continuity and Strategy'))
      if (cc.longTermProjects?.length) {
        children.push(para(text('Long-term projects:', { bold: true, size: 20 })))
        children.push(...bulletList(cc.longTermProjects))
      }
      if (cc.homeworkExtensions?.length) {
        children.push(para(text('Homework extensions:', { bold: true, size: 20 })))
        children.push(...bulletList(cc.homeworkExtensions))
      }
      if (cc.upcomingConnections?.length) {
        children.push(para(text('Upcoming connections:', { bold: true, size: 20 })))
        children.push(...bulletList(cc.upcomingConnections))
      }
      if (cc.teacherActions?.length) {
        children.push(para(text('Teacher actions:', { bold: true, size: 20 })))
        children.push(...bulletList(cc.teacherActions))
      }
    }
    // v2 places References near the bottom as a formal block
    if (plan.references?.length) {
      children.push(h2('References'))
      children.push(...referencesBlock(plan.references))
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
