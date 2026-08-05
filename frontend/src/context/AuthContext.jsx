import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null); // { role: 'patient' | 'doctor', full_name }
  const [loading, setLoading]     = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Always build a profile from user_metadata — this is embedded in the JWT
  // and is available immediately without a DB round-trip.
  function profileFromMetadata(u) {
    const meta = u?.user_metadata || {};
    const role = meta.role || meta.user_role;
    return {
      role: role || 'patient',          // default to patient if role not set
      full_name: meta.full_name || meta.name || u?.email || 'User',
    };
  }

  async function fetchProfile(userId, userObj) {
    // Start with metadata-based profile immediately (no loading delay)
    const metaProfile = profileFromMetadata(userObj);
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .maybeSingle();           // maybeSingle() returns null (not error) when no row found
      if (!error && data) return data;  // DB row wins if it exists
      if (error) console.warn('[Auth] profiles table fetch:', error.message);
      return metaProfile;              // always fall back to JWT metadata
    } catch {
      return metaProfile;
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
