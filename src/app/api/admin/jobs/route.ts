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
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return NextResponse.json(data ?? [])
}
