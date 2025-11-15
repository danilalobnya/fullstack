import { useState } from 'react'
import Calendar from '../components/Calendar'
import BottomNav from '../components/BottomNav'
import './Home.css'

function Home() {
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(0)
  const [viewType, setViewType] = useState('day') // day или month
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  // Mock данные для приемов на выбранный день
  const [appointments, setAppointments] = useState([
    { id: 1, time: '08:00', medication: 'Коллаген морской', dosage: '1 капсула', status: 'taken' },
    { id: 2, time: '12:00', medication: 'Магния цитрат', dosage: '2 таблетки', status: 'pending' },
    { id: 3, time: '12:00', medication: 'Omega-3', dosage: '1 капсула', status: 'pending' },
    { id: 4, time: '22:00', medication: 'Магния цитрат', dosage: '2 таблетки', status: 'skipped' }
  ])

  // Mock данные для членов семьи
  const familyMembers = [
    { id: 0, name: 'Даниил', icon: '👧' },
    { id: 1, name: 'Мама', icon: '👤' },
    { id: 2, name: 'Папа', icon: '👤' },
    { id: 3, name: 'Брат', icon: '👤' },
    { id: 4, name: 'Сестра', icon: '👤' }
  ]

  // Вычисляем статистику на сегодня
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(selectedDate)
    aptDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate.getTime() === today.getTime()
  })

  const todayStats = {
    taken: todayAppointments.filter(a => a.status === 'taken').length,
    skipped: todayAppointments.filter(a => a.status === 'skipped').length,
    pending: todayAppointments.filter(a => a.status === 'pending').length,
    total: todayAppointments.length
  }

  const getDayName = (date) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[date.getDay()]
  }

  const getMonthName = (date) => {
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]
    return months[date.getMonth()]
  }

  const handleStatusChange = (appointmentId, newStatus) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return '✅'
      case 'skipped':
        return '❌'
      case 'pending':
      default:
        return '⚪'
    }
  }

  // Фильтруем приемы на выбранную дату
  const selectedDateAppointments = appointments.filter(apt => {
    // TODO: Фильтровать по реальной дате из API
    return true
  })

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Главная страница</h1>
        <div className="family-selector">
          <p>Здравствуйте! Выберите члена семьи</p>
          <div className="family-icons">
            {familyMembers.map((member) => (
              <button
                key={member.id}
                className={`family-icon ${selectedFamilyMember === member.id ? 'selected' : ''}`}
                onClick={() => setSelectedFamilyMember(member.id)}
              >
                {member.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="calendar-controls">
          <div className="calendar-header-controls">
            <button onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(currentDate.getMonth() - 1)
              setCurrentDate(newDate)
            }} className="nav-btn">‹</button>
            <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <button onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(currentDate.getMonth() + 1)
              setCurrentDate(newDate)
            }} className="nav-btn">›</button>
          </div>
          
          <div className="view-toggle-section">
            <button
              className={`toggle-btn ${viewType === 'day' ? 'active' : ''}`}
              onClick={() => setViewType('day')}
            >
              День
            </button>
            <button
              className={`toggle-btn ${viewType === 'month' ? 'active' : ''}`}
              onClick={() => setViewType('month')}
            >
              Месяц
            </button>
          </div>
        </div>

        <Calendar 
          viewType={viewType} 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate}
          currentDate={currentDate}
        />

        <div className="today-stats">
          <h2>Сегодняшние приемы</h2>
          <div className="progress-circle">
            <svg viewBox="0 0 100 100" className="progress-svg">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="8"
              />
              {todayStats.total > 0 && (
                <>
                  {todayStats.taken > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#4caf50"
                      strokeWidth="8"
                      strokeDasharray={`${(todayStats.taken / todayStats.total) * 283} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                      strokeLinecap="round"
                    />
                  )}
                  {todayStats.skipped > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#f44336"
                      strokeWidth="8"
                      strokeDasharray={`${(todayStats.skipped / todayStats.total) * 283} 283`}
                      strokeDashoffset={`-${(todayStats.taken / todayStats.total) * 283}`}
                      transform="rotate(-90 50 50)"
                      strokeLinecap="round"
                    />
                  )}
                </>
              )}
            </svg>
            <div className="progress-text">
              {todayStats.taken}/{todayStats.total}
            </div>
          </div>
        </div>

        <div className="appointments-section">
          <div className="section-header">
            <h2>{getDayName(selectedDate)}, {selectedDate.getDate()} {getMonthName(selectedDate)}</h2>
            <button onClick={handlePrint} className="print-btn">
              <span>печать списка</span>
              <span>🖨️</span>
            </button>
          </div>

          <div className="appointments-list">
            {selectedDateAppointments.length === 0 ? (
              <div className="empty-appointments">На этот день нет запланированных приемов</div>
            ) : (
              selectedDateAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">{appointment.time}</div>
                  <div className={`appointment-card ${appointment.status === 'skipped' ? 'missed' : ''}`}>
                    <div className="appointment-info">
                      <strong>{appointment.medication}</strong>
                      <span>{appointment.dosage}</span>
                    </div>
                    <div className="appointment-status-controls">
                      <button
                        className={`status-btn ${appointment.status === 'taken' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(appointment.id, 'taken')}
                        title="Принял"
                      >
                        ✅
                      </button>
                      <button
                        className={`status-btn ${appointment.status === 'skipped' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(appointment.id, 'skipped')}
                        title="Не принял"
                      >
                        ❌
                      </button>
                      <button
                        className={`status-btn ${appointment.status === 'pending' ? 'active' : ''}`}
                        onClick={() => handleStatusChange(appointment.id, 'pending')}
                        title="Предстоит"
                      >
                        ⚪
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

export default Home
