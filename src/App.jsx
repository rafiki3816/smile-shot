import { useState } from 'react'
import Camera from './Camera'
import SmileDetector from './SmileDetector'
import PracticeHistory from './PracticeHistory'
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState('practice') // 'practice' 또는 'history'

  return (
    <>
      <div className="app-header">
        <h1>SmileShot</h1>
        <p>웃는 표정을 연습해보세요!</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="tab-menu">
        <button 
          className={`tab-button ${currentTab === 'practice' ? 'active' : ''}`}
          onClick={() => setCurrentTab('practice')}
        >
          연습하기
        </button>
        <button 
          className={`tab-button ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentTab('history')}
        >
          기록 보기
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="tab-content">
        {currentTab === 'practice' ? (
          <div className="main-content">
            <div className="practice-section">
              <h3>미소 점수 AI 분석</h3>
              <p>실시간으로 미소 점수를 측정하고 연습해보세요!</p>
              <SmileDetector />
            </div>
          </div>
        ) : (
          <PracticeHistory />
        )}
      </div>
    </>
  )
}

export default App