import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from '../components/Calendar'
import BottomNav from '../components/BottomNav'
import api from '../services/api'
import './MedicationSchedulePage.css'

function MedicationSchedulePage() {
  const navigate = useNavigate()
  const [medications, setMedications] = useState([])
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedTimes, setSelectedTimes] = useState([])
  const [periodType, setPeriodType] = useState('daily')
  const [viewType, setViewType] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const timeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const formatDate = (date) => date.toISOString().split('T')[0]

  useEffect(() => {
    const loadMedications = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          setError('Авторизуйтесь заново')
          setLoading(false)
          return
        }

        const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
        const url = new URL(`${base}/medications/`, window.location.origin)

        const response = await fetch(url.toString(), {
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
        setMedications(data)
      } catch (err) {
        setError('Не удалось загрузить список лекарств')
      } finally {
        setLoading(false)
      }
    }
    loadMedications()
  }, [])

  const handleMedicationSelect = (medication) => {
    setSelectedMedication(medication)
    setShowScheduleForm(true)
    setSelectedDates([])
    setSelectedTimes([])
  }

  const handleDateClick = (date) => {
    setSelectedDates(prev => {
      const dateStr = date.toISOString().split('T')[0]
      const existingIndex = prev.findIndex(d => d.toISOString().split('T')[0] === dateStr)
      
      if (existingIndex >= 0) {
        return prev.filter((_, index) => index !== existingIndex)
      } else {
        return [...prev, date].sort((a, b) => a - b)
      }
    })
  }

  const toggleTime = (time) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time).sort()
        : [...prev, time].sort()
    )
  }

  const handleAddCustomTime = () => {
    const time = prompt('Введите время в формате HH:MM (например, 09:00)')
    if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      if (!selectedTimes.includes(time)) {
        setSelectedTimes([...selectedTimes, time].sort())
      }
    } else if (time) {
      alert('Неверный формат времени. Используйте формат HH:MM (например, 09:00)')
    }
  }

  const handleSubmitSchedule = async () => {
    if (!selectedMedication) {
      alert('Выберите лекарство')
      return
    }
    if (selectedDates.length === 0) {
      alert('Выберите хотя бы одну дату')
      return
    }
    if (selectedTimes.length === 0) {
      alert('Выберите хотя бы одно время приема')
      return
    }
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Авторизуйтесь заново')
        return
      }

      const sortedDates = [...selectedDates].sort((a, b) => a - b)
      const payload = {
        medication_id: selectedMedication.id,
        start_date: formatDate(sortedDates[0]),
        end_date: formatDate(sortedDates[sortedDates.length - 1]),
        times: selectedTimes,
        period_type: periodType
      }

      const base = 'http://localhost:8000/api/v1'
      const response = await fetch(`${base}/appointments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      alert('Лекарство добавлено в расписание!')
      setShowScheduleForm(false)
      setSelectedMedication(null)
      setSelectedDates([])
      setSelectedTimes([])
    } catch (err) {
      setError('Не удалось сохранить расписание')
    }
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  if (showScheduleForm && selectedMedication) {
    return (
      <div className="schedule-page">
        <div className="schedule-header">
          <h1>Добавление лекарства в расписание</h1>
          <button className="back-btn" onClick={() => setShowScheduleForm(false)}>
            ← Назад
          </button>
        </div>

        <div className="container">
          <div className="medication-info">
            <div className="medication-name-display">
              {selectedMedication.name}, {selectedMedication.quantity}
            </div>
          </div>

          <div className="calendar-section">
            <div className="calendar-header-controls">
              <button onClick={() => navigateMonth(-1)} className="nav-btn">‹</button>
              <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
              <button onClick={() => navigateMonth(1)} className="nav-btn">›</button>
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

            <Calendar 
              viewType={viewType} 
              selectedDate={selectedDates[0] || currentDate}
              selectedDates={selectedDates}
              onDateSelect={handleDateClick}
              currentDate={currentDate}
            />
          </div>

          <div className="time-selection">
            <h3>Время приема</h3>
            <div className="time-grid">
              <button 
                className="time-slot add-time" 
                onClick={handleAddCustomTime}
              >
                +
              </button>
              {timeSlots.map(time => (
                <button
                  key={time}
                  className={`time-slot ${selectedTimes.includes(time) ? 'selected' : ''}`}
                  onClick={() => toggleTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="period-selection">
            <h3>Период приема</h3>
            <div className="period-toggle">
              <button
                className={`period-btn ${periodType === 'daily' ? 'active' : ''}`}
                onClick={() => setPeriodType('daily')}
              >
                Каждый день
              </button>
              <button
                className={`period-btn ${periodType === 'every_other_day' ? 'active' : ''}`}
                onClick={() => setPeriodType('every_other_day')}
              >
                Через день
              </button>
            </div>
          </div>

          <button onClick={handleSubmitSchedule} className="submit-btn">
            Добавить
          </button>
        </div>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="medication-schedule-page">
      <div className="schedule-header">
        <h1>Лекарства</h1>
        <p>Расписание приема лекарств</p>
      </div>

      <div className="container">
        <div className="schedule-content">
          <h2>Выберите лекарство для добавления в расписание</h2>
          <p className="info-text">Выберите лекарство из списка, чтобы настроить расписание его приема</p>
          
          {error && <div className="error-message">{error}</div>}

          <div className="medications-grid">
            {loading ? (
              <div>Загрузка...</div>
            ) : medications.length === 0 ? (
              <div className="empty-state">
                <p>У вас пока нет лекарств</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/medications')}
                >
                  Перейти в каталог лекарств
                </button>
              </div>
            ) : (
              medications.map((medication) => (
                <div
                  key={medication.id}
                  className="medication-card"
                  onClick={() => handleMedicationSelect(medication)}
                >
                  <div className="medication-card-name">{medication.name}</div>
                  <div className="medication-card-quantity">{medication.quantity}</div>
                  <button className="add-to-schedule-btn">Добавить в расписание</button>
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

export default MedicationSchedulePage
