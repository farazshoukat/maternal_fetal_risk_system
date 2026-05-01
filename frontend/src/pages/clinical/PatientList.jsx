import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getPatients } from '../../api/api';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <LoadingSpinner text="Loading patient records..." />;

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Patient Roster</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {filtered.length} of {patients.length} active patients
          </p>
        </div>

        {/* Local search bar (mirrors the top bar for discoverability) */}
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
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
              {['Patient Name', 'Age', 'Gestational Age', 'Maternal Risk', 'Fetal Status', 'Last Visit', 'Action'].map(h => (
                <th key={h} style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No patients match "{query}"
                </td>
              </tr>
            ) : (
              filtered.map(patient => (
                <tr
                  key={patient.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }}
                  className="hover-row"
                >
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.name}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)' }}>{patient.age}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)' }}>{patient.gestationalAge}</td>
                  <td style={{ padding: '1rem 1.25rem' }}><RiskBadge riskLevel={patient.status} size="sm" /></td>
                  <td style={{ padding: '1rem 1.25rem' }}><RiskBadge riskLevel={patient.fetalStatus} size="sm" /></td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(patient.lastVisit).toLocaleDateString()}
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
              ))
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
