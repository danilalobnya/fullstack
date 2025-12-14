import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import api, { clearTokens } from '../services/api'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    name: '',
    phone: ''
  })
  const [familyMembers, setFamilyMembers] = useState([])
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/users/me')
        setUser(response.data.user)
        setFamilyMembers(response.data.family_members || [])
        setSmsNotifications(response.data.user.sms_notifications)
      } catch (err) {
        setError('Не удалось загрузить профиль')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleAddFamilyMember = async () => {
    const name = prompt('Имя члена семьи')
    const phone = prompt('Телефон члена семьи')
    if (!name || !phone) return
    try {
      const response = await api.post('/users/me/family', { name, phone })
      setFamilyMembers((prev) => [...prev, response.data])
    } catch {
      setError('Не удалось добавить члена семьи')
    }
  }

  const handleSmsToggle = async (checked) => {
    setSmsNotifications(checked)
    try {
      const response = await api.put('/users/me', { sms_notifications: checked })
      setUser((prev) => ({ ...prev, sms_notifications: response.data.sms_notifications }))
    } catch {
      setSmsNotifications(!checked)
      setError('Не удалось обновить настройки уведомлений')
    }
  }

  const handleLogout = () => {
    clearTokens()
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Профиль</h1>
      </div>

      <div className="container">
        <div className="profile-card">
          <div className="profile-avatar">😊</div>
          <h2 className="profile-name">{user.name}</h2>
          <p className="profile-phone">{user.phone}</p>

          {error && <div className="error-message">{error}</div>}

          <div className="family-section">
            <h3>Моя семья</h3>
            <div className="family-members">
              {familyMembers.map((member) => (
                <div key={member.id} className="family-member">
                  <span className="member-avatar">😊</span>
                  <div className="member-info">
                    <strong>{member.name}</strong>
                    <span>{member.phone}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="invite-btn" onClick={handleAddFamilyMember}>
              Пригласить
            </button>
          </div>

          <div className="profile-divider"></div>

          <div className="sms-section">
            <label className="sms-toggle">
              <span>Получать SMS уведомления</span>
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => handleSmsToggle(e.target.checked)}
                className="sms-checkbox"
              />
            </label>
          </div>

          <div className="logout-section">
            <button className="btn-primary" onClick={handleLogout}>
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default Profile
