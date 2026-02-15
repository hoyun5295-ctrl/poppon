import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// 허용된 액션 타입
const VALID_ACTIONS = ['view', 'click_out', 'copy_code', 'save', 'share'] as const;

// 중복 방지: 같은 세션 + 같은 딜 + 같은 액션은 5분 내 1회만
const DEDUP_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_id, action_type, session_id, metadata } = body;

    // 유효성 검증
    if (!deal_id || !action_type || !session_id) {
      return NextResponse.json(
        { error: 'deal_id, action_type, session_id 필수' },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action_type)) {
      return NextResponse.json(
        { error: `유효하지 않은 action_type: ${action_type}` },
        { status: 400 }
      );
    }

    // UUID 형식 간단 체크 (deal_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deal_id)) {
      return NextResponse.json(
        { error: '유효하지 않은 deal_id' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // view 액션은 중복 방지 (5분 내 같은 세션+딜)
    if (action_type === 'view') {
      const cutoff = new Date(Date.now() - DEDUP_MINUTES * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from('deal_actions')
        .select('id')
        .eq('deal_id', deal_id)
        .eq('session_id', session_id)
        .eq('action_type', 'view')
        .gte('created_at', cutoff)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ ok: true, dedup: true });
      }
    }

    // deal_actions INSERT
    const { error } = await supabase.from('deal_actions').insert({
      deal_id,
      action_type,
      session_id,
      user_id: null, // 추후 인증 구현 시 auth.uid() 연동
    });

    if (error) {
      console.error('[Actions API] Insert error:', error.message);
      return NextResponse.json(
        { error: '로깅 실패' },
        { status: 500 }
      );
    }

    // view 액션이면 view_count도 증가 (fire-and-forget)
    if (action_type === 'view') {
      supabase
        .rpc('increment_view_count', { deal_id_input: deal_id })
        .then(() => {}, () => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Actions API] Parse error:', err);
    return NextResponse.json(
      { error: '잘못된 요청' },
      { status: 400 }
    );
  }
}
