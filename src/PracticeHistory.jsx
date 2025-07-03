import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { practiceDB } from './supabaseClient'

function PracticeHistory({ user }) {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayStats, setTodayStats] = useState({
    sessions: 0,
    maxScore: 0,
    avgScore: 0,
    totalTime: 0
  })

  // 컴포넌트 로드 시 기록 불러오기
  useEffect(() => {
    loadHistory()
  }, [user])

  // 기록 불러오기
  const loadHistory = async () => {
    setLoading(true)
    
    if (user) {
      // 로그인 사용자는 Supabase에서 불러오기
      try {
        const { data, error } = await practiceDB.getUserSessions()
        if (!error && data) {
          // Supabase 데이터를 기존 형식으로 변환
          const formattedHistory = data.map(session => ({
            id: session.id,
            date: new Date(session.created_at).toISOString().split('T')[0],
            time: new Date(session.created_at).toLocaleTimeString('ko-KR'),
            maxScore: session.max_score,
            avgScore: session.avg_score || session.max_score,
            duration: session.duration,
            smileType: session.smile_type,
            context: session.context,
            timestamp: new Date(session.created_at).getTime()
          }))
          setHistory(formattedHistory)
          calculateTodayStats(formattedHistory)
        }
      } catch (error) {
        console.error('기록 불러오기 오류:', error)
      }
    } else {
      // 비로그인 사용자는 localStorage에서 임시 데이터 불러오기
      const tempSessions = localStorage.getItem('tempSessions')
      if (tempSessions) {
        const parsedHistory = JSON.parse(tempSessions)
        setHistory(parsedHistory)
        calculateTodayStats(parsedHistory)
      }
    }
    
    setLoading(false)
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

  // 주간 진행률 계산
  const calculateWeeklyProgress = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weeklyData = history.filter(session => 
      new Date(session.date) >= weekAgo
    )
    const prevWeekData = history.filter(session => {
      const sessionDate = new Date(session.date)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      return sessionDate >= twoWeeksAgo && sessionDate < weekAgo
    })
    
    const currentAvg = weeklyData.length > 0 
      ? Math.round(weeklyData.reduce((sum, s) => sum + s.maxScore, 0) / weeklyData.length)
      : 0
    const prevAvg = prevWeekData.length > 0
      ? Math.round(prevWeekData.reduce((sum, s) => sum + s.maxScore, 0) / prevWeekData.length)
      : 0
    
    return {
      current: currentAvg,
      change: currentAvg - prevAvg,
      trend: currentAvg > prevAvg ? 'up' : currentAvg < prevAvg ? 'down' : 'same'
    }
  }

  const weeklyProgress = calculateWeeklyProgress()

  return (
    <div className="practice-history">
      {/* 진행 상황 시각화 */}
      <div className="progress-section">
        <h3>나의 성장 그래프</h3>
        <div className="progress-summary">
          <div className="current-average">
            <span className="average-label">이번 주 평균</span>
            <span className="average-score">{weeklyProgress.current}%</span>
          </div>
          {weeklyProgress.change !== 0 && (
            <div className={`trend-indicator ${weeklyProgress.trend}`}>
              <span className="trend-arrow">
                {weeklyProgress.trend === 'up' ? '↑' : '↓'}
              </span>
              <span className="trend-text">
                지난주 대비 {Math.abs(weeklyProgress.change)}% {weeklyProgress.trend === 'up' ? '향상' : '하락'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 달성 목표 & 배지 */}
      <div className="achievements-section">
        <h3>달성 목표</h3>
        <div className="badges-grid">
          <div className={`badge ${history.length >= 1 ? 'earned' : 'locked'}`}>
            <div className="badge-icon">🎯</div>
            <div className="badge-name">첫 연습</div>
          </div>
          <div className={`badge ${history.some(s => s.maxScore >= 90) ? 'earned' : 'locked'}`}>
            <div className="badge-icon">⭐</div>
            <div className="badge-name">90점 돌파</div>
          </div>
          <div className={`badge ${history.length >= 30 ? 'earned' : 'locked'}`}>
            <div className="badge-icon">🏆</div>
            <div className="badge-name">30일 마스터</div>
            {history.length < 30 && (
              <div className="badge-progress">{history.length}/30</div>
            )}
          </div>
        </div>
      </div>

      {/* 오늘의 통계 */}
      <div className="today-stats">
        <h3>오늘의 연습 통계</h3>
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

      {/* 회원가입 유도 배너 (게스트용) */}
      {!user && (
        <div className="premium-banner">
          <div className="banner-content">
            <h3>모든 기록을 영구 보관하세요</h3>
            <ul className="benefits-list">
              <li>모든 기기에서 접근 가능</li>
              <li>상세한 분석 리포트</li>
              <li>AI 맞춤형 코칭</li>
            </ul>
            <button onClick={() => navigate('/signup')} className="cta-button">
              무료 회원가입
            </button>
          </div>
        </div>
      )}

      {/* 맞춤 코칭 메시지 */}
      <div className="coaching-section">
        <h3>오늘의 맞춤 조언</h3>
        <div className="coaching-card">
          <div className="coach-message">
            {todayStats.sessions === 0 ? (
              <p>오늘 첫 연습을 시작해보세요! 꾸준한 연습이 완벽한 미소를 만듭니다.</p>
            ) : todayStats.avgScore >= 80 ? (
              <p>훌륭해요! 오늘 평균 {todayStats.avgScore}점을 달성했습니다. 다양한 미소 타입도 도전해보세요!</p>
            ) : (
              <p>좋은 시작입니다! 편안한 마음으로 자연스럽게 웃어보세요. 연습이 완벽을 만듭니다.</p>
            )}
          </div>
          <div className="suggested-actions">
            <button onClick={() => navigate('/app')} className="action-btn primary">
              연습 시작하기
            </button>
          </div>
        </div>
      </div>

      {/* 날짜별 기록 */}
      <div className="history-list">
        <h3>연습 기록</h3>
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
                      <div className="session-header">
                        <span className="session-type">{session.smileType || '미소 연습'}</span>
                        <span className="session-score">{session.maxScore}%</span>
                      </div>
                      <div className="session-details">
                        <span className="time">{session.time}</span>
                        <span className="duration">{formatDuration(session.duration)}</span>
                        {session.emotionBefore && (
                          <span className="mood-change">
                            {session.emotionBefore === 'happy' ? '😊' : session.emotionBefore === 'neutral' ? '😐' : '😔'} 
                            → 
                            {session.maxScore >= 80 ? '😊' : session.maxScore >= 50 ? '🙂' : '😐'}
                          </span>
                        )}
                      </div>
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