import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // POPPON 브랜드 컬러
        primary: {
          50: '#FFF1F0',
          100: '#FFE0DE',
          200: '#FFC7C2',
          300: '#FFA099',
          400: '#FF6B5E',
          500: '#FF4133', // 메인 레드-오렌지
          600: '#E6291C',
          700: '#C01E13',
          800: '#9A1A12',
          900: '#7D1A14',
          950: '#440906',
        },
        accent: {
          50: '#FFF8ED',
          100: '#FFF0D4',
          200: '#FFDCA9',
          300: '#FFC272',
          400: '#FF9F39',
          500: '#FF8412', // 서브 오렌지
          600: '#F06808',
          700: '#C74E09',
          800: '#9E3D10',
          900: '#7F3410',
          950: '#451806',
        },
        // 중립 그레이
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
