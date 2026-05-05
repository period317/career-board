import Link from 'next/link'
import { CATEGORIES, EXPERIENCE_LEVELS } from '@/lib/categories'
import { listJobs } from '@/lib/jobs-store'
import type { Job, ContentType } from '@/lib/types'

export const dynamic = 'force-dynamic'

const CONTENT_TYPES: { slug: ContentType | 'all'; name: string; desc: string }[] = [
  { slug: 'all',      name: '전체',    desc: '모든 공고' },
  { slug: 'job',      name: '채용',    desc: '정규직 채용공고' },
  { slug: 'intern',   name: '인턴십',  desc: '인턴·계약직' },
  { slug: 'bootcamp', name: '부트캠프', desc: '교육·과정' },
]

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function fmtDate(d: string | null): string {
  if (!d) return '상시'
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function contentTypeBadge(type: ContentType) {
  if (type === 'intern')   return <span className="tag tag-intern">인턴</span>
  if (type === 'bootcamp') return <span className="tag tag-bootcamp">부트캠프</span>
  return null
}

function JobCard({ job }: { job: Job }) {
  const days = daysUntil(job.deadline)
  const deadlineSoon = days !== null && days <= 7 && days >= 0
  const expDisplay = job.experience_level || '경력 무관'

  return (
    <Link href={`/jobs/${job.id}`} className="job-card block p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {job.is_featured && <span className="tag featured">추천</span>}
          {contentTypeBadge(job.content_type)}
          {job.recommendation_tags?.slice(0, 2).map((t) => (
            <span key={t} className="tag recommend">{t}</span>
          ))}
        </div>
        {deadlineSoon && (
          <span className="tag deadline-soon">D-{days}</span>
        )}
      </div>

      <h3 className="text-[15px] font-semibold mb-1 leading-snug">{job.title}</h3>
      <p className="text-[13px] text-[#6B6B6B] mb-3">{job.company_name}</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#6B6B6B]">
        <span>{expDisplay}</span>
        {job.location && <span>· {job.location}</span>}
        {job.employment_type && <span>· {job.employment_type}</span>}
      </div>

      <div className="mt-3 pt-3 border-t border-[#F0F0EE] flex items-center justify-between text-[11px] text-[#ABABAB]">
        <span>{job.category_raw ?? '기타'}</span>
        <span>마감 {fmtDate(job.deadline)}</span>
      </div>
    </Link>
  )
}

type PageProps = {
  searchParams: Promise<{ type?: string; cat?: string; exp?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { type, cat, exp } = await searchParams
  const activeType = (type as ContentType | undefined) ?? 'all'

  const jobs = await listJobs({
    contentType: activeType === 'all' ? undefined : activeType,
    category: cat,
    experience: exp,
  })

  // 현재 필터 유지하며 URL 빌드
  function buildUrl(params: { type?: string; cat?: string; exp?: string }) {
    const p = new URLSearchParams()
    const t = params.type ?? type
    const c = params.cat  ?? cat
    const e = params.exp  ?? exp
    if (t && t !== 'all') p.set('type', t)
    if (c && c !== 'all') p.set('cat', c)
    if (e && e !== 'all') p.set('exp', e)
    const s = p.toString()
    return s ? `/?${s}` : '/'
  }

  // 탭 전환 시 직군/경력 필터 초기화
  function typeUrl(slug: string) {
    if (slug === 'all') return '/'
    return `/?type=${slug}`
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold mb-1.5">기획·마케팅·PM 채용 보드</h1>
        <p className="text-[13px] text-[#6B6B6B]">
          다이몬 커리어가 큐레이션한 공고. 멘토가 직접 메모를 남긴 추천 공고도 확인하세요.
        </p>
      </div>

      {/* 콘텐츠 유형 탭 */}
      <div className="flex gap-1 mb-6 border-b border-[#E5E7EB]">
        {CONTENT_TYPES.map((ct) => (
          <Link
            key={ct.slug}
            href={typeUrl(ct.slug)}
            className={`px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
              activeType === ct.slug
                ? 'border-[#0052CC] text-[#0052CC]'
                : 'border-transparent text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            {ct.name}
          </Link>
        ))}
      </div>

      {/* 직군 필터 */}
      <div className="mb-4">
        <p className="text-[12px] text-[#6B7280] font-medium mb-2">직군</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildUrl({ cat: 'all', exp })}
            className={`filter-pill ${!cat ? 'active' : 'inactive'}`}
          >
            전체
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={buildUrl({ cat: c.slug, exp })}
              className={`filter-pill ${cat === c.slug ? 'active' : 'inactive'}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 경력 필터 — 부트캠프에서는 미표시 */}
      {activeType !== 'bootcamp' && (
        <div className="mb-6">
          <p className="text-[12px] text-[#6B7280] font-medium mb-2">경력</p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((e) => (
              <Link
                key={e.slug}
                href={buildUrl({ cat, exp: e.slug })}
                className={`filter-pill ${exp === e.slug || (!exp && e.slug === 'all') ? 'active' : 'inactive'}`}
              >
                {e.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="card p-12 text-center text-[#6B6B6B] text-sm">
          해당 조건의 공고가 아직 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#ABABAB] mt-8 text-center">
        총 {jobs.length}건 · 매일 갱신
      </p>
    </div>
  )
}
