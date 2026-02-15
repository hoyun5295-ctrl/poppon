import { getDealBySlug } from '@/lib/deals';
import { DealModal } from '@/components/deal/DealModal';
import { DealDetail } from '@/components/deal/DealDetail';

interface ModalDealPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModalDealPage({ params }: ModalDealPageProps) {
  const { slug } = await params;
  const result = await getDealBySlug(slug);

  if (!result) return null;

  return (
    <DealModal>
      <DealDetail deal={result.deal} isModal />
    </DealModal>
  );
}
