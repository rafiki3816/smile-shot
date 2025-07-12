-- Supabase 데이터베이스 설정 SQL
-- SmileShot 앱을 위한 테이블 생성

-- 연습 세션 테이블 생성
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  purpose VARCHAR(50) NOT NULL,
  smile_type VARCHAR(100) NOT NULL,
  max_score INTEGER NOT NULL CHECK (max_score >= 0 AND max_score <= 100),
  context VARCHAR(50) NOT NULL,
  emotion_before VARCHAR(50) NOT NULL,
  emotion_after VARCHAR(50),
  duration INTEGER NOT NULL CHECK (duration >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_date ON practice_sessions(date);
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at);

-- Row Level Security (RLS) 활성화
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own practice sessions" 
  ON practice_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions" 
  ON practice_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions" 
  ON practice_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice sessions" 
  ON practice_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 시간 자동 갱신 트리거
CREATE TRIGGER update_practice_sessions_updated_at 
  BEFORE UPDATE ON practice_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 통계 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW user_practice_stats AS
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  AVG(max_score) as average_score,
  MAX(max_score) as best_score,
  SUM(duration) as total_duration,
  COUNT(DISTINCT DATE(date)) as days_practiced,
  DATE(MAX(date)) as last_practice_date
FROM practice_sessions
GROUP BY user_id;

-- 주간 통계 뷰 (선택사항)
CREATE OR REPLACE VIEW weekly_practice_stats AS
SELECT 
  user_id,
  DATE_TRUNC('week', date) as week_start,
  COUNT(*) as sessions_count,
  AVG(max_score) as avg_score,
  MAX(max_score) as best_score,
  SUM(duration) as total_duration
FROM practice_sessions
WHERE date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY user_id, DATE_TRUNC('week', date)
ORDER BY user_id, week_start DESC;