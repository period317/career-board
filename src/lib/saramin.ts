// 사람인 채용정보 Open API 클라이언트
// docs: https://oapi.saramin.co.kr

const BASE = 'https://oapi.saramin.co.kr/job-search'

export type SaraminJob = {
  id: string
  url: string
  active: number
  company: { detail: { name: string; href?: string } }
  position: {
    title: string
    industry?: { name: string; code: string }
    location?: { name: string; code: string }
    'job-mid-code'?: { name: string; code: string }
    'job-code'?: { name: string; code: string }
    'job-type'?: { name: string; code: string }
    'experience-level'?: { name: string; code: string; min?: number; max?: number }
    'required-education-level'?: { name: string; code: string }
  }
  salary?: { name: string; code: string }
  'keyword'?: string
  'posting-timestamp'?: string
  'expiration-timestamp'?: string
  'expiration-date'?: string
}

export type SaraminResponse = {
  jobs: {
    total: number
    start: number
    count: number
    job: SaraminJob[]
  }
}

export async function fetchSaramin(params: {
  keywords?: string
  job_mid_cd?: string  // 직무 중분류
  loc_cd?: string      // 근무지역
  exp_cd?: string      // 경력
  count?: number       // 결과 개수 (max 110)
  start?: number       // 페이지
}): Promise<SaraminJob[]> {
  const accessKey = process.env.SARAMIN_ACCESS_KEY
  if (!accessKey) {
    throw new Error('SARAMIN_ACCESS_KEY not set')
  }

  const qs = new URLSearchParams({
    access_key: accessKey,
    ...Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ),
  })

  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`사람인 API 호출 실패: ${res.status}`)
  }

  const data = (await res.json()) as SaraminResponse
  return data.jobs?.job ?? []
}

// 사람인 응답 → DB row 변환
export function mapSaraminToJob(s: SaraminJob) {
  const exp = s.position['experience-level']
  return {
    source: 'saramin' as const,
    source_id: s.id,
    url: s.url,
    company_name: s.company.detail.name,
    title: s.position.title,
    category_raw: s.position['job-mid-code']?.name ?? s.position['job-code']?.name ?? null,
    experience_level: exp?.name ?? null,
    experience_min: exp?.min ?? null,
    experience_max: exp?.max ?? null,
    employment_type: s.position['job-type']?.name ?? null,
    location: s.position.location?.name ?? null,
    salary: s.salary?.name ?? null,
    company_industry: s.position.industry?.name ?? null,
    posted_at: s['posting-timestamp']
      ? new Date(parseInt(s['posting-timestamp']) * 1000).toISOString()
      : null,
    deadline: s['expiration-timestamp']
      ? new Date(parseInt(s['expiration-timestamp']) * 1000).toISOString()
      : null,
  }
}
