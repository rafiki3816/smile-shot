import { useState } from 'react'

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