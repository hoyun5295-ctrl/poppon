import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toDealCard, DEAL_CARD_SELECT } from '@/lib/deals';
import { DealGrid } from '@/components/deal/DealGrid';
import { SubCategoryChips } from '@/components/category/SubCategoryChips';
import { SortDropdown } from '@/components/common/SortDropdown';
import { Pagination } from '@/components/common/Pagination';
import { APP_NAME } from '@/lib/constants';

// 카테고리별 아이콘 + 색상
const CATEGORY_THEME: Record<string, { icon: string; gradient: string; textColor: string }> = {
  '패션':       { icon: '👗', gradient: 'from-violet-500 to-purple-600',  textColor: 'text-violet-600' },
  '뷰티':       { icon: '💄', gradient: 'from-rose-500 to-pink-600',     textColor: 'text-rose-600' },
  '식품/배달':   { icon: '🍔', gradient: 'from-amber-500 to-orange-600',  textColor: 'text-amber-600' },
  '생활/리빙':   { icon: '🏠', gradient: 'from-emerald-500 to-green-600', textColor: 'text-emerald-600' },
  '디지털/가전': { icon: '📱', gradient: 'from-blue-500 to-indigo-600',   textColor: 'text-blue-600' },
  '여행/레저':   { icon: '✈️', gradient: 'from-sky-500 to-cyan-600',     textColor: 'text-sky-600' },
  '문화/콘텐츠': { icon: '🎬', gradient: 'from-purple-500 to-violet-600', textColor: 'text-purple-600' },
  '키즈/교육':   { icon: '🧒', gradient: 'from-pink-500 to-rose-600',    textColor: 'text-pink-600' },
  '건강/헬스':   { icon: '💪', gradient: 'from-green-500 to-emerald-600', textColor: 'text-green-600' },
  '반려동물':    { icon: '🐾', gradient: 'from-orange-500 to-amber-600',  textColor: 'text-orange-600' },
  '자동차/주유': { icon: '🚗', gradient: 'from-slate-500 to-gray-600',    textColor: 'text-slate-600' },
  '금융/통신':   { icon: '💳', gradient: 'from-indigo-500 to-blue-600',   textColor: 'text-indigo-600' },
};

const DEFAULT_THEME = { icon: '🏷️', gradient: 'from-gray-500 to-gray-600', textColor: 'text-gray-600' };

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

  // 4. 딜 가져오기
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * DEALS_PER_PAGE;

  let query = supabase
    .from('deals')
    .select(DEAL_CARD_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .in('category_id', filterCategoryIds);

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

  const theme = CATEGORY_THEME[category.name] || DEFAULT_THEME;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 브레드크럼 */}
      <nav className="py-2.5 sm:py-3 text-xs sm:text-sm text-surface-400">
        <Link href="/" className="hover:text-primary-500 active:text-primary-600 transition-colors">홈</Link>
        <span className="mx-1.5">/</span>
        <span className="text-surface-600">{category.name}</span>
      </nav>

      {/* 카테고리 헤더 — 모바일 컴팩트 */}
      <section className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r ${theme.gradient} px-5 py-6 sm:px-8 sm:py-10 mb-4 sm:mb-6`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-3xl sm:text-4xl">{theme.icon}</span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{category.name}</h1>
              {category.description && (
                <p className="mt-0.5 sm:mt-1 text-white/80 text-xs sm:text-sm line-clamp-1">{category.description}</p>
              )}
            </div>
          </div>
          <p className="mt-2 sm:mt-3 text-white/60 text-xs sm:text-sm">
            진행중인 딜 {totalCount || 0}개
          </p>
        </div>
        {/* 배경 장식 */}
        <div className="absolute -right-8 -top-8 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -right-4 -bottom-12 w-24 sm:w-32 h-24 sm:h-32 bg-white/5 rounded-full blur-xl" />
      </section>

      {/* 서브 카테고리 칩 — 가로 스크롤 */}
      {subcategories.length > 0 && (
        <div className="mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <SubCategoryChips subcategories={subcategories} currentSub={sub} />
        </div>
      )}

      {/* 정렬 */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-surface-500">
          {sub
            ? `${subcategories.find((s) => s.slug === sub)?.name || sub}`
            : '전체'}
          <span className="ml-1.5 text-surface-400">{totalCount || 0}건</span>
        </p>
        <SortDropdown currentSort={sort} />
      </div>

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
