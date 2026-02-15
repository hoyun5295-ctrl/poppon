import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ExternalLink, Shield } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toDealCard, DEAL_CARD_SELECT } from '@/lib/deals';
import { DealGrid } from '@/components/deal/DealGrid';
import { MerchantDealTabs } from '@/components/merchant/MerchantDealTabs';
import { SortDropdown } from '@/components/common/SortDropdown';
import { Pagination } from '@/components/common/Pagination';
import { APP_NAME } from '@/lib/constants';

const DEALS_PER_PAGE = 20;

interface MerchantPageProps {
  params: Promise<{ merchantSlug: string }>;
  searchParams: Promise<{ tab?: string; sort?: string; page?: string }>;
}

export async function generateMetadata({ params }: MerchantPageProps): Promise<Metadata> {
  const { merchantSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const decodedSlug = decodeURIComponent(merchantSlug);

  const { data: merchant } = await supabase
    .from('merchants')
    .select('name, description')
    .eq('slug', decodedSlug)
    .single();

  if (!merchant) return { title: '브랜드를 찾을 수 없습니다' };

  return {
    title: `${merchant.name} 할인 & 쿠폰`,
    description: `${merchant.name}의 최신 할인, 쿠폰, 프로모션 코드를 모아보세요. ${merchant.description || ''}`.substring(0, 160),
    openGraph: {
      title: `${merchant.name} 할인 & 쿠폰 | ${APP_NAME}`,
      description: `${merchant.name}의 모든 할인 정보`,
    },
  };
}

export default async function MerchantPage({ params, searchParams }: MerchantPageProps) {
  const { merchantSlug } = await params;
  const { tab = 'active', sort = 'popular', page = '1' } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const decodedSlug = decodeURIComponent(merchantSlug);

  // 1. 머천트 정보 가져오기
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', decodedSlug)
    .single();

  if (merchantError || !merchant) notFound();

  // 2. 딜 카운트 (active / expired)
  const [activeCountRes, expiredCountRes] = await Promise.all([
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .eq('status', 'active'),
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .eq('status', 'expired'),
  ]);

  const activeCount = activeCountRes.count || 0;
  const expiredCount = expiredCountRes.count || 0;

  // 3. 현재 탭의 딜 가져오기
  const currentTab = tab === 'expired' ? 'expired' : 'active';
  const currentPage = Math.max(1, parseInt(page) || 1);
  const offset = (currentPage - 1) * DEALS_PER_PAGE;

  let query = supabase
    .from('deals')
    .select(DEAL_CARD_SELECT)
    .eq('merchant_id', merchant.id)
    .eq('status', currentTab === 'active' ? 'active' : 'expired');

  // 정렬
  switch (sort) {
    case 'new':
      query = query.order('created_at', { ascending: false });
      break;
    case 'ending':
      query = query.order('ends_at', { ascending: true, nullsFirst: false });
      break;
    case 'discount':
      query = query.order('discount_value', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('trending_score', { ascending: false }).order('quality_score', { ascending: false });
  }

  query = query.range(offset, offset + DEALS_PER_PAGE - 1);

  const { data: dealsRaw } = await query;
  const deals = (dealsRaw || []).map(toDealCard);
  const totalCount = currentTab === 'active' ? activeCount : expiredCount;
  const totalPages = Math.ceil(totalCount / DEALS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* 브레드크럼 */}
      <nav className="py-2.5 sm:py-3 text-xs sm:text-sm text-surface-400">
        <Link href="/" className="hover:text-primary-500 active:text-primary-600 transition-colors">홈</Link>
        <span className="mx-1.5">/</span>
        <span className="text-surface-600">{merchant.name}</span>
      </nav>

      {/* 머천트 프로필 — 모바일: 세로 중앙 / PC: 가로 */}
      <section className="pb-5 sm:pb-6 border-b border-surface-100">
        {/* 모바일 레이아웃 (sm 미만): 세로 중앙 정렬 */}
        <div className="sm:hidden flex flex-col items-center text-center">
          <MerchantLogo merchant={merchant} />

          <div className="mt-3 w-full">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-xl font-bold text-surface-900">{merchant.name}</h1>
              {merchant.is_verified && (
                <Shield className="w-4.5 h-4.5 text-blue-500 fill-blue-100" />
              )}
            </div>

            {merchant.description && (
              <p className="mt-1 text-xs text-surface-500 line-clamp-2 px-4">{merchant.description}</p>
            )}

            <div className="mt-2 flex items-center justify-center gap-3">
              {merchant.official_url && (
                <a
                  href={merchant.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-surface-500 active:text-primary-500 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  공식 사이트
                </a>
              )}
              <span className="text-xs text-surface-400">
                딜 {activeCount}개 진행중
              </span>
            </div>

            <button className="mt-3 w-full py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl active:bg-primary-600 transition-colors">
              구독하기
            </button>
          </div>
        </div>

        {/* PC 레이아웃 (sm 이상): 가로 배치 */}
        <div className="hidden sm:flex items-start gap-5">
          <MerchantLogo merchant={merchant} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-surface-900">{merchant.name}</h1>
              {merchant.is_verified && (
                <Shield className="w-5 h-5 text-blue-500 fill-blue-100" />
              )}
            </div>

            {merchant.description && (
              <p className="mt-1.5 text-sm text-surface-500 line-clamp-2">{merchant.description}</p>
            )}

            <div className="mt-3 flex items-center gap-4 flex-wrap">
              {merchant.official_url && (
                <a
                  href={merchant.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  공식 사이트
                </a>
              )}
              <span className="text-sm text-surface-400">
                딜 {activeCount}개 진행중
              </span>
            </div>

            <button className="mt-4 px-5 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-colors">
              구독하기
            </button>
          </div>
        </div>
      </section>

      {/* 탭 + 정렬 */}
      <div className="mt-4 sm:mt-6 flex items-center justify-between">
        <MerchantDealTabs
          activeCount={activeCount}
          expiredCount={expiredCount}
          currentTab={currentTab as 'active' | 'expired'}
        />
        <SortDropdown currentSort={sort} />
      </div>

      {/* 딜 목록 */}
      <div className="mt-4 sm:mt-6 pb-8 sm:pb-12">
        <DealGrid
          deals={deals}
          showLayoutToggle={deals.length > 0}
          emptyMessage={currentTab === 'active' ? '진행중인 딜이 없습니다' : '종료된 딜이 없습니다'}
          emptySubMessage={currentTab === 'active' ? '구독하면 새 딜이 등록될 때 알림을 받을 수 있어요' : undefined}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}

// 머천트 로고 (서버 컴포넌트 — 이니셜 폴백)
function MerchantLogo({ merchant }: { merchant: any }) {
  const initial = merchant.name.charAt(0).toUpperCase();

  if (merchant.logo_url) {
    return (
      <div className="w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white border border-surface-200 flex items-center justify-center overflow-hidden p-2 shrink-0">
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-primary-500 flex items-center justify-center shrink-0">
      <span className="text-2xl sm:text-3xl font-bold text-white">{initial}</span>
    </div>
  );
}
