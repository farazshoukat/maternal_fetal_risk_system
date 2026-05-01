import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, History, User } from 'lucide-react';

const PatientLayout = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="patient-layout">
      {/* Mobile Top Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderBottom: '1px solid var(--color-border)', padding: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container flex-center" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--color-accent)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Patient Portal</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
            <User size={16} />
            <span style={{ fontSize: '0.875rem' }}>Jane Doe</span>
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
        <Link to="/patient/log" style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
          color: isActive('/patient/log') ? 'var(--color-accent)' : 'var(--color-text-secondary)'
        }}>
          <Activity size={24} />
          <span style={{ fontSize: '0.75rem', fontWeight: isActive('/patient/log') ? 600 : 400 }}>Log Vitals</span>
        </Link>
        <Link to="/patient/history" style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
          color: isActive('/patient/history') ? 'var(--color-accent)' : 'var(--color-text-secondary)'
        }}>
          <History size={24} />
          <span style={{ fontSize: '0.75rem', fontWeight: isActive('/patient/history') ? 600 : 400 }}>History</span>
        </Link>
      </nav>
    </div>
  );
};

export default PatientLayout;
