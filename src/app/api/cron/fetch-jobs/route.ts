// Vercel Cron이 매일 호출 — 사람인 + 워크넷에서 신규 공고 수집
// vercel.json 에서 schedule: "0 0 * * *" (KST 09:00)

import { NextResponse } from 'next/server'
import { fetchSaramin, mapSaraminToJob } from '@/lib/saramin'
import { fetchWorknet, mapWorknetToJob, WORKNET_KEYWORDS, WORKNET_INTERN_KEYWORDS } from '@/lib/worknet'
import { SARAMIN_KEYWORDS, inferCategory, inferExperienceCategory, CATEGORIES } from '@/lib/categories'

export async function GET(req: Request) {
  // Cron 보호 (Vercel이 자동으로 CRON_SECRET 헤더를 붙임)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const db = supabaseAdmin()

  // 카테고리 slug → id 매핑
  const { data: cats } = await db.from('job_categories').select('*')
  const slugToId = new Map(
    (cats ?? []).map((c: { slug: string; id: number }) => [c.slug, c.id])
  )

  const result = {
    saramin: { fetched: 0, inserted: 0, errors: [] as string[] },
    worknet: { fetched: 0, inserted: 0, errors: [] as string[] },
  }

  // ── 사람인 수집 ─────────────────────────────────────────
  if (process.env.SARAMIN_ACCESS_KEY) {
    for (const cat of CATEGORIES) {
      const keywords = SARAMIN_KEYWORDS[cat.slug]
      for (const kw of keywords) {
        try {
          const jobs = await fetchSaramin({ keywords: kw, count: 50 })
          result.saramin.fetched += jobs.length

          for (const sj of jobs) {
            const mapped = mapSaraminToJob(sj)
            const slug = inferCategory(mapped.title, mapped.category_raw)
            const category_id = slug ? slugToId.get(slug) ?? null : null
            const experience_category = inferExperienceCategory(mapped.experience_level ?? null)

            const { error } = await db.from('jobs').upsert(
              { ...mapped, content_type: 'job', category_id, experience_category },
              { onConflict: 'source,source_id', ignoreDuplicates: true }
            )
            if (!error) result.saramin.inserted++
          }
        } catch (e) {
          result.saramin.errors.push(`${cat.slug}/${kw}: ${(e as Error).message}`)
        }
        await new Promise((r) => setTimeout(r, 120))
      }
    }
  }

  // ── 워크넷 수집 — 정규직 채용 ───────────────────────────
  if (process.env.WORKNET_API_KEY) {
    for (const kw of WORKNET_KEYWORDS) {
      try {
        const jobs = await fetchWorknet({ keyword: kw, display: 100 })
        result.worknet.fetched += jobs.length

        for (const wj of jobs) {
          const mapped = mapWorknetToJob(wj)
          const slug = inferCategory(mapped.title, mapped.category_raw)
          const category_id = slug ? slugToId.get(slug) ?? null : null
          const experience_category = inferExperienceCategory(mapped.experience_level ?? null)

          const { error } = await db.from('jobs').upsert(
            { ...mapped, category_id, experience_category },
            { onConflict: 'source,source_id', ignoreDuplicates: true }
          )
          if (!error) result.worknet.inserted++
        }
      } catch (e) {
        result.worknet.errors.push(`job/${kw}: ${(e as Error).message}`)
      }
      await new Promise((r) => setTimeout(r, 120))
    }

    // ── 워크넷 — 인턴십 ─────────────────────────────────
    for (const kw of WORKNET_INTERN_KEYWORDS) {
      try {
        const jobs = await fetchWorknet({ keyword: kw, empTp: '3', display: 100 }) // empTp 3 = 인턴
        result.worknet.fetched += jobs.length

        for (const wj of jobs) {
          const mapped = mapWorknetToJob(wj)
          // 인턴 키워드로 가져온 건 무조건 intern
          const slug = inferCategory(mapped.title, mapped.category_raw)
          const category_id = slug ? slugToId.get(slug) ?? null : null
          const experience_category = inferExperienceCategory(mapped.experience_level ?? null)

          const { error } = await db.from('jobs').upsert(
            { ...mapped, content_type: 'intern', category_id, experience_category },
            { onConflict: 'source,source_id', ignoreDuplicates: true }
          )
          if (!error) result.worknet.inserted++
        }
      } catch (e) {
        result.worknet.errors.push(`intern/${kw}: ${(e as Error).message}`)
      }
      await new Promise((r) => setTimeout(r, 120))
    }
  }

  // ── 수집 로그 저장 ───────────────────────────────────────
  const allErrors = [...result.saramin.errors, ...result.worknet.errors]
  await db.from('fetch_logs').insert({
    source: 'saramin+worknet',
    status: allErrors.length ? 'error' : 'success',
    fetched_count: result.saramin.fetched + result.worknet.fetched,
    inserted_count: result.saramin.inserted + result.worknet.inserted,
    error_message: allErrors.length ? allErrors.join(' | ') : null,
  })

  return NextResponse.json({
    ok: true,
    saramin: result.saramin,
    worknet: result.worknet,
  })
}
