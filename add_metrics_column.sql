-- practice_sessions 테이블에 metrics 컬럼 추가
-- 메트릭 정보(자신감, 안정감, 자연스러움)를 JSON 형태로 저장

ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS metrics JSONB;

-- 메트릭 데이터에 대한 인덱스 추가 (선택사항 - 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_practice_sessions_metrics 
ON practice_sessions USING GIN (metrics);

-- 기존 데이터에 대한 기본값 설정 (선택사항)
-- UPDATE practice_sessions 
-- SET metrics = '{"confidence": null, "stability": null, "naturalness": null}'::jsonb 
-- WHERE metrics IS NULL;

-- 메트릭 정보가 포함된 통계 뷰 업데이트
CREATE OR REPLACE VIEW user_practice_stats_with_metrics AS
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  AVG(max_score) as average_score,
  MAX(max_score) as best_score,
  SUM(duration) as total_duration,
  COUNT(DISTINCT DATE(date)) as days_practiced,
  DATE(MAX(date)) as last_practice_date,
  -- 메트릭별 평균 (JSONB에서 추출)
  AVG((metrics->>'confidence')::numeric) as avg_confidence,
  AVG((metrics->>'stability')::numeric) as avg_stability,
  AVG((metrics->>'naturalness')::numeric) as avg_naturalness
FROM practice_sessions
GROUP BY user_id;

-- 주간 메트릭 통계 뷰
CREATE OR REPLACE VIEW weekly_practice_metrics AS
SELECT 
  user_id,
  DATE_TRUNC('week', date) as week_start,
  COUNT(*) as sessions_count,
  AVG(max_score) as avg_score,
  AVG((metrics->>'confidence')::numeric) as avg_confidence,
  AVG((metrics->>'stability')::numeric) as avg_stability,
  AVG((metrics->>'naturalness')::numeric) as avg_naturalness
FROM practice_sessions
WHERE date >= CURRENT_DATE - INTERVAL '4 weeks'
  AND metrics IS NOT NULL
GROUP BY user_id, DATE_TRUNC('week', date)
ORDER BY user_id, week_start DESC;