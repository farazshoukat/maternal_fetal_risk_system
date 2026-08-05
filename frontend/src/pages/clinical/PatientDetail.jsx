import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Activity, Droplet, HeartPulse, Stethoscope,
  Thermometer, BarChart2, Database, RefreshCw
} from 'lucide-react';
import { predictFetalRisk, predictMaternalRisk } from '../../api/api';
import { getPatientById as getSupaPatient } from '../../api/supabase_db';
import {
  getPatientVitalReadings,
  getPatientCtgReadings,
  insertCtgReading,
  computeAveragedVitals,
  computeAveragedCtg,
} from '../../api/supabase_db';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import VitalsChart from '../../components/VitalsChart';
import StatCard from '../../components/StatCard';

// ── Sub-component: Averaged value stat card ───────────────────────────────────
const AvgStatCard = ({ icon, title, value, unit, color, count }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}30`,
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    position: 'relative', overflow: 'hidden',
  }}>
    {/* subtle glow */}
    <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color }}>
      {icon}
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>
      {value != null ? value : '—'}
      {value != null && unit && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '3px' }}>{unit}</span>}
    </div>
    {count != null && (
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
        avg of {count} reading{count !== 1 ? 's' : ''}
      </div>
    )}
  </div>
);

const PatientDetail = () => {
  const { id } = useParams();

  // ── Mock/FastAPI patient data (for charts + baseline) ─────────────────────
  const [patient, setPatient]   = useState(null);
  const [loading, setLoading]   = useState(true);

  // ── Supabase vital readings ────────────────────────────────────────────────
  const [supaVitals, setSupaVitals]       = useState([]);   // raw rows
  const [avgVitals,  setAvgVitals]        = useState(null); // computed averages
  const [avgRisk,    setAvgRisk]          = useState(null); // FastAPI result from averaged vitals
  const [avgRiskLoading, setAvgRiskLoading] = useState(false);

  // ── Supabase CTG readings ─────────────────────────────────────────────────
  const [supaCtg,    setSupaCtg]          = useState([]);   // raw rows
  const [avgCtg,     setAvgCtg]           = useState(null); // computed CTG averages
  const [avgFetalRisk, setAvgFetalRisk]   = useState(null); // FastAPI result from averaged CTG
  const [avgFetalLoading, setAvgFetalLoading] = useState(false);

  // ── Manual CTG form ───────────────────────────────────────────────────────
  const [ctgData, setCtgData] = useState({
    abnormalShortTermVariability: '',
    percentageOfTimeWithAbnormalLongTermVariability: '',
    accelerations: '',
    decelerationsLate: '',
    uterineContractions: ''
  });
  const [fetalResult,  setFetalResult]  = useState(null);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);

  // ── Fetch Supabase patient row + readings in parallel ────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch real patient record from Supabase by UUID
        const supaPatient = await getSupaPatient(id);
        // Normalise snake_case DB columns → camelCase for the UI
        if (supaPatient) {
          setPatient({
            ...supaPatient,
            gestationalAge: supaPatient.gestational_age || null,
          });
        }

        // Vital readings for this patient UUID
        const vitalRows = await getPatientVitalReadings(id);
        setSupaVitals(vitalRows);

        const ctgRows = await getPatientCtgReadings(id);
        setSupaCtg(ctgRows);
      } catch (err) {
        console.error('[PatientDetail] load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Compute averaged vitals + send to FastAPI when Supabase data arrives ──
  const runAveragedMaternalRisk = useCallback(async (vitals) => {
    if (!vitals || vitals.length === 0) return;
    const averaged = computeAveragedVitals(vitals);
    setAvgVitals(averaged);

    // Need age — try from readings, fallback to patient
    const ageForApi = averaged.age
      || (patient?.age ?? 25);  // safe default

    setAvgRiskLoading(true);
    try {
      const result = await predictMaternalRisk({ ...averaged, age: ageForApi });
      setAvgRisk(result);
    } catch (err) {
      console.warn('[PatientDetail] averaged maternal prediction error:', err);
    } finally {
      setAvgRiskLoading(false);
    }
  }, [patient?.age]);

  useEffect(() => {
    if (supaVitals.length > 0) {
      runAveragedMaternalRisk(supaVitals);
    }
  }, [supaVitals, runAveragedMaternalRisk]);

  // ── Compute averaged CTG + send to FastAPI when Supabase CTG data arrives ─
  const runAveragedFetalRisk = useCallback(async (ctgRows) => {
    if (!ctgRows || ctgRows.length === 0) return;
    const averaged = computeAveragedCtg(ctgRows);
    setAvgCtg(averaged);

    setAvgFetalLoading(true);
    try {
      const result = await predictFetalRisk(averaged);
      setAvgFetalRisk(result);
    } catch (err) {
      console.warn('[PatientDetail] averaged fetal prediction error:', err);
    } finally {
      setAvgFetalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supaCtg.length > 0) {
      runAveragedFetalRisk(supaCtg);
    }
  }, [supaCtg, runAveragedFetalRisk]);

  // ── Manual CTG form handlers ──────────────────────────────────────────────
  const handleCtgChange = (e) => {
    setCtgData({ ...ctgData, [e.target.name]: e.target.value });
  };

  const analyzeFetalRisk = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setFetalResult(null);

    try {
      const data = {
        abnormalShortTermVariability: parseFloat(ctgData.abnormalShortTermVariability),
        percentageOfTimeWithAbnormalLongTermVariability: parseFloat(ctgData.percentageOfTimeWithAbnormalLongTermVariability),
        accelerations:    parseFloat(ctgData.accelerations),
        decelerationsLate: parseFloat(ctgData.decelerationsLate),
        uterineContractions: parseFloat(ctgData.uterineContractions)
      };
      const result = await predictFetalRisk(data);
      setFetalResult(result);

      // Persist this CTG reading to Supabase (patient_id = route :id if it's a UUID)
      try {
        // profile_id is unknown here (clinician is logged in, not the patient)
        // We store with patient_id only if it looks like a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
        if (isUuid) {
          await insertCtgReading(null, id, data, result.status);
          // Refresh CTG data
          const updatedCtg = await getPatientCtgReadings(id);
          setSupaCtg(updatedCtg);
        }
      } catch (dbErr) {
        console.warn('[PatientDetail] CTG Supabase insert skipped:', dbErr.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Decide which vitals to display in top stat cards ─────────────────────
  // Priority: Supabase averaged > latest from mock vitals history
  const displayVitals = avgVitals || (patient?.vitalsHistory?.length
    ? patient.vitalsHistory[patient.vitalsHistory.length - 1]
    : null);
  const vitalsSource  = avgVitals ? 'averaged' : 'latest';
  const vitalsCount   = supaVitals.length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner text="Loading patient profile..." />;
  // Show not-found only if there's truly nothing — a real patient always has
  // at least a patients row OR at least one vital reading.
  if (!patient && supaVitals.length === 0) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
        Patient not found. This ID may be invalid or the patient record has not been created yet.
      </div>
    );
  }

  const fetalResultColor = fetalResult
    ? fetalResult.status === 'Normal'
      ? 'var(--color-success)'
      : fetalResult.status === 'Suspect'
      ? 'var(--color-warning)'
      : 'var(--color-danger)'
    : null;

  // Chart data: Supabase readings mapped to chart-compatible shape (oldest first)
  const chartData = [...supaVitals].reverse().map(r => ({
    date:        r.date,
    systolicBP:  r.systolicBP,
    diastolicBP: r.diastolicBP,
    heartRate:   r.heartRate,
    bloodSugar:  r.bloodSugar,
    bodyTemp:    r.bodyTemp,
  }));

  const patientName     = patient?.name           || 'Patient';
  const patientAge      = patient?.age             ?? (supaVitals[0]?.age ?? '—');
  const gestationalAge  = patient?.gestationalAge  || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/clinical/patients" className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{patientName}</h1>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <span>ID: {id}</span>
            {patientAge && <span>Age: {patientAge}</span>}
            {gestationalAge && <span>Gestational Age: {gestationalAge}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Maternal Risk {avgRisk ? '(avg)' : ''}
            </span>
            {avgRiskLoading
              ? <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Computing…</span>
              : <RiskBadge riskLevel={avgRisk?.riskLevel || patient?.status || '—'} />
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
              Fetal Status {avgFetalRisk ? '(avg)' : ''}
            </span>
            <RiskBadge riskLevel={avgFetalRisk?.status || fetalResult?.status || patient?.fetalStatus || '—'} />
          </div>
        </div>
      </div>

      {/* ── Averaged Risk Assessment panel (shown when Supabase data exists) ─── */}
      {supaVitals.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '1.5rem',
          border: '1px solid rgba(14,165,233,0.2)',
          background: 'rgba(14,165,233,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--color-accent)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Averaged Risk Assessment</h3>
              <span style={{
                padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                background: 'rgba(14,165,233,0.15)', color: 'var(--color-accent)',
              }}>
                {vitalsCount} readings
              </span>
            </div>
            {avgRisk && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Averaged ML result:
                </span>
                <RiskBadge riskLevel={avgRisk.riskLevel} />
                {avgRisk.confidence && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {(avgRisk.confidence * 100).toFixed(1)}% conf.
                  </span>
                )}
              </div>
            )}
            {avgRiskLoading && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Running model…
              </span>
            )}
          </div>

          {/* Averaged vitals grid */}
          {avgVitals && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <AvgStatCard
                icon={<Activity size={16} />}
                title="Blood Pressure"
                value={`${avgVitals.systolicBP}/${avgVitals.diastolicBP}`}
                unit="mmHg"
                color="#ef4444"
                count={vitalsCount}
              />
              <AvgStatCard
                icon={<HeartPulse size={16} />}
                title="Heart Rate"
                value={avgVitals.heartRate}
                unit="bpm"
                color="#f59e0b"
                count={vitalsCount}
              />
              <AvgStatCard
                icon={<Droplet size={16} />}
                title="Blood Sugar"
                value={avgVitals.bloodSugar}
                unit="mmol/L"
                color="#0ea5e9"
                count={vitalsCount}
              />
              {avgVitals.bodyTemp != null && (
                <AvgStatCard
                  icon={<Thermometer size={16} />}
                  title="Body Temp"
                  value={avgVitals.bodyTemp}
                  unit="°C"
                  color="#10b981"
                  count={vitalsCount}
                />
              )}
            </div>
          )}

          {/* Averaged CTG result (if we have CTG readings) */}
          {supaCtg.length > 0 && avgCtg && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BarChart2 size={16} color="#8b5cf6" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Averaged CTG Assessment</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>({supaCtg.length} CTG readings)</span>
                {avgFetalLoading
                  ? <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>Computing…</span>
                  : avgFetalRisk && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RiskBadge riskLevel={avgFetalRisk.status} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {(avgFetalRisk.confidence * 100).toFixed(1)}% conf.
                      </span>
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest / single-reading Vitals Summary (only shown when we don't have Supabase averages yet) */}
      {displayVitals && vitalsSource !== 'averaged' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            No Supabase vitals readings yet for this patient.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatCard icon={<Activity size={20} />} title="Blood Pressure"
              value={`${displayVitals.systolicBP}/${displayVitals.diastolicBP}`} unit="mmHg" color="#ef4444" />
            <StatCard icon={<HeartPulse size={20} />} title="Heart Rate"
              value={displayVitals.heartRate} unit="bpm" color="#f59e0b" />
            <StatCard icon={<Droplet size={20} />} title="Blood Sugar"
              value={displayVitals.bloodSugar} unit="mmol/L" color="#0ea5e9" />
            <StatCard icon={<Thermometer size={20} />} title="Body Temp"
              value={displayVitals.bodyTemp} unit="°C" color="#10b981" />
          </div>
        </div>
      )}

      {/* Charts + Fetal Assessment */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Charts Column — raw historical trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart2 size={13} /> Raw reading trend
            {supaVitals.length > 0 && ` — ${supaVitals.length} Supabase readings`}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Blood Pressure Trend</h3>
            <VitalsChart
              data={chartData}
              dataKey1="systolicBP"
              dataKey2="diastolicBP"
              color1="#ef4444"
              color2="#f43f5e"
              height={220}
            />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Heart Rate Trend</h3>
            <VitalsChart data={chartData} dataKey1="heartRate" color1="#f59e0b" height={180} />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Blood Sugar Trend</h3>
            <VitalsChart data={chartData} dataKey1="bloodSugar" color1="#0ea5e9" height={180} />
          </div>
        </div>

        {/* Fetal Assessment Column — manual CTG entry */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Stethoscope size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Fetal AI Assessment</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
            Input Cardiotocogram (CTG) metrics to analyze fetal distress risk. New readings are saved to patient history.
          </p>

          <form onSubmit={analyzeFetalRisk} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem' }}>Abnormal Short-Term Variability (%)</label>
              <input type="number" step="0.1" name="abnormalShortTermVariability" required placeholder="e.g. 55" value={ctgData.abnormalShortTermVariability} onChange={handleCtgChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem' }}>% Time w/ Abnormal Long-Term Variability</label>
              <input type="number" step="0.1" name="percentageOfTimeWithAbnormalLongTermVariability" required placeholder="e.g. 20" value={ctgData.percentageOfTimeWithAbnormalLongTermVariability} onChange={handleCtgChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem' }}>Accelerations (per second)</label>
              <input type="number" step="0.001" name="accelerations" required placeholder="e.g. 0.005" value={ctgData.accelerations} onChange={handleCtgChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem' }}>Late Decelerations (per second)</label>
              <input type="number" step="0.001" name="decelerationsLate" required placeholder="e.g. 0.000" value={ctgData.decelerationsLate} onChange={handleCtgChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem' }}>Uterine Contractions (per second)</label>
              <input type="number" step="0.001" name="uterineContractions" required placeholder="e.g. 0.004" value={ctgData.uterineContractions} onChange={handleCtgChange} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isAnalyzing} style={{ marginTop: '0.25rem' }}>
              {isAnalyzing ? 'Running Model...' : 'Run Fetal Assessment'}
            </button>
          </form>

          {/* Manual CTG result */}
          {fetalResult && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: '1.5rem', padding: '1rem',
                background: `${fetalResultColor}15`,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${fetalResultColor}66`
              }}
            >
              <h4 style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Manual CTG Assessment
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <RiskBadge riskLevel={fetalResult.status} />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Conf: {(fetalResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default PatientDetail;
