// ===========================================
// POPPON 상수 정의
// ===========================================

export const APP_NAME = 'POPPON';
export const APP_DESCRIPTION = '한국의 모든 할인/쿠폰/프로모션을 한 곳에서';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// --- 12 대카테고리 ---
export const MAIN_CATEGORIES = [
  { slug: 'fashion', name: '패션', icon: '👗', color: '#FF6B5E' },
  { slug: 'beauty', name: '뷰티', icon: '💄', color: '#FF8412' },
  { slug: 'food', name: '식품/배달', icon: '🍔', color: '#FF4133' },
  { slug: 'living', name: '생활/리빙', icon: '🏠', color: '#10B981' },
  { slug: 'digital', name: '디지털/가전', icon: '📱', color: '#3B82F6' },
  { slug: 'travel', name: '여행/레저', icon: '✈️', color: '#6366F1' },
  { slug: 'culture', name: '문화/콘텐츠', icon: '🎬', color: '#8B5CF6' },
  { slug: 'kids', name: '키즈/교육', icon: '👶', color: '#F59E0B' },
  { slug: 'health', name: '건강/헬스', icon: '💪', color: '#14B8A6' },
  { slug: 'pets', name: '반려동물', icon: '🐾', color: '#EC4899' },
  { slug: 'auto', name: '자동차/주유', icon: '🚗', color: '#64748B' },
  { slug: 'finance', name: '금융/통신', icon: '💳', color: '#0EA5E9' },
] as const;

// --- 혜택 태그 ---
export const BENEFIT_TAG_LABELS: Record<string, string> = {
  percent_off: '% 할인',
  amount_off: '원 할인',
  bogo: '1+1',
  free_shipping: '무료배송',
  gift_with_purchase: '사은품',
  bundle_deal: '세트할인',
  clearance: '클리어런스',
  member_only: '회원전용',
  new_user: '첫구매',
  app_only: '앱전용',
  limited_time: '기간한정',
};

// --- 채널 라벨 ---
export const CHANNEL_LABELS: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
};

// --- 정렬 옵션 ---
export const SORT_OPTIONS = [
  { value: 'recommended', label: '추천순' },
  { value: 'new', label: '최신순' },
  { value: 'ending', label: '마감임박순' },
  { value: 'popular', label: '인기순' },
] as const;

// --- 기간 필터 ---
export const DATE_FILTER_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '이번 주' },
  { value: 'month', label: '이번 달' },
  { value: 'evergreen', label: '상시' },
] as const;

// --- 딜 타입 라벨 ---
export const DEAL_TYPE_LABELS: Record<string, string> = {
  A1: '쿠폰코드',
  A2: '특가딜',
  B: '앱쿠폰',
  C: '오프라인',
};

// --- 페이지네이션 ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// --- SEO ---
export const SEO_DEFAULTS = {
  title: `${APP_NAME} - 한국 최대 할인/쿠폰 모음`,
  description: '쿠폰, 프로모션 코드, 할인 이벤트를 한 곳에서 찾아보세요. 매일 업데이트되는 최신 딜 정보.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: APP_NAME,
  },
};

// --- 배치 스케줄 ---
export const BATCH_SCHEDULE = {
  times: ['06:00', '12:00', '18:00', '23:00'],
  timezone: 'Asia/Seoul',
};

// --- 품질 정책 임계값 ---
export const QUALITY_THRESHOLDS = {
  flag_min_fails: 10,
  flag_fail_rate: 0.3,      // 30%
  hide_min_fails: 30,
  hide_fail_rate: 0.5,      // 50%
};

// --- expired SEO 정책 ---
export const EXPIRED_NOINDEX_DAYS = 14;  // 만료 후 14일 뒤 noindex
