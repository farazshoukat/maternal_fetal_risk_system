import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, History, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PatientLayout = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { profile, signOut } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[PatientLayout] signOut error:', err);
    } finally {
      // Always navigate to login — even if signOut threw (e.g. session already gone)
      navigate('/login', { replace: true });
    }
  };

  const displayName = profile?.full_name || 'Patient';

  return (
    <div className="patient-layout">
      {/* Mobile Top Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderBottom: '1px solid var(--color-border)', padding: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container flex-center" style={{ justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--color-accent)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Doctors Poly Clinic</h2>
          </div>

          {/* User info + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
              <User size={15} />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{displayName}</span>
            </div>
            <button
              id="patient-logout-btn"
              onClick={handleLogout}
              title="Logout"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '0.5rem', padding: '0.35rem 0.75rem', cursor: 'pointer',
                color: '#ef4444', fontSize: '0.8rem', fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container" style={{ padding: '2rem 1.5rem', paddingBottom: '6rem' }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="glass-panel" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        padding: '0.75rem 1rem',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 10
      }}>
        <Link
          to="/patient/log"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
            color: isActive('/patient/log') ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}
        >
          <Activity size={24} />
          <span style={{ fontSize: '0.75rem', fontWeight: isActive('/patient/log') ? 600 : 400 }}>Log Vitals</span>
        </Link>
        <Link
          to="/patient/history"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
            color: isActive('/patient/history') ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            textDecoration: 'none',
          }}
        >
          <History size={24} />
          <span style={{ fontSize: '0.75rem', fontWeight: isActive('/patient/history') ? 600 : 400 }}>History</span>
        </Link>
      </nav>
    </div>
  );
};

export default PatientLayout;
