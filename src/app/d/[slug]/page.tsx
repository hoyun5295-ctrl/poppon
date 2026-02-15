import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDealBySlug } from '@/lib/deals';
import { DealDetail } from '@/components/deal/DealDetail';
import { APP_NAME } from '@/lib/constants';

interface DealPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getDealBySlug(slug);

  if (!result) {
    return { title: '딜을 찾을 수 없습니다' };
  }

  const { deal } = result;
  const title = `${deal.title} | ${deal.merchants?.name}`;
  const description = `${deal.merchants?.name} - ${deal.benefit_summary || deal.description || '할인 정보'}`;

  return {
    title,
    description: description.substring(0, 160),
    openGraph: {
      title: `${title} | ${APP_NAME}`,
      description: description.substring(0, 160),
      type: 'article',
      ...(deal.thumbnail_url && { images: [deal.thumbnail_url] }),
    },
  };
}

export default async function DealPage({ params }: DealPageProps) {
  const { slug } = await params;
  const result = await getDealBySlug(slug);

  if (!result) notFound();

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-8 pb-safe">
      <DealDetail deal={result.deal} />
    </div>
  );
}
