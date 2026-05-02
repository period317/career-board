import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJob } from '@/lib/jobs-store'

export const dynamic = 'force-dynamic'

function fmtDeadline(d: string | null): string {
  if (!d) return '상시채용'
  const date = new Date(d)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

type Props = { params: Promise<{ id: string }> }

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const job = await getJob(parseInt(id))
  if (!job) notFound()

  const days = daysUntil(job.deadline)

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/" className="text-[12px] text-[#6B6B6B] hover:text-black inline-block mb-5">
        ← 전체 공고로
      </Link>

      <div className="card p-7 mb-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {job.is_featured && <span className="tag featured">추천</span>}
          {job.recommendation_tags?.map((t) => (
            <span key={t} className="tag recommend">{t}</span>
          ))}
        </div>

        <h1 className="text-[22px] font-bold leading-snug mb-2">{job.title}</h1>
        <p className="text-[15px] text-[#333] mb-1">{job.company_name}</p>
        <p className="text-[12px] text-[#ABABAB]">
          {job.company_industry ?? '—'}
          {job.company_size && ` · ${job.company_size}`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0F0EE]">
          <div>
            <p className="text-[11px] text-[#ABABAB] mb-1">경력</p>
            <p className="text-[13px] font-medium">{job.experience_level ?? '무관'}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#ABABAB] mb-1">고용형태</p>
            <p className="text-[13px] font-medium">{job.employment_type ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#ABABAB] mb-1">근무지</p>
            <p className="text-[13px] font-medium">{job.location ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#ABABAB] mb-1">마감</p>
            <p className="text-[13px] font-medium">
              {fmtDeadline(job.deadline)}
              {days !== null && days >= 0 && (
                <span className="text-[11px] text-[#B91C1C] ml-1.5">D-{days}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {job.recommendation_note && (
        <div className="card p-6 mb-5 border-2 border-[#FDE68A] bg-[#FFFBEB]">
          <p className="section-title text-[#92400E]">멘토 추천 메모</p>
          <p className="prose-jd text-[#78350F]">{job.recommendation_note}</p>
        </div>
      )}

      {job.jd_text && (
        <div className="card p-6 mb-5">
          <p className="section-title">주요 업무 (JD)</p>
          <div className="prose-jd">{job.jd_text}</div>
        </div>
      )}

      {job.requirements && (
        <div className="card p-6 mb-5">
          <p className="section-title">자격요건</p>
          <div className="prose-jd">{job.requirements}</div>
        </div>
      )}

      {job.preferred && (
        <div className="card p-6 mb-5">
          <p className="section-title">우대사항</p>
          <div className="prose-jd">{job.preferred}</div>
        </div>
      )}

      {job.selection_process && (
        <div className="card p-6 mb-5">
          <p className="section-title">전형 단계</p>
          <div className="prose-jd">{job.selection_process}</div>
        </div>
      )}

      <div className="flex gap-3 mt-7">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block"
        >
          원본 공고 보기 →
        </a>
        <Link href="/" className="btn-secondary inline-block">
          목록으로
        </Link>
      </div>

      <p className="text-[11px] text-[#ABABAB] mt-6 text-center">
        출처: {job.source} · 등록 {new Date(job.created_at).toLocaleDateString('ko-KR')}
      </p>
    </div>
  )
}
