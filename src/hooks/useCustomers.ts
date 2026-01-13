import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Customer, CustomerWithDetails, CustomerWithOperatorSummary, CustomerFilters, PaginationState } from '@/types/customer';

interface UseCustomersReturn {
  customers: CustomerWithOperatorSummary[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: CustomerFilters;
  setFilters: (filters: CustomerFilters) => void;
  setPage: (page: number) => void;
  refetch: () => void;
}

interface UseCustomerDetailReturn {
  customer: CustomerWithDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

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
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get customer IDs that match the status filter if needed
      let customerIdsWithStatus: string[] | null = null;
      
      if (filters.status !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        
        if (filters.status === 'no_contract') {
          // Get customers WITHOUT contracts
          const { data: allCustomers } = await supabase
            .from('customers')
            .select('id');
          
          const { data: customersWithContracts } = await supabase
            .from('operator_contracts')
            .select('customer_id');
          
          const withContractIds = new Set((customersWithContracts || []).map(c => c.customer_id));
          customerIdsWithStatus = (allCustomers || [])
            .map(c => c.id)
            .filter(id => !withContractIds.has(id));
        } else {
          // Build contract query based on status
          let contractQuery = supabase.from('operator_contracts').select('customer_id');
          
          if (filters.status === 'active') {
            contractQuery = contractQuery.or('status_operadora.ilike.ativo,status_operadora.ilike.active');
          } else if (filters.status === 'pending') {
            contractQuery = contractQuery.or('status_contrato.ilike.pendente,status_contrato.ilike.pending,status_contrato.ilike.aberto');
          } else if (filters.status === 'overdue') {
            contractQuery = contractQuery
              .lt('data_vencimento', today)
              .is('data_pagamento', null); // Fatura não paga = sem data de pagamento
          }
          
          const { data: contractsData } = await contractQuery;
          customerIdsWithStatus = [...new Set((contractsData || []).map(c => c.customer_id))];
        }
        
        // If no customers match the status filter, return empty
        if (customerIdsWithStatus.length === 0) {
          setCustomers([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
          setIsLoading(false);
          return;
        }
      }

      // Build main customers query
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Apply status filter (customer IDs)
      if (customerIdsWithStatus) {
        query = query.in('id', customerIdsWithStatus);
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

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      query = query
        .order('nome', { ascending: true })
        .range(from, to);

      const { data: customersData, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Now fetch operator data for these customers
      const customerIds = (customersData || []).map(c => c.id);
      
      let operatorSummary: Record<string, {
        contracts_count: number;
        total_valor_pendente: number;
        status_contrato: string | null;
        proxima_data_vencimento: string | null;
      }> = {};

      if (customerIds.length > 0) {
        const { data: contractsData } = await supabase
          .from('operator_contracts')
          .select('customer_id, status_contrato, status_operadora, valor_fatura, data_vencimento, data_pagamento')
          .in('customer_id', customerIds);

        // Aggregate data per customer
        (contractsData || []).forEach((contract) => {
          const customerId = contract.customer_id;
          if (!operatorSummary[customerId]) {
            operatorSummary[customerId] = {
              contracts_count: 0,
              total_valor_pendente: 0,
              status_contrato: null,
              proxima_data_vencimento: null,
            };
          }

          operatorSummary[customerId].contracts_count++;

          // Sum pending values (fatura sem data de pagamento = pendente)
          const isPending = contract.data_pagamento === null;
          if (isPending && contract.valor_fatura) {
            operatorSummary[customerId].total_valor_pendente += contract.valor_fatura;
          }

          // Get latest status (just use the first one found)
          if (!operatorSummary[customerId].status_contrato && contract.status_operadora) {
            operatorSummary[customerId].status_contrato = contract.status_operadora;
          }

          // Get next due date ONLY for unpaid invoices
          if (isPending && contract.data_vencimento) {
            const current = operatorSummary[customerId].proxima_data_vencimento;
            if (!current || contract.data_vencimento < current) {
              operatorSummary[customerId].proxima_data_vencimento = contract.data_vencimento;
            }
          }
        });
      }

      // Merge customers with operator summary
      const customersWithSummary: CustomerWithOperatorSummary[] = (customersData || []).map((customer) => ({
        ...customer,
        contracts_count: operatorSummary[customer.id]?.contracts_count || 0,
        total_valor_pendente: operatorSummary[customer.id]?.total_valor_pendente || 0,
        status_contrato: operatorSummary[customer.id]?.status_contrato || null,
        proxima_data_vencimento: operatorSummary[customer.id]?.proxima_data_vencimento || null,
      }));

      setCustomers(customersWithSummary);
      setPagination((prev) => ({ ...prev, total: count || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

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

  return {
    customers,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: handleSetFilters,
    setPage,
    refetch: fetchCustomers,
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

      // Fetch operator contracts - order by due date (most urgent first)
      const { data: contractsData } = await supabase
        .from('operator_contracts')
        .select('*')
        .eq('customer_id', customerId)
        .order('data_vencimento', { ascending: true, nullsFirst: false });

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
