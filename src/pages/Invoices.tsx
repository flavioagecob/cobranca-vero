import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceFilters } from '@/components/invoices/InvoiceFilters';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoicePagination } from '@/components/invoices/InvoicePagination';
import { InvoiceStatsCards } from '@/components/invoices/InvoiceStatsCards';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { InvoiceStatus } from '@/types/invoice';

export default function Invoices() {
  const {
    invoices,
    allFilteredInvoices,
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

  const handleExport = () => {
    try {
      if (allFilteredInvoices.length === 0) {
        toast.error('Nenhuma fatura para exportar');
        return;
      }

      const data = allFilteredInvoices.map((inv) => ({
        'OS': inv.os || '',
        'Número Fatura': inv.numero_fatura || '',
        'Cliente': inv.customer?.nome || '',
        'CPF/CNPJ': inv.customer?.cpf_cnpj || '',
        'Telefone': inv.customer?.telefone || '',
        'Safra': inv.mes_safra_cadastro || '',
        'Valor': inv.valor || 0,
        'Data Vencimento': inv.data_vencimento || '',
        'Data Pagamento': inv.data_pagamento || '',
        'Status': inv.status || '',
        'Dias Atraso': inv.dias_atraso || 0,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Faturas');
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `faturas_${today}.xlsx`);
      toast.success(`${allFilteredInvoices.length} faturas exportadas com sucesso`);
    } catch {
      toast.error('Erro ao exportar faturas');
    }
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={isLoading || allFilteredInvoices.length === 0}
          >
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
        onFilterChange={(status: InvoiceStatus | 'all') => setFilters({ ...filters, status })}
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
