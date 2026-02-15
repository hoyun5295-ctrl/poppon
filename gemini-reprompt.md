# 제미나이 재지시 — 구조화된 JSON으로 브랜드 이벤트 URL 수집

이전 리서치 보고서 잘 받았어. 분석은 훌륭했는데, 나한테 지금 필요한 건 **데이터베이스에 바로 넣을 수 있는 구조화된 JSON**이야. 보고서 형태가 아니라 **순수 JSON 데이터**로 다시 정리해줘.

## 출력 형식 (이 형식을 정확히 따라줘)

```json
[
  {
    "brand_name": "올리브영",
    "official_domain": "oliveyoung.co.kr",
    "event_hub_urls": [
      "https://www.oliveyoung.co.kr/store/main/getEventList.do",
      "https://www.oliveyoung.co.kr/store/main/getCouponList.do"
    ],
    "page_type": "dynamic_js",
    "top_category": "뷰티",
    "mid_category": "스킨케어/메이크업/헤어바디",
    "coupon_types_found": ["percent_off", "amount_off", "gift_with_purchase", "limited_time"],
    "update_frequency": "daily",
    "notes": "타임쿠폰 매일 10시/20시 발급, 오특 매일 0시 갱신, 동적 JS 렌더링"
  },
  {
    "brand_name": "쿠팡",
    "official_domain": "coupang.com",
    "event_hub_urls": [
      "https://www.coupang.com/np/goldbox",
      "https://www.coupang.com/np/coupangbenefit",
      "https://www.coupang.com/np/campaigns/83"
    ],
    "page_type": "dynamic_js",
    "top_category": "생활/리빙",
    "mid_category": "종합",
    "coupon_types_found": ["percent_off", "amount_off", "free_shipping", "member_only"],
    "update_frequency": "daily",
    "notes": "골드박스 매일 07시 갱신, 와우회원 전용 혜택 별도"
  }
]
```

## 반드시 포함해야 할 브랜드 (카테고리별 최소 8~15개, 총 120개 이상)

### 패션 (15개)
무신사, 29CM, W컨셉, SSF샵(삼성물산), 한섬(더한섬닷컴), 지그재그, 에이블리, 브랜디, ABC마트, 나이키코리아, 아디다스코리아, 유니클로코리아, 자라코리아, H&M코리아, 탑텐

### 뷰티 (10개)
올리브영, 시코르, 아모레퍼시픽몰(아모레몰), 이니스프리, 미샤, 클리오, 닥터지, 화해, 뷰티컬리, LG생활건강(생활건강몰)

### 식품/배달 (15개)
배달의민족, 요기요, 쿠팡이츠, 마켓컬리, SSG닷컴, 오아시스마켓, 스타벅스코리아, 투썸플레이스, 이디야, 메가커피, 버거킹코리아, 맥도날드코리아, 교촌치킨, BBQ, 도미노피자

### 생활/리빙 (12개)
쿠팡, 11번가, G마켓, 옥션, 위메프, 티몬, 오늘의집, 이케아코리아, 한샘, 다이소, 리바트, 데스커

### 디지털/가전 (10개)
삼성닷컴, LG전자(LGE닷컴), 하이마트, 전자랜드, 컴퓨존, 다나와, 애플코리아, 다이슨코리아, 소니코리아, 쿠쿠

### 여행/레저 (10개)
여기어때, 야놀자, 아고다, 트립닷컴, 인터파크투어, 하나투어, 모두투어, 클룩, 마이리얼트립, 에어비앤비

### 문화/콘텐츠 (12개)
CGV, 메가박스, 롯데시네마, 넷플릭스, 웨이브, 쿠팡플레이, 티빙, 멜론, YES24, 알라딘, 교보문고, 인터파크티켓

### 키즈/교육 (8개)
윤선생, 밀크T, 웅진씽크빅, 에듀윌, 메가스터디, 대교, 레고코리아, 키즈노트

### 건강/헬스 (8개)
닥터나우, 아이허브, GNM자연의품격, 종근당건강, 정관장, 필리, 오아시스마켓(건강), 올리브영(건강식품)

### 반려동물 (6개)
펫프렌즈, 바잇미, 핏펫, 퍼피런, 로얄캐닌코리아, 펫도매

### 자동차/주유 (8개)
SK에너지(EnClean), GS칼텍스, S-OIL, 현대오일뱅크, 타이어뱅크, 불스원, 카카오T, 쏘카

### 금융/통신 (10개)
삼성카드, 신한카드, KB국민카드, 현대카드, 토스, 카카오페이, 네이버페이, KT, SKT, LGU+

## 규칙

1. **실제 접속 가능한 URL만** 넣어. 추측 URL 절대 금지. 확인 안 되면 `event_hub_urls: []`로 비워두고 notes에 사유 기재.
2. **page_type** 값: `static_html` | `dynamic_js` | `login_required` | `app_only` | `mixed` 중 하나.
3. **coupon_types_found** 값: `percent_off`, `amount_off`, `bogo`, `free_shipping`, `gift_with_purchase`, `bundle_deal`, `clearance`, `member_only`, `new_user`, `app_only`, `limited_time` 중 선택.
4. **update_frequency** 값: `daily`, `weekly`, `biweekly`, `monthly`, `seasonal` 중 하나.
5. **top_category**: 패션, 뷰티, 식품/배달, 생활/리빙, 디지털/가전, 여행/레저, 문화/콘텐츠, 키즈/교육, 건강/헬스, 반려동물, 자동차/주유, 금융/통신 중 하나.
6. 전체를 하나의 JSON 배열 `[{...}, {...}, ...]`로 출력. 카테고리 구분은 top_category 필드로.
7. **마크다운이나 설명 텍스트 없이 순수 JSON만** 출력해.
