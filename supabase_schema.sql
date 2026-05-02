-- Career Board: 기획/마케팅/PM 채용공고 DB

-- 직군 카테고리
CREATE TABLE IF NOT EXISTS job_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,             -- '기획', '마케팅', '사업기획', 'PM/PO'
  slug TEXT NOT NULL UNIQUE,
  saramin_codes TEXT[],           -- 사람인 job_mid_cd 매핑
  sort_order INT DEFAULT 0
);

INSERT INTO job_categories (name, slug, saramin_codes, sort_order) VALUES
  ('기획', 'planning',     ARRAY['101','102','103'], 1),  -- 서비스/전략기획
  ('PM/PO', 'pm-po',       ARRAY['101','102'],       2),  -- 프로덕트 매니지먼트
  ('마케팅', 'marketing',  ARRAY['104','105'],       3),  -- 퍼포먼스/브랜드/콘텐츠
  ('사업기획', 'biz-dev',  ARRAY['101','110'],       4),  -- 사업개발/운영기획
  ('운영기획', 'ops',      ARRAY['111','112'],       5)   -- 사업/서비스운영
ON CONFLICT (slug) DO NOTHING;

-- 채용공고
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,

  -- 출처
  source TEXT NOT NULL,           -- 'saramin' | 'worknet' | 'manual'
  source_id TEXT NOT NULL,        -- 출처별 고유 ID (중복 방지)
  url TEXT NOT NULL,

  -- 기본 정보
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,

  -- 분류
  category_id INT REFERENCES job_categories(id) ON DELETE SET NULL,
  category_raw TEXT,              -- 원본 직무 텍스트
  experience_level TEXT,          -- '신입' | '경력' | '신입/경력' | '무관'
  experience_min INT,             -- 최소 경력 연차
  experience_max INT,             -- 최대 경력 연차
  employment_type TEXT,           -- '정규직' | '계약직' | '인턴' 등
  location TEXT,
  salary TEXT,

  -- 상세 (공고 본문)
  jd_text TEXT,                   -- 주요 업무
  requirements TEXT,              -- 자격요건
  preferred TEXT,                 -- 우대사항

  -- 회사 정보
  company_industry TEXT,
  company_size TEXT,
  company_info TEXT,              -- 추가 메모

  -- 일정
  posted_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,

  -- 멘토 보완 정보 (수동 입력)
  selection_process TEXT,         -- 전형 단계: 서류→인적성→면접 등
  recommendation_note TEXT,       -- 추천 메모
  recommendation_tags TEXT[],     -- ['신입추천', '유망스타트업', '대기업'] 등
  is_featured BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_hidden ON jobs(is_hidden);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(is_featured);

-- 수집 로그
CREATE TABLE IF NOT EXISTS fetch_logs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,           -- 'success' | 'error'
  fetched_count INT DEFAULT 0,
  inserted_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
