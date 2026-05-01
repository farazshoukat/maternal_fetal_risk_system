import React from 'react';
import StatCard from '../../components/StatCard';
import { Users, AlertTriangle, Activity } from 'lucide-react';

const ClinicalDashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Clinical Overview</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Daily summary of maternal and fetal risk assessments.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          icon={<Users size={20} />} 
          title="Total Active Patients" 
          value="124" 
          trend={{ direction: 'up', value: '12%' }}
          color="#0ea5e9"
        />
        <StatCard 
          icon={<AlertTriangle size={20} />} 
          title="High Risk Alerts (Today)" 
          value="3" 
          trend={{ direction: 'up', value: '2' }}
          color="#ef4444"
        />
        <StatCard 
          icon={<Activity size={20} />} 
          title="AI Assessments Run" 
          value="89" 
          color="#10b981"
        />
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '1rem' }}>
        <Activity size={48} color="var(--color-text-muted)" opacity={0.5} />
        <p style={{ color: 'var(--color-text-secondary)' }}>System status normal. Backend ML models are ready for inference.</p>
      </div>
    </div>
  );
};

export default ClinicalDashboard;
