import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Customer, CustomerWithDetails, CustomerFilters, PaginationState } from '@/types/customer';

interface UseCustomersReturn {
  customers: Customer[];
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
  const [customers, setCustomers] = useState<Customer[]>([]);
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
      // Build query
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

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

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setCustomers(data || []);
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

      // Fetch operator contracts
      const { data: contractsData } = await supabase
        .from('operator_contracts')
        .select('*')
        .eq('customer_id', customerId)
        .order('data_ativacao', { ascending: false });

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
