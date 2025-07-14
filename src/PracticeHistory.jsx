import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { practiceDB } from './supabaseClient'
import { generateCoachingAdvice, generateWeeklyReport, getRandomTip } from './utils/coachingEngine'
import Calendar from './Calendar'

function PracticeHistory({ user, onNavigateToPractice }) {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayStats, setTodayStats] = useState({
    sessions: 0,
    maxScore: 0,
    avgScore: 0,
    totalTime: 0
  })
  const [coachingAdvice, setCoachingAdvice] = useState(null)
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' 또는 'calendar'
  const [selectedCapture, setSelectedCapture] = useState(null) // 선택된 캡처 모달

  // 컴포넌트 로드 시 기록 불러오기
  useEffect(() => {
    loadHistory()
  }, [user])

  // 코칭 조언 생성
  useEffect(() => {
    if (history.length > 0 || todayStats.sessions === 0) {
      const advice = generateCoachingAdvice(history, todayStats)
      setCoachingAdvice(advice)
      
      // 주간 리포트 생성 (일요일이거나 7일 이상 연습한 경우)
      const today = new Date().getDay()
      const hasWeekOfData = history.filter(s => {
        const daysDiff = Math.floor((new Date() - new Date(s.date)) / (1000 * 60 * 60 * 24))
        return daysDiff < 7
      }).length >= 7
      
      if (today === 0 || hasWeekOfData) {
        const report = generateWeeklyReport(history)
        setWeeklyReport(report)
      }
    }
  }, [history, todayStats])

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
            timestamp: new Date(session.created_at).getTime(),
            metrics: session.metrics || null
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
            <h3>⚠️ 비로그인 상태에서는 기록이 저장되지 않습니다</h3>
            <p className="warning-text">현재 임시 모드로 연습 중입니다. 브라우저를 닫으면 모든 기록이 사라집니다.</p>
            <button onClick={() => navigate('/signup')} className="cta-button">
              무료 회원가입
            </button>
          </div>
        </div>
      )}

      {/* 주간 리포트 */}
      {weeklyReport && (
        <div className="weekly-report-banner">
          <button 
            onClick={() => setShowWeeklyReport(!showWeeklyReport)}
            className="report-toggle"
          >
            주간 리포트 {showWeeklyReport ? '접기' : '보기'}
          </button>
          {showWeeklyReport && (
            <div className="weekly-report-content">
              <h4>{weeklyReport.summary}</h4>
              {weeklyReport.achievements.length > 0 && (
                <div className="achievements">
                  <h5>이번 주 성과</h5>
                  <ul>
                    {weeklyReport.achievements.map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
              {weeklyReport.nextWeekGoals.length > 0 && (
                <div className="next-goals">
                  <h5>다음 주 목표</h5>
                  <ul>
                    {weeklyReport.nextWeekGoals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 전문 코칭 시스템 */}
      <div className="coaching-section professional">
        <h3>오늘의 맞춤 조언</h3>
        {coachingAdvice && (
          <div className={`coaching-card ${coachingAdvice.category}`}>
            <div className="coach-main-message">
              <p>{coachingAdvice.mainMessage}</p>
            </div>
            
            {/* 기술적 조언 */}
            {coachingAdvice.technicalTips.length > 0 && (
              <div className="technical-tips">
                <h4>개선 포인트</h4>
                <ul>
                  {coachingAdvice.technicalTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 근육 운동 가이드 */}
            {coachingAdvice.exercises.length > 0 && (
              <div className="muscle-exercises">
                <h4>오늘의 근육 운동</h4>
                <ul>
                  {coachingAdvice.exercises.map((exercise, idx) => (
                    <li key={idx}>{exercise}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 다음 목표 */}
            <div className="next-goal">
              <h4>다음 목표</h4>
              <p>{coachingAdvice.nextGoal}</p>
            </div>
            
            {/* 추천 연습 시간 */}
            <div className="recommended-time">
              <p>{coachingAdvice.recommendedPracticeTime}</p>
            </div>
            
            {/* 동기부여 문구 */}
            <div className="motivational-quote">
              <p>"{coachingAdvice.motivationalQuote}"</p>
            </div>
            
            <div className="suggested-actions">
              <button onClick={onNavigateToPractice || (() => navigate('/app'))} className="action-btn primary">
                연습 시작하기
              </button>
              <button onClick={() => {
                const newTip = getRandomTip()
                setCoachingAdvice({...coachingAdvice, motivationalQuote: newTip})
              }} className="action-btn secondary">
                다른 조언 보기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 날짜별 기록 */}
      <div className="history-list">
        <div className="history-header">
          <h3>연습 기록</h3>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              목록
            </button>
            <button 
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              캘린더
            </button>
          </div>
        </div>
        
        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' ? (
          <Calendar sessions={history} />
        ) : (
          /* 목록 뷰 */
          Object.keys(groupedHistory).length === 0 ? (
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
                            {session.emotionBefore === 'happy' ? '좋음' : session.emotionBefore === 'neutral' ? '보통' : '힘듦'} 
                            → 
                            {session.maxScore >= 80 ? '좋음' : session.maxScore >= 50 ? '양호' : '보통'}
                          </span>
                        )}
                      </div>
                      {/* 캡처된 최고의 순간 표시 */}
                      {session.metrics?.capturedPhoto && (
                        <div 
                          className="session-capture"
                          onClick={() => setSelectedCapture({
                            photo: session.metrics.capturedPhoto,
                            analysis: session.metrics.capturedAnalysis,
                            date: session.date,
                            smileType: session.smileType
                          })}
                        >
                          <img 
                            src={session.metrics.capturedPhoto} 
                            alt="최고의 순간" 
                            className="session-capture-thumb"
                          />
                          <span className="capture-label">최고의 순간</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        )}
      </div>
      
      {/* 최고의 순간 상세보기 모달 */}
      {selectedCapture && (
        <div className="capture-modal-overlay" onClick={() => setSelectedCapture(null)}>
          <div className="capture-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCapture(null)}>×</button>
            <h3 className="modal-title">최고의 순간 📸</h3>
            
            <div className="modal-content">
              <img 
                src={selectedCapture.photo} 
                alt="최고의 순간" 
                className="modal-photo"
              />
              
              {selectedCapture.analysis && (
                <div className="modal-analysis">
                  <div className="analysis-score">
                    <span className="score-label">점수</span>
                    <span className="score-value">{selectedCapture.analysis.score}%</span>
                  </div>
                  
                  <div className="analysis-metrics">
                    {selectedCapture.analysis.metrics && Object.entries({
                      primary: selectedCapture.analysis.metrics.primary,
                      secondary: selectedCapture.analysis.metrics.secondary,
                      tertiary: selectedCapture.analysis.metrics.tertiary
                    }).map(([key, metric]) => (
                      <div key={key} className="metric-row">
                        <span className="metric-label">{metric.label}</span>
                        <span className="metric-value">{metric.value}%</span>
                      </div>
                    ))}
                  </div>
                  
                  {selectedCapture.analysis.coaching && selectedCapture.analysis.coaching.length > 0 && (
                    <div className="analysis-coaching">
                      <h4>코칭 메시지</h4>
                      {selectedCapture.analysis.coaching.map((message, idx) => (
                        <p key={idx} className="coaching-message">{message}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="modal-info">
                <span className="info-date">{selectedCapture.date}</span>
                <span className="info-type">{selectedCapture.smileType}</span>
              </div>
            </div>
          </div>
        </div>
      )}
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