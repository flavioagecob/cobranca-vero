import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  // Clientes
  totalCustomers: number;
  
  // Faturas
  pendingInvoicesValue: number;
  pendingInvoicesCount: number;
  paidInvoicesValue: number;
  paidInvoicesCount: number;
  
  // Contratos
  enabledContracts: number;
  contractsByStatus: Record<string, number>;
  
  // Vencimentos
  overdueCount: number;
  overdueValue: number;
  todayDueCount: number;
  todayDueValue: number;
  next7DaysCount: number;
  next7DaysValue: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const initialStats: DashboardStats = {
  totalCustomers: 0,
  pendingInvoicesValue: 0,
  pendingInvoicesCount: 0,
  paidInvoicesValue: 0,
  paidInvoicesCount: 0,
  enabledContracts: 0,
  contractsByStatus: {},
  overdueCount: 0,
  overdueValue: 0,
  todayDueCount: 0,
  todayDueValue: 0,
  next7DaysCount: 0,
  next7DaysValue: 0,
};

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
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
        .select('status_contrato, valor_fatura, data_vencimento, data_pagamento');

      if (contractsError) throw contractsError;

      // Calculate today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate 7 days from today
      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      // Initialize counters
      let pendingValue = 0;
      let pendingCount = 0;
      let paidValue = 0;
      let paidCount = 0;
      let enabledContracts = 0;
      let overdueCount = 0;
      let overdueValue = 0;
      let todayDueCount = 0;
      let todayDueValue = 0;
      let next7DaysCount = 0;
      let next7DaysValue = 0;
      const contractsByStatus: Record<string, number> = {};

      (contractsData || []).forEach((contract) => {
        // Count by status_contrato
        const status = (contract.status_contrato || 'sem_status').toLowerCase();
        contractsByStatus[status] = (contractsByStatus[status] || 0) + 1;

        if (status === 'habilitado') {
          enabledContracts++;
        }

        const isPaid = contract.data_pagamento !== null;
        const valor = contract.valor_fatura || 0;

        // Paid vs pending invoices
        if (isPaid) {
          paidCount++;
          paidValue += valor;
        } else {
          pendingCount++;
          pendingValue += valor;

          // Check due dates (only for unpaid invoices)
          if (contract.data_vencimento) {
            // Parse date correctly to avoid timezone issues
            const [year, month, day] = contract.data_vencimento.split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
              // Overdue
              overdueCount++;
              overdueValue += valor;
            } else if (dueDate.getTime() === today.getTime()) {
              // Due today
              todayDueCount++;
              todayDueValue += valor;
            } else if (dueDate > today && dueDate <= next7Days) {
              // Due in next 7 days (excluding today)
              next7DaysCount++;
              next7DaysValue += valor;
            }
          }
        }
      });

      setStats({
        totalCustomers: customersCount || 0,
        pendingInvoicesValue: pendingValue,
        pendingInvoicesCount: pendingCount,
        paidInvoicesValue: paidValue,
        paidInvoicesCount: paidCount,
        enabledContracts,
        contractsByStatus,
        overdueCount,
        overdueValue,
        todayDueCount,
        todayDueValue,
        next7DaysCount,
        next7DaysValue,
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
