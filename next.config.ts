import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 이미지 외부 도메인 허용 (브랜드 로고, 딜 썸네일 등)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // SEO: 트레일링 슬래시 통일
  trailingSlash: false,
  // 프로덕션 소스맵 비활성화
  productionBrowserSourceMaps: false,
  // Powered by 헤더 제거
  poweredByHeader: false,
  // KmcCrypto 바이너리 + gconv 모듈을 서버리스 함수에 포함
  outputFileTracingIncludes: {
    '/api/kmc/*': ['./bin/KmcCrypto', './bin/gconv/**/*'],
  },
  // 실험적 기능
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
