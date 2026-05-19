import React, { useState } from 'react';
import { Activity, Droplet, Thermometer, HeartPulse, Send, User, Zap, CheckCircle } from 'lucide-react';
import { predictMaternalRisk, submitVitals } from '../../api/api';
import RiskBadge from '../../components/RiskBadge';
import { useAlerts } from '../../context/AlertContext';

const LogVitals = () => {
  const { triggerN8nAlert, addToast } = useAlerts();

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
        systolicBP:  parseFloat(formData.systolicBP),
        diastolicBP: parseFloat(formData.diastolicBP),
        bloodSugar:  parseFloat(formData.bloodSugar),
        bodyTemp:    parseFloat(formData.bodyTemp),
        heartRate:   parseFloat(formData.heartRate),
        age:         parseInt(formData.age, 10),
      };

      const prediction = await predictMaternalRisk(numericData);
      await submitVitals(numericData, prediction);
      setResult(prediction);

      // Trigger n8n alerts for high/mid risk
      if (prediction.riskLevel.includes('High')) {
        triggerN8nAlert(
          'Jane Doe (You)',
          'pat-current',
          prediction.riskLevel,
          `BP ${numericData.systolicBP}/${numericData.diastolicBP} mmHg | Sugar ${numericData.bloodSugar} mmol/L — immediate review`,
          'slack'
        );
        // Also fire SMS
        setTimeout(() => {
          triggerN8nAlert(
            'Jane Doe (You)',
            'pat-current',
            prediction.riskLevel,
            `Emergency SMS dispatched to Dr. Smith`,
            'sms'
          );
        }, 1500);
      } else if (prediction.riskLevel.includes('Mid')) {
        triggerN8nAlert(
          'Jane Doe (You)',
          'pat-current',
          prediction.riskLevel,
          `Elevated readings logged — follow-up recommended`,
          'email'
        );
      } else {
        addToast({
          type: 'success',
          title: '✅ Vitals Recorded',
          message: 'AI assessment complete — Low Risk detected. No alerts triggered.',
        });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'danger', title: 'Error', message: 'Failed to submit vitals. Please try again.' });
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
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Enter your readings for instant AI assessment. High-risk readings automatically trigger n8n alert workflows.
        </p>
      </div>

      {/* n8n hint banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1.25rem', borderRadius: '10px',
        background: 'rgba(255,100,22,0.08)', border: '1px solid rgba(255,100,22,0.2)',
        fontSize: '0.8rem', color: 'rgba(248,250,252,0.7)',
      }}>
        <Zap size={16} color="#ff6416" />
        <span>Connected to <strong style={{ color: '#ff6416' }}>n8n automation</strong> — high-risk alerts fire Slack + SMS instantly</span>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Age */}
        <div>
          <label><User size={14} style={{ display: 'inline', marginRight: '4px' }}/> Age</label>
          <input type="number" name="age" required placeholder="e.g. 28" min="14" max="60" value={formData.age} onChange={handleChange} />
        </div>

        {/* Blood Pressure */}
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
          {isSubmitting
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙</span> Analyzing...</>
            : <><Send size={18} /> Analyze &amp; Submit</>
          }
        </button>
      </form>

      {result && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: `1px solid ${riskColor}`,
            boxShadow: `0 0 30px ${riskColor}22`,
          }}
        >
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Analysis Complete</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexDirection: 'column' }}>
            <RiskBadge riskLevel={result.riskLevel} size="lg" />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Confidence Score: {(result.confidence * 100).toFixed(1)}%
            </p>

            {result.riskLevel.includes('High') && (
              <div style={{
                padding: '1rem 1.25rem', borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                fontSize: '0.875rem', color: '#ef4444', textAlign: 'left',
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={15} /> n8n Alert Triggered
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(248,250,252,0.7)' }}>
                  💬 Slack + 📱 SMS notifications dispatched to Dr. Smith.<br />
                  Please contact your healthcare provider immediately.
                </div>
              </div>
            )}
            {result.riskLevel.includes('Mid') && (
              <div style={{
                padding: '1rem 1.25rem', borderRadius: '10px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                fontSize: '0.875rem', color: '#f59e0b', textAlign: 'left',
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={15} /> n8n Alert Triggered
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(248,250,252,0.7)' }}>
                  📧 Email notification sent to clinic. Schedule a check-up soon.
                </div>
              </div>
            )}
            {result.riskLevel.includes('Low') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontSize: '0.875rem' }}>
                <CheckCircle size={18} /> Your vitals look great! Keep up the good work.
              </div>
            )}

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              This reading has been saved to your history.
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default LogVitals;
