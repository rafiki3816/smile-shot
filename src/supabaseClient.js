import { createClient } from '@supabase/supabase-js'

// Supabase 프로젝트 URL과 익명 키를 환경 변수에서 가져옵니다
// 이 값들은 Supabase 대시보드에서 확인할 수 있습니다
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 인증 헬퍼 함수들
export const auth = {
  // 회원가입
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/app`
      }
    })
    return { data, error }
  },

  // 로그인
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 현재 사용자 가져오기
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 세션 가져오기
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

// 연습 세션 데이터베이스 작업
export const practiceDB = {
  // 연습 세션 저장
  saveSession: async (sessionData) => {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert([{ ...sessionData, user_id: user.id }])
    
    return { data, error }
  },

  // 사용자의 연습 세션 가져오기
  getUserSessions: async () => {
    const user = await auth.getCurrentUser()
    if (!user) return { data: [], error: null }
    
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // 오늘의 연습 횟수 가져오기
  getTodaySessionCount: async () => {
    const user = await auth.getCurrentUser()
    if (!user) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count, error } = await supabase
      .from('practice_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
    
    return error ? 0 : count
  }
}