import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/recordings — list authenticated user's recordings
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const status = searchParams.get('status') // filter by status

    let query = supabase
      .from('recordings')
      .select(
        `
        *,
        feedback_reports (
          id,
          overall_score,
          estimated_level,
          created_at
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      recordings: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    })
  } catch (err) {
    console.error('GET /api/recordings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
