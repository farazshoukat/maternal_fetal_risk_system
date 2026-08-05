# Maternal-Fetal Risk System — Bug Audit & Fix Plan

Scope: separate patient/doctor logins, patient-submitted readings persisting to a
real database, and the clinical dashboard showing every patient's full history for
review. This is based on reading the current `master` branch, not assumptions.

## Root cause (read this first)

Two data paths exist side by side and were never merged:

1. **Supabase path** (real, working): `Login.jsx` → Supabase auth → `profiles.role`
   (`patient` / `doctor`) → `ProtectedRoute` redirects to `/patient` or `/clinical`.
   `LogVitals.jsx` calls `getOrCreatePatientRecord()` + `insertVitalReading()` from
   `supabase_db.js`, which does write real rows to `patients` / `vital_readings`.
2. **Mock/FastAPI path** (fake, still wired to the UI): `PatientList.jsx` and
   `PatientDetail.jsx` call `getPatients()` / `getPatientById()` from `api.js`,
   which hit `GET /api/v1/patients` on the FastAPI backend. That endpoint returns
   the hardcoded `MOCK_PATIENTS` list in `backend/app/main.py` — 6 fake patients,
   no database behind it at all.

Result: a patient can sign up, log in, and submit vitals that really do land in
Supabase — but the clinical dashboard never queries Supabase for the roster, so no
doctor will ever see that patient or that reading. `supabase_db.js` already has
`getAllPatients()` and `getPatientVitalReadings()` written and ready; they're just
not called from the pages that render the roster. This one gap is why it currently
*looks* like readings "aren't saved" from the doctor's side.

## Bugs found, in priority order

### 1. Clinical roster reads mock data, not the database (blocking bug)
- `frontend/src/pages/clinical/PatientList.jsx` → `getPatients()` (api.js → FastAPI
  mock) instead of `getAllPatients()` (supabase_db.js).
- `frontend/src/pages/clinical/PatientDetail.jsx` fetches the mock patient by ID
  *and* tries `getPatientVitalReadings(id)` from Supabase — but `id` here is
  whatever route param `PatientList` linked to, which is a mock ID like `"p-001"`,
  never a real `patients.id` UUID. So the Supabase call silently returns nothing
  for real patients.
- **Fix:** rewrite `PatientList.jsx` to call `getAllPatients()` and render Supabase
  rows (join real name/age/latest risk from `vital_readings`). Rewrite
  `PatientDetail.jsx` to route on the real `patients.id` UUID and drop the mock
  fallback for real data — mock data should only ever back the offline demo mode,
  never the primary render path.

### 2. Backend `/api/v1/patients` has no database and no auth
- `backend/app/main.py` serves `MOCK_PATIENTS` from an in-memory Python list —
  there is no persistence layer on the backend at all; all real persistence
  currently happens client-side straight to Supabase.
- `backend/app/auth.py` already implements `get_current_user` and
  `get_current_doctor` (Supabase JWT validation + role check) but **neither is
  used anywhere in `main.py`**. Every endpoint, including patient data, is
  currently unauthenticated.
- **Fix:** either (a) retire `/api/v1/patients*` entirely and let the frontend
  read Supabase directly (simplest, matches how `LogVitals`/`VitalsHistory`
  already work), or (b) if you want the backend to be the source of truth for
  clinical reads, add real Supabase-backed endpoints and protect them with
  `Depends(get_current_doctor)`. Pick (a) unless you have a reason to keep
  patient data flowing through FastAPI too — don't leave two half-built paths.

### 3. Patient vitals write to two places with no reconciliation
- `LogVitals.jsx` writes to Supabase (`insertVitalReading`) **and** to
  `localStorage` (`submitVitals` in `api.js`) as a "fallback," but it always runs
  the localStorage write regardless of whether the Supabase write succeeded.
- `getMyHistory()` in `api.js` merges localStorage + hardcoded `mockCurrentUser`
  history and is unused by `VitalsHistory.jsx` (which already correctly prefers
  `getMyVitalReadings()` from Supabase) — but `getMyHistory`/`submitVitals`/
  `LS_KEY` are still live dead-adjacent code that can silently diverge from the
  DB (e.g. on a different browser/device the localStorage copy won't exist, or a
  patient could see phantom entries that never reached a doctor).
- **Fix:** make the Supabase insert the only source of truth for "did this save."
  Remove the unconditional `submitVitals()` localStorage write, or clearly scope
  it as an offline-only queue that retries against Supabase — not a permanent
  parallel copy.

### 4. No committed database schema
- There's no `schema.sql` / migrations folder in the repo. The `patients`,
  `vital_readings`, `ctg_readings`, `profiles` tables referenced throughout
  `supabase_db.js` and `auth.py` exist only in your live Supabase project.
- **Fix:** export the current schema (Supabase Studio → Database → generate
  migration, or `supabase db dump`) and commit it to `backend/db/schema.sql` (or
  a `supabase/migrations/` folder if you adopt the Supabase CLI). Without this,
  nobody — including a future you on a new machine — can stand this project back
  up, and it's the first thing a serious reviewer of a "full stack project" will
  look for.

### 5. Row Level Security not verifiable from the repo
- Given (4), it's not possible to confirm from the code whether Supabase RLS
  policies actually restrict `vital_readings`/`patients` reads to the owning
  patient or a `doctor`-role user, versus relying entirely on the frontend
  `ProtectedRoute` check (which is client-side and not a real access control).
- **Fix:** once the schema is committed, add RLS policies: patients can `select`/
  `insert` only rows where `profile_id = auth.uid()`; doctors (role check via a
  `profiles.role = 'doctor'` policy) can `select` all rows. This is what actually
  enforces "separate logins," not just the UI routing.

## Suggested order of work

1. Export & commit the Supabase schema + RLS policies (#4, #5) — everything else
   depends on knowing the real table shape.
2. Point `PatientList.jsx` / `PatientDetail.jsx` at `supabase_db.js` functions
   instead of the FastAPI mock (#1). This is the fix that actually makes "patient
   submits → doctor sees it" work end to end.
3. Decide the backend's role and either delete or properly secure
   `/api/v1/patients*` (#2).
4. Clean up the localStorage fallback in vitals submission (#3).

Once #1–#3 are done, the flow you described — patient logs in separately from a
doctor, submits readings, and any doctor can open the clinical dashboard and see
every patient's full history to check for real risk — will actually be true end
to end instead of true only for the patient's own screen.
