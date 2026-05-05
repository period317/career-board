/**
 * 목업 데이터 → Supabase 시드 스크립트
 * 사용법: npm run seed:mock
 * Supabase 연결 전 로컬 UI 확인 완료 후, 실제 DB에 샘플 데이터 넣을 때 사용
 */

import 'dotenv/config'
import { MOCK_JOBS } from '../src/lib/mock-jobs'
import { inferCategory, inferExperienceCategory } from '../src/lib/categories'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  console.log('🌱 목업 데이터 Supabase 시드 시작\n')

  const { data: cats } = await db.from('job_categories').select('*')
  const slugToId = new Map(
    (cats ?? []).map((c: { slug: string; id: number }) => [c.slug, c.id])
  )

  let inserted = 0
  for (const job of MOCK_JOBS) {
    const slug = inferCategory(job.title ?? '', job.category_raw)
    const category_id = slug ? (slugToId.get(slug) ?? null) : null
    const experience_category = inferExperienceCategory(job.experience_level ?? null)


    const { error } = await db.from('jobs').upsert(
      {
        source: job.source,
        source_id: String(job.id),
        url: job.url,
        company_name: job.company_name,
        title: job.title,
        category_id,
        category_raw: job.category_raw,
        experience_level: job.experience_level,
        experience_min: job.experience_min,
        experience_max: job.experience_max,
        experience_category,
        employment_type: job.employment_type,
        location: job.location,
        salary: job.salary,
        company_industry: job.company_industry,
        posted_at: job.posted_at,
        deadline: job.deadline,
        recommendation_note: job.recommendation_note,
        recommendation_tags: job.recommendation_tags,
        is_featured: job.is_featured,
        is_hidden: job.is_hidden,
      },
      { onConflict: 'source,source_id', ignoreDuplicates: false }
    )

    if (error) {
      console.error(`  ❌ ${job.title}: ${error.message}`)
    } else {
      inserted++
      console.log(`  ✅ ${job.company_name} — ${job.title}`)
    }
  }

  console.log(`\n완료: ${inserted}/${MOCK_JOBS.length}건 시드됨`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
