import hmac
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from middleware.audit import AuditLoggingMiddleware
from routers import agents, auth, patients, google_auth
from utils.langfuse_client import langfuse
from utils.limiter import limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    langfuse.flush()


origins = [
    "http://localhost:8080",
    "http://localhost:3000",
]

extra = os.getenv("ALLOWED_ORIGINS", "")
if extra:
    origins.extend(o.strip() for o in extra.split(",") if o.strip())

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        if os.getenv("SECURE_COOKIES", "false").lower() == "true":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response

_CSRF_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in _CSRF_METHODS and request.cookies.get("ha_token"):
            header_token = request.headers.get("x-csrf-token")
            cookie_token = request.cookies.get("csrf_token")

            if (
                not header_token
                or not cookie_token
                or not hmac.compare_digest(header_token, cookie_token)
            ):
                return JSONResponse(status_code=403, content={"detail": "CSRF token invalid"})
                
        return await call_next(request)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(AuditLoggingMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(patients.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(google_auth.router, prefix="/api")
