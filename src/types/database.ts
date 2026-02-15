// ===========================================
// POPPON 데이터베이스 타입 정의
// 기획서 v1.2.1 기준
// ===========================================

// --- 딜 (Deal) ---
export type DealType = 'A1' | 'A2' | 'B' | 'C';
// A1: 쿠폰/프로모션 코드형
// A2: 가격딜/핫딜 (최저가/특가) — 제휴 네트워크
// B: 앱쿠폰/링크형
// C: 오프라인 이벤트

export type DealStatus = 'pending' | 'active' | 'hidden' | 'expired';
export type DealChannel = 'online' | 'offline' | 'hybrid';
export type SourceType = 'crawl' | 'brand' | 'user_submit' | 'affiliate' | 'admin';

export type BenefitTag =
  | 'percent_off'
  | 'amount_off'
  | 'bogo'
  | 'free_shipping'
  | 'gift_with_purchase'
  | 'bundle_deal'
  | 'clearance'
  | 'member_only'
  | 'new_user'
  | 'app_only'
  | 'limited_time';

export type UrgencyTag =
  | 'ending_soon_24h'
  | 'ending_soon_3d'
  | 'new_today'
  | 'updated_today';

export interface DealCondition {
  type: string;       // min_spend, excluded, max_qty 등
  value: number | null;
  text: string;       // "3만원 이상 구매 시"
}

export interface Deal {
  id: string;
  merchant_id: string;
  category_id: string;
  subcategory_id: string | null;

  // 기본 정보
  title: string;
  description: string | null;
  deal_type: DealType;
  status: DealStatus;
  channel: DealChannel;

  // 혜택
  benefit_tags: BenefitTag[];
  benefit_summary: string;        // "최대 50% 할인"
  coupon_code: string | null;     // A1 타입
  discount_value: number | null;  // % 또는 원
  discount_type: 'percent' | 'amount' | null;

  // 가격 (A2 가격딜)
  price: number | null;
  original_price: number | null;
  discount_rate: number | null;

  // 조건
  conditions: DealCondition[];
  how_to_use: string | null;

  // 기간
  starts_at: string | null;
  ends_at: string | null;
  is_evergreen: boolean;          // 상시 진행

  // 출처/링크
  source_type: SourceType;
  source_url: string;             // 원본 링크
  landing_url: string;            // 이동 링크
  affiliate_url: string | null;   // 제휴 링크
  affiliate_disclosure: boolean;

  // 이미지
  thumbnail_url: string | null;
  og_image_url: string | null;

  // 점수/통계
  quality_score: number;          // 0~100
  trending_score: number;
  view_count: number;
  click_out_count: number;
  save_count: number;
  feedback_work_count: number;
  feedback_fail_count: number;

  // 메타
  slug: string;                   // SEO URL
  meta_title: string | null;
  meta_description: string | null;

  // 시간
  created_at: string;
  updated_at: string;
  expired_at: string | null;      // 실제 만료 처리 시각
}

// --- 카테고리 ---
export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  deal_count: number;
  depth: number;                  // 0=대, 1=중, 2=소
  created_at: string;
}

// --- 브랜드(Merchant) ---
export interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;     // 브랜드 고유 색상 (#hex)
  description: string | null;
  official_url: string | null;
  category_ids: string[];
  is_verified: boolean;           // 공식 등록 여부
  follower_count: number;
  active_deal_count: number;
  created_at: string;
  updated_at: string;
}

// --- 유저(Member) ---
export type UserRole = 'member' | 'brand_admin' | 'admin' | 'super_admin';

export interface User {
  id: string;
  phone: string;
  nickname: string | null;
  role: UserRole;
  interests: string[];            // 관심 카테고리 ID
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface NotificationPreferences {
  channels: {
    kakao: boolean;
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  frequency: 'instant' | 'daily_digest' | 'weekly_digest';
  quiet_hours: {
    start: string;    // "22:00"
    end: string;      // "08:00"
  };
  digest_time: string;  // "12:00"
}

// --- 저장/구독 ---
export interface SavedDeal {
  id: string;
  user_id: string;
  deal_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  user_id: string;
  target_type: 'merchant' | 'category';
  target_id: string;
  created_at: string;
}

// --- 제휴 네트워크 ---
export interface AffiliateNetwork {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  rate_limit: number;
  enabled: boolean;
  created_at: string;
}

export interface AffiliateOffer {
  id: string;
  network_id: string;
  external_offer_id: string;
  merchant_external_id: string;
  title: string;
  price: number | null;
  original_price: number | null;
  image_url: string | null;
  landing_url: string;
  category_hint: string | null;
  raw_json: Record<string, unknown>;
  updated_at: string;
}

// --- 아웃바운드 클릭 ---
export interface OutboundClick {
  id: string;
  deal_id: string;
  user_id: string | null;
  session_id: string | null;
  network_id: string | null;
  clicked_at: string;
  redirect_url: string;
}

// --- 유저 제보 ---
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  user_id: string;
  url: string;
  comment: string | null;
  parsed_preview: Record<string, unknown> | null;
  status: SubmissionStatus;
  created_at: string;
}

// --- 딜 피드백 ---
export interface DealFeedback {
  id: string;
  deal_id: string;
  user_id: string | null;
  result: 'work' | 'fail';
  reason_code: string | null;
  note: string | null;
  created_at: string;
}

// --- 딜 액션 로그 ---
export type DealActionType = 'view' | 'click_out' | 'copy_code' | 'save' | 'share';

export interface DealAction {
  id: string;
  deal_id: string;
  user_id: string | null;
  session_id: string | null;
  action_type: DealActionType;
  created_at: string;
}

// --- 광고 ---
export type AdSlot = 'hero' | 'category_top' | 'search_top' | 'sidebar';

export interface AdCampaign {
  id: string;
  merchant_id: string;
  deal_id: string;
  slot: AdSlot;
  starts_at: string;
  ends_at: string;
  budget: number;
  spent: number;
  is_active: boolean;
  created_at: string;
}

// --- API 응답 타입 ---
export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  total_count?: number;
}

export interface HomeResponse {
  sponsored_deals: DealCard[];
  trending_deals: DealCard[];
  new_deals: DealCard[];
  ending_soon_deals: DealCard[];
  categories: Category[];
}

// 리스트용 경량 딜 카드
export interface DealCard {
  id: string;
  title: string;
  benefit_summary: string;
  deal_type: DealType;
  merchant_name: string;
  merchant_logo_url: string | null;
  merchant_brand_color: string | null;  // 브랜드 고유 색상
  category_name: string;
  thumbnail_url: string | null;
  coupon_code: string | null;
  discount_value: number | null;
  discount_type: 'percent' | 'amount' | null;
  price: number | null;
  original_price: number | null;
  ends_at: string | null;
  is_evergreen: boolean;
  benefit_tags: BenefitTag[];
  urgency_tags: UrgencyTag[];
  quality_score: number;
  is_sponsored: boolean;
  affiliate_disclosure: boolean;
  slug: string;
}
