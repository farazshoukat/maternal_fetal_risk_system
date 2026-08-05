import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Database } from 'lucide-react';
import { getAllPatients } from '../../api/supabase_db';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

/** Pull the most-recent vital_reading from the nested array Supabase returns. */
function latestVital(patient) {
  const readings = patient.vital_readings;
  if (!readings || readings.length === 0) return null;
  // Supabase returns them unordered — sort descending by recorded_at
  return [...readings].sort(
    (a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)
  )[0];
}

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getAllPatients();
        setPatients(data);
      } catch (err) {
        console.error('[PatientList] fetch error:', err);
        setError('Failed to load patient records. Check your Supabase connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <LoadingSpinner text="Loading patient records..." />;

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  const filtered = patients.filter(p =>
    (p.name || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Patient Roster</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              {filtered.length} of {patients.length} patients
            </p>
            {/* Source indicator */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.25)',
            }}>
              <Database size={10} /> Live from Supabase
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 1rem',
          border: '1px solid var(--color-border)',
          gap: '0.5rem',
          minWidth: '240px'
        }}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Filter by name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '0.875rem',
              flex: 1
            }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
              {['Patient Name', 'Age', 'Gestational Age', 'Latest Maternal Risk', 'Readings', 'Last Visit', 'Action'].map(h => (
                <th key={h} style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {patients.length === 0
                    ? 'No patients found in the database. Patients appear here after their first login.'
                    : `No patients match "${query}"`
                  }
                </td>
              </tr>
            ) : (
              filtered.map(patient => {
                const latest      = latestVital(patient);
                const riskLevel   = latest?.risk_level  || '—';
                const lastVisit   = latest?.recorded_at || patient.created_at;
                const readingCount = patient.vital_readings?.length ?? 0;

                return (
                  <tr
                    key={patient.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }}
                    className="hover-row"
                  >
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {patient.name || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                      {patient.age ?? '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                      {patient.gestational_age || '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <RiskBadge riskLevel={riskLevel} size="sm" />
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                      {readingCount > 0
                        ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{readingCount} reading{readingCount !== 1 ? 's' : ''}</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>No readings yet</span>
                      }
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {lastVisit
                        ? new Date(lastVisit).toLocaleDateString()
                        : '—'
                      }
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Link
                        to={`/clinical/patients/${patient.id}`}
                        className="btn btn-outline"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <style>{`
          .hover-row:hover {
            background: rgba(255,255,255,0.03);
          }
        `}</style>
      </div>
    </div>
  );
};

export default PatientList;
