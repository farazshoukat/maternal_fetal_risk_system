import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, User, ArrowRight, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background blur */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'var(--color-accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', zIndex: -1 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'var(--color-success)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', zIndex: -1 }}></div>

      <header className="container" style={{ padding: '2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--gradient-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <Stethoscope size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700, letterSpacing: '-0.025em' }}>Maternal AI</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            <ShieldCheck size={16} color="var(--color-success)" />
            HIPAA Compliant
          </div>
        </div>
      </header>

      <main className="container flex-center" style={{ flex: 1, flexDirection: 'column', padding: '4rem 1.5rem', gap: '4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px' }} className="animate-fade-in">
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>
            Predictive Care for <br/>
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mother & Child</span>
          </h2>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            A two-tier AI architecture to monitor vital signs, predict clinical risks, and empower proactive healthcare interventions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '900px' }}>
          {/* Patient Card */}
          <Link to="/patient/log" style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', height: '100%' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={40} color="var(--color-accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Patient Portal</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Log your daily vitals, track your health history, and receive instant AI-powered feedback.</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                Enter Portal <ArrowRight size={16} />
              </div>
            </div>
          </Link>

          {/* Doctor Card */}
          <Link to="/clinical/dashboard" style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', height: '100%' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={40} color="var(--color-success)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Clinical Dashboard</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Monitor patient lists, view detailed history charts, and input CTG data for fetal risk analysis.</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 600 }}>
                Enter Dashboard <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
