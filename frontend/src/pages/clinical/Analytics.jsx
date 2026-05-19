import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Brain, Target, Activity } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', assessments: 14, highRisk: 2, midRisk: 4, lowRisk: 8 },
  { day: 'Tue', assessments: 18, highRisk: 3, midRisk: 5, lowRisk: 10 },
  { day: 'Wed', assessments: 12, highRisk: 1, midRisk: 3, lowRisk: 8 },
  { day: 'Thu', assessments: 22, highRisk: 4, midRisk: 6, lowRisk: 12 },
  { day: 'Fri', assessments: 19, highRisk: 3, midRisk: 5, lowRisk: 11 },
  { day: 'Sat', assessments: 8,  highRisk: 1, midRisk: 2, lowRisk: 5 },
  { day: 'Sun', assessments: 6,  highRisk: 0, midRisk: 2, lowRisk: 4 },
];

const riskDistribution = [
  { name: 'Low Risk', value: 58, color: '#10b981' },
  { name: 'Mid Risk', value: 28, color: '#f59e0b' },
  { name: 'High Risk', value: 14, color: '#ef4444' },
];

const modelMetrics = [
  { metric: 'Accuracy',  maternal: 87.3, fetal: 91.2 },
  { metric: 'Precision', maternal: 84.1, fetal: 89.5 },
  { metric: 'Recall',    maternal: 82.7, fetal: 88.3 },
  { metric: 'F1-Score',  maternal: 83.4, fetal: 88.9 },
];

const trendData = [
  { month: 'Oct', patients: 98,  alerts: 12 },
  { month: 'Nov', patients: 104, alerts: 15 },
  { month: 'Dec', patients: 110, alerts: 11 },
  { month: 'Jan', patients: 108, alerts: 14 },
  { month: 'Feb', patients: 116, alerts: 18 },
  { month: 'Mar', patients: 120, alerts: 13 },
  { month: 'Apr', patients: 118, alerts: 16 },
  { month: 'May', patients: 124, alerts: 19 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(12px)',
        fontSize: '0.8rem',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#f8fafc' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Analytics</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Clinical intelligence and ML model performance insights</p>
      </div>

      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Model Accuracy', value: '87.3%', sub: 'Maternal classifier', color: '#0ea5e9', icon: <Brain size={18}/> },
          { label: 'Fetal Accuracy', value: '91.2%', sub: 'CTG classifier', color: '#10b981', icon: <Target size={18}/> },
          { label: 'Weekly Volume', value: '99', sub: 'AI assessments', color: '#f59e0b', icon: <Activity size={18}/> },
          { label: 'Alert Precision', value: '94.7%', sub: 'True positive rate', color: '#a855f7', icon: <TrendingUp size={18}/> },
        ].map(m => (
          <div key={m.label} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{m.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{m.sub}</div>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: m.color,
              }}>
                {m.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Patient + Alert trend */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Patient Volume & Alerts (8-Month Trend)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
              <Area type="monotone" dataKey="patients" stroke="#0ea5e9" fill="url(#patGrad)" strokeWidth={2} name="Patients" />
              <Area type="monotone" dataKey="alerts" stroke="#ef4444" fill="url(#alertGrad)" strokeWidth={2} name="Alerts" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk distribution donut */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem' }}
                itemStyle={{ color: '#f8fafc' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {riskDistribution.map(r => (
              <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{r.name}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: r.color }}>{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Weekly assessments */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Weekly Assessment Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
              <Bar dataKey="lowRisk" stackId="a" fill="#10b981" name="Low Risk" radius={[0,0,0,0]} />
              <Bar dataKey="midRisk" stackId="a" fill="#f59e0b" name="Mid Risk" />
              <Bar dataKey="highRisk" stackId="a" fill="#ef4444" name="High Risk" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model performance comparison */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>ML Model Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelMetrics} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[75, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
              <Bar dataKey="maternal" fill="#0ea5e9" name="Maternal RF" radius={[0,4,4,0]} />
              <Bar dataKey="fetal" fill="#10b981" name="Fetal RF" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
