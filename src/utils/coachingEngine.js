/**
 * SmileShot Professional Coaching Engine
 * Analyzes user practice patterns and provides personalized advice
 * Internationalized version with translation support
 */

import { getTranslation } from '../translations'

/**
 * Generate personalized coaching advice based on practice history
 * @param {Array} history - Complete practice history
 * @param {Object} todayStats - Today's statistics
 * @param {String} language - Current language code
 * @returns {Object} Coaching advice object
 */
export function generateCoachingAdvice(history, todayStats, language = 'ko') {
  const t = (key, params) => getTranslation(key, language, params)
  const analysis = analyzeUserPattern(history)
  
  // 1. No practice today
  if (todayStats.sessions === 0) {
    return generateMotivationalAdvice(analysis, language)
  }
  
  // 2. Performance-based advice
  if (todayStats.avgScore >= 90) {
    return generateAchievementAdvice(analysis, todayStats, language)
  } else if (todayStats.avgScore >= 70) {
    return generateProgressAdvice(analysis, todayStats, language)
  } else {
    return generateImprovementAdvice(analysis, todayStats, language)
  }
}

/**
 * Analyze user practice patterns
 */
function analyzeUserPattern(history) {
  const now = new Date()
  const analysis = {
    // Period data
    last7Days: [],
    last30Days: [],
    
    // Practice patterns
    totalSessions: history.length,
    averageScore: 0,
    improvementRate: 0,
    
    // Time analysis
    morningPractice: 0,
    afternoonPractice: 0,
    eveningPractice: 0,
    
    // Streak
    currentStreak: 0,
    longestStreak: 0,
    
    // Smile type analysis
    smileTypeStats: {},
    
    // Weakness analysis
    weakestMetric: null,
    weakestScore: 100,
    metricScores: {
      confidence: { total: 0, count: 0, avg: 0 },
      stability: { total: 0, count: 0, avg: 0 },
      naturalness: { total: 0, count: 0, avg: 0 }
    },
    
    // Growth trend
    isImproving: false,
    growthRate: 0
  }
  
  // Filter data by period
  history.forEach(session => {
    const sessionDate = new Date(session.date)
    const daysDiff = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 7) {
      analysis.last7Days.push(session)
    }
    if (daysDiff < 30) {
      analysis.last30Days.push(session)
    }
    
    // Time analysis
    const hour = new Date(session.timestamp).getHours()
    if (hour >= 6 && hour < 12) analysis.morningPractice++
    else if (hour >= 12 && hour < 18) analysis.afternoonPractice++
    else if (hour >= 18 && hour < 24) analysis.eveningPractice++
    
    // Smile type statistics
    const smileType = session.smileType || 'practice'
    if (!analysis.smileTypeStats[smileType]) {
      analysis.smileTypeStats[smileType] = {
        count: 0,
        totalScore: 0,
        avgScore: 0
      }
    }
    analysis.smileTypeStats[smileType].count++
    analysis.smileTypeStats[smileType].totalScore += session.maxScore
    
    // Metric data collection
    if (session.metrics) {
      ['confidence', 'stability', 'naturalness'].forEach(metric => {
        if (session.metrics[metric] !== undefined) {
          analysis.metricScores[metric].total += session.metrics[metric]
          analysis.metricScores[metric].count++
        }
      })
    }
  })
  
  // Calculate averages
  if (analysis.last30Days.length > 0) {
    analysis.averageScore = Math.round(
      analysis.last30Days.reduce((sum, s) => sum + s.maxScore, 0) / analysis.last30Days.length
    )
  }
  
  // Smile type averages
  Object.keys(analysis.smileTypeStats).forEach(type => {
    const stats = analysis.smileTypeStats[type]
    stats.avgScore = Math.round(stats.totalScore / stats.count)
  })
  
  // Metric averages and weakness identification
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
  
  // Growth rate calculation
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
  
  // Calculate streak
  analysis.currentStreak = calculateStreak(history)
  
  // Find preferred practice time
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
 * Calculate consecutive practice days
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
 * Generate motivational advice (no practice today)
 */
function generateMotivationalAdvice(analysis, language) {
  const t = (key, params) => getTranslation(key, language, params)
  
  let mainMessage = ''
  if (analysis.currentStreak > 0) {
    mainMessage = t('coachingStreakMessage', { days: analysis.currentStreak })
  } else if (analysis.totalSessions > 20) {
    mainMessage = t('coachingConsistentUser')
  } else if (analysis.last7Days.length === 0) {
    mainMessage = t('coachingWelcomeBack')
  } else {
    mainMessage = t('coachingFirstPractice')
  }
  
  return {
    mainMessage,
    technicalTips: [
      t('coachingTipRelax'),
      t('coachingTipMirror'),
      t('coachingTipBreathe')
    ],
    exercises: [
      t('exerciseBeginnerLipCorner'),
      t('exerciseBeginnerCheekPuff')
    ],
    motivationalQuote: t('motivationalQuote1'),
    nextGoal: t('goalTodayPractice'),
    recommendedPracticeTime: t('recommendedTime' + 
      (analysis.preferredTime ? analysis.preferredTime.charAt(0).toUpperCase() + analysis.preferredTime.slice(1) : 'General')),
    category: 'motivation'
  }
}

/**
 * Generate achievement advice (90+ score)
 */
function generateAchievementAdvice(analysis, todayStats, language) {
  const t = (key, params) => getTranslation(key, language, params)
  
  return {
    mainMessage: t('coachingExcellent', { score: todayStats.avgScore }),
    technicalTips: [
      t('coachingTipAngles'),
      t('coachingTipEmotion'),
      t('coachingTipRealWorld')
    ],
    exercises: [
      t('exerciseAdvancedMicroControl'),
      t('exerciseAdvancedEmotionSwitch')
    ],
    motivationalQuote: t('motivationalQuote2'),
    nextGoal: analysis.currentStreak >= 7 ? 
      t('goal14Days') : t('goalDaily'),
    recommendedPracticeTime: t('recommendedTimeShort'),
    category: 'achievement'
  }
}

/**
 * Generate progress advice (70-89 score)
 */
function generateProgressAdvice(analysis, todayStats, language) {
  const t = (key, params) => getTranslation(key, language, params)
  
  const improvementFocus = analysis.growthRate > 5 ? 
    t('coachingFastGrowth') : t('coachingSteadyProgress')
  
  return {
    mainMessage: t('coachingGoodProgress', { 
      focus: improvementFocus, 
      score: todayStats.avgScore 
    }),
    technicalTips: [
      t('coachingTipEyesAndMouth'),
      t('coachingTipHold3Seconds'),
      t('coachingTipVariety')
    ],
    exercises: [
      t('exerciseIntermediateAsymmetric'),
      t('exerciseIntermediateEyeSmile')
    ],
    motivationalQuote: t('motivationalQuote3'),
    nextGoal: t('goalNextScore', { score: Math.min(todayStats.avgScore + 10, 95) }),
    recommendedPracticeTime: analysis.preferredTime === 'morning' ? 
      t('recommendedTimeMorning') : t('recommendedTimeEvening'),
    category: 'technical'
  }
}

/**
 * Generate improvement advice (<70 score)
 */
function generateImprovementAdvice(analysis, todayStats, language) {
  const t = (key, params) => getTranslation(key, language, params)
  
  const focusAreas = []
  if (analysis.weakestMetric) {
    focusAreas.push(analysis.weakestMetric)
  } else {
    if (todayStats.avgScore < 50) {
      focusAreas.push('naturalness')
    } else if (todayStats.avgScore < 60) {
      focusAreas.push('stability')
    } else {
      focusAreas.push('confidence')
    }
  }
  
  const primaryFocus = focusAreas[0]
  const metricAdviceKey = `metricAdvice${primaryFocus.charAt(0).toUpperCase() + primaryFocus.slice(1)}Low`
  
  return {
    mainMessage: t('coachingGoodStart'),
    technicalTips: [
      t(metricAdviceKey),
      t('coachingTipObserve'),
      t('coachingTipStartSmall')
    ],
    exercises: [
      t('exerciseBeginnerLipCorner'),
      t('exerciseBeginnerCheekPuff'),
      t('exerciseBeginnerLipPurse')
    ],
    motivationalQuote: t('motivationalQuote4'),
    nextGoal: t('goal70Points'),
    recommendedPracticeTime: t('recommendedTimeStressFree'),
    category: 'improvement'
  }
}

/**
 * Generate weekly report
 */
export function generateWeeklyReport(history, language = 'ko') {
  const t = (key, params) => getTranslation(key, language, params)
  const analysis = analyzeUserPattern(history)
  const report = {
    summary: '',
    achievements: [],
    improvements: [],
    nextWeekGoals: []
  }
  
  // Summary
  if (analysis.last7Days.length === 0) {
    report.summary = t('weeklyReportNoPractice')
  } else {
    const avgScore = Math.round(
      analysis.last7Days.reduce((sum, s) => sum + s.maxScore, 0) / analysis.last7Days.length
    )
    report.summary = t('weeklyReportSummary', { 
      count: analysis.last7Days.length, 
      score: avgScore 
    })
  }
  
  // Achievements
  if (analysis.currentStreak >= 7) {
    report.achievements.push(t('achievement7Days'))
  }
  if (analysis.growthRate > 10) {
    report.achievements.push(t('achievementGrowth', { rate: analysis.growthRate }))
  }
  
  // Improvements needed
  if (analysis.last7Days.length < 5) {
    report.improvements.push(t('improvement5Days'))
  }
  
  // Next week goals
  report.nextWeekGoals.push(
    analysis.currentStreak >= 7 ? t('goalContinueStreak') : t('goalDailyPractice'),
    t('goalNewSmileType'),
    t('goalIncrease5Points')
  )
  
  return report
}

/**
 * Get a random practice tip
 */
export function getRandomTip(language = 'ko') {
  const t = (key) => getTranslation(key, language)
  const tips = [
    t('practiceTip1'),
    t('practiceTip2'),
    t('practiceTip3'),
    t('practiceTip4'),
    t('practiceTip5'),
    t('practiceTip6'),
    t('practiceTip7'),
    t('practiceTip8')
  ]
  
  return tips[Math.floor(Math.random() * tips.length)]
}