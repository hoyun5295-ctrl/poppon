/**
 * POPPON — AI 크롤 결과 → deals 테이블 저장 (upsert)
 * 
 * 파일 위치: src/lib/crawl/save-deals.ts
 * 
 * 흐름:
 *   1. AI 크롤러가 뽑은 AIDealCandidate[] 받기
 *   2. landing_url + merchant_id 기준 중복 체크
 *   3. 신규 → INSERT (status: pending)
 *   4. 기존 → UPDATE (ends_at, description 등 변경분만)
 *   5. DB에 없는 기존 딜 → expired 처리 (선택)
 *   6. crawl_runs 로그 기록
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// 타입 정의
// ============================================================

/** AI 크롤러 출력 포맷 (ai-engine.ts에서 Claude가 뽑아주는 형태) */
export interface AIDealCandidate {
  title: string;
  description?: string;
  landingUrl: string;
  thumbnailUrl?: string;
  benefitSummary?: string;
  couponCode?: string;
  discountValue?: number;
  discountType?: 'percent' | 'amount';
  startsAt?: string;   // YYYY-MM-DD
  endsAt?: string;     // YYYY-MM-DD
  badges?: string[];   // ["단독", "쿠폰", "한정", "1+1" 등]
  confidence?: number; // AI 확신도 0~100
}

/** 커넥터 정보 (crawl_connectors 테이블) */
export interface ConnectorInfo {
  id: string;
  name: string;
  merchant_id: string;
  source_url: string;
  config?: Record<string, unknown>;
}

/** 저장 결과 */
export interface SaveResult {
  connectorId: string;
  merchantId: string;
  merchantName: string;
  newCount: number;
  updatedCount: number;
  skippedCount: number;
  expiredCount: number;
  errors: string[];
}

// ============================================================
// 카테고리 매핑
// ============================================================

const CATEGORY_SLUG_MAP: Record<string, string> = {
  '패션': 'fashion',
  '뷰티': 'beauty',
  '식품': 'food',
  '식품/배달': 'food',
  '생활': 'living',
  '생활/리빙': 'living',
  '디지털': 'digital',
  '디지털/가전': 'digital',
  '여행': 'travel',
  '여행/레저': 'travel',
  '문화': 'culture',
  '문화/콘텐츠': 'culture',
  '키즈': 'kids',
  '키즈/교육': 'kids',
  '건강': 'health',
  '건강/헬스': 'health',
  '반려동물': 'pets',
  '자동차': 'auto',
  '자동차/주유': 'auto',
  '금융': 'finance',
  '금융/통신': 'finance',
};

// ============================================================
// 혜택 태그 매핑 (AI badges → POPPON benefit_tags)
// ============================================================

function mapBadgesToBenefitTags(
  badges: string[],
  candidate: AIDealCandidate
): string[] {
  const tags: string[] = [];

  // 할인 타입 기반
  if (candidate.discountType === 'percent') tags.push('percent_off');
  if (candidate.discountType === 'amount') tags.push('amount_off');

  // 배지 키워드 매핑
  const badgeText = badges.join(' ').toLowerCase();
  if (/1\+1|buy.*get|bogo|하나.*더/i.test(badgeText)) tags.push('bogo');
  if (/무료.*배송|free.*ship/i.test(badgeText)) tags.push('free_shipping');
  if (/사은품|증정|gift/i.test(badgeText)) tags.push('gift_with_purchase');
  if (/세트|번들|bundle/i.test(badgeText)) tags.push('bundle_deal');
  if (/클리어런스|재고.*정리|clearance/i.test(badgeText)) tags.push('clearance');
  if (/회원.*전용|멤버/i.test(badgeText)) tags.push('member_only');
  if (/신규|첫.*구매|new.*user/i.test(badgeText)) tags.push('new_user');
  if (/앱.*전용|app.*only/i.test(badgeText)) tags.push('app_only');
  if (/한정|기간.*한정|limited/i.test(badgeText)) tags.push('limited_time');
  if (/쿠폰/i.test(badgeText) && candidate.couponCode) tags.push('limited_time');

  // 중복 제거
  return [...new Set(tags)];
}

// ============================================================
// 슬러그 생성
// ============================================================

function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const cleanTitle = title
    .replace(/[^\w\sㄱ-ㅎ가-힣a-zA-Z0-9]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 60);
  return `${cleanTitle}-${timestamp}${random}`;
}

// ============================================================
// URL 정규화 (중복 체크용)
// ============================================================

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // 트래킹 파라미터 제거
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
     'fbclid', 'gclid', 'ref', 'source'].forEach(p => u.searchParams.delete(p));
    // trailing slash 제거
    let path = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.origin}${path}${u.search}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

// ============================================================
// 메인: AI 크롤 결과 → deals 테이블 저장
// ============================================================

export async function saveAICrawlResults(
  candidates: AIDealCandidate[],
  connector: ConnectorInfo,
  supabase: SupabaseClient,
  options?: {
    autoApprove?: boolean;       // true면 바로 active (기본: false → pending)
    expireOldDeals?: boolean;    // true면 이번 크롤에 없는 기존 딜 expired 처리
    minConfidence?: number;      // 최소 확신도 (기본: 30)
  }
): Promise<SaveResult> {
  const {
    autoApprove = false,
    expireOldDeals = false,
    minConfidence = 50,
  } = options || {};

  const result: SaveResult = {
    connectorId: connector.id,
    merchantId: connector.merchant_id,
    merchantName: connector.name,
    newCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    expiredCount: 0,
    errors: [],
  };

  // 1. 카테고리 ID 조회 (커넥터 config에서 카테고리 가져오기)
  const config = (connector.config || {}) as Record<string, string>;
  const topCategory = config.top_category || config.category || '생활';
  const categorySlug = CATEGORY_SLUG_MAP[topCategory] || 'living';

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!category) {
    result.errors.push(`카테고리 '${categorySlug}' 찾을 수 없음`);
    return result;
  }

  // 2. 이 merchant의 기존 active 딜 목록 가져오기 (중복 체크 + 만료 처리용)
  const { data: existingDeals } = await supabase
    .from('deals')
    .select('id, title, landing_url, source_url, ends_at, status')
    .eq('merchant_id', connector.merchant_id)
    .eq('source_type', 'crawl')
    .in('status', ['active', 'pending', 'hidden']);

  const existingByUrl = new Map<string, { id: string; title: string; ends_at: string | null }>();
  if (existingDeals) {
    for (const deal of existingDeals) {
      if (deal.landing_url) {
        existingByUrl.set(normalizeUrl(deal.landing_url), {
          id: deal.id,
          title: deal.title,
          ends_at: deal.ends_at,
        });
      }
      if (deal.source_url) {
        existingByUrl.set(normalizeUrl(deal.source_url), {
          id: deal.id,
          title: deal.title,
          ends_at: deal.ends_at,
        });
      }
    }
  }

  // 3. 이번 크롤에서 발견된 URL 추적 (만료 처리용)
  const foundUrls = new Set<string>();

  // 4. 각 딜 후보 처리
  for (const candidate of candidates) {
    try {
      // 확신도 체크
      if (candidate.confidence !== undefined && candidate.confidence < minConfidence) {
        result.skippedCount++;
        continue;
      }

      // 제목 없으면 스킵
      if (!candidate.title || candidate.title.trim().length < 3) {
        result.skippedCount++;
        continue;
      }

      // landing URL 없으면 source_url 사용
      const landingUrl = candidate.landingUrl || connector.source_url;
      const normalizedUrl = normalizeUrl(landingUrl);
      foundUrls.add(normalizedUrl);

      // 중복 체크
      const existing = existingByUrl.get(normalizedUrl);

      if (existing) {
        // === 기존 딜 업데이트 ===
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        // 종료일 변경 시 업데이트
        if (candidate.endsAt && candidate.endsAt !== existing.ends_at?.split('T')[0]) {
          updateData.ends_at = candidate.endsAt + 'T23:59:59+09:00';
        }
        // 설명 업데이트
        if (candidate.description) {
          updateData.description = candidate.description;
        }
        // 혜택 요약 업데이트
        if (candidate.benefitSummary) {
          updateData.benefit_summary = candidate.benefitSummary;
        }
        // 썸네일 업데이트
        if (candidate.thumbnailUrl) {
          updateData.thumbnail_url = candidate.thumbnailUrl;
        }

        // 변경사항이 있을 때만 UPDATE
        if (Object.keys(updateData).length > 1) { // updated_at 외에 다른 것도 있으면
          const { error } = await supabase
            .from('deals')
            .update(updateData)
            .eq('id', existing.id);

          if (error) {
            result.errors.push(`UPDATE 실패 [${existing.id}]: ${error.message}`);
          } else {
            result.updatedCount++;
          }
        } else {
          result.skippedCount++; // 변경 없음
        }
      } else {
        // === 신규 딜 INSERT ===
        const benefitTags = mapBadgesToBenefitTags(
          candidate.badges || [],
          candidate
        );

        // deal_type 결정
        let dealType = 'B'; // 기본: 링크형
        if (candidate.couponCode) dealType = 'A1'; // 쿠폰코드
        if (candidate.discountValue && !candidate.couponCode) dealType = 'A2'; // 가격딜

        const newDeal = {
          merchant_id: connector.merchant_id,
          category_id: category.id,
          title: candidate.title.trim(),
          description: candidate.description || null,
          deal_type: dealType,
          status: autoApprove ? 'active' : 'pending',
          channel: 'online',

          // 혜택
          benefit_tags: benefitTags,
          benefit_summary: candidate.benefitSummary || candidate.title.substring(0, 100),
          coupon_code: candidate.couponCode || null,
          discount_value: candidate.discountValue || null,
          discount_type: candidate.discountType || null,

          // 기간
          starts_at: candidate.startsAt
            ? candidate.startsAt + 'T00:00:00+09:00'
            : new Date().toISOString(),
          ends_at: candidate.endsAt
            ? candidate.endsAt + 'T23:59:59+09:00'
            : null,
          is_evergreen: !candidate.endsAt,

          // 출처/링크
          source_type: 'crawl',
          source_url: connector.source_url,
          landing_url: landingUrl,
          thumbnail_url: candidate.thumbnailUrl || null,

          // 점수
          quality_score: Math.min(80, Math.max(20, candidate.confidence || 50)),

          // SEO
          slug: generateSlug(candidate.title),
          meta_title: candidate.title.substring(0, 200),
          meta_description: (candidate.description || candidate.benefitSummary || candidate.title).substring(0, 300),
        };

        const { error } = await supabase
          .from('deals')
          .insert(newDeal);

        if (error) {
          // slug 충돌이면 재시도
          if (error.message.includes('idx_deals_slug') || error.message.includes('duplicate')) {
            newDeal.slug = generateSlug(candidate.title + '-' + Date.now());
            const { error: retryError } = await supabase
              .from('deals')
              .insert(newDeal);
            if (retryError) {
              result.errors.push(`INSERT 재시도 실패 [${candidate.title}]: ${retryError.message}`);
            } else {
              result.newCount++;
            }
          } else {
            result.errors.push(`INSERT 실패 [${candidate.title}]: ${error.message}`);
          }
        } else {
          result.newCount++;
        }
      }
    } catch (err) {
      result.errors.push(`처리 중 에러 [${candidate.title}]: ${(err as Error).message}`);
    }
  }

  // 5. 이번 크롤에 없는 기존 딜 → expired 처리 (옵션)
  if (expireOldDeals && existingDeals) {
    for (const deal of existingDeals) {
      const normalizedLanding = deal.landing_url ? normalizeUrl(deal.landing_url) : '';
      const normalizedSource = deal.source_url ? normalizeUrl(deal.source_url) : '';

      if (!foundUrls.has(normalizedLanding) && !foundUrls.has(normalizedSource)) {
        const { error } = await supabase
          .from('deals')
          .update({
            status: 'expired',
            expired_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', deal.id);

        if (!error) {
          result.expiredCount++;
        }
      }
    }
  }

  return result;
}

// ============================================================
// crawl_runs 로그 기록 헬퍼
// ============================================================

export async function createCrawlRunLog(
  connectorId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from('crawl_runs')
    .insert({
      connector_id: connectorId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[CrawlLog] 로그 생성 실패: ${error.message}`);
    return null;
  }
  return data?.id || null;
}

export async function completeCrawlRunLog(
  runId: string,
  result: SaveResult,
  tokensUsed: number,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('crawl_runs')
    .update({
      status: result.errors.length > 0 ? 'partial' : 'success',
      new_count: result.newCount,
      updated_count: result.updatedCount,
      error_message: result.errors.length > 0
        ? result.errors.slice(0, 5).join(' | ')
        : null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);
}

export async function failCrawlRunLog(
  runId: string,
  errorMessage: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('crawl_runs')
    .update({
      status: 'failed',
      error_message: errorMessage.substring(0, 500),
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);
}
