import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Droplet, HeartPulse, Stethoscope, Thermometer } from 'lucide-react';
import { getPatientById, predictFetalRisk } from '../../api/api';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import VitalsChart from '../../components/VitalsChart';
import StatCard from '../../components/StatCard';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetal CTG Form State — 5 real CTG fields
  const [ctgData, setCtgData] = useState({
    abnormalShortTermVariability: '',
    percentageOfTimeWithAbnormalLongTermVariability: '',
    accelerations: '',
    decelerationsLate: '',
    uterineContractions: ''
  });
  const [fetalResult, setFetalResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await getPatientById(id);
        setPatient(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

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
        accelerations: parseFloat(ctgData.accelerations),
        decelerationsLate: parseFloat(ctgData.decelerationsLate),
        uterineContractions: parseFloat(ctgData.uterineContractions)
      };
      const result = await predictFetalRisk(data);
      setFetalResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading patient profile..." />;
  if (!patient) return <div>Patient not found.</div>;

  const latestVitals = patient.vitalsHistory[patient.vitalsHistory.length - 1];

  const fetalResultColor = fetalResult
    ? fetalResult.status === 'Normal'
      ? 'var(--color-success)'
      : fetalResult.status === 'Suspect'
      ? 'var(--color-warning)'
      : 'var(--color-danger)'
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/clinical/patients" className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{patient.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <span>ID: {patient.id}</span>
            <span>Age: {patient.age}</span>
            <span>Gestational Age: {patient.gestationalAge}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Maternal Risk</span>
            <RiskBadge riskLevel={patient.status} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Fetal Status</span>
            <RiskBadge riskLevel={fetalResult ? fetalResult.status : patient.fetalStatus} />
          </div>
        </div>
      </div>

      {/* Latest Vitals Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard
          icon={<Activity size={20} />}
          title="Blood Pressure"
          value={`${latestVitals.systolicBP}/${latestVitals.diastolicBP}`}
          unit="mmHg"
          color="#ef4444"
        />
        <StatCard
          icon={<HeartPulse size={20} />}
          title="Heart Rate"
          value={latestVitals.heartRate}
          unit="bpm"
          color="#f59e0b"
        />
        <StatCard
          icon={<Droplet size={20} />}
          title="Blood Sugar"
          value={latestVitals.bloodSugar}
          unit="mmol/L"
          color="#0ea5e9"
        />
        <StatCard
          icon={<Thermometer size={20} />}
          title="Body Temp"
          value={latestVitals.bodyTemp}
          unit="°C"
          color="#10b981"
        />
      </div>

      {/* Charts + Fetal Assessment */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Charts Column — 3 charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Blood Pressure Trend</h3>
            <VitalsChart
              data={patient.vitalsHistory}
              dataKey1="systolicBP"
              dataKey2="diastolicBP"
              color1="#ef4444"
              color2="#f43f5e"
              height={220}
            />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Heart Rate Trend</h3>
            <VitalsChart
              data={patient.vitalsHistory}
              dataKey1="heartRate"
              color1="#f59e0b"
              height={180}
            />
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.05rem' }}>Blood Sugar Trend</h3>
            <VitalsChart
              data={patient.vitalsHistory}
              dataKey1="bloodSugar"
              color1="#0ea5e9"
              height={180}
            />
          </div>
        </div>

        {/* Fetal Assessment Column */}
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Stethoscope size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Fetal AI Assessment</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
            Input Cardiotocogram (CTG) metrics to analyze fetal distress risk using the Tier-2 AI model.
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

          {fetalResult && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: `${fetalResultColor}15`,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${fetalResultColor}66`
              }}
            >
              <h4 style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>AI Prediction Result</h4>
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
    </div>
  );
};

export default PatientDetail;
