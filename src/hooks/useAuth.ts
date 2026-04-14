import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  display_name?: string;
  name?: string;
  email?: string;
  is_premium: boolean;
  updated_at?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchProfile(currentUser: User): Promise<void> {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!active) return;

      if (data) {
        setProfile({ ...data, name: data.display_name });
      } else {
        setProfile({
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
          is_premium: false,
        });
      }
    }

    async function fetchSession() {
      const timeoutId = setTimeout(() => {
        if (active) setLoading(false);
      }, 5000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (!active) return;

        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth Fetch Error:", err);
      } finally {
        clearTimeout(timeoutId);
        if (active) setLoading(false);
      }
    }

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;

      const currentUser = session?.user ?? null;
      if (!active) return;

      setUser(currentUser);

      if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        await fetchProfile(currentUser);
      } else if (!currentUser) {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      // Limpar estado imediatamente
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout failed:", err);
      // Mesmo com erro, limpar o estado local
      setUser(null);
      setProfile(null);
    }
  };

  return { user, profile, loading, loginWithGoogle, logout };
}
