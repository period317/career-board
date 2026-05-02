// Supabase 환경변수가 없을 때 mock 데이터로 폴백하는 헬퍼
// (개발 초기 + API 키 미발급 상태에서 UI 확인 용도)

import { MOCK_JOBS } from './mock-jobs'
import type { Job } from './types'
import { inferCategory } from './categories'

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export type JobListOptions = {
  category?: string  // slug
  featured?: boolean
  limit?: number
}

// Mock 데이터에 inferred category slug 부여
function withInferredCategory(job: Partial<Job>): Partial<Job> & { _slug?: string | null } {
  return {
    ...job,
    _slug: inferCategory(job.title ?? '', job.category_raw),
  }
}

export async function listJobs(opts: JobListOptions = {}): Promise<Job[]> {
  if (!HAS_SUPABASE) {
    let items = MOCK_JOBS.map(withInferredCategory)
    if (opts.category) items = items.filter((j) => j._slug === opts.category)
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
