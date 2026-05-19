"""
================================================================================
  Auth Module — Supabase JWT Validation
================================================================================
  Provides a FastAPI dependency `get_current_user` that:
    1. Extracts the Bearer token from the Authorization header
    2. Verifies it against the Supabase JWT secret
    3. Returns the decoded payload (user id, role, email, etc.)

  Usage:
    from app.auth import get_current_user
    
    @app.get("/api/v1/protected")
    async def protected(user = Depends(get_current_user)):
        return {"user_id": user["sub"]}

  Environment variables required in .env:
    SUPABASE_JWT_SECRET   — found in Supabase Dashboard > Settings > API > JWT Secret
================================================================================
"""

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    from jose import jwt, JWTError
    JOSE_AVAILABLE = True
except ImportError:
    JOSE_AVAILABLE = False

_bearer = HTTPBearer(auto_error=True)

JWT_SECRET   = os.getenv("SUPABASE_JWT_SECRET", "")
JWT_ALGORITHM = "HS256"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    Validates a Supabase-issued JWT.

    Raises 401 if the token is missing, expired, or invalid.
    Raises 503 if python-jose is not installed.
    """
    if not JOSE_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "JWT validation requires python-jose. "
                "Run: pip install 'python-jose[cryptography]'"
            ),
        )

    if not JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_JWT_SECRET is not configured on the server.",
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},  # Supabase tokens use 'authenticated'
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_doctor(user: dict = Depends(get_current_user)) -> dict:
    """
    Extra guard: ensures the authenticated user has the 'doctor' role.
    Role is stored in Supabase user_metadata and reflected in the JWT.
    """
    role = (
        user.get("user_metadata", {}).get("role")
        or user.get("app_metadata", {}).get("role")
        or user.get("role")
    )
    if role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinical endpoints require the 'doctor' role.",
        )
    return user
