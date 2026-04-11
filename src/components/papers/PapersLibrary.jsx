import { useState, useEffect } from 'react'
import { useFirestore } from '../../hooks/useFirestore'
import { useSubscription } from '../../hooks/useSubscription'
import UpgradeModal from '../subscription/UpgradeModal'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies']
const GRADES = ['5', '6', '7']

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-bold min-h-0 ${active ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {label}
    </button>
  )
}

export default function PapersLibrary() {
  const { getPapers, incrementDownload } = useFirestore()
  const { isPremium, paperLimit } = useSubscription()

  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [gradeF, setGradeF] = useState('')
  const [subjectF, setSubjectF] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getPapers({ grade: gradeF, subject: subjectF })
      setPapers(data)
      setLoading(false)
    }
    load()
  }, [gradeF, subjectF])

  async function handleDownload(paper, idx) {
    if (!isPremium && idx >= paperLimit) { setShowUpgrade(true); return }
    if (paper.fileUrl) {
      await incrementDownload(paper.id)
      window.open(paper.fileUrl, '_blank')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <h1 className="text-2xl font-black text-gray-800 mb-1">📄 Past Papers</h1>
      <p className="text-gray-500 text-sm mb-4">Download past exam papers for revision</p>

      {!isPremium && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-700 font-bold mb-4">
          📄 Free: {paperLimit} papers · <button onClick={() => setShowUpgrade(true)} className="text-green-600 underline min-h-0 p-0 bg-transparent shadow-none font-black">Upgrade for all ⭐</button>
        </div>
      )}

      <div className="space-y-2 mb-5">
        <div className="flex gap-2 flex-wrap">
          <Chip label="All Grades" active={!gradeF} onClick={() => setGradeF('')} />
          {GRADES.map(g => <Chip key={g} label={`Grade ${g}`} active={gradeF === g} onClick={() => setGradeF(g === gradeF ? '' : g)} />)}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip label="All Subjects" active={!subjectF} onClick={() => setSubjectF('')} />
          {SUBJECTS.map(s => <Chip key={s} label={s} active={subjectF === s} onClick={() => setSubjectF(s === subjectF ? '' : s)} />)}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}</div>
      ) : papers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📁</div>
          <p className="font-bold text-gray-600">No papers found</p>
          <p className="text-gray-400 text-sm mt-1">Try clearing a filter, or ask admin to upload papers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {papers.map((p, idx) => {
            const locked = !isPremium && idx >= paperLimit
            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 ${locked ? 'opacity-60' : ''}`}>
                <div className="bg-red-100 text-red-600 w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-sm truncate">{p.title}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{p.subject}</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">G{p.grade}</span>
                    {p.year && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.year}</span>}
                    <span className="text-xs text-gray-400">{p.downloadCount ?? 0} downloads</span>
                  </div>
                </div>
                <button onClick={() => handleDownload(p, idx)}
                  className={`font-black text-sm px-4 py-2 rounded-xl flex-shrink-0 min-h-0 ${locked ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {locked ? '🔒' : '⬇️'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
