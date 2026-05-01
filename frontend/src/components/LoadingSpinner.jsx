import React from 'react';

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex-center" style={{ flexDirection: 'column', gap: '1.5rem', padding: '3rem' }}>
      <div style={{ 
        width: '48px', height: '48px', 
        border: '3px solid rgba(14, 165, 233, 0.2)', 
        borderTopColor: 'var(--color-accent)', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}></div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500 }} className="animate-pulse">{text}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
