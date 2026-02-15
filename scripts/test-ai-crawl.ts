#!/usr/bin/env npx ts-node
/**
 * POPPON AI 크롤러 테스트 (v2 — 변경 감지 포함)
 * 
 * 흐름:
 *   1. Puppeteer로 페이지 렌더링 (무료)
 *   2. 텍스트 해시 계산 (무료)
 *   3. 이전 해시와 비교 → 같으면 AI 스킵! ($$$ 절약)
 *   4. 다르면 Claude API 호출 → 딜 추출
 * 
 * 사용법:
 *   npx ts-node scripts/test-ai-crawl.ts
 *   npx ts-node scripts/test-ai-crawl.ts --url https://clubclio.co.kr/event/eventList --name 클리오
 *   npx ts-node scripts/test-ai-crawl.ts --force   ← 변경 감지 무시, 전부 AI 호출
 */

import puppeteer from 'puppeteer';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// .env.local 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// ============================================================
// 설정
// ============================================================

const TEST_SITES = [
  { name: '클리오', url: 'https://clubclio.co.kr/event/eventList' },
  { name: '스타벅스', url: 'https://www.starbucks.co.kr/whats_new/campaign_list.do' },
  { name: '이니스프리', url: 'https://www.innisfree.com/kr/ko/event/list.do' },
  { name: '올리브영', url: 'https://www.oliveyoung.co.kr/store/exhibition/exhibition.do' },
  { name: 'CGV', url: 'https://www.cgv.co.kr/culture-event/event/' },
];

// 해시 캐시 파일 경로
const HASH_CACHE_PATH = path.join(process.cwd(), 'debug-ai-crawl', 'content-hashes.json');

const AI_SYSTEM_PROMPT = `당신은 한국 브랜드 이벤트/할인/프로모션 페이지를 분석하는 전문가입니다.
주어진 웹페이지 콘텐츠에서 현재 진행 중인 딜(할인, 이벤트, 프로모션, 쿠폰)을 모두 찾아 JSON 배열로 반환하세요.

각 딜에 대해 다음 필드를 추출하세요:
- title: 딜 제목 (필수)
- description: 부제목 또는 상세 설명
- landingUrl: 딜 상세 페이지 URL (절대 경로)
- thumbnailUrl: 대표 이미지 URL
- benefitSummary: 핵심 혜택 요약 (예: "최대 50% 할인", "1+1", "무료배송")
- couponCode: 쿠폰 코드 (있을 경우)
- discountValue: 할인 수치 (숫자만)
- discountType: "percent" 또는 "amount"
- startsAt: 시작일 (YYYY-MM-DD)
- endsAt: 종료일 (YYYY-MM-DD)
- badges: 태그 배열 (예: ["단독", "쿠폰", "한정"])

규칙:
1. 현재 진행 중인 딜만 추출 (종료된 것 제외)
2. 광고/네비게이션/푸터 텍스트는 무시
3. 날짜가 불분명하면 null
4. URL은 반드시 절대 경로 (https://로 시작)
5. 딜이 없으면 빈 배열 [] 반환
6. JSON만 반환, 다른 텍스트 없이`;

// ============================================================
// 해시 캐시 (변경 감지용)
// ============================================================

interface HashCache {
  [url: string]: {
    hash: string;
    lastCrawled: string;
    dealCount: number;
  };
}

function loadHashCache(): HashCache {
  try {
    if (fs.existsSync(HASH_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(HASH_CACHE_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveHashCache(cache: HashCache): void {
  const dir = path.dirname(HASH_CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HASH_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

function computeHash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

// ============================================================
// Puppeteer 렌더링
// ============================================================

async function renderPage(browser: any, url: string) {
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
      const type = req.resourceType();
      if (['font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // 스크린샷 (디버깅용)
    const debugDir = path.join(process.cwd(), 'debug-screenshots');
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    const safeName = url.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);
    await page.screenshot({ path: path.join(debugDir, `${safeName}.png`), fullPage: false });

    const content = await page.evaluate(() => {
      ['nav', 'header', 'footer', 'script', 'style', 'noscript',
        '[class*="cookie"]', '[class*="popup"]', '[class*="modal"]',
        '[class*="chat"]', '[class*="gnb"]'
      ].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });

      const body = (document.querySelector('main, #content, #container, .content, [role="main"]')
        || document.body) as HTMLElement;

      const textContent = body.innerText
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .substring(0, 12000);

      const links: Array<{ href: string; text: string }> = [];
      body.querySelectorAll('a[href]').forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        const text = (a as HTMLElement).innerText.trim();
        if (text.length >= 2 && text.length <= 200 && href.startsWith('http')) {
          links.push({ href, text });
        }
      });

      const images: Array<{ src: string; alt: string }> = [];
      body.querySelectorAll('img[src]').forEach(img => {
        const src = (img as HTMLImageElement).src;
        const alt = (img as HTMLImageElement).alt || '';
        if (src.startsWith('http')) {
          images.push({ src, alt });
        }
      });

      return {
        title: document.title,
        textContent,
        links: links.slice(0, 80),
        images: images.slice(0, 30),
        htmlLength: document.documentElement.outerHTML.length,
      };
    });

    return content;
  } finally {
    await page.close();
  }
}

// ============================================================
// Claude API 호출
// ============================================================

async function extractDealsWithAI(content: any, brandName: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 .env.local에 없습니다!');
  }

  const userMessage = `브랜드: ${brandName}
페이지 제목: ${content.title}

=== 페이지 텍스트 ===
${content.textContent}

=== 주요 링크 ===
${content.links.slice(0, 40).map((l: any) => `[${l.text}](${l.href})`).join('\n')}

=== 주요 이미지 ===
${content.images.slice(0, 15).map((i: any) => `![${i.alt}](${i.src})`).join('\n')}

위에서 진행 중인 딜/이벤트/프로모션을 JSON 배열로 추출하세요.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
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

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  }

  const result = await res.json();
  const text = result.content?.[0]?.text || '[]';
  const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

  let deals: any[] = [];
  try {
    let jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // 잘린 JSON 복구 시도
    if (!jsonStr.endsWith(']')) {
      // 마지막 완전한 객체까지만 자르기
      const lastComplete = jsonStr.lastIndexOf('},');
      if (lastComplete > 0) {
        jsonStr = jsonStr.substring(0, lastComplete + 1) + ']';
        console.log('     🔧 잘린 JSON 복구 시도...');
      } else {
        const lastObj = jsonStr.lastIndexOf('}');
        if (lastObj > 0) {
          jsonStr = jsonStr.substring(0, lastObj + 1) + ']';
          console.log('     🔧 잘린 JSON 복구 시도...');
        }
      }
    }
    
    deals = JSON.parse(jsonStr);
    if (!Array.isArray(deals)) deals = [];
  } catch {
    console.warn('  ⚠️ JSON 파싱 실패, 원본:', text.substring(0, 300));
  }

  return { deals, tokens };
}

// ============================================================
// 메인
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const urlArg = args.find(a => a.startsWith('--url='))?.split('=')[1]
    || (args.indexOf('--url') >= 0 ? args[args.indexOf('--url') + 1] : null);
  const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1]
    || (args.indexOf('--name') >= 0 ? args[args.indexOf('--name') + 1] : null);
  const forceArg = args.includes('--force');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY가 .env.local에 설정되어 있지 않습니다.');
    process.exit(1);
  }

  let targets: Array<{ name: string; url: string }>;
  if (urlArg) {
    targets = [{ name: nameArg || '테스트', url: urlArg }];
  } else {
    targets = TEST_SITES;
  }

  // 해시 캐시 로드
  const hashCache = loadHashCache();

  console.log('🚀 POPPON AI 크롤러 v2 (변경 감지 포함)');
  console.log(`   Puppeteer + Claude Haiku`);
  console.log(`   대상: ${targets.map(t => t.name).join(', ')}`);
  console.log(`   모드: ${forceArg ? '🔴 강제 실행 (--force)' : '🟢 변경분만 AI 호출'}`);
  console.log('='.repeat(70));

  console.log('\n🌐 Puppeteer 브라우저 시작...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=ko-KR'],
    defaultViewport: { width: 1280, height: 720 },
  });
  console.log('   ✅ 브라우저 준비 완료\n');

  const allResults: Array<{
    name: string;
    url: string;
    status: string;
    dealCount: number;
    tokens: number;
    duration: number;
    deals: any[];
    skipped: boolean;
  }> = [];

  let skippedCount = 0;
  let aiCallCount = 0;
  let totalTokens = 0;

  for (const target of targets) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📡 [${target.name}] ${target.url}`);
    console.log('─'.repeat(70));

    const start = Date.now();

    try {
      // Step 1: 렌더링 (무료)
      console.log('  1️⃣ 페이지 렌더링 중...');
      const content = await renderPage(browser, target.url);
      console.log(`     ✅ ${(content.htmlLength / 1024).toFixed(0)}KB | 텍스트 ${content.textContent.length}자 | ${content.links.length} links | ${content.images.length} images`);

      if (content.textContent.length < 50) {
        console.log('     ⚠️ 콘텐츠 부족 — 스킵');
        allResults.push({
          name: target.name, url: target.url,
          status: '콘텐츠 부족', dealCount: 0, tokens: 0,
          duration: Date.now() - start, deals: [], skipped: true,
        });
        continue;
      }

      // Step 2: 변경 감지 (무료)
      const currentHash = computeHash(content.textContent);
      const cached = hashCache[target.url];
      const isChanged = !cached || cached.hash !== currentHash;

      if (!isChanged && !forceArg) {
        // ✅ 변경 없음 → AI 호출 스킵!
        console.log(`  2️⃣ 🟢 변경 없음! (해시: ${currentHash.substring(0, 8)}...)`);
        console.log(`     마지막 크롤: ${cached.lastCrawled} | 딜 ${cached.dealCount}개`);
        console.log(`     💰 AI 호출 스킵 → $0.017 절약!`);
        skippedCount++;

        allResults.push({
          name: target.name, url: target.url,
          status: '변경없음(스킵)', dealCount: cached.dealCount, tokens: 0,
          duration: Date.now() - start, deals: [], skipped: true,
        });
        continue;
      }

      // Step 3: 변경 감지됨 → AI 호출
      if (cached) {
        console.log(`  2️⃣ 🔴 변경 감지! (${cached.hash.substring(0, 8)}... → ${currentHash.substring(0, 8)}...)`);
      } else {
        console.log(`  2️⃣ 🆕 첫 크롤링 (해시: ${currentHash.substring(0, 8)}...)`);
      }

      console.log('  3️⃣ Claude Haiku API 분석 중...');
      const { deals, tokens } = await extractDealsWithAI(content, target.name);
      const duration = Date.now() - start;
      console.log(`     ✅ ${deals.length}개 딜 추출 | ${tokens} tokens | ${(duration / 1000).toFixed(1)}s`);

      aiCallCount++;
      totalTokens += tokens;

      // 해시 캐시 업데이트
      hashCache[target.url] = {
        hash: currentHash,
        lastCrawled: new Date().toISOString(),
        dealCount: deals.length,
      };

      // 결과 출력
      if (deals.length > 0) {
        console.log('\n  🎯 추출된 딜:');
        for (const deal of deals.slice(0, 8)) {
          console.log(`     • ${deal.title}`);
          if (deal.benefitSummary) console.log(`       혜택: ${deal.benefitSummary}`);
          if (deal.startsAt || deal.endsAt) console.log(`       기간: ${deal.startsAt || '?'} ~ ${deal.endsAt || '?'}`);
          if (deal.landingUrl) console.log(`       URL: ${deal.landingUrl.substring(0, 80)}`);
        }
        if (deals.length > 8) console.log(`     ... 외 ${deals.length - 8}개`);
      }

      allResults.push({
        name: target.name, url: target.url,
        status: '성공', dealCount: deals.length, tokens,
        duration, deals, skipped: false,
      });

    } catch (err) {
      const errMsg = (err as Error).message;
      console.log(`  ❌ 에러: ${errMsg}`);
      allResults.push({
        name: target.name, url: target.url,
        status: `실패: ${errMsg.substring(0, 50)}`, dealCount: 0, tokens: 0,
        duration: Date.now() - start, deals: [], skipped: false,
      });
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
  saveHashCache(hashCache);

  // === 요약 ===
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 결과 요약\n');
  console.log('브랜드          | 상태          | 딜 수 | 토큰   | 시간');
  console.log('─'.repeat(65));
  for (const r of allResults) {
    const name = r.name.padEnd(12);
    const status = r.status.substring(0, 12).padEnd(12);
    const deals = String(r.dealCount).padStart(4);
    const tokens = String(r.tokens).padStart(6);
    const time = `${(r.duration / 1000).toFixed(1)}s`.padStart(6);
    console.log(`${name} | ${status} | ${deals}  | ${tokens} | ${time}`);
  }
  console.log('─'.repeat(65));

  const totalDeals = allResults.reduce((s, r) => s + r.dealCount, 0);
  const cost = totalTokens * 0.000003;

  console.log(`\n💡 변경 감지 결과:`);
  console.log(`   AI 호출: ${aiCallCount}건 | 스킵: ${skippedCount}건`);
  console.log(`   총 딜: ${totalDeals}개 | 총 토큰: ${totalTokens} | 비용: $${cost.toFixed(4)}`);
  if (skippedCount > 0) {
    console.log(`   💰 절약: $${(skippedCount * 0.017).toFixed(3)} (스킵 ${skippedCount}건 × $0.017)`);
  }

  // 결과 저장
  const outputDir = path.join(process.cwd(), 'debug-ai-crawl');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, `result-${new Date().toISOString().slice(0, 10)}.json`),
    JSON.stringify(allResults, null, 2),
    'utf-8'
  );
  console.log(`\n💾 상세 결과: debug-ai-crawl/ 폴더`);
  console.log(`📸 스크린샷: debug-screenshots/ 폴더`);
  console.log(`🗂️ 해시 캐시: debug-ai-crawl/content-hashes.json`);
  console.log(`\n💡 TIP: 변경 감지 무시하고 전부 돌리려면 --force 옵션 추가`);
}

main().catch(console.error);
