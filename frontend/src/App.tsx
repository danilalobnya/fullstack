import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { lazy, Suspense } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import MedicationList from './pages/MedicationList'
import NotFound from './pages/NotFound'
import './App.css'
import { useEffect, useState, type ReactElement } from 'react'

const HealthCheck = lazy(() => import('./pages/HealthCheck'))
const MedicationDetail = lazy(() => import('./pages/MedicationDetail'))
const MedicationSchedule = lazy(() => import('./pages/MedicationSchedule'))
const MedicationSchedulePage = lazy(() => import('./pages/MedicationSchedulePage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [role, setRole] = useState(() => localStorage.getItem('user_role') || 'guest')
  const isAuthenticated = !!token

  useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem('access_token'))
      setRole(localStorage.getItem('user_role') || 'guest')
    }
    window.addEventListener('storage', handler)
    window.addEventListener('auth-changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('auth-changed', handler)
    }
  }, [])

  const requireAuth = (element: ReactElement) =>
    isAuthenticated ? element : <Navigate to="/login" replace />
  const requireRole = (allowedRoles: string[], element: ReactElement) =>
    isAuthenticated && allowedRoles.includes(role) ? element : <Navigate to="/" replace />

  return (
    <Router>
      <Layout>
        <Suspense fallback={<div className="container">Загрузка страницы...</div>}>
          <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

          <Route path="/" element={requireAuth(<Home />)} />
          <Route path="/profile" element={requireAuth(<Profile />)} />
          <Route
            path="/medications/schedule"
            element={requireAuth(<MedicationSchedulePage />)}
          />
          <Route
            path="/medications/:id/schedule"
            element={requireAuth(<MedicationSchedule />)}
          />
          <Route path="/medications/:id" element={requireAuth(<MedicationDetail />)} />
          <Route path="/medications" element={requireAuth(<MedicationList />)} />
          <Route path="/admin" element={requireRole(['admin'], <AdminPanel />)} />

          <Route path="/health" element={<HealthCheck />} />

          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  )
}

export default App
