from fastapi import Depends, HTTPException
from db.database import db_manager
from utils.auth import CurrentDoctor, get_current_doctor

def verify_patient_access(
    patient_serial: str, doctor: CurrentDoctor = Depends(get_current_doctor)
) -> None:
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM visits WHERE patient_serial_number = %s AND doctor_serial_number = %s LIMIT 1",
                (patient_serial, doctor.serial),
            )
            
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Access denied")


def verify_visit_ownership(
    visit_id: str, patient_serial: str, doctor_serial: str
) -> None:
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM visits WHERE visit_id = %s AND patient_serial_number = %s AND doctor_serial_number = %s LIMIT 1",
                (visit_id, patient_serial, doctor_serial),
            )

            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Access denied")
