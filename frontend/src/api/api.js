/**
 * api.js — Unified API client
 *
 * Priority order:
 *   1. FastAPI backend (http://localhost:8000) — real ML model
 *   2. Graceful mock fallback — when backend is offline (dev / offline use)
 *
 * All functions maintain the same return shape so UI components are unaffected
 * regardless of which path is taken.
 */

import { mockPatients, mockCurrentUser } from './mockData';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000';
const LS_KEY   = 'mfrs_vitals_history';

/** Helper: simulate latency for the mock path */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Helper: attempt a fetch; return null on any network / HTTP error */
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;          // backend offline → caller falls back to mock
  }
}

// ── Patient endpoints ─────────────────────────────────────────────────────────

export const getPatients = async () => {
  const data = await safeFetch(`${API_BASE}/api/v1/patients`);
  if (data) return data;

  // fallback
  await delay(600);
  return mockPatients.map(({ vitalsHistory: _, ...p }) => p);
};

export const getPatientById = async (id) => {
  const data = await safeFetch(`${API_BASE}/api/v1/patients/${id}`);
  if (data) return data;

  // fallback
  await delay(400);
  const patient = mockPatients.find(p => p.id === id);
  if (!patient) throw new Error('Patient not found');
  return patient;
};

// ── Maternal Risk Prediction ──────────────────────────────────────────────────

/**
 * Predict maternal risk.
 * @param {object} vitals  { age, systolicBP, diastolicBP, bloodSugar, bodyTemp, heartRate }
 * @returns {{ riskLevel: string, confidence: number, probabilities?: object, disclaimer?: string }}
 */
export const predictMaternalRisk = async (vitals) => {
  const payload = {
    age:         vitals.age,
    systolicBP:  vitals.systolicBP,
    diastolicBP: vitals.diastolicBP,
    bloodSugar:  vitals.bloodSugar,
    bodyTemp:    vitals.bodyTemp,
    heartRate:   vitals.heartRate,
  };

  const data = await safeFetch(`${API_BASE}/api/v1/predict/maternal`, {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  if (data) {
    // Normalise API response → UI shape
    return {
      riskLevel:     _normaliseRiskLabel(data.risk_level),
      confidence:    data.confidence,
      probabilities: data.probabilities,
      disclaimer:    data.disclaimer,
      source:        'model',
    };
  }

  // ── Mock fallback (heuristic) ──────────────────────────────────────────────
  await delay(800);
  const { systolicBP, bloodSugar, age } = vitals;
  const ageRisk = age > 35 ? 1 : 0;
  let riskLevel, confidence;

  if (systolicBP >= 140 || bloodSugar >= 8.0 || (systolicBP >= 130 && ageRisk)) {
    riskLevel = 'High Risk'; confidence = 0.92;
  } else if (systolicBP >= 130 || bloodSugar >= 7.0 || ageRisk) {
    riskLevel = 'Mid Risk';  confidence = 0.85;
  } else {
    riskLevel = 'Low Risk';  confidence = 0.95;
  }

  return { riskLevel, confidence, source: 'mock' };
};

// ── Fetal Risk Prediction ─────────────────────────────────────────────────────

/**
 * Predict fetal CTG risk.
 * @param {object} ctgData  { abnormalShortTermVariability, percentageOfTimeWithAbnormalLongTermVariability,
 *                            accelerations, decelerationsLate, uterineContractions }
 * @returns {{ status: string, confidence: number }}
 */
export const predictFetalRisk = async (ctgData) => {
  const payload = {
    abnormalShortTermVariability:                    ctgData.abnormalShortTermVariability,
    percentageOfTimeWithAbnormalLongTermVariability: ctgData.percentageOfTimeWithAbnormalLongTermVariability,
    accelerations:                                   ctgData.accelerations,
    decelerationsLate:                               ctgData.decelerationsLate,
    uterineContractions:                             ctgData.uterineContractions,
  };

  const data = await safeFetch(`${API_BASE}/api/v1/predict/fetal`, {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  if (data) return { status: data.status, confidence: data.confidence, source: 'api' };

  // ── Mock fallback ──────────────────────────────────────────────────────────
  await delay(1000);
  const { abnormalShortTermVariability: astv, percentageOfTimeWithAbnormalLongTermVariability: paltv,
          accelerations: acc, decelerationsLate: dl, uterineContractions: uc } = ctgData;
  const score =
    (astv > 70 ? 2 : astv > 50 ? 1 : 0) +
    (paltv > 50 ? 2 : paltv > 30 ? 1 : 0) +
    (acc < 0.001 ? 1 : 0) +
    (dl > 0.01 ? 2 : 0) +
    (uc > 5 ? 1 : 0);

  if (score >= 4) return { status: 'Pathological', confidence: 0.89, source: 'mock' };
  if (score >= 2) return { status: 'Suspect',      confidence: 0.76, source: 'mock' };
  return            { status: 'Normal',            confidence: 0.98, source: 'mock' };
};

// ── Vitals submission (localStorage) ─────────────────────────────────────────

export const submitVitals = async (vitals, riskResult) => {
  await delay(200);
  const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  const entry = {
    id:          Date.now(),
    date:        new Date().toISOString().split('T')[0],
    systolicBP:  vitals.systolicBP,
    diastolicBP: vitals.diastolicBP,
    bloodSugar:  vitals.bloodSugar,
    bodyTemp:    vitals.bodyTemp,
    heartRate:   vitals.heartRate,
    age:         vitals.age,
    risk:        riskResult.riskLevel,
  };
  localStorage.setItem(LS_KEY, JSON.stringify([entry, ...existing]));
  return entry;
};

export const getMyHistory = async () => {
  await delay(500);
  const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  return [...stored, ...mockCurrentUser.history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise "high risk" → "High Risk" for UI consistency */
function _normaliseRiskLabel(label = '') {
  return label
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
