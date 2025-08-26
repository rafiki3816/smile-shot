import { useState } from 'react'
import { useLanguage } from './hooks/useLanguage'
import './Calendar.css'

function Calendar({ sessions, onDateClick }) {
  const { t } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  
  // 월의 첫날과 마지막날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // 캘린더에 표시할 날짜 배열 생성
  const getDaysInMonth = () => {
    const days = []
    const startDay = firstDayOfMonth.getDay() // 0: 일요일, 1: 월요일...
    
    // 이전 달의 날짜들
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        fullDate: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthLastDay - i)
      })
    }
    
    // 현재 달의 날짜들
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      })
    }
    
    // 다음 달의 날짜들 (6주를 채우기 위해)
    const remainingDays = 42 - days.length // 6주 * 7일 = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
      })
    }
    
    return days
  }
  
  // 날짜별 세션 데이터 그룹화
  const getSessionsForDate = (date) => {
    if (!sessions) return []
    
    // 로컬 날짜 문자열 생성 (YYYY-MM-DD)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    return sessions.filter(session => session.date === dateStr)
  }
  
  // 이전/다음 달로 이동
  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }
  
  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const weekDays = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')]
  const days = getDaysInMonth()
  
  // 오늘 날짜 확인
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-month-row">
          <button onClick={() => navigateMonth(-1)} className="nav-button">‹</button>
          <h3 className="calendar-month-title">
            {currentDate.getFullYear()}{t('yearSuffix') === 'year' ? ' ' : ''}{t('yearSuffix')} 
            {t('yearSuffix') === 'year' ? '/ ' : ' '}
            {currentDate.getMonth() + 1}{t('monthSuffix') === 'month' ? ' ' : ''}{t('monthSuffix')}
          </h3>
          <button onClick={() => navigateMonth(1)} className="nav-button">›</button>
        </div>
        <div className="calendar-controls">
          <button onClick={goToToday} className="today-button">{t('today')}</button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {/* 요일 헤더 */}
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        
        {/* 날짜 그리드 */}
        {days.map((day, index) => {
          const daySessions = getSessionsForDate(day.fullDate)
          const hasSession = daySessions.length > 0
          
          return (
            <div
              key={index}
              className={`calendar-day ${day.isCurrentMonth ? '' : 'other-month'} ${isToday(day.fullDate) ? 'today' : ''} ${hasSession ? 'has-session' : ''} ${selectedDate?.toDateString() === day.fullDate.toDateString() ? 'selected' : ''}`}
              role="button"
              tabIndex={day.isCurrentMonth ? 0 : -1}
              aria-label={`${day.fullDate.getFullYear()}년 ${day.fullDate.getMonth() + 1}월 ${day.date}일${hasSession ? ', 연습 기록 있음' : ''}${isToday(day.fullDate) ? ', 오늘' : ''}`}
              onClick={() => {
                if (day.isCurrentMonth) {
                  setSelectedDate(day.fullDate)
                  if (onDateClick) {
                    onDateClick(day.fullDate)
                  }
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && day.isCurrentMonth) {
                  e.preventDefault()
                  setSelectedDate(day.fullDate)
                  if (onDateClick) {
                    onDateClick(day.fullDate)
                  }
                }
              }}
            >
              <div className="day-number">{day.date}</div>
            </div>
          )
        })}
      </div>
      
    </div>
  )
}

export default Calendar