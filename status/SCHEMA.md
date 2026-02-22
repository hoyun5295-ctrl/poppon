# 📊 POPPON SCHEMA.md — DB 스키마 (진실의 원천)

> **규칙:** DB 컬럼 수정/추가 전 반드시 이 문서에서 해당 컬럼 존재 여부 확인. 추측 금지.

---

## 데이터 현황 (2/22 기준)
| 항목 | 수치 |
|------|------|
| 브랜드 (merchants) | ~340개 (전원 로고+brand_color) |
| 딜 (deals) | ~1,070 전체 (active ~875 / expired ~195) |
| 커넥터 (crawl_connectors) | ~257 active / ~171 disabled |
| 카테고리 (depth 0) | 6개 active |
| 회원 (profiles) | 4명 |

---

## 딜 타입 / 태그 체계

| 타입 | 설명 | CTA |
|------|------|-----|
| A1 | 쿠폰/프로모션 코드형 | CopyCodeButton + GoToSource |
| A2 | 가격딜/핫딜 | GoToSource |
| B | 앱쿠폰/링크형 | GetCouponButton + GoToSource |
| C | 오프라인 이벤트 | StoreInfoPanel + GoToSource |

- **혜택 (benefit_tags)**: percent_off, amount_off, bogo, free_shipping, gift_with_purchase, bundle_deal, clearance, member_only, new_user, app_only, limited_time
- **채널**: online_only, offline_only, hybrid
- **긴급**: ending_soon_24h, ending_soon_3d, new_today, updated_today

## 카테고리 (6개 활성)
패션(fashion), 뷰티(beauty), 식품/배달(food), 생활/리빙(living), 여행/레저(travel), 문화/콘텐츠(culture)

---

## 테이블 스키마

### deals
```
id, merchant_id(FK), category_id(FK), subcategory_id, title, description,
deal_type(A1/A2/B/C), status(pending/active/hidden/expired), channel,
benefit_tags(text[]), benefit_summary, coupon_code, discount_value/type,
price, original_price, discount_rate, conditions(jsonb),
starts_at, ends_at, is_evergreen,
source_type(crawl/brand/user_submit/affiliate/admin), source_url, landing_url, affiliate_url,
thumbnail_url, og_image_url, quality_score, trending_score,
view_count, click_out_count, save_count, feedback_work/fail_count,
slug, meta_title, meta_description, created_at, updated_at, expired_at
```

### merchants
```
id, name, slug, logo_url, brand_color(#hex), description, official_url,
category_ids(uuid[]), is_verified, follower_count, active_deal_count,
created_at, updated_at
```
⚠️ **`event_page_url`은 merchants 컬럼이 아님** — 어드민 폼에서 커넥터 자동 생성 트리거용 필드일 뿐.

### categories
```
id, parent_id(셀프조인), name, slug, description, icon,
sort_order, is_active, deal_count, depth(0=대/1=중/2=소), created_at
```

### profiles
```
id(FK→auth.users), phone(nullable), name, nickname, avatar_url,
gender, birth_date(varchar), ci, di,
interest_categories(uuid[], DEFAULT '{}'), marketing_agreed(boolean, DEFAULT false),
marketing_agreed_at, marketing_channel(text[]),
onboarding_completed(boolean, DEFAULT false),
provider(DEFAULT 'email'), linked_providers(text[]),
role(user/admin/super_admin), status(active/pending_withdrawal/withdrawn/banned),
withdrawn_at, withdraw_reason, last_login_at, created_at, updated_at,
push_token(text), push_token_updated_at(timestamptz), push_enabled(boolean, DEFAULT true),
device_os(text), app_version(text)
```

⚠️ **코드↔DB 컬럼명**: `interest_categories` (NOT interested_), `marketing_agreed` (NOT marketing_opt_in)

### deal_actions
```
id, deal_id, user_id(nullable), session_id(ppn_sid), action_type,
platform(text, DEFAULT 'web'), created_at
```
⚠️ `metadata` 컬럼 없음. `platform`: 'web' | 'app' 구분

### saved_deals
```
id, user_id, deal_id, created_at
```
UNIQUE(user_id, deal_id)

### followed_merchants
```
id, user_id, merchant_id, created_at
```
UNIQUE(user_id, merchant_id)

### crawl_connectors
```
id, name, merchant_id, source_url, config, status, fail_count,
last_run_at, content_hash(MD5), hash_updated_at,
connector_type(list/single/naver_brand, DEFAULT 'list')
```

### crawl_runs
```
id, connector_id, status, new/updated/expired_count, error_message,
started_at, completed_at, tokens_used
```

### search_logs
```
id, user_id(nullable), session_id, query, category_slug, result_count, created_at
```

### submissions
```
id(uuid), user_id, url, comment, parsed_preview(jsonb),
status(pending/approved/rejected), admin_note, created_at
```

### outbound_clicks
```
deal_id(FK→deals.id)
```

### push_notifications
```
id, title, body, type(service/marketing),
target_filter(jsonb), deep_link_type, deep_link_slug,
total_target, total_sent, total_failed,
sent_by, sent_at, created_at
```

### push_logs
```
id, notification_id(FK→push_notifications.id ON DELETE CASCADE),
user_id(FK→auth.users), push_token,
status(sent/failed/delivered), error_message, created_at
```

---

## 조인 관계
```
deals.merchant_id → merchants.id
deals.category_id → categories.id (FK: deals_category_id_fkey)
deals.subcategory_id → categories.id (FK: deals_subcategory_id_fkey)
profiles.id → auth.users.id
saved_deals → auth.users + deals
followed_merchants → auth.users + merchants
outbound_clicks.deal_id → deals.id (FK: outbound_clicks_deal_id_fkey)
push_logs.notification_id → push_notifications.id (ON DELETE CASCADE)
push_logs.user_id → auth.users.id (ON DELETE SET NULL)
```

⚠️ Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey (name)`
⚠️ deals 삭제 시 FK 순서: outbound_clicks → deal_actions → saved_deals → deals
⚠️ merchants 삭제 시 FK 순서: deals(+하위FK) → crawl_runs → crawl_connectors → followed_merchants → merchants

---

## RLS 정책
- **deals**: SELECT `status='active'|'expired'`, ALL: admin/super_admin
- **merchants/categories**: SELECT 전체
- **profiles**: SELECT/UPDATE `auth.uid()=id`
- **saved_deals/followed_merchants**: ALL `auth.uid()=user_id`
- **기타** (crawl_connectors, crawl_runs, outbound_clicks, push_notifications, push_logs 등): 정책 없이 RLS ON (service_role 전용)
- ⚠️ **앱 전용**: deal_actions에 anon INSERT 정책 추가 필요

---

## DB 관련 주의사항

- Supabase 조인 FK 명시 필수: `categories!deals_category_id_fkey`
- saved_deals.user_id FK: `auth.users(id)` 참조 (public.users 아님)
- followed_merchants.user_id FK: `public.profiles(id)` 참조
- profiles.phone: UNIQUE 해제됨 (KMC 연동 시 재적용)
- deal_actions: `metadata` 컬럼 없음, `platform` 컬럼 있음 (DEFAULT 'web')
- server.ts exports: `createServerSupabaseClient` (anon) + `createServiceClient` (service role)
- event_page_url은 merchants 컬럼이 아님 — 커넥터 자동 생성 트리거용 필드

---

*마지막 업데이트: 2026-02-22 (STATUS.md에서 분리)*
