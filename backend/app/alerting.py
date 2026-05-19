"""
n8n alerting — fires a background HTTP POST to the configured n8n webhook
whenever the ML model classifies a patient as High Risk or Mid Risk.

Set N8N_WEBHOOK_URL and N8N_ENABLED=true in backend/.env to activate.
"""

import os
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def _load_dotenv() -> None:
    """Minimal .env loader — reads backend/.env into os.environ if it exists."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:   # don't override real env vars
                os.environ[key] = value


_load_dotenv()

_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "")
_ENABLED: bool    = os.getenv("N8N_ENABLED", "false").lower() == "true"


def fire_n8n_alert(
    risk_level: str,
    confidence: float,
    vitals: dict,
    patient_name: str = "Anonymous Patient",
) -> None:
    """
    Send a non-blocking alert to the n8n webhook.
    Silently swallows errors so a webhook failure never breaks the API response.
    """
    if not _ENABLED or not _WEBHOOK_URL:
        return                    # skip when not configured

    if risk_level not in ("High Risk", "Mid Risk"):
        return                    # only alert on elevated risk

    payload = {
        "risk_level":   risk_level,
        "confidence":   round(confidence * 100, 1),
        "patient_name": patient_name,
        "vitals":       vitals,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "source":       "maternal-risk-api",
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req  = urllib.request.Request(
            _WEBHOOK_URL,
            data    = data,
            method  = "POST",
            headers = {"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"[n8n] Alert fired → {resp.status} ({risk_level})")
    except Exception as exc:
        # Never crash the API because of a webhook failure
        print(f"[n8n] Alert failed (non-critical): {exc}")
