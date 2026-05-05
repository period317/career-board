// Supabase 환경변수가 없을 때 mock 데이터로 폴백하는 헬퍼
// (개발 초기 + API 키 미발급 상태에서 UI 확인 용도)

import { MOCK_JOBS } from './mock-jobs'
import type { Job } from './types'
import { inferCategory, inferExperienceCategory } from './categories'

export type ExperienceCategory = 'newbie' | 'junior' | 'senior'

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export type JobListOptions = {
  category?: string     // slug
  experience?: string   // 'newbie' | 'junior' | 'senior' | 'all'
  contentType?: string  // 'job' | 'intern' | 'bootcamp'
  featured?: boolean
  limit?: number
}

// Mock 데이터에 inferred category slug + experience category 부여
function withInferredCategory(job: Partial<Job>): Partial<Job> & { _slug?: string | null; _expCategory?: 'newbie' | 'junior' | 'senior' | null } {
  return {
    ...job,
    _slug: inferCategory(job.title ?? '', job.category_raw),
    _expCategory: inferExperienceCategory(job.experience_level ?? null),
  }
}

export async function listJobs(opts: JobListOptions = {}): Promise<Job[]> {
  if (!HAS_SUPABASE) {
    let items = MOCK_JOBS.map(withInferredCategory)
    if (opts.contentType && opts.contentType !== 'all') items = items.filter((j) => j.content_type === opts.contentType)
    if (opts.category && opts.category !== 'all') items = items.filter((j) => j._slug === opts.category)
    if (opts.experience && opts.experience !== 'all') items = items.filter((j) => j._expCategory === opts.experience)
    if (opts.featured) items = items.filter((j) => j.is_featured)
    if (opts.limit) items = items.slice(0, opts.limit)
    // sort by featured + recent
    items.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
      return (b.posted_at ?? '').localeCompare(a.posted_at ?? '')
    })
    return items as Job[]
  }

  const { supabase } = await import('./supabase')
  let q = supabase
    .from('jobs')
    .select('*, category:job_categories(*)')
    .eq('is_hidden', false)
    .order('is_featured', { ascending: false })
    .order('posted_at', { ascending: false })

  if (opts.category) {
    const { data: cat } = await supabase
      .from('job_categories')
      .select('id')
      .eq('slug', opts.category)
      .single()
    if (cat) q = q.eq('category_id', (cat as { id: number }).id)
  }
  if (opts.contentType && opts.contentType !== 'all') {
    q = q.eq('content_type', opts.contentType)
  }
  if (opts.experience && opts.experience !== 'all') {
    q = q.eq('experience_category', opts.experience)
  }
  if (opts.featured) q = q.eq('is_featured', true)
  if (opts.limit) q = q.limit(opts.limit)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Job[]
}

export async function getJob(id: number): Promise<Job | null> {
  if (!HAS_SUPABASE) {
    const j = MOCK_JOBS.find((x) => x.id === id)
    return j ? (withInferredCategory(j) as Job) : null
  }

  const { supabase } = await import('./supabase')
  const { data, error } = await supabase
    .from('jobs')
    .select('*, category:job_categories(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Job
}
