import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

export interface PreventiveLead {
  id: string;
  os: string;
  mes_safra: string | null;
  data_vencimento: string;
  valor: number | null;
  status_cobranca: string | null;
  dias_ate_vencer: number;
  customer: {
    id: string;
    nome: string;
    cpf_cnpj: string;
    telefone: string | null;
    telefone2: string | null;
    email: string | null;
    cidade: string | null;
    uf: string | null;
  };
}

export interface PreventiveStats {
  totalNaFila: number;
  vence7dias: number;
  vence15dias: number;
  valorTotal: number;
  cobradosHoje: number;
}

export interface PreventiveFilters {
  safra?: string;
  diasAteVencer?: 'hoje' | '1-7' | '8-15' | 'todos';
  search?: string;
}

interface UsePreventiveCollectionReturn {
  leads: PreventiveLead[];
  stats: PreventiveStats;
  safras: string[];
  isLoading: boolean;
  filters: PreventiveFilters;
  setFilters: (filters: PreventiveFilters) => void;
  refetch: () => void;
  markAsCobrado: (salesBaseId: string) => Promise<boolean>;
}

export const usePreventiveCollection = (): UsePreventiveCollectionReturn => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<PreventiveLead[]>([]);
  const [stats, setStats] = useState<PreventiveStats>({
    totalNaFila: 0,
    vence7dias: 0,
    vence15dias: 0,
    valorTotal: 0,
    cobradosHoje: 0,
  });
  const [safras, setSafras] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PreventiveFilters>({
    diasAteVencer: 'todos',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');
      const in15Days = format(addDays(today, 15), 'yyyy-MM-dd');
      const in7Days = format(addDays(today, 7), 'yyyy-MM-dd');

      // Fetch leads with data_vencimento >= today and <= 15 days
      let query = supabase
        .from('sales_base')
        .select(`
          id,
          os,
          mes_safra,
          data_vencimento,
          valor,
          status_cobranca,
          customer:customers!inner(
            id,
            nome,
            cpf_cnpj,
            telefone,
            telefone2,
            email,
            cidade,
            uf
          )
        `)
        .not('data_vencimento', 'is', null)
        .gte('data_vencimento', todayStr)
        .lte('data_vencimento', in15Days)
        .neq('status_cobranca', 'pago')
        .order('data_vencimento', { ascending: true });

      // Apply safra filter
      if (filters.safra) {
        query = query.eq('mes_safra', filters.safra);
      }

      // Apply dias filter
      if (filters.diasAteVencer === 'hoje') {
        query = query.eq('data_vencimento', todayStr);
      } else if (filters.diasAteVencer === '1-7') {
        query = query.lte('data_vencimento', in7Days);
      } else if (filters.diasAteVencer === '8-15') {
        query = query.gt('data_vencimento', in7Days);
      }

      const { data: leadsData, error: leadsError } = await query;

      if (leadsError) {
        console.error('Error fetching preventive leads:', leadsError);
        return;
      }

      // Transform data
      const transformedLeads: PreventiveLead[] = (leadsData || []).map((item: any) => {
        const vencimento = new Date(item.data_vencimento);
        const diasAteVencer = Math.ceil((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: item.id,
          os: item.os,
          mes_safra: item.mes_safra,
          data_vencimento: item.data_vencimento,
          valor: item.valor,
          status_cobranca: item.status_cobranca,
          dias_ate_vencer: diasAteVencer,
          customer: item.customer,
        };
      });

      setLeads(transformedLeads);

      // Calculate stats
      const cobradosHoje = transformedLeads.filter(l => l.status_cobranca === 'cobrado').length;
      const vence7dias = transformedLeads.filter(l => l.dias_ate_vencer <= 7).length;
      const vence15dias = transformedLeads.length;
      const valorTotal = transformedLeads.reduce((sum, l) => sum + (l.valor || 0), 0);

      setStats({
        totalNaFila: transformedLeads.filter(l => l.status_cobranca !== 'cobrado').length,
        vence7dias,
        vence15dias,
        valorTotal,
        cobradosHoje,
      });

      // Fetch distinct safras
      const { data: safraData } = await supabase
        .from('sales_base')
        .select('mes_safra')
        .not('mes_safra', 'is', null)
        .not('data_vencimento', 'is', null);

      const uniqueSafras = [...new Set((safraData || []).map(s => s.mes_safra).filter(Boolean))] as string[];
      setSafras(uniqueSafras.sort().reverse());

    } catch (err) {
      console.error('Error in usePreventiveCollection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const markAsCobrado = useCallback(async (salesBaseId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales_base')
        .update({ status_cobranca: 'cobrado' })
        .eq('id', salesBaseId);

      if (error) {
        console.error('Error marking as cobrado:', error);
        return false;
      }

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === salesBaseId 
          ? { ...lead, status_cobranca: 'cobrado' }
          : lead
      ));

      return true;
    } catch (err) {
      console.error('Error in markAsCobrado:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    leads,
    stats,
    safras,
    isLoading,
    filters,
    setFilters,
    refetch: fetchData,
    markAsCobrado,
  };
};
