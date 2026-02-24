import type { Metadata } from 'next';
import { SEO_DEFAULTS, APP_NAME } from '@/lib/constants';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import { SourceProtection } from '@/components/layout/SourceProtection';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { AuthSheet } from '@/components/auth/AuthSheet';
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Toast } from '@/components/common/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: SEO_DEFAULTS.title,
    template: `%s | ${APP_NAME}`,
  },
  description: SEO_DEFAULTS.description,
  openGraph: {
    ...SEO_DEFAULTS.openGraph,
    title: SEO_DEFAULTS.title,
    description: SEO_DEFAULTS.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <TopProgressBar />
          <SourceProtection />
          <Toast />
          <TopNav />
          <main className="flex-1 animate-fade-in">
            {children}
          </main>
          {modal}
          <Footer />
          {/* 가입/로그인 바텀시트 (전역) */}
          <AuthSheet />
        </AuthProvider>
      </body>
    </html>
  );
}
