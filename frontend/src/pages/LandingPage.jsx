import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, User, ArrowRight, ShieldCheck, Brain, Zap, Activity, AlertTriangle, TrendingUp, Server, CheckCircle } from 'lucide-react';

const AnimatedNumber = ({ target, duration = 2000 }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <span>{current.toLocaleString()}</span>;
};

const StatusDot = ({ ok = true }) => (
  <span style={{
    width: '8px', height: '8px', borderRadius: '50%',
    background: ok ? '#10b981' : '#ef4444',
    display: 'inline-block',
    boxShadow: ok ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(239,68,68,0.6)',
    animation: ok ? 'pulse-ok 2s ease-in-out infinite' : 'none',
  }} />
);

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)', borderRadius: '50%', zIndex: -1 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%', zIndex: -1 }} />
      <div style={{ position: 'fixed', top: '40%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)', borderRadius: '50%', zIndex: -1 }} />

      {/* Header */}
      <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--gradient-primary)', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 0 20px rgba(14,165,233,0.4)' }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Doctors Poly Clinic</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Tech badges */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['FastAPI', 'React', 'Random Forest'].map(tech => (
              <span key={tech} style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(248,250,252,0.7)',
              }}>
                {tech}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <ShieldCheck size={15} color="var(--color-success)" />
            HIPAA Compliant
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5rem' }}>
        {/* Hero */}
        <section style={{ padding: '5rem 2rem 2rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: '999px',
            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
            fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600,
            marginBottom: '2rem',
          }}>
            <Activity size={14} /> Powered by Two-Tier AI Architecture
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
            Predictive Care for<br />
            <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Patients
            </span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            AI-driven vital sign monitoring and real-time risk classification for proactive healthcare.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem', borderRadius: '12px', boxShadow: '0 0 30px rgba(22,163,74,0.3)', fontWeight: 700 }}>
              Let's keep the baby safe
            </Link>
          </div>
        </section>

        {/* Live stats bar */}
        <section style={{ padding: '0 2rem' }}>
          <div style={{
            maxWidth: '900px', margin: '0 auto',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {[
              { label: 'Active Patients', value: 124, suffix: '', color: '#0ea5e9', icon: <User size={18}/> },
              { label: 'AI Assessments', value: 89, suffix: '+', color: '#10b981', icon: <Brain size={18}/> },
              { label: 'Critical Alerts', value: 3, suffix: ' today', color: '#ef4444', icon: <AlertTriangle size={18}/> }
            ].map((stat, i) => (
              <div key={stat.label} style={{
                padding: '2rem 1.5rem',
                background: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              }}>
                <div style={{ color: stat.color, marginBottom: '0.75rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                  <AnimatedNumber target={stat.value} />{stat.suffix}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Portal cards */}
        <section style={{ padding: '0 2rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Patient card */}
            <Link to="/patient/log" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', borderRadius: '20px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(14,165,233,0.05))', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={32} color="var(--color-accent)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Patient Portal</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>Log daily vitals, receive instant AI-powered risk assessments, and track your health history over time.</p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                  Enter Portal <ArrowRight size={16} />
                </div>
              </div>
            </Link>

            {/* Clinical card */}
            <Link to="/clinical/dashboard" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', borderRadius: '20px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={32} color="var(--color-success)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Clinical Dashboard</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>Monitor patients, run AI assessments, and view analytics for comprehensive care.</p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 700, fontSize: '0.9rem' }}>
                  Enter Dashboard <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* System Status */}
        <section style={{ padding: '0 2rem 5rem' }}>
          <div style={{
            maxWidth: '900px', margin: '0 auto',
            padding: '1.25rem 2rem',
            borderRadius: '14px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={18} color="#10b981" />
              <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.9rem' }}>All Systems Operational</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'FastAPI Backend', ok: true },
                { label: 'ML Models', ok: true },
                { label: 'DB Layer', ok: true },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <StatusDot ok={s.ok} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes pulse-ok {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
