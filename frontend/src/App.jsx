import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import ClinicalLayout from './layouts/ClinicalLayout';

import LandingPage from './pages/LandingPage';
import LogVitals from './pages/patient/LogVitals';
import VitalsHistory from './pages/patient/VitalsHistory';
import PatientList from './pages/clinical/PatientList';
import PatientDetail from './pages/clinical/PatientDetail';
import ClinicalDashboard from './pages/clinical/ClinicalDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Patient Routes */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="/patient/log" replace />} />
          <Route path="log" element={<LogVitals />} />
          <Route path="history" element={<VitalsHistory />} />
        </Route>
        
        {/* Clinical Routes */}
        <Route path="/clinical" element={<ClinicalLayout />}>
          <Route index element={<Navigate to="/clinical/patients" replace />} />
          <Route path="dashboard" element={<ClinicalDashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/:id" element={<PatientDetail />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
