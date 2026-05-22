import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  {
    id: 'patient',
    label: 'Patient',
    icon: '🤱',
    description: 'Log vitals & track your health journey',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    glow: 'rgba(139,92,246,0.35)',
  },
  {
    id: 'doctor',
    label: 'Doctor / Clinician',
    icon: '🩺',
    description: 'Monitor patients & review risk assessments',
    gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)',
    glow: 'rgba(6,182,212,0.35)',
  },
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from?.pathname;

  const [selectedRole, setSelectedRole] = useState('patient');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const role = ROLES.find(r => r.id === selectedRole);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ email, password });
      // After login, redirect to the page they were trying to visit, or role default
      const defaultPath = selectedRole === 'doctor' ? '/clinical' : '/patient';
      navigate(from || defaultPath, { replace: true });
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Please confirm your email address first — check your inbox for a verification link.');
      } else if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(msg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Ambient background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🌸</span>
          <div>
            <p className="auth-logo-sub">Maternal-Fetal</p>
            <h1 className="auth-logo-title">Risk System</h1>
          </div>
        </div>

        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-subheading">Sign in to your account</p>

        {/* Role Selector */}
        <div className="auth-role-grid">
          {ROLES.map(r => (
            <button
              key={r.id}
              type="button"
              className={`auth-role-card ${selectedRole === r.id ? 'auth-role-card--active' : ''}`}
              style={selectedRole === r.id ? {
                '--role-gradient': r.gradient,
                '--role-glow': r.glow,
              } : {}}
              onClick={() => setSelectedRole(r.id)}
            >
              <span className="auth-role-icon">{r.icon}</span>
              <span className="auth-role-label">{r.label}</span>
              <span className="auth-role-desc">{r.description}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-pwd-wrap">
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            style={{ '--role-gradient': role.gradient, '--role-glow': role.glow }}
          >
            {loading ? <span className="auth-btn-spinner" /> : null}
            {loading ? 'Signing in…' : `Sign in as ${role.label}`}
          </button>
        </form>

        <p className="auth-footer-link">
          Don&apos;t have an account?{' '}
          <Link to="/signup">Create one</Link>
        </p>

        <p className="auth-disclaimer">
          ⚠️ For research &amp; educational use only — not a clinical tool.
        </p>
      </div>
    </div>
  );
}
