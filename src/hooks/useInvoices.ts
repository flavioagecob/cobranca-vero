import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, InvoiceFilters, InvoiceStats, InvoiceStatus } from '@/types/invoice';
import type { PaginationState } from '@/types/customer';

interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: InvoiceFilters;
  stats: InvoiceStats;
  setFilters: (filters: InvoiceFilters) => void;
  setPage: (page: number) => void;
  refetch: () => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
}

// Calculate days overdue
const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = now.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Calculate status based on payment date and due date
const calculateStatus = (dataPagamento: string | null, dataVencimento: string): InvoiceStatus => {
  if (dataPagamento) return 'pago';
  const daysOverdue = calculateDaysOverdue(dataVencimento);
  if (daysOverdue > 0) return 'atrasado';
  return 'pendente';
};

export const useInvoices = (initialPageSize: number = 20): UseInvoicesReturn => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
  });
  const [filters, setFiltersState] = useState<InvoiceFilters>({
    search: '',
    status: 'all',
    overdueRange: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    pendente: 0,
    pago: 0,
    atrasado: 0,
    valorTotal: 0,
    valorPendente: 0,
    valorAtrasado: 0,
  });

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query from operator_contracts table
      let query = supabase
        .from('operator_contracts')
        .select(`
          id,
          customer_id,
          id_contrato,
          numero_fatura,
          valor_fatura,
          data_vencimento,
          data_pagamento,
          created_at,
          updated_at,
          customer:customers(id, nome, cpf_cnpj, telefone, email)
        `, { count: 'exact' });

      // Apply date range filter
      if (filters.dateFrom) {
        query = query.gte('data_vencimento', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('data_vencimento', filters.dateTo);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      query = query
        .order('data_vencimento', { ascending: true })
        .range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Process invoices - map fields and calculate status
      let processedInvoices: Invoice[] = (data || []).map((contract) => {
        const status = calculateStatus(contract.data_pagamento, contract.data_vencimento);
        const diasAtraso = status !== 'pago' ? calculateDaysOverdue(contract.data_vencimento) : 0;
        
        // Handle customer data - Supabase returns array for joins, get first item
        const customerData = Array.isArray(contract.customer) 
          ? contract.customer[0] 
          : contract.customer;
        
        return {
          id: contract.id,
          customer_id: contract.customer_id,
          sales_base_id: null,
          operator_contract_id: contract.id_contrato,
          numero_fatura: contract.numero_fatura,
          valor: contract.valor_fatura,
          data_vencimento: contract.data_vencimento,
          data_pagamento: contract.data_pagamento,
          status,
          dias_atraso: diasAtraso,
          observacoes: null,
          created_at: contract.created_at,
          updated_at: contract.updated_at,
          customer: customerData,
        };
      });

      // Apply status filter (client-side since status is calculated)
      if (filters.status !== 'all') {
        processedInvoices = processedInvoices.filter((inv) => inv.status === filters.status);
      }

      // Apply search filter (client-side for joined data)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        processedInvoices = processedInvoices.filter((inv) => {
          const customer = inv.customer;
          return (
            inv.numero_fatura?.toLowerCase().includes(searchLower) ||
            customer?.nome?.toLowerCase().includes(searchLower) ||
            customer?.cpf_cnpj?.includes(filters.search)
          );
        });
      }

      // Apply overdue range filter (client-side)
      if (filters.overdueRange !== 'all') {
        processedInvoices = processedInvoices.filter((inv) => {
          const days = inv.dias_atraso;
          switch (filters.overdueRange) {
            case '1-15': return days >= 1 && days <= 15;
            case '16-30': return days >= 16 && days <= 30;
            case '31-60': return days >= 31 && days <= 60;
            case '60+': return days > 60;
            default: return true;
          }
        });
      }

      setInvoices(processedInvoices);
      setPagination((prev) => ({ ...prev, total: count || 0 }));

      // Fetch all contracts for stats calculation
      const { data: statsData } = await supabase
        .from('operator_contracts')
        .select('valor_fatura, data_vencimento, data_pagamento');

      if (statsData) {
        const contractsWithStatus = statsData.map((c) => ({
          ...c,
          status: calculateStatus(c.data_pagamento, c.data_vencimento),
        }));

        const calculatedStats: InvoiceStats = {
          total: contractsWithStatus.length,
          pendente: contractsWithStatus.filter((i) => i.status === 'pendente').length,
          pago: contractsWithStatus.filter((i) => i.status === 'pago').length,
          atrasado: contractsWithStatus.filter((i) => i.status === 'atrasado').length,
          valorTotal: contractsWithStatus.reduce((sum, i) => sum + (i.valor_fatura || 0), 0),
          valorPendente: contractsWithStatus
            .filter((i) => i.status === 'pendente' || i.status === 'atrasado')
            .reduce((sum, i) => sum + (i.valor_fatura || 0), 0),
          valorAtrasado: contractsWithStatus
            .filter((i) => i.status === 'atrasado')
            .reduce((sum, i) => sum + (i.valor_fatura || 0), 0),
        };
        setStats(calculatedStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setFilters = useCallback((newFilters: InvoiceFilters) => {
    setFiltersState(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const updateInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus) => {
    // Update the operator_contracts table
    const updateData: Record<string, unknown> = {};
    
    if (status === 'pago') {
      updateData.data_pagamento = new Date().toISOString().split('T')[0];
    } else if (status === 'pendente' || status === 'atrasado') {
      updateData.data_pagamento = null;
    }
    // Note: 'negociado' and 'cancelado' would need a status field in operator_contracts
    // For now, we only handle payment status changes

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('operator_contracts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    }
    
    await fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    isLoading,
    error,
    pagination,
    filters,
    stats,
    setFilters,
    setPage,
    refetch: fetchInvoices,
    updateInvoiceStatus,
  };
};
