import asyncio
import logging
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from db.database import db_manager
from utils.auth import decode_token

logger = logging.getLogger(__name__)


def extract_doctor_from_request(request: Request) -> tuple[str | None, str | None]:
    """Extract doctor_id and doctor_name from JWT in cookie or Authorization header.

    Returns (None, None) on missing or invalid token — never raises.
    """
    try:
        token = request.cookies.get("ha_token")

        if not token:
            auth_header = request.headers.get("Authorization")

            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[len("Bearer "):]

        if not token:
            return (None, None)

        payload = decode_token(token)
        doctor_id: str | None = payload.get("sub")
        doctor_name: str | None = payload.get("name")
        
        return (doctor_id, doctor_name)
    except Exception:
        return (None, None)


def _sync_insert(
    doctor_id: str | None,
    doctor_name: str | None,
    method: str,
    path: str,
    status_code: int,
    ip: str | None,
    duration_ms: int,
) -> None:
    with db_manager.get_connection() as conn:
        conn.execute(
            """INSERT INTO audit_logs
               (doctor_id, doctor_name, method, path, status_code, ip_address, duration_ms)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (doctor_id, doctor_name, method, path, status_code, ip, duration_ms),
        )


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        doctor_id, doctor_name = extract_doctor_from_request(request)
        method = request.method
        path = request.url.path
        status_code = response.status_code
        ip = request.client.host if request.client else None

        async def fire_and_forget():
            try:
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(
                    None,
                    _sync_insert,
                    doctor_id,
                    doctor_name,
                    method,
                    path,
                    status_code,
                    ip,
                    duration_ms,
                )
            except Exception:
                logger.exception("Audit log insert failed — request was not affected")

        asyncio.create_task(fire_and_forget())

        return response
