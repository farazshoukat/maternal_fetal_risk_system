import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null); // { role: 'patient' | 'doctor', full_name }
  const [loading, setLoading]     = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Build a profile from user_metadata as a fallback when the profiles table
  // row doesn't exist yet (e.g. right after sign-up before the trigger fires).
  function profileFromMetadata(u) {
    const meta = u?.user_metadata || {};
    if (!meta.role) return null;
    return { role: meta.role, full_name: meta.full_name || meta.email || u.email };
  }

  async function fetchProfile(userId, userObj) {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[Auth] Could not fetch profile:', error.message);
        // Fall back to user_metadata so sign-in still works
        return profileFromMetadata(userObj);
      }
      return data;
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Session listener ───────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    // 5-second hard timeout — never stay stuck on loading indefinitely
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] getSession timed out — clearing loading state.');
        setLoading(false);
      }
    }, 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id, session.user);
          if (mounted) setProfile(prof);
        }
      })
      .catch((err) => {
        console.error('[Auth] getSession error:', err);
      })
      .finally(() => {
        if (mounted) {
          clearTimeout(timeout);
          setLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          // Set loading=false immediately so the app renders, then fetch profile
          setLoading(false);
          const prof = await fetchProfile(session.user.id, session.user);
          if (mounted) setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ── Auth actions ───────────────────────────────────────────────────────────

  async function signUp({ email, password, fullName, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }, // stored in raw_user_meta_data
      },
    });
    if (error) throw error;

    // Insert into profiles table (via a Supabase trigger or manually here)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:        data.user.id,
        full_name: fullName,
        role:      role,
      });
    }
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    user,
    profile,
    loading,
    profileLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
