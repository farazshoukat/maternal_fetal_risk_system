import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, Bell, Search, Stethoscope, ArrowLeft, Zap, BarChart2, Settings } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

const ClinicalLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { alertLog } = useAlerts();
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => location.pathname.startsWith(path);

  const unreadAlerts = alertLog.filter(a => a.riskLevel.includes('High')).length;

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
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: 'var(--gradient-primary)', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 0 15px rgba(14,165,233,0.3)' }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>MaternalAI</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Clinical Dashboard v2</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            Clinical
          </div>
          <NavLink to="/clinical/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavLink to="/clinical/patients" icon={Users} label="Patients" />
          <NavLink to="/clinical/analytics" icon={BarChart2} label="Analytics" />

          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem', margin: '1rem 0 0.5rem' }}>
            Automation
          </div>
          <NavLink to="/clinical/alerts" icon={Zap} label="Alert Workflows" badge={unreadAlerts} />
        </nav>

        {/* Bottom */}
        <div style={{ padding: '1rem 0.875rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Doctor profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', marginBottom: '0.5rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>Dr</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dr. Sarah Smith</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Obstetrician</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1rem', borderRadius: '10px', width: '100%',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.1)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <ArrowLeft size={17} /> Back to Home
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
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
            padding: '0.5rem 1rem', width: '280px',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'border-color 0.2s',
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
            {/* n8n status pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.875rem', borderRadius: '999px',
              background: 'rgba(255,100,22,0.1)', border: '1px solid rgba(255,100,22,0.2)',
              fontSize: '0.75rem', fontWeight: 600, color: '#ff6416',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff6416', animation: 'pulse-ok 2s ease-in-out infinite' }} />
              n8n Active
            </div>

            {/* Bell */}
            <Link to="/clinical/alerts" style={{ position: 'relative', display: 'flex' }}>
              <Bell size={20} color="var(--color-text-secondary)" />
              {unreadAlerts > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'var(--color-danger)', color: 'white',
                  fontSize: '0.55rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                }}>
                  {unreadAlerts}
                </span>
              )}
            </Link>

            {/* User pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.25rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>Dr</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dr. Smith</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Obstetrician</div>
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
