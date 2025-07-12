import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from './supabaseClient'
import './Landing.css'

function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

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
        <div className="loading">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <h1 className="landing-title">SmileShot</h1>
          <p className="landing-subtitle">아름다운 미소를 만들어 보세요!</p>
        </div>

        <div className="landing-features">
          <div className="feature-item">
            <div className="feature-number">01</div>
            <h3>실시간 AI 분석</h3>
            <p>얼굴 표정을 실시간으로 분석하여 즉각적인 피드백 제공</p>
          </div>
          <div className="feature-item">
            <div className="feature-number">02</div>
            <h3>상세한 진행 기록</h3>
            <p>매일의 연습 기록과 성장 과정을 한눈에 확인</p>
          </div>
          <div className="feature-item">
            <div className="feature-number">03</div>
            <h3>맞춤형 코칭</h3>
            <p>목적에 맞는 미소 연습과 개인화된 피드백</p>
          </div>
        </div>

        <div className="landing-actions">
          <Link to="/login" className="action-btn primary">
            로그인
          </Link>
          <Link to="/signup" className="action-btn secondary">
            회원가입
          </Link>
          <button onClick={handleFreeSession} className="action-btn free">
            무료로 체험하기 (10회 제공)
          </button>
        </div>

      </div>
    </div>
  )
}

export default Landing