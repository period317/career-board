/**
 * 사람인 API 수동 수집 스크립트
 * 사용법: npm run fetch:jobs
 * 필요: .env.local 에 SARAMIN_ACCESS_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import { fetchSaramin, mapSaraminToJob } from '../src/lib/saramin'
import { SARAMIN_KEYWORDS, inferCategory, inferExperienceCategory, CATEGORIES } from '../src/lib/categories'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  console.log('🚀 사람인 채용공고 수집 시작\n')

  const { data: cats, error: catErr } = await db.from('job_categories').select('*')
  if (catErr) {
    console.error('job_categories 조회 실패:', catErr.message)
    process.exit(1)
  }
  const slugToId = new Map(
    (cats ?? []).map((c: { slug: string; id: number }) => [c.slug, c.id])
  )

  let totalFetched = 0
  let totalInserted = 0
  const errors: string[] = []

  for (const cat of CATEGORIES) {
    const keywords = SARAMIN_KEYWORDS[cat.slug]
    for (const kw of keywords) {
      process.stdout.write(`  [${cat.name}] "${kw}" ... `)
      try {
        const jobs = await fetchSaramin({ keywords: kw, count: 50 })
        totalFetched += jobs.length

        let inserted = 0
        for (const sj of jobs) {
          const mapped = mapSaraminToJob(sj)
          const slug = inferCategory(mapped.title, mapped.category_raw)
          const category_id = slug ? (slugToId.get(slug) ?? null) : null
          const experience_category = inferExperienceCategory(mapped.experience_level ?? null)

          const { error } = await db
            .from('jobs')
            .upsert(
              { ...mapped, category_id, experience_category },
              { onConflict: 'source,source_id', ignoreDuplicates: true }
            )
          if (!error) inserted++
        }
        totalInserted += inserted
        console.log(`${jobs.length}개 수집, ${inserted}개 저장`)
      } catch (e) {
        const msg = (e as Error).message
        errors.push(`${cat.slug}/${kw}: ${msg}`)
        console.log(`❌ ${msg}`)
      }

      // Rate limit 방지
      await new Promise((r) => setTimeout(r, 120))
    }
  }

  await db.from('fetch_logs').insert({
    source: 'saramin',
    status: errors.length ? 'error' : 'success',
    fetched_count: totalFetched,
    inserted_count: totalInserted,
    error_message: errors.length ? errors.join(' | ') : null,
  })

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`총 수집: ${totalFetched}건 / 저장(신규): ${totalInserted}건`)
  if (errors.length) {
    console.log(`에러 ${errors.length}건:`)
    errors.forEach((e) => console.log(`  • ${e}`))
  } else {
    console.log('✅ 완료')
  }
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
