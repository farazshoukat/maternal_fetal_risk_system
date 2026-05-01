import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: entry.color }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const VitalsChart = ({ data, dataKey1, dataKey2, color1 = '#0ea5e9', color2 = '#ef4444', height = 300 }) => {
  return (
    // The outer div MUST have an explicit pixel height — never %, never undefined
    // This is required to prevent Recharts ResponsiveContainer from reporting width/height = -1
    <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey1}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color1} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color1} stopOpacity={0} />
            </linearGradient>
            {dataKey2 && (
              <linearGradient id={`grad-${dataKey2}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color2} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color2} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
            tickFormatter={v => v.slice(5)} // Show MM-DD only
          />
          <YAxis
            stroke="var(--color-text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey={dataKey1}
            stroke={color1}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#grad-${dataKey1})`}
            dot={{ r: 3, fill: color1, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: color1, fill: '#0f172a' }}
          />
          {dataKey2 && (
            <Area
              type="monotone"
              dataKey={dataKey2}
              stroke={color2}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${dataKey2})`}
              dot={{ r: 3, fill: color2, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: color2, fill: '#0f172a' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalsChart;
