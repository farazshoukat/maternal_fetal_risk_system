 import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * @param {string} requiredRole - 'patient' | 'doctor' | undefined (any authenticated user)
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Hard cap: if still loading after 4s, treat as unauthenticated
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
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
    // If profile hasn't loaded yet (e.g. table missing), don't redirect in a loop
    if (profile === null) {
      // Profile failed to fetch — send to login so user can re-authenticate
      // once the profiles table is set up
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

