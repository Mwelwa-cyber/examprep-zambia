import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import StudentDashboard from './components/dashboard/StudentDashboard'
import AdminPanel from './components/dashboard/AdminPanel'
import TeacherPanel from './components/dashboard/TeacherPanel'
import QuizList from './components/quiz/QuizList'
import QuizRunner from './components/quiz/QuizRunner'
import QuizResults from './components/quiz/QuizResults'
import PapersLibrary from './components/papers/PapersLibrary'

function RootRedirect() {
  const { currentUser } = useAuth()
  return currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><Navbar /><StudentDashboard /></ProtectedRoute>} />
        <Route path="/quizzes" element={<ProtectedRoute><Navbar /><QuizList /></ProtectedRoute>} />
        <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizRunner /></ProtectedRoute>} />
        <Route path="/results/:resultId" element={<ProtectedRoute><Navbar /><QuizResults /></ProtectedRoute>} />
        <Route path="/papers" element={<ProtectedRoute><Navbar /><PapersLibrary /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Navbar /><AdminPanel /></ProtectedRoute>} />
        <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><Navbar /><TeacherPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
