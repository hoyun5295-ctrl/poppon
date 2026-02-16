import { DealModal } from '@/components/deal/DealModal';
import { DealDetailClient } from '@/components/deal/DealDetailClient';

interface ModalDealPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModalDealPage({ params }: ModalDealPageProps) {
  const { slug } = await params;

  return (
    <DealModal>
      <DealDetailClient slug={slug} isModal />
    </DealModal>
  );
}
