import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationState } from '@/types/customer';

interface CustomerPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

export function CustomerPagination({ pagination, onPageChange }: CustomerPaginationProps) {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <p className="text-sm text-muted-foreground">
        Mostrando <strong>{from}</strong> a <strong>{to}</strong> de{' '}
        <strong>{total}</strong> clientes
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? 'default' : 'outline'}
                size="sm"
                className="w-8 px-0"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
