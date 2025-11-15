import { useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav'
import './Profile.css'

function Profile() {
  const [user, setUser] = useState({
    name: 'Даниил Соболев',
    phone: '+7 966 113 10 57'
  })
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: 'Мама', phone: '+7 966 113 10 57' },
    { id: 2, name: 'Брат', phone: '+7 966 113 10 57' }
  ])
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Загрузить данные профиля из API
    setLoading(false)
  }, [])

  const handleAddFamilyMember = () => {
    // TODO: Открыть модальное окно для добавления члена семьи
    alert('Функция добавления члена семьи будет реализована')
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

          <div className="profile-divider"></div>

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
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="sms-checkbox"
              />
            </label>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default Profile
