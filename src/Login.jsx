import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { auth } from './supabaseClient'
import { useLanguage } from './hooks/useLanguage'
import LanguageSelector from './components/LanguageSelector'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
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
      newErrors.email = t('emailRequired')
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid')
    }
    
    if (!formData.password) {
      newErrors.password = t('passwordRequired')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      console.log('로그인 시도:', { email: formData.email })
      const { data, error } = await auth.signIn(formData.email, formData.password)
      console.log('로그인 결과:', { data, error })
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: t('loginInvalid') })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        // 로그인 성공
        const redirectTo = location.state?.from || '/app'
        navigate(redirectTo)
      }
    } catch {  
      setErrors({ general: t('loginError') })
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
              <h2>{t('loginTitle')}</h2>
              <p>{t('loginWelcome')}</p>
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
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  aria-label={t('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <span id="email-error" className="error-message" role="alert">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder={t('passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  aria-label={t('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password && <span id="password-error" className="error-message" role="alert">{errors.password}</span>}
              </div>
              
              <button type="submit" className="auth-submit" disabled={loading} aria-label={loading ? t('loginInProgress') : t('login')} aria-busy={loading}>
                {loading ? t('loginButtonLoading') : t('loginButton')}
              </button>
            </form>

            <div className="auth-footer">
              <p>{t('noAccount')}</p>
              <Link to="/signup" className="auth-link" aria-label={t('goToSignupPage')}>{t('signup')}</Link>
            </div>

        <div className="auth-home">
          <Link to="/" className="home-link" aria-label={t('returnToHomePage')}>← {t('backToHome')}</Link>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Login