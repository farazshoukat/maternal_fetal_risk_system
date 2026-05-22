 import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * @param {string} requiredRole - 'patient' | 'doctor' | undefined (any authenticated user)
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Hard cap: if still loading after 6s, treat as unauthenticated
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading && !profileLoading) return;
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [loading, profileLoading]);

  // Wait for both auth session AND profile to finish loading
  if ((loading || profileLoading) && !timedOut) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    // Profile is null means it truly could not be fetched even with metadata fallback
    if (profile === null) {
      console.warn('[ProtectedRoute] No profile found — redirecting to login');
      return <Navigate to="/login" state={{ from: location, profileError: true }} replace />;
    }
    if (profile.role !== requiredRole) {
      const redirectTo = profile.role === 'doctor' ? '/clinical' : '/patient';
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;

