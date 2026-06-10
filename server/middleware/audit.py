import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from db.database import db_manager
from utils.auth import decode_token

logger = logging.getLogger(__name__)

_log_queue: asyncio.Queue = asyncio.Queue(maxsize=10_000)
_RETENTION_INTERVAL_SECONDS = 24 * 60 * 60  # daily


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


def _sync_batch_insert(batch: list[tuple]) -> None:
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """INSERT INTO audit_logs
                   (doctor_id, doctor_name, method, path, status_code, ip_address, duration_ms)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                batch,
            )


async def audit_worker() -> None:
    while True:
        entry = await _log_queue.get()
        batch = [entry]

        try:
            while len(batch) < 100:
                batch.append(_log_queue.get_nowait())
        except asyncio.QueueEmpty:
            pass

        try:
            loop = asyncio.get_running_loop()

            await loop.run_in_executor(None, _sync_batch_insert, batch)
        except Exception:
            logger.exception("Audit log batch insert failed — %d entries dropped", len(batch))
        finally:
            for _ in batch:
                _log_queue.task_done()


def _purge_old_audit_logs() -> int:
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '6 years'"
            )

            return cur.rowcount


async def _retention_worker() -> None:
    while True:
        await asyncio.sleep(_RETENTION_INTERVAL_SECONDS)

        try:
            loop = asyncio.get_running_loop()
            deleted = await loop.run_in_executor(None, _purge_old_audit_logs)

            if deleted:
                logger.info("Audit retention: purged %d records older than 6 years", deleted)
        except Exception:
            logger.exception("Audit log retention job failed")


@asynccontextmanager
async def audit_lifespan(app: FastAPI):
    worker_task = asyncio.create_task(audit_worker())
    retention_task = asyncio.create_task(_retention_worker())
    
    try:
        yield
    finally:
        worker_task.cancel()
        retention_task.cancel()


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = int((time.monotonic() - start) * 1000)

        doctor_id, doctor_name = extract_doctor_from_request(request)
        entry = (
            doctor_id,
            doctor_name,
            request.method,
            request.url.path,
            response.status_code,
            request.client.host if request.client else None,
            duration_ms,
        )

        try:
            _log_queue.put_nowait(entry)
        except asyncio.QueueFull:
            logger.warning("Audit log queue full — entry dropped")

        return response
