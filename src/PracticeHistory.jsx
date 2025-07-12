import { useState, useEffect } from 'react'

function PracticeHistory() {
  const [history, setHistory] = useState([])
  const [todayStats, setTodayStats] = useState({
    sessions: 0,
    maxScore: 0,
    avgScore: 0,
    totalTime: 0
  })

  // 컴포넌트 로드 시 기록 불러오기
  useEffect(() => {
    loadHistory()
    calculateTodayStats()
  }, [])

  // 기록 불러오기 (메모리에서)
  const loadHistory = () => {
    const saved = localStorage.getItem('smileshot-history')
    if (saved) {
      const parsedHistory = JSON.parse(saved)
      setHistory(parsedHistory)
    }
  }

  // 기록 저장하기 (메모리에)
  const saveHistory = (newHistory) => {
    localStorage.setItem('smileshot-history', JSON.stringify(newHistory))
    setHistory(newHistory)
  }

  // 새 연습 세션 기록 추가
  const addPracticeSession = (maxScore, avgScore, duration) => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식
    const now = new Date()
    
    const newSession = {
      id: Date.now(),
      date: today,
      time: now.toLocaleTimeString('ko-KR'),
      maxScore,
      avgScore,
      duration, // 초 단위
      timestamp: now.getTime()
    }

    const updatedHistory = [newSession, ...history]
    saveHistory(updatedHistory)
    calculateTodayStats(updatedHistory)
  }

  // 오늘 통계 계산
  const calculateTodayStats = (historyData = history) => {
    const today = new Date().toISOString().split('T')[0]
    const todaySessions = historyData.filter(session => session.date === today)
    
    if (todaySessions.length === 0) {
      setTodayStats({ sessions: 0, maxScore: 0, avgScore: 0, totalTime: 0 })
      return
    }

    const maxScore = Math.max(...todaySessions.map(s => s.maxScore))
    const avgScore = Math.round(
      todaySessions.reduce((sum, s) => sum + s.avgScore, 0) / todaySessions.length
    )
    const totalTime = todaySessions.reduce((sum, s) => sum + s.duration, 0)

    setTodayStats({
      sessions: todaySessions.length,
      maxScore,
      avgScore,
      totalTime
    })
  }

  // 날짜별 그룹화
  const groupByDate = () => {
    const grouped = {}
    history.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = []
      }
      grouped[session.date].push(session)
    })
    return grouped
  }

  // 시간 포맷팅
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}분 ${remainingSeconds}초`
  }

  // 기록 삭제
  const deleteSession = (sessionId) => {
    const updatedHistory = history.filter(session => session.id !== sessionId)
    saveHistory(updatedHistory)
    calculateTodayStats(updatedHistory)
  }

  // 전체 기록 삭제
  const clearAllHistory = () => {
    if (confirm('모든 연습 기록을 삭제하시겠습니까?')) {
      saveHistory([])
      setTodayStats({ sessions: 0, maxScore: 0, avgScore: 0, totalTime: 0 })
    }
  }

  const groupedHistory = groupByDate()

  return (
    <div className="practice-history">
      {/* 오늘의 통계 */}
      <div className="today-stats">
        <h3>📊 오늘의 연습 통계</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{todayStats.sessions}</span>
            <span className="stat-label">연습 횟수</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{todayStats.maxScore}%</span>
            <span className="stat-label">최고 점수</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{todayStats.avgScore}%</span>
            <span className="stat-label">평균 점수</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{formatDuration(todayStats.totalTime)}</span>
            <span className="stat-label">총 연습 시간</span>
          </div>
        </div>
      </div>

      {/* 연습 기록 추가 (테스트용) */}
      <div className="add-test-record">
        <button 
          onClick={() => addPracticeSession(
            Math.floor(Math.random() * 40) + 60, // 60-100% 랜덤 최고점수
            Math.floor(Math.random() * 30) + 50, // 50-80% 랜덤 평균점수
            Math.floor(Math.random() * 120) + 30  // 30-150초 랜덤 시간
          )}
          className="test-button"
        >
          테스트 기록 추가
        </button>
        <button onClick={clearAllHistory} className="clear-button">
          전체 기록 삭제
        </button>
      </div>

      {/* 날짜별 기록 */}
      <div className="history-list">
        <h3>📅 연습 기록</h3>
        {Object.keys(groupedHistory).length === 0 ? (
          <p className="no-history">아직 연습 기록이 없습니다.</p>
        ) : (
          Object.entries(groupedHistory)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, sessions]) => (
              <div key={date} className="date-group">
                <h4 className="date-header">
                  {new Date(date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h4>
                <div className="sessions-list">
                  {sessions.map(session => (
                    <div key={session.id} className="session-card">
                      <div className="session-info">
                        <span className="session-time">{session.time}</span>
                        <span className="session-duration">{formatDuration(session.duration)}</span>
                      </div>
                      <div className="session-scores">
                        <span className="max-score">최고: {session.maxScore}%</span>
                        <span className="avg-score">평균: {session.avgScore}%</span>
                      </div>
                      <button 
                        onClick={() => deleteSession(session.id)}
                        className="delete-button"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

// 외부에서 사용할 수 있도록 함수 export
export const addPracticeRecord = (maxScore, avgScore, duration) => {
  // 이 함수는 SmileDetector에서 호출할 예정
  const event = new CustomEvent('addPracticeRecord', {
    detail: { maxScore, avgScore, duration }
  })
  window.dispatchEvent(event)
}

export default PracticeHistory