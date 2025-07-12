/**
 * SmileShot 전문 코칭 엔진
 * 사용자의 연습 패턴을 분석하고 맞춤형 조언을 제공합니다.
 */

// 미소 타입별 한글 이름
const SMILE_TYPE_NAMES = {
  'genuine': '진짜 미소',
  'professional': '프로페셔널 미소',
  'warm': '따뜻한 미소',
  'confident': '자신감 있는 미소',
  'bright': '밝은 미소'
}

// 메트릭별 개선 조언
const METRIC_ADVICE = {
  confidence: {
    low: '거울을 보며 눈을 마주치는 연습을 해보세요. 자신감은 눈빛에서 시작됩니다.',
    medium: '좋습니다! 어깨를 더 펴고 턱을 살짝 들어보세요.',
    high: '훌륭한 자신감입니다! 이 느낌을 유지하세요.'
  },
  stability: {
    low: '천천히 심호흡하고, 얼굴 근육을 이완시킨 후 미소를 지어보세요.',
    medium: '안정감이 늘고 있습니다. 3초간 미소를 유지하는 연습을 해보세요.',
    high: '완벽한 안정감입니다! 자연스러움도 함께 신경써보세요.'
  },
  naturalness: {
    low: '행복했던 순간을 떠올리며 미소 지어보세요. 감정이 먼저, 표정이 따라옵니다.',
    medium: '점점 자연스러워지고 있어요. 눈과 입이 함께 웃도록 연습해보세요.',
    high: '매우 자연스러운 미소입니다! 다양한 상황에서도 시도해보세요.'
  }
}

// 근육 운동 가이드
const MUSCLE_EXERCISES = {
  beginner: [
    '입꼬리 올리기: 입꼬리를 귀 방향으로 올려 5초 유지, 10회 반복',
    '볼 부풀리기: 볼을 최대한 부풀렸다가 천천히 빼기, 5회 반복',
    '입술 오므리기: "오" 모양으로 입술을 오므렸다가 "이" 모양으로 펴기, 10회'
  ],
  intermediate: [
    '비대칭 미소: 한쪽 입꼬리만 올려 3초 유지, 양쪽 각 10회',
    '눈 미소: 입은 그대로 두고 눈으로만 웃기, 10초 유지 5회',
    '단계별 미소: 20% → 50% → 80% → 100% 강도로 미소 짓기, 5세트'
  ],
  advanced: [
    '미세 조절: 10단계로 나누어 미소 강도 조절하기',
    '감정 전환: 무표정 → 미소 → 크게 웃기 → 미소, 부드럽게 전환',
    '지속력 훈련: 자연스러운 미소를 1분간 유지하기'
  ]
}

/**
 * 사용자의 연습 기록을 분석하여 맞춤형 코칭 조언을 생성합니다.
 * @param {Array} history - 전체 연습 기록
 * @param {Object} todayStats - 오늘의 통계
 * @returns {Object} 코칭 조언 객체
 */
export function generateCoachingAdvice(history, todayStats) {
  const analysis = analyzeUserPattern(history)
  const advice = {
    mainMessage: '',
    technicalTips: [],
    exercises: [],
    motivationalQuote: '',
    nextGoal: '',
    recommendedPracticeTime: '',
    category: 'general' // motivation, technical, consistency, achievement
  }

  // 1. 연습하지 않은 경우
  if (todayStats.sessions === 0) {
    return generateMotivationalAdvice(analysis)
  }

  // 2. 성과 기반 조언
  if (todayStats.avgScore >= 90) {
    return generateAchievementAdvice(analysis, todayStats)
  } else if (todayStats.avgScore >= 70) {
    return generateProgressAdvice(analysis, todayStats)
  } else {
    return generateImprovementAdvice(analysis, todayStats)
  }
}

/**
 * 사용자의 연습 패턴을 분석합니다.
 */
function analyzeUserPattern(history) {
  const now = new Date()
  const analysis = {
    // 기간별 데이터
    last7Days: [],
    last30Days: [],
    
    // 연습 패턴
    totalSessions: history.length,
    averageScore: 0,
    improvementRate: 0,
    
    // 시간대 분석
    morningPractice: 0, // 6-12시
    afternoonPractice: 0, // 12-18시
    eveningPractice: 0, // 18-24시
    
    // 연속 연습
    currentStreak: 0,
    longestStreak: 0,
    
    // 미소 타입별 분석
    smileTypeStats: {},
    
    // 약점 분석
    weakestMetric: null,
    weakestScore: 100,
    metricScores: {
      confidence: { total: 0, count: 0, avg: 0 },
      stability: { total: 0, count: 0, avg: 0 },
      naturalness: { total: 0, count: 0, avg: 0 }
    },
    
    // 성장 추세
    isImproving: false,
    growthRate: 0
  }

  // 기간별 데이터 필터링
  history.forEach(session => {
    const sessionDate = new Date(session.date)
    const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 7) {
      analysis.last7Days.push(session)
    }
    if (daysDiff < 30) {
      analysis.last30Days.push(session)
    }
    
    // 시간대 분석
    const hour = new Date(session.timestamp).getHours()
    if (hour >= 6 && hour < 12) analysis.morningPractice++
    else if (hour >= 12 && hour < 18) analysis.afternoonPractice++
    else if (hour >= 18 && hour < 24) analysis.eveningPractice++
    
    // 미소 타입별 통계
    const smileType = session.smileType || 'general'
    if (!analysis.smileTypeStats[smileType]) {
      analysis.smileTypeStats[smileType] = {
        count: 0,
        totalScore: 0,
        avgScore: 0
      }
    }
    analysis.smileTypeStats[smileType].count++
    analysis.smileTypeStats[smileType].totalScore += session.maxScore
    
    // 메트릭 데이터 수집 (있는 경우)
    if (session.metrics) {
      ['confidence', 'stability', 'naturalness'].forEach(metric => {
        if (session.metrics[metric] !== undefined) {
          analysis.metricScores[metric].total += session.metrics[metric]
          analysis.metricScores[metric].count++
        }
      })
    }
  })

  // 평균 점수 계산
  if (analysis.last30Days.length > 0) {
    analysis.averageScore = Math.round(
      analysis.last30Days.reduce((sum, s) => sum + s.maxScore, 0) / analysis.last30Days.length
    )
  }

  // 미소 타입별 평균 계산
  Object.keys(analysis.smileTypeStats).forEach(type => {
    const stats = analysis.smileTypeStats[type]
    stats.avgScore = Math.round(stats.totalScore / stats.count)
  })
  
  // 메트릭별 평균 계산 및 약점 파악
  let lowestMetricScore = 100
  Object.keys(analysis.metricScores).forEach(metric => {
    const metricData = analysis.metricScores[metric]
    if (metricData.count > 0) {
      metricData.avg = Math.round(metricData.total / metricData.count)
      if (metricData.avg < lowestMetricScore) {
        lowestMetricScore = metricData.avg
        analysis.weakestMetric = metric
        analysis.weakestScore = metricData.avg
      }
    }
  })

  // 성장률 계산 (최근 7일 vs 이전 7일)
  if (analysis.last30Days.length >= 14) {
    const recent7 = analysis.last7Days
    const previous7 = analysis.last30Days.filter(session => {
      const daysDiff = Math.floor((now - new Date(session.date)) / (1000 * 60 * 60 * 24))
      return daysDiff >= 7 && daysDiff < 14
    })
    
    if (recent7.length > 0 && previous7.length > 0) {
      const recentAvg = recent7.reduce((sum, s) => sum + s.maxScore, 0) / recent7.length
      const previousAvg = previous7.reduce((sum, s) => sum + s.maxScore, 0) / previous7.length
      analysis.growthRate = Math.round(((recentAvg - previousAvg) / previousAvg) * 100)
      analysis.isImproving = recentAvg > previousAvg
    }
  }

  // 연속 연습 일수 계산
  analysis.currentStreak = calculateStreak(history)

  // 가장 많이 연습하는 시간대 찾기
  const timePreference = Math.max(
    analysis.morningPractice,
    analysis.afternoonPractice,
    analysis.eveningPractice
  )
  
  if (timePreference === analysis.morningPractice) {
    analysis.preferredTime = 'morning'
  } else if (timePreference === analysis.afternoonPractice) {
    analysis.preferredTime = 'afternoon'
  } else {
    analysis.preferredTime = 'evening'
  }

  return analysis
}

/**
 * 연속 연습 일수를 계산합니다.
 */
function calculateStreak(history) {
  if (history.length === 0) return 0
  
  const sortedDates = [...new Set(history.map(s => s.date))]
    .sort((a, b) => new Date(b) - new Date(a))
  
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() - i)
    const expected = expectedDate.toISOString().split('T')[0]
    
    if (sortedDates[i] === expected || (i === 0 && sortedDates[0] === today)) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

/**
 * 동기부여 조언 생성 (연습하지 않은 경우)
 */
function generateMotivationalAdvice(analysis) {
  const timeRecommendations = {
    morning: '오전 시간',
    afternoon: '오후 시간',
    evening: '저녁 시간',
    general: '하루 중 편한 시간'
  }

  const preferredTime = analysis.preferredTime || 'general'
  
  const messages = [
    {
      condition: analysis.currentStreak > 0,
      message: `${analysis.currentStreak}일 연속 연습 중이에요! 오늘도 이어가세요.`
    },
    {
      condition: analysis.totalSessions > 20,
      message: '꾸준히 연습해온 당신, 오늘도 멋진 미소를 만들어봐요!'
    },
    {
      condition: analysis.last7Days.length === 0,
      message: '일주일만에 돌아오셨네요! 다시 시작하는 것이 중요합니다.'
    },
    {
      condition: true,
      message: '오늘 첫 연습을 시작해보세요! 작은 시작이 큰 변화를 만듭니다.'
    }
  ]

  const mainMessage = messages.find(m => m.condition)?.message || messages[messages.length - 1].message

  return {
    mainMessage,
    technicalTips: [
      '편안한 자세로 시작하세요',
      '거울을 보며 자연스럽게 미소 지어보세요',
      '깊은 호흡으로 긴장을 풀어주세요'
    ],
    exercises: MUSCLE_EXERCISES.beginner.slice(0, 2),
    motivationalQuote: '미소는 당신이 착용할 수 있는 가장 아름다운 것입니다.',
    nextGoal: '오늘 5분만 투자해서 3회 연습해보세요',
    recommendedPracticeTime: `${timeRecommendations[preferredTime]}에 연습하면 좋아요`,
    category: 'motivation'
  }
}

/**
 * 성취 조언 생성 (90점 이상)
 */
function generateAchievementAdvice(analysis, todayStats) {
  const smileTypes = Object.keys(analysis.smileTypeStats)
  const leastPracticedType = smileTypes.length < 5 ? 
    ['genuine', 'professional', 'warm', 'confident', 'bright']
      .find(type => !smileTypes.includes(type)) : null

  return {
    mainMessage: `훌륭해요! 오늘 평균 ${todayStats.avgScore}점을 달성했습니다. 전문가 수준에 도달했어요!`,
    technicalTips: [
      '다양한 각도에서 연습해보세요',
      '감정을 더 깊이 느끼며 미소 지어보세요',
      leastPracticedType ? 
        `'${SMILE_TYPE_NAMES[leastPracticedType]}' 스타일도 도전해보세요` :
        '이제 실전에서 자신있게 사용해보세요'
    ],
    exercises: MUSCLE_EXERCISES.advanced.slice(0, 2),
    motivationalQuote: '완벽한 연습이 완벽을 만듭니다. 당신은 이미 전문가입니다!',
    nextGoal: analysis.currentStreak >= 7 ? 
      '7일 연속 달성! 이제 14일 도전해보세요' :
      '매일 꾸준히 연습해서 마스터가 되어보세요',
    recommendedPracticeTime: '짧은 시간이라도 매일 연습하세요',
    category: 'achievement'
  }
}

/**
 * 진행 중 조언 생성 (70-89점)
 */
function generateProgressAdvice(analysis, todayStats) {
  // 가장 약한 미소 타입 찾기
  let weakestType = null
  let weakestTypeScore = 100
  
  Object.entries(analysis.smileTypeStats).forEach(([type, stats]) => {
    if (stats.avgScore < weakestTypeScore) {
      weakestType = type
      weakestTypeScore = stats.avgScore
    }
  })

  const improvementFocus = analysis.growthRate > 5 ? 
    '성장 속도가 빨라요!' : 
    '꾸준히 발전하고 있어요.'

  return {
    mainMessage: `좋은 진전이에요! ${improvementFocus} 평균 ${todayStats.avgScore}점을 기록했습니다.`,
    technicalTips: [
      '눈과 입이 함께 웃도록 신경써보세요',
      '미소를 3초 이상 자연스럽게 유지해보세요',
      weakestType ? 
        `'${SMILE_TYPE_NAMES[weakestType] || weakestType}' 연습을 더 해보세요` :
        '다양한 감정을 담아 연습해보세요'
    ],
    exercises: MUSCLE_EXERCISES.intermediate.slice(0, 2),
    motivationalQuote: '발전하는 모습이 보여요. 조금만 더 하면 목표 달성!',
    nextGoal: `다음 목표는 ${Math.min(todayStats.avgScore + 10, 95)}점입니다`,
    recommendedPracticeTime: analysis.preferredTime === 'morning' ? 
      '오전 연습을 계속 유지하세요' : 
      '저녁 시간에 하루를 마무리하며 연습해보세요',
    category: 'technical'
  }
}

/**
 * 개선 필요 조언 생성 (70점 미만)
 */
function generateImprovementAdvice(analysis, todayStats) {
  const focusAreas = []
  
  // 메트릭 분석을 통한 약점 파악
  if (analysis.weakestMetric) {
    focusAreas.push(analysis.weakestMetric)
  } else {
    // 메트릭 정보가 없다면 점수 기반으로 추정
    if (todayStats.avgScore < 50) {
      focusAreas.push('naturalness')
    } else if (todayStats.avgScore < 60) {
      focusAreas.push('stability')
    } else {
      focusAreas.push('confidence')
    }
  }

  const primaryFocus = focusAreas[0]

  return {
    mainMessage: '좋은 시작이에요! 긴장을 풀고 편안하게 연습해보세요.',
    technicalTips: [
      METRIC_ADVICE[primaryFocus].low,
      '거울을 보며 표정을 관찰해보세요',
      '작은 미소부터 시작해서 점점 크게 웃어보세요'
    ],
    exercises: MUSCLE_EXERCISES.beginner,
    motivationalQuote: '모든 전문가도 초보자였습니다. 꾸준함이 답입니다.',
    nextGoal: '편안한 마음으로 70점을 목표로 해보세요',
    recommendedPracticeTime: '스트레스 없는 시간에 5분씩 연습하세요',
    category: 'improvement'
  }
}

/**
 * 주간 리포트 생성
 */
export function generateWeeklyReport(history) {
  const analysis = analyzeUserPattern(history)
  const report = {
    summary: '',
    achievements: [],
    improvements: [],
    nextWeekGoals: []
  }

  // 요약
  if (analysis.last7Days.length === 0) {
    report.summary = '이번 주는 연습을 하지 않으셨네요. 다시 시작해볼까요?'
  } else {
    const avgScore = Math.round(
      analysis.last7Days.reduce((sum, s) => sum + s.maxScore, 0) / analysis.last7Days.length
    )
    report.summary = `이번 주 ${analysis.last7Days.length}회 연습, 평균 ${avgScore}점`
  }

  // 성과
  if (analysis.currentStreak >= 7) {
    report.achievements.push('7일 연속 연습 달성! 🎉')
  }
  if (analysis.growthRate > 10) {
    report.achievements.push(`${analysis.growthRate}% 성장했어요!`)
  }

  // 개선 필요 사항
  if (analysis.last7Days.length < 5) {
    report.improvements.push('주 5회 이상 연습을 목표로 해보세요')
  }

  // 다음 주 목표
  report.nextWeekGoals.push(
    analysis.currentStreak >= 7 ? '연속 기록을 이어가세요' : '매일 연습하기',
    '새로운 미소 타입 도전하기',
    '평균 점수 5점 올리기'
  )

  return report
}

// 미소 연습 팁 생성기
export function getRandomTip() {
  const tips = [
    '눈으로도 웃어보세요. 진짜 미소는 눈에서 시작됩니다.',
    '깊게 숨을 쉬고 어깨의 긴장을 풀어보세요.',
    '행복했던 순간을 떠올리며 미소 지어보세요.',
    '거울 속 자신과 눈을 마주치며 연습해보세요.',
    '입꼬리를 살짝 올리는 것부터 시작해보세요.',
    '미소는 얼굴 전체가 함께 움직이는 것입니다.',
    '자연스러운 미소는 천천히 피어납니다.',
    '편안한 마음이 아름다운 미소를 만듭니다.'
  ]
  
  return tips[Math.floor(Math.random() * tips.length)]
}