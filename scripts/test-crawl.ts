#!/usr/bin/env npx ts-node
/**
 * POPPON 크롤러 테스트 스크립트
 * 
 * 사용법:
 *   cd C:\projects\poppon
 *   npx ts-node scripts/test-crawl.ts
 *   npx ts-node scripts/test-crawl.ts --brand 클리오
 *   npx ts-node scripts/test-crawl.ts --url https://clubclio.co.kr/event/eventList
 * 
 * 기능:
 *   1. 실제 사이트 HTML을 fetch
 *   2. 새 parser v2로 파싱
 *   3. 결과를 콘솔에 출력 (DB 저장 없음)
 *   4. HTML을 파일로 저장하여 셀렉터 디버깅 가능
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cheerio = require('cheerio');

// ============ 인라인 Fetcher ============
const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
};

async function fetchPage(url: string): Promise<{ html: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const html = await res.text();
    return { html, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ============ 인라인 Parser (v2 핵심 로직) ============

interface DealCandidate {
  title: string;
  description: string | null;
  landingUrl: string;
  thumbnailUrl: string | null;
  benefitSummary: string | null;
  couponCode: string | null;
  discountValue: number | null;
  discountType: 'percent' | 'amount' | null;
  startsAt: string | null;
  endsAt: string | null;
  confidence: number;
}

interface ConnectorConfig {
  top_category?: string;
  selectors?: {
    card: string;
    title?: string;
    description?: string;
    image?: string;
    link?: string;
    date?: string;
    discount?: string;
    badge?: string;
  };
  exclude?: string[];
  link_prefix?: string;
  link_attr?: string;
  image_attr?: string;
  notes?: string;
}

const DISCOUNT_PATTERNS = {
  percentOff: /(\d{1,3})\s*%\s*(할인|OFF|off|세일|쿠폰|↓|다운)/,
  amountOff: /(\d{1,3}[,.]?\d{0,3})\s*원\s*(할인|쿠폰|캐시백|적립|다운)/,
  couponCode: /(?:쿠폰\s*(?:코드|번호)|코드|CODE)[:\s]*([A-Z0-9가-힣]{3,20})/i,
  bogo: /(?:1\s*\+\s*1|buy\s*one|원플러스원|증정|사은품)/i,
  freeShipping: /무료\s*배송|배송\s*무료|FREE\s*(?:SHIPPING|DELIVERY)/i,
  sale: /세일|SALE|특가|최저가|핫딜|HOT\s*DEAL|타임딜|반값/i,
  event: /이벤트|기획전|프로모션|PROMOTION|EVENT|페스티벌|감사제/i,
  newUser: /첫\s*(?:구매|가입|주문)|신규\s*(?:가입|회원)|웰컴/i,
  limited: /한정|선착순|마감\s*임박|얼리버드|단독|ONLY/i,
  discount: /할인|혜택|적립|쿠폰|세일|특가|무료|증정|경품/i,
};

const DATE_PATTERNS = [
  /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*[~\-–—]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
  /(\d{1,2})[.\-/](\d{1,2})\s*[~\-–—]\s*(\d{1,2})[.\-/](\d{1,2})/,
  /[~\-–—까지]\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
];

function resolveUrl(href: string, baseUrl: string): string | null {
  if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:')) return null;
  try {
    if (href.startsWith('http')) return href;
    return new URL(href, baseUrl).href;
  } catch { return null; }
}

function extractBenefitSummary(text: string): string | null {
  const pm = text.match(/(?:최대\s*)?(\d{1,3})\s*%\s*(?:할인|OFF)/);
  if (pm) return `최대 ${pm[1]}% 할인`;
  const am = text.match(/(\d{1,3}[,.]?\d{0,3})\s*원\s*할인/);
  if (am) return `${am[1]}원 할인`;
  if (DISCOUNT_PATTERNS.bogo.test(text)) return '1+1 / 증정';
  if (DISCOUNT_PATTERNS.freeShipping.test(text)) return '무료배송';
  return null;
}

function extractDateRange(text: string) {
  if (!text) return null;
  const y = new Date().getFullYear();
  const m1 = text.match(DATE_PATTERNS[0]);
  if (m1) return { start: `${m1[1]}-${m1[2].padStart(2,'0')}-${m1[3].padStart(2,'0')}`, end: `${m1[4]}-${m1[5].padStart(2,'0')}-${m1[6].padStart(2,'0')}` };
  const m3 = text.match(DATE_PATTERNS[2]);
  if (m3) return { start: null, end: `${m3[1]}-${m3[2].padStart(2,'0')}-${m3[3].padStart(2,'0')}` };
  const m2 = text.match(DATE_PATTERNS[1]);
  if (m2) return { start: `${y}-${m2[1].padStart(2,'0')}-${m2[2].padStart(2,'0')}`, end: `${y}-${m2[3].padStart(2,'0')}-${m2[4].padStart(2,'0')}` };
  return null;
}

function calcConfidence(title: string, fullText: string, url: string): number {
  let s = 0;
  if (DISCOUNT_PATTERNS.percentOff.test(title)) s += 30;
  if (DISCOUNT_PATTERNS.amountOff.test(title)) s += 25;
  if (DISCOUNT_PATTERNS.sale.test(title)) s += 20;
  if (DISCOUNT_PATTERNS.event.test(title)) s += 15;
  if (DISCOUNT_PATTERNS.couponCode.test(fullText)) s += 20;
  if (DISCOUNT_PATTERNS.bogo.test(fullText)) s += 25;
  if (DISCOUNT_PATTERNS.freeShipping.test(fullText)) s += 10;
  if (DISCOUNT_PATTERNS.newUser.test(fullText)) s += 10;
  if (DISCOUNT_PATTERNS.limited.test(fullText)) s += 10;
  if (/event|promotion|sale|deal|coupon|campaign|exhibition/.test(url.toLowerCase())) s += 10;
  if (DATE_PATTERNS.some(p => p.test(fullText))) s += 10;
  if (title.length >= 10 && title.length <= 100) s += 5;
  return Math.min(100, s);
}

function parseDeals(html: string, sourceUrl: string, config: ConnectorConfig = {}): DealCandidate[] {
  if (!html || html.length < 100) return [];
  const $ = cheerio.load(html);
  const candidates: DealCandidate[] = [];
  const baseUrl = new URL(sourceUrl).origin;

  // Exclude 제거
  if (config.exclude) config.exclude.forEach(s => { try { $(s).remove(); } catch {} });

  // Strategy 0: Config selectors
  if (config.selectors?.card) {
    $(config.selectors.card).each((_: number, el: any) => {
      try {
        const $el = $(el);
        const text = $el.text().replace(/\s+/g, ' ').trim();
        if (text.length < 3) return;

        let title = '';
        if (config.selectors!.title) title = $el.find(config.selectors!.title).first().text().trim();
        if (!title) title = $el.find('h2,h3,h4,.tit,.title,[class*="title"]').first().text().trim() || $el.find('a').first().attr('title') || $el.find('img').first().attr('alt') || text.substring(0, 100);
        if (!title || title.length < 2) return;

        const $link = $el.is('a') ? $el : $el.find(config.selectors!.link || 'a').first();
        let href = $link.attr(config.link_attr || 'href') || '';
        if (config.link_prefix && href && !href.startsWith('http') && !href.startsWith('/')) href = config.link_prefix + href;
        const fullUrl = resolveUrl(href, baseUrl) || sourceUrl;

        const imgSel = config.selectors!.image || 'img';
        const $img = $el.find(imgSel).first();
        const imgSrc = $img.attr(config.image_attr || 'src') || $img.attr('data-src') || '';
        const thumbnailUrl = resolveUrl(imgSrc, baseUrl);

        let dateText = '';
        if (config.selectors!.date) dateText = $el.find(config.selectors!.date).first().text().trim();
        const dateRange = extractDateRange(dateText || text);

        const desc = config.selectors!.description
          ? $el.find(config.selectors!.description).first().text().trim()
          : $el.find('.desc,.description,.sub,.txt,p').first().text().trim();

        const conf = calcConfidence(title, text, fullUrl) + 15;

        candidates.push({
          title: title.substring(0, 200),
          description: desc || null,
          landingUrl: fullUrl,
          thumbnailUrl,
          benefitSummary: extractBenefitSummary(text),
          couponCode: null,
          discountValue: null,
          discountType: null,
          startsAt: dateRange?.start || null,
          endsAt: dateRange?.end || null,
          confidence: Math.min(100, conf),
        });
      } catch {}
    });
  }

  // Strategy 2: Keyword links (if config didn't find enough)
  if (candidates.length < 3) {
    $('a[href]').each((_: number, el: any) => {
      const $el = $(el);
      const text = $el.text().trim();
      const href = $el.attr('href') || '';
      if (text.length < 5 || text.length > 200) return;
      if (!DISCOUNT_PATTERNS.discount.test(text) && !DISCOUNT_PATTERNS.event.test(text)) return;
      const fullUrl = resolveUrl(href, baseUrl);
      if (!fullUrl) return;
      if (candidates.some(c => c.landingUrl === fullUrl)) return;
      candidates.push({
        title: text.substring(0, 200),
        description: null,
        landingUrl: fullUrl,
        thumbnailUrl: null,
        benefitSummary: extractBenefitSummary(text),
        couponCode: null, discountValue: null, discountType: null,
        startsAt: null, endsAt: null,
        confidence: calcConfidence(text, text, fullUrl),
      });
    });
  }

  // Strategy 3: OG meta
  if (candidates.length === 0) {
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    if (ogTitle && DISCOUNT_PATTERNS.discount.test(ogTitle + ogDesc)) {
      candidates.push({
        title: ogTitle.trim().substring(0, 200),
        description: ogDesc || null,
        landingUrl: sourceUrl,
        thumbnailUrl: $('meta[property="og:image"]').attr('content') || null,
        benefitSummary: extractBenefitSummary(ogTitle + ' ' + ogDesc),
        couponCode: null, discountValue: null, discountType: null,
        startsAt: null, endsAt: null,
        confidence: 40,
      });
    }
  }

  // Dedup + sort
  const seen = new Set<string>();
  return candidates
    .filter(c => { const k = `${c.title.substring(0,50)}|${c.landingUrl}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .filter(c => c.confidence >= 20)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 50);
}

// ============ 테스트 대상 ============

const TEST_TARGETS: Record<string, { url: string; config: ConnectorConfig }> = {
  '클리오': {
    url: 'https://clubclio.co.kr/event/eventList',
    config: {
      top_category: '뷰티',
      selectors: {
        card: '[class*="event"] li, .eventList li, .event-area li, .board-gallery li',
        title: '.tit, .title, .subject, h3, img[alt]',
        image: 'img',
        link: 'a',
        date: '.date, .period, [class*="date"]',
      },
      exclude: ['nav', 'footer', '.gnb', '.search-popup'],
    },
  },
  'BBQ': {
    url: 'https://www.bbq.co.kr/event/list.asp',
    config: {
      top_category: '식품/배달',
      selectors: {
        card: '.event-list li, [class*="event"] li, .board-list li, table.board tr',
        title: '.tit, .title, .subject, a',
        image: 'img',
        link: 'a',
        date: '.date',
      },
      exclude: ['nav', 'footer', '.closed', 'thead'],
    },
  },
  '유니클로': {
    url: 'https://www.uniqlo.com/kr/ko/spl/promotion/',
    config: {
      top_category: '패션',
      selectors: {
        card: '[class*="promotion"] a, [class*="feature-card"], [class*="campaign-item"]',
        title: '[class*="title"], h2, h3',
        image: 'img',
      },
      exclude: ['nav', 'footer'],
    },
  },
  '스타벅스': {
    url: 'https://www.starbucks.co.kr/whats_new/campaign_list.do',
    config: {
      top_category: '식품/배달',
      selectors: {
        card: '.event_list li, [class*="event"] li, .eventList li',
        title: '.tit, .title, h3, img[alt]',
        image: 'img',
        link: 'a',
        date: '.date, .period',
      },
      exclude: ['nav', 'footer', '.ended'],
    },
  },
  '올리브영': {
    url: 'https://www.oliveyoung.co.kr/store/exhibition/exhibition.do',
    config: {
      top_category: '뷰티',
      selectors: {
        card: '.exhibition-list li, [class*="exhib"] li, .event-list li',
        title: '.tit, .title, h3, .plan-tit',
        image: 'img',
        link: 'a',
        date: '.date, .period',
      },
      exclude: ['nav', 'footer', '.ended'],
    },
  },
  'CGV': {
    url: 'https://www.cgv.co.kr/culture-event/event/',
    config: {
      top_category: '문화/콘텐츠',
      selectors: {
        card: '.event-list li, .evt_list li, [class*="event_list"] li',
        title: '.tit, .title, .evt_tit, h3, img[alt]',
        image: 'img',
        link: 'a',
        date: '.date, .period, .evt_date',
      },
      exclude: ['nav', 'footer', '.end', '.ended'],
    },
  },
};

// ============ 메인 ============

async function main() {
  const args = process.argv.slice(2);
  const brandArg = args.find(a => a.startsWith('--brand='))?.split('=')[1]
    || (args.indexOf('--brand') >= 0 ? args[args.indexOf('--brand') + 1] : null);
  const urlArg = args.find(a => a.startsWith('--url='))?.split('=')[1]
    || (args.indexOf('--url') >= 0 ? args[args.indexOf('--url') + 1] : null);

  let targets: Record<string, { url: string; config: ConnectorConfig }>;

  if (urlArg) {
    targets = { '커스텀URL': { url: urlArg, config: {} } };
  } else if (brandArg) {
    const match = Object.entries(TEST_TARGETS).find(([k]) => k.includes(brandArg));
    if (!match) {
      console.error(`❌ 브랜드 "${brandArg}" 미등록. 등록된 브랜드: ${Object.keys(TEST_TARGETS).join(', ')}`);
      process.exit(1);
    }
    targets = { [match[0]]: match[1] };
  } else {
    targets = TEST_TARGETS;
  }

  console.log('🚀 POPPON 크롤러 테스트 시작\n');
  console.log(`테스트 대상: ${Object.keys(targets).join(', ')}\n`);
  console.log('='.repeat(80));

  const fs = await import('fs');
  const path = await import('path');
  const debugDir = path.join(process.cwd(), 'debug-html');
  if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

  let totalDeals = 0;
  const results: Array<{ brand: string; url: string; status: string; deals: number; error?: string }> = [];

  for (const [brand, { url, config }] of Object.entries(targets)) {
    console.log(`\n📡 [${brand}] ${url}`);
    console.log('-'.repeat(60));

    try {
      const start = Date.now();
      const { html, status } = await fetchPage(url);
      const elapsed = Date.now() - start;

      console.log(`  ✅ HTTP ${status} | ${(html.length / 1024).toFixed(1)}KB | ${elapsed}ms`);

      // HTML 저장 (디버깅용)
      const safeFilename = brand.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      fs.writeFileSync(path.join(debugDir, `${safeFilename}.html`), html, 'utf-8');
      console.log(`  💾 HTML 저장: debug-html/${safeFilename}.html`);

      if (status >= 400 || !html || html.length < 200) {
        console.log(`  ⚠️  HTML 없거나 에러 응답 — 스킵`);
        results.push({ brand, url, status: `HTTP ${status}`, deals: 0, error: 'Empty/Error response' });
        continue;
      }

      // JS 렌더링 감지
      const isJSRendered = html.includes('__NEXT_DATA__') || html.includes('window.__INITIAL_STATE__')
        || (html.includes('<div id="root">') && html.split('<').length < 100)
        || (html.includes('<div id="app">') && html.split('<').length < 100);

      if (isJSRendered) {
        console.log(`  ⚠️  JS 렌더링 감지 — static_html 파싱 제한적`);
      }

      // 파싱
      const deals = parseDeals(html, url, config);
      totalDeals += deals.length;

      console.log(`  🎯 딜 후보: ${deals.length}개`);

      if (deals.length > 0) {
        console.log('\n  Top 5 딜:');
        for (const deal of deals.slice(0, 5)) {
          console.log(`    [${deal.confidence}점] ${deal.title.substring(0, 60)}`);
          if (deal.benefitSummary) console.log(`           혜택: ${deal.benefitSummary}`);
          if (deal.startsAt || deal.endsAt) console.log(`           기간: ${deal.startsAt || '?'} ~ ${deal.endsAt || '?'}`);
          console.log(`           URL: ${deal.landingUrl.substring(0, 80)}`);
        }
      }

      results.push({ brand, url, status: `HTTP ${status}`, deals: deals.length });

    } catch (err) {
      const errMsg = (err as Error).message;
      console.log(`  ❌ 에러: ${errMsg}`);
      results.push({ brand, url, status: 'FAILED', deals: 0, error: errMsg });
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  // 요약
  console.log('\n' + '='.repeat(80));
  console.log('📊 테스트 결과 요약\n');
  console.log('브랜드           | 상태      | 딜 수 | 비고');
  console.log('-'.repeat(60));
  for (const r of results) {
    const name = r.brand.padEnd(12);
    const status = r.status.padEnd(8);
    const deals = String(r.deals).padStart(4);
    const note = r.error || '';
    console.log(`${name} | ${status} | ${deals}  | ${note}`);
  }
  console.log('-'.repeat(60));
  console.log(`총 딜 후보: ${totalDeals}개\n`);

  // 디버깅 안내
  console.log('🔧 디버깅 팁:');
  console.log('  1. debug-html/ 폴더에서 실제 HTML 확인');
  console.log('  2. 브라우저 DevTools에서 셀렉터 테스트: $$(".event-list li")');
  console.log('  3. 셀렉터 조정 후: npx ts-node scripts/test-crawl.ts --brand 클리오');
  console.log('  4. JS 렌더링 사이트는 page_type을 dynamic_js로 변경 검토');
}

main().catch(console.error);
