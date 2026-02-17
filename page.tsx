import { CategoryGrid } from '@/components/category/CategoryGrid';
import { DealShelf } from '@/components/deal/DealShelf';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toDealCard, DEAL_CARD_SELECT, filterActiveDeals } from '@/lib/deals';
import { Lightbulb, BellRing, ArrowRight } from 'lucide-react';
import type { DealCard } from '@/types';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const now = new Date().toISOString();
  const threeDaysLater = new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString();

  // 병렬로 4개 섹션 데이터 가져오기
  const [trendingRes, newRes, endingSoonRes, merchantCountRes, dealCountRes] = await Promise.all([
    filterActiveDeals(
      supabase.from('deals').select(DEAL_CARD_SELECT),
      now
    )
      .order('trending_score', { ascending: false })
      .order('quality_score', { ascending: false })
      .limit(24),

    filterActiveDeals(
      supabase.from('deals').select(DEAL_CARD_SELECT),
      now
    )
      .order('created_at', { ascending: false })
      .limit(24),

    supabase
      .from('deals')
      .select(DEAL_CARD_SELECT)
      .eq('status', 'active')
      .eq('is_evergreen', false)
      .not('ends_at', 'is', null)
      .gt('ends_at', now)
      .lt('ends_at', threeDaysLater)
      .order('ends_at', { ascending: true })
      .limit(24),

    // 머천트 수 카운트
    supabase
      .from('merchants')
      .select('id', { count: 'exact', head: true }),

    // 활성 딜 수 카운트
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  const trendingDeals = (trendingRes.data || []).map(toDealCard);
  const newDeals = (newRes.data || []).map(toDealCard);
  const endingSoonDeals = (endingSoonRes.data || []).map(toDealCard);
  const merchantCount = merchantCountRes.count || 0;
  const dealCount = dealCountRes.count || 0;

  // 10 단위 내림 (339 → 330+, 1995 → 1,990+)
  const displayMerchantCount = Math.floor(merchantCount / 10) * 10;
  const displayDealCount = Math.floor(dealCount / 10) * 10;

  function dedupeByMerchant(deals: DealCard[], maxPerMerchant = 1): DealCard[] {
    const count: Record<string, number> = {};
    return deals.filter((d) => {
      count[d.merchant_name] = (count[d.merchant_name] || 0) + 1;
      return count[d.merchant_name] <= maxPerMerchant;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 히어로 섹션 — 컴팩트 */}
      <section className="pt-6 pb-4 sm:pt-8 sm:pb-6 lg:pt-10 lg:pb-8 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight">
          한국의 <span className="text-primary-500">모든 할인</span>을{' '}
          <br className="sm:hidden" />
          한 곳에서
        </h1>
        <p className="mt-2 sm:mt-3 text-surface-500 text-xs sm:text-sm lg:text-base">
          {displayMerchantCount > 0 && displayDealCount > 0
            ? `${displayMerchantCount.toLocaleString()}개+ 브랜드, ${displayDealCount.toLocaleString()}개+ 딜의 할인 정보를 검색하세요`
            : '쿠폰, 프로모션 코드, 할인 이벤트를 검색하세요'}
        </p>
      </section>

      {/* 카테고리 그리드 */}
      <CategoryGrid />

      {/* 트렌딩 딜 */}
      <DealShelf
        title="지금 뜨는 딜"
        subtitle="인기 딜 모아보기"
        deals={dedupeByMerchant(trendingDeals)}
        viewAllHref="/search?sort=popular"
      />

      {/* 신규 딜 */}
      <DealShelf
        title="새로 올라온 딜"
        subtitle="최근 등록된 딜"
        deals={dedupeByMerchant(newDeals)}
        viewAllHref="/search?sort=new"
      />

      {/* 마감 임박 */}
      {endingSoonDeals.length > 0 && (
        <DealShelf
          title="마감 임박"
          subtitle="놓치면 아쉬운 딜"
          deals={dedupeByMerchant(endingSoonDeals)}
          viewAllHref="/search?sort=ending"
        />
      )}

      {/* CTA 배너 — 모던 */}
      <section className="mt-4 sm:mt-8 mb-8 sm:mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* 제보하기 */}
          <a
            href="/submit"
            className="group relative overflow-hidden rounded-2xl border border-surface-200 px-5 py-5 sm:px-6 sm:py-6 hover:border-surface-300 hover:shadow-sm transition-all bg-white"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center mb-3 group-hover:bg-surface-200 transition-colors">
                <Lightbulb className="w-5 h-5 text-surface-500" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-surface-900">
                찾는 딜이 없나요?
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-surface-500 leading-relaxed">
                알고 있는 할인 정보를 제보해주세요.
                <br className="hidden sm:block" />
                {' '}다른 사용자들에게도 도움이 됩니다!
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs sm:text-sm font-semibold text-surface-600 group-hover:text-surface-900 transition-colors">
                제보하기
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </a>

          {/* 구독 알림 */}
          <a
            href="/auth"
            className="group relative overflow-hidden rounded-2xl border border-primary-100 px-5 py-5 sm:px-6 sm:py-6 hover:border-primary-200 hover:shadow-sm transition-all bg-primary-50/40"
          >
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200/70 transition-colors">
                <BellRing className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-surface-900">
                새 딜 알림 받기
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-surface-500 leading-relaxed">
                관심 브랜드를 구독하면
                <br className="hidden sm:block" />
                {' '}새로운 할인이 올라올 때 바로 알려드려요.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs sm:text-sm font-semibold text-primary-500 group-hover:text-primary-600 transition-colors">
                가입하고 구독하기
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
