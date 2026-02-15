import { SearchBar } from '@/components/search/SearchBar';
import { CategoryGrid } from '@/components/category/CategoryGrid';
import { DealShelf } from '@/components/deal/DealShelf';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toDealCard, DEAL_CARD_SELECT, filterActiveDeals } from '@/lib/deals';
import type { DealCard } from '@/types';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const now = new Date().toISOString();
  const threeDaysLater = new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString();

  // 병렬로 3개 섹션 데이터 가져오기
  // filterActiveDeals: status='active' AND (ends_at IS NULL OR ends_at > now)
  // limit 24: 브랜드당 1개 중복제거 후에도 12개 이상 확보
  const [trendingRes, newRes, endingSoonRes] = await Promise.all([
    // 🔥 트렌딩: quality_score + trending_score 높은 순
    filterActiveDeals(
      supabase.from('deals').select(DEAL_CARD_SELECT),
      now
    )
      .order('trending_score', { ascending: false })
      .order('quality_score', { ascending: false })
      .limit(24),

    // ✨ 신규: 최근 등록순
    filterActiveDeals(
      supabase.from('deals').select(DEAL_CARD_SELECT),
      now
    )
      .order('created_at', { ascending: false })
      .limit(24),

    // ⏰ 마감임박: ends_at이 3일 이내 + 가까운 순
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
  ]);

  const trendingDeals = (trendingRes.data || []).map(toDealCard);
  const newDeals = (newRes.data || []).map(toDealCard);
  const endingSoonDeals = (endingSoonRes.data || []).map(toDealCard);

  // 브랜드 중복 제거: 브랜드당 1개만 → 다양한 브랜드 노출
  function dedupeByMerchant(deals: DealCard[], maxPerMerchant = 1): DealCard[] {
    const count: Record<string, number> = {};
    return deals.filter((d) => {
      count[d.merchant_name] = (count[d.merchant_name] || 0) + 1;
      return count[d.merchant_name] <= maxPerMerchant;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 히어로 섹션 — 모바일 컴팩트 */}
      <section className="py-8 sm:py-12 lg:py-16 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight">
          한국의 <span className="text-primary-500">모든 할인</span>을{' '}
          <br className="sm:hidden" />
          한 곳에서
        </h1>
        <p className="mt-2 sm:mt-3 text-surface-500 text-xs sm:text-sm lg:text-base">
          쿠폰, 프로모션 코드, 할인 이벤트를 검색하세요
        </p>
        <div className="mt-4 sm:mt-6 max-w-lg mx-auto">
          <SearchBar />
        </div>
      </section>

      {/* 카테고리 그리드 */}
      <CategoryGrid />

      {/* 🔥 트렌딩 딜 */}
      <DealShelf
        title="🔥 지금 뜨는 딜"
        subtitle="인기 딜 모아보기"
        deals={dedupeByMerchant(trendingDeals)}
        viewAllHref="/search?sort=popular"
      />

      {/* ✨ 신규 딜 */}
      <DealShelf
        title="✨ 새로 올라온 딜"
        subtitle="최근 등록된 딜"
        deals={dedupeByMerchant(newDeals)}
        viewAllHref="/search?sort=new"
      />

      {/* ⏰ 마감 임박 */}
      {endingSoonDeals.length > 0 && (
        <DealShelf
          title="⏰ 마감 임박"
          subtitle="놓치면 아쉬운 딜"
          deals={dedupeByMerchant(endingSoonDeals)}
          viewAllHref="/search?sort=ending"
        />
      )}

      {/* 💡 CTA 배너 */}
      <section className="mt-4 sm:mt-8 mb-8 sm:mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* 제보하기 */}
          <a
            href="/submit"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 border border-surface-200 px-5 py-5 sm:px-6 sm:py-6 hover:border-primary-200 hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <span className="text-2xl sm:text-3xl">💡</span>
              <h3 className="mt-2 text-base sm:text-lg font-bold text-surface-900">
                찾는 딜이 없나요?
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-surface-500">
                알고 있는 할인 정보를 제보해주세요.
                <br className="hidden sm:block" />
                {' '}다른 사용자들에게도 도움이 됩니다!
              </p>
              <span className="inline-flex items-center mt-3 text-xs sm:text-sm font-semibold text-primary-500 group-hover:text-primary-600 transition-colors">
                제보하기 →
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/5 rounded-full blur-xl group-hover:bg-primary-500/10 transition-colors" />
          </a>

          {/* 구독 알림 */}
          <a
            href="/auth"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 to-rose-50 border border-primary-100 px-5 py-5 sm:px-6 sm:py-6 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="relative z-10">
              <span className="text-2xl sm:text-3xl">🔔</span>
              <h3 className="mt-2 text-base sm:text-lg font-bold text-surface-900">
                새 딜 알림 받기
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-surface-500">
                관심 브랜드를 구독하면
                <br className="hidden sm:block" />
                {' '}새로운 할인이 올라올 때 바로 알려드려요.
              </p>
              <span className="inline-flex items-center mt-3 text-xs sm:text-sm font-semibold text-primary-500 group-hover:text-primary-600 transition-colors">
                가입하고 구독하기 →
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors" />
          </a>
        </div>
      </section>
    </div>
  );
}
