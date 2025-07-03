import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import SmileDetector from './SmileDetector'
import PracticeHistory from './PracticeHistory'
import SignUp from './SignUp'
import Login from './Login'
import Landing from './Landing'
import { auth, supabase } from './supabaseClient'
import './App.css'

// 보호된 라우트 컴포넌트
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const session = await auth.getSession()
      const allowFreeSession = localStorage.getItem('allowFreeSession') === 'true'
      
      if (session || allowFreeSession) {
        setAuthenticated(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!authenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function MainApp() {
  const [currentTab, setCurrentTab] = useState('practice')
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // 세션 확인
    auth.getSession().then(session => {
      setUser(session?.user || null)
      if (session?.user) {
        // 사용자 메타데이터에서 이름 가져오기
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || '회원'
        setUserName(name)
      }
    })

    // 인증 상태 변경 구독
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || '회원'
        setUserName(name)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await auth.signOut()
    navigate('/')
  }

  return (
    <>
      {/* 상단 헤더 */}
      <div className="app-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← 처음으로
        </button>
        <div className="user-info">
          <span className="user-name">{user ? userName : '게스트'}</span>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="tab-menu">
        <button 
          className={`tab-button ${currentTab === 'practice' ? 'active' : ''}`}
          onClick={() => setCurrentTab('practice')}
        >
          연습하기
        </button>
        <button 
          className={`tab-button ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentTab('history')}
        >
          기록 보기
        </button>
        {user && (
          <button 
            className="tab-button logout"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        )}
      </div>

      {/* 탭 내용 */}
      <div className="tab-content">
        {currentTab === 'practice' ? (
          <div className="main-content">
            <div className="practice-section">
              <h3>미소 점수 AI 분석</h3>
              <p>실시간으로 미소 점수를 측정하고 연습해보세요!</p>
              <SmileDetector user={user} />
            </div>
          </div>
        ) : (
          <PracticeHistory user={user} />
        )}
      </div>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App