import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  {
    id: 'patient',
    label: 'Patient',
    icon: '🤱',
    description: 'Log vitals & track your pregnancy health',
    gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    glow: 'rgba(139,92,246,0.35)',
  },
  {
    id: 'doctor',
    label: 'Doctor / Clinician',
    icon: '🩺',
    description: 'Clinical dashboard & risk assessments',
    gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)',
    glow: 'rgba(6,182,212,0.35)',
  },
];

export default function Signup() {
  const { signUp } = useAuth();
  const navigate    = useNavigate();

  const [selectedRole, setSelectedRole] = useState('patient');
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPwd,   setShowPwd]   = useState(false);

  const role = ROLES.find(r => r.id === selectedRole);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp({ email, password, fullName, role: selectedRole });
      setSuccess(
        'Account created! Please check your email for a confirmation link, then sign in.'
      );
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card auth-card--wide">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🌸</span>
          <div>
            <p className="auth-logo-sub">Maternal-Fetal</p>
            <h1 className="auth-logo-title">Risk System</h1>
          </div>
        </div>

        <h2 className="auth-heading">Create an account</h2>
        <p className="auth-subheading">Join as a patient or clinician</p>

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
          <div className="auth-form-row">
            <div className="auth-field">
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-pwd-wrap">
                <input
                  id="signup-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Min 6 characters"
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

            <div className="auth-field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <input
                id="signup-confirm"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="auth-strength">
              <div
                className="auth-strength-bar"
                style={{
                  width: `${Math.min(100, (password.length / 12) * 100)}%`,
                  background: password.length < 6
                    ? '#ef4444'
                    : password.length < 10
                      ? '#f59e0b'
                      : '#10b981',
                }}
              />
            </div>
          )}

          {error   && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            style={{ '--role-gradient': role.gradient, '--role-glow': role.glow }}
          >
            {loading ? <span className="auth-btn-spinner" /> : null}
            {loading ? 'Creating account…' : `Create ${role.label} account`}
          </button>
        </form>

        <p className="auth-footer-link">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

        <p className="auth-disclaimer">
          ⚠️ For research &amp; educational use only — not a clinical tool.
        </p>
      </div>
    </div>
  );
}
