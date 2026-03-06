import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from '../components/Calendar'
import BottomNav from '../components/BottomNav'
import api from '../services/api'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(() => {
    const saved = localStorage.getItem('selectedFamilyMember')
    return saved ? parseInt(saved, 10) : 0
  })
  const [viewType, setViewType] = useState('day') // day или month
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({ pending: 0, taken: 0, skipped: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [familyMembers, setFamilyMembers] = useState([
    { id: 0, name: 'Я', icon: '👤' },
  ])

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const formatDate = (date) => date.toISOString().split('T')[0]

  const loadFamilyMembers = async () => {
    try {
      const response = await api.get('/users/me/family')
      const normalized = response.data.map((m) => ({ id: m.id, name: m.name, icon: '👤' }))
      setFamilyMembers([{ id: 0, name: 'Я', icon: '👤' }, ...normalized])
    } catch (err) {
      // fallback to default
    }
  }

  const loadAppointments = async (date) => {
    const userId = localStorage.getItem('user_id')
    if (!userId) {
      navigate('/login')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Авторизуйтесь заново')
        setLoading(false)
        return
      }

      const dateStr = formatDate(date)
      const params = new URLSearchParams({
        user_id: userId,
      })
      const familyMemberIdNum = typeof selectedFamilyMember === 'string' ? parseInt(selectedFamilyMember, 10) : selectedFamilyMember
      if (familyMemberIdNum !== 0 && familyMemberIdNum !== null && familyMemberIdNum !== undefined && !isNaN(familyMemberIdNum)) {
        params.append('family_member_id', familyMemberIdNum.toString())
      }

      const base = 'http://localhost:8000/api/v1'
      const url = `${base}/appointments/day/${dateStr}?${params.toString()}`
      console.log('[DEBUG] Loading appointments:', { 
        selectedFamilyMember, 
        selectedFamilyMemberType: typeof selectedFamilyMember,
        url,
        willSendFamilyMemberId: selectedFamilyMember && selectedFamilyMember !== 0
      })
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const data = await response.json()
      const fetched = data.appointments.map((a) => ({
        id: a.id,
        time: a.time,
        medication: a.medication_name,
        dosage: '',
        status: a.status,
      }))
      setAppointments(fetched)
      setStats(data.stats || { pending: 0, taken: 0, skipped: 0, total: 0 })
    } catch (err) {
      setError('Не удалось загрузить приемы. Попробуйте обновить страницу.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  useEffect(() => {
    loadAppointments(selectedDate)
  }, [selectedDate, selectedFamilyMember])

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

  const handleStatusChange = async (appointmentId, newStatus) => {
    // Сохраняем текущую позицию прокрутки
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop

    // Находим текущий прием для определения старого статуса
    const currentAppointment = appointments.find(apt => apt.id === appointmentId)
    const oldStatus = currentAppointment?.status || 'pending'

    // Оптимистичное обновление UI - обновляем appointments
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: newStatus } : apt)),
    )

    // Оптимистичное обновление stats для мгновенного обновления графика
    setStats((prev) => {
      const newStats = { ...prev }
      
      // Уменьшаем счетчик старого статуса
      if (oldStatus === 'taken') {
        newStats.taken = Math.max(0, newStats.taken - 1)
      } else if (oldStatus === 'skipped') {
        newStats.skipped = Math.max(0, newStats.skipped - 1)
      } else if (oldStatus === 'pending') {
        newStats.pending = Math.max(0, newStats.pending - 1)
      }
      
      // Увеличиваем счетчик нового статуса
      if (newStatus === 'taken') {
        newStats.taken = newStats.taken + 1
      } else if (newStatus === 'skipped') {
        newStats.skipped = newStats.skipped + 1
      } else if (newStatus === 'pending') {
        newStats.pending = newStats.pending + 1
      }
      
      return newStats
    })

    // Восстанавливаем позицию прокрутки после обновления состояния
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition)
    })

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Авторизуйтесь заново')
        loadAppointments(selectedDate)
        return
      }

      const base = 'http://localhost:8000/api/v1'
      const url = new URL(`${base}/appointments/status`)
      const familyMemberIdNum = typeof selectedFamilyMember === 'string' ? parseInt(selectedFamilyMember, 10) : selectedFamilyMember
      if (familyMemberIdNum !== 0 && familyMemberIdNum !== null && familyMemberIdNum !== undefined && !isNaN(familyMemberIdNum)) {
        url.searchParams.set('family_member_id', familyMemberIdNum.toString())
      }
      
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ appointment_id: appointmentId, status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      // После успешного обновления загружаем актуальные данные с сервера для синхронизации
      await loadAppointments(selectedDate)
      
      // Восстанавливаем позицию прокрутки после загрузки данных
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    } catch (err) {
      setError('Не удалось обновить статус. Попробуйте еще раз.')
      // В случае ошибки обновляем данные, чтобы откатить оптимистичное обновление
      loadAppointments(selectedDate)
      
      // Восстанавливаем позицию прокрутки после загрузки данных
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    }
  }

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот прием?')) {
      return
    }

    // Сохраняем текущую позицию прокрутки
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop

    // Находим текущий прием для обновления stats
    const currentAppointment = appointments.find(apt => apt.id === appointmentId)
    const appointmentStatus = currentAppointment?.status || 'pending'

    // Оптимистичное обновление UI - удаляем прием из списка
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId))

    // Оптимистичное обновление stats
    setStats((prev) => {
      const newStats = { ...prev }
      if (appointmentStatus === 'taken') {
        newStats.taken = Math.max(0, newStats.taken - 1)
      } else if (appointmentStatus === 'skipped') {
        newStats.skipped = Math.max(0, newStats.skipped - 1)
      } else if (appointmentStatus === 'pending') {
        newStats.pending = Math.max(0, newStats.pending - 1)
      }
      newStats.total = Math.max(0, newStats.total - 1)
      return newStats
    })

    // Восстанавливаем позицию прокрутки после обновления состояния
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition)
    })

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Авторизуйтесь заново')
        loadAppointments(selectedDate)
        return
      }

      const base = 'http://localhost:8000/api/v1'
      // ВАЖНО: передаем family_member_id только если выбран член семьи (не 0)
      const url = new URL(`${base}/appointments/${appointmentId}`)
      const familyMemberIdNum = typeof selectedFamilyMember === 'string' ? parseInt(selectedFamilyMember, 10) : selectedFamilyMember
      if (familyMemberIdNum !== 0 && familyMemberIdNum !== null && familyMemberIdNum !== undefined && !isNaN(familyMemberIdNum)) {
        url.searchParams.set('family_member_id', familyMemberIdNum.toString())
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      // После успешного удаления загружаем актуальные данные с сервера для синхронизации
      await loadAppointments(selectedDate)

      // Восстанавливаем позицию прокрутки после загрузки данных
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    } catch (err) {
      setError('Не удалось удалить прием. Попробуйте еще раз.')
      // В случае ошибки обновляем данные, чтобы откатить оптимистичное обновление
      loadAppointments(selectedDate)

      // Восстанавливаем позицию прокрутки после загрузки данных
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    }
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

  // Сортируем приемы по времени
  const selectedDateAppointments = [...appointments].sort((a, b) => {
    // Сравниваем время в формате "HH:MM"
    const timeA = a.time || '00:00'
    const timeB = b.time || '00:00'
    return timeA.localeCompare(timeB)
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
                onClick={() => {
                  setSelectedFamilyMember(member.id)
                  localStorage.setItem('selectedFamilyMember', member.id.toString())
                }}
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
              {stats.total > 0 && (
                <>
                  {stats.taken > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#4caf50"
                      strokeWidth="8"
                      strokeDasharray={`${(stats.taken / stats.total) * 283} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                      strokeLinecap="round"
                    />
                  )}
                  {stats.skipped > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#f44336"
                      strokeWidth="8"
                      strokeDasharray={`${(stats.skipped / stats.total) * 283} 283`}
                      strokeDashoffset={`-${(stats.taken / stats.total) * 283}`}
                      transform="rotate(-90 50 50)"
                      strokeLinecap="round"
                    />
                  )}
                </>
              )}
            </svg>
            <div className="progress-text">
              {stats.taken}/{stats.total}
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

          {error && <div className="error-message">{error}</div>}

          <div className="appointments-list">
            {loading ? (
              <div>Загрузка...</div>
            ) : selectedDateAppointments.length === 0 ? (
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
                        type="button"
                        className={`status-btn ${appointment.status === 'taken' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.blur()
                          handleStatusChange(appointment.id, 'taken')
                        }}
                        title="Принял"
                      >
                        ✅
                      </button>
                      <button
                        type="button"
                        className={`status-btn ${appointment.status === 'skipped' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.blur()
                          handleStatusChange(appointment.id, 'skipped')
                        }}
                        title="Не принял"
                      >
                        ❌
                      </button>
                      <button
                        type="button"
                        className={`status-btn ${appointment.status === 'pending' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.blur()
                          handleStatusChange(appointment.id, 'pending')
                        }}
                        title="Предстоит"
                      >
                        ⚪
                      </button>
                      <button
                        type="button"
                        className="status-btn delete-btn"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.blur()
                          handleDelete(appointment.id)
                        }}
                        title="Удалить прием"
                      >
                        🗑️
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
