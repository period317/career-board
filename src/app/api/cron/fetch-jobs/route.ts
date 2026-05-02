// Vercel Cron이 매일 호출 — 사람인 API에서 신규 공고 수집
// vercel.json 에서 schedule 설정

import { NextResponse } from 'next/server'
import { fetchSaramin, mapSaraminToJob } from '@/lib/saramin'
import { SARAMIN_KEYWORDS, inferCategory, CATEGORIES } from '@/lib/categories'

export async function GET(req: Request) {
  // Cron 보호
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!process.env.SARAMIN_ACCESS_KEY) {
    return NextResponse.json(
      { error: '사람인 API 키 미설정 — .env.local 또는 Vercel 환경변수에 SARAMIN_ACCESS_KEY 추가 필요' },
      { status: 500 }
    )
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const db = supabaseAdmin()

  // 카테고리 slug → id 매핑
  const { data: cats } = await db.from('job_categories').select('*')
  const slugToId = new Map(
    (cats ?? []).map((c: { slug: string; id: number }) => [c.slug, c.id])
  )

  let totalFetched = 0
  let totalInserted = 0
  const errors: string[] = []

  for (const cat of CATEGORIES) {
    const keywords = SARAMIN_KEYWORDS[cat.slug]
    for (const kw of keywords) {
      try {
        const jobs = await fetchSaramin({ keywords: kw, count: 50 })
        totalFetched += jobs.length

        for (const sj of jobs) {
          const mapped = mapSaraminToJob(sj)
          const slug = inferCategory(mapped.title, mapped.category_raw)
          const category_id = slug ? slugToId.get(slug) ?? null : null

          const { error } = await db
            .from('jobs')
            .upsert(
              { ...mapped, category_id },
              { onConflict: 'source,source_id', ignoreDuplicates: true }
            )
          if (!error) totalInserted++
        }
      } catch (e) {
        errors.push(`${cat.slug}/${kw}: ${(e as Error).message}`)
      }
    }
  }

  await db.from('fetch_logs').insert({
    source: 'saramin',
    status: errors.length ? 'error' : 'success',
    fetched_count: totalFetched,
    inserted_count: totalInserted,
    error_message: errors.length ? errors.join(' | ') : null,
  })

  return NextResponse.json({
    ok: true,
    fetched: totalFetched,
    inserted: totalInserted,
    errors,
  })
}
