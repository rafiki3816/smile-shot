import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as faceapi from 'face-api.js'
import { practiceDB } from './supabaseClient'
import { useToast, ToastContainer } from './Toast'

function SmileDetector({ user }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const { toasts, showToast, removeToast } = useToast()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [smileScore, setSmileScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [maxScoreMetrics, setMaxScoreMetrics] = useState(null)
  const [isDetecting, setIsDetecting] = useState(false)
  
  // 단계적 가이드 상태
  const [currentStep, setCurrentStep] = useState('purpose') // purpose -> emotion -> context -> practice
  const [selectedPurpose, setSelectedPurpose] = useState('')
  const [emotionBefore, setEmotionBefore] = useState('')
  const [smileContext, setSmileContext] = useState('')
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [emotionAfter, setEmotionAfter] = useState('')
  const [wellnessScore, setWellnessScore] = useState(0)
  const [encouragementLevel, setEncouragementLevel] = useState(1)
  
  // 로그인 및 무료 세션 관련
  const [hasUsedFreeSession, setHasUsedFreeSession] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  // 카메라 권한 관련
  const [showCameraPermission, setShowCameraPermission] = useState(false)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  
  // 코칭 메시지 상태
  const [currentCoachingMessages, setCurrentCoachingMessages] = useState([])
  const [currentSmileType, setCurrentSmileType] = useState('')
  
  // 분석 메트릭 상태
  const [metrics, setMetrics] = useState({
    primary: { label: '자신감 지수', value: 30 },
    secondary: { label: '안정감', value: 40 },
    tertiary: { label: '자연스러움', value: 35 }
  })
  
  // AR 근육 가이드 표시 상태
  const [showMuscleGuide, setShowMuscleGuide] = useState(true)
  
  // 현재 점수 상태
  const [currentScore, setCurrentScore] = useState(0)

  // cleanup을 위한 useEffect
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 카메라 정리
      if (isStreaming) {
        const stream = videoRef.current?.srcObject
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
    }
  }, [isStreaming])

  // 미소 타입별 정보 - 전문적 근육 가이드 추가
  const smileTypes = {
    practice: {
      title: "자기계발 미소",
      subtitle: "나를 위한 연습",
      characteristics: [
        "편안하고 안정적인 표정",
        "과하지 않은 자연스러운 정도", 
        "자신감이 느껴지는 미소"
      ],
      situations: "면접, 발표, 자기 사진 촬영에 적합해요",
      coaching: "너무 억지로 웃지 마세요. 자연스럽고 차분하게",
      metrics: {
        primary: "자신감 지수",
        secondary: "안정감",
        tertiary: "자연스러움"
      },
      muscleGuide: {
        primary: "대관골근(광대근) - 입꼬리를 위로 올리는 주요 근육",
        secondary: "눈둘레근 - 진정한 미소의 핵심, 눈가 주름 생성",
        tips: [
          "광대뼈 아래 근육을 부드럽게 수축",
          "눈과 입이 함께 움직이도록 연습",
          "거울을 보며 대칭성 확인"
        ]
      }
    },
    social: {
      title: "소통의 미소", 
      subtitle: "따뜻한 마음 전달",
      characteristics: [
        "따뜻하고 친근한 느낌",
        "상대방에게 편안함을 주는 정도",
        "신뢰감을 전달하는 미소"
      ],
      situations: "고객 응대, 회의, 인사 상황에 적합해요",
      coaching: "상대방이 편안해할 만큼 따뜻하게",
      metrics: {
        primary: "친화력",
        secondary: "신뢰감", 
        tertiary: "편안함"
      },
      muscleGuide: {
        primary: "입꼬리올림근 - 입꼬리를 45도 각도로 올림",
        secondary: "협골소근 - 부드러운 볼 움직임 담당",
        tips: [
          "입꼬리를 귀 방향으로 살짝 당기기",
          "과도한 치아 노출 자제",
          "눈빛에 따뜻함 담기"
        ]
      }
    },
    joy: {
      title: "기쁨의 미소",
      subtitle: "진심 어린 행복", 
      characteristics: [
        "진심에서 우러나는 밝은 표정",
        "눈가 주름까지 자연스럽게",
        "감정이 풍부하게 표현되는 미소"
      ],
      situations: "축하, 감사, 기쁜 소식 전달에 적합해요",
      coaching: "정말 기쁜 마음이 얼굴에 드러나도록",
      metrics: {
        primary: "진정성",
        secondary: "밝기",
        tertiary: "감정 표현력"
      },
      muscleGuide: {
        primary: "대관골근 + 눈둘레근 - 뒤센 미소의 핵심 조합",
        secondary: "입꼬리내림근 억제 - 자연스러운 상승 표현",
        tips: [
          "볼 전체가 올라가도록 광대근 활성화",
          "눈가에 자연스러운 주름 형성",
          "진정한 기쁨은 눈에서 시작됩니다"
        ]
      }
    }
  }

  // AI 모델 로드 및 무료 세션 확인
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('미소 트레이닝 시스템 로드 중...')
        
        const MODEL_URL = window.location.origin + '/models'
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        
        setIsModelLoaded(true)
        console.log('미소 트레이닝 시스템 준비 완료!')
      } catch (error) {
        console.error('시스템 로드 실패:', error)
      }
    }
    
    // 비로그인 사용자의 오늘 무료 세션 사용 여부 확인
    const checkFreeSession = () => {
      if (!user) {
        const today = new Date().toDateString()
        const lastFreeSession = localStorage.getItem('lastFreeSession')
        const allowFreeSession = localStorage.getItem('allowFreeSession') === 'true'
        
        // 무료 체험을 선택했고, 오늘 아직 사용하지 않았다면 허용
        if (allowFreeSession && lastFreeSession !== today) {
          setHasUsedFreeSession(false)
        } else if (lastFreeSession === today) {
          setHasUsedFreeSession(true)
        }
      }
    }
    
    loadModels()
    checkFreeSession()
  }, [user])

  // isDetecting 상태가 변경될 때마다 감지 시작
  useEffect(() => {
    if (isDetecting && isModelLoaded && isStreaming) {
      console.log('미소 트레이닝 분석 시작')
      setSessionStartTime(Date.now())
      detectSmile()
    }
  }, [isDetecting, isModelLoaded, isStreaming])

  // practice 단계 진입 시 카메라 자동 시작
  useEffect(() => {
    if (currentStep === 'practice' && !isStreaming) {
      // 비로그인 사용자가 이미 무료 세션을 사용한 경우
      if (!user && hasUsedFreeSession) {
        setShowLoginPrompt(true)
        setCurrentStep('purpose') // 초기 단계로 되돌림
        return
      }
      startCamera()
    }
  }, [currentStep, user, hasUsedFreeSession])

  // 카메라가 켜지면 자동으로 분석 시작
  useEffect(() => {
    if (isStreaming && isModelLoaded && currentStep === 'practice' && !isDetecting) {
      // 약간의 딜레이를 주어 사용자가 준비할 시간을 줌
      const timer = setTimeout(() => {
        startDetection()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, isModelLoaded, currentStep])

  // 카메라 시작
  const startCamera = async () => {
    try {
      // 먼저 권한 상태 확인
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' })
          if (permissionStatus.state === 'denied') {
            setCameraPermissionDenied(true)
            return
          }
        } catch (e) {
          // permissions API를 지원하지 않는 브라우저는 그냥 진행
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setShowCameraPermission(false)
        setCameraPermissionDenied(false)
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermissionDenied(true)
      } else if (error.name === 'NotFoundError') {
        showToast('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.', 'error')
      } else {
        showToast('카메라 접근 중 오류가 발생했습니다.', 'error')
      }
    }
  }

  // 카메라 중지
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      setIsStreaming(false)
      setIsDetecting(false)
    }
  }

  // 단계별 진행
  const handlePurposeSelect = (purpose) => {
    setSelectedPurpose(purpose)
    // 목적에 따른 자동 매핑
    const purposeToContext = {
      confidence: 'practice',
      relationship: 'social', 
      happiness: 'joy'
    }
    setSmileContext(purposeToContext[purpose])
    setCurrentStep('emotion')
  }

  const handleEmotionSelect = (emotion) => {
    setEmotionBefore(emotion)
    setCurrentStep('context')
  }

  const handleContextConfirm = () => {
    setCurrentStep('practice')
    // practice 단계 진입 시 카메라 자동 시작
    startCamera()
  }

  // 미소 감지 시작
  const startDetection = () => {
    if (!isModelLoaded || !isStreaming) {
      showToast('먼저 카메라를 시작해주세요!', 'warning')
      return
    }
    setIsDetecting(true)
  }

  // 미소 감지 중지
  const stopDetection = () => {
    setIsDetecting(false)
    
    // 세션 저장
    if (sessionStartTime && maxScore > 0) {
      const sessionData = {
        purpose: selectedPurpose,
        smile_type: smileTypes[smileContext]?.title || '미소',
        max_score: maxScore,
        context: smileContext,
        emotion_before: emotionBefore,
        emotion_after: emotionAfter || 'neutral',
        duration: Math.floor((Date.now() - sessionStartTime) / 1000),
        metrics: maxScoreMetrics // 메트릭 정보 추가
      }
      
      if (user) {
        // 로그인 사용자는 Supabase에 저장
        saveSessionToSupabase(sessionData)
      } else {
        // 비로그인 사용자는 localStorage에 임시 저장
        const tempSessionData = {
          ...sessionData,
          date: new Date().toISOString(), // localStorage용 date 추가
          id: Date.now() // 임시 ID
        }
        const sessions = JSON.parse(localStorage.getItem('tempSessions') || '[]')
        sessions.push(tempSessionData)
        localStorage.setItem('tempSessions', JSON.stringify(sessions))
        
        // 오늘 무료 세션 사용 기록 - 실제로 연습을 완료했을 때만
        if (!hasUsedFreeSession && maxScore > 0) {
          const today = new Date().toDateString()
          localStorage.setItem('lastFreeSession', today)
          setHasUsedFreeSession(true)
          showToast('오늘의 무료 체험을 완료했습니다!', 'info', 3000)
        }
      }
    }
    
    if (sessionStartTime && !emotionAfter) {
      setTimeout(() => {
        if (!emotionAfter) {
          setCurrentStep('feedback')
        }
      }, 1000)
    }
  }
  
  // Supabase에 세션 저장
  const saveSessionToSupabase = async (sessionData) => {
    try {
      console.log('저장할 데이터:', sessionData) // 디버깅용
      const { data, error } = await practiceDB.saveSession(sessionData)
      if (error) {
        console.error('세션 저장 오류 상세:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        showToast(`연습 기록 저장 실패: ${error.message}`, 'error', 5000)
      } else {
        console.log('저장 성공:', data) // 디버깅용
        showToast('연습 기록이 저장되었습니다!', 'success', 3000)
      }
    } catch (error) {
      console.error('세션 저장 중 예외 오류:', error)
      showToast(`저장 중 오류: ${error.message}`, 'error', 5000)
    }
  }

  // 미소 품질 분석
  const analyzeTherapeuticSmile = (expressions, landmarks, context) => {
    const happiness = expressions.happy || 0
    const surprise = expressions.surprised || 0
    const neutral = expressions.neutral || 0
    const fear = expressions.fearful || 0
    const angry = expressions.angry || 0
    const sad = expressions.sad || 0
    
    // 기본값을 높여서 0%가 나오지 않도록 함
    const baseScore = 0.3
    
    let contextualScore = 0
    let smileType = smileTypes[context].title
    let therapeuticValue = 0
    
    if (context === 'joy') {
      const joyfulness = happiness * 0.8 + surprise * 0.3 - sad * 0.2 + baseScore
      contextualScore = Math.max(0.3, Math.min(1, joyfulness))
      therapeuticValue = contextualScore
    } else if (context === 'social') {
      const sociability = happiness * 0.6 + neutral * 0.3 - fear * 0.2 + baseScore
      contextualScore = Math.max(0.3, Math.min(1, sociability))
      therapeuticValue = contextualScore * 0.9
    } else { // practice (자기계발)
      const progress = happiness * 0.7 + (1 - fear) * 0.2 + baseScore
      contextualScore = Math.max(0.3, Math.min(1, progress))
      therapeuticValue = contextualScore * 0.85
    }
    
    // 안정감: 부정적 감정이 적을수록 높음
    const comfort = Math.max(0.4, Math.min(1, 1 - (fear * 0.3 + angry * 0.2 + sad * 0.2)))
    
    // 자연스러움: 행복과 중립의 균형
    const naturalness = Math.max(0.35, Math.min(1, happiness * 0.5 + neutral * 0.2 + (1 - angry) * 0.3))
    const eyeEngagement = surprise * 0.6 + happiness * 0.4
    const wellness = (happiness + (1-sad) + (1-fear) + (1-angry)) / 4
    
    return {
      type: smileType,
      naturalness: naturalness,
      eyeEngagement: eyeEngagement,
      overallScore: Math.min(1, contextualScore),
      therapeuticValue: Math.min(1, therapeuticValue),
      wellness: wellness,
      comfort: comfort,
      context: context
    }
  }

  // 맞춤형 코칭 메시지 - 전문적인 근육 가이드 포함
  const getContextualCoaching = (smileQuality, expressions, context) => {
    const messages = []
    const wellness = smileQuality.wellness
    const smileInfo = smileTypes[context]
    
    // 근육 움직임 기반 전문적 가이드
    const happiness = expressions.happy || 0
    const neutral = expressions.neutral || 0
    const fear = expressions.fearful || 0
    
    // 주요 가이드 메시지
    if (happiness < 0.3) {
      messages.push('광대근(대관골근)을 위로 올려주세요')
    } else if (happiness > 0.7) {
      messages.push('자연스러운 표정을 유지하고 있습니다')
    }
    
    // 눈 주변 근육 가이드
    if (smileQuality.eyeEngagement < 0.3 && happiness > 0.4) {
      messages.push('눈둘레근을 함께 사용해 눈가 주름을 만들어보세요')
    } else if (smileQuality.eyeEngagement > 0.6) {
      messages.push('뒤센 미소가 잘 나타나고 있어요')
    }
    
    // 입 주변 근육 가이드
    if (neutral > 0.5) {
      messages.push('입꼬리 올림근을 더 활성화해보세요')
    } else if (happiness > 0.6 && neutral < 0.2) {
      messages.push('구륜근의 긴장을 살짝 풀어주세요')
    }
    
    // 전체적인 균형
    if (fear > 0.2) {
      messages.push('이마와 눈썹 사이 근육을 이완시켜주세요')
    }
    
    // 상황별 전문 조언
    if (context === 'practice') {
      if (happiness < 0.4) {
        messages.push('협골 대근과 소근을 동시에 수축시켜보세요')
      }
    } else if (context === 'social') {
      if (neutral > happiness) {
        messages.push('입꼬리를 45도 각도로 부드럽게 올려주세요')
      }
    }
    
    return messages.slice(0, 2) // 2개로 줄여서 더 집중적으로
  }

  // 실시간 미소 감지
  const detectSmile = async () => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video.readyState < 2) {
      setTimeout(() => detectSmile(), 500)
      return
    }
    
    const displayWidth = video.offsetWidth
    const displayHeight = video.offsetHeight
    canvas.width = displayWidth
    canvas.height = displayHeight

    const ctx = canvas.getContext('2d')
    
    const detect = async () => {
      if (!isDetecting) return

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 416,
            scoreThreshold: 0.4
          }))
          .withFaceLandmarks()
          .withFaceExpressions()

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detections.length > 0) {
          const expressions = detections[0].expressions
          const smileQuality = analyzeTherapeuticSmile(expressions, detections[0].landmarks, smileContext)
          const score = Math.round(smileQuality.overallScore * 100)
          
          setCurrentScore(score)
          setSmileScore(score)
          setWellnessScore(Math.round(smileQuality.wellness * 100))
          
          if (score > 60) {
            setEncouragementLevel(prev => Math.min(5, prev + 0.1))
          }
          
          if (score > maxScore && smileQuality.naturalness > 0.6) {
            setMaxScore(score)
            setMaxScoreMetrics({
              confidence: Math.round(smileQuality.confidence * 100),
              stability: Math.round(smileQuality.stability * 100),
              naturalness: Math.round(smileQuality.naturalness * 100)
            })
          }
          
          // 코칭 메시지 업데이트
          const coaching = getContextualCoaching(smileQuality, expressions, smileContext)
          setCurrentCoachingMessages(coaching)
          setCurrentSmileType(smileQuality.type)
          
          // 메트릭 업데이트 - 실제 분석된 값 사용
          const metricsData = {
            primary: { 
              label: smileTypes[smileContext].metrics.primary, 
              value: Math.round(smileQuality.therapeuticValue * 100)
            },
            secondary: { 
              label: smileTypes[smileContext].metrics.secondary, 
              value: Math.round(smileQuality.comfort * 100)
            },
            tertiary: { 
              label: smileTypes[smileContext].metrics.tertiary, 
              value: Math.round(smileQuality.naturalness * 100)
            }
          }
          
          console.log('분석 결과:', {
            expressions,
            smileQuality,
            metrics: metricsData
          })
          
          setMetrics(metricsData)

          const resizeWidth = displayWidth / video.videoWidth
          const resizeHeight = displayHeight / video.videoHeight
          
          const box = detections[0].detection.box
          const adjustedBox = {
            x: box.x * resizeWidth,
            y: box.y * resizeHeight,
            width: box.width * resizeWidth,
            height: box.height * resizeHeight
          }

          let boxColor = '#10b981'
          if (smileQuality.wellness > 0.8) {
            boxColor = '#059669'
          } else if (smileQuality.wellness > 0.6) {
            boxColor = '#10b981'
          } else if (smileQuality.wellness > 0.4) {
            boxColor = '#34d399'
          } else {
            boxColor = '#6b7280'
          }

          // 원형 트래킹을 위한 중심점과 반지름 계산
          const centerX = adjustedBox.x + adjustedBox.width / 2
          const centerY = adjustedBox.y + adjustedBox.height / 2
          const radius = Math.min(adjustedBox.width, adjustedBox.height) / 2 * 0.85

          // 근육 가이드가 비활성화되어 있을 때만 원형 트래킹 표시
          if (!showMuscleGuide) {
            // 원형 트래킹 그리기
            ctx.strokeStyle = boxColor
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
            ctx.stroke()

            // 점선 원형 효과 (더 자연스럽게)
            ctx.setLineDash([5, 5])
            ctx.strokeStyle = boxColor + '40' // 투명도 추가
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.setLineDash([]) // 점선 리셋
          }
          
          // AR 스타일 근육 가이드 표시 - 실제 얼굴 랜드마크 기반
          if (showMuscleGuide && detections[0].landmarks) {
            const landmarks = detections[0].landmarks
            const positions = landmarks.positions
            
            // expressions에서 값 추출
            const happiness = expressions.happy || 0
            
            // 스케일 조정
            const scaleX = displayWidth / video.videoWidth
            const scaleY = displayHeight / video.videoHeight
            
            // 랜드마크 포인트를 캔버스 좌표로 변환하는 함수
            const getLandmarkPoint = (index) => ({
              x: positions[index].x * scaleX,
              y: positions[index].y * scaleY
            })
            
            // 1. 대관골근(광대근) 표시 - 실제 볼 위치
            if (happiness < 0.5 || (currentCoachingMessages && currentCoachingMessages.some(msg => msg.includes('광대근')))) {
              // 왼쪽 광대근 (랜드마크 1-3 영역)
              const leftCheek = getLandmarkPoint(2)
              const rightCheek = getLandmarkPoint(14)
              
              // 광대근 포인트 표시
              ctx.fillStyle = '#10b981'
              ctx.strokeStyle = '#10b981'
              ctx.lineWidth = 2
              
              // 왼쪽 광대근 점
              ctx.beginPath()
              ctx.arc(leftCheek.x, leftCheek.y, 8, 0, 2 * Math.PI)
              ctx.fill()
              
              // 오른쪽 광대근 점
              ctx.beginPath()
              ctx.arc(rightCheek.x, rightCheek.y, 8, 0, 2 * Math.PI)
              ctx.fill()
              
              // 광대근 영역 표시 (반투명)
              ctx.fillStyle = '#10b98130'
              ctx.beginPath()
              ctx.ellipse(leftCheek.x, leftCheek.y, 25, 20, -15 * Math.PI / 180, 0, 2 * Math.PI)
              ctx.fill()
              ctx.beginPath()
              ctx.ellipse(rightCheek.x, rightCheek.y, 25, 20, 15 * Math.PI / 180, 0, 2 * Math.PI)
              ctx.fill()
              
              // 근육명 표시
              ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
              ctx.fillStyle = '#10b981'
              ctx.textAlign = 'center'
              ctx.fillText('대관골근', leftCheek.x, leftCheek.y - 25)
              ctx.fillText('대관골근', rightCheek.x, rightCheek.y - 25)
              
              // 움직임 가이드 화살표
              ctx.strokeStyle = '#10b981'
              ctx.setLineDash([3, 3])
              ctx.beginPath()
              ctx.moveTo(leftCheek.x, leftCheek.y + 10)
              ctx.lineTo(leftCheek.x - 10, leftCheek.y - 15)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(rightCheek.x, rightCheek.y + 10)
              ctx.lineTo(rightCheek.x + 10, rightCheek.y - 15)
              ctx.stroke()
              ctx.setLineDash([])
            }
          
            // 2. 눈둘레근 표시 - 실제 눈 주위
            if (smileQuality.eyeEngagement < 0.3 && happiness > 0.4) {
              // 왼쪽 눈 주위 포인트 (랜드마크 36-41)
              const leftEyeOuter = getLandmarkPoint(36)
              const leftEyeInner = getLandmarkPoint(39)
              const leftEyeBottom = getLandmarkPoint(41)
              
              // 오른쪽 눈 주위 포인트 (랜드마크 42-47)
              const rightEyeInner = getLandmarkPoint(42)
              const rightEyeOuter = getLandmarkPoint(45)
              const rightEyeBottom = getLandmarkPoint(46)
              
              // 눈둘레근 포인트 표시
              ctx.fillStyle = '#3B82F6'
              ctx.strokeStyle = '#3B82F6'
              
              // 주요 포인트에 점 표시
              const eyePoints = [leftEyeOuter, leftEyeBottom, rightEyeOuter, rightEyeBottom]
              eyePoints.forEach(point => {
                ctx.beginPath()
                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
                ctx.fill()
              })
              
              // 눈둘레근 영역 표시
              ctx.strokeStyle = '#3B82F660'
              ctx.lineWidth = 2
              ctx.setLineDash([4, 2])
              
              // 왼쪽 눈 주위
              ctx.beginPath()
              ctx.ellipse(
                (leftEyeOuter.x + leftEyeInner.x) / 2,
                (leftEyeOuter.y + leftEyeBottom.y) / 2,
                Math.abs(leftEyeInner.x - leftEyeOuter.x) / 2 + 10,
                15,
                0, 0, 2 * Math.PI
              )
              ctx.stroke()
              
              // 오른쪽 눈 주위
              ctx.beginPath()
              ctx.ellipse(
                (rightEyeOuter.x + rightEyeInner.x) / 2,
                (rightEyeOuter.y + rightEyeBottom.y) / 2,
                Math.abs(rightEyeOuter.x - rightEyeInner.x) / 2 + 10,
                15,
                0, 0, 2 * Math.PI
              )
              ctx.stroke()
              ctx.setLineDash([])
              
              // 근육명 표시
              ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
              ctx.fillStyle = '#3B82F6'
              ctx.textAlign = 'center'
              const eyeCenterX = (leftEyeInner.x + rightEyeInner.x) / 2
              ctx.fillText('눈둘레근', eyeCenterX, leftEyeOuter.y - 20)
            }
            
            // 3. 구륜근(입둘레근) 표시 - 실제 입 주위
            if (smileContext === 'social' && happiness < 0.6) {
              // 입 주위 포인트 (랜드마크 48-59)
              const mouthLeft = getLandmarkPoint(48)
              const mouthRight = getLandmarkPoint(54)
              const mouthTop = getLandmarkPoint(51)
              const mouthBottom = getLandmarkPoint(57)
              
              // 구륜근 포인트 표시
              ctx.fillStyle = '#8B5CF6'
              
              // 주요 포인트에 점 표시
              const mouthPoints = [
                mouthLeft, mouthRight,
                getLandmarkPoint(49), getLandmarkPoint(53),
                getLandmarkPoint(55), getLandmarkPoint(59)
              ]
              
              mouthPoints.forEach(point => {
                ctx.beginPath()
                ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI)
                ctx.fill()
              })
              
              // 구륜근 영역 표시 (반투명)
              ctx.strokeStyle = '#8B5CF660'
              ctx.lineWidth = 3
              ctx.setLineDash([5, 3])
              
              ctx.beginPath()
              ctx.ellipse(
                (mouthLeft.x + mouthRight.x) / 2,
                (mouthTop.y + mouthBottom.y) / 2,
                Math.abs(mouthRight.x - mouthLeft.x) / 2 + 15,
                Math.abs(mouthBottom.y - mouthTop.y) / 2 + 10,
                0, 0, 2 * Math.PI
              )
              ctx.stroke()
              ctx.setLineDash([])
              
              // 근육명 표시
              ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
              ctx.fillStyle = '#8B5CF6'
              ctx.textAlign = 'center'
              ctx.fillText('구륜근', (mouthLeft.x + mouthRight.x) / 2, mouthBottom.y + 25)
              
              // 움직임 가이드 화살표
              ctx.strokeStyle = '#8B5CF6'
              ctx.lineWidth = 2
              ctx.setLineDash([3, 3])
              
              // 왼쪽 입꼬리
              ctx.beginPath()
              ctx.moveTo(mouthLeft.x, mouthLeft.y)
              ctx.lineTo(mouthLeft.x - 15, mouthLeft.y - 10)
              ctx.stroke()
              
              // 오른쪽 입꼬리
              ctx.beginPath()
              ctx.moveTo(mouthRight.x, mouthRight.y)
              ctx.lineTo(mouthRight.x + 15, mouthRight.y - 10)
              ctx.stroke()
              
              ctx.setLineDash([])
            }
          }

          // 캔버스에서는 점수와 코칭 메시지를 그리지 않음 (DOM으로 표시)

        } else {
          // 얼굴을 찾지 못했을 때도 DOM으로 표시
          setCurrentCoachingMessages(['편안하게 자리를 잡아주세요'])
        }

      } catch (error) {
        console.error('분석 중 오류:', error)
      }

      setTimeout(detect, 500)
    }

    detect()
  }

  // 다시 시작
  const resetGuide = () => {
    // 비로그인 사용자가 이미 무료 세션을 사용한 경우
    if (!user && hasUsedFreeSession) {
      setShowLoginPrompt(true)
      return
    }
    
    // 카메라 정리
    stopCamera()
    
    // 상태 초기화
    setCurrentStep('purpose')
    setSelectedPurpose('')
    setEmotionBefore('')
    setSmileContext('')
    setEmotionAfter('')
    setSessionStartTime(null)
    setIsDetecting(false)
    setSmileScore(0)
    setMaxScore(0)
    setMaxScoreMetrics(null)
    setCurrentCoachingMessages([])
    setCurrentSmileType('')
    setCurrentScore(0)
    
    // 잠시 후 카메라 재시작
    setTimeout(() => {
      startCamera()
    }, 100)
  }

  // AI 모델 로딩 중일 때 스켈레톤 UI
  if (!isModelLoaded) {
    return (
      <div className="smile-detector">
        <div className="skeleton-container">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
          <div className="skeleton-card">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
          <div className="skeleton-buttons">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
          <p className="loading-text">미소 트레이닝 시스템 준비 중...</p>
        </div>
      </div>
    )
  }

  // 무료 체험 남은 횟수 계산
  const getFreeSessionsRemaining = () => {
    if (user) return null // 로그인 사용자는 표시 안함
    return hasUsedFreeSession ? 0 : 1
  }

  const freeSessionsRemaining = getFreeSessionsRemaining()

  return (
    <div className="smile-detector">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* 무료 체험 표시 */}
      {freeSessionsRemaining !== null && (
        <div className="ios-free-session-badge">
          <span className="ios-badge-text">오늘 남은 무료 체험: <span className="ios-badge-count">{freeSessionsRemaining}/1</span></span>
        </div>
      )}
      
      {/* 진행 단계 표시 */}
      {currentStep !== 'complete' && (
        <div className="step-indicator-container">
          <div className="step-indicator">
            <span className={`step-dot ${currentStep === 'purpose' ? 'active' : 'completed'}`}></span>
            <span className={`step-dot ${currentStep === 'emotion' ? 'active' : currentStep === 'context' || currentStep === 'practice' || currentStep === 'feedback' ? 'completed' : ''}`}></span>
            <span className={`step-dot ${currentStep === 'context' ? 'active' : currentStep === 'practice' || currentStep === 'feedback' ? 'completed' : ''}`}></span>
            <span className={`step-dot ${currentStep === 'practice' ? 'active' : currentStep === 'feedback' ? 'completed' : ''}`}></span>
            <span className={`step-dot ${currentStep === 'feedback' ? 'active' : ''}`}></span>
          </div>
        </div>
      )}
      
      {/* Step 1: 목적 선택 */}
      {currentStep === 'purpose' && (
        <div className="step-panel">
          <h4>어떤 목적으로 미소 연습을 하시나요?</h4>
          <div className="purpose-buttons">
            <button 
              onClick={() => handlePurposeSelect('confidence')}
              className="purpose-btn"
            >
              <div className="purpose-title">자신감 향상을 위해</div>
              <div className="purpose-desc">면접, 발표, 자기 PR</div>
            </button>
            <button 
              onClick={() => handlePurposeSelect('relationship')}
              className="purpose-btn"
            >
              <div className="purpose-title">관계 개선을 위해</div>
              <div className="purpose-desc">고객 응대, 회의, 인사</div>
            </button>
            <button 
              onClick={() => handlePurposeSelect('happiness')}
              className="purpose-btn"
            >
              <div className="purpose-title">진정한 행복 표현을 위해</div>
              <div className="purpose-desc">축하, 감사, 기쁜 순간</div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 감정 체크 */}
      {currentStep === 'emotion' && (
        <div className="step-panel">
          <h4>연습 전 기분을 알려주세요</h4>
          <div className="emotion-buttons">
            <button 
              onClick={() => handleEmotionSelect('happy')} 
              className="emotion-btn"
              data-emotion="happy"
            >
              좋음
            </button>
            <button 
              onClick={() => handleEmotionSelect('neutral')} 
              className="emotion-btn"
              data-emotion="neutral"
            >
              보통
            </button>
            <button 
              onClick={() => handleEmotionSelect('sad')} 
              className="emotion-btn"
              data-emotion="sad"
            >
              힘듦
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 미소 특징 설명 */}
      {currentStep === 'context' && smileContext && (
        <div className="step-panel">
          <div className="smile-info-card">
            <h4>{smileTypes[smileContext].title}</h4>
            <p className="smile-subtitle">{smileTypes[smileContext].subtitle}</p>
            
            <div className="characteristics">
              <h5>이런 특징을 가져요:</h5>
              <ul>
                {smileTypes[smileContext].characteristics.map((char, index) => (
                  <li key={index}>{char}</li>
                ))}
              </ul>
            </div>
            
            <div className="situations">
              <p>{smileTypes[smileContext].situations}</p>
            </div>
            
            {/* 근육 가이드 추가 */}
            {smileTypes[smileContext].muscleGuide && (
              <div className="muscle-guide-section">
                <h5>사용하는 얼굴 근육:</h5>
                <div className="muscle-info">
                  <div className="muscle-primary">
                    <strong>주요 근육:</strong> {smileTypes[smileContext].muscleGuide.primary}
                  </div>
                  <div className="muscle-secondary">
                    <strong>보조 근육:</strong> {smileTypes[smileContext].muscleGuide.secondary}
                  </div>
                  <div className="muscle-tips">
                    <strong>연습 팁:</strong>
                    <ul>
                      {smileTypes[smileContext].muscleGuide.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <button onClick={handleContextConfirm} className="confirm-btn">
              이 미소로 연습하기
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 실제 연습 */}
      {currentStep === 'practice' && (
        <div className="practice-layout">
          <div className="practice-main-content">
            <div className="video-coaching-wrapper">
              <div className="video-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ width: '100%' }}
                />
                <canvas 
                  ref={canvasRef}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
                
                {/* 점수 표시 - 좌측 상단 */}
                {isDetecting && (
                  <div className="score-display-overlay">
                    <div className="score-value">{currentScore}%</div>
                    <div className="score-divider">·</div>
                    <div className="score-type">{currentSmileType || '분석 중'}</div>
                  </div>
                )}
                
                {/* 근육 가이드 토글 버튼 - 우측 상단 */}
                <button 
                  className={`muscle-guide-toggle ${showMuscleGuide ? 'active' : ''}`}
                  onClick={() => setShowMuscleGuide(!showMuscleGuide)}
                  aria-label={showMuscleGuide ? "근육 가이드 숨기기" : "근육 가이드 보기"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showMuscleGuide ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    )}
                  </svg>
                  <span className="toggle-text">{showMuscleGuide ? '근육 가이드 ON' : '근육 가이드 OFF'}</span>
                </button>
              </div>
              
              {/* 코칭 메시지 영역 - 카메라 바로 아래 */}
              {isDetecting && currentCoachingMessages.length > 0 && (
                <div className="coaching-messages-area">
                  <div className="coaching-messages">
                    {currentCoachingMessages.map((message, index) => (
                      <div key={index} className={`coaching-message ${index === 0 ? 'primary' : 'secondary'}`}>
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 모바일에서는 간소화된 실시간 분석 */}
            {isDetecting && smileContext && (
              <div className="ios-analysis-panel mobile-compact">
                <div className="ios-analysis-header">
                  <h3 className="ios-analysis-title">실시간 분석</h3>
                </div>
                
                <ul className="ios-metrics-list compact">
                  {Object.entries(metrics)
                    .sort((a, b) => b[1].value - a[1].value)
                    .map(([key, metric], index) => {
                      const isHighest = index === 0
                      return (
                        <li key={key} className={`ios-metric-item compact ${isHighest ? 'primary' : ''}`}>
                          <div className="ios-metric-header">
                            <span className="ios-metric-label">{metric.label}</span>
                            <span className="ios-metric-value">{metric.value}%</span>
                          </div>
                          <div className="ios-metric-bar">
                            <div 
                              className="ios-metric-fill"
                              style={{ 
                                width: `${metric.value}%`,
                                transition: 'width 0.6s ease-out'
                              }}
                            />
                          </div>
                        </li>
                      )
                    })}
                </ul>
              </div>
            )}
            
            {/* 연습 그만하기 버튼 - 분석 패널 바로 아래 */}
            <div className="practice-controls">
              <button onClick={() => {
                stopDetection()
                stopCamera()
                setCurrentStep('feedback')
              }} className="stop-practice-btn">
                연습 그만하기
              </button>
            </div>
          </div>
          
          {/* 카메라 권한 요청 모달 */}
          {showCameraPermission && !cameraPermissionDenied && (
            <div className="camera-permission-overlay">
              <div className="camera-permission-modal">
                <div className="permission-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="14" width="32" height="24" rx="4" stroke="#007AFF" strokeWidth="2"/>
                    <circle cx="24" cy="26" r="8" stroke="#007AFF" strokeWidth="2"/>
                    <rect x="20" y="10" width="8" height="4" rx="2" fill="#007AFF"/>
                  </svg>
                </div>
                <h3>카메라 사용 권한이 필요해요</h3>
                <p>SmileShot이 실시간으로 미소를 분석하려면<br/>카메라 접근 권한이 필요합니다.</p>
                <div className="permission-info">
                  <div className="info-item">
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>미소 분석에만 사용됩니다</span>
                  </div>
                  <div className="info-item">
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>사진이나 영상은 저장되지 않습니다</span>
                  </div>
                  <div className="info-item">
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>언제든지 중지할 수 있습니다</span>
                  </div>
                </div>
                <div className="permission-buttons">
                  <button className="permission-allow" onClick={() => {
                    setShowCameraPermission(false)
                    startCamera()
                  }}>
                    카메라 허용하기
                  </button>
                  <button className="permission-cancel" onClick={() => {
                    setShowCameraPermission(false)
                  }}>
                    나중에
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 카메라 권한 거부됨 모달 */}
          {cameraPermissionDenied && (
            <div className="camera-permission-overlay">
              <div className="camera-permission-modal denied">
                <div className="permission-icon denied">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="20" stroke="#FF3B30" strokeWidth="2"/>
                    <path d="M16 16L32 32M32 16L16 32" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>카메라 권한이 차단되었어요</h3>
                <p>브라우저 설정에서 카메라 권한을 허용해주세요.</p>
                <div className="permission-guide">
                  <h4>권한 허용 방법:</h4>
                  <ol>
                    <li>브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하세요</li>
                    <li>"카메라" 옵션을 찾아 "허용"으로 변경하세요</li>
                    <li>페이지를 새로고침하세요</li>
                  </ol>
                </div>
                <div className="permission-buttons">
                  <button className="permission-retry" onClick={() => {
                    setCameraPermissionDenied(false)
                    window.location.reload()
                  }}>
                    새로고침
                  </button>
                  <button className="permission-cancel" onClick={() => {
                    setCameraPermissionDenied(false)
                  }}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: 연습 후 피드백 */}
      {currentStep === 'feedback' && (
        <div className="step-panel">
          <h4>연습 후 기분은 어떠세요?</h4>
          <div className="emotion-buttons">
            <button 
              onClick={() => {
                setEmotionAfter('better')
                stopCamera() // 카메라 정리
                setCurrentStep('complete')
              }} 
              className="emotion-btn"
              data-emotion="happy"
            >
              더 좋아짐
            </button>
            <button 
              onClick={() => {
                setEmotionAfter('same')
                stopCamera() // 카메라 정리
                setCurrentStep('complete')
              }} 
              className="emotion-btn"
              data-emotion="neutral"
            >
              비슷함
            </button>
            <button 
              onClick={() => {
                setEmotionAfter('tired')
                stopCamera() // 카메라 정리
                setCurrentStep('complete')
              }} 
              className="emotion-btn"
              data-emotion="sad"
            >
              조금 피곤함
            </button>
          </div>
        </div>
      )}

      {/* Step 6: 완료 */}
      {currentStep === 'complete' && (
        <div className="step-panel">
          <div className="completion-card">
            <h4>연습 완료!</h4>
            <p>오늘의 {smileTypes[smileContext]?.title} 연습이 끝났습니다.</p>
            <div className="session-summary">
              <div>최고 점수: {maxScore}%</div>
              <div>연습한 미소: {smileTypes[smileContext]?.title}</div>
              <div>기분 변화: {emotionBefore} → {emotionAfter}</div>
            </div>
            
            {!user && (
              <div className="signup-prompt-box">
                <p>회원가입하면 모든 연습 기록을 저장하고<br/>무제한으로 연습할 수 있어요!</p>
                <button onClick={() => navigate('/signup')} className="signup-cta-btn">
                  회원가입하기
                </button>
              </div>
            )}
            
            <button onClick={resetGuide} className="restart-btn">
              다른 미소 연습하기
            </button>
          </div>
        </div>
      )}
      
      {/* 로그인 유도 모달 */}
      {showLoginPrompt && (
        <div className="login-prompt-overlay">
          <div className="login-prompt-modal">
            <h3>무료 체험이 종료되었어요</h3>
            <p>오늘의 무료 연습 횟수를 모두 사용하셨습니다.</p>
            <p>계속 연습하려면 로그인해주세요!</p>
            <div className="prompt-buttons">
              <button onClick={() => navigate('/login', { state: { from: '/app', message: '계속 연습하려면 로그인해주세요' } })} className="login-prompt-btn">
                로그인
              </button>
              <button onClick={() => navigate('/signup')} className="signup-prompt-btn">
                회원가입
              </button>
            </div>
            <button onClick={() => {
              localStorage.removeItem('allowFreeSession')
              navigate('/')
            }} className="close-prompt">
              처음으로 돌아가기
            </button>
          </div>
        </div>
      )}

      <div className="status">
        <p>트레이닝 시스템: {isModelLoaded ? '준비됨' : '로딩 중...'}</p>
        <p>카메라: {isStreaming ? '활성' : '비활성'}</p>
        <p>미소 분석: {isDetecting ? '분석 중' : '대기 중'}</p>
      </div>
    </div>
  )
}

export default SmileDetector