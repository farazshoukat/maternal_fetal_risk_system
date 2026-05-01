"""
Pydantic schemas — request bodies & response models for the Maternal-Fetal Risk API.
"""
from pydantic import BaseModel, Field
from typing import Optional


# ── Maternal Risk ────────────────────────────────────────────────────────────

class MaternalVitalsRequest(BaseModel):
    age: float = Field(..., ge=10, le=70, example=28,
                       description="Patient age in years")
    systolicBP: float = Field(..., ge=60, le=200, example=130,
                              description="Systolic blood pressure (mmHg)")
    diastolicBP: float = Field(..., ge=40, le=140, example=85,
                               description="Diastolic blood pressure (mmHg)")
    bloodSugar: float = Field(..., ge=3.0, le=30.0, example=7.5,
                              description="Blood glucose level (mmol/L)")
    bodyTemp: float = Field(..., ge=35.0, le=42.0, example=36.8,
                            description="Body temperature (°C)")
    heartRate: float = Field(..., ge=40, le=180, example=82,
                             description="Heart rate (bpm)")

    class Config:
        json_schema_extra = {
            "example": {
                "age": 28,
                "systolicBP": 130,
                "diastolicBP": 85,
                "bloodSugar": 7.5,
                "bodyTemp": 36.8,
                "heartRate": 82,
            }
        }


class MaternalRiskResponse(BaseModel):
    risk_level: str = Field(..., description="Predicted risk level: low risk | mid risk | high risk")
    probabilities: dict[str, float] = Field(..., description="Per-class probabilities")
    confidence: float = Field(..., description="Confidence score for predicted class (0–1)")
    disclaimer: str
    model_version: str = "random_forest_v1"


# ── Fetal Risk (CTG) ─────────────────────────────────────────────────────────

class FetalCTGRequest(BaseModel):
    abnormalShortTermVariability: float = Field(..., ge=0, le=100, example=55)
    percentageOfTimeWithAbnormalLongTermVariability: float = Field(..., ge=0, le=100, example=20)
    accelerations: float = Field(..., ge=0, example=0.005)
    decelerationsLate: float = Field(..., ge=0, example=0.000)
    uterineContractions: float = Field(..., ge=0, example=0.004)


class FetalRiskResponse(BaseModel):
    status: str = Field(..., description="Normal | Suspect | Pathological")
    confidence: float
    disclaimer: str


# ── Health Check ─────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    maternal_model_loaded: bool
    version: str = "1.0.0"
