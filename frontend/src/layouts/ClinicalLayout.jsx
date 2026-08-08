import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, Search, Stethoscope, LogOut, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ClinicalLayout = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => location.pathname.startsWith(path);

  const displayName = profile?.full_name || 'Clinician';
  // Build initials from full name (max 2 chars)
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DR';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[ClinicalLayout] signOut error:', err);
    } finally {
      // Always navigate to login with replace so back button doesn't restore dashboard
      navigate('/login', { replace: true });
    }
  };

  const NavLink = ({ to, icon: Icon, label, badge }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.7rem 1rem', borderRadius: '10px',
          background: active ? 'rgba(14,165,233,0.12)' : 'transparent',
          color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          fontWeight: active ? 600 : 400,
          fontSize: '0.9rem',
          transition: 'all 0.15s ease',
          textDecoration: 'none',
          position: 'relative',
        }}
      >
        <Icon size={19} />
        {label}
        {badge > 0 && (
          <span style={{
            marginLeft: 'auto',
            minWidth: '20px', height: '20px',
            borderRadius: '999px',
            background: 'var(--color-danger)',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 8px rgba(239,68,68,0.5)',
            animation: 'pulseBadge 2s ease-in-out infinite',
          }}>
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ background: 'var(--gradient-primary)', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 0 15px rgba(22,163,74,0.3)' }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Doctors Poly Clinic</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Clinical Dashboard</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            Clinical
          </div>
          <NavLink to="/clinical/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavLink to="/clinical/patients"  icon={Users}           label="Patients" />
          <NavLink to="/clinical/analytics" icon={BarChart2}       label="Analytics" />


        </nav>

        {/* Bottom — profile + logout */}
        <div style={{ padding: '1rem 0.875rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Clinician profile pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.04)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Clinician</div>
            </div>
          </div>

          {/* Logout button — calls signOut() THEN navigates */}
          <button
            id="clinical-logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1rem', borderRadius: '10px', width: '100%',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px' }}>
        {/* Top bar */}
        <header style={{
          height: '68px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(0,0,0,0.05)', borderRadius: '10px',
            padding: '0.5rem 1rem', width: '280px',
            border: '1px solid var(--color-border)',
          }}>
            <Search size={16} color="var(--color-text-muted)" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.875rem', flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* User pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.25rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{displayName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Clinician</div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes pulseBadge { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes pulse-ok { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.75)} }
      `}</style>
    </div>
  );
};

export default ClinicalLayout;
