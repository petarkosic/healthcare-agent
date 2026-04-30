from fastapi import APIRouter, HTTPException

from db.database import db_manager
from models.auth import AuthResponse, LoginRequest, SignUpRequest
from utils.auth import create_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(req: SignUpRequest):
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT doctor_id FROM doctors WHERE email = %s",
                (req.email,),
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

    return AuthResponse(
        token=create_token(serial, doctor_name),
        doctor_serial_number=serial,
        doctor_name=doctor_name,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
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
        raise HTTPException(status_code=401, detail="Invalid serial number or password")

    doctor_name = f"{row[1]} {row[2]}"
    
    return AuthResponse(
        token=create_token(row[0], doctor_name),
        doctor_serial_number=row[0],
        doctor_name=doctor_name,
    )