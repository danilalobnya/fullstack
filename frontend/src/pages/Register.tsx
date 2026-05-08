import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '../services/api'
import { useSeo } from '../hooks/useSeo'
import './Auth.css'

function Register() {
  useSeo({
    title: 'Регистрация | Medication Tracker',
    description: 'Создание аккаунта в приложении контроля приема лекарств.',
    robots: 'noindex, nofollow',
    canonicalPath: '/register',
  })
  const [phone, setPhone] = useState('+7 966 113 10 57')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/auth/register', { phone, password, name })
      alert('Регистрация прошла успешно! Теперь войдите в систему.')
      navigate('/login')
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined
      const timedOut = axios.isAxiosError(err) && err.code === 'ECONNABORTED'
      const noResponse = axios.isAxiosError(err) && !err.response
      setError(
        detail ||
          (timedOut
            ? 'Сервер не ответил вовремя. Запустите бэкенд (uvicorn) и проверьте порт 8000.'
            : noResponse
              ? 'Нет связи с сервером. Убедитесь, что API запущен на http://127.0.0.1:8000.'
              : 'Ошибка регистрации. Попробуйте снова.'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h2 className="auth-page-title">Регистрация</h2>
      <div className="auth-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Номер телефона:</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Повторите пароль:</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Имя:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
