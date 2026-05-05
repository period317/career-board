-- ============================================================
-- 다이몬 커리어 채용보드 — Supabase 초기 스키마
-- Supabase Dashboard → SQL Editor 에서 순서대로 실행
-- ============================================================

-- 1. 직군 카테고리
CREATE TABLE IF NOT EXISTS job_categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,   -- 'planning' | 'pm-po' | 'marketing' | 'biz-dev' | 'ops'
  name        TEXT NOT NULL,          -- 화면 표시명 (기획, PM/PO, …)
  saramin_codes TEXT[] DEFAULT '{}',  -- 사람인 직무코드 배열 (추후 활용)
  sort_order  INT  DEFAULT 0
);

INSERT INTO job_categories (slug, name, sort_order) VALUES
  ('planning',  '기획',     1),
  ('pm-po',     'PM/PO',    2),
  ('marketing', '마케팅',   3),
  ('biz-dev',   '사업기획', 4),
  ('ops',       '운영기획', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. 채용공고
CREATE TABLE IF NOT EXISTS jobs (
  id                  BIGSERIAL PRIMARY KEY,
  source              TEXT NOT NULL CHECK (source IN ('saramin', 'worknet', 'wanted', 'linkareer', 'manual')),
  content_type        TEXT NOT NULL DEFAULT 'job' CHECK (content_type IN ('job', 'intern', 'bootcamp')),
  source_id           TEXT NOT NULL,
  url                 TEXT NOT NULL,

  company_name        TEXT NOT NULL,
  title               TEXT NOT NULL,

  category_id         INT REFERENCES job_categories(id),
  category_raw        TEXT,
  experience_level    TEXT,
  experience_min      INT,
  experience_max      INT,
  experience_category TEXT CHECK (experience_category IN ('newbie', 'junior', 'senior')),
  employment_type     TEXT,
  location            TEXT,
  salary              TEXT,

  jd_text             TEXT,
  requirements        TEXT,
  preferred           TEXT,

  company_industry    TEXT,
  company_size        TEXT,
  company_info        TEXT,

  posted_at           TIMESTAMPTZ,
  deadline            TIMESTAMPTZ,

  selection_process   TEXT,
  recommendation_note TEXT,
  recommendation_tags TEXT[] DEFAULT '{}',
  is_featured         BOOLEAN DEFAULT FALSE,
  is_hidden           BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (source, source_id)
);

-- 3. 크론 실행 로그
CREATE TABLE IF NOT EXISTS fetch_logs (
  id              BIGSERIAL PRIMARY KEY,
  source          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('success', 'error')),
  fetched_count   INT DEFAULT 0,
  inserted_count  INT DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 (필터·정렬 성능)
CREATE INDEX IF NOT EXISTS idx_jobs_category    ON jobs (category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_exp_cat     ON jobs (experience_category);
CREATE INDEX IF NOT EXISTS idx_jobs_posted      ON jobs (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline    ON jobs (deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_featured    ON jobs (is_featured, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_hidden      ON jobs (is_hidden);

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Row Level Security (공개 읽기 / 어드민 쓰기)
ALTER TABLE jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_logs    ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 (숨김 제외)
CREATE POLICY "public read jobs"
  ON jobs FOR SELECT
  USING (is_hidden = FALSE);

-- service role 전체 접근 (cron, admin 용)
CREATE POLICY "service role all jobs"
  ON jobs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "public read categories"
  ON job_categories FOR SELECT
  USING (TRUE);

CREATE POLICY "service role all categories"
  ON job_categories FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "service role all logs"
  ON fetch_logs FOR ALL
  USING (auth.role() = 'service_role');
