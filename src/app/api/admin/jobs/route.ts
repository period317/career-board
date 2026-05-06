import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { MOCK_JOBS } from '@/lib/mock-jobs'

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function requireAdmin() {
  const c = await cookies()
  return c.get('admin')?.value === '1'
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!HAS_SUPABASE) {
    return NextResponse.json(MOCK_JOBS)
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data } = await supabaseAdmin()
    .from('jobs')
    .select('*, category:job_categories(*)')
    .order('created_at', { ascending: false })
    .limit(500)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (!body.title || !body.company_name || !body.url) {
    return NextResponse.json(
      { error: 'title, company_name, url은 필수입니다' },
      { status: 400 }
    )
  }

  if (!HAS_SUPABASE) {
    return NextResponse.json({ ok: true, mock: true })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data, error } = await supabaseAdmin()
    .from('jobs')
    .insert({
      source: 'manual',
      source_id: `manual-${Date.now()}`,
      content_type: body.content_type ?? 'job',
      url: body.url,
      company_name: body.company_name,
      title: body.title,
      category_id: body.category_id ?? null,
      experience_level: body.experience_level ?? null,
      experience_category: body.experience_category ?? null,
      employment_type: body.employment_type ?? null,
      location: body.location ?? null,
      deadline: body.deadline ? new Date(body.deadline).toISOString() : null,
      recommendation_note: body.recommendation_note ?? null,
      recommendation_tags: body.recommendation_tags ?? null,
      selection_process: body.selection_process ?? null,
      is_featured: body.is_featured ?? false,
      is_hidden: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
