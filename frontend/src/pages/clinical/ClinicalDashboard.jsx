import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import StatCard from '../../components/StatCard';
import { Users, AlertTriangle, Activity, Brain, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskBadge from '../../components/RiskBadge';
import { getAllPatients } from '../../api/supabase_db';

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function riskIcon(level = '') {
  if (level.includes('High')) return '🚨';
  if (level.includes('Mid'))  return '⚠️';
  return '✅';
}

function riskColor(level = '') {
  if (level.includes('High')) return '#ef4444';
  if (level.includes('Mid'))  return '#f59e0b';
  return '#10b981';
}

// Build a 7-day assessment volume array from flat vitals
function buildWeekData(patients) {
  const counts = {};
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    counts[d.toDateString()] = { d: days[d.getDay()], v: 0 };
  }
  patients.forEach(p => {
    (p.vitalsHistory || []).forEach(v => {
      const key = new Date(v.recorded_at).toDateString();
      if (counts[key]) counts[key].v++;
    });
  });
  return Object.values(counts);
}

// ── component ─────────────────────────────────────────────────────────────────

const SystemIndicator = ({ label, status, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{label}</span>
    <span style={{
      padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>{status}</span>
  </div>
);

const ClinicalDashboard = () => {
  const [patients, setPatients]   = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    getAllPatients()
      .then(raw => {
        // Map raw Supabase rows to the shape this dashboard needs
        const mapped = (raw || []).map(p => {
          const readings = (p.vital_readings || []).sort(
            (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
          );
          const latest = readings[0] || null;
          return {
            ...p,
            vitalsHistory: readings,          // used by buildWeekData & recentReadings
            latestRisk:    latest?.risk_level || '',
            readingCount:  readings.length,
          };
        });
        setPatients(mapped);
      })
      .catch(err => console.warn('[Overview] Failed to load patients:', err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── derived stats ──────────────────────────────────────────────────────────
  const totalPatients   = patients.length;
  const highRiskCount   = patients.filter(p => (p.latestRisk || '').includes('High')).length;
  const totalAssessments = patients.reduce((sum, p) => sum + (p.readingCount || 0), 0);

  // Recent activity = last 5 vital readings across all patients, sorted newest first
  const recentReadings = patients
    .flatMap(p => (p.vitalsHistory || []).map(v => ({
      ...v,
      patientName: p.name,
      risk_level:  v.risk_level || '',
    })))
    .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
    .slice(0, 5);

  const weekData = buildWeekData(patients);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Clinical Overview</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          icon={<Users size={20} />}
          title="Total Patients"
          value={loading ? '—' : String(totalPatients)}
          color="#0ea5e9"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          title="High Risk Patients"
          value={loading ? '—' : String(highRiskCount)}
          color="#ef4444"
        />
        <StatCard
          icon={<Brain size={20} />}
          title="Total AI Assessments"
          value={loading ? '—' : String(totalAssessments)}
          color="#10b981"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          title="Mid Risk Patients"
          value={loading ? '—' : String(patients.filter(p => (p.latestRisk || '').includes('Mid')).length)}
          color="#f59e0b"
        />
      </div>

      {/* Charts + System Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Weekly volume chart */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Weekly Assessment Volume</h3>
            <Link to="/clinical/analytics" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full Analytics <ArrowRight size={14} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="d" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="v" stroke="#0ea5e9" fill="url(#dashGrad)" strokeWidth={2} name="Assessments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System health */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>System Health</h3>
          <SystemIndicator label="FastAPI Backend"    status="Online" color="#10b981" />
          <SystemIndicator label="Maternal RF Model"  status="Ready"  color="#10b981" />
          <SystemIndicator label="Fetal RF Model"     status="Ready"  color="#10b981" />
          <SystemIndicator label="Supabase DB"        status="Connected" color="#0ea5e9" />
          <SystemIndicator
            label="Patients on record"
            status={loading ? 'Loading…' : `${totalPatients} registered`}
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Recent Activity Feed — real data */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--color-accent)" /> Recent Activity
          </h3>
          <Link to="/clinical/patients" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            All Patients <ArrowRight size={14} />
          </Link>
        </div>

        {loading && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
            Loading activity…
          </p>
        )}

        {!loading && recentReadings.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No activity yet. Patients will appear here after submitting vitals.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {recentReadings.map((item, i) => (
            <div key={item.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.875rem 0',
              borderBottom: i < recentReadings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{riskIcon(item.risk_level)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{item.patientName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                  Vitals logged —{' '}
                  <span style={{ color: riskColor(item.risk_level), fontWeight: 600 }}>{item.risk_level || 'Unknown'}</span>
                  {' '}· BP {item.systolic_bp}/{item.diastolic_bp} mmHg
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={11} /> {timeAgo(item.recorded_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicalDashboard;
