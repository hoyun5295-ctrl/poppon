# 제미나이 리서치 프롬프트 — POPPON 브랜드 이벤트 페이지 수집

아래 12개 카테고리별로 **한국에서 인기 있는 브랜드/플랫폼**의 이벤트·할인·쿠폰 페이지 URL을 조사해줘.

## 조사 대상 카테고리 (12개)

1. **패션**: 무신사, 29CM, W컨셉, SSF샵, 한섬, 지그재그, 에이블리, 브랜디, ABC마트, 나이키코리아, 아디다스코리아, 유니클로코리아, 자라코리아, H&M코리아, 탑텐
2. **뷰티**: 올리브영, 시코르, 아모레퍼시픽몰, 이니스프리, 미샤, 클리오, 닥터지, 셀리턴, 화해, 뷰티컬리
3. **식품/배달**: 배달의민족, 요기요, 쿠팡이츠, 버거킹, 맥도날드, 교촌치킨, BBQ, 도미노피자, 스타벅스, 투썸플레이스, 이디야, 메가커피, CU, GS25, 세븐일레븐, 마켓컬리, SSG닷컴, 오아시스마켓
4. **생활/리빙**: 오늘의집, 이케아코리아, 한샘, 다이소, 쿠팡, 11번가, G마켓, 옥션, 위메프, 티몬
5. **디지털/가전**: 삼성닷컴, LG전자, 쿠팡, 하이마트, 전자랜드, 컴퓨존, 다나와, 애플코리아
6. **여행/레저**: 여기어때, 야놀자, 아고다, 부킹닷컴, 트립닷컴, 인터파크투어, 하나투어, 모두투어, 클룩, 에어비앤비
7. **문화/콘텐츠**: CGV, 메가박스, 롯데시네마, 넷플릭스, 웨이브, 쿠팡플레이, 티빙, 왓챠, 멜론, 지니뮤직, YES24, 알라딘, 교보문고
8. **키즈/교육**: 아이챌린지, 윤선생, 밀크T, 웅진씽크빅, 에듀윌, 메가스터디, 대교, 레고코리아
9. **건강/헬스**: 닥터나우, 굿닥, 올리브영(건강), 아이허브, GNM자연의품격, 종근당건강, 정관장, 필리
10. **반려동물**: 펫프렌즈, 바잇미, 핏펫, 퍼피런, 로얄캐닌코리아
11. **자동차/주유**: SK에너지, GS칼텍스, S-OIL, 현대오일뱅크, 타이어뱅크, 불스원, 카카오T(주유)
12. **금융/통신**: 삼성카드, 신한카드, KB국민카드, 현대카드, 롯데카드, 토스, 카카오페이, 네이버페이, KT, SKT, LGU+, 알뜰폰(헬로모바일, 리브모바일)

## 각 브랜드별 조사 항목 (JSON 형태로 출력)

```json
{
  "brand_name": "올리브영",
  "official_domain": "oliveyoung.co.kr",
  "event_hub_urls": [
    "https://www.oliveyoung.co.kr/store/main/getEventList.do",
    "https://www.oliveyoung.co.kr/store/main/getCouponList.do"
  ],
  "page_type": "dynamic_js",
  "top_category": "뷰티",
  "mid_category": "스킨케어",
  "coupon_types_found": ["percent_off", "amount_off", "gift_with_purchase"],
  "update_frequency": "weekly",
  "notes": "이벤트 페이지 동적 렌더링, 쿠폰 다운로드는 로그인 필요"
}
```

## 조사 기준

1. **event_hub_urls**: 해당 브랜드의 "이벤트", "프로모션", "할인", "쿠폰" 등을 모아놓은 허브 페이지 URL을 1~3개 찾아줘.
   - 예: `/event`, `/promotion`, `/sale`, `/coupon`, `/benefit` 등의 경로
   - 메인 페이지가 아니라 **이벤트 목록이 나오는 페이지**를 찾아야 해

2. **page_type**: 페이지 기술 특성을 분류해줘
   - `static_html`: 서버 렌더링, HTML에 내용이 있음 (크롤링 쉬움)
   - `dynamic_js`: SPA/React/Vue 등 JS 렌더링 (Puppeteer 필요)
   - `login_required`: 로그인해야 이벤트가 보임
   - `mixed`: 일부는 정적, 일부는 동적

3. **coupon_types_found**: 해당 브랜드에서 주로 제공하는 혜택 유형
   - percent_off, amount_off, bogo, free_shipping, gift_with_purchase, bundle_deal, clearance, member_only, new_user, app_only

4. **update_frequency**: 이벤트 갱신 빈도 추정 (daily, weekly, biweekly, monthly, seasonal)

5. **notes**: 크롤링 시 주의사항, 특이사항, robots.txt 제한 여부 등

## 출력 형식

카테고리별로 묶어서 JSON 배열로 출력해줘. 총 브랜드 수는 **최소 100개 이상** 목표.

```json
{
  "category": "패션",
  "brands": [
    { "brand_name": "...", "official_domain": "...", ... },
    { "brand_name": "...", "official_domain": "...", ... }
  ]
}
```

## 중요

- **실제로 접속 가능한 URL**만 넣어줘. 추측 URL은 넣지 마.
- 이벤트 페이지가 없는 브랜드는 `event_hub_urls: []`로 표시하고 notes에 "이벤트 전용 페이지 없음, 메인에서 배너로 운영" 같이 써줘.
- 앱 전용 이벤트만 있는 경우에도 notes에 명시해줘.
