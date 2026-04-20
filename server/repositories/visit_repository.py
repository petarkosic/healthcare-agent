from typing import List, Optional

from .base_repository import BaseRepository
from models.patients import VisitResponse


class VisitRepository(BaseRepository[VisitResponse]):
    def __init__(self):
        super().__init__("visits")
    
    def create_visit(self, patient_serial_number: str, doctor_serial_number: str, 
                     visit_type: str, location: str, visit_date: str = None, 
                     status: str = 'in-progress', chief_complaint: str = "", 
                     duration_minutes: int = 30) -> Optional[str]:
        """Create a new visit and return the visit ID"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                if visit_date:
                    cur.execute("""
                        INSERT INTO visits 
                        (visit_id, patient_serial_number, doctor_serial_number, visit_date, visit_type, status, location, chief_complaint, duration_minutes, created_at)
                        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, DATE_TRUNC('second', now()))
                        RETURNING visit_id
                    """, (
                        patient_serial_number,
                        doctor_serial_number,
                        visit_date,
                        visit_type,
                        status,
                        location,
                        chief_complaint,
                        duration_minutes
                    ))
                else:
                    cur.execute("""
                        INSERT INTO visits 
                        (visit_id, patient_serial_number, doctor_serial_number, visit_date, visit_type, status, location, chief_complaint, duration_minutes, created_at)
                        VALUES (gen_random_uuid(), %s, %s, DATE_TRUNC('second', now()), %s, %s, %s, %s, %s, DATE_TRUNC('second', now()))
                        RETURNING visit_id
                    """, (
                        patient_serial_number,
                        doctor_serial_number,
                        visit_type,
                        status,
                        location,
                        chief_complaint,
                        duration_minutes
                    ))
                
                visit_id = cur.fetchone()[0]

                conn.commit()

                return str(visit_id)
    
    def update_visit(self, visit_id: str, chief_complaint: str, status: str, duration_minutes: int) -> bool:
        """Update visit details"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE visits 
                    SET chief_complaint = %s, status = %s, duration_minutes = %s
                    WHERE visit_id = %s
                """, (
                    chief_complaint,
                    status,
                    duration_minutes,
                    visit_id
                ))
                
                affected_rows = cur.rowcount

                conn.commit()

                return affected_rows > 0
    
    def get_visits_by_patient(self, patient_serial_number: str, limit: int = 50) -> List[VisitResponse]:
        """Get visits for a patient"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        v.*,
                        d.first_name AS doctor_first_name,
                        d.last_name AS doctor_last_name,
                        d.specialty
                    FROM visits v
                    JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
                    WHERE v.patient_serial_number = %s
                    ORDER BY v.visit_date DESC
                    LIMIT %s
                """, (patient_serial_number, limit))
                
                visit_columns = [desc[0] for desc in cur.description]

                return [dict(zip(visit_columns, row)) for row in cur.fetchall()]
            
visit_repository = VisitRepository()