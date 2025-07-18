import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from './supabaseClient'
import LanguageSelector from './components/LanguageSelector'
import { useLanguage } from './contexts/LanguageContext'
import './Landing.css'

function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    const checkAuth = async () => {
      const session = await auth.getSession()
      if (session) {
        navigate('/app')
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [navigate])

  const handleFreeSession = () => {
    // 무료 세션 사용 시작
    localStorage.setItem('allowFreeSession', 'true')
    // 초기 카운트가 없으면 0으로 설정
    if (!localStorage.getItem('freeSessionCount')) {
      localStorage.setItem('freeSessionCount', '0')
    }
    navigate('/app')
  }

  if (loading) {
    return (
      <div className="landing-container">
        <div className="loading">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="landing-container">
      {/* 상단 센터 언어 선택 버튼 */}
      <div className="landing-language-selector">
        <LanguageSelector />
      </div>
      
      <div className="landing-content">
        <div className="landing-header">
          <h1 className="landing-title">SmileShot</h1>
          <p className="landing-subtitle">{t('landingSubtitle')}</p>
        </div>

        <div className="landing-features">
          <div className="feature-item">
            <div className="feature-number">01</div>
            <h3>{t('feature1Title')}</h3>
            <p>{t('feature1Description')}</p>
          </div>
          <div className="feature-item">
            <div className="feature-number">02</div>
            <h3>{t('feature2Title')}</h3>
            <p>{t('feature2Description')}</p>
          </div>
          <div className="feature-item">
            <div className="feature-number">03</div>
            <h3>{t('feature3Title')}</h3>
            <p>{t('feature3Description')}</p>
          </div>
        </div>

        <div className="landing-actions">
          <Link to="/login" className="action-btn primary">
            {t('login')}
          </Link>
          <Link to="/signup" className="action-btn secondary">
            {t('signup')}
          </Link>
          <button onClick={handleFreeSession} className="action-btn free">
            {t('freeTrialButton')}
          </button>
        </div>

      </div>
    </div>
  )
}

export default Landing