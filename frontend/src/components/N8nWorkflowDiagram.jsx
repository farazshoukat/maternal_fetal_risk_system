import React from 'react';
import { Webhook, GitBranch, MessageSquare, Phone, Mail, CheckCircle, ArrowRight, Cpu, Filter, Zap } from 'lucide-react';

const WorkflowNode = ({ icon: Icon, label, sublabel, color, active, pulse }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      position: 'relative',
    }}
  >
    <div
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '14px',
        background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
        border: `2px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: active ? `0 0 20px ${color}40` : 'none',
        animation: pulse ? 'nodeGlow 2s ease-in-out infinite' : 'none',
      }}
    >
      <Icon size={24} color={active ? color : 'rgba(255,255,255,0.3)'} />
      {active && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      )}
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: active ? '#f8fafc' : 'rgba(248,250,252,0.4)', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: '0.65rem', color: 'rgba(248,250,252,0.3)', whiteSpace: 'nowrap' }}>
          {sublabel}
        </div>
      )}
    </div>
  </div>
);

const FlowArrow = ({ active, color = '#0ea5e9' }) => (
  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '24px' }}>
    <div
      style={{
        width: '40px',
        height: '2px',
        background: active
          ? `linear-gradient(90deg, ${color}80, ${color})`
          : 'rgba(255,255,255,0.08)',
        position: 'relative',
        borderRadius: '2px',
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            animation: 'flowDot 1.5s ease-in-out infinite',
          }}
        />
      )}
    </div>
  </div>
);

const N8nWorkflowDiagram = ({ isTriggered }) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* n8n branding bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,100,22,0.08)',
        border: '1px solid rgba(255,100,22,0.2)',
        borderRadius: '10px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ff6416, #ff9100)',
          borderRadius: '6px',
          padding: '4px 8px',
          fontWeight: 800,
          fontSize: '0.8rem',
          color: 'white',
          letterSpacing: '0.05em',
        }}>
          n8n
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
            Maternal Risk Alert Workflow
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.5)' }}>
            wf-maternal-risk-v2 · Active · {isTriggered ? '🔴 Running' : '🟢 Listening'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: isTriggered ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            color: isTriggered ? '#ef4444' : '#10b981',
            border: `1px solid ${isTriggered ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            animation: isTriggered ? 'pulseBadge 1s ease-in-out infinite' : 'none',
          }}>
            {isTriggered ? 'TRIGGERED' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Workflow nodes */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0',
        overflowX: 'auto',
        padding: '1rem 0',
      }}>
        <WorkflowNode
          icon={Webhook}
          label="Vitals Webhook"
          sublabel="POST /trigger"
          color="#ff6416"
          active={isTriggered}
          pulse={isTriggered}
        />
        <FlowArrow active={isTriggered} color="#ff6416" />
        <WorkflowNode
          icon={Cpu}
          label="Risk Classifier"
          sublabel="ML Model"
          color="#0ea5e9"
          active={isTriggered}
        />
        <FlowArrow active={isTriggered} color="#0ea5e9" />
        <WorkflowNode
          icon={Filter}
          label="Condition Router"
          sublabel="IF High Risk"
          color="#f59e0b"
          active={isTriggered}
        />
        <FlowArrow active={isTriggered} color="#f59e0b" />
        <WorkflowNode
          icon={MessageSquare}
          label="Slack Alert"
          sublabel="#alerts channel"
          color="#4a154b"
          active={isTriggered}
        />
        <FlowArrow active={isTriggered} color="#94a3b8" />
        <WorkflowNode
          icon={Phone}
          label="SMS Alert"
          sublabel="Dr. Smith +1..."
          color="#10b981"
          active={isTriggered}
        />
        <FlowArrow active={isTriggered} color="#94a3b8" />
        <WorkflowNode
          icon={Mail}
          label="Email Alert"
          sublabel="clinic@hospital.org"
          color="#3b82f6"
          active={isTriggered}
        />
        <FlowArrow active={isTriggered} color="#94a3b8" />
        <WorkflowNode
          icon={CheckCircle}
          label="Log & Audit"
          sublabel="PostgreSQL"
          color="#10b981"
          active={isTriggered}
        />
      </div>

      <style>{`
        @keyframes nodeGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,100,22,0.4); }
          50% { box-shadow: 0 0 40px rgba(255,100,22,0.8); }
        }
        @keyframes flowDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }
        @keyframes pulseBadge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default N8nWorkflowDiagram;
