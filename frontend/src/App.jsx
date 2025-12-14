import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HealthCheck from './pages/HealthCheck'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import MedicationList from './pages/MedicationList'
import MedicationSchedule from './pages/MedicationSchedule'
import MedicationSchedulePage from './pages/MedicationSchedulePage'
import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const isAuthenticated = !!token

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('access_token'))
    window.addEventListener('storage', handler)
    window.addEventListener('auth-changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('auth-changed', handler)
    }
  }, [])

  const requireAuth = (element) => (isAuthenticated ? element : <Navigate to="/login" replace />)

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          
          {/* Защищенные маршруты */}
          <Route path="/" element={requireAuth(<Home />)} />
          <Route path="/profile" element={requireAuth(<Profile />)} />
          <Route path="/medications/schedule" element={requireAuth(<MedicationSchedulePage />)} />
          <Route path="/medications" element={requireAuth(<MedicationList />)} />
          <Route path="/medications/:id/schedule" element={requireAuth(<MedicationSchedule />)} />
          
          {/* Health check (для тестирования) */}
          <Route path="/health" element={<HealthCheck />} />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
