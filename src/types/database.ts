// ===========================================
// POPPON 데이터베이스 타입 정의
// 기획서 v1.2.1 + 회원가입/인증 시스템
// ===========================================

// --- 딜 (Deal) ---
export type DealType = 'A1' | 'A2' | 'B' | 'C';
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
  type: string;
  value: number | null;
  text: string;
}

export interface Deal {
  id: string;
  merchant_id: string;
  category_id: string;
  subcategory_id: string | null;
  title: string;
  description: string | null;
  deal_type: DealType;
  status: DealStatus;
  channel: DealChannel;
  benefit_tags: BenefitTag[];
  benefit_summary: string;
  coupon_code: string | null;
  discount_value: number | null;
  discount_type: 'percent' | 'amount' | null;
  price: number | null;
  original_price: number | null;
  discount_rate: number | null;
  conditions: DealCondition[];
  how_to_use: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_evergreen: boolean;
  source_type: SourceType;
  source_url: string;
  landing_url: string;
  affiliate_url: string | null;
  affiliate_disclosure: boolean;
  thumbnail_url: string | null;
  og_image_url: string | null;
  quality_score: number;
  trending_score: number;
  view_count: number;
  click_out_count: number;
  save_count: number;
  feedback_work_count: number;
  feedback_fail_count: number;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  expired_at: string | null;
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
  depth: number;
  created_at: string;
}

// --- 브랜드(Merchant) ---
export interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  description: string | null;
  official_url: string | null;
  category_ids: string[];
  is_verified: boolean;
  follower_count: number;
  active_deal_count: number;
  created_at: string;
  updated_at: string;
}

// --- 유저 프로필 (신규) ---
export type UserStatus = 'active' | 'suspended' | 'withdrawn';
export type AuthProvider = 'kmc' | 'kakao' | 'naver' | 'apple' | 'phone';
export type ConsentType = 'terms' | 'privacy' | 'marketing' | 'third_party';

export interface Profile {
  id: string;
  phone: string;
  name: string | null;
  nickname: string | null;
  birth_date: string | null;
  gender: string | null;
  ci: string | null;
  di: string | null;
  interest_categories: string[];
  marketing_agreed: boolean;
  marketing_agreed_at: string | null;
  marketing_channel: string[];
  avatar_url: string | null;
  provider: AuthProvider;
  linked_providers: AuthProvider[];
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  agreed: boolean;
  agreed_at: string;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  kakao_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  quiet_start: string;
  quiet_end: string;
  updated_at: string;
}

// --- 저장/구독 ---
export interface SavedDeal {
  id: string;
  user_id: string;
  deal_id: string;
  created_at: string;
}

export interface FollowedMerchant {
  id: string;
  user_id: string;
  merchant_id: string;
  notify: boolean;
  created_at: string;
}

export interface FollowedCategory {
  id: string;
  user_id: string;
  category_id: string;
  notify: boolean;
  created_at: string;
}

// --- 기존 타입 유지 ---
export type UserRole = 'member' | 'brand_admin' | 'admin' | 'super_admin';

export interface User {
  id: string;
  phone: string;
  nickname: string | null;
  role: UserRole;
  interests: string[];
  marketing_agreed: boolean;
  marketing_agreed_at: string | null;
  notification_preferences: NotificationPreferencesLegacy;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface NotificationPreferencesLegacy {
  channels: { kakao: boolean; sms: boolean; email: boolean; push: boolean };
  frequency: 'instant' | 'daily_digest' | 'weekly_digest';
  quiet_hours: { start: string; end: string };
  digest_time: string;
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

export interface DealCard {
  id: string;
  title: string;
  benefit_summary: string;
  deal_type: DealType;
  merchant_name: string;
  merchant_logo_url: string | null;
  merchant_brand_color: string | null;
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
