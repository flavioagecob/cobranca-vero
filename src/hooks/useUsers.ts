import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface SystemUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  created_at: string | null;
}

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  phone?: string;
}

interface UpdateUserData {
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  phone?: string;
  password?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      // Create a map of user_id to role
      const roleMap = new Map<string, AppRole>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role));

      // Combine profiles with roles
      const combinedUsers: SystemUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: roleMap.get(profile.user_id) || 'cobrador',
        created_at: profile.created_at,
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (data: CreateUserData): Promise<boolean> => {
    try {
      setIsCreating(true);

      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: data,
      });

      if (error) {
        console.error('Error creating user:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Usuário criado',
        description: `O usuário ${data.full_name} foi criado com sucesso.`,
      });

      // Refresh the user list
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateUser = async (data: UpdateUserData): Promise<boolean> => {
    try {
      setIsUpdating(true);

      const { data: result, error } = await supabase.functions.invoke('update-user', {
        body: data,
      });

      if (error) {
        console.error('Error updating user:', error);
        throw new Error(error.message || 'Failed to update user');
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Usuário atualizado',
        description: `O usuário ${data.full_name} foi atualizado com sucesso.`,
      });

      // Refresh the user list
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message || 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleLabel = (role: AppRole): string => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor';
      case 'cobrador':
        return 'Operador';
      default:
        return role;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    isLoading,
    isCreating,
    isUpdating,
    createUser,
    updateUser,
    refreshUsers: fetchUsers,
    getRoleLabel,
  };
}
