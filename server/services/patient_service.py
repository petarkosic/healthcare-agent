from typing import List, Dict, Any, Optional
from repositories.patient_repository import patient_repository
from repositories.visit_repository import visit_repository
from repositories.vital_signs_repository import vital_signs_repository
from repositories.medication_repository import medication_repository
from repositories.lab_result_repository import lab_result_repository
from repositories.clinical_notes_repository import clinical_note_repository
from repositories.diagnosis_repository import diagnosis_repository
from models.patients import PatientFullResponse, SetVisit, UpdateVisit, CreatePatient
from langfuse import observe

class PatientService:
    @observe()
    def get_patient_full(self, patient_serial_number: str) -> Optional[PatientFullResponse]:
        """Get complete patient data"""
        return patient_repository.get_patient_full(patient_serial_number)
    
    @observe()
    def get_patients(self, doctor_serial_number: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get a list of patients for a particular doctor"""
        return patient_repository.get_patients(doctor_serial_number, limit, offset)
    
    @observe()
    def search_patient_by_serial(
        self,
        patient_serial_number: str,
        doctor_serial_number: str,
    ) -> List[Dict[str, Any]]:
        """Search for a patient by serial number"""
        return patient_repository.search_by_serial(patient_serial_number, doctor_serial_number)

    @observe()
    def create_patient(self, patient_data: CreatePatient) -> Dict[str, Any]:
        """Add new patient"""
        serial = patient_repository.create_patient(patient_data)
        if not serial:
            raise Exception("Failed to create patient")

        visit_id = visit_repository.create_visit(
            patient_serial_number=serial,
            doctor_serial_number=patient_data.doctor_serial_number,
            visit_type="checkup",
            location="Clinic",
            status="in-progress",
        )

        return {
            "message": "Patient created successfully",
            "patient_serial_number": serial,
            "visit_id": visit_id,
        }

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
    
    def update_medication(self, medication_id: str, patient_serial_number: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Update medication"""
        updated = medication_repository.update_medication(medication_id, patient_serial_number, fields)

        if not updated:
            raise Exception("Medication not found or not updated")

        return {"message": "Medication updated successfully"}

    def delete_medication(self, medication_id: str, patient_serial_number: str) -> Dict[str, Any]:
        """Delete medication"""
        deleted = medication_repository.delete_medication(medication_id, patient_serial_number)

        if not deleted:
            raise Exception("Medication not found")

        return {"message": "Medication deleted successfully"}

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
            
    @observe()
    def update_allergies(self, patient_serial_number: str, allergies: list[str]) -> Dict[str, Any]:
        success = patient_repository.update_allergies(patient_serial_number, allergies)

        if not success:
            raise Exception("Patient not found or update failed")

        return {"message": "Allergies updated successfully"}

patient_service = PatientService()