export default function MeLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-pulse">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-surface-100" />
        <div>
          <div className="h-4 w-24 bg-surface-100 rounded mb-1.5" />
          <div className="h-3 w-36 bg-surface-100 rounded" />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-4 border-b border-surface-200 mb-5">
        <div className="h-10 w-20 bg-surface-100 rounded" />
        <div className="h-10 w-16 bg-surface-100 rounded" />
        <div className="h-10 w-16 bg-surface-100 rounded" />
      </div>

      {/* 리스트 */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-surface-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
