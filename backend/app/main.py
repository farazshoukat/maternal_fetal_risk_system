"""
================================================================================
  Maternal-Fetal Risk System — FastAPI Backend
================================================================================
  Endpoints:
    GET  /health                   — liveness check
    POST /api/v1/predict/maternal  — maternal risk from vitals (real ML model)
    POST /api/v1/predict/fetal     — fetal risk from CTG data (heuristic)
    GET  /api/v1/patients          — mock patient list
    GET  /api/v1/patients/{id}     — single patient detail

  Run with:
    uvicorn app.main:app --reload --port 8000
================================================================================
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    MaternalVitalsRequest, MaternalRiskResponse,
    FetalCTGRequest, FetalRiskResponse,
    HealthResponse,
)
from app.predictor import MaternalRiskPredictor, predict_fetal_risk_heuristic

# ── Mock patient store (mirrors frontend mockData.js) ────────────────────────
MOCK_PATIENTS = [
    {
        "id": "p-001", "name": "Sarah Jenkins", "age": 28,
        "gestationalAge": "32 weeks", "status": "High Risk",
        "lastVisit": "2023-10-24", "fetalStatus": "Suspect",
        "vitalsHistory": [
            {"date": "2023-10-14", "systolicBP": 125, "diastolicBP": 82, "bloodSugar": 6.9, "bodyTemp": 36.8, "heartRate": 80},
            {"date": "2023-10-17", "systolicBP": 128, "diastolicBP": 84, "bloodSugar": 7.1, "bodyTemp": 36.9, "heartRate": 82},
            {"date": "2023-10-20", "systolicBP": 130, "diastolicBP": 85, "bloodSugar": 7.2, "bodyTemp": 36.8, "heartRate": 82},
            {"date": "2023-10-22", "systolicBP": 135, "diastolicBP": 88, "bloodSugar": 7.5, "bodyTemp": 36.8, "heartRate": 85},
            {"date": "2023-10-24", "systolicBP": 142, "diastolicBP": 92, "bloodSugar": 8.1, "bodyTemp": 37.0, "heartRate": 90},
        ],
    },
    {
        "id": "p-002", "name": "Emily Chen", "age": 34,
        "gestationalAge": "24 weeks", "status": "Low Risk",
        "lastVisit": "2023-10-25", "fetalStatus": "Normal",
        "vitalsHistory": [
            {"date": "2023-10-10", "systolicBP": 108, "diastolicBP": 68, "bloodSugar": 5.2, "bodyTemp": 36.5, "heartRate": 70},
            {"date": "2023-10-15", "systolicBP": 110, "diastolicBP": 70, "bloodSugar": 5.4, "bodyTemp": 36.4, "heartRate": 72},
            {"date": "2023-10-20", "systolicBP": 115, "diastolicBP": 72, "bloodSugar": 5.6, "bodyTemp": 36.5, "heartRate": 74},
            {"date": "2023-10-25", "systolicBP": 112, "diastolicBP": 70, "bloodSugar": 5.5, "bodyTemp": 36.4, "heartRate": 73},
        ],
    },
    {
        "id": "p-003", "name": "Maria Rodriguez", "age": 22,
        "gestationalAge": "38 weeks", "status": "Mid Risk",
        "lastVisit": "2023-10-23", "fetalStatus": "Normal",
        "vitalsHistory": [
            {"date": "2023-10-05", "systolicBP": 118, "diastolicBP": 78, "bloodSugar": 6.5, "bodyTemp": 36.7, "heartRate": 76},
            {"date": "2023-10-10", "systolicBP": 120, "diastolicBP": 80, "bloodSugar": 6.8, "bodyTemp": 36.7, "heartRate": 78},
            {"date": "2023-10-18", "systolicBP": 125, "diastolicBP": 82, "bloodSugar": 6.9, "bodyTemp": 36.6, "heartRate": 80},
            {"date": "2023-10-23", "systolicBP": 128, "diastolicBP": 84, "bloodSugar": 7.0, "bodyTemp": 36.9, "heartRate": 82},
        ],
    },
    {
        "id": "p-004", "name": "Aisha Patel", "age": 31,
        "gestationalAge": "20 weeks", "status": "Low Risk",
        "lastVisit": "2023-10-26", "fetalStatus": "Normal",
        "vitalsHistory": [
            {"date": "2023-10-12", "systolicBP": 105, "diastolicBP": 65, "bloodSugar": 4.9, "bodyTemp": 36.4, "heartRate": 68},
            {"date": "2023-10-18", "systolicBP": 108, "diastolicBP": 67, "bloodSugar": 5.0, "bodyTemp": 36.5, "heartRate": 70},
            {"date": "2023-10-26", "systolicBP": 110, "diastolicBP": 68, "bloodSugar": 5.1, "bodyTemp": 36.5, "heartRate": 71},
        ],
    },
    {
        "id": "p-005", "name": "Fatima Hassan", "age": 26,
        "gestationalAge": "35 weeks", "status": "High Risk",
        "lastVisit": "2023-10-24", "fetalStatus": "Pathological",
        "vitalsHistory": [
            {"date": "2023-10-10", "systolicBP": 138, "diastolicBP": 90, "bloodSugar": 7.8, "bodyTemp": 37.1, "heartRate": 88},
            {"date": "2023-10-16", "systolicBP": 143, "diastolicBP": 93, "bloodSugar": 8.0, "bodyTemp": 37.2, "heartRate": 91},
            {"date": "2023-10-20", "systolicBP": 148, "diastolicBP": 96, "bloodSugar": 8.3, "bodyTemp": 37.3, "heartRate": 94},
            {"date": "2023-10-24", "systolicBP": 152, "diastolicBP": 99, "bloodSugar": 8.7, "bodyTemp": 37.4, "heartRate": 96},
        ],
    },
    {
        "id": "p-006", "name": "Priya Sharma", "age": 29,
        "gestationalAge": "28 weeks", "status": "Mid Risk",
        "lastVisit": "2023-10-22", "fetalStatus": "Suspect",
        "vitalsHistory": [
            {"date": "2023-10-08", "systolicBP": 122, "diastolicBP": 79, "bloodSugar": 6.6, "bodyTemp": 36.7, "heartRate": 77},
            {"date": "2023-10-15", "systolicBP": 126, "diastolicBP": 81, "bloodSugar": 6.9, "bodyTemp": 36.8, "heartRate": 79},
            {"date": "2023-10-22", "systolicBP": 129, "diastolicBP": 83, "bloodSugar": 7.0, "bodyTemp": 36.9, "heartRate": 81},
        ],
    },
]


# ── App lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML model on startup; clean up on shutdown."""
    print("[Startup] Loading maternal risk model...")
    MaternalRiskPredictor.load()
    print("[Startup] Ready.")
    yield
    print("[Shutdown] Releasing resources.")


# ── App instance ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="Maternal-Fetal Risk System API",
    description=(
        "REST API for maternal health risk prediction using a trained Random Forest model. "
        "⚠️ For research and educational use only — not a clinical tool."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Vite dev server (port 5173) and any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Liveness probe — confirms the server is running and model is loaded."""
    return {
        "status": "ok",
        "maternal_model_loaded": MaternalRiskPredictor.is_loaded(),
        "version": "1.0.0",
    }


@app.post(
    "/api/v1/predict/maternal",
    response_model=MaternalRiskResponse,
    tags=["Prediction"],
    summary="Predict maternal health risk level from clinical vitals",
)
async def predict_maternal_risk(body: MaternalVitalsRequest):
    """
    Run the trained Random Forest model against the submitted vital signs
    and return a risk classification (low / mid / high) with per-class
    probabilities and a mandatory clinical disclaimer.
    """
    try:
        result = MaternalRiskPredictor.predict(
            age=body.age,
            systolic_bp=body.systolicBP,
            diastolic_bp=body.diastolicBP,
            blood_sugar=body.bloodSugar,
            body_temp=body.bodyTemp,
            heart_rate=body.heartRate,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")


@app.post(
    "/api/v1/predict/fetal",
    response_model=FetalRiskResponse,
    tags=["Prediction"],
    summary="Predict fetal distress risk from CTG data",
)
async def predict_fetal_risk(body: FetalCTGRequest):
    """
    Classify fetal status (Normal / Suspect / Pathological) from
    Cardiotocogram (CTG) features using a validated clinical heuristic.
    Replace with a trained model when labelled CTG data is available.
    """
    result = predict_fetal_risk_heuristic(
        abnormal_stv=body.abnormalShortTermVariability,
        pct_abnormal_ltv=body.percentageOfTimeWithAbnormalLongTermVariability,
        accelerations=body.accelerations,
        decelerations_late=body.decelerationsLate,
        uterine_contractions=body.uterineContractions,
    )
    return result


@app.get("/api/v1/patients", tags=["Patients"])
async def get_patients():
    """Return all patient summaries (without vitals history)."""
    summaries = [
        {k: v for k, v in p.items() if k != "vitalsHistory"}
        for p in MOCK_PATIENTS
    ]
    return summaries


@app.get("/api/v1/patients/{patient_id}", tags=["Patients"])
async def get_patient_by_id(patient_id: str):
    """Return a single patient record including full vitals history."""
    patient = next((p for p in MOCK_PATIENTS if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")
    return patient
