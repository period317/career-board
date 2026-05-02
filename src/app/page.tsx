import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'
import { listJobs } from '@/lib/jobs-store'
import type { Job } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

function JobCard({ job }: { job: Job }) {
  const days = daysUntil(job.deadline)
  const deadlineSoon = days !== null && days <= 7 && days >= 0
  const expDisplay = job.experience_level || '경력 무관'

  return (
    <Link href={`/jobs/${job.id}`} className="job-card block p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {job.is_featured && <span className="tag featured">추천</span>}
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
  searchParams: Promise<{ cat?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { cat } = await searchParams
  const jobs = await listJobs({ category: cat })

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-bold mb-1.5">기획·마케팅·PM 채용 보드</h1>
        <p className="text-[13px] text-[#6B6B6B]">
          다이몬 커리어가 큐레이션한 공고. 멘토가 직접 메모를 남긴 추천 공고도 확인하세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/"
          className={`filter-pill ${!cat ? 'active' : 'inactive'}`}
        >
          전체
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/?cat=${c.slug}`}
            className={`filter-pill ${cat === c.slug ? 'active' : 'inactive'}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="card p-12 text-center text-[#6B6B6B] text-sm">
          해당 직군 공고가 아직 없습니다.
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
