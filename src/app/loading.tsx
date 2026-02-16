export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 animate-pulse">
      {/* 히어로 */}
      <div className="py-8 sm:py-12 text-center">
        <div className="h-8 w-64 bg-surface-100 rounded-lg mx-auto mb-3" />
        <div className="h-4 w-80 bg-surface-100 rounded mx-auto" />
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-4 justify-center mb-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-surface-100" />
            <div className="h-3 w-10 bg-surface-100 rounded" />
          </div>
        ))}
      </div>

      {/* 딜 섹션 */}
      {[1, 2, 3].map(section => (
        <div key={section} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-32 bg-surface-100 rounded" />
            <div className="h-4 w-16 bg-surface-100 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(card => (
              <div key={card} className="bg-white rounded-xl border border-surface-100 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-100" />
                  <div className="h-3 w-16 bg-surface-100 rounded" />
                </div>
                <div className="h-4 w-full bg-surface-100 rounded mb-1.5" />
                <div className="h-4 w-3/4 bg-surface-100 rounded mb-3" />
                <div className="h-3 w-20 bg-surface-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
