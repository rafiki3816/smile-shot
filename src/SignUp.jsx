import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from './supabaseClient'
import './Auth.css'

function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)

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
    
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요'
    }
    
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const { data, error } = await auth.signUp(
        formData.email, 
        formData.password,
        { name: formData.name }
      )
      
      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: '이미 가입된 이메일입니다' })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        // 회원가입 성공
        // Supabase의 이메일 인증 설정에 따라 처리
        if (data.user && !data.session) {
          // 이메일 인증이 필요한 경우
          setShowEmailVerification(true)
        } else if (data.session) {
          // 이메일 인증이 필요없는 경우 (또는 이미 인증된 경우)
          alert('회원가입이 완료되었습니다!')
          navigate('/app')
        }
      }
    } catch (error) {
      setErrors({ general: '회원가입 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  if (showEmailVerification) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-form-container">
            <div className="auth-header">
              <h1>SmileShot</h1>
              <h2>이메일 인증 필요</h2>
              <p>거의 다 왔어요!</p>
            </div>
            
            <div className="email-verification-info">
              <div className="verification-icon">📧</div>
              <h3>이메일을 확인해주세요</h3>
              <p>{formData.email}로 인증 링크를 보냈어요.</p>
              <p>이메일의 인증 링크를 클릭하면 회원가입이 완료됩니다.</p>
              
              <div className="verification-tips">
                <h4>이메일이 오지 않나요?</h4>
                <ul>
                  <li>스팸 메일함을 확인해주세요</li>
                  <li>이메일 주소가 올바른지 확인해주세요</li>
                  <li>몇 분 정도 기다려주세요</li>
                </ul>
              </div>
              
              <button 
                onClick={() => navigate('/login')} 
                className="auth-submit"
              >
                로그인 페이지로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-form-container">
            <div className="auth-header">
              <h1>SmileShot</h1>
              <h2>회원가입</h2>
              <p>무제한 미소 연습을 시작하세요</p>
            </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="error-message general">{errors.general}</div>
          )}
          
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="이름"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
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
              placeholder="비밀번호 (6자 이상)"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="auth-footer">
          <p>이미 계정이 있으신가요?</p>
          <Link to="/login" className="auth-link">로그인</Link>
        </div>

        <div className="auth-home">
          <Link to="/" className="home-link">← 홈으로 돌아가기</Link>
        </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp