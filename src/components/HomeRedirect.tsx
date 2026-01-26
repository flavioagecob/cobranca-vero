import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const HomeRedirect = () => {
  const { session, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Operadores vão para cobrança
  if (role === 'cobrador') {
    return <Navigate to="/collection" replace />;
  }

  // Admin e supervisor vão para dashboard
  return <Navigate to="/dashboard" replace />;
};
