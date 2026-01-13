import { useState, useCallback, useEffect, useMemo } from 'react';
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
      // Build query
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, nome, cpf_cnpj, telefone, email)
        `, { count: 'exact' });

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

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

      // Process invoices - calculate days overdue and filter by search/overdue range
      let processedInvoices = (data || []).map((inv) => ({
        ...inv,
        dias_atraso: inv.status !== 'pago' ? calculateDaysOverdue(inv.data_vencimento) : 0,
      }));

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

      // Fetch stats
      const { data: statsData } = await supabase
        .from('invoices')
        .select('status, valor');

      if (statsData) {
        const calculatedStats: InvoiceStats = {
          total: statsData.length,
          pendente: statsData.filter((i) => i.status === 'pendente').length,
          pago: statsData.filter((i) => i.status === 'pago').length,
          atrasado: statsData.filter((i) => i.status === 'atrasado').length,
          valorTotal: statsData.reduce((sum, i) => sum + (i.valor || 0), 0),
          valorPendente: statsData
            .filter((i) => i.status === 'pendente' || i.status === 'atrasado')
            .reduce((sum, i) => sum + (i.valor || 0), 0),
          valorAtrasado: statsData
            .filter((i) => i.status === 'atrasado')
            .reduce((sum, i) => sum + (i.valor || 0), 0),
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
    const updateData: Record<string, unknown> = { status };
    if (status === 'pago') {
      updateData.data_pagamento = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
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
