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
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다'
    } else {
      // 숫자와 문자 포함 확인
      const hasLetter = /[a-zA-Z]/.test(formData.password)
      const hasNumber = /[0-9]/.test(formData.password)
      
      if (!hasLetter || !hasNumber) {
        newErrors.password = '비밀번호는 영문자와 숫자를 모두 포함해야 합니다'
      }
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
        console.log('회원가입 성공:', data)
        alert('회원가입이 완료되었습니다!')
        // 이메일 인증이 비활성화되어 있으므로 바로 앱으로 이동
        navigate('/app')
      }
    } catch (error) {
      setErrors({ general: '회원가입 중 오류가 발생했습니다.' })
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
              placeholder="비밀번호 (영문자+숫자, 8자 이상)"
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