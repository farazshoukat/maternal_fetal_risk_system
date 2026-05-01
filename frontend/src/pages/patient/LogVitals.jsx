import React, { useState } from 'react';
import { Activity, Droplet, Thermometer, HeartPulse, Send, User } from 'lucide-react';
import { predictMaternalRisk, submitVitals } from '../../api/api';
import RiskBadge from '../../components/RiskBadge';

const LogVitals = () => {
  const [formData, setFormData] = useState({
    systolicBP: '',
    diastolicBP: '',
    bloodSugar: '',
    bodyTemp: '',
    heartRate: '',
    age: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const numericData = {
        systolicBP: parseFloat(formData.systolicBP),
        diastolicBP: parseFloat(formData.diastolicBP),
        bloodSugar: parseFloat(formData.bloodSugar),
        bodyTemp: parseFloat(formData.bodyTemp),
        heartRate: parseFloat(formData.heartRate),
        age: parseInt(formData.age, 10)
      };

      const prediction = await predictMaternalRisk(numericData);
      // Persist to localStorage so VitalsHistory can read it
      await submitVitals(numericData, prediction);
      setResult(prediction);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskColor = result
    ? result.riskLevel.includes('High')
      ? 'var(--color-danger)'
      : result.riskLevel.includes('Mid')
      ? 'var(--color-warning)'
      : 'var(--color-success)'
    : 'var(--color-accent)';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Log Today's Vitals</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Enter your readings to get instant AI feedback on your health status.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Age — standalone row */}
        <div>
          <label><User size={14} style={{ display: 'inline', marginRight: '4px' }}/> Age</label>
          <input type="number" name="age" required placeholder="e.g. 28" min="14" max="60" value={formData.age} onChange={handleChange} />
        </div>

        {/* Blood Pressure Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label><Activity size={14} style={{ display: 'inline', marginRight: '4px' }}/> Systolic BP</label>
            <input type="number" name="systolicBP" required placeholder="e.g. 120" value={formData.systolicBP} onChange={handleChange} />
          </div>
          <div>
            <label><Activity size={14} style={{ display: 'inline', marginRight: '4px' }}/> Diastolic BP</label>
            <input type="number" name="diastolicBP" required placeholder="e.g. 80" value={formData.diastolicBP} onChange={handleChange} />
          </div>
        </div>

        {/* Blood Sugar */}
        <div>
          <label><Droplet size={14} style={{ display: 'inline', marginRight: '4px' }}/> Blood Sugar (mmol/L)</label>
          <input type="number" step="0.1" name="bloodSugar" required placeholder="e.g. 5.5" value={formData.bloodSugar} onChange={handleChange} />
        </div>

        {/* Temp + Heart Rate */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label><Thermometer size={14} style={{ display: 'inline', marginRight: '4px' }}/> Body Temp (°C)</label>
            <input type="number" step="0.1" name="bodyTemp" required placeholder="e.g. 37.0" value={formData.bodyTemp} onChange={handleChange} />
          </div>
          <div>
            <label><HeartPulse size={14} style={{ display: 'inline', marginRight: '4px' }}/> Heart Rate (bpm)</label>
            <input type="number" name="heartRate" required placeholder="e.g. 75" value={formData.heartRate} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
          {isSubmitting ? 'Analyzing...' : <><Send size={18} /> Analyze &amp; Submit</>}
        </button>
      </form>

      {result && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: `1px solid ${riskColor}`,
            boxShadow: `0 0 24px ${riskColor}33`
          }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Analysis Complete</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexDirection: 'column' }}>
            <RiskBadge riskLevel={result.riskLevel} size="lg" />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Confidence Score: {(result.confidence * 100).toFixed(1)}%
            </p>
            {result.riskLevel.includes('High') && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                ⚠️ Please contact your healthcare provider or visit the clinic immediately.
              </p>
            )}
            {result.riskLevel.includes('Mid') && (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Your vitals require attention. Please schedule a check-up soon.
              </p>
            )}
            {result.riskLevel.includes('Low') && (
              <p style={{ color: 'var(--color-success)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                ✓ Your vitals look great! Keep up the good work.
              </p>
            )}
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              This reading has been saved to your history.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogVitals;
