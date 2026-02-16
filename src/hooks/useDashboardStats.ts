import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CityRankingItem {
  cidade: string;
  count: number;
  value: number;
}

export interface MonthlyTrendItem {
  month: string;
  overdueCount: number;
  overdueValue: number;
  paidCount: number;
  paidValue: number;
  pendingCount: number;
  pendingValue: number;
}

export interface DashboardStats {
  totalCustomers: number;
  pendingInvoicesValue: number;
  pendingInvoicesCount: number;
  paidInvoicesValue: number;
  paidInvoicesCount: number;
  enabledContracts: number;
  contractsByStatus: Record<string, number>;
  overdueCount: number;
  overdueValue: number;
  todayDueCount: number;
  todayDueValue: number;
  next7DaysCount: number;
  next7DaysValue: number;
  cityRankingInadimplencia: CityRankingItem[];
  cityRankingAdimplencia: CityRankingItem[];
  monthlyTrend: MonthlyTrendItem[];
}

interface FilterOptions {
  safraOptions: string[];
  parcelaOptions: string[];
}

interface UseDashboardStatsReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  filterOptions: FilterOptions;
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
  cityRankingInadimplencia: [],
  cityRankingAdimplencia: [],
  monthlyTrend: [],
};

export const useDashboardStats = (safra?: string, parcela?: string): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ safraOptions: [], parcelaOptions: [] });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch filter options
      const { data: optionsData } = await supabase.rpc('get_invoice_filter_options');
      if (optionsData) {
        const parsed = typeof optionsData === 'string' ? JSON.parse(optionsData) : optionsData;
        setFilterOptions({
          safraOptions: (parsed.safras || []) as string[],
          parcelaOptions: (parsed.parcelas || []) as string[],
        });
      }

      // Fetch total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      if (customersError) throw customersError;

      // Build contracts query with filters
      let contractsQuery = supabase
        .from('operator_contracts')
        .select('id_contrato, status_contrato, valor_fatura, data_vencimento, data_pagamento, customer_id, mes_safra_cadastro, numero_fatura');

      if (safra && safra !== 'all') {
        contractsQuery = contractsQuery.eq('mes_safra_cadastro', safra);
      }
      if (parcela && parcela !== 'all') {
        contractsQuery = contractsQuery.eq('numero_fatura', parcela);
      }

      const { data: contractsData, error: contractsError } = await contractsQuery;
      if (contractsError) throw contractsError;

      // Calculate unique customers from filtered contracts when filters are active
      const hasActiveFilter = (safra && safra !== 'all') || (parcela && parcela !== 'all');
      const uniqueCustomerIds = new Set(
        (contractsData || []).map(c => c.customer_id).filter(Boolean)
      );

      // Fetch customers with cities for ranking
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, cidade');

      const customerCityMap: Record<string, string> = {};
      (customersData || []).forEach((c) => {
        if (c.cidade) customerCityMap[c.id] = c.cidade;
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      let pendingValue = 0, pendingCount = 0, paidValue = 0, paidCount = 0;
      let overdueCount = 0, overdueValue = 0, todayDueCount = 0, todayDueValue = 0;
      let next7DaysCount = 0, next7DaysValue = 0;

      const uniqueContractsByStatus: Record<string, Set<string>> = {};
      const inadimplenciaByCity: Record<string, { count: number; value: number }> = {};
      const adimplenciaByCity: Record<string, { count: number; value: number }> = {};
      const monthlyMap: Record<string, { overdueCount: number; overdueValue: number; paidCount: number; paidValue: number; pendingCount: number; pendingValue: number }> = {};

      (contractsData || []).forEach((contract) => {
        const status = (contract.status_contrato || 'sem_status').toLowerCase().trim();
        const idContrato = contract.id_contrato || 'unknown';
        if (!uniqueContractsByStatus[status]) uniqueContractsByStatus[status] = new Set();
        uniqueContractsByStatus[status].add(idContrato);

        const isPaid = contract.data_pagamento !== null;
        const valor = contract.valor_fatura || 0;
        const cidade = contract.customer_id ? customerCityMap[contract.customer_id] : null;

        // Monthly trend aggregation
        if (contract.data_vencimento) {
          const monthKey = contract.data_vencimento.substring(0, 7); // "YYYY-MM"
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { overdueCount: 0, overdueValue: 0, paidCount: 0, paidValue: 0, pendingCount: 0, pendingValue: 0 };
          }
        }

        if (isPaid) {
          paidCount++;
          paidValue += valor;
          if (contract.data_vencimento) {
            const mk = contract.data_vencimento.substring(0, 7);
            if (monthlyMap[mk]) { monthlyMap[mk].paidCount++; monthlyMap[mk].paidValue += valor; }
          }
          if (cidade) {
            if (!adimplenciaByCity[cidade]) adimplenciaByCity[cidade] = { count: 0, value: 0 };
            adimplenciaByCity[cidade].count++;
            adimplenciaByCity[cidade].value += valor;
          }
        } else {
          pendingCount++;
          pendingValue += valor;

          if (contract.data_vencimento) {
            const [year, month, day] = contract.data_vencimento.split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);
            dueDate.setHours(0, 0, 0, 0);
            const mk = contract.data_vencimento.substring(0, 7);

            if (dueDate < today) {
              overdueCount++;
              overdueValue += valor;
              if (monthlyMap[mk]) { monthlyMap[mk].overdueCount++; monthlyMap[mk].overdueValue += valor; }
              if (cidade) {
                if (!inadimplenciaByCity[cidade]) inadimplenciaByCity[cidade] = { count: 0, value: 0 };
                inadimplenciaByCity[cidade].count++;
                inadimplenciaByCity[cidade].value += valor;
              }
            } else if (dueDate.getTime() === today.getTime()) {
              todayDueCount++;
              todayDueValue += valor;
              if (monthlyMap[mk]) { monthlyMap[mk].pendingCount++; monthlyMap[mk].pendingValue += valor; }
            } else if (dueDate > today && dueDate <= next7Days) {
              next7DaysCount++;
              next7DaysValue += valor;
              if (monthlyMap[mk]) { monthlyMap[mk].pendingCount++; monthlyMap[mk].pendingValue += valor; }
            } else {
              if (monthlyMap[mk]) { monthlyMap[mk].pendingCount++; monthlyMap[mk].pendingValue += valor; }
            }
          }
        }
      });

      const contractsByStatus: Record<string, number> = {};
      Object.entries(uniqueContractsByStatus).forEach(([s, set]) => {
        contractsByStatus[s] = set.size;
      });

      const cityRankingInadimplencia = Object.entries(inadimplenciaByCity)
        .map(([cidade, d]) => ({ cidade, count: d.count, value: d.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const cityRankingAdimplencia = Object.entries(adimplenciaByCity)
        .map(([cidade, d]) => ({ cidade, count: d.count, value: d.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyTrend: MonthlyTrendItem[] = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          const [y, m] = key.split('-').map(Number);
          return { month: `${monthNames[m - 1]}/${String(y).slice(2)}`, ...data };
        });

      setStats({
        totalCustomers: hasActiveFilter ? uniqueCustomerIds.size : (customersCount || 0),
        pendingInvoicesValue: pendingValue,
        pendingInvoicesCount: pendingCount,
        paidInvoicesValue: paidValue,
        paidInvoicesCount: paidCount,
        enabledContracts: uniqueContractsByStatus['habilitado']?.size || 0,
        contractsByStatus,
        overdueCount,
        overdueValue,
        todayDueCount,
        todayDueValue,
        next7DaysCount,
        next7DaysValue,
        cityRankingInadimplencia,
        cityRankingAdimplencia,
        monthlyTrend,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }, [safra, parcela]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats, filterOptions };
};
