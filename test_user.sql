-- Supabase SQL Editor에서 실행하세요
-- 테스트 사용자 생성 (이메일 인증 없이)

-- 1. 먼저 기존 테스트 사용자가 있다면 삭제
DELETE FROM auth.users WHERE email = 'test@example.com';

-- 2. 테스트 사용자 생성
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('test1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "테스트 사용자"}',
  false,
  now()
);

-- 3. 사용자가 생성되었는지 확인
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'test@example.com';

-- 테스트 계정 정보:
-- 이메일: test@example.com
-- 비밀번호: test1234