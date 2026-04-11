import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import StudentDashboard from './components/dashboard/StudentDashboard'
import TeacherPanel from './components/dashboard/TeacherPanel'
import QuizList from './components/quiz/QuizList'
import QuizRunner from './components/quiz/QuizRunner'
import QuizResults from './components/quiz/QuizResults'
import PapersLibrary from './components/papers/PapersLibrary'
import LessonsList from './components/lessons/LessonsList'
import LessonView from './components/lessons/LessonView'
import MyResults from './components/dashboard/MyResults'

// Admin section
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import CreateLesson from './components/admin/CreateLesson'
import CreateQuiz from './components/admin/CreateQuiz'
import ManageContent from './components/admin/ManageContent'
import AdminResults from './components/admin/AdminResults'

function RootRedirect() {
  const { currentUser, isAdmin } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Learner routes ─────────────────────────────────── */}
        <Route path="/dashboard"         element={<ProtectedRoute><Navbar /><StudentDashboard /></ProtectedRoute>} />
        <Route path="/quizzes"           element={<ProtectedRoute><Navbar /><QuizList /></ProtectedRoute>} />
        <Route path="/quiz/:quizId"      element={<ProtectedRoute><QuizRunner /></ProtectedRoute>} />
        <Route path="/results/:resultId" element={<ProtectedRoute><Navbar /><QuizResults /></ProtectedRoute>} />
        <Route path="/papers"            element={<ProtectedRoute><Navbar /><PapersLibrary /></ProtectedRoute>} />
        <Route path="/lessons"           element={<ProtectedRoute><Navbar /><LessonsList /></ProtectedRoute>} />
        <Route path="/lessons/:lessonId" element={<ProtectedRoute><Navbar /><LessonView /></ProtectedRoute>} />
        <Route path="/my-results"        element={<ProtectedRoute><Navbar /><MyResults /></ProtectedRoute>} />
        <Route path="/teacher"           element={<ProtectedRoute requiredRole="teacher"><Navbar /><TeacherPanel /></ProtectedRoute>} />

        {/* ── Admin routes (all wrapped in AdminLayout) ──────── */}
        <Route path="/admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/lessons/new"  element={<AdminRoute><CreateLesson /></AdminRoute>} />
        <Route path="/admin/quizzes/new"  element={<AdminRoute><CreateQuiz /></AdminRoute>} />
        <Route path="/admin/content"      element={<AdminRoute><ManageContent /></AdminRoute>} />
        <Route path="/admin/results"      element={<AdminRoute><AdminResults /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
