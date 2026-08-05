"""
================================================================================
  Maternal-Fetal Risk System — FastAPI Backend
================================================================================
  Endpoints:
    GET  /health                   — liveness check
    POST /api/v1/predict/maternal  — maternal risk from vitals (real ML model)
    POST /api/v1/predict/fetal     — fetal risk from CTG data (heuristic)

  Patient data is stored and served directly via Supabase — these endpoints
  were retired in favour of client-side Supabase queries in supabase_db.js.

  Run with:
    uvicorn app.main:app --reload --port 8000
================================================================================
"""

import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    MaternalVitalsRequest, MaternalRiskResponse,
    FetalCTGRequest, FetalRiskResponse,
    HealthResponse,
)
from app.predictor import MaternalRiskPredictor, predict_fetal_risk_heuristic
from app.alerting import fire_n8n_alert



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

# CORS — allow Vite dev server on any common port
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
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

        # ── Fire n8n webhook alert (non-blocking background thread) ──────────
        vitals_payload = {
            "systolicBP":  body.systolicBP,
            "diastolicBP": body.diastolicBP,
            "bloodSugar":  body.bloodSugar,
            "bodyTemp":    body.bodyTemp,
            "heartRate":   body.heartRate,
            "age":         body.age,
        }
        threading.Thread(
            target=fire_n8n_alert,
            kwargs={
                "risk_level":   result["risk_level"],
                "confidence":   result["probabilities"].get(result["risk_level"], result["confidence"]),
                "vitals":       vitals_payload,
                "patient_name": getattr(body, "patient_name", "Anonymous Patient"),
            },
            daemon=True,
        ).start()
        # ─────────────────────────────────────────────────────────────────────

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

