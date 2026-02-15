#!/usr/bin/env npx ts-node
/**
 * POPPON 크롤러 — API 기반 테스트
 * 
 * 클리오, 스타벅스 등 AJAX로 이벤트를 로딩하는 사이트의 API를 직접 호출
 * 
 * 사용법:
 *   npx ts-node scripts/test-crawl-api.ts
 *   npx ts-node scripts/test-crawl-api.ts --brand 스타벅스
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
  'Referer': '',
};

interface ApiDeal {
  title: string;
  imageUrl: string | null;
  landingUrl: string;
  startDate: string | null;
  endDate: string | null;
  source: string;
}

// ============================================================
// 스타벅스 — /whats_new/getIngList.do (진행 이벤트)
// ============================================================
async function fetchStarbucksEvents(): Promise<ApiDeal[]> {
  const deals: ApiDeal[] = [];
  const baseUrl = 'https://www.starbucks.co.kr';

  try {
    // 진행 이벤트 (전체)
    const res = await fetch(`${baseUrl}/whats_new/getIngList.do`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': `${baseUrl}/whats_new/campaign_list.do`,
      },
      body: 'MENU_CD=all&WEB_XPSR_YN=Y',
    });

    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status}`);
      return deals;
    }

    const data = await res.json();
    console.log(`  ✅ API 응답: ${JSON.stringify(data).substring(0, 200)}...`);

    if (data.list && Array.isArray(data.list)) {
      for (const item of data.list) {
        deals.push({
          title: item.title || item.TITLE || '제목 없음',
          imageUrl: item.img_UPLOAD_PATH
            ? `${item.img_UPLOAD_PATH}/upload/promotion/${item.web_THUM}`
            : null,
          landingUrl: `${baseUrl}/whats_new/campaign_view.do?pro_seq=${item.pro_SEQ}`,
          startDate: item.start_DT || null,
          endDate: item.end_DT || null,
          source: '스타벅스 API',
        });
      }
    }
  } catch (err) {
    console.log(`  ❌ 에러: ${(err as Error).message}`);
  }

  return deals;
}

// ============================================================
// 클리오 — API 엔드포인트 탐색
// ============================================================
async function fetchClioEvents(): Promise<ApiDeal[]> {
  const deals: ApiDeal[] = [];
  const baseUrl = 'https://clubclio.co.kr';

  // 클리오는 common.util.getControllerUrl() 패턴 사용
  // 일반적인 패턴: /event/eventLists 또는 /api/event/list
  const possibleEndpoints = [
    { url: `${baseUrl}/event/eventLists`, method: 'POST', body: 'orderBy=startDate&orderByType=desc&page=1&max=36&eventKind=A' },
    { url: `${baseUrl}/event/getEventList`, method: 'POST', body: 'orderBy=startDate&orderByType=desc&page=1&max=36&eventKind=A' },
    { url: `${baseUrl}/event/lists`, method: 'POST', body: 'orderBy=startDate&orderByType=desc&page=1&max=36&eventKind=A' },
    { url: `${baseUrl}/api/event/list`, method: 'GET', body: '' },
  ];

  for (const ep of possibleEndpoints) {
    try {
      console.log(`  🔍 시도: ${ep.method} ${ep.url}`);
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          ...HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': `${baseUrl}/event/eventList`,
        },
        body: ep.method === 'POST' ? ep.body : undefined,
        redirect: 'follow',
      });

      const contentType = res.headers.get('content-type') || '';
      console.log(`    → HTTP ${res.status} | Content-Type: ${contentType}`);

      if (res.ok && contentType.includes('json')) {
        const data = await res.json();
        console.log(`    → 데이터: ${JSON.stringify(data).substring(0, 300)}...`);

        // 일반적인 응답 구조 시도
        const list = data.list || data.data || data.events || data.result || (Array.isArray(data) ? data : null);
        if (list && Array.isArray(list)) {
          for (const item of list) {
            deals.push({
              title: item.event_title || item.title || item.eventTitle || item.name || '제목 없음',
              imageUrl: item.imgPath || item.image || item.thumbnail || null,
              landingUrl: item.landing_url || item.eventLink || `${baseUrl}/event/eventDetail/${item.idx || item.id || item.eventIdx}`,
              startDate: item.startDate || item.start_date || null,
              endDate: item.endDate || item.end_date || null,
              source: '클리오 API',
            });
          }
          console.log(`    ✅ ${deals.length}개 이벤트 발견!`);
          break; // 성공하면 중단
        }
      } else if (res.ok) {
        const text = await res.text();
        console.log(`    → 텍스트 (${text.length}bytes): ${text.substring(0, 200)}...`);
      }
    } catch (err) {
      console.log(`    → 실패: ${(err as Error).message}`);
    }
  }

  return deals;
}

// ============================================================
// BBQ — 모바일 URL 시도
// ============================================================
async function fetchBBQEvents(): Promise<ApiDeal[]> {
  const deals: ApiDeal[] = [];

  const urls = [
    'https://m.bbq.co.kr/brand/eventList.asp?event=OPEN',
    'https://www.bbq.co.kr/brand/eventList.asp?event=OPEN',
    'https://www.bbq.co.kr/event/eventList.asp',
  ];

  for (const url of urls) {
    try {
      console.log(`  🔍 시도: ${url}`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
        redirect: 'follow',
      });
      console.log(`    → HTTP ${res.status} | Final URL: ${res.url}`);

      if (res.ok) {
        const html = await res.text();
        console.log(`    → HTML ${(html.length / 1024).toFixed(1)}KB`);

        // 간단한 HTML 파싱으로 이벤트 확인
        const eventMatches = html.match(/eventView\.asp\?eidx=(\d+)/g);
        if (eventMatches) {
          console.log(`    ✅ 이벤트 링크 ${eventMatches.length}개 발견: ${eventMatches.slice(0, 3).join(', ')}`);
        }

        // 제목 추출 시도
        const titleMatches = html.match(/<(?:h[2-4]|strong|b)[^>]*>([^<]{5,100})<\//g);
        if (titleMatches) {
          console.log(`    → 제목 후보: ${titleMatches.slice(0, 3).map(t => t.replace(/<[^>]+>/g, '')).join(' | ')}`);
        }

        if (html.length > 1000) break; // 유효한 응답이면 중단
      }
    } catch (err) {
      console.log(`    → 실패: ${(err as Error).message}`);
    }
  }

  return deals;
}

// ============================================================
// 메인
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const brandArg = args.find(a => a.startsWith('--brand='))?.split('=')[1]
    || (args.indexOf('--brand') >= 0 ? args[args.indexOf('--brand') + 1] : null);

  console.log('🚀 POPPON API 기반 크롤러 테스트\n');
  console.log('='.repeat(70));

  const allResults: Array<{ brand: string; deals: ApiDeal[] }> = [];

  // 스타벅스
  if (!brandArg || brandArg === '스타벅스') {
    console.log('\n📡 [스타벅스] POST /whats_new/getIngList.do');
    console.log('-'.repeat(50));
    const deals = await fetchStarbucksEvents();
    allResults.push({ brand: '스타벅스', deals });
    if (deals.length > 0) {
      console.log(`\n  🎯 진행 이벤트 ${deals.length}개:`);
      for (const d of deals.slice(0, 10)) {
        console.log(`    • ${d.title}`);
        if (d.startDate || d.endDate) console.log(`      기간: ${d.startDate || '?'} ~ ${d.endDate || '?'}`);
        console.log(`      URL: ${d.landingUrl}`);
      }
    }
    await sleep(1500);
  }

  // 클리오
  if (!brandArg || brandArg === '클리오') {
    console.log('\n📡 [클리오] API 엔드포인트 탐색');
    console.log('-'.repeat(50));
    const deals = await fetchClioEvents();
    allResults.push({ brand: '클리오', deals });
    if (deals.length > 0) {
      console.log(`\n  🎯 이벤트 ${deals.length}개:`);
      for (const d of deals.slice(0, 10)) {
        console.log(`    • ${d.title}`);
        console.log(`      URL: ${d.landingUrl}`);
      }
    }
    await sleep(1500);
  }

  // BBQ
  if (!brandArg || brandArg === 'BBQ') {
    console.log('\n📡 [BBQ] URL 탐색');
    console.log('-'.repeat(50));
    const deals = await fetchBBQEvents();
    allResults.push({ brand: 'BBQ', deals });
    await sleep(1500);
  }

  // 요약
  console.log('\n' + '='.repeat(70));
  console.log('📊 결과 요약\n');
  for (const { brand, deals } of allResults) {
    console.log(`  ${brand}: ${deals.length}개 이벤트`);
  }

  console.log('\n💡 다음 단계:');
  console.log('  - API 성공한 사이트 → page_type을 "api_json"으로 변경, config에 endpoint 저장');
  console.log('  - API 실패한 사이트 → 브라우저 DevTools Network 탭에서 실제 API URL 확인');
  console.log('  - 403/봇차단 사이트 → Puppeteer(dynamic_js) 또는 수동 제보 전환');
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(console.error);
