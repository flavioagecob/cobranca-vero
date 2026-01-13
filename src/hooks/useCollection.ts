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

interface UseCollectionReturn {
  queue: CollectionQueueItem[];
  selectedCustomer: CollectionQueueItem | null;
  attempts: CollectionAttempt[];
  promises: PaymentPromise[];
  isLoading: boolean;
  error: string | null;
  selectCustomer: (customer: CollectionQueueItem) => void;
  registerAttempt: (data: NewAttempt) => Promise<void>;
  registerPromise: (data: NewPromise) => Promise<void>;
  updatePromiseStatus: (id: string, status: PromiseStatus) => Promise<void>;
  refreshQueue: () => void;
  nextCustomer: () => void;
  previousCustomer: () => void;
}

interface NewAttempt {
  customer_id: string;
  invoice_id?: string;
  canal: AttemptChannel;
  resultado: AttemptResult;
  observacoes?: string;
}

interface NewPromise {
  customer_id: string;
  invoice_id?: string;
  attempt_id?: string;
  valor_prometido: number;
  data_pagamento_previsto: string;
  observacoes?: string;
}

export const useCollection = (): UseCollectionReturn => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<CollectionQueueItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CollectionQueueItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [attempts, setAttempts] = useState<CollectionAttempt[]>([]);
  const [promises, setPromises] = useState<PaymentPromise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collection queue - customers with pending invoices
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch customers with their invoice stats
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          nome,
          cpf_cnpj,
          telefone,
          telefone2,
          email
        `)
        .order('nome');

      if (customersError) throw customersError;

      // For now, create a simulated queue since we don't have invoices data yet
      // In production, this would join with invoices table
      const queueItems: CollectionQueueItem[] = (customers || []).map((c, index) => ({
        customer_id: c.id,
        customer_name: c.nome,
        customer_cpf_cnpj: c.cpf_cnpj,
        customer_phone: c.telefone,
        customer_phone2: c.telefone2,
        customer_email: c.email,
        total_pendente: 0, // Would come from invoices
        faturas_atrasadas: 0,
        max_dias_atraso: 0,
        ultima_tentativa: null,
        ultima_promessa: null,
        priority_score: index, // Simulated priority
      }));

      setQueue(queueItems);
      
      if (queueItems.length > 0 && !selectedCustomer) {
        setSelectedCustomer(queueItems[0]);
        setSelectedIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fila de cobrança');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCustomer]);

  // Fetch attempts for selected customer
  const fetchAttempts = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_attempts')
        .select('*')
        .eq('customer_id', customerId)
        .order('data_tentativa', { ascending: false })
        .limit(20);

      if (error) {
        // Table might not exist yet
        console.log('Collection attempts table not available:', error.message);
        setAttempts([]);
        return;
      }

      setAttempts(data || []);
    } catch (err) {
      console.error('Error fetching attempts:', err);
      setAttempts([]);
    }
  }, []);

  // Fetch promises for selected customer
  const fetchPromises = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_promises')
        .select('*')
        .eq('customer_id', customerId)
        .order('data_pagamento_previsto', { ascending: false })
        .limit(20);

      if (error) {
        // Table might not exist yet
        console.log('Payment promises table not available:', error.message);
        setPromises([]);
        return;
      }

      setPromises(data || []);
    } catch (err) {
      console.error('Error fetching promises:', err);
      setPromises([]);
    }
  }, []);

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

    const { error } = await supabase
      .from('collection_attempts')
      .insert({
        customer_id: data.customer_id,
        invoice_id: data.invoice_id || null,
        user_id: user.id,
        canal: data.canal,
        resultado: data.resultado,
        observacoes: data.observacoes || null,
        data_tentativa: new Date().toISOString(),
      });

    if (error) throw error;

    // Refresh attempts
    await fetchAttempts(data.customer_id);
  }, [user, fetchAttempts]);

  const registerPromise = useCallback(async (data: NewPromise) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('payment_promises')
      .insert({
        customer_id: data.customer_id,
        invoice_id: data.invoice_id || null,
        attempt_id: data.attempt_id || null,
        user_id: user.id,
        valor_prometido: data.valor_prometido,
        data_promessa: new Date().toISOString().split('T')[0],
        data_pagamento_previsto: data.data_pagamento_previsto,
        status: 'pendente',
        observacoes: data.observacoes || null,
      });

    if (error) throw error;

    // Refresh promises
    await fetchPromises(data.customer_id);
  }, [user, fetchPromises]);

  const updatePromiseStatus = useCallback(async (id: string, status: PromiseStatus) => {
    const { error } = await supabase
      .from('payment_promises')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

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
    selectCustomer,
    registerAttempt,
    registerPromise,
    updatePromiseStatus,
    refreshQueue: fetchQueue,
    nextCustomer,
    previousCustomer,
  };
};
