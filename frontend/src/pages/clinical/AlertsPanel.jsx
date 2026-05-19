import React, { useState, useEffect } from 'react';
import { useAlerts } from '../../context/AlertContext';
import N8nWorkflowDiagram from '../../components/N8nWorkflowDiagram';
import { Bell, MessageSquare, Phone, Mail, Clock, User, AlertTriangle, CheckCircle, Zap, RefreshCw } from 'lucide-react';

const channelIcon = (ch) => {
  if (ch === 'slack') return <MessageSquare size={14} />;
  if (ch === 'sms') return <Phone size={14} />;
  if (ch === 'email') return <Mail size={14} />;
  return <Bell size={14} />;
};

const channelColor = (ch) => {
  if (ch === 'slack') return '#4a154b';
  if (ch === 'sms') return '#10b981';
  if (ch === 'email') return '#3b82f6';
  return '#94a3b8';
};

const riskColor = (r) => {
  if (r?.includes('High')) return '#ef4444';
  if (r?.includes('Mid')) return '#f59e0b';
  return '#10b981';
};

const formatTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

const AlertsPanel = () => {
  const { alertLog, triggerN8nAlert } = useAlerts();
  const [isTriggered, setIsTriggered] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const simulateAlert = async () => {
    setSimulating(true);
    setIsTriggered(true);
    
    // Simulate workflow execution
    await new Promise(r => setTimeout(r, 2500));
    triggerN8nAlert('Sarah Jenkins', 'p-001', 'High Risk', 'BP 148/96 — escalation protocol activated', 'slack');
    
    await new Promise(r => setTimeout(r, 800));
    setSimulating(false);
    
    setTimeout(() => setIsTriggered(false), 4000);
  };

  const highRiskCount = alertLog.filter(a => a.riskLevel.includes('High')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Alert Automation</h1>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: 'rgba(255,100,22,0.15)',
              color: '#ff6416',
              border: '1px solid rgba(255,100,22,0.3)',
            }}>
              Powered by n8n
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Real-time clinical alert workflow — SMS, Slack & Email notifications
          </p>
        </div>
        <button
          onClick={simulateAlert}
          disabled={simulating}
          className="btn"
          style={{
            background: simulating ? 'rgba(255,100,22,0.3)' : 'linear-gradient(135deg, #ff6416, #ff9100)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: simulating ? 0.7 : 1,
          }}
        >
          {simulating ? (
            <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
          ) : (
            <><Zap size={16} /> Simulate Alert</>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Alerts Today', value: alertLog.length, icon: <Bell size={18} />, color: '#0ea5e9' },
          { label: 'High Risk Triggers', value: highRiskCount, icon: <AlertTriangle size={18} />, color: '#ef4444' },
          { label: 'Delivered', value: alertLog.filter(a => a.status === 'delivered').length, icon: <CheckCircle size={18} />, color: '#10b981' },
          { label: 'Avg Response Time', value: '< 2s', icon: <Clock size={18} />, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* n8n Workflow Diagram */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="#ff6416" />
          Automation Pipeline
        </h3>
        <N8nWorkflowDiagram isTriggered={isTriggered} />
      </div>

      {/* Alert Log */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} color="var(--color-accent)" />
          Recent Alert Log
          <span style={{
            marginLeft: '0.5rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '999px',
            fontSize: '0.7rem',
            background: 'rgba(14,165,233,0.15)',
            color: 'var(--color-accent)',
          }}>
            {alertLog.length} entries
          </span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alertLog.map((alert, idx) => (
            <div
              key={alert.id}
              className="animate-fade-in"
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: idx === 0 ? `${riskColor(alert.riskLevel)}08` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${idx === 0 ? `${riskColor(alert.riskLevel)}20` : 'rgba(255,255,255,0.06)'}`,
                alignItems: 'flex-start',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              {/* Risk indicator */}
              <div style={{
                width: '4px',
                borderRadius: '2px',
                alignSelf: 'stretch',
                background: riskColor(alert.riskLevel),
                flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <User size={14} color="var(--color-text-muted)" />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.patientName}</span>
                    </div>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: `${riskColor(alert.riskLevel)}18`,
                      color: riskColor(alert.riskLevel),
                      border: `1px solid ${riskColor(alert.riskLevel)}30`,
                    }}>
                      {alert.riskLevel}
                    </span>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      background: `${channelColor(alert.channel)}18`,
                      color: channelColor(alert.channel),
                      border: `1px solid ${channelColor(alert.channel)}30`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                      {channelIcon(alert.channel)} {alert.channel.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock size={12} />
                    {formatTime(alert.timestamp)}
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {alert.message}
                </div>
                <div style={{ marginTop: '0.375rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  workflow: {alert.workflowId} · status: <span style={{ color: '#10b981' }}>{alert.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AlertsPanel;
