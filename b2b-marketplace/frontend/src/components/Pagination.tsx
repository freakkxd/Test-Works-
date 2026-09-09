interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2,
  );

  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
      >
        ←
      </button>

      {visiblePages.map((page, idx) => {
        const prev = visiblePages[idx - 1];
        const showEllipsis = prev && page - prev > 1;

        return (
          <span key={page} className="flex gap-2">
            {showEllipsis && <span className="px-2 py-2">...</span>}
            <button
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg border ${
                page === currentPage
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          </span>
        );
      })}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
      >
        →
      </button>
    </div>
  );
}
