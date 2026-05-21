import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      // Query profile beserta nama role via join
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          role_id,
          full_name,
          email,
          roles ( name )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('fetchProfile error:', error);
        // Jika profile belum ada, set default cashier
        setRole('cashier');
        return;
      }

      if (data) {
        // Cek apakah join roles berhasil
        if (data.roles && data.roles.name) {
          setRole(data.roles.name);
        } else if (data.role_id) {
          // Fallback: ambil nama role secara terpisah
          const { data: roleData } = await supabase
            .from('roles')
            .select('name')
            .eq('id', data.role_id)
            .single();
          setRole(roleData?.name || 'cashier');
        } else {
          setRole('cashier');
        }
      } else {
        // Belum ada profile → buat otomatis dengan role cashier
        await supabase.from('profiles').upsert({
          id: userId,
          email: (await supabase.auth.getUser()).data.user?.email,
          role_id: 2
        });
        setRole('cashier');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setRole('cashier');
    } finally {
      setLoading(false);
    }
  };


  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    role,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
