import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { practiceDB } from './supabaseClient'
import { generateCoachingAdvice, generateWeeklyReport, getRandomTip } from './utils/coachingEngine'
import Calendar from './Calendar'
import { useLanguage } from './hooks/useLanguage'

function PracticeHistory({ user, onNavigateToPractice }) {
  const navigate = useNavigate()
  const { t, currentLanguage } = useLanguage()
  
  // 언어별 로케일 매핑
  const getLocale = () => {
    const localeMap = {
      ko: 'ko-KR',
      en: 'en-US', 
      ja: 'ja-JP',
      zh: 'zh-CN',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU'
    }
    return localeMap[currentLanguage] || 'ko-KR'
  }

  // 미소 타입 번역
  const getSmileTypeName = (smileType) => {
    if (!smileType) return t('smilePractice')
    
    // 새로운 키 방식 (practice, social, joy)
    if (['practice', 'social', 'joy'].includes(smileType)) {
      return t(`${smileType}SmileTitle`)
    }
    
    // 기존 한국어 텍스트 매핑 (하위 호환성)
    const legacyMapping = {
      '자기계발 미소': t('practiceSmileTitle'),
      '소통의 미소': t('socialSmileTitle'),
      '기쁨의 미소': t('joySmileTitle'),
      '미소 연습': t('smilePractice')
    }
    
    return legacyMapping[smileType] || smileType
  }
  const [history, setHistory] = useState([])
  const [, setLoading] = useState(true)
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
  const [selectedDate, setSelectedDate] = useState(null) // 선택된 날짜의 상세 정보

  // 컴포넌트 로드 시 기록 불러오기
  useEffect(() => {
    loadHistory()
  }, [user])

  // 코칭 조언 생성
  useEffect(() => {
    if (history.length > 0 || todayStats.sessions === 0) {
      const advice = generateCoachingAdvice(history, todayStats, currentLanguage)
      setCoachingAdvice(advice)
      
      // 주간 리포트 생성 (일요일이거나 7일 이상 연습한 경우)
      const today = new Date().getDay()
      const hasWeekOfData = history.filter(s => {
        const daysDiff = Math.floor((new Date() - new Date(s.date)) / (1000 * 60 * 60 * 24))
        return daysDiff < 7
      }).length >= 7
      
      if (today === 0 || hasWeekOfData) {
        const report = generateWeeklyReport(history, currentLanguage)
        setWeeklyReport(report)
      }
    }
  }, [history, todayStats, currentLanguage])

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
            time: new Date(session.created_at).toLocaleTimeString(getLocale()),
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
        console.error(t('loadingHistoryError'), error)
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
  // eslint-disable-next-line no-unused-vars
  const addPracticeSession = (maxScore, avgScore, duration) => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식
    const now = new Date()
    
    const newSession = {
      id: Date.now(),
      date: today,
      time: now.toLocaleTimeString(getLocale()),
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
    return t('durationFormat', { minutes, seconds: remainingSeconds })
  }

  // 기록 삭제
  // eslint-disable-next-line no-unused-vars
  const deleteSession = (sessionId) => {
    const updatedHistory = history.filter(session => session.id !== sessionId)
    saveHistory(updatedHistory)
    calculateTodayStats(updatedHistory)
  }

  // 전체 기록 삭제
  // eslint-disable-next-line no-unused-vars
  const clearAllHistory = () => {
    if (confirm(t('deleteAllRecordsConfirm'))) {
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
        <h3>{t('myGrowthGraph')}</h3>
        <div className="progress-summary">
          <div className="current-average">
            <span className="average-label">{t('thisWeekAverage')}</span>
            <span className="average-score">{weeklyProgress.current}%</span>
          </div>
          {weeklyProgress.change !== 0 && (
            <div className={`trend-indicator ${weeklyProgress.trend}`}>
              <span className="trend-arrow">
                {weeklyProgress.trend === 'up' ? '↑' : '↓'}
              </span>
              <span className="trend-text">
                {t('comparedToLastWeek', { change: Math.abs(weeklyProgress.change), trend: weeklyProgress.trend === 'up' ? t('improved') : t('declined') })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 오늘의 통계 */}
      <div className="today-stats">
        <h3>{t('todaysPracticeStats')}</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{todayStats.sessions}</span>
            <span className="stat-label">{t('practiceCount')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{todayStats.maxScore}%</span>
            <span className="stat-label">{t('highestScore')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{todayStats.avgScore}%</span>
            <span className="stat-label">{t('averageScore')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{formatDuration(todayStats.totalTime)}</span>
            <span className="stat-label">{t('totalPracticeTime')}</span>
          </div>
        </div>
      </div>

      {/* 회원가입 유도 배너 (게스트용) */}
      {!user && (
        <div className="premium-banner">
          <div className="banner-content">
            <h3>⚠️ {t('recordsNotSavedInGuestMode')}</h3>
            <p className="warning-text">{t('practiceInTempMode')}</p>
            <button onClick={() => navigate('/signup')} className="cta-button">
              {t('freeSignup')}
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
            {t('weeklyReport')} {showWeeklyReport ? t('hide') : t('show')}
          </button>
          {showWeeklyReport && (
            <div className="weekly-report-content">
              <h4>{weeklyReport.summary}</h4>
              {weeklyReport.achievements.length > 0 && (
                <div className="achievements">
                  <h5>{t('thisWeekAchievements')}</h5>
                  <ul>
                    {weeklyReport.achievements.map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
              {weeklyReport.nextWeekGoals.length > 0 && (
                <div className="next-goals">
                  <h5>{t('nextWeekGoals')}</h5>
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
        <h3>{t('todaysPersonalizedAdvice')}</h3>
        {coachingAdvice && (
          <div className={`coaching-card ${coachingAdvice.category}`}>
            <div className="coach-main-message">
              <p>{coachingAdvice.mainMessage}</p>
            </div>
            
            {/* 기술적 조언 */}
            {coachingAdvice.technicalTips.length > 0 && (
              <div className="technical-tips">
                <h4>{t('improvementPoints')}</h4>
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
                <h4>{t('todaysMuscleExercise')}</h4>
                <ul>
                  {coachingAdvice.exercises.map((exercise, idx) => (
                    <li key={idx}>{exercise}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 다음 목표 */}
            <div className="next-goal">
              <h4>{t('nextGoal')}</h4>
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
                {t('startPractice')}
              </button>
              <button onClick={() => {
                const newTip = getRandomTip(currentLanguage)
                setCoachingAdvice({...coachingAdvice, motivationalQuote: newTip})
              }} className="action-btn secondary">
                {t('viewOtherAdvice')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 날짜별 기록 */}
      <div className="history-list">
        <div className="history-header">
          <h3>{t('practiceRecord')}</h3>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              {t('today')}
            </button>
            <button 
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              {t('diary')}
            </button>
          </div>
        </div>
        
        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' ? (
          <Calendar sessions={history} onDateClick={(date) => {
            // 로컬 날짜 문자열 생성 (YYYY-MM-DD)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`
            
            const dateSessions = history.filter(session => session.date === dateStr)
            if (dateSessions.length > 0) {
              setSelectedDate({ date: dateStr, sessions: dateSessions })
            } else {
              // 기록이 없어도 날짜 정보는 표시
              setSelectedDate({ date: dateStr, sessions: [] })
            }
          }} />
        ) : (
          /* 오늘의 기록 뷰 */
          (() => {
            const today = new Date().toISOString().split('T')[0]
            const todaySessions = groupedHistory[today] || []
            return todaySessions.length === 0 ? (
              <p className="no-history">{t('noPracticeRecordToday')}</p>
            ) : (
              <div key={today} className="date-group">
                <h4 className="date-header">
                  {t('todaysRecord')}
                </h4>
                <div className="sessions-list">
                  {todaySessions.map(session => (
                    <div key={session.id} className="session-card">
                      <div className="session-header">
                        <span className="session-type">{getSmileTypeName(session.smileType)}</span>
                        <span className="session-score">{session.maxScore}%</span>
                      </div>
                      <div className="session-details">
                        <span className="time">{session.time}</span>
                        <span className="duration">{formatDuration(session.duration)}</span>
                        {session.emotionBefore && (
                          <span className="mood-change">
                            {session.emotionBefore === 'happy' ? t('emotionGood') : session.emotionBefore === 'neutral' ? t('emotionNeutral') : t('emotionTired')} 
                            → 
                            {session.maxScore >= 80 ? t('good') : session.maxScore >= 50 ? t('fair') : t('average')}
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
                            alt={t('bestMomentAlt')} 
                            className="session-capture-thumb"
                          />
                          <span className="capture-label">{t('bestMoment')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()  
        )}
      </div>
      
      {/* 날짜별 상세 기록 모달 */}
      {selectedDate && (
        <div className="date-detail-modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="date-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDate(null)}>×</button>
            <h3 className="modal-title">
              {new Date(selectedDate.date).toLocaleDateString(getLocale(), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </h3>
            
            <div className="modal-content">
              {selectedDate.sessions.length > 0 ? (
                <>
                  {/* 그날의 통계 */}
                  <div className="date-stats">
                    <div className="stat-item">
                      <span className="stat-number">{selectedDate.sessions.length}</span>
                      <span className="stat-label">{t('practiceCount')}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {Math.max(...selectedDate.sessions.map(s => s.maxScore))}%
                      </span>
                      <span className="stat-label">{t('highestScore')}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {Math.round(
                          selectedDate.sessions.reduce((sum, s) => sum + s.avgScore, 0) / 
                          selectedDate.sessions.length
                        )}%
                      </span>
                      <span className="stat-label">{t('averageScore')}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {formatDuration(
                          selectedDate.sessions.reduce((sum, s) => sum + s.duration, 0)
                        )}
                      </span>
                      <span className="stat-label">{t('totalPracticeTime')}</span>
                    </div>
                  </div>
              
              {/* 최고의 순간 사진들 */}
              {selectedDate.sessions.some(s => s.metrics?.capturedPhoto) && (
                <div className="date-captures">
                  <h4>{t('bestMoments')} 📸</h4>
                  <div className="captures-grid">
                    {selectedDate.sessions
                      .filter(s => s.metrics?.capturedPhoto)
                      .map(session => (
                        <div 
                          key={session.id} 
                          className="capture-item"
                          onClick={() => {
                            setSelectedCapture({
                              photo: session.metrics.capturedPhoto,
                              analysis: session.metrics.capturedAnalysis,
                              date: session.date,
                              smileType: session.smileType
                            })
                            setSelectedDate(null)
                          }}
                        >
                          <img 
                            src={session.metrics.capturedPhoto} 
                            alt={t('bestMomentAlt')} 
                            className="capture-thumb"
                          />
                          <div className="capture-info">
                            <span className="capture-score">{session.maxScore}%</span>
                            <span className="capture-time">{session.time}</span>
                          </div>
                        </div>
                      ))
                  }
                  </div>
                </div>
              )}
              
              {/* 세션별 상세 정보 */}
              <div className="date-sessions">
                <h4>{t('practiceSessionDetails')}</h4>
                {selectedDate.sessions.map(session => (
                  <div key={session.id} className="session-detail">
                    <div className="session-header">
                      <span className="session-type">{getSmileTypeName(session.smileType)}</span>
                      <span className="session-time">{session.time}</span>
                    </div>
                    <div className="session-metrics">
                      <span>{t('highestScore')}: {session.maxScore}%</span>
                      <span>{t('averageScore')}: {session.avgScore}%</span>
                      <span>{t('practiceTime')}: {formatDuration(session.duration)}</span>
                    </div>
                    {session.context && (
                      <div className="session-context">
                        <span>{t('practiceContext')}: {session.context}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
                </>
              ) : (
                <div className="no-sessions-message">
                  <p>{t('noPracticeRecordThisDay')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 최고의 순간 상세보기 모달 */}
      {selectedCapture && (
        <div className="capture-modal-overlay" onClick={() => setSelectedCapture(null)}>
          <div className="capture-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCapture(null)}>×</button>
            <h3 className="modal-title">{t('bestMoment')} 📸</h3>
            
            <div className="modal-content">
              <img 
                src={selectedCapture.photo} 
                alt={t('bestMomentAlt')} 
                className="modal-photo"
              />
              
              {selectedCapture.analysis && (
                <div className="modal-analysis">
                  <div className="analysis-score">
                    <span className="score-label">{t('score')}</span>
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
                      <h4>{t('coachingMessage')}</h4>
                      {selectedCapture.analysis.coaching.map((message, idx) => (
                        <p key={idx} className="coaching-message">{message}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="modal-info">
                <span className="info-date">{selectedCapture.date}</span>
                <span className="info-type">{getSmileTypeName(selectedCapture.smileType)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PracticeHistory