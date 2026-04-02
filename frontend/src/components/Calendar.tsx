import { useState } from 'react'
import type { CalendarViewType } from '../types/models'
import './Calendar.css'

export interface CalendarProps {
  viewType?: CalendarViewType
  selectedDate?: Date | string | null
  onDateSelect?: (date: Date) => void
  selectedDates?: (Date | string)[]
  currentDate?: Date
}

function Calendar({
  viewType = 'month',
  selectedDate,
  onDateSelect,
  selectedDates = [],
  currentDate: externalCurrentDate,
}: CalendarProps) {
  const [internalCurrentDate] = useState(
    () => externalCurrentDate || (selectedDate ? new Date(selectedDate) : new Date()),
  )
  const currentDate = externalCurrentDate ?? internalCurrentDate

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (selectedDates && selectedDates.length > 0) {
      return selectedDates.some((date) => {
        const dateObj = date instanceof Date ? date : new Date(date)
        return (
          day === dateObj.getDate() &&
          currentDate.getMonth() === dateObj.getMonth() &&
          currentDate.getFullYear() === dateObj.getFullYear()
        )
      })
    }

    if (selectedDate) {
      const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate)
      return (
        day === dateObj.getDate() &&
        currentDate.getMonth() === dateObj.getMonth() &&
        currentDate.getFullYear() === dateObj.getFullYear()
      )
    }

    return false
  }

  const isInRange = (day: number) => {
    if (selectedDates.length < 2) return false
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const sorted = [...selectedDates]
      .map((d) => (d instanceof Date ? d : new Date(d)))
      .sort((a, b) => a.getTime() - b.getTime())
    const start = sorted[0]
    const end = sorted[sorted.length - 1]
    if (!start || !end) return false
    return date >= start && date <= end
  }

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onDateSelect?.(newDate)
  }

  const getCurrentWeek = () => {
    const today = selectedDate ? new Date(selectedDate) : currentDate || new Date()
    const date = new Date(today)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(monday)
      weekDay.setDate(monday.getDate() + i)
      week.push(weekDay)
    }
    return week
  }

  const renderMonthView = () => {
    const days: JSX.Element[] = []
    for (let i = 0; i < firstDayOfMonth - 1; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${isInRange(day) ? 'in-range' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          {day}
        </div>,
      )
    }
    return days
  }

  const renderWeekView = () => {
    const week = getCurrentWeek()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return week.map((date, index) => {
      const day = date.getDate()
      const isCurrentMonth = date.getMonth() === currentDate.getMonth()

      const dateForCheck = new Date(date)
      dateForCheck.setHours(0, 0, 0, 0)
      const isTodayInWeek = dateForCheck.getTime() === today.getTime()

      const isSelectedInWeek =
        !!selectedDate &&
        (() => {
          const selected = new Date(selectedDate)
          selected.setHours(0, 0, 0, 0)
          return dateForCheck.getTime() === selected.getTime()
        })()

      return (
        <div
          key={index}
          className={`calendar-day ${isTodayInWeek ? 'today' : ''} ${isSelectedInWeek ? 'selected' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          {day}
        </div>
      )
    })
  }

  if (viewType === 'day' || viewType === 'week') {
    const week = getCurrentWeek()
    const weekDaysShort = week.map((date) => {
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
      return dayNames[date.getDay()]
    })

    return (
      <div className="calendar calendar-week-view">
        <div className="calendar-grid">
          {weekDaysShort.map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
          {renderWeekView()}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar calendar-month-view">
      <div className="calendar-grid">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {renderMonthView()}
      </div>
    </div>
  )
}

export default Calendar
