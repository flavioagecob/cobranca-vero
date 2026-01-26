import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'supervisor' | 'cobrador';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  userDataLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  
  // Separate loading states for auth and user data
  const [authInitialized, setAuthInitialized] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  
  // Request ID to prevent stale responses
  const fetchRequestId = useRef(0);

  // Effect 1: Auth state listener (100% synchronous callback)
  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener with SYNCHRONOUS callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        // Only synchronous state updates here - no Supabase calls!
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Mark auth as initialized after first event
        if (!authInitialized) {
          setAuthInitialized(true);
        }
        
        // If user logged out, clear user data
        if (!currentSession?.user) {
          setProfile(null);
          setRole(null);
          setUserDataLoaded(false);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAuthInitialized(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: Fetch user data when user.id changes (separate from auth listener)
  useEffect(() => {
    const userId = user?.id;
    
    if (!userId) {
      // No user, reset user data states
      setProfile(null);
      setRole(null);
      setUserDataLoading(false);
      setUserDataLoaded(false);
      return;
    }

    // Increment request ID to track this fetch
    const currentRequestId = ++fetchRequestId.current;
    
    const fetchUserData = async () => {
      setUserDataLoading(true);
      setUserDataLoaded(false);

      try {
        // Fetch profile and role in parallel
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('users_profile')
            .select('id, user_id, full_name, email, phone')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle()
        ]);

        // Check if this is still the current request (prevent stale updates)
        if (fetchRequestId.current !== currentRequestId) {
          return;
        }

        if (profileResult.data) {
          setProfile(profileResult.data as UserProfile);
        }

        if (roleResult.data) {
          setRole(roleResult.data.role as AppRole);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        // Only update loading state if this is still the current request
        if (fetchRequestId.current === currentRequestId) {
          setUserDataLoading(false);
          setUserDataLoaded(true);
        }
      }
    };

    fetchUserData();
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
    setUserDataLoaded(false);
  };

  // Combined loading state:
  // - auth not initialized yet, OR
  // - user exists but user data is still loading
  const isLoading = !authInitialized || (!!user && userDataLoading);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    role,
    isLoading,
    userDataLoaded,
    signIn,
    signOut,
  }), [session, user, profile, role, isLoading, userDataLoaded]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
