import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

const RiskBadge = ({ riskLevel, size = 'md' }) => {
  let config = {
    bg: 'var(--color-bg-surface)',
    color: 'var(--color-text-secondary)',
    icon: <AlertCircle size={size === 'sm' ? 14 : 16} />,
    label: riskLevel || 'Unknown'
  };

  const levelLower = (riskLevel || '').toLowerCase();

  if (levelLower.includes('high') || levelLower.includes('pathological')) {
    config = {
      bg: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--color-danger)',
      icon: <AlertTriangle size={size === 'sm' ? 14 : 16} />,
      label: riskLevel
    };
  } else if (levelLower.includes('mid') || levelLower.includes('suspect')) {
    config = {
      bg: 'rgba(245, 158, 11, 0.15)',
      color: 'var(--color-warning)',
      icon: <AlertCircle size={size === 'sm' ? 14 : 16} />,
      label: riskLevel
    };
  } else if (levelLower.includes('low') || levelLower.includes('normal')) {
    config = {
      bg: 'rgba(16, 185, 129, 0.15)',
      color: 'var(--color-success)',
      icon: <CheckCircle2 size={size === 'sm' ? 14 : 16} />,
      label: riskLevel
    };
  }

  const sizes = {
    sm: { padding: '0.125rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
    lg: { padding: '0.5rem 1rem', fontSize: '1rem' }
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      backgroundColor: config.bg,
      color: config.color,
      borderRadius: '9999px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      ...sizes[size]
    }}>
      {config.icon}
      {config.label}
    </span>
  );
};

export default RiskBadge;
