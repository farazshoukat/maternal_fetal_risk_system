import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div style={{
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '50%',
      padding: '1.5rem'
    }}>
      <AlertTriangle size={48} color="#ef4444" />
    </div>
    <div>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-text-muted)', lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '360px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
    <Link to="/" className="btn btn-primary">
      Return to Home
    </Link>
  </div>
);

export default NotFound;
