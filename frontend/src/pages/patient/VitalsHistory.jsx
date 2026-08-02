import React, { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { getMyVitalReadings } from '../../api/supabase_db';
import { getMyHistory } from '../../api/api';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { Database, CloudOff } from 'lucide-react';

// Tiny inline sparkline
const Sparkline = ({ value, label, color, dataPoints, unit }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: '1rem', color }}>
      {value}
      {unit && <span style={{ fontWeight: 400, fontSize: '0.75rem', marginLeft: '2px', color: 'var(--color-text-muted)' }}>{unit}</span>}
    </span>
    {dataPoints && dataPoints.length > 1 && (
      <div style={{ height: '32px', width: '80px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataPoints}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const VitalsHistory = () => {
  const { user } = useAuth();
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [source,  setSource]      = useState('supabase'); // 'supabase' | 'local'

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          // Primary: Supabase vital_readings
          const supabaseData = await getMyVitalReadings(user.id);
          if (supabaseData.length > 0) {
            setHistory(supabaseData);
            setSource('supabase');
            return;
          }
        }
        // Fallback: localStorage (written by legacy submitVitals)
        const localData = await getMyHistory();
        setHistory(localData);
        setSource('local');
      } catch (err) {
        console.error('[VitalsHistory] fetch error:', err);
        // Last resort: localStorage
        try {
          const localData = await getMyHistory();
          setHistory(localData);
          setSource('local');
        } catch {
          setHistory([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user?.id]);

  if (loading) return <LoadingSpinner text="Loading your health history..." />;

  // Build sparkline series: per-metric array of { v } sorted oldest-first
  const sparkData = (key) =>
    [...history].reverse().map(r => ({ v: r[key] }));

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Vitals History</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Review your past submissions and AI risk assessments.
            {history.length > 0 && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                ({history.length} records)
              </span>
            )}
          </p>
          {/* Source indicator */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
            background: source === 'supabase' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            color: source === 'supabase' ? '#10b981' : '#f59e0b',
            border: `1px solid ${source === 'supabase' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
          }}>
            {source === 'supabase'
              ? <><Database size={10} /> Synced from cloud</>
              : <><CloudOff size={10} /> Loaded from local cache</>
            }
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No vitals logged yet. Submit your first reading on the Log Vitals page.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((record, idx) => (
            <div
              key={record.id || idx}
              className="glass-panel animate-fade-in"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                animationDelay: `${idx * 60}ms`
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {record.recordedAt
                      ? new Date(record.recordedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                      : record.date
                        ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Unknown date'
                    }
                  </span>
                  {record.recordedAt && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {new Date(record.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <RiskBadge riskLevel={record.risk} />
              </div>

              {/* Metrics grid with sparklines */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.25rem' }}>
                <Sparkline
                  label="Blood Pressure"
                  value={`${record.systolicBP}/${record.diastolicBP}`}
                  unit=" mmHg"
                  color="#ef4444"
                  dataPoints={sparkData('systolicBP')}
                />
                <Sparkline
                  label="Blood Sugar"
                  value={record.bloodSugar}
                  unit=" mmol/L"
                  color="#0ea5e9"
                  dataPoints={sparkData('bloodSugar')}
                />
                <Sparkline
                  label="Heart Rate"
                  value={record.heartRate}
                  unit=" bpm"
                  color="#f59e0b"
                  dataPoints={sparkData('heartRate')}
                />
                {record.bodyTemp != null && (
                  <Sparkline
                    label="Body Temp"
                    value={record.bodyTemp}
                    unit=" °C"
                    color="#10b981"
                    dataPoints={sparkData('bodyTemp')}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VitalsHistory;
