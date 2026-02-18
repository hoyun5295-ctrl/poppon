import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';

// 허용된 액션 타입
const VALID_ACTIONS = ['view', 'click_out', 'copy_code', 'save', 'share'] as const;

// 중복 방지: 같은 세션 + 같은 딜 + 같은 액션은 5분 내 1회만
const DEDUP_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_id, action_type, session_id } = body;

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

    // UUID 형식 간단 체크
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(deal_id)) {
      return NextResponse.json(
        { error: '유효하지 않은 deal_id' },
        { status: 400 }
      );
    }

    // ✅ user_id: 서버 쿠키 세션에서만 추출 (클라이언트 값 무시)
    let userId: string | null = null;
    try {
      const authClient = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      userId = user?.id || null;

      // 🔍 디버그 (원인 확인 후 제거)
      console.error(`[Actions] userId: ${userId}, authError: ${authError?.message || 'none'}, action: ${action_type}`);
    } catch (e: any) {
      console.error(`[Actions] auth exception: ${e?.message || e}`);
      // 세션 없으면 null — 비로그인 트래킹
    }

    // ✅ Service client 사용 (RLS 우회 — 비로그인도 insert 가능)
    const supabase = await createServiceClient();

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
      user_id: userId,
    });

    if (error) {
      console.error('[Actions] Insert error:', error.message, '| userId:', userId);
      return NextResponse.json(
        { error: '로깅 실패' },
        { status: 500 }
      );
    }

    // 카운트 증가 (fire-and-forget)
    if (action_type === 'view') {
      supabase
        .rpc('increment_view_count', { deal_id_input: deal_id })
        .then(() => {}, () => {});
    } else if (action_type === 'click_out') {
      supabase
        .rpc('increment_click_out_count', { deal_id_input: deal_id })
        .then(() => {}, () => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Actions] Parse error:', err);
    return NextResponse.json(
      { error: '잘못된 요청' },
      { status: 400 }
    );
  }
}
