/**
 * 원티드 내부 API 클라이언트
 * 공식 API 없이 프론트엔드가 사용하는 JSON 엔드포인트를 직접 호출
 *
 * 카테고리 ID:
 *   507 = 서비스 기획·UI/UX
 *   523 = 마케팅·광고·홍보
 *   524 = 기획·전략 (사업기획)
 *   510 = 운영·CS
 */

const BASE = 'https://www.wanted.co.kr/api/v4/jobs'

// 우리가 수집할 카테고리 (id → slug 매핑 포함)
export const WANTED_CATEGORIES = [
  { id: 507,  name: '서비스기획/UX',  slug: 'planning'  },
  { id: 518,  name: 'PM/프로덕트',    slug: 'pm-po'     },
  { id: 523,  name: '마케팅',          slug: 'marketing' },
  { id: 524,  name: '기획/전략',       slug: 'biz-dev'   },
  { id: 510,  name: '운영',            slug: 'ops'       },
]

export type WantedJob = {
  id: number
  position: string
  company: { id: number; name: string; industry_name: string }
  address: { location: string; full_location: string; district: string }
  annual_from: number
  annual_to: number
  due_time: string | null
  category_tags: { parent_id: number; id: number }[]
}

type WantedResponse = {
  data: WantedJob[]
  links: { next: string | null; prev: string | null }
}

export async function fetchWanted(params: {
  job_category_id: number
  limit?: number
  offset?: number
}): Promise<WantedJob[]> {
  const qs = new URLSearchParams({
    country: 'kr',
    job_sort: 'job.latest_order',
    years: '-1',
    locations: 'all',
    job_category_id: String(params.job_category_id),
    limit: String(params.limit ?? 100),
    offset: String(params.offset ?? 0),
  })

  const res = await fetch(`${BASE}?${qs}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; career-board/1.0)',
      'Referer': 'https://www.wanted.co.kr/',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`원티드 API 호출 실패: ${res.status}`)

  const data = (await res.json()) as WantedResponse
  return data.data ?? []
}

/** 경력 연도 → 카테고리 */
function inferExpFromYears(from: number, to: number): 'newbie' | 'junior' | 'senior' | null {
  if (from === 0 && to <= 1) return 'newbie'
  if (from >= 1 && to <= 5) return 'junior'
  if (from >= 6) return 'senior'
  return null
}


/** 원티드 응답 → DB row 변환 */
export function mapWantedToJob(w: WantedJob) {
  const expText = w.annual_from === 0 && w.annual_to <= 1
    ? '신입'
    : `${w.annual_from}~${w.annual_to}년`

  return {
    source:             'wanted' as const,
    source_id:          String(w.id),
    content_type:       'job' as const,
    url:                `https://www.wanted.co.kr/wd/${w.id}`,
    company_name:       w.company.name,
    title:              w.position,
    category_raw:       w.company.industry_name || null,
    experience_level:   expText,
    experience_category: inferExpFromYears(w.annual_from, w.annual_to),
    employment_type:    '정규직',
    location:           w.address.location || null,
    salary:             null,
    posted_at:          null,
    deadline:           w.due_time ? new Date(w.due_time).toISOString() : null,
  }
}
