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
  // 실험적 기능
  experimental: {
    // 서버 액션 활성화
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
