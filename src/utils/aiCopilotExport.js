/**
 * AI Co-Pilot — export utilities.
 *
 * The Teacher AI Co-Pilot returns plain text / lightweight markdown. These
 * helpers turn that text into a printable Word doc or PDF without any of
 * the structured-plan formatting used by the dedicated generators.
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { saveAs } from 'file-saver'

function safeFilename(label) {
  const stamp = new Date().toISOString().slice(0, 10)
  const slug = String(label || 'ai-copilot')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'ai-copilot'
  return `${slug}-${stamp}`
}

function lineToParagraph(line) {
  const trimmed = line.replace(/\s+$/g, '')
  if (!trimmed) {
    return new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } })
  }
  // Markdown-style headings.
  const h1 = trimmed.match(/^#\s+(.*)$/)
  if (h1) {
    return new Paragraph({
      children: [new TextRun({ text: h1[1], bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { after: 200, before: 120 },
    })
  }
  const h2 = trimmed.match(/^##\s+(.*)$/)
  if (h2) {
    return new Paragraph({
      children: [new TextRun({ text: h2[1], bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 160, before: 120 },
    })
  }
  const h3 = trimmed.match(/^###\s+(.*)$/)
  if (h3) {
    return new Paragraph({
      children: [new TextRun({ text: h3[1], bold: true, size: 22 })],
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 120, before: 100 },
    })
  }
  // Bullets.
  const bullet = trimmed.match(/^[-*]\s+(.*)$/)
  if (bullet) {
    return new Paragraph({
      children: [new TextRun(bullet[1])],
      bullet: { level: 0 },
      spacing: { after: 60 },
    })
  }
  // Numbered list.
  const num = trimmed.match(/^(\d+)\.\s+(.*)$/)
  if (num) {
    return new Paragraph({
      children: [new TextRun(`${num[1]}. ${num[2]}`)],
      spacing: { after: 60 },
    })
  }
  // Plain paragraph — strip simple bold/italic markers.
  const plain = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
  return new Paragraph({
    children: [new TextRun(plain)],
    spacing: { after: 100 },
  })
}

export async function downloadAiCopilotWord(text, label = 'AI Co-Pilot Output') {
  const lines = String(text || '').replace(/\r/g, '').split('\n')
  const paragraphs = [
    new Paragraph({
      children: [new TextRun({ text: label, bold: true, size: 36 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    ...lines.map(lineToParagraph),
  ]

  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${safeFilename(label)}.docx`)
}

/**
 * Lightweight PDF export — uses the browser print dialog so we don't pull
 * in a second PDF library. The user picks "Save as PDF" in the print
 * destination dropdown.
 */
export function downloadAiCopilotPdf(text, label = 'AI Co-Pilot Output') {
  const safeLabel = String(label || 'AI Co-Pilot Output').slice(0, 200)
  const safeText = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) {
    throw new Error('Pop-up blocked. Allow pop-ups for ZedExams to download.')
  }
  win.document.open()
  win.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeLabel}</title>
<style>
  body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.55; color: #0e2a32; padding: 32px; max-width: 760px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 16px; border-bottom: 2px solid #ff7a2e; padding-bottom: 8px; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${safeLabel}</h1>
  <pre>${safeText}</pre>
  <script>window.onload = () => { window.focus(); window.print(); };</script>
</body>
</html>`)
  win.document.close()
}
