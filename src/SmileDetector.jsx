import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as faceapi from 'face-api.js'
import { practiceDB } from './supabaseClient'
import { useToast, ToastContainer } from './Toast'
import { useLanguage } from './contexts/LanguageContext'

function SmileDetector({ user }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const { toasts, showToast, removeToast } = useToast()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [, setSmileScore] = useState(0)
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
  const [, setWellnessScore] = useState(0)
  const [, setEncouragementLevel] = useState(1)
  
  // 로그인 및 무료 세션 관련
  const [freeSessionCount, setFreeSessionCount] = useState(0)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  // 카메라 권한 관련
  const [showCameraPermission, setShowCameraPermission] = useState(false)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  
  // 코칭 메시지 상태
  const [currentCoachingMessages, setCurrentCoachingMessages] = useState([])
  const [currentSmileType, setCurrentSmileType] = useState('')
  
  // 분석 메트릭 상태
  const [metrics, setMetrics] = useState({
    primary: { label: t('practiceMetricsPrimary'), value: 30 },
    secondary: { label: t('practiceMetricsSecondary'), value: 40 },
    tertiary: { label: t('practiceMetricsTertiary'), value: 35 }
  })
  
  // AR 근육 가이드 표시 상태
  const [showMuscleGuide] = useState(true)
  
  // 현재 점수 상태
  const [currentScore, setCurrentScore] = useState(0)
  
  // 카메라 좌우 반전 상태
  const [isMirrored, setIsMirrored] = useState(true)
  
  // 자동 캡처 관련 상태
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [capturedAnalysis, setCapturedAnalysis] = useState(null)
  
  // 얼굴 위치 안내 상태
  const [facePositionGuide, setFacePositionGuide] = useState('')

  // cleanup을 위한 useEffect
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 카메라 정리
      console.log('Component unmounting, cleaning up camera...')
      stopCamera()
    }
  }, [])

  // 미소 타입별 정보 - 전문적 근육 가이드 추가
  const getSmileTypes = () => ({
    practice: {
      title: t('practiceSmileTitle'),
      subtitle: t('practiceSmileSubtitle'),
      characteristics: [
        t('practiceSmileChar1'),
        t('practiceSmileChar2'), 
        t('practiceSmileChar3')
      ],
      situations: t('practiceSmileSituation'),
      coaching: t('practiceSmileCoaching'),
      metrics: {
        primary: t('practiceMetricsPrimary'),
        secondary: t('practiceMetricsSecondary'),
        tertiary: t('practiceMetricsTertiary')
      },
      muscleGuide: {
        primary: t('practiceMusclePrimary'),
        secondary: t('practiceMuscleSecondary'),
        tips: [
          t('practiceMuscleTip1'),
          t('practiceMuscleTip2'),
          t('practiceMuscleTip3')
        ]
      }
    },
    social: {
      title: t('socialSmileTitle'), 
      subtitle: t('socialSmileSubtitle'),
      characteristics: [
        t('socialSmileChar1'),
        t('socialSmileChar2'),
        t('socialSmileChar3')
      ],
      situations: t('socialSmileSituation'),
      coaching: t('socialSmileCoaching'),
      metrics: {
        primary: t('socialMetricsPrimary'),
        secondary: t('socialMetricsSecondary'), 
        tertiary: t('socialMetricsTertiary')
      },
      muscleGuide: {
        primary: t('socialMusclePrimary'),
        secondary: t('socialMuscleSecondary'),
        tips: [
          t('socialMuscleTip1'),
          t('socialMuscleTip2'),
          t('socialMuscleTip3')
        ]
      }
    },
    joy: {
      title: t('joySmileTitle'),
      subtitle: t('joySmileSubtitle'), 
      characteristics: [
        t('joySmileChar1'),
        t('joySmileChar2'),
        t('joySmileChar3')
      ],
      situations: t('joySmileSituation'),
      coaching: t('joySmileCoaching'),
      metrics: {
        primary: t('joyMetricsPrimary'),
        secondary: t('joyMetricsSecondary'),
        tertiary: t('joyMetricsTertiary')
      },
      muscleGuide: {
        primary: t('joyMusclePrimary'),
        secondary: t('joyMuscleSecondary'),
        tips: [
          t('joyMuscleTip1'),
          t('joyMuscleTip2'),
          t('joyMuscleTip3')
        ]
      }
    }
  })
  
  const smileTypes = getSmileTypes()

  // AI 모델 로드 및 무료 세션 확인
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log(t('systemLoading'))
        
        const MODEL_URL = window.location.origin + '/models'
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        
        setIsModelLoaded(true)
        console.log(t('systemReady'))
      } catch (error) {
        console.error(t('systemLoadError'), error)
      }
    }
    
    // 비로그인 사용자의 무료 세션 사용 횟수 확인
    const checkFreeSession = () => {
      if (!user) {
        const allowFreeSession = localStorage.getItem('allowFreeSession') === 'true'
        const usedCount = parseInt(localStorage.getItem('freeSessionCount') || '0')
        
        // 무료 체험을 선택했고, 10회 미만 사용했다면 허용
        if (allowFreeSession) {
          setFreeSessionCount(usedCount)
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
      // 비로그인 사용자가 10회 이상 무료 세션을 사용한 경우
      if (!user && freeSessionCount >= 10) {
        setShowLoginPrompt(true)
        setCurrentStep('purpose') // 초기 단계로 되돌림
        return
      }
      startCamera()
    }
  }, [currentStep, user, freeSessionCount])

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
      
      // 모바일 기기 감지
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      // 모바일과 데스크톱 모두 2:3 비율로 통일
      const videoConstraints = { 
        video: { 
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 2/3 }
        } 
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(videoConstraints)
      if (videoRef.current) {
        // 비디오 요소 표시 (이전에 숨겨진 경우를 위해)
        videoRef.current.style.display = 'block'
        videoRef.current.srcObject = stream
        
        // 비디오가 로드되면 실제 크기 확인
        videoRef.current.onloadedmetadata = () => {
          console.log('실제 비디오 크기:', {
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            aspectRatio: videoRef.current.videoWidth / videoRef.current.videoHeight
          })
        }
        
        setIsStreaming(true)
        setShowCameraPermission(false)
        setCameraPermissionDenied(false)
      }
      
      // 캔버스도 표시
      if (canvasRef.current) {
        canvasRef.current.style.display = 'block'
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermissionDenied(true)
      } else if (error.name === 'NotFoundError') {
        showToast(t('cameraNotFound'), 'error')
      } else {
        showToast(t('cameraAccessError'), 'error')
      }
    }
  }

  // 카메라 중지
  const stopCamera = () => {
    console.log('Stopping camera...')
    
    // 감지 먼저 중지
    setIsDetecting(false)
    
    try {
      if (videoRef.current) {
        // 비디오 요소 즉시 숨기기 (모바일 대응)
        videoRef.current.style.display = 'none'
        
        // 비디오 일시정지
        videoRef.current.pause()
        
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject
          
          // 모든 트랙 가져오기
          const tracks = stream.getTracks()
          
          // 각 트랙을 개별적으로 중지
          tracks.forEach(track => {
            try {
              track.stop()
              track.enabled = false
              console.log('Camera track stopped:', track.label, track.readyState)
            } catch (e) {
              console.error('Error stopping track:', e)
            }
          })
          
          // 스트림에서 트랙 제거
          tracks.forEach(track => {
            try {
              stream.removeTrack(track)
            } catch (e) {
              console.error('Error removing track:', e)
            }
          })
          
          // 비디오 요소 완전 정리
          videoRef.current.srcObject = null
          
          // 모바일을 위한 추가 정리
          videoRef.current.src = ''
          videoRef.current.removeAttribute('src')
          videoRef.current.removeAttribute('srcObject')
          
          // 모바일 브라우저를 위한 강제 정리
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.load()
            }
          }, 100)
        }
      }
      
      // Canvas도 정리
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        // 캔버스도 숨기기
        canvasRef.current.style.display = 'none'
      }
      
    } catch (error) {
      console.error('Error stopping camera:', error)
    }
    
    // 상태 업데이트
    setIsStreaming(false)
    console.log('Camera stopped successfully')
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
    console.log('선택된 기분:', emotion)
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
      showToast(t('startCameraFirst'), 'warning')
      return
    }
    setIsDetecting(true)
    // 새 세션 시작 시 캡처 상태 초기화
    setCapturedPhoto(null)
    setCapturedAnalysis(null)
  }

  // 미소 감지 중지
  const stopDetection = () => {
    setIsDetecting(false)
    
    // 세션 저장
    if (sessionStartTime && maxScore > 0) {
      // metrics 필드에 캡처 정보를 포함시켜 저장
      const metricsWithCapture = {
        ...maxScoreMetrics,
        capturedPhoto: capturedPhoto || null,
        capturedAnalysis: capturedAnalysis || null
      }
      
      const sessionData = {
        purpose: selectedPurpose,
        smile_type: smileTypes[smileContext]?.title || t('smile'),
        max_score: maxScore,
        context: smileContext,
        emotion_before: emotionBefore,
        emotion_after: emotionAfter || 'neutral',
        duration: Math.floor((Date.now() - sessionStartTime) / 1000),
        metrics: metricsWithCapture // 캡처 정보가 포함된 메트릭
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
        
        // 무료 세션 사용 횟수 증가 - 실제로 연습을 완료했을 때만
        if (maxScore > 0) {
          const newCount = freeSessionCount + 1
          localStorage.setItem('freeSessionCount', newCount.toString())
          setFreeSessionCount(newCount)
          const remaining = 10 - newCount
          if (remaining > 0) {
            showToast(t('freeTrialCompleted', { count: newCount, remaining }), 'info', 3000)
          } else {
            showToast(t('freeTrialAllUsed'), 'info', 3000)
          }
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
        showToast(t('practiceRecordSaveFailed', { error: error.message }), 'error', 5000)
      } else {
        console.log('저장 성공:', data) // 디버깅용
        showToast(t('practiceRecordSaved'), 'success', 3000)
      }
    } catch (error) {
      console.error('세션 저장 중 예외 오류:', error)
      showToast(t('savingError', { error: error.message }), 'error', 5000)
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
    
    // 공통 지표 계산
    // 안정감: 부정적 감정이 적을수록 높음
    const comfort = Math.max(0.4, Math.min(1, 1 - (fear * 0.3 + angry * 0.2 + sad * 0.2)))
    
    // 자연스러움: 행복과 중립의 균형
    const naturalness = Math.max(0.35, Math.min(1, happiness * 0.5 + neutral * 0.2 + (1 - angry) * 0.3))
    
    if (context === 'joy') {
      // 진정한 기쁨은 매우 어렵다 - 뒤센 미소 필수
      const eyeWrinkles = surprise * 0.5 + happiness * 0.5 // 눈가 주름이 핵심
      
      // 진정성: 눈과 입이 함께 웃어야 함
      const authenticity = (happiness > 0.8 && eyeWrinkles > 0.6) 
        ? happiness * 0.7 + eyeWrinkles * 0.3 - sad * 0.5 - fear * 0.3
        : (happiness * 0.5 + eyeWrinkles * 0.2) * 0.6 // 조건 미달시 큰 감점
      
      // 밝기: 과하지도 부족하지도 않은 적절한 강도
      const optimalHappiness = 1 - Math.abs(happiness - 0.85) * 2 // 85%가 최적
      const brightness = optimalHappiness * 0.6 + (1 - neutral) * 0.2 + (1 - sad) * 0.2
      
      // 감정 표현력: 진짜 기쁨은 희귀하다
      const genuineThreshold = 0.75 // 75% 이상만 진짜로 인정
      const emotionalExpression = happiness > genuineThreshold 
        ? (happiness * 0.5 + eyeWrinkles * 0.4 + (1 - neutral) * 0.1) * 0.8
        : (happiness * 0.3 + eyeWrinkles * 0.2) * 0.5 // 미달시 큰 감점
      
      // 3가지 지표의 평균으로 계산
      contextualScore = (authenticity + brightness + emotionalExpression) / 3
      
      // 디버깅: 기쁨의 미소 계산 로그
      console.log('기쁨의 미소 계산:', {
        진정성: Math.round(authenticity * 100),
        밝기: Math.round(brightness * 100),
        감정표현력: Math.round(emotionalExpression * 100),
        평균점수_계산전: Math.round(contextualScore * 100),
        평균점수_최종: Math.round(Math.max(0.3, Math.min(1, contextualScore)) * 100)
      })
      
      contextualScore = Math.max(0.3, Math.min(1, contextualScore))
      therapeuticValue = contextualScore
      
      // 개별 점수 저장
      var individualScores = {
        authenticity: Math.round(Math.min(100, authenticity * 100)),
        brightness: Math.round(Math.min(100, brightness * 100)),
        emotionalExpression: Math.round(Math.min(100, emotionalExpression * 100))
      }
      
    } else if (context === 'social') {
      // 친화력: 따뜻하고 다가가기 쉬운 표정
      const affinity = happiness * 0.6 + neutral * 0.2 + surprise * 0.1 - fear * 0.1 + baseScore
      
      // 신뢰감: 안정적이고 진실한 표정
      const trustworthiness = comfort * 0.5 + (1 - fear) * 0.3 + (1 - angry) * 0.2 + baseScore
      
      // 편안함: 긴장감 없이 자연스러운 표현
      const easiness = naturalness * 0.6 + (1 - fear) * 0.2 + neutral * 0.2 + baseScore
      
      // 3가지 지표의 평균으로 계산
      contextualScore = (affinity + trustworthiness + easiness) / 3
      contextualScore = Math.max(0.3, Math.min(1, contextualScore))
      therapeuticValue = contextualScore * 0.9
      
      // 개별 점수 저장
      var individualScores = {
        affinity: Math.round(Math.min(100, affinity * 100)),
        trustworthiness: Math.round(Math.min(100, trustworthiness * 100)),
        easiness: Math.round(Math.min(100, easiness * 100))
      }
      
    } else { // practice (자기계발)
      // 자신감 지수 계산
      const confidence = happiness * 0.6 + neutral * 0.2 + (1 - fear) * 0.2 + baseScore
      
      // 3가지 지표의 평균으로 전체 점수 계산
      contextualScore = (confidence + comfort + naturalness) / 3
      contextualScore = Math.max(0.3, Math.min(1, contextualScore))
      therapeuticValue = contextualScore * 0.85
      
      // 개별 점수 저장
      var individualScores = {
        confidence: Math.round(Math.min(100, confidence * 100))
      }
    }
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
      context: context,
      individualScores: individualScores
    }
  }

  // 맞춤형 코칭 메시지 - 전문적인 근육 가이드 포함
  const getContextualCoaching = (smileQuality, expressions, context) => {
    const messages = []
    // const wellness = smileQuality.wellness
    // const smileInfo = smileTypes[context]
    
    // 근육 움직임 기반 전문적 가이드
    const happiness = expressions.happy || 0
    const neutral = expressions.neutral || 0
    const fear = expressions.fearful || 0
    
    // 주요 가이드 메시지
    if (happiness < 0.3) {
      messages.push(t('liftZygomaticus'))
    } else if (happiness > 0.7) {
      messages.push(t('maintainingNaturalExpression'))
    }
    
    // 눈 주변 근육 가이드
    if (smileQuality.eyeEngagement < 0.3 && happiness > 0.4) {
      messages.push(t('useOrbicularisOculi'))
    } else if (smileQuality.eyeEngagement > 0.6) {
      messages.push(t('duchenneSmilesShowing'))
    }
    
    // 입 주변 근육 가이드
    if (neutral > 0.5) {
      messages.push(t('activateLevatorAnguliOris'))
    } else if (happiness > 0.6 && neutral < 0.2) {
      messages.push(t('relaxOrbicularisOris'))
    }
    
    // 전체적인 균형
    if (fear > 0.2) {
      messages.push(t('relaxForeheadMuscles'))
    }
    
    // 상황별 전문 조언
    if (context === 'practice') {
      if (happiness < 0.4) {
        messages.push(t('contractZygomaticusMajorMinor'))
      }
    } else if (context === 'social') {
      if (neutral > happiness) {
        messages.push(t('liftCornersToFortyFive'))
      }
    }
    
    return messages.slice(0, 2) // 2개로 줄여서 더 집중적으로
  }


  // 사진 캡처 및 분석 정보 저장
  const capturePhotoWithAnalysis = (metricsData, coaching, score) => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = video.videoWidth
    captureCanvas.height = video.videoHeight
    const captureCtx = captureCanvas.getContext('2d')
    
    // 이미지 그리기 (미러링 적용)
    captureCtx.save()
    if (isMirrored) {
      captureCtx.translate(captureCanvas.width, 0)
      captureCtx.scale(-1, 1)
    }
    captureCtx.drawImage(video, 0, 0)
    captureCtx.restore()
    
    // 캡처한 이미지에는 텍스트를 포함하지 않음 (얼굴만 캡처)
    
    // 캡처한 이미지 저장
    const imageData = captureCanvas.toDataURL('image/jpeg', 0.9)
    setCapturedPhoto(imageData)
    setCapturedAnalysis({
      score,
      metrics: metricsData,
      coaching,
      timestamp: new Date().toISOString()
    })
    
    // 고정 ID를 사용하여 알림 업데이트
    showToast(t('newHighScore', { score }) + ' 📸', 'success', 3000, 'high-score-toast')
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
    
    // 디버깅용 로그
    console.log('Canvas/Video 크기:', {
      displayWidth,
      displayHeight,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      aspectRatio: displayWidth / displayHeight
    })

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
          
          // 코칭 메시지 업데이트
          const coaching = getContextualCoaching(smileQuality, expressions, smileContext)
          setCurrentCoachingMessages(coaching)
          setCurrentSmileType(smileQuality.type)
          
          // 메트릭 업데이트 - 상황별로 올바른 값 매핑
          let metricsData = {}
          
          if (smileContext === 'joy') {
            // 기쁨의 미소: 진정성, 밝기, 감정표현력
            metricsData = {
              primary: { 
                label: smileTypes[smileContext].metrics.primary, 
                value: smileQuality.individualScores?.authenticity || Math.round(smileQuality.therapeuticValue * 100)
              },
              secondary: { 
                label: smileTypes[smileContext].metrics.secondary, 
                value: smileQuality.individualScores?.brightness || Math.round(smileQuality.comfort * 100)
              },
              tertiary: { 
                label: smileTypes[smileContext].metrics.tertiary, 
                value: smileQuality.individualScores?.emotionalExpression || Math.round(smileQuality.naturalness * 100)
              }
            }
          } else if (smileContext === 'social') {
            // 소통의 미소: 친화력, 신뢰감, 편안함
            metricsData = {
              primary: { 
                label: smileTypes[smileContext].metrics.primary, 
                value: smileQuality.individualScores?.affinity || Math.round(smileQuality.therapeuticValue * 100)
              },
              secondary: { 
                label: smileTypes[smileContext].metrics.secondary, 
                value: smileQuality.individualScores?.trustworthiness || Math.round(smileQuality.comfort * 100)
              },
              tertiary: { 
                label: smileTypes[smileContext].metrics.tertiary, 
                value: smileQuality.individualScores?.easiness || Math.round(smileQuality.naturalness * 100)
              }
            }
          } else { // practice
            // 자기계발 미소: 자신감, 안정감, 자연스러움
            metricsData = {
              primary: { 
                label: smileTypes[smileContext].metrics.primary, 
                value: smileQuality.individualScores?.confidence || Math.round(smileQuality.therapeuticValue * 100)
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
          }
          
          // 최고 점수 갱신 및 캡처 - 자연스러움 조건 확인 후
          if (score > maxScore && smileQuality.naturalness > 0.6) {
            setMaxScore(score)
            setMaxScoreMetrics({
              confidence: Math.round(smileQuality.confidence * 100),
              stability: Math.round(smileQuality.stability * 100),
              naturalness: Math.round(smileQuality.naturalness * 100)
            })
            console.log('새로운 최고 점수:', score)
            
            // 최고 점수가 실제로 갱신될 때만 캡처
            if (isDetecting) {
              capturePhotoWithAnalysis(metricsData, coaching, score)
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
          
          // 화면 중앙 계산
          const screenCenterX = displayWidth / 2
          const screenCenterY = displayHeight / 2
          
          // 얼굴 위치 확인 (화면의 중앙 30% 영역 내에 있는지)
          const centerThreshold = 0.15 // 화면 크기의 15%
          const xOffset = Math.abs(centerX - screenCenterX) / displayWidth
          const yOffset = Math.abs(centerY - screenCenterY) / displayHeight
          
          // 위치 안내 메시지 설정
          if (xOffset > centerThreshold || yOffset > centerThreshold) {
            let guide = t('moveFace') + ' '
            if (yOffset > centerThreshold) {
              if (centerY < screenCenterY) guide += t('down') + ' '
              else guide += t('up') + ' '
            }
            if (xOffset > centerThreshold) {
              // 거울 모드일 때는 좌우 방향을 반대로 안내
              if (isMirrored) {
                if (centerX < screenCenterX) guide += t('left') + ' '
                else guide += t('right') + ' '
              } else {
                if (centerX < screenCenterX) guide += t('right') + ' '
                else guide += t('left') + ' '
              }
            }
            guide = guide.trim()
            setFacePositionGuide(guide)
          } else {
            setFacePositionGuide('')
          }

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
            
            // 얼굴 크기에 비례한 AR 가이드 크기 계산
            const faceWidth = adjustedBox.width
            const faceHeight = adjustedBox.height
            const faceScale = Math.min(faceWidth, faceHeight) / 200 // 기준값 200px
            
            // 랜드마크 포인트를 캔버스 좌표로 변환하는 함수
            const getLandmarkPoint = (index) => {
              const x = positions[index].x * scaleX
              const y = positions[index].y * scaleY
              // 미러 모드일 때 X 좌표 반전
              return {
                x: isMirrored ? displayWidth - x : x,
                y: y
              }
            }
            
            // 1. 대관골근(광대근) 표시 - 실제 볼 위치
            if (happiness < 0.5 || (currentCoachingMessages && currentCoachingMessages.some(msg => msg.includes(t('zygomaticMuscle'))))) {
              // 왼쪽 광대근 (랜드마크 1-3 영역)
              const leftCheek = getLandmarkPoint(2)
              const rightCheek = getLandmarkPoint(14)
              
              // 광대근 포인트 표시
              ctx.fillStyle = '#10b981'
              ctx.strokeStyle = '#10b981'
              ctx.lineWidth = 2
              
              // 왼쪽 광대근 점 (얼굴 크기에 비례)
              ctx.beginPath()
              ctx.arc(leftCheek.x, leftCheek.y, 8 * faceScale, 0, 2 * Math.PI)
              ctx.fill()
              
              // 오른쪽 광대근 점 (얼굴 크기에 비례)
              ctx.beginPath()
              ctx.arc(rightCheek.x, rightCheek.y, 8 * faceScale, 0, 2 * Math.PI)
              ctx.fill()
              
              // 광대근 영역 표시 (반투명, 얼굴 크기에 비례)
              ctx.fillStyle = '#10b98130'
              ctx.beginPath()
              ctx.ellipse(leftCheek.x, leftCheek.y, 25 * faceScale, 20 * faceScale, -15 * Math.PI / 180, 0, 2 * Math.PI)
              ctx.fill()
              ctx.beginPath()
              ctx.ellipse(rightCheek.x, rightCheek.y, 25 * faceScale, 20 * faceScale, 15 * Math.PI / 180, 0, 2 * Math.PI)
              ctx.fill()
              
              // 근육명 표시
              ctx.save() // 현재 상태 저장
              const fontSize = Math.max(11, Math.min(16, 11 * faceScale))
              ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
              ctx.textAlign = 'center'
              
              // 텍스트 크기 측정
              const text = t('zygomaticMuscle')
              const textMetrics = ctx.measureText(text)
              const textWidth = textMetrics.width
              const textHeight = fontSize * 1.3
              const padding = 4 * faceScale
              
              // 미러 모드일 때 텍스트도 반전되므로 다시 반전시켜 정상적으로 보이게 함
              if (isMirrored) {
                ctx.translate(leftCheek.x, leftCheek.y - 25)
                ctx.scale(-1, 1)
                
                // 흰색 배경 그리기
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(-textWidth/2 - padding, -textHeight/2 - padding, textWidth + padding*2, textHeight + padding*2)
                
                // 텍스트 그리기
                ctx.fillStyle = '#10b981'
                ctx.fillText(text, 0, 0)
                ctx.setTransform(1, 0, 0, 1, 0, 0)
                
                ctx.translate(rightCheek.x, rightCheek.y - 25)
                ctx.scale(-1, 1)
                
                // 흰색 배경 그리기
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(-textWidth/2 - padding, -textHeight/2 - padding, textWidth + padding*2, textHeight + padding*2)
                
                // 텍스트 그리기
                ctx.fillStyle = '#10b981'
                ctx.fillText(text, 0, 0)
              } else {
                // 왼쪽 대관골근
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(leftCheek.x - textWidth/2 - padding, leftCheek.y - 25 - textHeight/2 - padding, textWidth + padding*2, textHeight + padding*2)
                ctx.fillStyle = '#10b981'
                ctx.fillText(text, leftCheek.x, leftCheek.y - 25)
                
                // 오른쪽 대관골근
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(rightCheek.x - textWidth/2 - padding, rightCheek.y - 25 - textHeight/2 - padding, textWidth + padding*2, textHeight + padding*2)
                ctx.fillStyle = '#10b981'
                ctx.fillText(text, rightCheek.x, rightCheek.y - 25)
              }
              ctx.restore() // 상태 복원
              
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
              
              // 주요 포인트에 점 표시 (얼굴 크기에 비례)
              const eyePoints = [leftEyeOuter, leftEyeBottom, rightEyeOuter, rightEyeBottom]
              eyePoints.forEach(point => {
                ctx.beginPath()
                ctx.arc(point.x, point.y, 5 * faceScale, 0, 2 * Math.PI)
                ctx.fill()
              })
              
              // 눈둘레근 영역 표시 (얼굴 크기에 비례)
              ctx.strokeStyle = '#3B82F660'
              ctx.lineWidth = 2 * faceScale
              ctx.setLineDash([4 * faceScale, 2 * faceScale])
              
              // 왼쪽 눈 주위
              ctx.beginPath()
              ctx.ellipse(
                (leftEyeOuter.x + leftEyeInner.x) / 2,
                (leftEyeOuter.y + leftEyeBottom.y) / 2,
                Math.abs(leftEyeInner.x - leftEyeOuter.x) / 2 + 10 * faceScale,
                15 * faceScale,
                0, 0, 2 * Math.PI
              )
              ctx.stroke()
              
              // 오른쪽 눈 주위
              ctx.beginPath()
              ctx.ellipse(
                (rightEyeOuter.x + rightEyeInner.x) / 2,
                (rightEyeOuter.y + rightEyeBottom.y) / 2,
                Math.abs(rightEyeOuter.x - rightEyeInner.x) / 2 + 10 * faceScale,
                15 * faceScale,
                0, 0, 2 * Math.PI
              )
              ctx.stroke()
              ctx.setLineDash([])
              
              // 근육명 표시
              ctx.save()
              const eyeFontSize = Math.max(11, Math.min(16, 11 * faceScale))
              ctx.font = `${eyeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
              ctx.textAlign = 'center'
              const eyeCenterX = (leftEyeInner.x + rightEyeInner.x) / 2
              
              // 텍스트 크기 측정
              const eyeText = t('orbicularisOculi')
              const eyeTextMetrics = ctx.measureText(eyeText)
              const eyeTextWidth = eyeTextMetrics.width
              const eyeTextHeight = eyeFontSize * 1.3
              const eyePadding = 4 * faceScale
              
              if (isMirrored) {
                ctx.translate(eyeCenterX, leftEyeOuter.y - 20)
                ctx.scale(-1, 1)
                
                // 흰색 배경 그리기
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(-eyeTextWidth/2 - eyePadding, -eyeTextHeight/2 - eyePadding, eyeTextWidth + eyePadding*2, eyeTextHeight + eyePadding*2)
                
                // 텍스트 그리기
                ctx.fillStyle = '#3B82F6'
                ctx.fillText(eyeText, 0, 0)
              } else {
                // 흰색 배경 그리기
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(eyeCenterX - eyeTextWidth/2 - eyePadding, leftEyeOuter.y - 20 - eyeTextHeight/2 - eyePadding, eyeTextWidth + eyePadding*2, eyeTextHeight + eyePadding*2)
                
                // 텍스트 그리기
                ctx.fillStyle = '#3B82F6'
                ctx.fillText(eyeText, eyeCenterX, leftEyeOuter.y - 20)
              }
              ctx.restore()
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
                ctx.arc(point.x, point.y, 6 * faceScale, 0, 2 * Math.PI)
                ctx.fill()
              })
              
              // 구륜근 영역 표시 (반투명, 얼굴 크기에 비례)
              ctx.strokeStyle = '#8B5CF660'
              ctx.lineWidth = 3 * faceScale
              ctx.setLineDash([5 * faceScale, 3 * faceScale])
              
              ctx.beginPath()
              ctx.ellipse(
                (mouthLeft.x + mouthRight.x) / 2,
                (mouthTop.y + mouthBottom.y) / 2,
                Math.abs(mouthRight.x - mouthLeft.x) / 2 + 15 * faceScale,
                Math.abs(mouthBottom.y - mouthTop.y) / 2 + 10 * faceScale,
                0, 0, 2 * Math.PI
              )
              ctx.stroke()
              ctx.setLineDash([])
              
              // 근육명 표시
              ctx.save()
              const mouthFontSize = Math.max(11, Math.min(16, 11 * faceScale))
              ctx.font = `${mouthFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
              ctx.textAlign = 'center'
              const mouthCenterX = (mouthLeft.x + mouthRight.x) / 2
              
              // 텍스트 크기 측정
              const mouthText = t('orbicularisOris')
              const mouthTextMetrics = ctx.measureText(mouthText)
              const mouthTextWidth = mouthTextMetrics.width
              const mouthTextHeight = mouthFontSize * 1.3
              const mouthPadding = 4 * faceScale
              
              if (isMirrored) {
                ctx.translate(mouthCenterX, mouthBottom.y + 25)
                ctx.scale(-1, 1)
                
                // 흰색 배경 그리기
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(-mouthTextWidth/2 - mouthPadding, -mouthTextHeight/2 - mouthPadding, mouthTextWidth + mouthPadding*2, mouthTextHeight + mouthPadding*2)
                
                // 텍스트 그리기
                ctx.fillStyle = '#8B5CF6'
                ctx.fillText(mouthText, 0, 0)
              } else {
                // 흰색 배경 그리기
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.fillRect(mouthCenterX - mouthTextWidth/2 - mouthPadding, mouthBottom.y + 25 - mouthTextHeight/2 - mouthPadding, mouthTextWidth + mouthPadding*2, mouthTextHeight + mouthPadding*2)
                
                // 텍스트 그리기
                ctx.fillStyle = '#8B5CF6'
                ctx.fillText(mouthText, mouthCenterX, mouthBottom.y + 25)
              }
              ctx.restore()
              
              // 움직임 가이드 화살표 (얼굴 크기에 비례)
              ctx.strokeStyle = '#8B5CF6'
              ctx.lineWidth = 2 * faceScale
              ctx.setLineDash([3 * faceScale, 3 * faceScale])
              
              // 왼쪽 입꼬리
              ctx.beginPath()
              ctx.moveTo(mouthLeft.x, mouthLeft.y)
              ctx.lineTo(mouthLeft.x - 15 * faceScale, mouthLeft.y - 10 * faceScale)
              ctx.stroke()
              
              // 오른쪽 입꼬리
              ctx.beginPath()
              ctx.moveTo(mouthRight.x, mouthRight.y)
              ctx.lineTo(mouthRight.x + 15 * faceScale, mouthRight.y - 10 * faceScale)
              ctx.stroke()
              
              ctx.setLineDash([])
            }
          }

          // 캔버스에서는 점수와 코칭 메시지를 그리지 않음 (DOM으로 표시)

        } else {
          // 얼굴을 찾지 못했을 때도 DOM으로 표시
          setCurrentCoachingMessages([t('getComfortable')])
          setFacePositionGuide(t('adjustCameraToShowFace'))
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
    // 비로그인 사용자가 10회 이상 무료 세션을 사용한 경우
    if (!user && freeSessionCount >= 10) {
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
    
    // 카메라는 practice 단계에서만 시작되도록 함
    // startCamera() 호출 제거
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
          <p className="loading-text">{t('systemLoading')}</p>
        </div>
      </div>
    )
  }

  // 무료 체험 남은 횟수 계산
  const getFreeSessionsRemaining = () => {
    if (user) return null // 로그인 사용자는 표시 안함
    return Math.max(0, 10 - freeSessionCount)
  }

  const freeSessionsRemaining = getFreeSessionsRemaining()

  return (
    <div className="smile-detector">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* 무료 체험 표시 */}
      {freeSessionsRemaining !== null && (
        <div className="ios-free-session-badge">
          <span className="ios-badge-text">{t('freeTrialRemaining')}: <span className="ios-badge-count">{freeSessionsRemaining}/10</span></span>
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
          <h4>{t('purposeQuestion')}</h4>
          <div className="purpose-buttons">
            <button 
              onClick={() => handlePurposeSelect('confidence')}
              className="purpose-btn"
            >
              <div className="purpose-title">{t('confidenceTitle')}</div>
              <div className="purpose-desc">{t('confidenceDesc')}</div>
            </button>
            <button 
              onClick={() => handlePurposeSelect('relationship')}
              className="purpose-btn"
            >
              <div className="purpose-title">{t('relationshipTitle')}</div>
              <div className="purpose-desc">{t('relationshipDesc')}</div>
            </button>
            <button 
              onClick={() => handlePurposeSelect('happiness')}
              className="purpose-btn"
            >
              <div className="purpose-title">{t('happinessTitle')}</div>
              <div className="purpose-desc">{t('happinessDesc')}</div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 감정 체크 */}
      {currentStep === 'emotion' && (
        <div className="step-panel">
          <h4>{t('emotionBefore')}</h4>
          <div className="emotion-buttons">
            <button 
              onClick={() => handleEmotionSelect('happy')} 
              className="emotion-btn"
              data-emotion="happy"
            >
              {t('emotionGood')}
            </button>
            <button 
              onClick={() => handleEmotionSelect('neutral')} 
              className="emotion-btn"
              data-emotion="neutral"
            >
              {t('emotionNeutral')}
            </button>
            <button 
              onClick={() => handleEmotionSelect('sad')} 
              className="emotion-btn"
              data-emotion="sad"
            >
              {t('emotionTired')}
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
              <h5>{t('characteristics')}:</h5>
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
                <h5>{t('facialMuscles')}:</h5>
                <div className="muscle-info">
                  <div className="muscle-primary">
                    <strong>{t('primaryMuscle')}:</strong> {smileTypes[smileContext].muscleGuide.primary}
                  </div>
                  <div className="muscle-secondary">
                    <strong>{t('secondaryMuscle')}:</strong> {smileTypes[smileContext].muscleGuide.secondary}
                  </div>
                  <div className="muscle-tips">
                    <strong>{t('practiceTips')}:</strong>
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
{t('practiceWithThisSmile')}
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
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' 
                  }}
                />
                <canvas 
                  ref={canvasRef}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)'
                  }}
                />
                
                {/* 점수 표시 - 좌측 상단 */}
                {isDetecting && (
                  <div className="score-display-overlay">
                    <div className="score-value">{currentScore}%</div>
                    <div className="score-divider">·</div>
                    <div className="score-type">{currentSmileType || t('analyzing')}</div>
                  </div>
                )}
                
                {/* 얼굴 위치 안내 메시지 - 카메라 화면 내부 하단 */}
                {isDetecting && facePositionGuide && (
                  <div className="face-position-guide">
                    <span className="guide-icon">📍</span>
                    <span className="guide-text">{facePositionGuide}</span>
                  </div>
                )}
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
                  <h3 className="ios-analysis-title">{t('realtimeAnalysis')}</h3>
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
                console.log('Stop practice button clicked')
                stopDetection()
                
                // 카메라 즉시 정리 (stopCamera가 비디오 숨김 처리도 함)
                stopCamera()
                
                setCurrentStep('feedback')
              }} className="stop-practice-btn">
{t('stopPractice')}
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
                <h3>{t('cameraPermissionNeeded')}</h3>
                <p>{t('cameraPermissionDescription')}</p>
                <div className="permission-info">
                  <div className="info-item">
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('onlyForSmileAnalysis')}</span>
                  </div>
                  <div className="info-item">
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('noPhotoVideoSaved')}</span>
                  </div>
                  <div className="info-item">
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8L6 12L14 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{t('canStopAnytime')}</span>
                  </div>
                </div>
                <div className="permission-buttons">
                  <button className="permission-allow" onClick={() => {
                    setShowCameraPermission(false)
                    startCamera()
                  }}>
{t('allowCamera')}
                  </button>
                  <button className="permission-cancel" onClick={() => {
                    setShowCameraPermission(false)
                  }}>
{t('later')}
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
                <h3>{t('cameraPermissionBlocked')}</h3>
                <p>{t('cameraPermissionBlockedMessage')}</p>
                <div className="permission-guide">
                  <h4>{t('howToAllowPermission')}:</h4>
                  <ol>
                    <li>{t('clickLockIcon')}</li>
                    <li>{t('changeCameraToAllow')}</li>
                    <li>{t('refreshPage')}</li>
                  </ol>
                </div>
                <div className="permission-buttons">
                  <button className="permission-retry" onClick={() => {
                    setCameraPermissionDenied(false)
                    window.location.reload()
                  }}>
                    {t('refresh')}
                  </button>
                  <button className="permission-cancel" onClick={() => {
                    setCameraPermissionDenied(false)
                  }}>
                    {t('close')}
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
          <h4>{t('emotionAfter')}</h4>
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
{t('emotionBetter')}
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
{t('emotionSame')}
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
{t('emotionLittleTired')}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: 완료 */}
      {currentStep === 'complete' && (
        <div className="step-panel">
          <div className="completion-card">
            <h4>{t('practiceComplete')}</h4>
            <p>{t('practiceCompleteDesc', { smileType: smileTypes[smileContext]?.title })}</p>
            {console.log('완료 화면 - emotionBefore:', emotionBefore, 'emotionAfter:', emotionAfter)}
            <div className="session-summary">
              <div className="summary-item">
                <span className="summary-label">{t('maxScore')}</span>
                <span className="summary-value score">{maxScore || 0}%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('practiceSmileType')}</span>
                <span className="summary-value smile-type">{smileTypes[smileContext]?.title}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('moodChange')}</span>
                <span className="summary-value mood-change">
                  <span className="mood-before">{emotionBefore === 'happy' ? t('emotionGood') : emotionBefore === 'neutral' ? t('emotionNeutral') : emotionBefore === 'sad' ? t('emotionTired') : ''}</span>
                  <span className="mood-arrow">→</span>
                  <span className="mood-after">{emotionAfter === 'better' ? t('emotionGood') : emotionAfter === 'same' ? t('emotionNeutral') : emotionAfter === 'tired' ? t('emotionTired') : t('emotionNeutral')}</span>
                </span>
              </div>
            </div>
            
            {/* 최고의 순간 - 캡처된 사진 표시 */}
            {capturedPhoto && capturedAnalysis && (
              <div className="captured-photo-section">
                <h3 className="captured-title">{t('bestMoment')} 📸</h3>
                <div className="captured-photo-container">
                  <img src={capturedPhoto} alt={t('capturedSmile')} className="captured-photo" />
                </div>
                <div className="captured-photo-info">
                  <div className="info-score">
                    <span className="info-label">{t('score')}</span>
                    <span className="info-value">{capturedAnalysis.score}%</span>
                  </div>
                  <div className="info-metrics">
                    <div className="metric-item">
                      <span className="metric-label">{capturedAnalysis.metrics.primary.label}</span>
                      <span className="metric-value">{capturedAnalysis.metrics.primary.value}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">{capturedAnalysis.metrics.secondary.label}</span>
                      <span className="metric-value">{capturedAnalysis.metrics.secondary.value}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">{capturedAnalysis.metrics.tertiary.label}</span>
                      <span className="metric-value">{capturedAnalysis.metrics.tertiary.value}%</span>
                    </div>
                  </div>
                  {capturedAnalysis.coaching && capturedAnalysis.coaching.length > 0 && (
                    <div className="info-coaching">
                      {capturedAnalysis.coaching.map((message, index) => (
                        <p key={index} className="coaching-tip">{message}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!user && (
              <div className="signup-prompt-box">
                <div className="warning-icon">⚠️</div>
                <h4>{t('recordNotSaved')}</h4>
                <p>{t('temporaryRecord')}</p>
                <p className="highlight-text">{t('signupToPermanentSave')}</p>
                <button onClick={() => navigate('/signup')} className="signup-cta-btn">
{t('signupAndSaveRecord')}
                </button>
              </div>
            )}
            
            <button onClick={resetGuide} className="restart-btn">
{t('tryOtherSmile')}
            </button>
          </div>
        </div>
      )}
      
      {/* 로그인 유도 모달 */}
      {showLoginPrompt && (
        <div className="login-prompt-overlay">
          <div className="login-prompt-modal">
            <h3>{t('freeTrialEnded')}</h3>
            <p>{t('freeTrialEndedDesc')}</p>
            <p>{t('loginToContinue')}</p>
            <div className="prompt-buttons">
              <button onClick={() => navigate('/login', { state: { from: '/app', message: t('loginToContinue') } })} className="login-prompt-btn">
                {t('login')}
              </button>
              <button onClick={() => navigate('/signup')} className="signup-prompt-btn">
{t('signup')}
              </button>
            </div>
            <button onClick={() => {
              localStorage.removeItem('allowFreeSession')
              navigate('/')
            }} className="close-prompt">
{t('backToHome')}
            </button>
          </div>
        </div>
      )}

      <div className="status">
        <p>{t('trainingSystem')}: {isModelLoaded ? t('systemReady') : t('systemLoading')}</p>
        <p>{t('camera')}: {isStreaming ? t('active') : t('inactive')}</p>
        <p>{t('smileAnalysis')}: {isDetecting ? t('analyzing') : t('waiting')}</p>
      </div>
    </div>
  )
}

export default SmileDetector