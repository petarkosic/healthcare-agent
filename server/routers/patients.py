import os
from fastapi import APIRouter
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
    conn = psycopg.connect(**DB_CONFIG)

    cur = conn.cursor()

    cur.execute("SELECT * FROM patients")

    patients = cur.fetchall()

    conn.close()
    
    return {"patients": patients}



@router.get("/{patient_serial_number}")
async def get_patient(patient_serial_number: str):
    conn = psycopg.connect(**DB_CONFIG)

    cur = conn.cursor()

    cur.execute("SELECT * FROM patients WHERE patient_serial_number = %s", (patient_serial_number,))

    patient = cur.fetchone()

    conn.close()
    
    return {"patient": patient}

