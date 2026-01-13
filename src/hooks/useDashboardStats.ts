import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalCustomers: number;
  pendingInvoicesValue: number;
  pendingInvoicesCount: number;
  activeContracts: number;
  overdueContracts: number;
  todayDueContracts: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    pendingInvoicesValue: 0,
    pendingInvoicesCount: 0,
    activeContracts: 0,
    overdueContracts: 0,
    todayDueContracts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customersError) throw customersError;

      // Fetch operator contracts stats
      const { data: contractsData, error: contractsError } = await supabase
        .from('operator_contracts')
        .select('status_contrato, status_operadora, valor_fatura, data_vencimento, data_pagamento');

      if (contractsError) throw contractsError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let pendingValue = 0;
      let pendingCount = 0;
      let activeCount = 0;
      let overdueCount = 0;
      let todayDueCount = 0;

      (contractsData || []).forEach((contract) => {
        // Count active contracts (status_operadora = 'ativo' or similar)
        const statusOp = (contract.status_operadora || '').toLowerCase();
        if (statusOp === 'ativo' || statusOp === 'active') {
          activeCount++;
        }

        // Fatura pendente = sem data de pagamento
        const isPending = contract.data_pagamento === null;
        if (isPending) {
          pendingCount++;
          pendingValue += contract.valor_fatura || 0;
        }

        // Check overdue (vencido E sem pagamento)
        if (contract.data_vencimento) {
          const dueDate = new Date(contract.data_vencimento);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate < today && isPending) {
            overdueCount++;
          }
          
          if (dueDate.getTime() === today.getTime() && isPending) {
            todayDueCount++;
          }
        }
      });

      setStats({
        totalCustomers: customersCount || 0,
        pendingInvoicesValue: pendingValue,
        pendingInvoicesCount: pendingCount,
        activeContracts: activeCount,
        overdueContracts: overdueCount,
        todayDueContracts: todayDueCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};
