#!/usr/bin/env npx ts-node
/**
 * POPPON 이벤트 페이지 자동 탐지
 * 
 * 브랜드 홈페이지 접속 → 모든 링크 수집 → AI가 이벤트 페이지 URL 찾기
 * 
 * 사용법:
 *   npx ts-node scripts/detect-event-pages.ts                    ← CSV 전체
 *   npx ts-node scripts/detect-event-pages.ts --limit 10         ← 처음 10개만
 *   npx ts-node scripts/detect-event-pages.ts --category 뷰티    ← 뷰티만
 *   npx ts-node scripts/detect-event-pages.ts --name 올리브영    ← 특정 브랜드만
 */

import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// ============================================================
// CSV 파싱
// ============================================================

interface BrandEntry {
  name: string;
  category: string;
  homepageUrl: string;
}

function loadBrandsCSV(csvPath: string): BrandEntry[] {
  const text = fs.readFileSync(csvPath, 'utf-8');
  const lines = text.split('\n').slice(1); // 헤더 스킵
  const brands: BrandEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // CSV 파싱 ("name","category","url")
    const match = line.match(/"([^"]*)","([^"]*)","([^"]*)"/);
    if (match) {
      brands.push({
        name: match[1],
        category: match[2],
        homepageUrl: match[3],
      });
    }
  }
  return brands;
}

// ============================================================
// AI 프롬프트 — 이벤트 페이지 찾기
// ============================================================

const DETECT_SYSTEM_PROMPT = `당신은 한국 웹사이트에서 이벤트/프로모션/할인 페이지를 찾는 전문가입니다.

주어진 브랜드 홈페이지의 링크 목록에서 "이벤트", "프로모션", "할인", "혜택", "기획전", "특가" 등의 페이지를 찾아주세요.

반환 형식 (JSON):
{
  "eventUrl": "가장 적합한 이벤트/프로모션 목록 페이지 URL (없으면 null)",
  "confidence": "high | medium | low",
  "reason": "선택 이유 (한국어, 짧게)"
}

규칙:
1. "이벤트 목록" 또는 "프로모션 목록" 페이지를 우선 선택
2. 개별 이벤트 상세가 아닌, 이벤트가 여러 개 나열된 목록 페이지를 찾기
3. 메뉴/GNB에 "이벤트", "EVENT", "프로모션", "PROMOTION", "혜택", "기획전" 등이 있으면 해당 링크
4. 여러 후보가 있으면 가장 포괄적인 목록 페이지 선택
5. 이벤트 페이지가 없어 보이면 eventUrl을 null로
6. JSON만 반환, 다른 텍스트 없이`;

// ============================================================
// Puppeteer 링크 수집
// ============================================================

async function collectLinks(browser: any, url: string): Promise<{
  links: Array<{ href: string; text: string; location: string }>;
  pageTitle: string;
  success: boolean;
  error?: string;
}> {
  const page = await browser.newPage();

  try {
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
      const type = req.resourceType();
      if (['font', 'media', 'image'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      const links: Array<{ href: string; text: string; location: string }> = [];
      
      // GNB/메뉴 링크 (우선순위 높음)
      const navSelectors = 'nav a, header a, [class*="gnb"] a, [class*="nav"] a, [class*="menu"] a, [id*="gnb"] a, [id*="nav"] a, [id*="menu"] a';
      document.querySelectorAll(navSelectors).forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        const text = (a as HTMLElement).innerText.trim();
        if (text.length >= 1 && text.length <= 100 && href.startsWith('http')) {
          links.push({ href, text, location: 'nav' });
        }
      });

      // 전체 링크
      document.querySelectorAll('a[href]').forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        const text = (a as HTMLElement).innerText.trim();
        if (text.length >= 1 && text.length <= 100 && href.startsWith('http')) {
          // 중복 방지
          if (!links.find(l => l.href === href)) {
            links.push({ href, text, location: 'body' });
          }
        }
      });

      return {
        pageTitle: document.title,
        links: links.slice(0, 100),
      };
    });

    return { ...result, success: true };
  } catch (err) {
    return {
      links: [],
      pageTitle: '',
      success: false,
      error: (err as Error).message,
    };
  } finally {
    await page.close();
  }
}

// ============================================================
// Claude API — 이벤트 URL 감지
// ============================================================

async function detectEventUrl(
  brandName: string,
  homepageUrl: string,
  links: Array<{ href: string; text: string; location: string }>
): Promise<{ eventUrl: string | null; confidence: string; reason: string; tokens: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 없음');

  // 이벤트 관련 키워드가 포함된 링크를 상위로 정렬
  const eventKeywords = ['이벤트', 'event', '프로모션', 'promotion', '할인', '혜택', '기획전', '특가', 'sale', 'offer', 'campaign'];
  const sortedLinks = [...links].sort((a, b) => {
    const aScore = eventKeywords.some(k => (a.text + a.href).toLowerCase().includes(k)) ? 0 : 1;
    const bScore = eventKeywords.some(k => (b.text + b.href).toLowerCase().includes(k)) ? 0 : 1;
    return aScore - bScore;
  });

  const userMessage = `브랜드: ${brandName}
홈페이지: ${homepageUrl}

=== 페이지 내 링크 목록 ===
${sortedLinks.slice(0, 60).map(l => `[${l.location}] "${l.text}" → ${l.href}`).join('\n')}

위 링크 중에서 이벤트/프로모션 목록 페이지 URL을 찾아주세요.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: DETECT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  }

  const result = await res.json();
  const text = result.content?.[0]?.text || '{}';
  const tokens = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

  try {
    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      eventUrl: parsed.eventUrl || null,
      confidence: parsed.confidence || 'low',
      reason: parsed.reason || '',
      tokens,
    };
  } catch {
    return { eventUrl: null, confidence: 'low', reason: 'JSON 파싱 실패', tokens };
  }
}

// ============================================================
// 메인
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  const limitArg = args.find(a => a.startsWith('--limit'))
    ? parseInt(args[args.indexOf('--limit') + 1] || args.find(a => a.startsWith('--limit='))?.split('=')[1] || '999')
    : 999;
  const categoryArg = args.find(a => a.startsWith('--category'))
    ? (args[args.indexOf('--category') + 1] || args.find(a => a.startsWith('--category='))?.split('=')[1])
    : null;
  const nameArg = args.find(a => a.startsWith('--name'))
    ? (args[args.indexOf('--name') + 1] || args.find(a => a.startsWith('--name='))?.split('=')[1])
    : null;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY가 .env.local에 없습니다.');
    process.exit(1);
  }

  // CSV 로드
  const csvPath = path.join(process.cwd(), 'poppon_brands_filtered.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ poppon_brands_filtered.csv 파일이 없습니다. 프로젝트 루트에 놓아주세요.');
    process.exit(1);
  }

  let brands = loadBrandsCSV(csvPath);
  console.log(`📋 CSV 로드: ${brands.length}개 브랜드`);

  // 필터
  if (nameArg) {
    brands = brands.filter(b => b.name.includes(nameArg));
  }
  if (categoryArg) {
    brands = brands.filter(b => b.category === categoryArg);
  }
  brands = brands.slice(0, limitArg);

  console.log(`🎯 대상: ${brands.length}개 브랜드`);
  if (categoryArg) console.log(`   카테고리: ${categoryArg}`);
  console.log('='.repeat(70));

  // 브라우저 시작
  console.log('\n🌐 Puppeteer 시작...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=ko-KR'],
    defaultViewport: { width: 1280, height: 720 },
  });
  console.log('   ✅ 준비 완료\n');

  // 결과 저장용
  const results: Array<{
    name: string;
    category: string;
    homepageUrl: string;
    eventUrl: string | null;
    confidence: string;
    reason: string;
    status: string;
    tokens: number;
  }> = [];

  let totalTokens = 0;
  let foundCount = 0;
  let failCount = 0;

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const progress = `[${i + 1}/${brands.length}]`;

    console.log(`${progress} 🏷️  ${brand.name} (${brand.category})`);
    console.log(`     홈: ${brand.homepageUrl}`);

    try {
      // Step 1: 홈페이지 링크 수집
      const { links, pageTitle, success, error } = await collectLinks(browser, brand.homepageUrl);

      if (!success) {
        console.log(`     ❌ 접속 실패: ${error?.substring(0, 60)}`);
        results.push({
          ...brand, eventUrl: null, confidence: 'none',
          reason: `접속 실패: ${error}`, status: 'error', tokens: 0,
        });
        failCount++;
        continue;
      }

      console.log(`     📄 ${pageTitle.substring(0, 40)} | ${links.length}개 링크`);

      if (links.length < 3) {
        console.log(`     ⚠️ 링크 너무 적음 — 스킵`);
        results.push({
          ...brand, eventUrl: null, confidence: 'low',
          reason: '링크 부족', status: 'skip', tokens: 0,
        });
        continue;
      }

      // 빠른 패턴 매치 먼저 (AI 호출 절약)
      const quickMatch = links.find(l => {
        const combined = (l.text + ' ' + l.href).toLowerCase();
        return (
          (combined.includes('이벤트') || combined.includes('event')) &&
          (combined.includes('list') || combined.includes('목록') || !combined.includes('detail'))
        );
      }) || links.find(l => {
        const combined = (l.text + ' ' + l.href).toLowerCase();
        return combined.includes('프로모션') || combined.includes('promotion')
          || combined.includes('기획전') || combined.includes('혜택');
      });

      if (quickMatch) {
        console.log(`     ⚡ 빠른 감지! "${quickMatch.text}" → ${quickMatch.href}`);
        results.push({
          ...brand, eventUrl: quickMatch.href, confidence: 'high',
          reason: `키워드 매치: "${quickMatch.text}"`, status: 'found_quick', tokens: 0,
        });
        foundCount++;
        continue;
      }

      // Step 2: AI 감지
      console.log(`     🤖 AI 분석 중...`);
      const detection = await detectEventUrl(brand.name, brand.homepageUrl, links);
      totalTokens += detection.tokens;

      if (detection.eventUrl) {
        console.log(`     ✅ 발견! ${detection.eventUrl}`);
        console.log(`        신뢰도: ${detection.confidence} | ${detection.reason}`);
        results.push({
          ...brand, ...detection, status: 'found_ai',
        });
        foundCount++;
      } else {
        console.log(`     ⬜ 이벤트 페이지 없음 (${detection.reason})`);
        results.push({
          ...brand, ...detection, status: 'not_found',
        });
      }

    } catch (err) {
      console.log(`     ❌ 오류: ${(err as Error).message.substring(0, 60)}`);
      results.push({
        ...brand, eventUrl: null, confidence: 'none',
        reason: (err as Error).message, status: 'error', tokens: 0,
      });
      failCount++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();

  // === 요약 ===
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 결과 요약\n');

  const foundQuick = results.filter(r => r.status === 'found_quick').length;
  const foundAI = results.filter(r => r.status === 'found_ai').length;
  const notFound = results.filter(r => r.status === 'not_found').length;
  const errors = results.filter(r => r.status === 'error').length;
  const skips = results.filter(r => r.status === 'skip').length;

  console.log(`   ✅ 이벤트 URL 발견: ${foundCount}개`);
  console.log(`      ⚡ 빠른 감지 (무료): ${foundQuick}개`);
  console.log(`      🤖 AI 감지: ${foundAI}개`);
  console.log(`   ⬜ 이벤트 페이지 없음: ${notFound}개`);
  console.log(`   ❌ 에러/스킵: ${errors + skips}개`);
  console.log(`   💰 AI 비용: ${totalTokens} tokens ≈ $${(totalTokens * 0.000003).toFixed(4)}`);

  // 결과 CSV 저장
  const outputDir = path.join(process.cwd(), 'debug-ai-crawl');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const csvOutput = path.join(outputDir, 'event-pages-detected.csv');
  const csvLines = ['brand_name,category,homepage_url,event_url,confidence,reason,status'];
  for (const r of results) {
    csvLines.push(
      `"${r.name}","${r.category}","${r.homepageUrl}","${r.eventUrl || ''}","${r.confidence}","${r.reason.replace(/"/g, "'")}","${r.status}"`
    );
  }
  fs.writeFileSync(csvOutput, csvLines.join('\n'), 'utf-8');

  // 성공한 것만 따로 저장 (크롤러 입력용)
  const crawlReady = results.filter(r => r.eventUrl);
  const crawlCsv = path.join(outputDir, 'crawl-targets.csv');
  const crawlLines = ['brand_name,category,homepage_url,event_url,confidence'];
  for (const r of crawlReady) {
    crawlLines.push(
      `"${r.name}","${r.category}","${r.homepageUrl}","${r.eventUrl}","${r.confidence}"`
    );
  }
  fs.writeFileSync(crawlCsv, crawlLines.join('\n'), 'utf-8');

  console.log(`\n💾 전체 결과: ${csvOutput}`);
  console.log(`🎯 크롤링 대상: ${crawlCsv} (${crawlReady.length}개 브랜드)`);
}

main().catch(console.error);
