import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useFirestore } from '../../hooks/useFirestore'
import { useAuth } from '../../contexts/AuthContext'
import { storage } from '../../firebase/config'
import { generateAIQuizQuestions } from '../../utils/aiAssistant'
import {
  createPassageSection,
  createStandaloneSection,
  getQuestionKey,
  hasOnlyEmptyStarterSection,
  serializeQuizSections,
} from '../../utils/quizSections'
import QuizSectionsEditor from '../quiz/QuizSectionsEditor'
import {
  QUIZ_DOCUMENT_ACCEPT,
  importQuizDocument,
  revokeImportedQuizAssets,
} from '../quiz/documentQuizImporter'

const SUBJECTS = [
  'Mathematics',
  'English',
  'Integrated Science',
  'Social Studies',
  'Technology Studies',
  'Home Economics',
  'Expressive Arts',
]
const GRADES = ['4', '5', '6']
const TERMS = ['1', '2', '3']

const CREATION_MODES = [
  {
    id: 'manual',
    title: 'Create Manually',
    body: 'Write questions and answers yourself.',
    accent: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  {
    id: 'import',
    title: 'Import Quiz (Word/PDF)',
    body: 'Upload .doc, .docx, or .pdf and convert it into editable questions.',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    id: 'ai',
    title: 'Generate with Zed AI',
    body: 'Create starter questions from a topic, then edit before saving.',
    accent: 'border-sky-200 bg-sky-50 text-sky-900',
  },
]

const FIELD = 'w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-green-500'
const SELECT = 'rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-green-500'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function safeStorageName(value, fallback = 'asset') {
  const cleaned = String(value || '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || fallback
}

function assetsById(assets = []) {
  return Object.fromEntries(assets.map(asset => [asset.id, asset]))
}

function compressImage(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = image
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0, width, height)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Canvas compression failed'))),
        'image/jpeg',
        quality,
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load image'))
    }

    image.src = objectUrl
  })
}

function buildStandaloneSection(question = {}) {
  const type = question.type ?? 'mcq'
  const isTextAnswer = type === 'short_answer' || type === 'diagram'

  return createStandaloneSection({
    ...question,
    text: question.text ?? '',
    options: isTextAnswer
      ? []
      : Array.isArray(question.options) && question.options.length
        ? question.options
        : ['', '', '', ''],
    correctAnswer: isTextAnswer
      ? String(question.correctAnswer ?? '')
      : question.correctAnswer ?? 0,
    explanation: question.explanation ?? '',
    topic: question.topic ?? '',
    marks: question.marks ?? 1,
    type,
    detectedType: question.detectedType ?? type,
    imageUrl: question.imageUrl ?? '',
    imageUploading: false,
    imageUploadStep: '',
    imageAssetId: question.imageAssetId ?? '',
    diagramText: question.diagramText ?? '',
    requiresReview: Boolean(question.requiresReview),
    reviewNotes: question.reviewNotes ?? [],
    importWarnings: question.importWarnings ?? [],
    sourcePage: question.sourcePage ?? null,
  })
}

function buildQuestionNumberMap(questions = []) {
  return Object.fromEntries(questions.map((question, index) => [getQuestionKey(question), index + 1]))
}

function countImages(sections = []) {
  return sections.reduce((total, section) => {
    if (section.kind === 'passage') {
      return total + (section.passage?.imageUrl ? 1 : 0)
    }
    return total + (section.question?.imageUrl ? 1 : 0)
  }, 0)
}

function hasUploadingAssets(sections = []) {
  return sections.some(section => {
    if (section.kind === 'passage') return section.passage?.imageUploading
    return section.question?.imageUploading
  })
}

function ImportQuizPanel({ importing, importSummary, onImport }) {
  const [inputKey, setInputKey] = useState(0)

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-black text-emerald-950">Import Quiz (Word/PDF)</h2>
          <p className="mt-1 max-w-3xl text-sm font-bold leading-relaxed text-emerald-800">
            Upload a .doc, .docx, or .pdf file. ZedExams will extract questions, options, short answers, and image-based questions into editable cards.
          </p>
        </div>
        <label className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white">
          {importing ? 'Importing...' : 'Choose File'}
          <input
            key={inputKey}
            type="file"
            accept={QUIZ_DOCUMENT_ACCEPT}
            className="hidden"
            disabled={importing}
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) onImport(file)
              setInputKey(current => current + 1)
            }}
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/70 bg-white/80 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Editable import</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-emerald-800">The document is converted into editable quiz cards, not embedded as a static file.</p>
        </div>
        <div className="rounded-xl border border-white/70 bg-white/80 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Images</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-emerald-800">DOCX images and PDF snapshots attach to matching questions and upload when you save.</p>
        </div>
        <div className="rounded-xl border border-white/70 bg-white/80 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Needs review</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-emerald-800">Unclear answers, diagrams, and imperfect extraction are marked before publishing.</p>
        </div>
      </div>
      {importSummary && (
        <div className={`rounded-xl border px-4 py-3 ${
          importSummary.importStatus === 'needs_review'
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-emerald-200 bg-white text-emerald-900'
        }`}>
          <p className="text-sm font-black">
            Imported {importSummary.questions} question{importSummary.questions === 1 ? '' : 's'} from {importSummary.fileName}
          </p>
          <p className="mt-1 text-xs font-bold leading-relaxed">
            {importSummary.images} image-based question{importSummary.images === 1 ? '' : 's'} · {importSummary.needsReview} need review · Status: {importSummary.importStatus}
          </p>
          {importSummary.warnings?.length ? (
            <ul className="mt-2 space-y-0.5">
              {importSummary.warnings.slice(0, 3).map((warning, index) => (
                <li key={`${warning}-${index}`} className="text-xs font-bold leading-relaxed">{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}

function CreationModeSelector({ activeMode, onSelect }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-gray-500">Choose how to create this quiz</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {CREATION_MODES.map(mode => {
          const active = activeMode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`min-h-0 rounded-xl border-2 p-4 text-left shadow-none transition-all ${
                active ? mode.accent : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
              }`}
            >
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-black ${
                active ? 'bg-white/80' : 'bg-white text-gray-500'
              }`}>
                {active ? 'Selected' : 'Option'}
              </span>
              <h2 className="mt-2 text-sm font-black">{mode.title}</h2>
              <p className="mt-1 text-xs font-bold leading-relaxed opacity-80">{mode.body}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CreateQuizV2() {
  const { createQuiz, saveQuestions } = useFirestore()
  const { currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode')

  const [creationMode, setCreationMode] = useState(
    CREATION_MODES.some(mode => mode.id === requestedMode) ? requestedMode : 'manual',
  )
  const [form, setForm] = useState({
    title: '',
    subject: 'Mathematics',
    grade: '5',
    term: '1',
    duration: 30,
    type: 'quiz',
    topic: '',
    mode: '',
    importStatus: '',
    sourceFileName: '',
    sourceContentType: '',
    importWarnings: [],
  })
  const [sections, setSections] = useState([createStandaloneSection()])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [aiForm, setAiForm] = useState({ topic: '', count: 5, type: 'mcq' })
  const [aiGenerating, setAiGenerating] = useState(false)
  const [importingDocument, setImportingDocument] = useState(false)
  const [importSummary, setImportSummary] = useState(null)
  const [importedAssets, setImportedAssets] = useState({})

  const serializedPreview = serializeQuizSections(sections)
  const questionNumbers = buildQuestionNumberMap(serializedPreview.questions)
  const questionCount = serializedPreview.questionCount
  const totalMarks = serializedPreview.totalMarks
  const passageCount = serializedPreview.passages.length
  const imagesCount = countImages(sections)
  const anyUploading = hasUploadingAssets(sections) || importingDocument

  useEffect(() => () => revokeImportedQuizAssets(importedAssets), [importedAssets])

  function setF(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function setAi(field, value) {
    setAiForm(current => ({ ...current, [field]: value }))
  }

  function show(message, isErr = false) {
    setToast({ message, isErr })
    setTimeout(() => setToast(null), 3500)
  }

  function scrollToBottom() {
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50)
  }

  function chooseCreationMode(mode) {
    setCreationMode(mode)
    const nextParams = new URLSearchParams(searchParams)
    if (mode === 'manual') nextParams.delete('mode')
    else nextParams.set('mode', mode)
    setSearchParams(nextParams, { replace: true })
  }

  function updateSection(sectionIndex, updater) {
    setSections(currentSections => currentSections.map((section, index) => (
      index === sectionIndex ? updater(section) : section
    )))
  }

  function updateStandaloneQuestion(sectionIndex, field, value) {
    updateSection(sectionIndex, section => ({
      ...section,
      question: {
        ...section.question,
        [field]: value,
      },
    }))
  }

  function moveSection(sectionIndex, direction) {
    setSections(currentSections => {
      const nextSections = [...currentSections]
      const targetIndex = sectionIndex + direction
      if (targetIndex < 0 || targetIndex >= nextSections.length) return nextSections
      ;[nextSections[sectionIndex], nextSections[targetIndex]] = [nextSections[targetIndex], nextSections[sectionIndex]]
      return nextSections
    })
  }

  function removeStandaloneSection(sectionIndex) {
    setSections(currentSections => currentSections.filter((_, index) => index !== sectionIndex))
  }

  function updatePassage(sectionIndex, field, value) {
    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        [field]: value,
      },
    }))
  }

  function togglePassage(sectionIndex) {
    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        collapsed: !section.passage.collapsed,
      },
    }))
  }

  function removePassageSection(sectionIndex) {
    setSections(currentSections => currentSections.filter((_, index) => index !== sectionIndex))
  }

  function addPassageQuestion(sectionIndex) {
    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        questions: [
          ...section.passage.questions,
          {
            ...createPassageSection({ id: section.passage.id, questions: [] }).passage.questions[0],
            passageId: section.passage.id,
          },
        ],
      },
    }))
  }

  function updatePassageQuestion(sectionIndex, questionIndex, field, value) {
    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        questions: section.passage.questions.map((question, index) => (
          index === questionIndex ? { ...question, [field]: value } : question
        )),
      },
    }))
  }

  function removePassageQuestion(sectionIndex, questionIndex) {
    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        questions: section.passage.questions.filter((_, index) => index !== questionIndex),
      },
    }))
  }

  function movePassageQuestion(sectionIndex, questionIndex, direction) {
    updateSection(sectionIndex, section => {
      const nextQuestions = [...section.passage.questions]
      const targetIndex = questionIndex + direction
      if (targetIndex < 0 || targetIndex >= nextQuestions.length) return section
      ;[nextQuestions[questionIndex], nextQuestions[targetIndex]] = [nextQuestions[targetIndex], nextQuestions[questionIndex]]
      return {
        ...section,
        passage: {
          ...section.passage,
          questions: nextQuestions,
        },
      }
    })
  }

  function addStandaloneSectionHandler() {
    setSections(currentSections => [...currentSections, createStandaloneSection()])
    scrollToBottom()
  }

  function addPassageSectionHandler() {
    setSections(currentSections => [...currentSections, createPassageSection()])
    scrollToBottom()
  }

  async function handleGenerateQuestions() {
    const topic = aiForm.topic.trim()
    if (!topic) {
      show('Add a topic for Zed to generate questions.', true)
      return
    }

    setAiGenerating(true)
    try {
      const generated = await generateAIQuizQuestions({
        subject: form.subject,
        grade: form.grade,
        topic,
        count: aiForm.count,
        type: aiForm.type,
      })

      const nextSections = generated.map(question => buildStandaloneSection({
        ...question,
        options: question.options?.length ? question.options : ['', '', '', ''],
      }))

      setSections(currentSections => hasOnlyEmptyStarterSection(currentSections)
        ? nextSections
        : [...currentSections, ...nextSections])

      if (!form.title.trim()) {
        setF('title', `Grade ${form.grade} ${form.subject} - ${topic}`)
      }

      const usedFastDraft = nextSections.some(section => section.question.generatedBy === 'fast_draft')
      show(usedFastDraft
        ? `Added ${nextSections.length} quick draft question${nextSections.length === 1 ? '' : 's'}. Review before saving.`
        : `Added ${nextSections.length} AI-generated question${nextSections.length === 1 ? '' : 's'}. Review before saving.`)
    } catch (error) {
      show(error.message, true)
    } finally {
      setAiGenerating(false)
    }
  }

  async function handleImportDocument(file) {
    const hasExistingWork = !hasOnlyEmptyStarterSection(sections)
    if (hasExistingWork && !window.confirm('Replace the current questions with questions extracted from this document?')) {
      return
    }

    setImportingDocument(true)
    try {
      const imported = await importQuizDocument(file)
      setImportedAssets(assetsById(imported.imageAssets))
      setForm(current => ({
        ...current,
        title: current.title.trim() && hasExistingWork ? current.title : imported.quiz.title,
        topic: current.topic.trim() && hasExistingWork ? current.topic : imported.quiz.topic,
        grade: imported.quiz.grade || current.grade,
        subject: imported.quiz.subject || current.subject,
        mode: 'imported_document',
        importStatus: imported.importStatus,
        sourceFileName: imported.quiz.sourceFileName,
        sourceContentType: imported.quiz.sourceContentType,
        importWarnings: imported.warnings,
      }))
      setSections(imported.questions.map(question => buildStandaloneSection(question)))
      setImportSummary({
        ...imported.summary,
        fileName: file.name,
        importStatus: imported.importStatus,
        warnings: imported.warnings,
      })
      show(imported.importStatus === 'needs_review'
        ? 'Document imported. Review marked questions before publishing.'
        : 'Document imported into editable quiz questions.')
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight / 3, behavior: 'smooth' }), 80)
    } catch (error) {
      console.error(error)
      show(`Import failed: ${error.message || 'Could not read this document.'}`, true)
    } finally {
      setImportingDocument(false)
    }
  }

  async function uploadStandaloneQuestionImage(sectionIndex, file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      show('Only JPG, PNG, and WEBP images are allowed.', true)
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      show('Image must be under 15 MB.', true)
      return
    }

    updateSection(sectionIndex, section => ({
      ...section,
      question: {
        ...section.question,
        imageUploading: true,
        imageUploadStep: 'compressing',
        imageUrl: '',
        imageAssetId: '',
      },
    }))

    try {
      const compressed = await compressImage(file)
      updateStandaloneQuestion(sectionIndex, 'imageUploadStep', 'uploading')
      const path = `quiz-images/${currentUser.uid}/${Date.now()}-standalone-${sectionIndex}.jpg`
      const snapshot = await uploadBytes(storageRef(storage, path), compressed, { contentType: 'image/jpeg' })
      const imageUrl = await getDownloadURL(snapshot.ref)

      updateSection(sectionIndex, section => ({
        ...section,
        question: {
          ...section.question,
          imageUrl,
          imageAssetId: '',
          imageUploading: false,
          imageUploadStep: '',
        },
      }))
      show(`Image ready (${Math.round(compressed.size / 1024)} KB)`)
    } catch (error) {
      updateSection(sectionIndex, section => ({
        ...section,
        question: {
          ...section.question,
          imageUploading: false,
          imageUploadStep: '',
        },
      }))
      show(`Upload failed: ${error.message}`, true)
    }
  }

  function removeStandaloneQuestionImage(sectionIndex) {
    updateSection(sectionIndex, section => ({
      ...section,
      question: {
        ...section.question,
        imageUrl: '',
        imageAssetId: '',
      },
    }))
  }

  async function uploadPassageImage(sectionIndex, file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      show('Only JPG, PNG, and WEBP images are allowed.', true)
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      show('Image must be under 15 MB.', true)
      return
    }

    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        imageUploading: true,
        imageUploadStep: 'compressing',
        imageUrl: '',
      },
    }))

    try {
      const compressed = await compressImage(file)
      updateSection(sectionIndex, section => ({
        ...section,
        passage: {
          ...section.passage,
          imageUploadStep: 'uploading',
        },
      }))
      const path = `quiz-images/${currentUser.uid}/${Date.now()}-passage-${sectionIndex}.jpg`
      const snapshot = await uploadBytes(storageRef(storage, path), compressed, { contentType: 'image/jpeg' })
      const imageUrl = await getDownloadURL(snapshot.ref)

      updateSection(sectionIndex, section => ({
        ...section,
        passage: {
          ...section.passage,
          imageUrl,
          imageUploading: false,
          imageUploadStep: '',
        },
      }))
      show(`Passage image ready (${Math.round(compressed.size / 1024)} KB)`)
    } catch (error) {
      updateSection(sectionIndex, section => ({
        ...section,
        passage: {
          ...section.passage,
          imageUploading: false,
          imageUploadStep: '',
        },
      }))
      show(`Upload failed: ${error.message}`, true)
    }
  }

  function removePassageImage(sectionIndex) {
    updateSection(sectionIndex, section => ({
      ...section,
      passage: {
        ...section.passage,
        imageUrl: '',
      },
    }))
  }

  async function uploadImportedQuestionImages(questionsToSave) {
    const assetIds = Array.from(new Set(questionsToSave.map(question => question.imageAssetId).filter(Boolean)))
    if (!assetIds.length) return questionsToSave
    if (!currentUser?.uid) throw new Error('Please sign in before saving imported quiz images.')

    const uploadedById = {}
    for (const assetId of assetIds) {
      const asset = importedAssets[assetId]
      if (!asset?.blob) {
        throw new Error('An imported question image is no longer available. Please re-import the document.')
      }

      const sourceFile = new File([asset.blob], asset.fileName || `${assetId}.jpg`, {
        type: asset.contentType || 'image/jpeg',
      })
      const uploadBlob = await compressImage(sourceFile)
      const path = `quiz-images/${currentUser.uid}/imports/${Date.now()}-${safeStorageName(assetId)}.jpg`
      const snapshot = await uploadBytes(storageRef(storage, path), uploadBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          sourceFileName: form.sourceFileName || '',
          sourcePath: asset.sourcePath || '',
        },
      })
      uploadedById[assetId] = await getDownloadURL(snapshot.ref)
    }

    return questionsToSave.map(question => {
      const uploadedUrl = uploadedById[question.imageAssetId]
      if (!uploadedUrl) return question
      return {
        ...question,
        imageUrl: uploadedUrl,
        imageAssetId: '',
      }
    })
  }

  function validateStandaloneQuestion(question, label) {
    if (question.imageUploading) {
      show(`${label} image is still uploading. Please wait.`, true)
      return false
    }
    if (!question.text.trim()) {
      show(`${label} is missing question text.`, true)
      return false
    }
    if (question.type === 'mcq' && question.options.some(option => !String(option || '').trim())) {
      show(`${label} has empty options.`, true)
      return false
    }
    return true
  }

  function validate() {
    if (!form.title.trim()) {
      show('Please enter a quiz title.', true)
      return false
    }
    if (questionCount === 0) {
      show('Add at least one question before saving.', true)
      return false
    }

    for (const section of sections) {
      if (section.kind === 'passage') {
        const passage = section.passage
        if (passage.imageUploading) {
          show('A passage image is still uploading. Please wait.', true)
          return false
        }
        if (!passage.passageText.trim()) {
          show('Each comprehension passage needs passage text before saving.', true)
          return false
        }
        if (!passage.questions.length) {
          show('Each comprehension passage needs at least one linked question.', true)
          return false
        }
        for (const question of passage.questions) {
          const label = `Passage question ${questionNumbers[question.localId]}`
          if (!validateStandaloneQuestion({ ...question, type: 'mcq' }, label)) return false
        }
        continue
      }

      const question = section.question
      const label = `Question ${questionNumbers[question.localId]}`
      if (!validateStandaloneQuestion(question, label)) return false
    }

    return true
  }

  async function handleSave({ publish = false, submit = false } = {}) {
    if (!validate()) return
    setSaving(true)

    try {
      const serializedSections = serializeQuizSections(sections)
      const questionsForSave = await uploadImportedQuestionImages(serializedSections.questions)
      const totalMarksForSave = questionsForSave.reduce((sum, question) => sum + (question.marks || 1), 0)
      const status = publish ? 'published' : submit ? 'pending' : 'draft'

      const quizId = await createQuiz({
        ...form,
        passages: serializedSections.passages,
        passageCount: serializedSections.passages.length,
        totalMarks: totalMarksForSave,
        questionCount: questionsForSave.length,
        importStatus: form.mode === 'imported_document'
          ? (questionsForSave.some(question => question.requiresReview) ? 'needs_review' : (form.importStatus || 'success'))
          : form.importStatus,
        isPublished: publish,
        status,
        createdBy: currentUser.uid,
        ...(submit && { submittedAt: new Date() }),
      })

      await saveQuestions(quizId, questionsForSave)
      setImportedAssets({})

      show(publish ? 'Quiz published!' : submit ? 'Submitted for approval!' : 'Saved as draft!')
      const returnPath = isAdmin ? '/admin/content' : '/teacher/content'
      setTimeout(() => navigate(returnPath), 1200)
    } catch (error) {
      console.error(error)
      show(`Failed to save: ${error.message}`, true)
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed right-4 top-4 z-50 max-w-xs rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg ${
          toast.isErr ? 'bg-red-600' : 'bg-green-700'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-0 bg-transparent p-1 text-gray-400 shadow-none hover:text-gray-600"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">✏️ Create Quiz</h1>
          <p className="text-sm text-gray-500">Build quizzes with standalone questions or comprehension passages.</p>
        </div>
      </div>

      <CreationModeSelector activeMode={creationMode} onSelect={chooseCreationMode} />

      {creationMode === 'import' && (
        <ImportQuizPanel
          importing={importingDocument}
          importSummary={importSummary}
          onImport={handleImportDocument}
        />
      )}

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="font-black text-gray-700">Quiz Details</h2>
        <input
          value={form.title}
          onChange={event => setF('title', event.target.value)}
          placeholder="Quiz title (e.g. Grade 5 Mathematics - Fractions Test)"
          className={FIELD}
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <select value={form.grade} onChange={event => setF('grade', event.target.value)} className={SELECT}>
            {GRADES.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
          </select>
          <select value={form.subject} onChange={event => setF('subject', event.target.value)} className={SELECT}>
            {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <select value={form.term} onChange={event => setF('term', event.target.value)} className={SELECT}>
            {TERMS.map(term => <option key={term} value={term}>Term {term}</option>)}
          </select>
          <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-3 py-2.5">
            <span className="whitespace-nowrap text-xs font-bold text-gray-500">⏱️ Mins</span>
            <input
              type="number"
              min={5}
              max={180}
              value={form.duration}
              onChange={event => setF('duration', Number(event.target.value) || 30)}
              className="flex-1 bg-transparent text-sm font-black outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2 py-1 font-bold">{questionCount} questions</span>
          <span className="rounded-full bg-gray-100 px-2 py-1 font-bold">{totalMarks} marks total</span>
          {passageCount > 0 && <span className="rounded-full bg-orange-100 px-2 py-1 font-bold text-orange-700">{passageCount} passage{passageCount === 1 ? '' : 's'}</span>}
          {imagesCount > 0 && <span className="rounded-full bg-blue-100 px-2 py-1 font-bold text-blue-700">🖼️ {imagesCount} image{imagesCount === 1 ? '' : 's'}</span>}
          {form.mode === 'imported_document' && (
            <span className={`rounded-full px-2 py-1 font-bold ${
              form.importStatus === 'needs_review' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              Imported document · {form.importStatus || 'success'}
            </span>
          )}
        </div>
      </div>

      {creationMode === 'ai' && (
        <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-sky-900">✦ AI Quiz Generator</h2>
              <p className="mt-0.5 text-sm text-sky-700">Generate draft multiple-choice questions, then edit them below before saving.</p>
            </div>
            <span className="hidden rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-xs font-black text-sky-700 sm:inline-flex">Teacher tool</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            <select value={form.grade} onChange={event => setF('grade', event.target.value)} className={SELECT}>
              {GRADES.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
            </select>
            <select value={form.subject} onChange={event => setF('subject', event.target.value)} className={SELECT}>
              {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <input
              value={aiForm.topic}
              onChange={event => setAi('topic', event.target.value)}
              placeholder="Topic, e.g. Fractions"
              className="col-span-2 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-sky-500 lg:col-span-1"
            />
            <input
              type="number"
              min={1}
              max={10}
              value={aiForm.count}
              onChange={event => setAi('count', Number(event.target.value) || 1)}
              className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-sky-500"
              aria-label="Number of questions"
            />
            <select value={aiForm.type} onChange={event => setAi('type', event.target.value)} className={SELECT}>
              <option value="mcq">Multiple choice</option>
            </select>
          </div>
          <button type="button" onClick={handleGenerateQuestions} disabled={aiGenerating || saving} className="w-full rounded-xl bg-sky-600 px-5 py-3 font-black text-white transition-colors hover:bg-sky-700 disabled:opacity-60 sm:w-auto">
            {aiGenerating ? '✦ Generating...' : '✦ Generate Questions'}
          </button>
        </div>
      )}

      <QuizSectionsEditor
        variant="create"
        sections={sections}
        questionNumbers={questionNumbers}
        totalQuestions={questionCount}
        onStandaloneChange={updateStandaloneQuestion}
        onStandaloneRemove={removeStandaloneSection}
        onStandaloneMove={moveSection}
        onStandaloneImageUpload={uploadStandaloneQuestionImage}
        onStandaloneImageRemove={removeStandaloneQuestionImage}
        onPassageChange={updatePassage}
        onPassageToggle={togglePassage}
        onPassageRemove={removePassageSection}
        onPassageMove={moveSection}
        onPassageImageUpload={uploadPassageImage}
        onPassageImageRemove={removePassageImage}
        onPassageQuestionChange={updatePassageQuestion}
        onPassageQuestionRemove={removePassageQuestion}
        onPassageQuestionMove={movePassageQuestion}
        onPassageAddQuestion={addPassageQuestion}
        onAddStandalone={addStandaloneSectionHandler}
        onAddPassage={addPassageSectionHandler}
      />

      <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-600">
        <span className="flex-shrink-0 text-base">ℹ️</span>
        <span>Question and passage images upload to Firebase Storage as soon as you select them. Comprehension passages are stored separately on the quiz and linked to their questions when you save.</span>
      </div>

      <div className="flex gap-3 pb-6">
        <button type="button" onClick={() => handleSave({})} disabled={saving || anyUploading} className="flex-1 rounded-2xl border-2 border-green-600 py-3.5 font-black text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50">
          {saving ? 'Saving...' : anyUploading ? 'Uploading...' : '💾 Save Draft'}
        </button>
        {isAdmin ? (
          <button type="button" onClick={() => handleSave({ publish: true })} disabled={saving || anyUploading} className="flex-1 rounded-2xl bg-green-600 py-3.5 font-black text-white transition-colors hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Publishing...' : anyUploading ? 'Uploading...' : '🚀 Publish Quiz'}
          </button>
        ) : (
          <button type="button" onClick={() => handleSave({ submit: true })} disabled={saving || anyUploading} className="flex-1 rounded-2xl bg-blue-600 py-3.5 font-black text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Submitting...' : anyUploading ? 'Uploading...' : '📤 Submit for Approval'}
          </button>
        )}
      </div>
    </div>
  )
}
