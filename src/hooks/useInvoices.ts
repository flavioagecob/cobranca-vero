import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice, InvoiceFilters, InvoiceStats, InvoiceStatus, InvoiceSortField, InvoiceSortState } from '@/types/invoice';
import type { PaginationState } from '@/types/customer';

interface UseInvoicesReturn {
  invoices: Invoice[];
  allFilteredInvoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: InvoiceFilters;
  stats: InvoiceStats;
  safraOptions: string[];
  parcelaOptions: string[];
  sortState: InvoiceSortState;
  setFilters: (filters: InvoiceFilters) => void;
  setPage: (page: number) => void;
  refetch: () => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  toggleSort: (field: InvoiceSortField) => void;
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

// Fetch all rows in batches of 1000 to bypass Supabase limit
const fetchAllInBatches = async (queryBuilder: any) => {
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await queryBuilder.range(from, from + batchSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return allData;
};

export const useInvoices = (initialPageSize: number = 20): UseInvoicesReturn => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allFilteredInvoices, setAllFilteredInvoices] = useState<Invoice[]>([]);
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
    safra: 'all',
    parcela: 'all',
  });
  const [safraOptions, setSafraOptions] = useState<string[]>([]);
  const [parcelaOptions, setParcelaOptions] = useState<string[]>([]);
  const [sortState, setSortState] = useState<InvoiceSortState>({
    field: 'data_vencimento',
    direction: 'asc',
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

  // Fetch filter options via RPC (no row limit)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_invoice_filter_options');
      if (error) throw error;
      if (data) {
        const options = data as { safras: string[]; parcelas: string[] };
        setSafraOptions(options.safras || []);
        setParcelaOptions((options.parcelas || []).sort((a: string, b: string) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }));
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Fetch stats via RPC (no row limit)
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_invoice_stats', {
        p_safra: filters.safra !== 'all' ? filters.safra : null,
        p_parcela: filters.parcela !== 'all' ? filters.parcela : null,
      });
      if (error) throw error;
      if (data) {
        const s = data as any;
        setStats({
          total: s.total || 0,
          pendente: s.pendente || 0,
          pago: s.pago || 0,
          atrasado: s.atrasado || 0,
          valorTotal: Number(s.valor_total) || 0,
          valorPendente: Number(s.valor_pendente) || 0,
          valorAtrasado: Number(s.valor_atrasado) || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [filters.safra, filters.parcela]);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query
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
          mes_safra_cadastro,
          pago_pela_empresa,
          marcado_pago_by,
          marcado_pago_at,
          created_at,
          customer:customers(id, nome, cpf_cnpj, telefone, email),
          sales_base:sales_base_id(os)
        `)
        .order('data_vencimento', { ascending: true });

      // Apply server-side filters
      if (filters.safra && filters.safra !== 'all') {
        query = query.eq('mes_safra_cadastro', filters.safra);
      }
      if (filters.parcela && filters.parcela !== 'all') {
        query = query.eq('numero_fatura', filters.parcela);
      }

      // Fetch ALL data in batches (bypasses 1000 row limit)
      const data = await fetchAllInBatches(query);

      // Process invoices
      let processedInvoices: Invoice[] = (data || []).map((contract: any) => {
        const status = calculateStatus(contract.data_pagamento, contract.data_vencimento);
        const diasAtraso = status !== 'pago' ? calculateDaysOverdue(contract.data_vencimento) : 0;
        
        const customerData = Array.isArray(contract.customer) 
          ? contract.customer[0] 
          : contract.customer;
        
        const salesBaseData = Array.isArray(contract.sales_base)
          ? contract.sales_base[0]
          : contract.sales_base;
        
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
          mes_safra_cadastro: contract.mes_safra_cadastro,
          os: salesBaseData?.os || null,
          observacoes: null,
          pago_pela_empresa: contract.pago_pela_empresa || false,
          marcado_pago_by: contract.marcado_pago_by || null,
          marcado_pago_at: contract.marcado_pago_at || null,
          marcado_pago_by_name: null,
          created_at: contract.created_at,
          updated_at: contract.created_at,
          customer: customerData,
        };
      });

      // Resolve marcado_pago_by names
      const userIds = [...new Set(processedInvoices.map(inv => inv.marcado_pago_by).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users_profile')
          .select('user_id, full_name')
          .in('user_id', userIds);
        if (profiles) {
          const nameMap = new Map(profiles.map(p => [p.user_id, p.full_name]));
          processedInvoices.forEach(inv => {
            if (inv.marcado_pago_by) {
              inv.marcado_pago_by_name = nameMap.get(inv.marcado_pago_by) || null;
            }
          });
        }
      }

      // Apply client-side filters (status, search, overdueRange)
      if (filters.status !== 'all') {
        processedInvoices = processedInvoices.filter((inv) => inv.status === filters.status);
      }

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

      // Sort
      processedInvoices.sort((a, b) => {
        const multiplier = sortState.direction === 'asc' ? 1 : -1;
        switch (sortState.field) {
          case 'numero_fatura':
            return multiplier * (a.numero_fatura || '').localeCompare(b.numero_fatura || '');
          case 'customer_name':
            return multiplier * (a.customer?.nome || '').localeCompare(b.customer?.nome || '');
          case 'mes_safra_cadastro':
            return multiplier * (a.mes_safra_cadastro || '').localeCompare(b.mes_safra_cadastro || '');
          case 'valor':
            return multiplier * ((a.valor || 0) - (b.valor || 0));
          case 'data_vencimento':
            return multiplier * (a.data_vencimento || '').localeCompare(b.data_vencimento || '');
          case 'dias_atraso':
            return multiplier * ((a.dias_atraso || 0) - (b.dias_atraso || 0));
          default:
            return 0;
        }
      });

      // Paginate
      const from = (pagination.page - 1) * pagination.pageSize;
      const paginatedInvoices = processedInvoices.slice(from, from + pagination.pageSize);

      setAllFilteredInvoices(processedInvoices);
      setInvoices(paginatedInvoices);
      setPagination((prev) => ({ ...prev, total: processedInvoices.length }));

      // Fetch stats and filter options in parallel
      await Promise.all([fetchStats(), fetchFilterOptions()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, sortState, fetchStats, fetchFilterOptions]);

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

  const toggleSort = useCallback((field: InvoiceSortField) => {
    setSortState((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const updateInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus) => {
    const updateData: Record<string, unknown> = {};
    if (status === 'pago') {
      updateData.data_pagamento = new Date().toISOString().split('T')[0];
      updateData.marcado_pago_by = user?.id || null;
      updateData.marcado_pago_at = new Date().toISOString();
    } else if (status === 'pendente' || status === 'atrasado') {
      updateData.data_pagamento = null;
      updateData.marcado_pago_by = null;
      updateData.marcado_pago_at = null;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('operator_contracts')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    }
    
    await fetchInvoices();
  }, [fetchInvoices, user?.id]);

  return {
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
    refetch: fetchInvoices,
    updateInvoiceStatus,
    toggleSort,
  };
};
