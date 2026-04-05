import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  display_name?: string;
  name?: string; // For backward compatibility in frontend
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
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id);
          
          const profileData = data?.[0] || null;
          if (profileData && active) {
            setProfile({ ...profileData, name: profileData.display_name });
          } else if (currentUser && active) {
            setProfile({ 
              id: currentUser.id, 
              name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
              is_premium: false 
            } as UserProfile);
          }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (!active) return;
      
      setUser(currentUser);
      
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id);
        
        const profileData = data?.[0] || null;
        if (profileData && active) {
          setProfile({ ...profileData, name: profileData.display_name });
        } else if (active) {
          setProfile({ 
            id: currentUser.id, 
            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
            is_premium: false 
          } as UserProfile);
        }
      } else if (active) {
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
    options: { redirectTo: import.meta.env.VITE_APP_URL }
  });

  const logout = () => {
     setUser(null);
     setProfile(null);
     supabase.auth.signOut();
  }

  return { user, profile, loading, loginWithGoogle, logout };
}
