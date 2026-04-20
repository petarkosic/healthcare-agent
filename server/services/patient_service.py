from typing import List, Dict, Any, Optional
from repositories.patient_repository import patient_repository
from repositories.visit_repository import visit_repository
from repositories.vital_signs_repository import vital_signs_repository
from repositories.medication_repository import medication_repository
from repositories.lab_result_repository import lab_result_repository
from repositories.clinical_notes_repository import clinical_note_repository
from repositories.diagnosis_repository import diagnosis_repository
from models.patients import PatientFullResponse, SetVisit, UpdateVisit
from langfuse import observe

class PatientService:
    @observe()
    def get_patient_full(self, patient_serial_number: str) -> Optional[PatientFullResponse]:
        """Get complete patient data"""
        return patient_repository.get_patient_full(patient_serial_number)
    
    @observe()
    def get_patients(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get list of patients"""
        with patient_repository.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM patient_summary LIMIT %s OFFSET %s", (limit, offset))

                columns = [desc[0] for desc in cur.description]

                return [dict(zip(columns, row)) for row in cur.fetchall()]
    
    @observe()
    def create_visit(self, visit_data: SetVisit) -> Dict[str, Any]:
        """Create a new visit"""
        visit_id = visit_repository.create_visit(
            patient_serial_number=visit_data.patient_serial_number,
            doctor_serial_number=visit_data.doctor_serial_number,
            visit_type=visit_data.visit_type,
            location=visit_data.location,
            chief_complaint=""  # Will be updated separately if needed
        )
        
        if visit_id:
            return {
                "message": "Visit added successfully",
                "visit_id": visit_id
            }
        else:
            raise Exception("Failed to create visit")
    
    @observe()
    def update_visit(self, visit_data: UpdateVisit) -> Dict[str, Any]:
        """Update an existing visit"""
        success = visit_repository.update_visit(
            visit_id=visit_data.visit_id,
            chief_complaint=visit_data.chief_complaint,
            status=visit_data.status,
            duration_minutes=visit_data.duration_minutes
        )
        
        if success:
            return {
                "message": "Visit updated successfully"
            }
        else:
            raise Exception("Failed to update visit")
    
    @observe()
    def add_vital_signs(self, visit_id: str, vital_signs_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add vital signs for a visit"""
        vital_id = vital_signs_repository.create_vital_signs(visit_id=visit_id, **vital_signs_data)
        
        if vital_id:
            return {
                "message": "Vital signs added successfully",
                "vital_id": vital_id
            }
        else:
            raise Exception("Failed to add vital signs")
    
    @observe()
    def add_medication(self, patient_serial_number: str, doctor_serial_number: str,
                      medication_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new medication"""
        medication_id = medication_repository.create_medication(
            patient_serial_number=patient_serial_number,
            doctor_serial_number=doctor_serial_number,
            **medication_data
        )
        
        if medication_id:
            return {
                "message": "Medication added successfully",
                "medication_id": medication_id
            }
        else:
            raise Exception("Failed to add medication")
    
    @observe()
    def add_lab_result(self, patient_serial_number: str, visit_id: str,
                      lab_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new lab result"""
        lab_id = lab_result_repository.create_lab_result(
            patient_serial_number=patient_serial_number,
            visit_id=visit_id,
            **lab_data
        )
        
        if lab_id:
            return {
                "message": "Lab result added successfully",
                "lab_id": lab_id
            }
        else:
            raise Exception("Failed to add lab result")
    
    @observe()
    def add_clinical_note(self, visit_id: str, doctor_serial_number: str,
                         note_type: str, note_text: str, summary: str) -> Dict[str, Any]:
        """Add a new clinical note"""
        note_id = clinical_note_repository.create_clinical_note(
            visit_id=visit_id,
            doctor_serial_number=doctor_serial_number,
            note_type=note_type,
            note_text=note_text,
            summary=summary
        )
        
        if note_id:
            return {
                "message": "Clinical note added successfully",
                "note_id": note_id,
                "summary": summary
            }
        else:
            raise Exception("Failed to add clinical note")
    
    @observe()
    def add_diagnosis(self, patient_serial_number: str, visit_id: str,
                     diagnosis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new diagnosis"""
        diagnosis_id = diagnosis_repository.create_diagnosis(
            patient_serial_number=patient_serial_number,
            visit_id=visit_id,
            **diagnosis_data
        )
        
        if diagnosis_id:
            return {
                "message": "Diagnosis added successfully",
                "diagnosis_id": diagnosis_id
            }
        else:
            raise Exception("Failed to add diagnosis")

patient_service = PatientService()