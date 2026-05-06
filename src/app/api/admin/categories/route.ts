import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const c = await cookies()
  return c.get('admin')?.value === '1'
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const HAS_SUPABASE = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (!HAS_SUPABASE) {
    return NextResponse.json([
      { id: 1, slug: 'planning',  name: '서비스기획/UX' },
      { id: 2, slug: 'pm-po',     name: 'PM/PO' },
      { id: 3, slug: 'marketing', name: '마케팅' },
      { id: 4, slug: 'biz-dev',   name: '사업기획' },
      { id: 5, slug: 'ops',       name: '운영기획' },
    ])
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data } = await supabaseAdmin()
    .from('job_categories')
    .select('id, slug, name')
    .order('sort_order')
  return NextResponse.json(data ?? [])
}
