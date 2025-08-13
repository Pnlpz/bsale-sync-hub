import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserStoreAccess, StoreContext } from '@/types/invitation';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'proveedor' | 'locatario' | 'admin';
  store_id?: string;
  proveedor_id?: string;
  marca_id?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  storeContext: StoreContext;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  switchStore: (storeId: string) => void;
  refreshStoreContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeContext, setStoreContext] = useState<StoreContext>({
    accessible_stores: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile and store context
          setTimeout(async () => {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching profile:', error);
            } else {
              setProfile(profileData);
              // Fetch accessible stores
              await fetchStoreContext();
            }
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setStoreContext({ accessible_stores: [] });
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch store context for the current user
  const fetchStoreContext = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_accessible_stores', {
        user_id: user.id,
      });

      if (error) {
        console.error('Error fetching accessible stores:', error);
        return;
      }

      const accessibleStores: UserStoreAccess[] = data || [];
      const currentStoreId = localStorage.getItem('current_store_id');

      // Validate current store is still accessible
      const isCurrentStoreValid = currentStoreId &&
        accessibleStores.some(store => store.store_id === currentStoreId);

      const newContext: StoreContext = {
        accessible_stores: accessibleStores,
        current_store_id: isCurrentStoreValid ? currentStoreId : undefined,
        default_store_id: accessibleStores[0]?.store_id,
      };

      // If no current store is set but user has access to stores, set the first one
      if (!newContext.current_store_id && newContext.default_store_id) {
        newContext.current_store_id = newContext.default_store_id;
        localStorage.setItem('current_store_id', newContext.default_store_id);
      }

      setStoreContext(newContext);
    } catch (error) {
      console.error('Error fetching store context:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Error de autenticación",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        }
      }
    });
    
    if (error) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registro exitoso",
        description: "Revisa tu correo para confirmar tu cuenta",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    } else {
      // Clear store context on sign out
      localStorage.removeItem('current_store_id');
      setStoreContext({ accessible_stores: [] });
    }
  };

  // Switch to a different store
  const switchStore = (storeId: string) => {
    const isValidStore = storeContext.accessible_stores.some(
      store => store.store_id === storeId
    );

    if (!isValidStore) {
      toast({
        title: "Error",
        description: "No tienes acceso a esta tienda",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('current_store_id', storeId);
    setStoreContext(prev => ({
      ...prev,
      current_store_id: storeId,
    }));

    toast({
      title: "Tienda cambiada",
      description: `Ahora estás viendo: ${storeContext.accessible_stores.find(s => s.store_id === storeId)?.store_name}`,
    });
  };

  // Refresh store context
  const refreshStoreContext = async () => {
    await fetchStoreContext();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      storeContext,
      signIn,
      signUp,
      signOut,
      switchStore,
      refreshStoreContext,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};