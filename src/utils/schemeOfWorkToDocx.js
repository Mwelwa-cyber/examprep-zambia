/**
 * Export a scheme of work as a Word (.docx) file in landscape orientation
 * with a bordered weekly-plan table — the format Zambian head teachers
 * expect.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
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
    spacing: { after: 60 },
    ...opts,
  })
}

function bulletLines(items = []) {
  if (!items?.length) return [para(text('—', { size: 18, italics: true, color: '9ca3af' }))]
  return items.map((line) =>
    new Paragraph({
      children: [text(line, { size: 18 })],
      bullet: { level: 0 },
      spacing: { after: 40 },
    }),
  )
}

function h1(str) {
  return new Paragraph({
    children: [text(str, { bold: true, size: 32 })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  })
}

function headerLabel(txt, widthPct) {
  return new TableCell({
    children: [para(text(txt, { bold: true, size: 18 }))],
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDER,
    shading: { fill: 'e2e8f0' },
  })
}

function cell(content, widthPct) {
  const paras = Array.isArray(content) ? content : [para(text(content, { size: 18 }))]
  return new TableCell({
    children: paras,
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDER,
  })
}

function metadataTable(header) {
  const rows = [
    ['School', header.school],
    ['Teacher', header.teacherName],
    ['Class', header.class],
    ['Subject', header.subject],
    ['Term', String(header.term)],
    ['Number of Weeks', String(header.numberOfWeeks)],
    ['Academic Year', header.academicYear],
    ['Medium', header.mediumOfInstruction],
  ].filter(([, v]) => v)

  return new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) => new TableRow({
      children: [
        new TableCell({
          children: [para(text(k, { bold: true, size: 18 }))],
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
          shading: { fill: 'f3f4f6' },
        }),
        new TableCell({
          children: [para(text(String(v), { size: 18 }))],
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: CELL_BORDER,
        }),
      ],
    })),
  })
}

function schemeTable(weeks) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerLabel('Week', 6),
      headerLabel('Topic & Sub-topics', 22),
      headerLabel('Specific Outcomes', 22),
      headerLabel('Teaching/Learning Activities', 20),
      headerLabel('Materials', 15),
      headerLabel('Assessment', 15),
    ],
  })

  const weekRows = weeks.map((w) => {
    const topicCell = [
      para(text(w.topic, { bold: true, size: 18 })),
      ...bulletLines(w.subtopics),
    ]
    if (w.references) {
      topicCell.push(
        para(text(w.references, { size: 16, italics: true, color: '6b7280' })),
      )
    }

    const outcomesCell = [
      ...bulletLines(w.specificOutcomes),
    ]
    if (w.keyCompetencies?.length) {
      outcomesCell.push(
        para([
          text('Competencies: ', { bold: true, size: 14, color: '6b7280' }),
          text(w.keyCompetencies.join(' · '), { size: 14, color: '6b7280' }),
        ]),
      )
    }
    if (w.values?.length) {
      outcomesCell.push(
        para([
          text('Values: ', { bold: true, size: 14, color: '6b7280' }),
          text(w.values.join(' · '), { size: 14, color: '6b7280' }),
        ]),
      )
    }

    return new TableRow({
      children: [
        cell(para(text(String(w.weekNumber), { bold: true, size: 18 })), 6),
        cell(topicCell, 22),
        cell(outcomesCell, 22),
        cell(bulletLines(w.teachingLearningActivities), 20),
        cell(bulletLines(w.materials), 15),
        cell(para(text(w.assessment || '—', { size: 18 })), 15),
      ],
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...weekRows],
  })
}

export function buildSchemeOfWorkDocument(scheme) {
  const children = []

  children.push(h1('SCHEME OF WORK'))
  children.push(metadataTable(scheme.header || {}))
  children.push(para(text(' ', { size: 14 })))

  if (scheme.overview?.termTheme) {
    children.push(new Paragraph({
      children: [text('Term Theme: ', { bold: true, size: 20 }), text(scheme.overview.termTheme, { size: 20 })],
      spacing: { before: 120, after: 80 },
    }))
  }
  if (scheme.overview?.overallCompetencies?.length) {
    children.push(para([
      text('Overall Key Competencies: ', { bold: true, size: 18 }),
      text(scheme.overview.overallCompetencies.join(' · '), { size: 18 }),
    ]))
  }
  if (scheme.overview?.overallValues?.length) {
    children.push(para([
      text('Overall Values: ', { bold: true, size: 18 }),
      text(scheme.overview.overallValues.join(' · '), { size: 18 }),
    ]))
  }

  children.push(para(text(' ', { size: 14 })))
  children.push(schemeTable(scheme.weeks || []))

  return new Document({
    creator: 'zedexams.com',
    title: `Scheme of Work — ${scheme.header?.subject || ''} Term ${scheme.header?.term || ''}`,
    description: 'Generated by ZedExams Teacher Tools',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 20 } },
      },
    },
    sections: [{
      properties: {
        page: {
          // Landscape — schemes of work are always wide in CDC format.
          size: { orientation: PageOrientation.LANDSCAPE },
        },
      },
      children,
    }],
  })
}

export async function downloadSchemeOfWorkDocx(scheme, filename = 'scheme-of-work.docx') {
  const doc = buildSchemeOfWorkDocument(scheme)
  const blob = await Packer.toBlob(doc)
  try {
    const { saveAs } = await import('file-saver')
    saveAs(blob, filename)
    return
  } catch { /* fall through */ }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
