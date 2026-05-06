import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const HAS_SUPABASE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function requireAdmin() {
  const c = await cookies()
  return c.get('admin')?.value === '1'
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const patch = await req.json()

  if (!HAS_SUPABASE) {
    return NextResponse.json({ ok: true, mock: true })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { error } = await supabaseAdmin()
    .from('jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params

  if (!HAS_SUPABASE) {
    return NextResponse.json({ ok: true, mock: true })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')
  const { error } = await supabaseAdmin()
    .from('jobs')
    .delete()
    .eq('id', parseInt(id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
