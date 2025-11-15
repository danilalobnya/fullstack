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

function App() {
  // Для тестирования: проверяем наличие токена в localStorage
  // Если токен есть - пользователь авторизован
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token // Преобразуем в boolean

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          
          {/* Защищенные маршруты */}
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/medications/schedule" element={<MedicationSchedulePage />} />
          <Route path="/medications" element={<MedicationList />} />
          <Route path="/medications/:id/schedule" element={<MedicationSchedule />} />
          
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
