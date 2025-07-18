import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from './supabaseClient'
import { useLanguage } from './contexts/LanguageContext'
import LanguageSelector from './components/LanguageSelector'
import './Auth.css'

function SignUp() {
  const navigate = useNavigate()
  const { t } = useLanguage()
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
      newErrors.name = t('nameRequired')
    }
    
    if (!formData.email) {
      newErrors.email = t('emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid')
    }
    
    if (!formData.password) {
      newErrors.password = t('passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordTooShort')
    } else {
      // 숫자와 문자 포함 확인
      const hasLetter = /[a-zA-Z]/.test(formData.password)
      const hasNumber = /[0-9]/.test(formData.password)
      
      if (!hasLetter || !hasNumber) {
        newErrors.password = t('passwordFormat')
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch')
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
          setErrors({ email: t('emailAlreadyExists') })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        // 회원가입 성공
        console.log('회원가입 성공:', data)
        alert(t('signupSuccess'))
        // 이메일 인증이 비활성화되어 있으므로 바로 앱으로 이동
        navigate('/app')
      }
    } catch (error) {
      setErrors({ general: t('signupError') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* 상단 센터 언어 선택 버튼 */}
      <div className="auth-language-selector">
        <LanguageSelector />
      </div>
      
      <div className="auth-card">
        <div className="auth-form-container">
            <div className="auth-header">
              <h1>SmileShot</h1>
              <h2>{t('signupTitle')}</h2>
              <p>{t('signupWelcome')}</p>
            </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="error-message general">{errors.general}</div>
          )}
          
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder={t('namePlaceholder')}
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
              placeholder={t('emailPlaceholder')}
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
              placeholder={t('passwordPlaceholder')}
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
              placeholder={t('confirmPasswordPlaceholder')}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t('signupButtonLoading') : t('signupButton')}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t('hasAccount')}</p>
          <Link to="/login" className="auth-link">{t('login')}</Link>
        </div>

        <div className="auth-home">
          <Link to="/" className="home-link">← {t('backToHome')}</Link>
        </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp