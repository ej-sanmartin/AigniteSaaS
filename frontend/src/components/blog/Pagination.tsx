import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  return (
    <nav className="flex justify-center gap-4 mt-8">
      {currentPage > 1 && (
        <Link
          href={currentPage === 2 ? '/blog' : `/blog/page/${currentPage - 1}`}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Previous
        </Link>
      )}
      {currentPage < totalPages && (
        <Link
          href={`/blog/page/${currentPage + 1}`}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Next
        </Link>
      )}
    </nav>
  );
} 