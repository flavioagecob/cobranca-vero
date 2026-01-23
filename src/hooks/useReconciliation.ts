import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ReconciliationIssue, 
  ReconciliationFilters, 
  ReconciliationStats,
  IssueType 
} from '@/types/reconciliation';

interface UseReconciliationReturn {
  issues: ReconciliationIssue[];
  isLoading: boolean;
  error: string | null;
  stats: ReconciliationStats;
  filters: ReconciliationFilters;
  setFilters: (filters: ReconciliationFilters) => void;
  refetch: () => void;
  resolveIssue: (issueId: string, notes: string) => Promise<boolean>;
  linkOsToContract: (issueId: string, osId: string, contractId: string) => Promise<boolean>;
  runReconciliation: () => Promise<boolean>;
}

export function useReconciliation(): UseReconciliationReturn {
  const [issues, setIssues] = useState<ReconciliationIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReconciliationStats>({
    total: 0,
    pendentes: 0,
    resolvidos: 0,
    byType: {
      cliente_sem_contrato: 0,
      contrato_sem_venda: 0,
      valor_divergente: 0,
      dados_incorretos: 0
    }
  });
  const [filters, setFilters] = useState<ReconciliationFilters>({
    search: '',
    issueType: 'all',
    status: 'all'
  });

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('reconciliation_issues')
        .select(`
          *,
          sales_base:sales_base_id (
            os,
            produto,
            plano,
            valor_plano,
            data_venda,
            vendedor,
            customer:customer_id (nome, cpf_cnpj)
          ),
          operator_contract:operator_contract_id (
            id_contrato,
            numero_contrato_operadora,
            status_operadora,
            valor_contrato,
            data_ativacao,
            customer:customer_id (nome, cpf_cnpj)
          ),
          customer:customer_id (nome, cpf_cnpj)
        `)
        .order('created_at', { ascending: false });

      if (filters.issueType !== 'all') {
        query = query.eq('tipo', filters.issueType);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let filteredData = data || [];

      // Client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((issue: any) => {
          const osMatch = issue.sales_base?.os?.toLowerCase().includes(searchLower);
          const contractMatch = issue.operator_contract?.id_contrato?.toLowerCase().includes(searchLower);
          const customerNameMatch = 
            issue.customer?.nome?.toLowerCase().includes(searchLower) ||
            issue.sales_base?.customer?.nome?.toLowerCase().includes(searchLower) ||
            issue.operator_contract?.customer?.nome?.toLowerCase().includes(searchLower);
          const cpfMatch = 
            issue.customer?.cpf_cnpj?.includes(filters.search) ||
            issue.sales_base?.customer?.cpf_cnpj?.includes(filters.search) ||
            issue.operator_contract?.customer?.cpf_cnpj?.includes(filters.search);
          
          return osMatch || contractMatch || customerNameMatch || cpfMatch;
        });
      }

      setIssues((filteredData || []) as unknown as ReconciliationIssue[]);

      // Calculate stats
      const allIssues = data || [];
      const byType: Record<IssueType, number> = {
        cliente_sem_contrato: 0,
        contrato_sem_venda: 0,
        valor_divergente: 0,
        dados_incorretos: 0
      };

      allIssues.forEach((issue: any) => {
        const issueType = issue.tipo || issue.issue_type;
        if (byType[issueType as IssueType] !== undefined) {
          byType[issueType as IssueType]++;
        }
      });

      setStats({
        total: allIssues.length,
        pendentes: allIssues.filter((i: any) => i.status === 'PENDENTE').length,
        resolvidos: allIssues.filter((i: any) => i.status === 'RESOLVIDO').length,
        byType
      });

    } catch (err) {
      console.error('Error fetching reconciliation issues:', err);
      setError('Erro ao carregar divergências');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const resolveIssue = async (issueId: string, notes: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('reconciliation_issues')
        .update({
          status: 'RESOLVIDO',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id || null,
          descricao: notes
        })
        .eq('id', issueId);

      if (updateError) throw updateError;

      await fetchIssues();
      return true;
    } catch (err) {
      console.error('Error resolving issue:', err);
      return false;
    }
  };

  const linkOsToContract = async (issueId: string, osId: string, contractId: string): Promise<boolean> => {
    try {
      // Get customer from sales_base
      const { data: salesData } = await supabase
        .from('sales_base')
        .select('customer_id')
        .eq('id', osId)
        .single();

      if (salesData?.customer_id) {
        // Update operator_contract to link to same customer
        await supabase
          .from('operator_contracts')
          .update({ customer_id: salesData.customer_id })
          .eq('id', contractId);
      }

      // Resolve the issue
      return await resolveIssue(issueId, `Link manual: OS ${osId} ↔ Contrato ${contractId}`);
    } catch (err) {
      console.error('Error linking OS to contract:', err);
      return false;
    }
  };

  const runReconciliation = async (): Promise<boolean> => {
    try {
      // This would typically call an edge function to run the full reconciliation
      // For now, we'll simulate finding issues client-side
      
      // Find contracts without customers
      const { data: orphanContracts } = await supabase
        .from('operator_contracts')
        .select('id, id_contrato')
        .is('customer_id', null);

      // Find sales without matching contracts (by customer)
      const { data: salesWithoutContracts } = await supabase
        .from('sales_base')
        .select(`
          id,
          os,
          customer_id,
          customer:customer_id (
            id,
            operator_contracts:operator_contracts (id)
          )
        `);

      const issuesFound: any[] = [];

      // Create issues for orphan contracts
      orphanContracts?.forEach(contract => {
        issuesFound.push({
          tipo: 'contrato_sem_venda',
          operator_contract_id: contract.id,
          descricao: `Contrato ${contract.id_contrato} sem cliente vinculado`,
          status: 'PENDENTE'
        });
      });

      // Create issues for sales without contracts
      salesWithoutContracts?.forEach((sale: any) => {
        if (sale.customer?.operator_contracts?.length === 0) {
          issuesFound.push({
            tipo: 'cliente_sem_contrato',
            sales_base_id: sale.id,
            customer_id: sale.customer_id,
            descricao: `OS ${sale.os} sem contrato na operadora`,
            status: 'PENDENTE'
          });
        }
      });

      // Insert new issues (avoiding duplicates)
      if (issuesFound.length > 0) {
        for (const issue of issuesFound) {
          // Check if similar issue already exists
          const { data: existing } = await supabase
            .from('reconciliation_issues')
            .select('id')
            .eq('tipo', issue.tipo)
            .eq('status', 'PENDENTE')
            .or(`sales_base_id.eq.${issue.sales_base_id || 'null'},operator_contract_id.eq.${issue.operator_contract_id || 'null'}`)
            .maybeSingle();

          if (!existing) {
            await supabase.from('reconciliation_issues').insert(issue);
          }
        }
      }

      await fetchIssues();
      return true;
    } catch (err) {
      console.error('Error running reconciliation:', err);
      return false;
    }
  };

  return {
    issues,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    refetch: fetchIssues,
    resolveIssue,
    linkOsToContract,
    runReconciliation
  };
}
