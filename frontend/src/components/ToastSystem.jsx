import React, { useEffect, useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { X, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const ToastItem = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const colors = {
    danger:  { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  icon: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', icon: '#f59e0b' },
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: '#10b981' },
    info:    { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.4)', icon: '#0ea5e9' },
  };

  const c = colors[toast.type] || colors.info;

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        backdropFilter: 'blur(16px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}`,
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        minWidth: '320px',
        maxWidth: '380px',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <Zap size={18} color={c.icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f8fafc', marginBottom: '0.25rem' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(248,250,252,0.75)', lineHeight: 1.4 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
      >
        <X size={16} color="rgba(248,250,252,0.5)" />
      </button>
    </div>
  );
};

const ToastSystem = () => {
  const { toasts, dismissToast } = useAlerts();

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastSystem;
