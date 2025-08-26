// 외부에서 사용할 수 있도록 함수 export
export const addPracticeRecord = (maxScore, avgScore, duration) => {
  // 이 함수는 SmileDetector에서 호출할 예정
  const event = new CustomEvent('addPracticeRecord', {
    detail: { maxScore, avgScore, duration }
  })
  window.dispatchEvent(event)
}