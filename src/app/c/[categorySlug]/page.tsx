import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toDealCard, DEAL_CARD_SELECT, filterActiveDeals } from '@/lib/deals';
import { DealGrid } from '@/components/deal/DealGrid';
import { CategoryTabBar } from '@/components/category/CategoryTabBar';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { SubCategoryChips } from '@/components/category/SubCategoryChips';
import { SortDropdown } from '@/components/common/SortDropdown';
import { Pagination } from '@/components/common/Pagination';
import { APP_NAME, MAIN_CATEGORIES } from '@/lib/constants';

const DEALS_PER_PAGE = 24;

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ sub?: string; sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const supabase = await createServerSupabaseClient();
  const decodedSlug = decodeURIComponent(categorySlug);

  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', decodedSlug)
    .eq('depth', 0)
    .single();

  if (!category) return { title: '카테고리를 찾을 수 없습니다' };

  return {
    title: `${category.name} 할인 & 쿠폰`,
    description: `${category.name} 카테고리의 최신 할인, 쿠폰, 프로모션을 모아보세요. ${category.description || ''}`.substring(0, 160),
    openGraph: { title: `${category.name} 할인 & 쿠폰 | ${APP_NAME}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { sub = '', sort = 'popular', page = '1' } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const decodedSlug = decodeURIComponent(categorySlug);

  const now = new Date().toISOString();

  // 1. 대카테고리 가져오기
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', decodedSlug)
    .eq('depth', 0)
    .single();

  if (catError || !category) notFound();

  // 2. 하위 카테고리 가져오기
  const { data: subcategoriesRaw } = await supabase
    .from('categories')
    .select('id, name, slug, deal_count')
    .eq('parent_id', category.id)
    .eq('is_active', true)
    .order('sort_order');

  const subcategories = subcategoriesRaw || [];

  // 3. 필터링할 카테고리 ID 결정
  let filterCategoryIds: string[] = [category.id];

  if (sub) {
    const matchedSub = subcategories.find((s) => s.slug === sub);
    if (matchedSub) {
      filterCategoryIds = [matchedSub.id];
    }
  } else {
    filterCategoryIds = [category.id, ...subcategories.map((s) => s.id)];
  }

  // 4. 딜 가져오기 (filterActiveDeals로 만료 필터링)
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * DEALS_PER_PAGE;

  let query = filterActiveDeals(
    supabase
      .from('deals')
      .select(DEAL_CARD_SELECT, { count: 'exact' })
      .in('category_id', filterCategoryIds),
    now
  );

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
    default:
      query = query
        .order('trending_score', { ascending: false })
        .order('quality_score', { ascending: false });
  }

  query = query.range(offset, offset + DEALS_PER_PAGE - 1);

  const { data: dealsRaw, count: totalCount } = await query;
  const deals = (dealsRaw || []).map(toDealCard);
  const totalPages = Math.ceil((totalCount || 0) / DEALS_PER_PAGE);

  // 카테고리 색상 가져오기
  const catMeta = MAIN_CATEGORIES.find((c) => c.slug === decodedSlug);
  const catColor = catMeta?.color || '#6B7280';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 브레드크럼 */}
      <nav className="py-2.5 sm:py-3 text-xs sm:text-sm text-surface-400">
        <Link href="/" className="hover:text-primary-500 active:text-primary-600 transition-colors">홈</Link>
        <span className="mx-1.5">/</span>
        <span className="text-surface-600">{category.name}</span>
      </nav>

      {/* 카테고리 탭바 — 12개 가로스크롤 */}
      <CategoryTabBar currentSlug={decodedSlug} />

      {/* 컴팩트 헤더 */}
      <div className="flex items-center justify-between py-3 sm:py-4 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${catColor}15` }}
          >
            <CategoryIcon slug={decodedSlug} size={18} color={catColor} />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-surface-900">
            {category.name}
          </h1>
          <span className="text-xs text-surface-400">
            {totalCount || 0}개 딜
          </span>
        </div>
        <SortDropdown currentSort={sort} />
      </div>

      {/* 서브 카테고리 칩 — 가로 스크롤 */}
      {subcategories.length > 0 && (
        <div className="py-3 sm:py-4">
          <SubCategoryChips subcategories={subcategories} currentSub={sub} />
        </div>
      )}

      {/* 필터 요약 (서브카테고리 선택 시) */}
      {sub && (
        <p className="text-xs text-surface-500 mb-2">
          {subcategories.find((s) => s.slug === sub)?.name || sub}
          <span className="ml-1 text-surface-400">{totalCount || 0}건</span>
        </p>
      )}

      {/* 딜 목록 */}
      <div className="pb-8 sm:pb-12">
        <DealGrid
          deals={deals}
          showLayoutToggle={deals.length > 0}
          emptyMessage="이 카테고리에 딜이 없습니다"
          emptySubMessage="곧 새로운 딜이 등록될 예정입니다"
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount || 0}
        />
      </div>
    </div>
  );
}
