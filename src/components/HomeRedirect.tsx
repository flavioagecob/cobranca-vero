import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const HomeRedirect = () => {
  const { session, role, isLoading, userDataLoaded } = useAuth();

  // Still loading auth or user data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated, go to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // User data loaded but no role found (user without assigned role)
  if (userDataLoaded && !role) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Operators go to collection
  if (role === 'cobrador') {
    return <Navigate to="/collection" replace />;
  }

  // Admin and supervisor go to dashboard
  return <Navigate to="/dashboard" replace />;
};
