import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toDealCard, DEAL_CARD_SELECT, filterActiveDeals } from '@/lib/deals';
import { DealGrid } from '@/components/deal/DealGrid';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SortDropdown } from '@/components/common/SortDropdown';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/search/SearchInput';
import { MobileFilterSheet } from '@/components/search/MobileFilterSheet';
import { APP_NAME } from '@/lib/constants';

const DEALS_PER_PAGE = 24;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    benefit_tag?: string;
    channel?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `"${q}" 검색 결과` : '딜 검색';

  return {
    title,
    description: `${q ? `${q} 관련 ` : ''}할인, 쿠폰, 프로모션을 검색하세요`,
    openGraph: { title: `${title} | ${APP_NAME}` },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    q = '',
    category = '',
    benefit_tag = '',
    channel = '',
    sort = 'popular',
    page = '1',
  } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * DEALS_PER_PAGE;
  const now = new Date().toISOString();

  // 1. 카테고리 목록 + 실제 active 딜 수 집계
  const [categoriesRes, dealCountsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .eq('depth', 0)
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('deals')
      .select('category_id')
      .eq('status', 'active'),
  ]);

  const categoriesRaw = categoriesRes.data || [];

  // category_id별 실제 딜 수 집계
  const countMap: Record<string, number> = {};
  (dealCountsRes.data || []).forEach((d) => {
    if (d.category_id) {
      countMap[d.category_id] = (countMap[d.category_id] || 0) + 1;
    }
  });

  const categoryFilters = categoriesRaw.map((c) => ({
    value: c.slug,
    label: c.name,
    count: countMap[c.id] || 0,
  }));

  // 2. 혜택 태그 필터
  const benefitTagFilters = [
    { value: 'percent_off', label: '% 할인' },
    { value: 'amount_off', label: '원 할인' },
    { value: 'bogo', label: '1+1' },
    { value: 'free_shipping', label: '무료배송' },
    { value: 'gift_with_purchase', label: '사은품' },
    { value: 'new_user', label: '신규회원' },
    { value: 'app_only', label: '앱전용' },
  ];

  // 3. 딜 검색 쿼리 빌드
  let query = filterActiveDeals(
    supabase.from('deals').select(DEAL_CARD_SELECT, { count: 'exact' }),
    now
  );

  // 텍스트 검색
  if (q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,benefit_summary.ilike.%${q.trim()}%`);
  }

  // 카테고리 필터
  if (category) {
    const matchedCat = categoriesRaw.find((c) => c.slug === category);
    if (matchedCat) {
      query = query.eq('category_id', matchedCat.id);
    }
  }

  // 혜택 태그 필터
  if (benefit_tag) {
    query = query.contains('benefit_tags', [benefit_tag]);
  }

  // 채널 필터
  if (channel) {
    query = query.eq('channel', channel);
  }

  // 정렬
  switch (sort) {
    case 'new':
      query = query.order('created_at', { ascending: false });
      break;
    case 'ending':
      query = query
        .not('ends_at', 'is', null)
        .eq('is_evergreen', false)
        .order('ends_at', { ascending: true });
      break;
    case 'discount':
      query = query.order('discount_value', { ascending: false, nullsFirst: false });
      break;
    default: // popular
      query = query
        .order('trending_score', { ascending: false })
        .order('quality_score', { ascending: false });
  }

  // 페이지네이션
  query = query.range(offset, offset + DEALS_PER_PAGE - 1);

  const { data: dealsRaw, count: totalCount } = await query;
  const deals = (dealsRaw || []).map(toDealCard);
  const totalPages = Math.ceil((totalCount || 0) / DEALS_PER_PAGE);

  const hasQuery = !!q.trim();
  const hasFilters = !!(category || benefit_tag || channel);
  const activeFilterCount = [category, benefit_tag, channel].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 브레드크럼 */}
      <nav className="py-3 text-xs sm:text-sm text-surface-400">
        <Link href="/" className="hover:text-primary-500 active:text-primary-600 transition-colors">홈</Link>
        <span className="mx-1.5">/</span>
        <span className="text-surface-600">검색</span>
      </nav>

      {/* 검색바 */}
      <section className="pb-4 sm:pb-5 border-b border-surface-100">
        <SearchInput defaultValue={q} />
        {hasQuery && (
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-surface-500">
            &ldquo;<span className="font-semibold text-surface-700">{q}</span>&rdquo; 검색 결과
            <span className="ml-1.5 text-surface-400">{totalCount || 0}건</span>
          </p>
        )}
      </section>

      {/* 본문: 필터 + 딜 목록 */}
      <div className="mt-4 sm:mt-6 pb-8 sm:pb-12 lg:flex lg:gap-8">

        {/* 모바일 필터 버튼 + 정렬 (lg 미만) */}
        <div className="lg:hidden flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MobileFilterSheet
              categories={categoryFilters}
              benefitTags={benefitTagFilters}
              currentCategory={category}
              currentBenefitTag={benefit_tag}
              currentChannel={channel}
              activeFilterCount={activeFilterCount}
            />
            <p className="text-xs text-surface-400">
              {!hasQuery && !hasFilters ? '전체 딜' : `${totalCount || 0}개`}
            </p>
          </div>
          <SortDropdown currentSort={sort} />
        </div>

        {/* 사이드바 필터 (PC only) */}
        <aside className="hidden lg:block lg:w-56 shrink-0">
          <SearchFilters
            categories={categoryFilters}
            benefitTags={benefitTagFilters}
            currentCategory={category}
            currentBenefitTag={benefit_tag}
            currentChannel={channel}
          />
        </aside>

        {/* 딜 목록 */}
        <div className="flex-1 min-w-0">
          {/* 상단: 결과 수 + 정렬 (PC only) */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm text-surface-500">
              {!hasQuery && !hasFilters ? '전체 딜' : `${totalCount || 0}개의 딜`}
            </p>
            <SortDropdown currentSort={sort} />
          </div>

          <DealGrid
            deals={deals}
            showLayoutToggle={false}
            emptyMessage={hasQuery ? `"${q}"에 대한 결과가 없습니다` : '조건에 맞는 딜이 없습니다'}
            emptySubMessage="다른 검색어나 필터를 시도해보세요"
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount || 0}
          />
        </div>
      </div>
    </div>
  );
}
