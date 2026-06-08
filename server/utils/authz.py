from fastapi import Depends, HTTPException
from db.database import db_manager
from utils.auth import get_current_doctor

def verify_patient_access(
    patient_serial: str, doctor: dict = Depends(get_current_doctor)
) -> None:
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM visits WHERE patient_serial_number = %s AND doctor_serial_number = %s LIMIT 1",
                (patient_serial, doctor["serial"]),
            )
            
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Access denied")
