import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { auth } from './supabaseClient'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // 리다이렉트 메시지 확인
  const message = location.state?.message

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const { data, error } = await auth.signIn(formData.email, formData.password)
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: '이메일 또는 비밀번호가 올바르지 않습니다' })
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: '이메일 인증을 완료해주세요. 받은 편지함을 확인해주세요.' })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        // 로그인 성공
        const redirectTo = location.state?.from || '/app'
        navigate(redirectTo)
      }
    } catch (error) {
      setErrors({ general: '로그인 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-form-container">
            <div className="auth-header">
              <h1>SmileShot</h1>
              <h2>로그인</h2>
              <p>다시 만나서 반가워요!</p>
            </div>

            {message && (
              <div className="info-message">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {errors.general && (
                <div className="error-message general">{errors.general}</div>
              )}
              
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="이메일"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="auth-divider">
              <span>또는</span>
            </div>

            <div className="guest-option">
              <Link to="/" className="guest-link">
                게스트로 체험하기 (하루 1회)
              </Link>
            </div>

            <div className="auth-footer">
              <p>계정이 없으신가요?</p>
              <Link to="/signup" className="auth-link">회원가입</Link>
            </div>

        <div className="auth-home">
          <Link to="/" className="home-link">← 홈으로 돌아가기</Link>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Login