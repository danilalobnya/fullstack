import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Calendar from '../components/Calendar'
import BottomNav from '../components/BottomNav'
import './MedicationSchedule.css'

function MedicationSchedule() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedMedication, setSelectedMedication] = useState({ id: 1, name: 'Коллаген морской, 1 капсула' })
  const [medications, setMedications] = useState([])
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedTimes, setSelectedTimes] = useState([])
  const [periodType, setPeriodType] = useState('daily') // daily или every_other_day
  const [viewType, setViewType] = useState('day')
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 10))

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  // Генерация временных слотов
  const timeSlots = []
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  useEffect(() => {
    // TODO: Загрузить список лекарств из API
    setMedications([
      { id: 1, name: 'Коллаген морской, 1 капсула' },
      { id: 2, name: 'Магния цитрат, 2 таблетки' },
      { id: 3, name: 'Omega-3, 1 капсула' }
    ])

    // Загрузить выбранное лекарство
    if (id) {
      const med = medications.find(m => m.id === parseInt(id))
      if (med) setSelectedMedication(med)
    }
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

  const handleSubmit = () => {
    if (selectedDates.length === 0) {
      alert('Выберите хотя бы одну дату')
      return
    }
    if (selectedTimes.length === 0) {
      alert('Выберите хотя бы одно время приема')
      return
    }
    
    // TODO: Отправить данные на API
    console.log('Данные для отправки:', {
      medication_id: selectedMedication.id,
      dates: selectedDates,
      times: selectedTimes,
      period_type: periodType
    })
    
    alert('Лекарство добавлено в расписание!')
    navigate('/')
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
        <div className="medication-selection">
          <div className="selection-banner">Выбор лекарства из списка</div>
          <select 
            className="medication-select"
            value={selectedMedication.id}
            onChange={(e) => {
              const med = medications.find(m => m.id === parseInt(e.target.value))
              if (med) setSelectedMedication(med)
            }}
          >
            {medications.map(med => (
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
