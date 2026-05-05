// 원티드 + 링커리어 스크래퍼 Cron
// vercel.json 에서 schedule: "0 1 * * *" (KST 10:00 — fetch-jobs 이후 1시간)

import { NextResponse } from 'next/server'
import { fetchWanted, mapWantedToJob, isRelevantJob, WANTED_CATEGORIES } from '@/lib/scrapers/wanted'
import { fetchLinkareerInterns, mapLinkareerToJob } from '@/lib/scrapers/linkareer'
import { inferCategory, type CategorySlug } from '@/lib/categories'

export async function GET(req: Request) {
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
    wanted:     { fetched: 0, inserted: 0, errors: [] as string[] },
    linkareer:  { fetched: 0, inserted: 0, errors: [] as string[] },
  }

  // ── 원티드 수집 ──────────────────────────────────────────
  for (const cat of WANTED_CATEGORIES) {
    try {
      const jobs = await fetchWanted({ job_category_id: cat.id, limit: 100 })
      result.wanted.fetched += jobs.length

      for (const wj of jobs) {
        const mapped = mapWantedToJob(wj)
        // 영업/개발/디자인 등 무관 포지션 제외
        if (!isRelevantJob(mapped.title)) continue
        // 원티드 카테고리 ID로 직접 매핑
        const slug = cat.slug as CategorySlug
        const category_id = slugToId.get(slug) ?? null

        const { error } = await db.from('jobs').upsert(
          { ...mapped, category_id },
          { onConflict: 'source,source_id', ignoreDuplicates: true }
        )
        if (!error) result.wanted.inserted++
      }
    } catch (e) {
      result.wanted.errors.push(`wanted/${cat.name}: ${(e as Error).message}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  // ── 링커리어 인턴 수집 ───────────────────────────────────
  for (let page = 1; page <= 3; page++) {
    try {
      const interns = await fetchLinkareerInterns(page)
      if (interns.length === 0) break
      result.linkareer.fetched += interns.length

      for (const li of interns) {
        const mapped = mapLinkareerToJob(li)
        const slug = inferCategory(mapped.title, null)
        const category_id = slug ? slugToId.get(slug) ?? null : null

        const { error } = await db.from('jobs').upsert(
          { ...mapped, category_id },
          { onConflict: 'source,source_id', ignoreDuplicates: true }
        )
        if (!error) result.linkareer.inserted++
      }
    } catch (e) {
      result.linkareer.errors.push(`linkareer/page${page}: ${(e as Error).message}`)
      break
    }
    await new Promise((r) => setTimeout(r, 500))
  }

  // 로그 저장
  const allErrors = [...result.wanted.errors, ...result.linkareer.errors]
  await db.from('fetch_logs').insert({
    source: 'wanted+linkareer',
    status: allErrors.length ? 'error' : 'success',
    fetched_count: result.wanted.fetched + result.linkareer.fetched,
    inserted_count: result.wanted.inserted + result.linkareer.inserted,
    error_message: allErrors.length ? allErrors.join(' | ') : null,
  })

  return NextResponse.json({
    ok: true,
    wanted: result.wanted,
    linkareer: result.linkareer,
  })
}
