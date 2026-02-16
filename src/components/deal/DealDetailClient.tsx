'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DealDetail } from './DealDetail';

const DEAL_DETAIL_SELECT = `
  *,
  merchants (name, slug, logo_url, brand_color),
  categories!deals_category_id_fkey (name, slug)
`;

// ✅ 메모리 캐시 — 같은 딜 재요청 방지 (모달 리마운트 시 즉시 표시)
const dealCache = new Map<string, any>();

interface DealDetailClientProps {
  slug: string;
  isModal?: boolean;
}

export function DealDetailClient({ slug, isModal = false }: DealDetailClientProps) {
  const decodedSlug = decodeURIComponent(slug);
  const cached = dealCache.get(decodedSlug);

  const [deal, setDeal] = useState<any>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);

  // 중복 fetch 방지
  const fetchedRef = useRef(false);

  useEffect(() => {
    // 캐시 히트면 스킵
    if (cached) {
      setDeal(cached);
      setLoading(false);
      return;
    }

    // 이미 fetch 했으면 스킵
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let mounted = true;

    const fetchDeal = async () => {
      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('deals')
          .select(DEAL_DETAIL_SELECT)
          .eq('slug', decodedSlug)
          .in('status', ['active', 'expired'])
          .single();

        if (!mounted) return;

        if (fetchError || !data) {
          setError(true);
        } else {
          dealCache.set(decodedSlug, data);
          setDeal(data);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDeal();

    return () => { mounted = false; };
  }, [decodedSlug, cached]);

  if (loading) return <DealDetailSkeleton />;

  if (error || !deal) {
    return (
      <div className="py-12 text-center">
        <p className="text-surface-400 text-sm">딜을 찾을 수 없습니다</p>
      </div>
    );
  }

  return <DealDetail deal={deal} isModal={isModal} />;
}

function DealDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 브랜드 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-surface-100" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 bg-surface-100 rounded" />
          <div className="h-3 w-16 bg-surface-100 rounded" />
        </div>
      </div>

      {/* 제목 */}
      <div className="h-5 w-full bg-surface-100 rounded mb-1.5" />
      <div className="h-5 w-3/4 bg-surface-100 rounded mb-3" />

      {/* 혜택 요약 */}
      <div className="h-5 w-40 bg-surface-100 rounded mb-3" />

      {/* 기간 */}
      <div className="h-4 w-48 bg-surface-100 rounded mb-4" />

      {/* 쿠폰 코드 영역 */}
      <div className="h-12 w-full bg-surface-50 border-2 border-dashed border-surface-200 rounded-lg mb-3" />

      {/* CTA 버튼 */}
      <div className="h-12 w-full bg-surface-100 rounded-xl" />
    </div>
  );
}
