import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Guards routes by checking the live Supabase session (via onAuthStateChange in
 * AuthContext). Re-verifies on every mount — not just on initial app load.
 *
 * @param {string} requiredRole  - 'patient' | 'doctor' | undefined (any authed user)
 * @param {node}   children      - the layout/element to render if access is granted
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Hard cap: if still loading after 7s, stop waiting and treat as unauthenticated.
  // This prevents infinite spinner if Supabase is unreachable.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading && !profileLoading) return;
    const t = setTimeout(() => setTimedOut(true), 7000);
    return () => clearTimeout(t);
  }, [loading, profileLoading]);

  // ── 1. Still loading — show spinner (unless timed out) ────────────────────
  if ((loading || profileLoading) && !timedOut) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  // ── 2. No session — redirect to login, preserving intended destination ────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── 3. Role check ─────────────────────────────────────────────────────────
  // Only enforce role if requiredRole is specified AND profile has loaded.
  // If profile is still null after user resolved (e.g. DB issue), fall back
  // to user_metadata role to avoid permanent lockout.
  if (requiredRole && (profile || timedOut)) {
    const actualRole = profile?.role
      ?? user?.user_metadata?.role
      ?? user?.user_metadata?.user_role
      ?? 'patient';  // safe default

    if (actualRole !== requiredRole) {
      const fallback = actualRole === 'doctor' ? '/clinical' : '/patient';
      return <Navigate to={fallback} replace />;
    }
  }

  // ── 4. Access granted ─────────────────────────────────────────────────────
  return children;
}

export default ProtectedRoute;
