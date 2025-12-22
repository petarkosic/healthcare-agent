import os
from fastapi import APIRouter, HTTPException
import psycopg
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
}

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)

@router.get("/")
async def get_patients():
    with psycopg.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT patient_serial_number, first_name, last_name FROM patients")

            columns = [desc[0] for desc in cur.description]
            
            patients = [dict(zip(columns, row)) for row in cur.fetchall()]
    
    return patients



@router.get("/{patient_serial_number}")
async def get_patient(patient_serial_number: str):
    with psycopg.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM patients WHERE patient_serial_number = %s", (patient_serial_number,))

            row = cur.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Patient not found")

            columns = [desc[0] for desc in cur.description]
            
            patient = dict(zip(columns, cur.fetchone()))
    
    return patient

