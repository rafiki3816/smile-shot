// 앱 전역 상수 설정

// 무료 체험 설정
export const FREE_TRIAL_LIMIT = 3 // 비회원 무료 체험 횟수

// PWA 설정
export const PWA_CONFIG = {
  INSTALL_PROMPT_PAGE_VIEWS: 3, // PWA 설치 프롬프트 표시 페이지뷰 수
  INSTALL_PROMPT_DELAY: 30000, // PWA 설치 프롬프트 지연 시간 (ms)
}

// 운동 반복 횟수 설정
export const EXERCISE_CONFIG = {
  // 초급 운동
  BEGINNER_LIP_CORNER_HOLD: 5, // 입꼬리 올리기 유지 시간 (초)
  BEGINNER_LIP_CORNER_REPS: 10, // 입꼬리 올리기 반복 횟수
  BEGINNER_CHEEK_PUFF_REPS: 5, // 볼 부풀리기 반복 횟수
  BEGINNER_LIP_PURSE_REPS: 10, // 입술 오므리기 반복 횟수
  
  // 중급 운동
  INTERMEDIATE_ASYMMETRIC_HOLD: 3, // 비대칭 미소 유지 시간 (초)
  INTERMEDIATE_ASYMMETRIC_REPS: 10, // 비대칭 미소 각 쪽 반복 횟수
  INTERMEDIATE_EYE_SMILE_HOLD: 10, // 눈 미소 유지 시간 (초)
  INTERMEDIATE_EYE_SMILE_REPS: 5, // 눈 미소 반복 횟수
  
  // 고급 운동
  ADVANCED_MICRO_STEPS: 10, // 미세 조절 단계 수
}

// 목표 점수 설정
export const GOAL_CONFIG = {
  DEFAULT_TARGET_SCORE: 70, // 기본 목표 점수
  PRACTICE_MINUTES: 5, // 일일 연습 시간 (분)
  DAILY_PRACTICE_COUNT: 3, // 일일 연습 횟수
  WEEKLY_PRACTICE_COUNT: 5, // 주간 최소 연습 횟수
  STREAK_DAYS_FIRST: 7, // 첫 번째 연속 목표 (일)
  STREAK_DAYS_SECOND: 14, // 두 번째 연속 목표 (일)
}

// 기타 설정값들
export const APP_CONFIG = {
  FREE_TRIAL_LIMIT: FREE_TRIAL_LIMIT,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30분
  MAX_PRACTICE_DURATION: 10 * 60 * 1000, // 10분
  ...PWA_CONFIG,
  ...EXERCISE_CONFIG,
  ...GOAL_CONFIG,
}

export default APP_CONFIG