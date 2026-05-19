import React, { useState } from 'react';
import {
  AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import StatCard from '../../components/StatCard';
import { Users, AlertTriangle, Activity, Brain, Clock, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlerts } from '../../context/AlertContext';
import RiskBadge from '../../components/RiskBadge';

const recentActivity = [
  { time: '2m ago',  patient: 'Sarah Jenkins',   action: 'High Risk vitals logged',     color: '#ef4444', icon: '🚨' },
  { time: '14m ago', patient: 'n8n Workflow',     action: 'Slack alert sent → Dr. Smith',color: '#ff6416', icon: '⚡' },
  { time: '31m ago', patient: 'Maria Rodriguez',  action: 'CTG assessment completed',    color: '#f59e0b', icon: '📊' },
  { time: '47m ago', patient: 'Fatima Hassan',    action: 'High Risk — SMS dispatched',  color: '#ef4444', icon: '📱' },
  { time: '1h ago',  patient: 'Emily Chen',       action: 'Low Risk vitals logged',      color: '#10b981', icon: '✅' },
];

const weekData = [
  { d: 'Mon', v: 14 }, { d: 'Tue', v: 18 }, { d: 'Wed', v: 12 },
  { d: 'Thu', v: 22 }, { d: 'Fri', v: 19 }, { d: 'Sat', v: 8 }, { d: 'Sun', v: 6 },
];

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
  const { alertLog } = useAlerts();
  const highRiskToday = alertLog.filter(a => a.riskLevel.includes('High')).length;

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
          title="Total Active Patients"
          value="124"
          trend={{ direction: 'up', value: '12%' }}
          color="#0ea5e9"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          title="High Risk Alerts Today"
          value={String(highRiskToday)}
          trend={{ direction: 'up', value: highRiskToday > 2 ? '+' + (highRiskToday - 2) : '' }}
          color="#ef4444"
        />
        <StatCard
          icon={<Brain size={20} />}
          title="AI Assessments Run"
          value="89"
          trend={{ direction: 'up', value: '7%' }}
          color="#10b981"
        />
        <StatCard
          icon={<Zap size={20} />}
          title="n8n Alerts Fired"
          value={String(alertLog.length)}
          color="#ff6416"
        />
      </div>

      {/* Charts + Activity */}
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
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="d" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="v" stroke="#0ea5e9" fill="url(#dashGrad)" strokeWidth={2} name="Assessments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System health */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>System Health</h3>
          <SystemIndicator label="FastAPI Backend" status="Online" color="#10b981" />
          <SystemIndicator label="Maternal RF Model" status="Ready" color="#10b981" />
          <SystemIndicator label="Fetal RF Model" status="Ready" color="#10b981" />
          <SystemIndicator label="n8n Webhook" status="Listening" color="#0ea5e9" />
          <SystemIndicator label="Alert Queue" status={`${alertLog.length} fired`} color="#f59e0b" />

          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/clinical/alerts" className="btn" style={{
              width: '100%', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(255,100,22,0.2), rgba(255,100,22,0.05))',
              border: '1px solid rgba(255,100,22,0.3)',
              color: '#ff6416',
              borderRadius: '10px',
              fontSize: '0.85rem',
            }}>
              <Zap size={16} /> View Alert Automation
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--color-accent)" /> Recent Activity
          </h3>
          <Link to="/clinical/patients" style={{ fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            All Patients <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {recentActivity.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.875rem 0',
              borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>{item.patient}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>{item.action}</div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={11} /> {item.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicalDashboard;
