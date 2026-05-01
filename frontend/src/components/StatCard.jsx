import React from 'react';

const StatCard = ({ icon, title, value, unit, trend, color = 'var(--color-accent)' }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)', 
            background: `color-mix(in srgb, ${color} 15%, transparent)`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color
          }}>
            {icon}
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0 }}>{title}</h3>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{unit}</span>}
      </div>

      {trend && (
        <div style={{ fontSize: '0.75rem', color: trend.direction === 'up' ? 'var(--color-danger)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          <span style={{ color: 'var(--color-text-muted)' }}>vs last visit</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
