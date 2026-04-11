import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../ui/Logo'
import Mascot from '../ui/Mascot'

const FRIENDLY = {
  'auth/invalid-credential':       'Wrong email or password. Please try again.',
  'auth/user-not-found':           'No account found with this email.',
  'auth/wrong-password':           'Wrong password. Please try again.',
  'auth/too-many-requests':        'Too many attempts — please wait a few minutes.',
  'auth/invalid-email':            'Please enter a valid email address.',
  'auth/network-request-failed':   'Network error. Please check your connection.',
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(FRIENDLY[err.code] ?? 'Login failed. Please try again.')
    } finally { setLoading(false) }
  }

  function fillDemo() { setEmail('demo@examprep.zm'); setPassword('demo1234') }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background floating stars */}
      {['10%','30%','55%','75%','90%'].map((left, i) => (
        <span key={i} className="absolute text-white/20 text-3xl pointer-events-none"
          style={{ left, top: `${[15,60,25,70,40][i]}%`, animation: `float ${[3.2,2.8,3.6,3.0,2.6][i]}s ease-in-out infinite`, animationDelay: `${i*0.5}s` }}>
          {['⭐','✨','🌟','⭐','✨'][i]}
        </span>
      ))}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-scale-in relative">
        <div className="flex flex-col items-center mb-5">
          <Logo variant="full" size="lg" />
          <p className="text-gray-400 text-sm mt-2 font-bold tracking-wide">Grade 5 · 6 · 7 Exam Preparation</p>
          <Mascot size={72} mood="happy" className="mt-2" />
          <p className="text-green-600 font-black text-sm mt-1">Let's ace those exams! 🎓</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-green-500 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-green-500 focus:outline-none transition-colors" />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-lg py-3.5 rounded-2xl shadow-md transition-colors">
            {loading ? '⏳ Signing in…' : '🚀 Sign In'}
          </button>
        </form>

        <button onClick={fillDemo}
          className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm py-2.5 rounded-2xl transition-colors min-h-0">
          👤 Fill Demo Credentials
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          No account?{' '}
          <Link to="/register" className="text-green-600 font-black hover:underline">Register free</Link>
        </p>
      </div>
    </div>
  )
}
