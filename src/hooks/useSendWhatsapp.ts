import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Instance } from '@/types/instance';

interface SendWhatsappResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

export function useSendWhatsapp() {
  const [connectedInstances, setConnectedInstances] = useState<Instance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInstances, setIsFetchingInstances] = useState(true);

  // Fetch connected instances on mount
  useEffect(() => {
    async function fetchConnectedInstances() {
      setIsFetchingInstances(true);
      try {
        const { data, error } = await supabase
          .from('instances')
          .select('*')
          .eq('status', 'connected')
          .order('name');

        if (error) {
          console.error('Error fetching instances:', error);
          return;
        }

        const instances = (data || []) as Instance[];
        setConnectedInstances(instances);
        
        // Auto-select first instance if only one
        if (instances.length === 1) {
          setSelectedInstanceId(instances[0].instance_id);
        }
      } catch (err) {
        console.error('Error fetching instances:', err);
      } finally {
        setIsFetchingInstances(false);
      }
    }

    fetchConnectedInstances();
  }, []);

  const sendMessage = async (
    phone: string, 
    message: string,
    customerId?: string,
    invoiceId?: string
  ): Promise<SendWhatsappResult> => {
    if (!selectedInstanceId) {
      return { success: false, error: 'Nenhuma instância selecionada' };
    }

    if (!phone) {
      return { success: false, error: 'Telefone não informado' };
    }

    if (!message) {
      return { success: false, error: 'Mensagem não informada' };
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          instance_id: selectedInstanceId,
          phone,
          message,
          customer_id: customerId,
          invoice_id: invoiceId,
        },
      });

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message || 'Erro ao enviar mensagem' };
      }

      return data as SendWhatsappResult;
    } catch (err) {
      console.error('Error sending message:', err);
      return { success: false, error: 'Erro ao enviar mensagem' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    connectedInstances,
    selectedInstanceId,
    setSelectedInstanceId,
    sendMessage,
    isLoading,
    isFetchingInstances,
    hasConnectedInstance: connectedInstances.length > 0,
  };
}
