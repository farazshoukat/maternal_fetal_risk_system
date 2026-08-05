/**
 * supabase_db.js — Supabase database operations
 *
 * Handles all persistent reads/writes for:
 *   - vital_readings (patient vitals history)
 *   - ctg_readings   (fetal CTG history)
 *   - patients       (clinical patient records)
 *
 * FastAPI remains the source of truth for ML predictions.
 * Supabase is used only for auth + reading/storing readings.
 */

import { supabase } from '../lib/supabase';

// ── Patient record management ─────────────────────────────────────────────────

/**
 * Ensure a patients row exists for this auth user (profile_id).
 * If one doesn't exist, create it. Returns the patients.id UUID.
 *
 * @param {string} profileId   - auth.uid()
 * @param {string} fullName    - user's display name
 * @param {number|null} age    - optional
 * @returns {Promise<string>}  - patients.id UUID
 */
export async function getOrCreatePatientRecord(profileId, fullName, age = null) {
  if (!profileId) throw new Error('profileId is required');

  // Check if a patient record already linked to this profile exists
  const { data: existing, error: fetchErr } = await supabase
    .from('patients')
    .select('id')
    .eq('linked_profile_id', profileId)
    .maybeSingle();

  if (fetchErr) {
    console.warn('[supabase_db] Error fetching patient record:', fetchErr.message);
  }

  if (existing?.id) return existing.id;

  // Create a new patients row
  const { data: created, error: insertErr } = await supabase
    .from('patients')
    .insert({
      name: fullName || 'Patient',
      age: age || null,
      linked_profile_id: profileId,
      created_by: profileId,
    })
    .select('id')
    .single();

  if (insertErr) throw new Error(`Failed to create patient record: ${insertErr.message}`);

  // Back-link the profile row with the new patients.id
  await supabase
    .from('profiles')
    .update({ linked_patient_id: created.id })
    .eq('id', profileId);

  return created.id;
}


// ── Vital readings ────────────────────────────────────────────────────────────

/**
 * Insert a new vital reading for a patient.
 *
 * @param {string} profileId   - auth.uid() of the user submitting
 * @param {string} patientId   - patients.id UUID (from getOrCreatePatientRecord)
 * @param {object} vitals      - { systolicBP, diastolicBP, heartRate, bloodSugar, bodyTemp, age }
 * @param {string} riskLevel   - prediction result e.g. "High Risk"
 * @param {string} recordedBy  - 'patient' | 'clinician'
 */
export async function insertVitalReading(
  profileId,
  patientId,
  vitals,
  riskLevel = null,
  recordedBy = 'patient'
) {
  if (!profileId) throw new Error('profileId is required');

  const { error } = await supabase.from('vital_readings').insert({
    patient_id:   patientId || null,
    profile_id:   profileId,
    systolic_bp:  vitals.systolicBP,
    diastolic_bp: vitals.diastolicBP,
    heart_rate:   vitals.heartRate,
    blood_sugar:  vitals.bloodSugar,
    body_temp:    vitals.bodyTemp ?? null,
    age:          vitals.age ?? null,
    risk_level:   riskLevel,
    recorded_by:  recordedBy,
  });

  if (error) throw new Error(`Failed to insert vital reading: ${error.message}`);
}

/**
 * Get all vital readings for the currently logged-in patient.
 *
 * @param {string} profileId   - auth.uid()
 * @returns {Promise<Array>}   - Array of vital_readings rows (camelCase mapped)
 */
export async function getMyVitalReadings(profileId) {
  if (!profileId) return [];

  const { data, error } = await supabase
    .from('vital_readings')
    .select('*')
    .eq('profile_id', profileId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('[supabase_db] Error fetching vital readings:', error.message);
    return [];
  }

  return (data || []).map(mapVitalRow);
}

/**
 * Get all vital readings for a specific patient (clinical staff view).
 *
 * @param {string} patientId   - patients.id UUID
 * @returns {Promise<Array>}   - Array of vital_readings rows (camelCase mapped)
 */
export async function getPatientVitalReadings(patientId) {
  if (!patientId) return [];

  const { data, error } = await supabase
    .from('vital_readings')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('[supabase_db] Error fetching patient vitals:', error.message);
    return [];
  }

  return (data || []).map(mapVitalRow);
}

/**
 * Get vital readings for a patient linked to a given profile_id.
 * Useful when the clinical staff doesn't have the patients.id but has the profile UUID.
 *
 * @param {string} linkedProfileId  - profiles.id of the patient
 * @returns {Promise<Array>}
 */
export async function getVitalReadingsByProfileId(linkedProfileId) {
  if (!linkedProfileId) return [];

  const { data, error } = await supabase
    .from('vital_readings')
    .select('*')
    .eq('profile_id', linkedProfileId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('[supabase_db] Error fetching vitals by profile:', error.message);
    return [];
  }

  return (data || []).map(mapVitalRow);
}

/** Map DB snake_case columns → camelCase for UI consistency */
function mapVitalRow(row) {
  return {
    id:          row.id,
    date:        row.recorded_at ? row.recorded_at.split('T')[0] : '',
    recordedAt:  row.recorded_at,
    systolicBP:  parseFloat(row.systolic_bp),
    diastolicBP: parseFloat(row.diastolic_bp),
    heartRate:   parseFloat(row.heart_rate),
    bloodSugar:  parseFloat(row.blood_sugar),
    bodyTemp:    row.body_temp != null ? parseFloat(row.body_temp) : null,
    age:         row.age != null ? parseInt(row.age) : null,
    risk:        row.risk_level || '',
    recordedBy:  row.recorded_by,
  };
}


// ── CTG readings ──────────────────────────────────────────────────────────────

/**
 * Insert a new CTG reading.
 *
 * @param {string} profileId   - auth.uid()
 * @param {string} patientId   - patients.id UUID (or null)
 * @param {object} ctgData     - { abnormalShortTermVariability, percentageOfTimeWithAbnormalLongTermVariability,
 *                                  accelerations, decelerationsLate, uterineContractions }
 * @param {string} fetalStatus - 'Normal' | 'Suspect' | 'Pathological'
 */
export async function insertCtgReading(profileId, patientId, ctgData, fetalStatus = null) {
  if (!profileId) throw new Error('profileId is required');

  const { error } = await supabase.from('ctg_readings').insert({
    patient_id:           patientId || null,
    profile_id:           profileId,
    abnormal_stv:         ctgData.abnormalShortTermVariability,
    pct_abnormal_ltv:     ctgData.percentageOfTimeWithAbnormalLongTermVariability,
    accelerations:        ctgData.accelerations,
    decelerations_late:   ctgData.decelerationsLate,
    uterine_contractions: ctgData.uterineContractions,
    fetal_status:         fetalStatus,
  });

  if (error) throw new Error(`Failed to insert CTG reading: ${error.message}`);
}

/**
 * Get all CTG readings for a specific patient (clinical staff view).
 *
 * @param {string} patientId   - patients.id UUID
 * @returns {Promise<Array>}   - Array of ctg_readings rows (camelCase mapped)
 */
export async function getPatientCtgReadings(patientId) {
  if (!patientId) return [];

  const { data, error } = await supabase
    .from('ctg_readings')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('[supabase_db] Error fetching CTG readings:', error.message);
    return [];
  }

  return (data || []).map(mapCtgRow);
}

/**
 * Get CTG readings for a patient linked to a profile_id.
 *
 * @param {string} linkedProfileId  - profiles.id of the patient
 * @returns {Promise<Array>}
 */
export async function getCtgReadingsByProfileId(linkedProfileId) {
  if (!linkedProfileId) return [];

  const { data, error } = await supabase
    .from('ctg_readings')
    .select('*')
    .eq('profile_id', linkedProfileId)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('[supabase_db] Error fetching CTG readings by profile:', error.message);
    return [];
  }

  return (data || []).map(mapCtgRow);
}

/** Map DB snake_case columns → camelCase */
function mapCtgRow(row) {
  return {
    id:                                              row.id,
    recordedAt:                                      row.recorded_at,
    abnormalShortTermVariability:                    parseFloat(row.abnormal_stv),
    percentageOfTimeWithAbnormalLongTermVariability: parseFloat(row.pct_abnormal_ltv),
    accelerations:                                   parseFloat(row.accelerations),
    decelerationsLate:                               parseFloat(row.decelerations_late),
    uterineContractions:                             parseFloat(row.uterine_contractions),
    fetalStatus:                                     row.fetal_status,
  };
}


// ── Averaging helpers ─────────────────────────────────────────────────────────

/**
 * Compute the mean of a numeric field across an array of readings.
 * Returns null if the array is empty or field is missing.
 *
 * @param {Array}  readings  - array of camelCase-mapped rows
 * @param {string} field     - field name e.g. 'systolicBP'
 * @returns {number|null}
 */
export function averageField(readings, field) {
  if (!readings || readings.length === 0) return null;
  const valid = readings.map(r => r[field]).filter(v => v != null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Build an averaged vitals object from an array of vital_readings rows.
 * Used to send to the FastAPI /predict/maternal endpoint.
 *
 * @param {Array} readings - from getPatientVitalReadings() or getMyVitalReadings()
 * @returns {object|null}  - { systolicBP, diastolicBP, heartRate, bloodSugar, bodyTemp, age }
 */
export function computeAveragedVitals(readings) {
  if (!readings || readings.length === 0) return null;
  return {
    systolicBP:  +(averageField(readings, 'systolicBP')?.toFixed(1)),
    diastolicBP: +(averageField(readings, 'diastolicBP')?.toFixed(1)),
    heartRate:   +(averageField(readings, 'heartRate')?.toFixed(1)),
    bloodSugar:  +(averageField(readings, 'bloodSugar')?.toFixed(2)),
    bodyTemp:    +(averageField(readings, 'bodyTemp')?.toFixed(1)),
    age:         +(averageField(readings, 'age')?.toFixed(0)),
  };
}

/**
 * Build an averaged CTG object from an array of ctg_readings rows.
 * Used to send to the FastAPI /predict/fetal endpoint.
 *
 * @param {Array} readings - from getPatientCtgReadings()
 * @returns {object|null}
 */
export function computeAveragedCtg(readings) {
  if (!readings || readings.length === 0) return null;
  return {
    abnormalShortTermVariability:                    +(averageField(readings, 'abnormalShortTermVariability')?.toFixed(2)),
    percentageOfTimeWithAbnormalLongTermVariability: +(averageField(readings, 'percentageOfTimeWithAbnormalLongTermVariability')?.toFixed(2)),
    accelerations:                                   +(averageField(readings, 'accelerations')?.toFixed(6)),
    decelerationsLate:                               +(averageField(readings, 'decelerationsLate')?.toFixed(6)),
    uterineContractions:                             +(averageField(readings, 'uterineContractions')?.toFixed(6)),
  };
}


// ── Patients listing (clinical) ───────────────────────────────────────────────

/**
 * Fetch ALL patients for the clinical dashboard.
 *
 * Strategy: three independent queries merged in JS so that:
 *   1. Every profile with role='patient' appears — even those who haven't
 *      submitted vitals yet (no patients row, no vital_readings yet).
 *   2. Vital readings are attached correctly whether they were stored with
 *      patient_id or only profile_id.
 *
 * @returns {Promise<Array>}  Normalised patient objects with vital_readings[]
 */
export async function getAllPatients() {
  // ── 1. All patient profiles ──────────────────────────────────────────────
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('role', 'patient');

  if (profilesErr) {
    console.warn('[supabase_db] Error fetching profiles:', profilesErr.message);
    return [];
  }

  // ── 2. All patient records (clinical rows) ───────────────────────────────
  const { data: patientRecords } = await supabase
    .from('patients')
    .select('id, name, age, gestational_age, created_at, linked_profile_id');

  // Build lookup: profile_id → patient record
  const patientByProfileId = {};
  (patientRecords || []).forEach(p => {
    if (p.linked_profile_id) patientByProfileId[p.linked_profile_id] = p;
  });

  // ── 3. All vital readings ────────────────────────────────────────────────
  const { data: allVitals } = await supabase
    .from('vital_readings')
    .select('id, patient_id, profile_id, systolic_bp, diastolic_bp, heart_rate, blood_sugar, risk_level, recorded_at')
    .order('recorded_at', { ascending: false });

  // Build lookups: patient_id → readings[], profile_id → readings[]
  const vitalsByPatientId  = {};
  const vitalsByProfileId  = {};
  (allVitals || []).forEach(v => {
    if (v.patient_id) {
      (vitalsByPatientId[v.patient_id]  ||= []).push(v);
    }
    if (v.profile_id) {
      (vitalsByProfileId[v.profile_id] ||= []).push(v);
    }
  });

  // ── 4. Merge: one entry per patient profile ──────────────────────────────
  const merged = (profiles || []).map(profile => {
    const rec      = patientByProfileId[profile.id];           // may be undefined
    const readings = rec
      ? (vitalsByPatientId[rec.id] || vitalsByProfileId[profile.id] || [])
      : (vitalsByProfileId[profile.id] || []);

    return {
      id:                rec?.id              || profile.id,   // prefer patients.id
      name:              rec?.name            || profile.full_name || 'Unknown Patient',
      age:               rec?.age             ?? null,
      gestational_age:   rec?.gestational_age ?? null,
      created_at:        rec?.created_at      || profile.created_at,
      linked_profile_id: profile.id,
      vital_readings:    readings,
    };
  });

  // Sort newest-registered first
  return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Fetch a single patient by their patients.id UUID.
 *
 * @param {string} patientId  - patients.id UUID
 * @returns {Promise<object|null>}
 */
export async function getPatientById(patientId) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    console.warn('[supabase_db] Error fetching patient:', error.message);
    return null;
  }

  return data;
}
