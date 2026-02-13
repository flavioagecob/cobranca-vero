import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfDay } from 'date-fns';
import type { CollectionAttempt, AttemptChannel, AttemptResult } from '@/types/collection';

export interface PreventiveQueueItem {
  id: string; // sales_base id
  os: string;
  mes_safra: string | null;
  data_vencimento: string;
  dias_ate_vencer: number;
  status_cobranca: string | null;
  customer_id: string;
  customer_name: string;
  customer_cpf_cnpj: string;
  customer_phone: string | null;
  customer_phone2: string | null;
  customer_email: string | null;
  customer_cidade: string | null;
  customer_uf: string | null;
  has_attempt: boolean;
}

export interface PreventiveStats {
  totalNaFila: number;
  vence7dias: number;
  vence15dias: number;
  taxaContato: number;
  cobradosHoje: number;
}

export interface PreventiveFilters {
  safra?: string;
  diasAteVencer?: 'hoje' | '1-7' | '8-15' | 'todos';
  search?: string;
}

interface NewPreventiveAttempt {
  customer_id: string;
  channel: AttemptChannel;
  status: AttemptResult;
  notes?: string;
}

interface UsePreventiveCollectionReturn {
  queue: PreventiveQueueItem[];
  selectedCustomer: PreventiveQueueItem | null;
  attempts: CollectionAttempt[];
  stats: PreventiveStats;
  safras: string[];
  isLoading: boolean;
  filters: PreventiveFilters;
  setFilters: (filters: PreventiveFilters) => void;
  selectCustomer: (customer: PreventiveQueueItem) => void;
  nextCustomer: () => void;
  previousCustomer: () => void;
  registerAttempt: (data: NewPreventiveAttempt) => Promise<void>;
  refreshQueue: () => void;
  refreshHistory: () => Promise<void>;
}

export const usePreventiveCollection = (): UsePreventiveCollectionReturn => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<PreventiveQueueItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PreventiveQueueItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attempts, setAttempts] = useState<CollectionAttempt[]>([]);
  const [stats, setStats] = useState<PreventiveStats>({
    totalNaFila: 0, vence7dias: 0, vence15dias: 0, taxaContato: 0, cobradosHoje: 0,
  });
  const [safras, setSafras] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PreventiveFilters>({ diasAteVencer: 'todos' });
  const selectedCustomerIdRef = useRef<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    const currentSelectedId = selectedCustomerIdRef.current;

    try {
      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');
      const in15Days = format(addDays(today, 15), 'yyyy-MM-dd');
      const in7Days = format(addDays(today, 7), 'yyyy-MM-dd');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Build query - only preventivo status (exclude migrado, pago)
      let query = supabase
        .from('sales_base')
        .select(`
          id, os, mes_safra, data_vencimento, valor, status_cobranca, customer_id,
          customer:customers!inner(id, nome, cpf_cnpj, telefone, telefone2, email, cidade, uf)
        `)
        .not('data_vencimento', 'is', null)
        .eq('status_cobranca', 'preventivo')
        .order('data_vencimento', { ascending: true });

      // Apply safra filter
      if (filters.safra) {
        query = query.eq('mes_safra', filters.safra);
      }

      // Apply dias filter
      if (filters.diasAteVencer === 'hoje') {
        query = query.eq('data_vencimento', todayStr);
      } else if (filters.diasAteVencer === '1-7') {
        query = query.gte('data_vencimento', todayStr).lte('data_vencimento', in7Days);
      } else if (filters.diasAteVencer === '8-15') {
        query = query.gt('data_vencimento', in7Days).lte('data_vencimento', in15Days);
      } else {
        // todos - show all preventive leads (no date filter, they may be any date)
      }

      // Fetch queue and attempts in parallel
      const [leadsResult, attemptsResult] = await Promise.all([
        query,
        supabase
          .from('collection_attempts')
          .select('customer_id, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (leadsResult.error) {
        console.error('Error fetching preventive leads:', leadsResult.error);
        return;
      }

      // Build attempt map
      const attemptMap = new Map<string, boolean>();
      const attemptedTodaySet = new Set<string>();
      attemptsResult.data?.forEach(a => {
        attemptMap.set(a.customer_id, true);
        if (a.created_at && new Date(a.created_at) >= todayStart) {
          attemptedTodaySet.add(a.customer_id);
        }
      });

      // Transform
      const items: PreventiveQueueItem[] = (leadsResult.data || []).map((item: any) => {
        const vencimento = new Date(item.data_vencimento);
        const diasAteVencer = Math.ceil((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const customer = item.customer;

        return {
          id: item.id,
          os: item.os,
          mes_safra: item.mes_safra,
          data_vencimento: item.data_vencimento,
          dias_ate_vencer: diasAteVencer,
          status_cobranca: item.status_cobranca,
          customer_id: customer.id,
          customer_name: customer.nome,
          customer_cpf_cnpj: customer.cpf_cnpj,
          customer_phone: customer.telefone,
          customer_phone2: customer.telefone2,
          customer_email: customer.email,
          customer_cidade: customer.cidade,
          customer_uf: customer.uf,
          has_attempt: attemptMap.has(customer.id),
        };
      });

      // Filter by search
      const filteredItems = items.filter(item => {
        if (!filters.search) return true;
        const s = filters.search.toLowerCase();
        return item.customer_name.toLowerCase().includes(s) ||
          item.customer_cpf_cnpj.includes(s.replace(/\D/g, '')) ||
          item.os.includes(s);
      });

      setQueue(filteredItems);

      // Stats (from unfiltered data for accurate counts)
      const vence7dias = items.filter(l => l.dias_ate_vencer <= 7).length;
      const cobradosHoje = items.filter(l => attemptedTodaySet.has(l.customer_id)).length;

      const contatados = items.filter(l => attemptMap.has(l.customer_id)).length;
      const taxaContato = items.length > 0 ? Math.round((contatados / items.length) * 100) : 0;

      setStats({
        totalNaFila: items.filter(l => !attemptedTodaySet.has(l.customer_id)).length,
        vence7dias,
        vence15dias: items.length,
        taxaContato,
        cobradosHoje,
      });

      // Selection
      if (filteredItems.length > 0) {
        const prevIdx = currentSelectedId
          ? filteredItems.findIndex(c => c.id === currentSelectedId)
          : -1;
        if (prevIdx >= 0) {
          setSelectedCustomer(filteredItems[prevIdx]);
          setSelectedIndex(prevIdx);
        } else {
          setSelectedCustomer(filteredItems[0]);
          setSelectedIndex(0);
          selectedCustomerIdRef.current = filteredItems[0].id;
        }
      } else {
        setSelectedCustomer(null);
        setSelectedIndex(0);
        selectedCustomerIdRef.current = null;
      }

      // Fetch safras
      const { data: safraData } = await supabase
        .from('sales_base')
        .select('mes_safra')
        .eq('status_cobranca', 'preventivo')
        .not('mes_safra', 'is', null);

      const uniqueSafras = [...new Set((safraData || []).map(s => s.mes_safra).filter(Boolean))] as string[];
      setSafras(uniqueSafras.sort().reverse());

    } catch (err) {
      console.error('Error in usePreventiveCollection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchAttempts = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_attempts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching attempts:', error);
        setAttempts([]);
        return;
      }
      setAttempts(data || []);
    } catch (err) {
      console.error('Error fetching attempts:', err);
      setAttempts([]);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchAttempts(selectedCustomer.customer_id);
    }
  }, [selectedCustomer, fetchAttempts]);

  const selectCustomer = useCallback((customer: PreventiveQueueItem) => {
    const index = queue.findIndex(c => c.id === customer.id);
    setSelectedCustomer(customer);
    setSelectedIndex(index >= 0 ? index : 0);
    selectedCustomerIdRef.current = customer.id;
  }, [queue]);

  const nextCustomer = useCallback(() => {
    if (queue.length === 0) return;
    const newIndex = (selectedIndex + 1) % queue.length;
    setSelectedIndex(newIndex);
    setSelectedCustomer(queue[newIndex]);
    selectedCustomerIdRef.current = queue[newIndex].id;
  }, [queue, selectedIndex]);

  const previousCustomer = useCallback(() => {
    if (queue.length === 0) return;
    const newIndex = selectedIndex === 0 ? queue.length - 1 : selectedIndex - 1;
    setSelectedIndex(newIndex);
    setSelectedCustomer(queue[newIndex]);
    selectedCustomerIdRef.current = queue[newIndex].id;
  }, [queue, selectedIndex]);

  const registerAttempt = useCallback(async (data: NewPreventiveAttempt) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('collection_attempts')
        .insert({
          customer_id: data.customer_id,
          invoice_id: null as any,
          collector_id: user.id,
          channel: data.channel,
          status: data.status,
          notes: data.notes || null,
        });

      if (error) {
        console.error('Supabase insert error:', error);
      }
    } catch (err) {
      console.error('Error registering attempt:', err);
    }

    await fetchAttempts(data.customer_id);
  }, [user, fetchAttempts]);

  const refreshHistory = useCallback(async () => {
    if (selectedCustomer) {
      await fetchAttempts(selectedCustomer.customer_id);
    }
  }, [selectedCustomer, fetchAttempts]);

  return {
    queue,
    selectedCustomer,
    attempts,
    stats,
    safras,
    isLoading,
    filters,
    setFilters,
    selectCustomer,
    nextCustomer,
    previousCustomer,
    registerAttempt,
    refreshQueue: fetchQueue,
    refreshHistory,
  };
};
