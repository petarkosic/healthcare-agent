import base64
import hashlib
import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from jose import JWTError, jwt
from google_auth_oauthlib.flow import Flow

from db.database import db_manager
from utils.auth import get_current_doctor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/google", tags=["google-auth"])

_SCOPES = ["https://www.googleapis.com/auth/calendar"]
_ALGORITHM = "HS256"


def _build_flow() -> tuple[Flow, str]:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    if not all([client_id, client_secret, redirect_uri]):
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": [redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }

    flow = Flow.from_client_config(client_config, scopes=_SCOPES)
    flow.redirect_uri = redirect_uri

    return flow, redirect_uri


@router.get("/authorize")
async def authorize(doctor: dict = Depends(get_current_doctor)):
    jwt_secret = os.getenv("JWT_SECRET_KEY")

    # Generate PKCE verifier + challenge
    code_verifier = secrets.token_urlsafe(32)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b"=").decode()

    state_payload = {
        "sub": doctor["serial"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        "cv": code_verifier,
    }
    state = jwt.encode(state_payload, jwt_secret, algorithm=_ALGORITHM)

    flow, _ = _build_flow()
    auth_url, _ = flow.authorization_url(
        state=state,
        access_type="offline",
        prompt="consent",
        code_challenge=code_challenge,
        code_challenge_method="S256",
    )

    return {"auth_url": auth_url}


@router.get("/callback")
async def callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
):
    if error or not code or not state:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        safe_url = json.dumps(frontend_url)
        
        return HTMLResponse(content=f"""<!DOCTYPE html>
<html><body>
<script>
  window.opener.postMessage('google_auth_failed', {safe_url});
  window.close();
</script>
</body></html>""")

    jwt_secret = os.getenv("JWT_SECRET_KEY")

    try:
        payload = jwt.decode(state, jwt_secret, algorithms=[_ALGORITHM])
        doctor_serial_number = payload["sub"]
        code_verifier = payload["cv"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid state")

    flow, _ = _build_flow()
    flow.fetch_token(code=code, code_verifier=code_verifier)

    credentials = flow.credentials
    access_token = credentials.token
    refresh_token = credentials.refresh_token
    expiry: datetime | None = credentials.expiry

    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token received from Google")

    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE doctors SET google_access_token=%s, google_refresh_token=%s, google_token_expiry=%s WHERE doctor_serial_number=%s""",
                (access_token, refresh_token, expiry, doctor_serial_number),
            )

            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Doctor not found")

            conn.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    safe_url = json.dumps(frontend_url)
    html_content = f"""<!DOCTYPE html>
<html><body>
<script>
  window.opener.postMessage('google_connected', {safe_url});
  window.close();
</script>
</body></html>"""

    return HTMLResponse(content=html_content)


@router.get("/status")
async def status(doctor: dict = Depends(get_current_doctor)):
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT google_access_token FROM doctors WHERE doctor_serial_number=%s""",
                (doctor["serial"],),
            )
            
            row = cur.fetchone()

    connected = row is not None and row[0] is not None
    return {"connected": connected}
