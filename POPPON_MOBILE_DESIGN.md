# 📱 POPPON 모바일 앱 설계도 (Expo Router)

> **작성**: 비토 (2026-02-20)
> **기준**: POPPON STATUS.md (2/20) + 웹 앱 실제 구조
> **목표**: 기존 Next.js 15 웹 앱을 Expo Router 기반 네이티브 앱으로 마이그레이션

---

## 1. 프로젝트 개요

### 1.1 새 프로젝트 정보
| 항목 | 값 |
|------|-----|
| 프로젝트명 | `poppon-app` |
| 경로 | `C:\projects\poppon-app` |
| 프레임워크 | Expo SDK 52+ / Expo Router v4 |
| 스타일링 | NativeWind v4 (Tailwind CSS for RN) |
| 상태관리 | Zustand (기존 웹과 동일) |
| DB/Auth | Supabase (기존 인스턴스 공유) |
| 배포 | EAS Build → App Store / Play Store |

### 1.2 기존 웹과의 관계
```
poppon (웹)       ← 유지. SEO + 데스크톱 접근용
poppon-app (앱)   ← 신규. 모바일 네이티브 경험
poppon-admin      ← 유지. 관리자 전용 (웹만)
```
- **DB는 동일한 Supabase 인스턴스** 공유 (RLS 정책 그대로 적용)
- **API는 Supabase 직접 호출** (웹의 Next.js API Route를 거치지 않음)
- 웹의 `/api/actions`, `/api/me/*` 등은 앱에서 Supabase Client로 직접 처리

### 1.3 기존 코드 재사용 범위
| 영역 | 재사용율 | 비고 |
|------|---------|------|
| `types/database.ts` | **100%** | 그대로 복사 |
| `lib/deals.ts` (쿼리 로직) | **90%** | server.ts → 앱용 client로 import 변경만 |
| `lib/utils/format.ts` | **100%** | 그대로 복사 |
| `lib/constants.ts` | **100%** | 그대로 복사 |
| `lib/tracking.ts` | **80%** | fetch URL을 Supabase 직접 insert로 변경 |
| Zustand 스토어 | **100%** | 그대로 복사 |
| UI 컴포넌트 | **0~20%** | 로직만 참고, JSX 전면 재작성 |
| 라우팅/페이지 | **0%** | 구조만 참고, 전면 재작성 |

---

## 2. 기술 스택 상세

### 2.1 핵심 패키지
```bash
# 프로젝트 생성
npx create-expo-app@latest poppon-app --template default

# 코어
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Supabase + 보안 저장소
npx expo install @supabase/supabase-js expo-secure-store expo-crypto
npx expo install @react-native-async-storage/async-storage
npx expo install aes-js react-native-get-random-values
# ⚠️ expo-secure-store 2KB 제한 → aes-js로 암호화 후 AsyncStorage에 저장, 키만 SecureStore

# 스타일링
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

# OAuth
npx expo install expo-auth-session expo-web-browser

# 푸시 알림
npx expo install expo-notifications expo-device expo-constants

# 유틸리티
npx expo install expo-clipboard expo-haptics expo-image expo-splash-screen
npx expo install react-native-gesture-handler @gorhom/bottom-sheet

# 카카오 로그인 (네이티브 SDK 옵션)
npm install @react-native-seoul/kakao-login
# 또는 expo-auth-session 기반 웹뷰 방식 (아래 OAuth 섹션 참고)
```

### 2.2 환경 변수 (.env)
```bash
# Expo는 EXPO_PUBLIC_ 접두사 필수
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# OAuth (카카오는 REST API Key 사용)
EXPO_PUBLIC_KAKAO_REST_API_KEY=xxxxxxxx
EXPO_PUBLIC_NAVER_CLIENT_ID=xxxxxxxx

# 앱 식별
EXPO_PUBLIC_APP_SCHEME=poppon
```

### 2.3 app.json (핵심 설정)
```json
{
  "expo": {
    "name": "팝폰 - 할인 쿠폰 모아보기",
    "slug": "poppon",
    "scheme": "poppon",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "resizeMode": "contain" },
    "ios": {
      "bundleIdentifier": "kr.poppon.app",
      "supportsTablet": false,
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["kakaokompassauth", "kakaolink", "kakaotalk"],
        "CFBundleURLTypes": [{
          "CFBundleURLSchemes": ["kakao{NATIVE_APP_KEY}", "poppon"]
        }],
        "NSAppTransportSecurity": { "NSAllowsArbitraryLoads": true }
      }
    },
    "android": {
      "package": "kr.poppon.app",
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png" },
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "poppon" }, { "scheme": "https", "host": "poppon.kr" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }],
      "expo-apple-authentication"
    ]
  }
}
```

---

## 3. 폴더 구조 (1:1 매핑 + 모바일 전용)

### 3.1 전체 구조
```
poppon-app/
├── app/                          # ← Expo Router 라우트 (= Next.js src/app/)
│   ├── _layout.tsx               # 루트 레이아웃 (Stack Navigator)
│   ├── (tabs)/                   # 하단 탭 그룹
│   │   ├── _layout.tsx           # Tab Navigator 정의
│   │   ├── index.tsx             # 홈 (= web src/app/page.tsx)
│   │   ├── categories.tsx        # 카테고리 허브 (= web c/[categorySlug])
│   │   ├── search.tsx            # 검색 (= web search/page.tsx)
│   │   └── me.tsx                # 마이페이지 (= web me/page.tsx)
│   ├── d/
│   │   └── [slug].tsx            # 딜 상세 모달 (= web @modal/(.)d/[slug] + d/[slug])
│   ├── m/
│   │   └── [merchantSlug].tsx    # 브랜드관 (= web m/[merchantSlug])
│   ├── c/
│   │   └── [categorySlug].tsx    # 카테고리 상세 (= web c/[categorySlug])
│   ├── auth/
│   │   ├── _layout.tsx           # Auth 스택 (헤더 숨김)
│   │   ├── index.tsx             # 로그인 메인 (= web auth/page.tsx)
│   │   ├── signup.tsx            # 이메일 가입 플로우
│   │   ├── onboarding.tsx        # SNS 가입 후 온보딩 (카테고리+마케팅)
│   │   └── callback.tsx          # OAuth 콜백 핸들러
│   ├── submit.tsx                # 제보하기 (= web submit/page.tsx)
│   ├── legal/
│   │   ├── privacy.tsx           # 개인정보처리방침
│   │   ├── terms.tsx             # 이용약관
│   │   └── marketing.tsx         # 마케팅 수신동의
│   └── +not-found.tsx            # 404
│
├── src/                          # 비-라우트 코드
│   ├── components/
│   │   ├── deal/
│   │   │   ├── DealCard.tsx      # 딜 카드 (View/Text 재작성)
│   │   │   ├── DealGrid.tsx      # 딜 그리드 (FlatList 기반)
│   │   │   ├── DealShelf.tsx     # 수평 스크롤 (ScrollView horizontal)
│   │   │   ├── DealDetail.tsx    # 딜 상세 콘텐츠
│   │   │   ├── CopyCodeButton.tsx # 쿠폰 복사 (expo-clipboard)
│   │   │   └── DealActionBar.tsx # 저장/브랜드관/구독 액션
│   │   ├── merchant/
│   │   │   ├── MerchantDealTabs.tsx
│   │   │   └── FollowButton.tsx
│   │   ├── category/
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── CategoryTabBar.tsx
│   │   │   ├── CategoryIcon.tsx
│   │   │   └── SubCategoryChips.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx     # 검색바 (TextInput)
│   │   │   └── SearchFilters.tsx
│   │   ├── auth/
│   │   │   └── SocialLoginButtons.tsx  # 카카오/네이버/애플 버튼
│   │   ├── common/
│   │   │   ├── Toast.tsx         # react-native-toast-message
│   │   │   ├── Pagination.tsx    # 무한스크롤로 대체 (FlatList onEndReached)
│   │   │   ├── SortDropdown.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   └── layout/
│   │       └── TopProgressBar.tsx # 앱 상단 로딩 인디케이터
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts         # 🔑 앱용 Supabase 싱글톤 (SecureStore 기반)
│   │   ├── deals.ts              # 딜 쿼리 (웹에서 복사 + import 수정)
│   │   ├── tracking.ts           # 행동 추적 (Supabase 직접 insert)
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx  # 인증 컨텍스트
│   │   │   ├── kakao.ts         # 카카오 OAuth 헬퍼
│   │   │   ├── naver.ts         # 네이버 OAuth 헬퍼
│   │   │   └── apple.ts         # 애플 로그인 헬퍼
│   │   ├── push/
│   │   │   └── notifications.ts  # 푸시 알림 등록/관리
│   │   └── utils/
│   │       └── format.ts         # 그대로 복사
│   ├── types/
│   │   ├── database.ts           # 그대로 복사
│   │   └── index.ts
│   ├── stores/                   # Zustand 스토어
│   │   └── useAuthStore.ts
│   └── constants/
│       └── index.ts              # 카테고리, 딜타입 등
│
├── assets/                       # 이미지, 폰트, 아이콘
│   ├── fonts/
│   │   └── Pretendard-*.otf      # 기존 웹과 동일 폰트
│   └── images/
├── .env
├── app.json
├── tailwind.config.js            # NativeWind 설정
├── tsconfig.json
└── package.json
```

### 3.2 웹 → 앱 라우팅 1:1 매핑 상세

| 웹 (Next.js) | 앱 (Expo Router) | 네비게이션 타입 | 비고 |
|--------------|-----------------|---------------|------|
| `src/app/layout.tsx` | `app/_layout.tsx` | Root Stack | AuthProvider + Toast + SplashScreen |
| `src/app/page.tsx` | `app/(tabs)/index.tsx` | Tab (홈) | 실시간 브랜드/딜 수치 + 새딜알림 CTA |
| `src/app/search/page.tsx` | `app/(tabs)/search.tsx` | Tab (검색) | TextInput + FlatList |
| `src/app/me/page.tsx` | `app/(tabs)/me.tsx` | Tab (마이) | 환영메시지 + 구독2열 + 추천브랜드 |
| *(웹에 없음)* | `app/(tabs)/categories.tsx` | Tab (카테고리) | **6개 카테고리 그리드 → 서브카테고리** |
| `src/app/@modal/(.)d/[slug]` | `app/d/[slug].tsx` | **Stack Modal** | `presentation: 'transparentModal'` |
| `src/app/d/[slug]/page.tsx` | *(위와 동일 파일)* | ― | 앱에서는 모달 하나로 통합 |
| `src/app/m/[merchantSlug]` | `app/m/[merchantSlug].tsx` | Stack Push | 브랜드관 전체화면 |
| `src/app/c/[categorySlug]` | `app/c/[categorySlug].tsx` | Stack Push | 카테고리별 딜 목록 |
| `src/app/auth/page.tsx` | `app/auth/index.tsx` | Stack (헤더 숨김) | 소셜로그인 + 이메일 |
| `src/app/submit/page.tsx` | `app/submit.tsx` | Stack Push | 딜 제보 |
| `src/app/legal/*` | `app/legal/*.tsx` | Stack Push | 앱스토어 심사 필수 |
| `src/app/out/[dealId]/route.ts` | *(라우트 없음)* | ― | `Linking.openURL()` 함수로 대체 |
| `src/app/api/*` | *(라우트 없음)* | ― | Supabase Client 직접 호출로 대체 |

---

## 4. 네비게이션 설계 상세

### 4.1 Root Layout (`app/_layout.tsx`)
```
<Root Stack Navigator>
  ├── (tabs)                    # 메인 하단 탭 (탭바 표시)
  ├── d/[slug]                  # 딜 상세 모달 ← presentation: 'transparentModal'
  ├── m/[merchantSlug]          # 브랜드관 ← Stack Push (전체화면)
  ├── c/[categorySlug]          # 카테고리 상세 ← Stack Push
  ├── auth (group)              # 로그인/회원가입 ← presentation: 'modal'
  ├── submit                    # 제보하기 ← Stack Push
  └── legal (group)             # 법적 페이지 ← Stack Push
```

### 4.2 하단 탭 구성 (`app/(tabs)/_layout.tsx`)
```
<Bottom Tab Navigator>
  ├── 🏠 홈          (tabs)/index.tsx        아이콘: Home
  ├── 🏷️ 카테고리    (tabs)/categories.tsx   아이콘: Grid
  ├── 🔍 검색        (tabs)/search.tsx       아이콘: Search
  └── 👤 마이        (tabs)/me.tsx           아이콘: User
```

**탭 구성 근거:**
- 제미나이는 "제보하기"를 탭에 넣었으나 → 사용 빈도 낮음. 마이페이지 내 또는 스택 push로 충분
- **카테고리를 탭에 넣는 이유**: 패션/뷰티/식품 등 6개 카테고리 탐색이 POPPON의 핵심 UX
- 4탭이 모바일 최적 (5개 이상은 복잡해짐)

### 4.3 딜 상세 모달 처리 (핵심 난이도)

**웹 현재 구조:**
```
홈/카테고리/검색 → DealCard 클릭 → @modal/(.)d/[slug] (인터셉팅 모달, 뒤에 리스트 보임)
직접 URL 접근 → d/[slug]/page.tsx (풀 페이지)
```

**앱 구현 전략:**
```
어디서든 DealCard 탭 → router.push('/d/[slug]') → transparentModal로 표시
```

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="d/[slug]"
        options={{
          presentation: 'transparentModal',  // 뒤 화면 반투명으로 보임
          headerShown: false,
          animation: 'slide_from_bottom',     // 아래에서 올라오는 모달
          gestureEnabled: true,               // 아래로 스와이프 닫기
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen name="m/[merchantSlug]" options={{ headerShown: true }} />
      <Stack.Screen name="c/[categorySlug]" options={{ headerShown: true }} />
      <Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="submit" />
      <Stack.Screen name="legal" options={{ headerShown: true }} />
    </Stack>
  );
}
```

**투명 모달 구현:**
```tsx
// app/d/[slug].tsx
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DealDetail from '@/src/components/deal/DealDetail';

export default function DealModal() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      {/* 반투명 배경 탭 → 닫기 */}
      <Pressable
        className="absolute inset-0 bg-black/50"
        onPress={() => router.back()}
      />

      {/* 모달 본체 - 화면 85% 높이 */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"
        style={{ height: '85%', paddingBottom: insets.bottom }}
      >
        {/* 드래그 핸들 */}
        <View className="items-center py-3">
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <DealDetail slug={slug} />
        </ScrollView>
      </View>
    </View>
  );
}
```

**웹의 `position: fixed + top: -scrollY` 패턴이 필요 없는 이유:**
React Native의 Modal은 네이티브 레이어에서 동작하므로 스크롤 잠금이 자동으로 처리됨.

---

## 5. 인증/OAuth 설계 (가장 큰 난관)

### 5.1 Supabase Client 초기화 (SecureStore 기반)

```tsx
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';
import { AppState } from 'react-native';
import { Database } from '@/src/types/database';

// Supabase 세션은 2KB 초과 → SecureStore 직접 저장 불가
// → aes-js로 암호화 후 AsyncStorage에 저장, 암호화 키만 SecureStore에 보관
class LargeSecureStore {
  private async _encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    return await this._decrypt(key, encrypted);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this._encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // ⚠️ 앱에서는 반드시 false
  },
});

// 앱 포그라운드/백그라운드 전환 시 세션 자동 갱신
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

**⚠️ 웹과의 차이점:**
- 웹: `createServerSupabaseClient` (쿠키 기반) + `createServiceClient` (서버용)
- 앱: 클라이언트 하나만. `LargeSecureStore`로 세션 암호화 저장
- `detectSessionInUrl: false` 필수 (앱에서는 URL로 세션 전달하지 않음)

### 5.2 카카오 OAuth 플로우

**방식 A: Supabase OAuth 프로바이더 활용 (권장)**
```
현재 웹에서 Supabase에 카카오 프로바이더가 설정되어 있으므로,
앱에서도 Supabase의 signInWithOAuth를 사용하되,
리다이렉트를 앱의 딥링크로 받는 방식.
```

```tsx
// src/lib/auth/kakao.ts
import { supabase } from '@/src/lib/supabase/client';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithKakao() {
  const redirectTo = makeRedirectUri({ scheme: 'poppon', path: 'auth/callback' });
  // → "poppon://auth/callback"

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo,
      skipBrowserRedirect: true,  // ← 자동 리다이렉트 막고 URL만 받기
    },
  });

  if (error || !data.url) throw error;

  // 인앱 브라우저로 카카오 로그인 페이지 열기
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,          // Supabase → 카카오 로그인 페이지 URL
    redirectTo,        // 완료 후 돌아올 딥링크
    { showInRecents: true }
  );

  if (result.type === 'success' && result.url) {
    // 딥링크 URL에서 토큰 추출
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.substring(1)); // #access_token=...
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return sessionData;
    }
  }

  return null;
}
```

**방식 B: 네이티브 카카오 SDK (더 나은 UX, 복잡도 높음)**
```
@react-native-seoul/kakao-login 사용
카카오톡 앱이 설치되어 있으면 → 카카오톡 앱으로 자동 전환
설치 안 되어 있으면 → 웹뷰 폴백
```
→ Phase 1에서는 방식 A로 시작, 사용감 피드백 후 방식 B 고려

### 5.3 네이버 OAuth 플로우

웹에서 수동 OAuth 플로우(admin.createUser + generateLink + verifyOtp)를 사용 중이므로,
앱에서도 동일한 패턴을 적용.

```tsx
// src/lib/auth/naver.ts
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/lib/supabase/client';

const NAVER_AUTH_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

export async function signInWithNaver() {
  const redirectUri = Linking.createURL('auth/callback/naver');
  const state = Math.random().toString(36).substring(7);
  const clientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID!;

  const authUrl = `${NAVER_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'success' && result.url) {
    const url = new URL(result.url);
    const code = url.searchParams.get('code');

    if (code) {
      // ⚠️ 네이버 토큰 교환 → 프로필 조회 → Supabase 세션 생성
      // 이 부분은 서버 사이드가 필요하므로 poppon 웹의 API를 호출하거나
      // Supabase Edge Function을 만들어야 함
      const response = await fetch('https://poppon.vercel.app/api/auth/naver/mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = await response.json();
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }
    }
  }
}
```

**⚠️ 네이버 OAuth 앱 전용 API 필요:**
웹의 `/api/auth/naver/route.ts`에 모바일 전용 엔드포인트 추가 필요.
네이버는 client_secret이 필요하므로 토큰 교환을 클라이언트에서 할 수 없음.

### 5.4 애플 로그인 (앱스토어 필수)

소셜 로그인을 제공하는 iOS 앱은 **반드시 Apple Sign In을 포함**해야 함 (App Store 심사 규정).

```tsx
// src/lib/auth/apple.ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/src/lib/supabase/client';

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (credential.identityToken) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
    return data;
  }

  return null;
}
```

**⚠️ Supabase 대시보드에서 Apple 프로바이더 설정 필요:**
- Apple Developer Portal에서 Service ID 생성
- Supabase Auth → Apple Provider → Service ID + Secret Key 설정

### 5.5 회원가입 플로우 (앱 버전)

웹의 AuthSheet 5단계 → 앱에서는 전체화면 스택으로 전환:

```
[로그인 화면]
  ├── 카카오 로그인 → OAuth → 신규? → 온보딩 (카테고리 → 마케팅)
  ├── 네이버 로그인 → OAuth → 신규? → 온보딩
  ├── 애플 로그인 → IdToken → 신규? → 온보딩
  └── 이메일 가입 → 이메일/비밀번호 → 프로필(닉네임/성별/생년) → 카테고리 → 마케팅 → 완료
```

**핵심 보존 사항:**
- 웹의 "signUp 지연" 패턴 유지: marketing 스텝에서 signUp + profile 일괄 저장
- `saveProviderProfile v2` 로직 유지: `app_metadata.providers` 기반 linked_providers 동기화
- `interest_categories`, `marketing_agreed` 컬럼명 정확히 사용

### 5.6 로그아웃

```tsx
// 웹: 서버사이드 API (/api/auth/signout) + <a> 태그
// 앱: Supabase client 직접 호출
await supabase.auth.signOut();
router.replace('/(tabs)');
```

---

## 6. 클릭 트래킹 + 아웃바운드 처리

### 6.1 웹의 `out/[dealId]` 대체

웹에서는 `GET /out/:dealId` → 서버에서 클릭 로그 → 302 리다이렉트.
앱에서는 이 플로우를 2단계로 분리:

```tsx
// src/lib/tracking.ts

import { supabase } from '@/src/lib/supabase/client';
import * as Linking from 'expo-linking';

export async function trackAndOpen(deal: {
  id: string;
  landing_url: string;
  affiliate_url?: string;
}) {
  const targetUrl = deal.affiliate_url || deal.landing_url;

  // 1단계: 행동 기록 (비동기, 안 기다림)
  supabase
    .from('deal_actions')
    .insert({
      deal_id: deal.id,
      action_type: 'click_out',
      session_id: getSessionId(),  // AsyncStorage에서 ppn_sid 관리
    })
    .then(() => {}, () => {});

  // outbound_clicks도 기록
  supabase
    .from('outbound_clicks')
    .insert({ deal_id: deal.id })
    .then(() => {}, () => {});

  // click_out_count 증가
  supabase.rpc('increment_click_count', { deal_id: deal.id })
    .then(() => {}, () => {});

  // 2단계: 외부 브라우저로 열기
  const canOpen = await Linking.canOpenURL(targetUrl);
  if (canOpen) {
    await Linking.openURL(targetUrl);
  }
}
```

### 6.2 CopyCodeButton (쿠폰 코드 복사)

```tsx
// src/components/deal/CopyCodeButton.tsx

import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity, Text } from 'react-native';

export function CopyCodeButton({ code, dealId }: { code: string; dealId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);

    // 행동 추적
    supabase.from('deal_actions').insert({
      deal_id: dealId,
      action_type: 'copy_code',
      session_id: getSessionId(),
    }).then(() => {}, () => {});

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TouchableOpacity onPress={handleCopy} className="bg-primary px-4 py-3 rounded-lg">
      <Text className="text-white font-bold text-center">
        {copied ? '복사 완료! ✓' : `${code} 복사하기`}
      </Text>
    </TouchableOpacity>
  );
}
```
- `expo-clipboard`: 네이티브 클립보드 API
- `expo-haptics`: 복사 시 진동 피드백 (네이티브 느낌 강화)

---

## 7. 푸시 알림 설계

### 7.1 아키텍처
```
[앱 설치/로그인]
  → expo-notifications로 ExpoPushToken 발급
  → profiles 테이블에 push_token 컬럼 추가 저장
  → 서버(추후)에서 토큰 기반 푸시 발송

[알림 유형]
  1. 구독 브랜드 새 딜 알림   ← followed_merchants + 새 딜 감지
  2. 관심 카테고리 인기 딜     ← interest_categories + trending_score
  3. 저장한 딜 만료 임박 알림  ← saved_deals + ends_at 24시간 전
  4. 마케팅 알림              ← marketing_agreed=true인 유저만
```

### 7.2 토큰 등록
```tsx
// src/lib/push/notifications.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase/client';

// 알림 표시 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return null; // 시뮬레이터 제외

  // Android 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('deals', {
      name: '딜 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#FF6B35',  // POPPON 브랜드 컬러
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  // DB에 토큰 저장
  await supabase
    .from('profiles')
    .update({
      push_token: token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return token;
}
```

### 7.3 DB 스키마 변경 필요
```sql
-- profiles 테이블에 추가
ALTER TABLE profiles ADD COLUMN push_token text;
ALTER TABLE profiles ADD COLUMN push_token_updated_at timestamptz;
ALTER TABLE profiles ADD COLUMN push_enabled boolean DEFAULT true;
```

### 7.4 알림 탭 시 딥링크 처리
```tsx
// app/_layout.tsx 내부

useEffect(() => {
  // 앱이 열려있을 때 알림 탭
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data.dealSlug) {
      router.push(`/d/${data.dealSlug}`);
    } else if (data.merchantSlug) {
      router.push(`/m/${data.merchantSlug}`);
    }
  });

  return () => subscription.remove();
}, []);
```

---

## 8. 스타일링 전환 (Tailwind CSS → NativeWind)

### 8.1 NativeWind 설정
```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{tsx,ts}',
    './src/**/*.{tsx,ts}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',    // POPPON 브랜드 컬러 (확인 필요)
        secondary: '#1A1A2E',
      },
      fontFamily: {
        pretendard: ['Pretendard-Regular'],
        'pretendard-bold': ['Pretendard-Bold'],
        'pretendard-medium': ['Pretendard-Medium'],
      },
    },
  },
};
```

### 8.2 주요 변환 패턴
| 웹 (Next.js + Tailwind) | 앱 (React Native + NativeWind) |
|------------------------|-------------------------------|
| `<div className="flex">` | `<View className="flex">` |
| `<span className="text-sm">` | `<Text className="text-sm">` |
| `<img src={url} className="w-20">` | `<Image source={{ uri: url }} className="w-20 h-20">` ⚠️ 높이 필수 |
| `<a href="/d/123">` | `<Link href="/d/123">` (expo-router) |
| `<button onClick={fn}>` | `<TouchableOpacity onPress={fn}>` 또는 `<Pressable>` |
| `overflow-y-auto` | `<ScrollView>` 또는 `<FlatList>` |
| `grid grid-cols-2` | `<FlatList numColumns={2}>` |
| `position: fixed` | 네이티브 모달/바텀시트 사용 |
| `window.scrollY` | 필요 없음 (네이티브 스크롤) |
| `sessionStorage` | `AsyncStorage` |
| `navigator.clipboard` | `expo-clipboard` |

### 8.3 ⚠️ NativeWind 제한사항
- `hover:`, `group-hover:` → 모바일에 hover 없음. `active:` 또는 `Pressable` 사용
- `grid` → `FlatList numColumns` 또는 `flex-row flex-wrap`
- `backdrop-blur` → 제한적. `react-native-blur` 별도 설치 필요
- CSS 애니메이션 → `react-native-reanimated` 사용
- `gap` → NativeWind v4에서 지원하나 호환성 확인 필요

---

## 9. 리스트 성능 (FlatList 전략)

웹의 `DealGrid` / `DealShelf`는 일반 `<div>` + `map()`이지만,
앱에서는 반드시 **FlatList**로 가상화해야 함.

### 9.1 DealGrid → FlatList 변환
```tsx
// 웹 (참고용)
<div className="grid grid-cols-2 gap-3">
  {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
</div>

// 앱
<FlatList
  data={deals}
  numColumns={2}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <DealCard deal={item} />}
  columnWrapperStyle={{ gap: 12 }}
  contentContainerStyle={{ padding: 16 }}
  onEndReached={loadMore}           // 무한 스크롤 (Pagination 대체)
  onEndReachedThreshold={0.5}
  ListFooterComponent={loading ? <ActivityIndicator /> : null}
  ListEmptyComponent={<EmptyState />}
/>
```

### 9.2 웹의 Pagination → 무한 스크롤
웹에서 `<Pagination>` 컴포넌트로 페이지 전환했던 것을
앱에서는 `FlatList.onEndReached` + 커서 기반 무한 스크롤로 전환.

```tsx
const [deals, setDeals] = useState<Deal[]>([]);
const [cursor, setCursor] = useState<string | null>(null);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (!hasMore) return;
  let query = supabase.from('deals').select('*').eq('status', 'active').limit(20);
  if (cursor) query = query.lt('created_at', cursor);
  const { data } = await query;
  if (data && data.length > 0) {
    setDeals(prev => [...prev, ...data]);
    setCursor(data[data.length - 1].created_at);
  }
  if (!data || data.length < 20) setHasMore(false);
};
```

---

## 10. 개발 타임라인 (현실적)

### Phase M1: 기반 구축 (1주차)
- [ ] Expo 프로젝트 생성 + NativeWind + Supabase Client 설정
- [ ] `types/`, `lib/utils/`, `constants/` 코드 복사
- [ ] Root Layout + Tab Navigator + 기본 화면 스켈레톤
- [ ] Supabase 딜 데이터 fetch + DealCard 기본형
- [ ] 딜 상세 모달 (transparentModal) 프로토타입

### Phase M2: 핵심 기능 (2주차)
- [ ] 홈 화면 (DealShelf + 실시간 수치)
- [ ] 카테고리 탭 + 카테고리별 딜 목록
- [ ] 검색 (TextInput + FlatList + 무한스크롤)
- [ ] 브랜드관 (m/[merchantSlug])
- [ ] DealCard → DealDetail 전체 구현 (타입별 CTA)

### Phase M3: 인증 + 사용자 기능 (3주차)
- [ ] 카카오 OAuth (Supabase + WebBrowser)
- [ ] 네이버 OAuth (수동 플로우 + 서버 API)
- [ ] 애플 로그인 (expo-apple-authentication)
- [ ] 회원가입 온보딩 (카테고리 선택 + 마케팅 동의)
- [ ] 마이페이지 (저장된 딜 + 구독 브랜드 + 프로필)
- [ ] 딜 저장/해제, 브랜드 구독/해제

### Phase M4: 마무리 + 심사 준비 (4주차)
- [ ] 푸시 알림 등록 + 딥링크 처리
- [ ] 행동 추적 (deal_view, click_out, copy_code, save, search)
- [ ] 제보하기 화면
- [ ] 법적 페이지 3종 (privacy, terms, marketing)
- [ ] 스플래시 + 아이콘 + 스크린샷
- [ ] EAS Build → TestFlight / 내부 테스트
- [ ] App Store + Play Store 제출

### Phase M5: 심사 대응 (1~2주)
- [ ] Apple 심사 피드백 대응 (보통 1~3회 리젝)
- [ ] Google 심사 (보통 빠름, 1~3일)

**총 예상: 4~6주** (심사 기간 포함)

---

## 11. 앱 전용 DB 변경 사항

```sql
-- 1. 푸시 알림 토큰
ALTER TABLE profiles ADD COLUMN push_token text;
ALTER TABLE profiles ADD COLUMN push_token_updated_at timestamptz;
ALTER TABLE profiles ADD COLUMN push_enabled boolean DEFAULT true;

-- 2. 디바이스 정보 (선택, 분석용)
ALTER TABLE profiles ADD COLUMN device_os text;        -- 'ios' | 'android'
ALTER TABLE profiles ADD COLUMN app_version text;

-- 3. deal_actions에 platform 구분 (웹/앱 행동 분리 분석용)
ALTER TABLE deal_actions ADD COLUMN platform text DEFAULT 'web';
-- 앱에서 insert 시 platform: 'app' 전달
```

---

## 12. 앱스토어 심사 체크리스트

### iOS (Apple)
- [ ] 애플 로그인 필수 포함 (소셜 로그인 제공 시)
- [ ] 개인정보처리방침 URL (앱 내 + App Store Connect)
- [ ] 이용약관 URL
- [ ] 스크린샷 6.7" + 6.5" + 5.5" (최소)
- [ ] 앱 설명 한국어
- [ ] `NSAppTransportSecurity` 설정
- [ ] 데이터 수집 항목 정확히 기재 (App Privacy)
- [ ] 심사용 테스트 계정 제공

### Android (Google)
- [ ] 개인정보처리방침 URL
- [ ] 콘텐츠 등급 설문
- [ ] 데이터 안전 섹션 (Data Safety)
- [ ] 타겟 연령 설정
- [ ] 스크린샷 + 기능 그래픽

---

## 13. ⚠️ 주의사항 / 예상 이슈

### Supabase 관련
- `detectSessionInUrl: false` 반드시 설정 (앱에서 URL 기반 세션 감지 불가)
- 웹의 `createServerSupabaseClient` / `createServiceClient` → 앱에서 사용 불가. 앱용 싱글톤만 사용
- RLS 정책은 웹과 동일하게 적용됨 (anon key 사용)
- `deal_actions` insert 시: 웹은 `createServiceClient`(RLS 우회), 앱은 anon key → **deal_actions RLS에 anon INSERT 정책 추가 필요**

### OAuth 관련
- 카카오 개발자 포털에 앱 플랫폼(iOS/Android) 등록 필수
- 카카오 Redirect URI에 `poppon://auth/callback` 추가
- 네이버 개발자 포털에도 동일하게 앱 등록
- Supabase Redirect URLs에 `poppon://auth/callback` 추가 필수
- Apple Developer 연회비 $99 필요 (Apple 로그인 + 앱스토어 배포)

### React Native 관련
- `<Image>`에 width/height 필수 (웹과 달리 auto-sizing 안 됨)
- `<Text>`는 반드시 `<Text>` 안에만 텍스트 → `<View>` 안에 직접 문자열 불가
- `overflow: 'hidden'` + `borderRadius`로 이미지 라운딩
- 한글 slug: `decodeURIComponent` 웹과 동일하게 필요
- `expo-image` 권장 (기본 `<Image>`보다 캐싱/성능 우수)

### 웹 앱과의 동기화
- 웹에서 저장한 딜 → 앱에서도 보임 (같은 DB)
- 웹에서 구독한 브랜드 → 앱에서도 보임
- 웹에서 로그인한 세션 ≠ 앱 세션 (별도 로그인 필요)

---

## 14. 참고: 앱 전용 추가 기능 (향후)

| 기능 | 설명 | 우선순위 |
|------|------|---------|
| 푸시 알림 발송 서버 | Supabase Edge Function 또는 별도 서버 | Phase M5+ |
| 오프라인 모드 | 최근 본 딜 로컬 캐싱 | 낮음 |
| 앱 내 WebView | 외부 쇼핑몰을 앱 내에서 열기 (옵션) | 중간 |
| 위젯 (iOS/Android) | 오늘의 인기 딜 위젯 | 낮음 |
| 공유 기능 | 딜 카드를 카카오톡/인스타 공유 | 중간 |
| 앱 업데이트 강제 | 최소 버전 체크 + 스토어 유도 | Phase M5+ |

---

*이 설계도는 POPPON STATUS.md (2/20 기준)의 실제 DB 스키마, 인증 플로우, 컴포넌트 구조를 기반으로 작성되었습니다.*
*실제 구현 시 각 Phase별로 상세 코드 작업을 진행합니다.*
