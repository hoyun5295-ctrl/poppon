import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/actions/search
 * 
 * 검색 로그 기록 (fire-and-forget, 비로그인도 가능)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, session_id, user_id, category_slug, result_count } = body;

    if (!query) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('search_logs').insert({
      query,
      session_id: session_id || null,
      user_id: user_id || null,
      category_slug: category_slug || null,
      result_count: result_count ?? 0,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
