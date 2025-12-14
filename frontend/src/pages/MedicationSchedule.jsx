import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Calendar from '../components/Calendar'
import BottomNav from '../components/BottomNav'
import api from '../services/api'
import './MedicationSchedule.css'

function MedicationSchedule() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [medications, setMedications] = useState([])
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedTimes, setSelectedTimes] = useState([])
  const [periodType, setPeriodType] = useState('daily') // daily или every_other_day
  const [viewType, setViewType] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  // Генерация временных слотов
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
        if (id) {
          const med = data.find((m) => m.id === parseInt(id, 10))
          if (med) setSelectedMedication(med)
        } else if (data.length > 0) {
          setSelectedMedication(data[0])
        }
      } catch (err) {
        setError('Не удалось загрузить список лекарств')
      } finally {
        setLoading(false)
      }
    }
    loadMedications()
  }, [id])

  const handleDateClick = (date) => {
    // Множественный выбор дат
    setSelectedDates(prev => {
      const dateStr = date.toISOString().split('T')[0]
      const existingIndex = prev.findIndex(d => d.toISOString().split('T')[0] === dateStr)
      
      if (existingIndex >= 0) {
        // Удаляем дату, если она уже выбрана
        return prev.filter((_, index) => index !== existingIndex)
      } else {
        // Добавляем дату
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

  const handleSubmit = async () => {
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
        period_type: periodType,
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
      navigate('/')
    } catch (err) {
      setError('Не удалось сохранить расписание')
    }
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>Страница лекарств</h1>
        <h2>Добавление лекарства в расписание</h2>
      </div>

      <div className="container">
        {loading && <div>Загрузка...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && medications.length === 0 && (
          <div className="empty-state">
            <p>Сначала добавьте лекарство в каталоге</p>
            <button className="btn-primary" onClick={() => navigate('/medications')}>
              Открыть каталог
            </button>
          </div>
        )}

        <div className="medication-selection">
          <div className="selection-banner">Выбор лекарства из списка</div>
          <select 
            className="medication-select"
            value={selectedMedication?.id || ''}
            onChange={(e) => {
              const med = medications.find(m => m.id === parseInt(e.target.value, 10))
              if (med) setSelectedMedication(med)
            }}
            disabled={loading || medications.length === 0}
          >
            {loading && <option>Загрузка...</option>}
            {!loading && medications.map(med => (
              <option key={med.id} value={med.id}>{med.name}</option>
            ))}
          </select>
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

        {error && <div className="error-message">{error}</div>}

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

        <button onClick={handleSubmit} className="submit-btn">
          Добавить
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

export default MedicationSchedule
