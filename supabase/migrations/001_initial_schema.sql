-- ===========================================
-- POPPON 데이터베이스 스키마 v1.0
-- 기획서 v1.2.1 기준
-- Supabase (PostgreSQL)
-- ===========================================

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 전문검색 확장 (한국어)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- 1. 카테고리
-- ===========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),            -- 이모지
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  deal_count INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,     -- 0=대, 1=중, 2=소
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ===========================================
-- 2. 브랜드(Merchant)
-- ===========================================
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  official_url TEXT,
  category_ids UUID[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  active_deal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_merchants_name_trgm ON merchants USING gin(name gin_trgm_ops);

-- ===========================================
-- 3. 유저(Member) — Supabase Auth와 연동
-- ===========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  nickname VARCHAR(50),
  role VARCHAR(20) DEFAULT 'member',  -- member, brand_admin, admin, super_admin
  interests UUID[] DEFAULT '{}',      -- 관심 카테고리 ID
  marketing_opt_in BOOLEAN DEFAULT false,
  marketing_opt_in_at TIMESTAMPTZ,
  notification_preferences JSONB DEFAULT '{
    "channels": {"kakao": false, "sms": false, "email": false, "push": false},
    "frequency": "daily_digest",
    "quiet_hours": {"start": "22:00", "end": "08:00"},
    "digest_time": "12:00"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ===========================================
-- 4. 딜(Deal) — 핵심 테이블
-- ===========================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  subcategory_id UUID REFERENCES categories(id),

  -- 기본 정보
  title VARCHAR(500) NOT NULL,
  description TEXT,
  deal_type VARCHAR(5) NOT NULL DEFAULT 'A1',  -- A1, A2, B, C
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, active, hidden, expired
  channel VARCHAR(20) DEFAULT 'online',  -- online, offline, hybrid

  -- 혜택
  benefit_tags TEXT[] DEFAULT '{}',
  benefit_summary VARCHAR(200),
  coupon_code VARCHAR(100),
  discount_value NUMERIC(10,2),
  discount_type VARCHAR(10),  -- percent, amount

  -- 가격 (A2 가격딜)
  price NUMERIC(15,2),
  original_price NUMERIC(15,2),
  discount_rate NUMERIC(5,2),

  -- 조건
  conditions JSONB DEFAULT '[]'::jsonb,
  how_to_use TEXT,

  -- 기간
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_evergreen BOOLEAN DEFAULT false,

  -- 출처/링크
  source_type VARCHAR(20) NOT NULL DEFAULT 'admin',  -- crawl, brand, user_submit, affiliate, admin
  source_url TEXT,
  landing_url TEXT NOT NULL,
  affiliate_url TEXT,
  affiliate_disclosure BOOLEAN DEFAULT false,

  -- 이미지
  thumbnail_url TEXT,
  og_image_url TEXT,

  -- 점수/통계
  quality_score INTEGER DEFAULT 50,
  trending_score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  click_out_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  feedback_work_count INTEGER DEFAULT 0,
  feedback_fail_count INTEGER DEFAULT 0,

  -- SEO
  slug VARCHAR(500) NOT NULL,
  meta_title VARCHAR(200),
  meta_description VARCHAR(300),

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expired_at TIMESTAMPTZ
);

-- 인덱스
CREATE UNIQUE INDEX idx_deals_slug ON deals(slug);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_merchant ON deals(merchant_id);
CREATE INDEX idx_deals_category ON deals(category_id);
CREATE INDEX idx_deals_deal_type ON deals(deal_type);
CREATE INDEX idx_deals_ends_at ON deals(ends_at) WHERE status = 'active';
CREATE INDEX idx_deals_quality_score ON deals(quality_score DESC) WHERE status = 'active';
CREATE INDEX idx_deals_trending ON deals(trending_score DESC) WHERE status = 'active';
CREATE INDEX idx_deals_created ON deals(created_at DESC);
CREATE INDEX idx_deals_source_type ON deals(source_type);

-- 전문검색 인덱스
CREATE INDEX idx_deals_title_trgm ON deals USING gin(title gin_trgm_ops);

-- ===========================================
-- 5. 저장한 딜
-- ===========================================
CREATE TABLE saved_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, deal_id)
);

CREATE INDEX idx_saved_deals_user ON saved_deals(user_id);

-- ===========================================
-- 6. 구독 (브랜드/카테고리)
-- ===========================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,  -- merchant, category
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_follows_user ON follows(user_id);
CREATE INDEX idx_follows_target ON follows(target_type, target_id);

-- ===========================================
-- 7. 딜 액션 로그
-- ===========================================
CREATE TABLE deal_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  action_type VARCHAR(20) NOT NULL,  -- view, click_out, copy_code, save, share
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_actions_deal ON deal_actions(deal_id, action_type);
CREATE INDEX idx_deal_actions_created ON deal_actions(created_at);

-- ===========================================
-- 8. 딜 피드백 (됨/안됨)
-- ===========================================
CREATE TABLE deal_feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  result VARCHAR(10) NOT NULL,  -- work, fail
  reason_code VARCHAR(50),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_feedbacks_deal ON deal_feedbacks(deal_id);

-- ===========================================
-- 9. 유저 제보
-- ===========================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  comment TEXT,
  parsed_preview JSONB,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON submissions(status);

-- ===========================================
-- 10. 제휴 네트워크
-- ===========================================
CREATE TABLE affiliate_networks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  credentials_ref TEXT,       -- 암호화된 인증정보 참조
  rate_limit INTEGER DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 11. 제휴 오퍼 (원천 데이터)
-- ===========================================
CREATE TABLE affiliate_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES affiliate_networks(id),
  external_offer_id VARCHAR(200) NOT NULL,
  merchant_external_id VARCHAR(200),
  title VARCHAR(500),
  price NUMERIC(15,2),
  original_price NUMERIC(15,2),
  currency VARCHAR(10) DEFAULT 'KRW',
  image_url TEXT,
  landing_url TEXT,
  category_hint VARCHAR(200),
  raw_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(network_id, external_offer_id)
);

CREATE INDEX idx_affiliate_offers_network ON affiliate_offers(network_id);

-- ===========================================
-- 12. 제휴 머천트 매핑
-- ===========================================
CREATE TABLE affiliate_merchant_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES affiliate_networks(id),
  merchant_external_id VARCHAR(200) NOT NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  UNIQUE(network_id, merchant_external_id)
);

-- ===========================================
-- 13. 아웃바운드 클릭
-- ===========================================
CREATE TABLE outbound_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  network_id UUID REFERENCES affiliate_networks(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ua TEXT,
  ip_hash VARCHAR(64),
  utm JSONB,
  redirect_url TEXT
);

CREATE INDEX idx_outbound_clicks_deal ON outbound_clicks(deal_id);
CREATE INDEX idx_outbound_clicks_date ON outbound_clicks(clicked_at);

-- ===========================================
-- 14. 광고 캠페인
-- ===========================================
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  deal_id UUID NOT NULL REFERENCES deals(id),
  slot VARCHAR(30) NOT NULL,       -- hero, category_top, search_top, sidebar
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  budget NUMERIC(12,2) DEFAULT 0,
  spent NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_active ON ad_campaigns(slot, is_active) WHERE is_active = true;

-- ===========================================
-- 15. 동의 이력 (개인정보/마케팅)
-- ===========================================
CREATE TABLE consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(30) NOT NULL,  -- marketing, privacy, terms
  action VARCHAR(10) NOT NULL,        -- opt_in, opt_out
  channel VARCHAR(20),                -- kakao, sms, email, push, all
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_logs_user ON consent_logs(user_id);

-- ===========================================
-- 16. 크롤링 커넥터 (Phase 1)
-- ===========================================
CREATE TABLE crawl_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id),
  name VARCHAR(200) NOT NULL,
  source_url TEXT NOT NULL,
  page_type VARCHAR(30),  -- static_html, dynamic_js, login_required, mixed
  schedule VARCHAR(20) DEFAULT '6h',  -- 크롤 주기
  config JSONB DEFAULT '{}'::jsonb,   -- 파싱 규칙
  status VARCHAR(20) DEFAULT 'active',  -- active, disabled, error
  last_run_at TIMESTAMPTZ,
  fail_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 17. 크롤링 실행 로그
-- ===========================================
CREATE TABLE crawl_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES crawl_connectors(id),
  status VARCHAR(20) NOT NULL,  -- running, success, failed
  new_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  expired_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ===========================================
-- 18. 배치 리포트
-- ===========================================
CREATE TABLE batch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_time TIMESTAMPTZ NOT NULL,
  affiliate_new INTEGER DEFAULT 0,
  affiliate_updated INTEGER DEFAULT 0,
  affiliate_expired INTEGER DEFAULT 0,
  crawl_new INTEGER DEFAULT 0,
  crawl_updated INTEGER DEFAULT 0,
  crawl_expired INTEGER DEFAULT 0,
  total_active INTEGER DEFAULT 0,
  total_expired INTEGER DEFAULT 0,
  outbound_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- RLS (Row Level Security) 기본 설정
-- ===========================================

-- deals: 누구나 active 딜 읽기 가능
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active deals are viewable by everyone"
  ON deals FOR SELECT
  USING (status = 'active' OR status = 'expired');

CREATE POLICY "Admins can do everything with deals"
  ON deals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- saved_deals: 본인 것만
ALTER TABLE saved_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved deals"
  ON saved_deals FOR ALL
  USING (user_id = auth.uid());

-- follows: 본인 것만
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own follows"
  ON follows FOR ALL
  USING (user_id = auth.uid());

-- categories, merchants: 읽기 공개
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT USING (true);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants are viewable by everyone"
  ON merchants FOR SELECT USING (true);

-- ===========================================
-- 자동 만료 처리 함수
-- ===========================================
CREATE OR REPLACE FUNCTION expire_deals()
RETURNS void AS $$
BEGIN
  UPDATE deals
  SET status = 'expired', expired_at = NOW()
  WHERE status = 'active'
    AND is_evergreen = false
    AND ends_at IS NOT NULL
    AND ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 품질점수 재계산 함수
-- ===========================================
CREATE OR REPLACE FUNCTION recalc_quality_score(p_deal_id UUID)
RETURNS void AS $$
DECLARE
  v_work INTEGER;
  v_fail INTEGER;
  v_total INTEGER;
  v_score INTEGER;
BEGIN
  SELECT feedback_work_count, feedback_fail_count
  INTO v_work, v_fail
  FROM deals WHERE id = p_deal_id;

  v_total := v_work + v_fail;

  IF v_total = 0 THEN
    v_score := 50;  -- 기본값
  ELSE
    v_score := LEAST(100, GREATEST(0,
      50 + (v_work::FLOAT / v_total * 50) - (v_fail::FLOAT / v_total * 50)
    ));
  END IF;

  UPDATE deals SET quality_score = v_score WHERE id = p_deal_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- updated_at 자동 갱신 트리거
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
