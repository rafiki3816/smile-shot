import { useRef, useEffect, useState } from 'react'

function Camera() {
  const videoRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error)
      alert('카메라에 접근할 수 없습니다.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      setIsStreaming(false)
    }
  }

  return (
    <div className="camera-container">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        style={{ width: '100%', maxWidth: '500px', borderRadius: '10px' }}
      />
      <div className="camera-controls">
        <button onClick={startCamera} disabled={isStreaming}>
          카메라 시작
        </button>
        <button onClick={stopCamera} disabled={!isStreaming}>
          카메라 중지
        </button>
      </div>
    </div>
  )
}

export default Camera
