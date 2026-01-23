import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceFilters } from '@/components/invoices/InvoiceFilters';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoicePagination } from '@/components/invoices/InvoicePagination';
import { InvoiceStatsCards } from '@/components/invoices/InvoiceStatsCards';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceStatus } from '@/types/invoice';

export default function Invoices() {
  const {
    invoices,
    isLoading,
    error,
    pagination,
    filters,
    stats,
    safraOptions,
    parcelaOptions,
    sortState,
    setFilters,
    setPage,
    updateInvoiceStatus,
    toggleSort,
  } = useInvoices(20);

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(id, status);
      toast.success(`Fatura marcada como ${status}`);
    } catch (err) {
      toast.error('Erro ao atualizar status da fatura');
    }
  };

  const handleCardClick = (status: InvoiceStatus | 'all') => {
    setFilters({ ...filters, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
          <p className="text-muted-foreground">
            Controle de faturas e inadimplência
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InvoiceStatsCards 
        stats={stats} 
        isLoading={isLoading} 
        currentFilter={filters.status}
        onFilterChange={handleCardClick}
      />

      {/* Filters */}
      <InvoiceFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        safraOptions={safraOptions} 
        parcelaOptions={parcelaOptions}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <InvoiceTable 
        invoices={invoices} 
        isLoading={isLoading} 
        onStatusChange={handleStatusChange}
        sortState={sortState}
        onSort={toggleSort}
      />

      {/* Pagination */}
      <InvoicePagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
