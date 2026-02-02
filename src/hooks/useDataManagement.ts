import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DataCounts {
  customers: number;
  sales_base: number;
  operator_contracts: number;
  collection_attempts: number;
  payment_promises: number;
  invoices: number;
  reconciliation_issues: number;
  import_batches: number;
}

export function useDataManagement() {
  const { toast } = useToast();
  const [counts, setCounts] = useState<DataCounts>({
    customers: 0,
    sales_base: 0,
    operator_contracts: 0,
    collection_attempts: 0,
    payment_promises: 0,
    invoices: 0,
    reconciliation_issues: 0,
    import_batches: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        customersRes,
        salesRes,
        contractsRes,
        attemptsRes,
        promisesRes,
        invoicesRes,
        issuesRes,
        batchesRes,
      ] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('sales_base').select('id', { count: 'exact', head: true }),
        supabase.from('operator_contracts').select('id', { count: 'exact', head: true }),
        supabase.from('collection_attempts').select('id', { count: 'exact', head: true }),
        supabase.from('payment_promises').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('reconciliation_issues').select('id', { count: 'exact', head: true }),
        supabase.from('import_batches').select('id', { count: 'exact', head: true }),
      ]);

      setCounts({
        customers: customersRes.count ?? 0,
        sales_base: salesRes.count ?? 0,
        operator_contracts: contractsRes.count ?? 0,
        collection_attempts: attemptsRes.count ?? 0,
        payment_promises: promisesRes.count ?? 0,
        invoices: invoicesRes.count ?? 0,
        reconciliation_issues: issuesRes.count ?? 0,
        import_batches: batchesRes.count ?? 0,
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar contagem de registros',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearSalesData = useCallback(async () => {
    setIsClearing(true);
    try {
      // Order matters: delete dependent records first
      // 1. reconciliation_issues that reference sales_base
      await supabase.from('reconciliation_issues').delete().not('sales_base_id', 'is', null);
      
      // 2. operator_contracts that reference sales_base
      await supabase.from('operator_contracts').delete().not('sales_base_id', 'is', null);
      
      // 3. sales_base
      await supabase.from('sales_base').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 4. import_batches of type 'sales'
      await supabase.from('import_batches').delete().eq('tipo', 'sales');

      toast({
        title: 'Sucesso',
        description: 'Base de vendas limpa com sucesso',
      });
      
      await fetchCounts();
    } catch (error) {
      console.error('Error clearing sales data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar base de vendas',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  }, [toast, fetchCounts]);

  const clearOperatorData = useCallback(async () => {
    setIsClearing(true);
    try {
      // Order matters: delete dependent records first
      // 1. collection_attempts that reference operator_contracts (invoice_id)
      await supabase.from('collection_attempts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. payment_promises that reference operator_contracts (invoice_id)
      await supabase.from('payment_promises').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 3. reconciliation_issues that reference operator_contracts
      await supabase.from('reconciliation_issues').delete().not('operator_contract_id', 'is', null);
      
      // 4. operator_contracts
      await supabase.from('operator_contracts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 5. import_batches of type 'operator'
      await supabase.from('import_batches').delete().eq('tipo', 'operator');

      toast({
        title: 'Sucesso',
        description: 'Base da operadora limpa com sucesso',
      });
      
      await fetchCounts();
    } catch (error) {
      console.error('Error clearing operator data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar base da operadora',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  }, [toast, fetchCounts]);

  const clearCollectionHistory = useCallback(async () => {
    setIsClearing(true);
    try {
      // 1. collection_attempts
      await supabase.from('collection_attempts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. payment_promises
      await supabase.from('payment_promises').delete().gte('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: 'Sucesso',
        description: 'Histórico de cobrança limpo com sucesso',
      });
      
      await fetchCounts();
    } catch (error) {
      console.error('Error clearing collection history:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar histórico de cobrança',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  }, [toast, fetchCounts]);

  const clearAllData = useCallback(async () => {
    setIsClearing(true);
    try {
      // Order: respect all foreign key constraints
      // 1. collection_attempts
      await supabase.from('collection_attempts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. payment_promises
      await supabase.from('payment_promises').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 3. invoices
      await supabase.from('invoices').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 4. reconciliation_issues
      await supabase.from('reconciliation_issues').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 5. operator_contracts
      await supabase.from('operator_contracts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 6. sales_base
      await supabase.from('sales_base').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 7. import_batches
      await supabase.from('import_batches').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      // 8. customers
      await supabase.from('customers').delete().gte('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: 'Sucesso',
        description: 'Todos os dados foram limpos com sucesso',
      });
      
      await fetchCounts();
    } catch (error) {
      console.error('Error clearing all data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível limpar todos os dados',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  }, [toast, fetchCounts]);

  return {
    counts,
    isLoading,
    isClearing,
    fetchCounts,
    clearSalesData,
    clearOperatorData,
    clearCollectionHistory,
    clearAllData,
  };
}
