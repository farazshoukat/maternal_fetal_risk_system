import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export const useAlerts = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used inside AlertProvider');
  return ctx;
};

let toastIdCounter = 1;

export const AlertProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [alertLog, setAlertLog] = useState([
    {
      id: 'a-001',
      timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
      patientName: 'Sarah Jenkins',
      patientId: 'p-001',
      riskLevel: 'High Risk',
      channel: 'slack',
      message: 'Blood pressure 142/92 — critical threshold exceeded',
      status: 'delivered',
      workflowId: 'wf-maternal-risk-v2',
    },
    {
      id: 'a-002',
      timestamp: new Date(Date.now() - 47 * 60000).toISOString(),
      patientName: 'Fatima Hassan',
      patientId: 'p-005',
      riskLevel: 'High Risk',
      channel: 'sms',
      message: 'BP 152/99 + Blood Sugar 8.7 — immediate review required',
      status: 'delivered',
      workflowId: 'wf-maternal-risk-v2',
    },
    {
      id: 'a-003',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      patientName: 'Maria Rodriguez',
      patientId: 'p-003',
      riskLevel: 'Mid Risk',
      channel: 'email',
      message: 'BP trending upward — 128/84 over 4 visits',
      status: 'delivered',
      workflowId: 'wf-maternal-risk-v2',
    },
    {
      id: 'a-004',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      patientName: 'Priya Sharma',
      patientId: 'p-006',
      riskLevel: 'Mid Risk',
      channel: 'email',
      message: 'Elevated blood sugar 7.0 — dietary review recommended',
      status: 'delivered',
      workflowId: 'wf-maternal-risk-v2',
    },
  ]);

  const addToast = useCallback((toast) => {
    const id = toastIdCounter++;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const triggerN8nAlert = useCallback((patientName, patientId, riskLevel, message, channel = 'slack') => {
    const newAlert = {
      id: `a-${Date.now()}`,
      timestamp: new Date().toISOString(),
      patientName,
      patientId,
      riskLevel,
      channel,
      message,
      status: 'delivered',
      workflowId: 'wf-maternal-risk-v2',
    };
    setAlertLog(prev => [newAlert, ...prev]);

    const channelEmoji = { slack: '💬', sms: '📱', email: '📧' }[channel] || '🔔';
    addToast({
      type: riskLevel.includes('High') ? 'danger' : 'warning',
      title: `⚡ n8n Workflow Triggered`,
      message: `${channelEmoji} ${channel.toUpperCase()} alert sent — ${patientName} (${riskLevel})`,
    });
  }, [addToast]);

  return (
    <AlertContext.Provider value={{ toasts, alertLog, addToast, dismissToast, triggerN8nAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
