import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AlertProvider } from './context/AlertContext';
import { AuthProvider } from './context/AuthContext';

// Auth guards
import ProtectedRoute from './components/ProtectedRoute';

// Toast system
import ToastSystem from './components/ToastSystem';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import ClinicalLayout from './layouts/ClinicalLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LogVitals from './pages/patient/LogVitals';
import VitalsHistory from './pages/patient/VitalsHistory';
import PatientList from './pages/clinical/PatientList';
import PatientDetail from './pages/clinical/PatientDetail';
import ClinicalDashboard from './pages/clinical/ClinicalDashboard';
import AlertsPanel from './pages/clinical/AlertsPanel';
import Analytics from './pages/clinical/Analytics';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <ToastSystem />
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Patient Routes — requires role=patient */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute requiredRole="patient">
                  <PatientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/patient/log" replace />} />
              <Route path="log" element={<LogVitals />} />
              <Route path="history" element={<VitalsHistory />} />
            </Route>

            {/* Clinical Routes — requires role=doctor */}
            <Route
              path="/clinical"
              element={
                <ProtectedRoute requiredRole="doctor">
                  <ClinicalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/clinical/dashboard" replace />} />
              <Route path="dashboard" element={<ClinicalDashboard />} />
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="alerts" element={<AlertsPanel />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
