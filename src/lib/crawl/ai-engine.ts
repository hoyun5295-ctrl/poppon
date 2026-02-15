/**
 * POPPON AI 크롤러 엔진
 * 파일 위치: src/lib/crawl/ai-engine.ts
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// ============================================================
// Types
// ============================================================

export interface AIDealCandidate {
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
  badges: string[];
  confidence?: number;
}

export interface AICrawlResult {
  connectorId: string;
  connectorName: string;
  merchantId: string;
  status: 'success' | 'failed' | 'skipped';
  deals: AIDealCandidate[];
  filteredOutCount?: number;
  errorMessage?: string;
  durationMs: number;
  tokensUsed?: number;
}

export interface PageContent {
  url: string;
  title: string;
  textContent: string;
  links: { href: string; text: string }[];
  images: { src: string; alt: string }[];
  rawHtmlLength: number;
}

interface ConnectorForAI {
  id: string;
  merchant_id: string;
  name: string;
  source_url: string;
  config: Record<string, unknown>;
  status: string;
  fail_count: number;
}

// ============================================================
// 1. Puppeteer 페이지 렌더링
// ============================================================

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,720',
        '--lang=ko-KR',
      ],
      defaultViewport: { width: 1280, height: 720 },
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function renderPage(url: string): Promise<PageContent> {
  const browser = await getBrowser();
  const page: Page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media', 'stylesheet'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(r => setTimeout(r, 2000));

    const content = await page.evaluate(() => {
      const removeSelectors = [
        'nav', 'header', 'footer', 'script', 'style', 'noscript',
        '[class*="cookie"]', '[class*="popup"]', '[class*="modal"]',
        '[class*="chat"]', '[class*="banner-top"]', '[id*="gnb"]',
      ];
      removeSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      const body = document.querySelector('main, #content, #container, .content, [role="main"]')
        || document.body;
      const textContent = (body as HTMLElement).innerText
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .substring(0, 15000);

      const links: Array<{ href: string; text: string }> = [];
      body.querySelectorAll('a[href]').forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        const text = (a as HTMLElement).innerText.trim();
        if (text.length >= 3 && text.length <= 200 && href.startsWith('http')) {
          links.push({ href, text });
        }
      });

      const images: Array<{ src: string; alt: string }> = [];
      body.querySelectorAll('img[src]').forEach(img => {
        const src = (img as HTMLImageElement).src;
        const alt = (img as HTMLImageElement).alt || '';
        if (src.startsWith('http') && !src.includes('loading') && !src.includes('placeholder')) {
          images.push({ src, alt });
        }
      });

      return {
        title: document.title,
        textContent,
        links: links.slice(0, 100),
        images: images.slice(0, 50),
        rawHtmlLength: document.documentElement.outerHTML.length,
      };
    });

    return { url, ...content };
  } finally {
    await page.close();
  }
}

// ============================================================
// 2. Claude API로 딜 정보 추출
// ============================================================

const AI_SYSTEM_PROMPT = `당신은 한국 소비자를 위한 할인/쿠폰 정보를 수집하는 전문가입니다.
주어진 웹페이지에서 **소비자가 즉시 금전적 혜택을 받을 수 있는 딜**만 추출하세요.

## 수집 대상 (O)
- 할인율/할인금액이 명시된 세일 (예: "최대 50% 할인", "10,000원 할인")
- 쿠폰 코드가 있는 프로모션
- 1+1, 2+1 등 증정 행사
- 무료배송 프로모션
- 사은품 증정 이벤트 (구매 시 증정)
- 신규가입 혜택 (웰컴 쿠폰, 첫 구매 할인)
- 앱 다운로드 쿠폰
- 특가/핫딜/타임세일
- 적립금/포인트 증정 (금액이 명시된 경우)
- 캐시백 이벤트

## 제외 대상 (X) — 절대 수집하지 마세요
- 멤버십/등급 안내 (골드카드 발급, VIP 혜택 소개 등)
- 구독 서비스 소개 (렌탈, 정기배송, 구독 플랜 등)
- 단순 상품 소개/신상품 출시 안내
- 브랜드 캠페인/스토리/철학 소개
- 매장 오픈/리뉴얼 안내
- 채용/인재 채용 공고
- 고객 후기/리뷰 이벤트 (구매 없이 참여하는 것)
- SNS 팔로우/좋아요 이벤트 (추첨 기반)
- 럭키드로우/래플/응모 이벤트 (당첨 확률 기반)
- 기부/사회공헌 캠페인
- 금액 없는 막연한 "혜택" 안내

## 판단 핵심 기준
"이 정보를 본 소비자가 **지금 바로 할인된 가격에 구매하거나 쿠폰을 사용할 수 있는가?**"
→ YES면 수집, NO면 제외

## 추출 필드
각 딜에 대해:
- title: 딜 제목 (필수, 간결하게)
- description: 상세 설명
- landingUrl: 딜 상세 페이지 URL (절대 경로, https://로 시작)
- thumbnailUrl: 대표 이미지 URL
- benefitSummary: 핵심 혜택 한 줄 요약 (예: "최대 50% 할인", "5,000원 쿠폰", "1+1")
- couponCode: 쿠폰 코드 (있을 경우)
- discountValue: 할인 수치 (숫자만, 예: 50, 10000)
- discountType: "percent" 또는 "amount"
- startsAt: 시작일 (YYYY-MM-DD)
- endsAt: 종료일 (YYYY-MM-DD)
- badges: 태그 배열 (예: ["쿠폰", "한정", "앱전용"])
- confidence: 이것이 실질적 할인/쿠폰인지 확신도 (0~100)

## 중요 규칙
1. confidence 70 미만인 딜은 포함하지 마세요
2. benefitSummary가 없는 딜(혜택이 불분명한 것)은 포함하지 마세요
3. 종료된 이벤트는 제외
4. URL은 반드시 절대 경로 (https://로 시작)
5. 딜이 없으면 빈 배열 [] 반환
6. JSON만 반환, 다른 텍스트 없이`;

export async function extractDealsWithAI(
  content: PageContent,
  merchantName: string
): Promise<{ deals: AIDealCandidate[]; tokensUsed: number; filteredOutCount: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const userMessage = `브랜드: ${merchantName}
페이지 URL: ${content.url}
페이지 제목: ${content.title}

=== 페이지 텍스트 콘텐츠 ===
${content.textContent}

=== 페이지 내 링크 (상위 50개) ===
${content.links.slice(0, 50).map(l => `[${l.text}](${l.href})`).join('\n')}

=== 페이지 내 이미지 (상위 20개) ===
${content.images.slice(0, 20).map(i => `![${i.alt}](${i.src})`).join('\n')}

위 콘텐츠에서 소비자가 즉시 금전적 혜택을 받을 수 있는 딜만 JSON 배열로 추출하세요.
멤버십 안내, 구독 서비스 소개, 단순 상품 홍보는 절대 포함하지 마세요.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API 에러: ${response.status} — ${errText}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || '[]';
  const tokensUsed = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

  let rawDeals: AIDealCandidate[] = [];
  try {
    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    rawDeals = Array.isArray(parsed) ? parsed : [];
  } catch {
    // 잘린 JSON 복구 시도
    try {
      const lastBracket = text.lastIndexOf('}');
      if (lastBracket > 0) {
        const fixedJson = text.substring(0, lastBracket + 1)
          .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const fixedStr = fixedJson.startsWith('[') ? fixedJson + ']' : '[' + fixedJson + ']';
        const parsed = JSON.parse(fixedStr);
        rawDeals = Array.isArray(parsed) ? parsed : [];
        console.warn(`[AI Parser] JSON 복구 성공: ${rawDeals.length}개 딜`);
      }
    } catch {
      console.warn(`[AI Parser] JSON 파싱 실패: ${text.substring(0, 200)}`);
    }
  }

  // === 후처리 필터링 (AI가 놓친 잡다한 딜 한번 더 걸러냄) ===
  const beforeCount = rawDeals.length;
  const deals = rawDeals.filter(deal => {
    // 1) confidence 70 미만 제거
    if (deal.confidence !== undefined && deal.confidence < 70) {
      console.log(`[AI Filter] 낮은 confidence 제거: "${deal.title}" (${deal.confidence})`);
      return false;
    }

    // 2) benefitSummary 없고 + couponCode 없고 + discountValue 없으면 제거
    const hasBenefit = !!(deal.benefitSummary && deal.benefitSummary.trim());
    const hasCoupon = !!(deal.couponCode && deal.couponCode.trim());
    const hasDiscount = deal.discountValue !== null && deal.discountValue > 0;
    if (!hasBenefit && !hasCoupon && !hasDiscount) {
      console.log(`[AI Filter] 혜택 불분명 제거: "${deal.title}"`);
      return false;
    }

    // 3) 키워드 기반 제거 (멤버십, 구독 서비스 등)
    const titleLower = (deal.title || '').toLowerCase();
    const descLower = (deal.description || '').toLowerCase();
    const combined = titleLower + ' ' + descLower;

    const excludePatterns = [
      /멤버십\s*(안내|소개|등급)/,
      /카드\s*(발급|등록|안내)/,
      /구독\s*(서비스|플랜|안내|시작)/,
      /렌탈\s*(안내|상담)/,
      /채용|인재\s*채용|입사\s*지원/,
      /매장\s*(오픈|리뉴얼)/,
      /럭키\s*드로우|래플|응모/,
      /sns\s*(팔로우|좋아요|공유)\s*이벤트/,
    ];

    for (const pattern of excludePatterns) {
      if (pattern.test(combined)) {
        console.log(`[AI Filter] 패턴 제거: "${deal.title}" (${pattern.source})`);
        return false;
      }
    }

    return true;
  });

  const filteredOutCount = beforeCount - deals.length;
  if (filteredOutCount > 0) {
    console.log(`[AI Filter] ${beforeCount}개 중 ${filteredOutCount}개 필터링 → ${deals.length}개 최종`);
  }

  return { deals, tokensUsed, filteredOutCount };
}

// ============================================================
// 3. 통합 크롤 함수
// ============================================================

export async function crawlWithAI(connector: ConnectorForAI): Promise<AICrawlResult> {
  const start = Date.now();
  const merchantName = connector.name.replace(/이벤트|프로모션|event/gi, '').trim();

  try {
    console.log(`[AI Crawl] 🌐 ${connector.name} — ${connector.source_url}`);
    const content = await renderPage(connector.source_url);
    console.log(`[AI Crawl] 📄 ${(content.rawHtmlLength / 1024).toFixed(0)}KB | ${content.links.length} links | ${content.images.length} images`);

    if (content.textContent.length < 50) {
      return {
        connectorId: connector.id,
        connectorName: connector.name,
        merchantId: connector.merchant_id,
        status: 'failed',
        deals: [],
        errorMessage: '페이지 콘텐츠가 너무 적음',
        durationMs: Date.now() - start,
      };
    }

    console.log(`[AI Crawl] 🤖 Claude API 호출 중...`);
    const { deals, tokensUsed, filteredOutCount } = await extractDealsWithAI(content, merchantName);
    console.log(`[AI Crawl] ✅ ${deals.length}개 딜 추출 (${filteredOutCount}개 필터링됨) | ${tokensUsed} tokens`);

    return {
      connectorId: connector.id,
      connectorName: connector.name,
      merchantId: connector.merchant_id,
      status: 'success',
      deals,
      filteredOutCount,
      durationMs: Date.now() - start,
      tokensUsed,
    };
  } catch (err) {
    const errorMessage = (err as Error).message;
    console.error(`[AI Crawl] ❌ ${connector.name}: ${errorMessage}`);
    return {
      connectorId: connector.id,
      connectorName: connector.name,
      merchantId: connector.merchant_id,
      status: 'failed',
      deals: [],
      errorMessage,
      durationMs: Date.now() - start,
    };
  }
}

export async function crawlBatchWithAI(
  connectors: ConnectorForAI[],
  delayBetween = 3000
): Promise<AICrawlResult[]> {
  const results: AICrawlResult[] = [];

  for (const connector of connectors) {
    const result = await crawlWithAI(connector);
    results.push(result);

    if (connectors.indexOf(connector) < connectors.length - 1) {
      await new Promise(r => setTimeout(r, delayBetween));
    }
  }

  await closeBrowser();
  return results;
}
