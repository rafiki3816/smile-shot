import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import SmileDetector from './SmileDetector'
import PracticeHistory from './PracticeHistory'
import SignUp from './SignUp'
import Login from './Login'
import Landing from './Landing'
import LanguageSelector from './components/LanguageSelector'
import { useLanguage } from './hooks/useLanguage'
import { auth, supabase } from './supabaseClient'
import ScreenReaderAnnouncer from './components/ScreenReaderAnnouncer'
import { announcePageChange } from './utils/announcerUtils'
import PWAInstallPrompt from './components/PWAInstallPrompt'
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
  const [smileDetectorKey, setSmileDetectorKey] = useState(0)
  const { t } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    // 세션 확인
    auth.getSession().then(session => {
      setUser(session?.user || null)
      if (session?.user) {
        // 사용자 메타데이터에서 이름 가져오기
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || t('member')
        setUserName(name)
      }
    })

    // 인증 상태 변경 구독
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || t('member')
        setUserName(name)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Arrow keys for tab navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const tabs = ['practice', 'history']
        const currentIndex = tabs.indexOf(currentTab)
        let newIndex
        
        if (e.key === 'ArrowLeft') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        } else {
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
        }
        
        setCurrentTab(tabs[newIndex])
        setSmileDetectorKey(prev => prev + 1)
        
        // Focus the new tab
        setTimeout(() => {
          document.getElementById(`${tabs[newIndex]}-tab`)?.focus()
        }, 0)
        
        // Announce tab change
        announcePageChange(tabs[newIndex] === 'practice' ? t('practice') : t('history'))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentTab, t])

  const handleLogout = async () => {
    setSmileDetectorKey(prev => prev + 1) // 카메라 정리
    await auth.signOut()
    navigate('/')
  }

  return (
    <div className="app-container">
      <ScreenReaderAnnouncer />
      <PWAInstallPrompt />
      {/* 상단 헤더 */}
      <div className="app-header">
        <button onClick={() => {
          setSmileDetectorKey(prev => prev + 1) // 카메라 정리
          navigate('/')
        }} className="back-button-circle" aria-label={t('back')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="header-center">
          <LanguageSelector />
        </div>
        <div className="user-info">
          <span className="user-name">{user ? userName : t('guest')}</span>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="tab-menu" role="tablist">
        <button 
          className={`tab-button ${currentTab === 'practice' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('practice')
            setSmileDetectorKey(prev => prev + 1) // 컴포넌트 리마운트
          }}
          role="tab"
          aria-selected={currentTab === 'practice'}
          aria-controls="practice-panel"
          id="practice-tab"
          aria-label={t('practiceTab')}
        >
          {t('practice')}
        </button>
        <button 
          className={`tab-button ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('history')
            setSmileDetectorKey(prev => prev + 1) // 컴포넌트 리마운트
          }}
          role="tab"
          aria-selected={currentTab === 'history'}
          aria-controls="history-panel"
          id="history-tab"
          aria-label={t('historyTab')}
        >
          {t('history')}
        </button>
        {/* 로그아웃 버튼 제거 */}
      </div>

      {/* 탭 내용 */}
      <main id={currentTab === 'practice' ? 'practice-panel' : 'history-panel'} className="tab-content" role="tabpanel" aria-labelledby={currentTab === 'practice' ? 'practice-tab' : 'history-tab'} tabIndex="-1">
        {currentTab === 'practice' ? (
          <div className="main-content">
            <div className="practice-section">
              <h3>{t('smileAnalysis')}</h3>
              <p>{t('practiceDescription')}</p>
              <SmileDetector key={smileDetectorKey} user={user} />
            </div>
          </div>
        ) : (
          <PracticeHistory user={user} onNavigateToPractice={() => {
            setCurrentTab('practice')
            setSmileDetectorKey(prev => prev + 1) // 컴포넌트 리마운트
          }} />
        )}
      </main>
      
      {/* 하단 로그아웃 버튼 */}
      {user && (
        <div className="bottom-logout">
          <button 
            className="logout-btn"
            onClick={handleLogout}
            aria-label={t('logoutFromAccount')}
          >
            {t('logout')}
          </button>
        </div>
      )}
    </div>
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