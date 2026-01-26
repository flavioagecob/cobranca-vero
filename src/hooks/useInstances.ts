import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Instance, CreateInstanceResult, ConnectResult, StatusResult } from '@/types/instance';
import { useToast } from '@/hooks/use-toast';

export function useInstances() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: instances = [], isLoading, error, refetch } = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Instance[];
    },
  });

  const createInstance = useCallback(async (name: string): Promise<CreateInstanceResult> => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('instance-webhook', {
        body: { action: 'create', name },
      });

      if (error) throw error;

      if (data?.success) {
        await queryClient.invalidateQueries({ queryKey: ['instances'] });
        toast({
          title: 'Instância criada',
          description: `A instância "${name}" foi criada com sucesso.`,
        });
        return { success: true, instance: data.instance };
      }

      return { success: false, error: data?.error || 'Erro ao criar instância' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao criar instância',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, [queryClient, toast]);

  const connectInstance = useCallback(async (instanceId: string, token: string): Promise<ConnectResult> => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('instance-webhook', {
        body: { action: 'connect', instance_id: instanceId, token },
      });

      if (error) throw error;

      if (data?.success) {
        return { success: true, qr_code_base64: data.qr_code_base64 };
      }

      return { success: false, error: data?.error || 'Erro ao conectar instância' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const checkStatus = useCallback(async (instanceId: string, token: string): Promise<StatusResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('instance-webhook', {
        body: { action: 'status', instance_id: instanceId, token },
      });

      if (error) throw error;

      if (data?.success) {
        if (data.status === 'connected') {
          await queryClient.invalidateQueries({ queryKey: ['instances'] });
        }
        return { success: true, status: data.status, phone_number: data.phone_number };
      }

      return { success: false, error: data?.error || 'Erro ao verificar status' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, [queryClient]);

  const disconnectInstance = useCallback(async (instanceId: string, token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('instance-webhook', {
        body: { action: 'disconnect', instance_id: instanceId, token },
      });

      if (error) throw error;

      if (data?.success) {
        await queryClient.invalidateQueries({ queryKey: ['instances'] });
        toast({
          title: 'Instância desconectada',
          description: 'A instância foi desconectada com sucesso.',
        });
        return true;
      }

      toast({
        title: 'Erro ao desconectar',
        description: data?.error || 'Erro ao desconectar instância',
        variant: 'destructive',
      });
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao desconectar',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [queryClient, toast]);

  const deleteInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('instances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast({
        title: 'Instância excluída',
        description: 'A instância foi excluída com sucesso.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });

  return {
    instances,
    isLoading,
    error: error instanceof Error ? error.message : null,
    isCreating,
    isConnecting,
    createInstance,
    connectInstance,
    checkStatus,
    disconnectInstance,
    deleteInstance: deleteInstanceMutation.mutate,
    refreshInstances: refetch,
  };
}
