import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from db.database import db_manager
from models.auth import AuthResponse, LoginRequest, MeResponse, SignUpRequest
from utils.auth import create_token, get_current_doctor, hash_password, verify_password
from utils.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

SECURE_COOKIES = os.getenv("SECURE_COOKIES", "false").lower() == "true"
_COOKIE_MAX_AGE = 60 * 60 * 24  # 24 hours


def _set_auth_cookie(response: JSONResponse, token: str) -> None:
    response.set_cookie(
        key="ha_token",
        value=token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(req: SignUpRequest):
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT doctor_id FROM doctors WHERE email = %s", (req.email,)
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Email already registered")

            cur.execute(
                "SELECT doctor_id FROM doctors WHERE license_number = %s",
                (req.license_number,),
            )
            if cur.fetchone():
                raise HTTPException(
                    status_code=409, detail="License number already registered"
                )

            cur.execute(
                """
                INSERT INTO doctors
                    (first_name, last_name, email, specialty, license_number, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING doctor_serial_number
                """,
                (
                    req.first_name,
                    req.last_name,
                    req.email,
                    req.specialty,
                    req.license_number,
                    hash_password(req.password),
                ),
            )
            serial = cur.fetchone()[0]
            conn.commit()

    doctor_name = f"{req.first_name} {req.last_name}"
    token = create_token(serial, doctor_name)

    response = JSONResponse(
        status_code=201,
        content={"doctor_serial_number": serial, "doctor_name": doctor_name},
    )

    _set_auth_cookie(response, token)

    return response


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, req: LoginRequest):
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT doctor_serial_number, first_name, last_name, password_hash
                FROM doctors
                WHERE doctor_serial_number = %s
                """,
                (req.serial_number,),
            )
            row = cur.fetchone()

    if row is None or not verify_password(req.password, row[3]):
        logger.warning("Failed login attempt for serial: %s", req.serial_number)
        raise HTTPException(status_code=401, detail="Invalid serial number or password")

    doctor_name = f"{row[1]} {row[2]}"
    token = create_token(row[0], doctor_name)

    response = JSONResponse(
        content={"doctor_serial_number": row[0], "doctor_name": doctor_name},
    )

    _set_auth_cookie(response, token)
    
    return response


@router.get("/me", response_model=MeResponse)
async def me(doctor: dict = Depends(get_current_doctor)):
    return {"doctor_serial_number": doctor["serial"], "doctor_name": doctor["name"]}


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="ha_token", path="/")

    return response
