import DealForm from '@/components/admin/DealForm';

export default function NewDealPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">새 딜 등록</h1>
      <DealForm mode="create" />
    </div>
  );
}
