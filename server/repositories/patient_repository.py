from typing import List, Optional
from .base_repository import BaseRepository
from models.patients import PatientBase, PatientFullResponse, VisitResponse, VitalSignsResponse, MedicationResponse, LabResultResponse, ClinicalNoteResponse, DiagnosisResponse

class PatientRepository(BaseRepository[PatientBase]):
    def __init__(self):
        super().__init__("patients")
    
    def get_patient_full(self, patient_serial_number: str) -> Optional[PatientFullResponse]:
        """Get complete patient data with all related entities"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM patients WHERE patient_serial_number = %s",
                    (patient_serial_number,)
                )
                patient_row = cur.fetchone()
                if not patient_row:
                    return None
                
                patient_columns = [desc[0] for desc in cur.description]
                patient = dict(zip(patient_columns, patient_row))
                
                visits = self._get_patient_visits(cur, patient_serial_number)
                
                vital_signs = self._get_patient_vital_signs(cur, patient_serial_number)
                
                medications = self._get_patient_medications(cur, patient_serial_number)
                
                lab_results = self._get_patient_lab_results(cur, patient_serial_number)
                
                clinical_notes = self._get_patient_clinical_notes(cur, patient_serial_number)
                
                diagnoses = self._get_patient_diagnoses(cur, patient_serial_number)
                
                return PatientFullResponse(
                    patient=PatientBase(**patient),
                    visits=[VisitResponse(**v) for v in visits],
                    vital_signs=[VitalSignsResponse(**v) for v in vital_signs],
                    medications=[MedicationResponse(**m) for m in medications],
                    lab_results=[LabResultResponse(**l) for l in lab_results],
                    clinical_notes=[ClinicalNoteResponse(**n) for n in clinical_notes],
                    diagnoses=[DiagnosisResponse(**d) for d in diagnoses],
                )
    
    def _get_patient_visits(self, cursor, patient_serial_number: str) -> List[VisitResponse]:
        cursor.execute("""
            SELECT 
                v.*,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialty
            FROM visits v
            JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
            WHERE v.patient_serial_number = %s
            ORDER BY v.visit_date DESC
        """, (patient_serial_number,))
        
        visit_columns = [desc[0] for desc in cursor.description]

        return [dict(zip(visit_columns, row)) for row in cursor.fetchall()]
    
    def _get_patient_vital_signs(self, cursor, patient_serial_number: str) -> List[VitalSignsResponse]:
        cursor.execute("""
            SELECT 
                vs.*,
                v.visit_date
            FROM vital_signs vs
            JOIN visits v ON vs.visit_id = v.visit_id
            WHERE v.patient_serial_number = %s
            ORDER BY vs.measurement_time DESC
        """, (patient_serial_number,))
        
        vital_columns = [desc[0] for desc in cursor.description]
        
        return [dict(zip(vital_columns, row)) for row in cursor.fetchall()]
    
    def _get_patient_medications(self, cursor, patient_serial_number: str) -> List[MedicationResponse]:
        cursor.execute("""
            SELECT 
                m.*,
                d.first_name AS prescriber_first_name,
                d.last_name AS prescriber_last_name
            FROM medications m
            LEFT JOIN doctors d ON m.doctor_serial_number = d.doctor_serial_number
            WHERE m.patient_serial_number = %s
            ORDER BY m.start_date DESC, m.status
        """, (patient_serial_number,))
        
        med_columns = [desc[0] for desc in cursor.description]

        return [dict(zip(med_columns, row)) for row in cursor.fetchall()]
    
    def _get_patient_lab_results(self, cursor, patient_serial_number: str) -> List[LabResultResponse]:
        cursor.execute("""
            SELECT 
                l.*,
                d.first_name AS ordering_doctor_first_name,
                d.last_name AS ordering_doctor_last_name
            FROM lab_results l
            LEFT JOIN doctors d ON l.ordering_doctors_serial_number = d.doctor_serial_number
            WHERE l.patient_serial_number = %s
            ORDER BY l.tested_date DESC
        """, (patient_serial_number,))
        
        lab_columns = [desc[0] for desc in cursor.description]

        return [dict(zip(lab_columns, row)) for row in cursor.fetchall()]
    
    def _get_patient_clinical_notes(self, cursor, patient_serial_number: str) -> List[ClinicalNoteResponse]:
        cursor.execute("""
            SELECT 
                cn.*,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                v.visit_date
            FROM clinical_notes cn
            JOIN doctors d ON cn.doctor_serial_number = d.doctor_serial_number
            JOIN visits v ON cn.visit_id = v.visit_id
            WHERE v.patient_serial_number = %s
            ORDER BY cn.created_at DESC
        """, (patient_serial_number,))
        
        note_columns = [desc[0] for desc in cursor.description]

        return [dict(zip(note_columns, row)) for row in cursor.fetchall()]
    
    def _get_patient_diagnoses(self, cursor, patient_serial_number: str) -> List[DiagnosisResponse]:
        cursor.execute("""
            SELECT 
                diag.*,
                d.first_name AS diagnosing_doctor_first_name,
                d.last_name AS diagnosing_doctor_last_name
            FROM diagnoses diag
            LEFT JOIN doctors d ON diag.diagnosing_doctors_serial_number = d.doctor_serial_number
            WHERE diag.patient_serial_number = %s
            ORDER BY diag.diagnosed_date DESC, diag.status
        """, (patient_serial_number,))
        
        diag_columns = [desc[0] for desc in cursor.description]

        return [dict(zip(diag_columns, row)) for row in cursor.fetchall()]

patient_repository = PatientRepository()