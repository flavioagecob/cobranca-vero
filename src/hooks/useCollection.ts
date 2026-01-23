import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  CollectionAttempt, 
  PaymentPromise, 
  CollectionQueueItem,
  AttemptChannel,
  AttemptResult,
  PromiseStatus
} from '@/types/collection';

export interface CollectionFilters {
  safra: string;
  parcela: string;
}

interface UseCollectionReturn {
  queue: CollectionQueueItem[];
  selectedCustomer: CollectionQueueItem | null;
  attempts: CollectionAttempt[];
  promises: PaymentPromise[];
  isLoading: boolean;
  error: string | null;
  filters: CollectionFilters;
  safraOptions: string[];
  parcelaOptions: string[];
  setFilters: (filters: CollectionFilters) => void;
  selectCustomer: (customer: CollectionQueueItem) => void;
  registerAttempt: (data: NewAttempt) => Promise<void>;
  registerPromise: (data: NewPromise) => Promise<void>;
  updatePromiseStatus: (id: string, status: PromiseStatus) => Promise<void>;
  refreshQueue: () => void;
  nextCustomer: () => void;
  previousCustomer: () => void;
}

// Aligned with Supabase table structure
interface NewAttempt {
  customer_id: string;
  invoice_id: string;
  channel: AttemptChannel;
  status: AttemptResult;
  notes?: string;
}

interface NewPromise {
  invoice_id: string;
  valor_prometido: number;
  data_prometida: string;
}

// LocalStorage keys for fallback
const LS_ATTEMPTS_KEY = 'collection_attempts';
const LS_PROMISES_KEY = 'payment_promises';

const getLocalStorageData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocalStorageData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const useCollection = (): UseCollectionReturn => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<CollectionQueueItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CollectionQueueItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [attempts, setAttempts] = useState<CollectionAttempt[]>([]);
  const [promises, setPromises] = useState<PaymentPromise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CollectionFilters>({ safra: 'all', parcela: 'all' });
  const [safraOptions, setSafraOptions] = useState<string[]>([]);
  const [parcelaOptions, setParcelaOptions] = useState<string[]>([]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data: contracts } = await supabase
        .from('operator_contracts')
        .select('mes_safra_cadastro, numero_fatura');
      
      if (contracts) {
        const safras = [...new Set(contracts.map(c => c.mes_safra_cadastro).filter(Boolean))] as string[];
        const parcelas = [...new Set(contracts.map(c => c.numero_fatura).filter(Boolean))] as string[];
        setSafraOptions(safras.sort().reverse());
        setParcelaOptions(parcelas.sort());
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Fetch collection queue - only overdue customers
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Build query for overdue contracts (unpaid and past due date)
      let query = supabase
        .from('operator_contracts')
        .select(`
          id,
          customer_id,
          valor_fatura,
          data_vencimento,
          data_pagamento,
          numero_fatura,
          mes_safra_cadastro,
          customers!inner (
            id, nome, cpf_cnpj, telefone, telefone2, email
          )
        `)
        .is('data_pagamento', null)
        .lt('data_vencimento', today);
      
      // Apply filters
      if (filters.safra !== 'all') {
        query = query.eq('mes_safra_cadastro', filters.safra);
      }
      if (filters.parcela !== 'all') {
        query = query.eq('numero_fatura', filters.parcela);
      }

      const { data: contracts, error: contractsError } = await query;

      if (contractsError) throw contractsError;

      // Group by customer
      const customerMap = new Map<string, CollectionQueueItem>();

      contracts?.forEach((contract) => {
        const customer = contract.customers as unknown as {
          id: string;
          nome: string;
          cpf_cnpj: string;
          telefone: string | null;
          telefone2: string | null;
          email: string | null;
        };
        
        const diasAtraso = Math.floor(
          (new Date().getTime() - new Date(contract.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
        );

        const existing = customerMap.get(customer.id);

        if (existing) {
          existing.total_pendente += contract.valor_fatura || 0;
          existing.faturas_atrasadas += 1;
          existing.max_dias_atraso = Math.max(existing.max_dias_atraso, diasAtraso);
          existing.priority_score = Math.max(existing.priority_score, diasAtraso);
        } else {
          customerMap.set(customer.id, {
            customer_id: customer.id,
            customer_name: customer.nome,
            customer_cpf_cnpj: customer.cpf_cnpj,
            customer_phone: customer.telefone,
            customer_phone2: customer.telefone2,
            customer_email: customer.email,
            total_pendente: contract.valor_fatura || 0,
            faturas_atrasadas: 1,
            max_dias_atraso: diasAtraso,
            ultima_tentativa: null,
            ultima_promessa: null,
            priority_score: diasAtraso,
            first_invoice_id: contract.id, // Store first invoice for attempts
          });
        }
      });

      // Sort by priority (most overdue first)
      const queueItems = Array.from(customerMap.values())
        .sort((a, b) => b.priority_score - a.priority_score);

      setQueue(queueItems);
      
      if (queueItems.length > 0) {
        setSelectedCustomer(queueItems[0]);
        setSelectedIndex(0);
      } else {
        setSelectedCustomer(null);
        setSelectedIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fila de cobrança');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch attempts for selected customer (with localStorage fallback)
  const fetchAttempts = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_attempts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Fallback to localStorage
        const localAttempts = getLocalStorageData<CollectionAttempt>(LS_ATTEMPTS_KEY)
          .filter(a => a.customer_id === customerId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAttempts(localAttempts);
        return;
      }

      setAttempts(data || []);
    } catch (err) {
      console.error('Error fetching attempts:', err);
      // Fallback to localStorage
      const localAttempts = getLocalStorageData<CollectionAttempt>(LS_ATTEMPTS_KEY)
        .filter(a => a.customer_id === customerId);
      setAttempts(localAttempts);
    }
  }, []);

  // Fetch promises for selected customer via invoice_ids (with localStorage fallback)
  const fetchPromises = useCallback(async (customerId: string) => {
    try {
      // First get all invoice_ids for this customer
      const { data: contracts } = await supabase
        .from('operator_contracts')
        .select('id')
        .eq('customer_id', customerId);

      const invoiceIds = contracts?.map(c => c.id) || [];

      if (invoiceIds.length === 0) {
        setPromises([]);
        return;
      }

      const { data, error } = await supabase
        .from('payment_promises')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('data_prometida', { ascending: false })
        .limit(20);

      if (error) {
        // Fallback to localStorage
        const localPromises = getLocalStorageData<PaymentPromise>(LS_PROMISES_KEY)
          .filter(p => invoiceIds.includes(p.invoice_id))
          .sort((a, b) => new Date(b.data_prometida).getTime() - new Date(a.data_prometida).getTime());
        setPromises(localPromises);
        return;
      }

      setPromises(data || []);
    } catch (err) {
      console.error('Error fetching promises:', err);
      setPromises([]);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchAttempts(selectedCustomer.customer_id);
      fetchPromises(selectedCustomer.customer_id);
    }
  }, [selectedCustomer, fetchAttempts, fetchPromises]);

  const selectCustomer = useCallback((customer: CollectionQueueItem) => {
    const index = queue.findIndex((c) => c.customer_id === customer.customer_id);
    setSelectedCustomer(customer);
    setSelectedIndex(index >= 0 ? index : 0);
  }, [queue]);

  const nextCustomer = useCallback(() => {
    if (queue.length === 0) return;
    const newIndex = (selectedIndex + 1) % queue.length;
    setSelectedIndex(newIndex);
    setSelectedCustomer(queue[newIndex]);
  }, [queue, selectedIndex]);

  const previousCustomer = useCallback(() => {
    if (queue.length === 0) return;
    const newIndex = selectedIndex === 0 ? queue.length - 1 : selectedIndex - 1;
    setSelectedIndex(newIndex);
    setSelectedCustomer(queue[newIndex]);
  }, [queue, selectedIndex]);

  const registerAttempt = useCallback(async (data: NewAttempt) => {
    if (!user) throw new Error('Usuário não autenticado');

    const newAttempt: CollectionAttempt = {
      id: crypto.randomUUID(),
      customer_id: data.customer_id,
      invoice_id: data.invoice_id,
      collector_id: user.id,
      channel: data.channel,
      status: data.status,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('collection_attempts')
        .insert(newAttempt);

      if (error) {
        console.error('Supabase insert error:', error);
        // Fallback to localStorage
        const localAttempts = getLocalStorageData<CollectionAttempt>(LS_ATTEMPTS_KEY);
        localAttempts.push(newAttempt);
        setLocalStorageData(LS_ATTEMPTS_KEY, localAttempts);
      }
    } catch (err) {
      console.error('Error registering attempt:', err);
      // Fallback to localStorage
      const localAttempts = getLocalStorageData<CollectionAttempt>(LS_ATTEMPTS_KEY);
      localAttempts.push(newAttempt);
      setLocalStorageData(LS_ATTEMPTS_KEY, localAttempts);
    }

    // Refresh attempts
    await fetchAttempts(data.customer_id);
  }, [user, fetchAttempts]);

  const registerPromise = useCallback(async (data: NewPromise) => {
    if (!user) throw new Error('Usuário não autenticado');

    const newPromise: PaymentPromise = {
      id: crypto.randomUUID(),
      invoice_id: data.invoice_id,
      collector_id: user.id,
      valor_prometido: data.valor_prometido,
      data_prometida: data.data_prometida,
      status: 'pendente',
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('payment_promises')
        .insert(newPromise);

      if (error) {
        console.error('Supabase insert error:', error);
        // Fallback to localStorage
        const localPromises = getLocalStorageData<PaymentPromise>(LS_PROMISES_KEY);
        localPromises.push(newPromise);
        setLocalStorageData(LS_PROMISES_KEY, localPromises);
      }
    } catch (err) {
      console.error('Error registering promise:', err);
      // Fallback to localStorage
      const localPromises = getLocalStorageData<PaymentPromise>(LS_PROMISES_KEY);
      localPromises.push(newPromise);
      setLocalStorageData(LS_PROMISES_KEY, localPromises);
    }

    // Refresh promises if we have the customer
    if (selectedCustomer) {
      await fetchPromises(selectedCustomer.customer_id);
    }
  }, [user, selectedCustomer, fetchPromises]);

  const updatePromiseStatus = useCallback(async (id: string, status: PromiseStatus) => {
    try {
      const { error } = await supabase
        .from('payment_promises')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Error updating promise status:', error);
        // Fallback to localStorage
        const localPromises = getLocalStorageData<PaymentPromise>(LS_PROMISES_KEY);
        const idx = localPromises.findIndex(p => p.id === id);
        if (idx !== -1) {
          localPromises[idx].status = status;
          setLocalStorageData(LS_PROMISES_KEY, localPromises);
        }
      }
    } catch (err) {
      console.error('Error updating promise:', err);
      // Fallback to localStorage
      const localPromises = getLocalStorageData<PaymentPromise>(LS_PROMISES_KEY);
      const idx = localPromises.findIndex(p => p.id === id);
      if (idx !== -1) {
        localPromises[idx].status = status;
        setLocalStorageData(LS_PROMISES_KEY, localPromises);
      }
    }

    if (selectedCustomer) {
      await fetchPromises(selectedCustomer.customer_id);
    }
  }, [selectedCustomer, fetchPromises]);

  return {
    queue,
    selectedCustomer,
    attempts,
    promises,
    isLoading,
    error,
    filters,
    safraOptions,
    parcelaOptions,
    setFilters,
    selectCustomer,
    registerAttempt,
    registerPromise,
    updatePromiseStatus,
    refreshQueue: fetchQueue,
    nextCustomer,
    previousCustomer,
  };
};
