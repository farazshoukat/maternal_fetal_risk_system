import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Settings, Bell, Search, Stethoscope } from 'lucide-react';

const ClinicalLayout = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Desktop Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '260px', 
        borderRadius: 0, 
        borderRight: '1px solid var(--color-border)', 
        borderTop: 'none', borderBottom: 'none', borderLeft: 'none',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: 'var(--gradient-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <Stethoscope size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Maternal AI</h1>
        </div>

        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link to="/clinical/dashboard" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            background: isActive('/clinical/dashboard') ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
            color: isActive('/clinical/dashboard') ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontWeight: isActive('/clinical/dashboard') ? 600 : 400
          }}>
            <LayoutDashboard size={20} />
            Overview
          </Link>
          <Link to="/clinical/patients" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            background: isActive('/clinical/patients') ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
            color: isActive('/clinical/patients') ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontWeight: isActive('/clinical/patients') ? 600 : 400
          }}>
            <Users size={20} />
            Patients list
          </Link>
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link to="/" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            color: 'var(--color-text-muted)'
          }}>
            <Settings size={20} />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{ 
          height: '72px', borderBottom: '1px solid var(--color-border)', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', width: '300px' }}>
            <Search size={18} color="var(--color-text-muted)" style={{ marginRight: '0.5rem' }} />
            <input type="text" placeholder="Search patients..." style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.875rem' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} color="var(--color-text-secondary)" />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--color-danger)', borderRadius: '50%' }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Dr</div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Dr. Smith</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Obstetrician</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClinicalLayout;
