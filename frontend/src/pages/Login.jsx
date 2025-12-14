import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { setTokens, clearTokens } from '../services/api'
import './Auth.css'

function Login() {
  const [phone, setPhone] = useState('+7 966 113 10 57')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await api.post('/auth/login', { phone, password })
      setTokens(response.data)
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/')
    } catch (err) {
      clearTokens()
      setError(err.response?.data?.detail || 'Неверный номер телефона или пароль')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h2 className="auth-page-title">Авторизация</h2>
      <div className="auth-container">
        <h1>Войти</h1>
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
