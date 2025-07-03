import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as faceapi from 'face-api.js'
import { practiceDB } from './supabaseClient'

function SmileDetector({ user }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [smileScore, setSmileScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
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

  // 미소 타입별 정보
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

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error)
      alert('카메라에 접근할 수 없습니다.')
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
    // 비로그인 사용자가 이미 무료 세션을 사용한 경우
    if (!user && hasUsedFreeSession) {
      setShowLoginPrompt(true)
      return
    }
    setEmotionBefore(emotion)
    setCurrentStep('context')
  }

  const handleContextConfirm = () => {
    setCurrentStep('practice')
  }

  // 미소 감지 시작
  const startDetection = () => {
    if (!isModelLoaded || !isStreaming) {
      alert('먼저 카메라를 시작해주세요!')
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
        date: new Date().toISOString(),
        purpose: selectedPurpose,
        smileType: smileTypes[smileContext]?.title || '미소',
        maxScore: maxScore,
        context: smileContext,
        emotionBefore: emotionBefore,
        duration: Math.floor((Date.now() - sessionStartTime) / 1000)
      }
      
      if (user) {
        // 로그인 사용자는 Supabase에 저장
        saveSessionToSupabase(sessionData)
      } else {
        // 비로그인 사용자는 localStorage에 임시 저장
        const sessions = JSON.parse(localStorage.getItem('tempSessions') || '[]')
        sessions.push(sessionData)
        localStorage.setItem('tempSessions', JSON.stringify(sessions))
        
        // 오늘 무료 세션 사용 기록
        if (!hasUsedFreeSession) {
          const today = new Date().toDateString()
          localStorage.setItem('lastFreeSession', today)
          setHasUsedFreeSession(true)
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
      const { error } = await practiceDB.saveSession(sessionData)
      if (error) {
        console.error('세션 저장 오류:', error)
      }
    } catch (error) {
      console.error('세션 저장 중 오류:', error)
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
    
    let contextualScore = 0
    let smileType = smileTypes[context].title
    let therapeuticValue = 0
    
    if (context === 'joy') {
      const joyfulness = happiness * 0.8 + surprise * 0.3 - sad * 0.5
      contextualScore = Math.max(0, joyfulness)
      therapeuticValue = contextualScore * 1.2
    } else if (context === 'social') {
      const sociability = happiness * 0.6 + neutral * 0.2 - fear * 0.3
      contextualScore = Math.max(0, sociability)
      therapeuticValue = contextualScore * 0.9
    } else {
      const progress = happiness * 0.7 + (1 - fear) * 0.3
      contextualScore = Math.max(0, progress)
      therapeuticValue = contextualScore * 1.0
    }
    
    const comfort = 1 - (fear * 0.4 + angry * 0.3 + sad * 0.3)
    const naturalness = Math.max(0.3, comfort)
    const eyeEngagement = surprise * 0.6 + happiness * 0.4
    const wellness = (happiness + (1-sad) + (1-fear) + (1-angry)) / 4
    
    return {
      type: smileType,
      naturalness: naturalness,
      eyeEngagement: eyeEngagement,
      overallScore: Math.min(1, contextualScore),
      therapeuticValue: therapeuticValue,
      wellness: wellness,
      context: context
    }
  }

  // 맞춤형 코칭 메시지
  const getContextualCoaching = (smileQuality, expressions, context) => {
    const messages = []
    const wellness = smileQuality.wellness
    const smileInfo = smileTypes[context]
    
    // 메인 피드백
    if (wellness > 0.8) {
      messages.push(`완벽한 ${smileInfo.title}입니다!`)
    } else if (wellness > 0.6) {
      messages.push(`좋은 ${smileInfo.title}이에요!`)
    } else if (wellness > 0.4) {
      messages.push(`${smileInfo.title} 연습 중이에요!`)
    } else {
      messages.push(`${smileInfo.title}를 연습해보세요!`)
    }
    
    // 맞춤형 코칭
    messages.push(smileInfo.coaching)
    
    // 구체적 조언
    if (smileQuality.eyeEngagement < 0.3 && expressions.happy > 0.4) {
      messages.push('눈으로도 웃어보세요!')
    }
    
    if (expressions.fearful > 0.3) {
      messages.push('깊게 숨을 쉬며 긴장을 풀어보세요')
    }
    
    return messages.slice(0, 3)
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
          .withFaceExpressions()

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detections.length > 0) {
          const expressions = detections[0].expressions
          const smileQuality = analyzeTherapeuticSmile(expressions, detections[0].landmarks, smileContext)
          const currentScore = Math.round(smileQuality.overallScore * 100)
          
          setSmileScore(currentScore)
          setWellnessScore(Math.round(smileQuality.wellness * 100))
          
          if (currentScore > 60) {
            setEncouragementLevel(prev => Math.min(5, prev + 0.1))
          }
          
          if (currentScore > maxScore && smileQuality.naturalness > 0.6) {
            setMaxScore(currentScore)
          }

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

          // 얼굴 박스
          ctx.strokeStyle = boxColor
          ctx.lineWidth = 3
          ctx.strokeRect(adjustedBox.x, adjustedBox.y, adjustedBox.width, adjustedBox.height)

          // 점수 표시
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          
          const scoreText = `${currentScore}%`
          const typeText = smileQuality.type
          const textX = adjustedBox.x + adjustedBox.width / 2
          const textY = adjustedBox.y - 60
          
          // 점수 배경
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          const scoreWidth = ctx.measureText(scoreText).width
          ctx.fillRect(textX - scoreWidth/2 - 15, textY - 30, scoreWidth + 30, 35)
          
          ctx.fillStyle = boxColor
          ctx.fillText(scoreText, textX, textY - 5)
          
          // 미소 타입
          ctx.font = 'bold 14px Arial'
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          const typeWidth = ctx.measureText(typeText).width
          ctx.fillRect(textX - typeWidth/2 - 10, textY + 5, typeWidth + 20, 20)
          
          ctx.fillStyle = 'white'
          ctx.fillText(typeText, textX, textY + 18)

          // 맞춤형 코칭 메시지
          const coaching = getContextualCoaching(smileQuality, expressions, smileContext)
          
          ctx.font = 'bold 16px Arial'
          const messageX = adjustedBox.x + adjustedBox.width / 2
          const messageY = adjustedBox.y + adjustedBox.height + 40
          
          coaching.forEach((message, index) => {
            const yOffset = messageY + (index * 25)
            const messageWidth = ctx.measureText(message).width
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(messageX - messageWidth/2 - 10, yOffset - 15, messageWidth + 20, 22)
            
            ctx.fillStyle = index === 0 ? boxColor : 'white'
            ctx.fillText(message, messageX, yOffset)
          })

        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(0, displayHeight / 2 - 25, displayWidth, 50)
          
          ctx.fillStyle = '#10b981'
          ctx.font = 'bold 20px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('편안하게 자리를 잡아주세요', displayWidth / 2, displayHeight / 2 + 5)
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
    setCurrentStep('purpose')
    setSelectedPurpose('')
    setEmotionBefore('')
    setSmileContext('')
    setEmotionAfter('')
    setSessionStartTime(null)
    setIsDetecting(false)
    setSmileScore(0)
    setMaxScore(0)
  }

  return (
    <div className="smile-detector">
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
            
            <button onClick={handleContextConfirm} className="confirm-btn">
              이 미소로 연습하기
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 실제 연습 */}
      {currentStep === 'practice' && (
        <>
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', maxWidth: '480px' }}
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
          </div>

          {/* 맞춤형 분석 패널 */}
          {isDetecting && smileContext && (
            <div className="contextual-analysis-panel">
              <h4>{smileTypes[smileContext].title} 분석</h4>
              <div className="contextual-metrics">
                <div className="metric-item">
                  <span className="metric-label">{smileTypes[smileContext].metrics.primary}</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill primary"
                      style={{ width: `${Math.round((smileScore / 100) * 85)}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{Math.round((smileScore / 100) * 85)}%</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">{smileTypes[smileContext].metrics.secondary}</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill secondary"
                      style={{ width: `${Math.round((smileScore / 100) * 75)}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{Math.round((smileScore / 100) * 75)}%</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">{smileTypes[smileContext].metrics.tertiary}</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill tertiary"
                      style={{ width: `${wellnessScore}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{wellnessScore}%</span>
                </div>
              </div>
            </div>
          )}

          <div className="score-display">
            <div className="current-score">
              <h3>현재 {smileTypes[smileContext]?.metrics.primary || '점수'}: {smileScore}%</h3>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ 
                    width: `${smileScore}%`,
                    backgroundColor: '#10b981'
                  }}
                ></div>
              </div>
            </div>
            <div className="max-score">
              <p>오늘의 최고 점수: {maxScore}%</p>
            </div>
          </div>

          <div className="controls">
            <button onClick={startCamera} disabled={isStreaming}>
              카메라 시작
            </button>
            <button onClick={stopCamera} disabled={!isStreaming}>
              카메라 중지
            </button>
            <button 
              onClick={startDetection} 
              disabled={!isStreaming || isDetecting || !isModelLoaded}
            >
              미소 연습 시작
            </button>
            <button onClick={stopDetection} disabled={!isDetecting}>
              연습 완료
            </button>
          </div>
        </>
      )}

      {/* Step 5: 연습 후 피드백 */}
      {currentStep === 'feedback' && (
        <div className="step-panel">
          <h4>연습 후 기분은 어떠세요?</h4>
          <div className="emotion-buttons">
            <button 
              onClick={() => {
                setEmotionAfter('better')
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