import { useState, useEffect } from 'react'
import './Calendar.css'

function Calendar({ sessions }) {
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
    
    const dateStr = date.toLocaleDateString('ko-KR')
    return sessions.filter(session => {
      const sessionDate = new Date(session.date).toLocaleDateString('ko-KR')
      return sessionDate === dateStr
    })
  }
  
  // 이전/다음 달로 이동
  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }
  
  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const days = getDaysInMonth()
  
  // 오늘 날짜 확인
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)} className="nav-button">‹</button>
        <div className="calendar-title">
          <h3>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
          <button onClick={goToToday} className="today-button">오늘</button>
        </div>
        <button onClick={() => navigateMonth(1)} className="nav-button">›</button>
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
          const maxScore = hasSession ? Math.max(...daySessions.map(s => s.maxScore)) : 0
          
          return (
            <div
              key={index}
              className={`calendar-day ${day.isCurrentMonth ? '' : 'other-month'} ${isToday(day.fullDate) ? 'today' : ''} ${hasSession ? 'has-session' : ''} ${selectedDate?.toDateString() === day.fullDate.toDateString() ? 'selected' : ''}`}
              onClick={() => setSelectedDate(day.fullDate)}
            >
              <div className="day-number">{day.date}</div>
              {hasSession && (
                <div className="session-indicators">
                  <div className="session-count">{daySessions.length}회</div>
                  <div className={`session-score ${maxScore >= 80 ? 'high' : maxScore >= 50 ? 'medium' : 'low'}`}>
                    {maxScore}%
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* 선택된 날짜의 상세 정보 */}
      {selectedDate && (
        <div className="selected-date-details">
          <h4>{selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</h4>
          {getSessionsForDate(selectedDate).length > 0 ? (
            <div className="day-sessions">
              {getSessionsForDate(selectedDate).map((session, idx) => (
                <div key={idx} className="session-summary">
                  <span className="session-time">{session.time}</span>
                  <span className="session-type">{session.smileType || '미소 연습'}</span>
                  <span className="session-score">{session.maxScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-sessions">이 날은 연습 기록이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Calendar