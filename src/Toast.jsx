import { useState, useEffect } from 'react'

function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // 애니메이션 완료 후 제거
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-enter' : 'toast-exit'}`}>
      <span className="toast-icon">{iconMap[type]}</span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

// Toast 관리를 위한 커스텀 훅
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'info', duration = 3000, id = null) => {
    const toastId = id || Date.now()
    const newToast = { id: toastId, message, type, duration }
    
    // 동일한 ID가 있으면 업데이트, 없으면 추가
    setToasts(prev => {
      const existingIndex = prev.findIndex(t => t.id === toastId)
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = newToast
        return updated
      }
      return [...prev, newToast]
    })
    
    return toastId
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return { toasts, showToast, removeToast }
}

// Toast Container 컴포넌트
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default Toast