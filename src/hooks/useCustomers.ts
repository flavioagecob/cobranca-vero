import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CustomerWithDetails, 
  CustomerWithOperatorSummary, 
  CustomerFilters, 
  PaginationState, 
  CustomerSortField, 
  CustomerSortState,
  CustomerStats,
  CustomerSituacao
} from '@/types/customer';

interface UseCustomersReturn {
  customers: CustomerWithOperatorSummary[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: CustomerFilters;
  safraOptions: string[];
  statusContratoOptions: string[];
  stats: CustomerStats;
  sortState: CustomerSortState;
  setFilters: (filters: CustomerFilters) => void;
  setPage: (page: number) => void;
  refetch: () => void;
  toggleSort: (field: CustomerSortField) => void;
}

interface UseCustomerDetailReturn {
  customer: CustomerWithDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Calculate customer situação based on invoices
const calculateSituacao = (
  hasContracts: boolean,
  hasOverdueInvoices: boolean
): CustomerSituacao => {
  if (!hasContracts) return 'no_contract';
  if (hasOverdueInvoices) return 'overdue';
  return 'paid';
};

export const useCustomers = (initialPageSize: number = 20): UseCustomersReturn => {
  const [customers, setCustomers] = useState<CustomerWithOperatorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
  });
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    uf: '',
    status: 'all',
    safra: '',
    statusContrato: '',
  });
  const [safraOptions, setSafraOptions] = useState<string[]>([]);
  const [statusContratoOptions, setStatusContratoOptions] = useState<string[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    paid: 0,
    overdue: 0,
    noContract: 0,
  });
  const [sortState, setSortState] = useState<CustomerSortState>({
    field: 'nome',
    direction: 'asc',
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Fetch all contracts for calculating stats and situação
      const { data: allContracts } = await supabase
        .from('operator_contracts')
        .select('customer_id, status_contrato, valor_fatura, data_vencimento, data_pagamento, mes_safra_cadastro');

      // Extract unique safras and status_contrato for filters
      const uniqueSafras = [...new Set((allContracts || [])
        .map(c => c.mes_safra_cadastro)
        .filter(Boolean))] as string[];
      setSafraOptions(uniqueSafras.sort());

      const uniqueStatusContrato = [...new Set((allContracts || [])
        .map(c => c.status_contrato)
        .filter(Boolean))] as string[];
      setStatusContratoOptions(uniqueStatusContrato.sort());

      // Group contracts by customer for situação calculation
      const contractsByCustomer: Record<string, typeof allContracts> = {};
      (allContracts || []).forEach(contract => {
        if (!contractsByCustomer[contract.customer_id]) {
          contractsByCustomer[contract.customer_id] = [];
        }
        contractsByCustomer[contract.customer_id]!.push(contract);
      });

      // Calculate situação for each customer
      const customerSituacaoMap: Record<string, CustomerSituacao> = {};
      Object.entries(contractsByCustomer).forEach(([customerId, contracts]) => {
        const hasContracts = contracts!.length > 0;
        const hasOverdueInvoices = contracts!.some(c => {
          if (c.data_pagamento !== null) return false;
          if (!c.data_vencimento) return false;
          return c.data_vencimento < todayStr;
        });
        customerSituacaoMap[customerId] = calculateSituacao(hasContracts, hasOverdueInvoices);
      });

      // First, get customer IDs that match the safra filter if needed
      let customerIdsWithSafra: string[] | null = null;
      
      if (filters.safra) {
        customerIdsWithSafra = [...new Set((allContracts || [])
          .filter(c => c.mes_safra_cadastro === filters.safra)
          .map(c => c.customer_id))];
        
        if (customerIdsWithSafra.length === 0) {
          setCustomers([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
          setStats({ total: 0, paid: 0, overdue: 0, noContract: 0 });
          setIsLoading(false);
          return;
        }
      }

      // Get customer IDs that match the statusContrato filter if needed
      let customerIdsWithStatusContrato: string[] | null = null;
      
      if (filters.statusContrato) {
        customerIdsWithStatusContrato = [...new Set((allContracts || [])
          .filter(c => c.status_contrato?.toLowerCase() === filters.statusContrato.toLowerCase())
          .map(c => c.customer_id))];
        
        if (customerIdsWithStatusContrato.length === 0) {
          setCustomers([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
          setStats({ total: 0, paid: 0, overdue: 0, noContract: 0 });
          setIsLoading(false);
          return;
        }
      }

      // Get customer IDs that match the situação filter if needed
      let customerIdsWithSituacao: string[] | null = null;
      let filteringNoContract = false;
      
      if (filters.status !== 'all') {
        if (filters.status === 'no_contract') {
          filteringNoContract = true;
          // Will filter after fetching all customers
        } else {
          customerIdsWithSituacao = Object.entries(customerSituacaoMap)
            .filter(([_, situacao]) => situacao === filters.status)
            .map(([customerId]) => customerId);
          
          if (customerIdsWithSituacao.length === 0) {
            setCustomers([]);
            setPagination((prev) => ({ ...prev, total: 0 }));
            setStats({ total: 0, paid: 0, overdue: 0, noContract: 0 });
            setIsLoading(false);
            return;
          }
        }
      }

      // Build main customers query
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Combine all ID filters
      let combinedIds: string[] | null = null;
      
      if (customerIdsWithSafra) {
        combinedIds = customerIdsWithSafra;
      }
      
      if (customerIdsWithStatusContrato) {
        if (combinedIds) {
          combinedIds = combinedIds.filter(id => customerIdsWithStatusContrato!.includes(id));
        } else {
          combinedIds = customerIdsWithStatusContrato;
        }
      }
      
      if (customerIdsWithSituacao) {
        if (combinedIds) {
          combinedIds = combinedIds.filter(id => customerIdsWithSituacao!.includes(id));
        } else {
          combinedIds = customerIdsWithSituacao;
        }
      }
      
      if (combinedIds && combinedIds.length === 0) {
        setCustomers([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
        setStats({ total: 0, paid: 0, overdue: 0, noContract: 0 });
        setIsLoading(false);
        return;
      }
      
      if (combinedIds) {
        query = query.in('id', combinedIds);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`nome.ilike.${searchTerm},cpf_cnpj.ilike.${searchTerm},email.ilike.${searchTerm},telefone.ilike.${searchTerm}`);
      }

      // Apply UF filter
      if (filters.uf) {
        query = query.eq('uf', filters.uf);
      }

      // Apply Supabase-level sorting for direct fields
      if (['nome', 'cpf_cnpj'].includes(sortState.field)) {
        query = query.order(sortState.field, { ascending: sortState.direction === 'asc' });
      } else {
        query = query.order('nome', { ascending: true }); // fallback
      }

      // First get total count for all customers matching filters (before pagination)
      const { count: totalCount } = await query;

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data: customersData, error: queryError } = await query;

      if (queryError) throw queryError;

      // Build operator summary for customers on this page
      const customerIds = (customersData || []).map(c => c.id);
      
      let operatorSummary: Record<string, {
        contracts_count: number;
        total_valor_pendente: number;
        status_contrato: string | null;
        proxima_data_vencimento: string | null;
        situacao: CustomerSituacao;
      }> = {};

      if (customerIds.length > 0) {
        customerIds.forEach(customerId => {
          const customerContracts = contractsByCustomer[customerId] || [];
          
          let contractsCount = 0;
          let totalValorPendente = 0;
          let statusContrato: string | null = null;
          let proximaDataVencimento: string | null = null;

          customerContracts.forEach((contract) => {
            contractsCount++;

            // Sum pending values (fatura sem data de pagamento = pendente)
            const isPending = contract.data_pagamento === null;
            if (isPending && contract.valor_fatura) {
              totalValorPendente += contract.valor_fatura;
            }

            // Get latest status (just use the first one found)
            if (!statusContrato && contract.status_contrato) {
              statusContrato = contract.status_contrato;
            }

            // Get next due date ONLY for unpaid invoices
            if (isPending && contract.data_vencimento) {
              if (!proximaDataVencimento || contract.data_vencimento < proximaDataVencimento) {
                proximaDataVencimento = contract.data_vencimento;
              }
            }
          });

          const situacao = customerSituacaoMap[customerId] || 'no_contract';
          operatorSummary[customerId] = {
            contracts_count: contractsCount,
            total_valor_pendente: totalValorPendente,
            status_contrato: statusContrato,
            proxima_data_vencimento: proximaDataVencimento,
            situacao,
          };
        });
      }

      // Merge customers with operator summary
      let customersWithSummary: CustomerWithOperatorSummary[] = (customersData || []).map((customer) => ({
        ...customer,
        contracts_count: operatorSummary[customer.id]?.contracts_count || 0,
        total_valor_pendente: operatorSummary[customer.id]?.total_valor_pendente || 0,
        status_contrato: operatorSummary[customer.id]?.status_contrato || null,
        proxima_data_vencimento: operatorSummary[customer.id]?.proxima_data_vencimento || null,
        situacao: operatorSummary[customer.id]?.situacao || 'no_contract',
      }));

      // Apply situação filter for 'no_contract' (customers without contracts)
      if (filteringNoContract) {
        customersWithSummary = customersWithSummary.filter(c => c.situacao === 'no_contract');
      }

      // Apply client-side sorting for aggregated fields
      if (!['nome', 'cpf_cnpj'].includes(sortState.field)) {
        const multiplier = sortState.direction === 'asc' ? 1 : -1;
        customersWithSummary.sort((a, b) => {
          switch (sortState.field) {
            case 'contracts_count':
              return multiplier * (a.contracts_count - b.contracts_count);
            case 'total_valor_pendente':
              return multiplier * (a.total_valor_pendente - b.total_valor_pendente);
            case 'proxima_data_vencimento':
              return multiplier * (a.proxima_data_vencimento || '').localeCompare(b.proxima_data_vencimento || '');
            default:
              return 0;
          }
        });
      }

      // Calculate stats (for all customers, not just this page)
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      const customersWithContracts = new Set(Object.keys(contractsByCustomer));
      const noContractCount = (totalCustomers || 0) - customersWithContracts.size;

      let paidCount = 0;
      let overdueCount = 0;

      Object.values(customerSituacaoMap).forEach(situacao => {
        if (situacao === 'paid') paidCount++;
        else if (situacao === 'overdue') overdueCount++;
      });

      setStats({
        total: totalCustomers || 0,
        paid: paidCount,
        overdue: overdueCount,
        noContract: noContractCount,
      });

      setCustomers(customersWithSummary);
      setPagination((prev) => ({ ...prev, total: totalCount || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, sortState]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleSetFilters = useCallback((newFilters: CustomerFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const toggleSort = useCallback((field: CustomerSortField) => {
    setSortState((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return {
    customers,
    isLoading,
    error,
    pagination,
    filters,
    safraOptions,
    statusContratoOptions,
    stats,
    sortState,
    setFilters: handleSetFilters,
    setPage,
    refetch: fetchCustomers,
    toggleSort,
  };
};

export const useCustomerDetail = (customerId: string | undefined): UseCustomerDetailReturn => {
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customerData) {
        setError('Cliente não encontrado');
        setCustomer(null);
        return;
      }

      // Fetch sales base
      const { data: salesData } = await supabase
        .from('sales_base')
        .select('*')
        .eq('customer_id', customerId)
        .order('data_venda', { ascending: false });

      // Fetch operator contracts - order by numero_fatura DESC (maior = mais recente)
      const { data: contractsData } = await supabase
        .from('operator_contracts')
        .select('*')
        .eq('customer_id', customerId)
        .order('numero_fatura', { ascending: false });

      const customerWithDetails: CustomerWithDetails = {
        ...customerData,
        sales_base: salesData || [],
        operator_contracts: contractsData || [],
        total_sales: salesData?.length || 0,
        total_contracts: contractsData?.length || 0,
      };

      setCustomer(customerWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cliente');
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    isLoading,
    error,
    refetch: fetchCustomer,
  };
};
