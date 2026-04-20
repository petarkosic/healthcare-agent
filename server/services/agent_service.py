from typing import Dict, Any, Optional
from repositories.patient_repository import patient_repository
from langfuse import observe

class AgentService:
    @observe()
    def get_patient_overview_data(self, patient_serial: str) -> Optional[Dict[str, Any]]:
        """
        Get patient overview data for AI processing.
        This replaces the complex postgres_query with a service method that uses repositories.
        """

        patient_data = patient_repository.get_patient_full(patient_serial)

        if not patient_data:
            return None
        
        patient = patient_data.patient or {}
        visits = patient_data.visits or []
        vital_signs = patient_data.vital_signs or []
        medications = patient_data.medications or []
        lab_results = patient_data.lab_results or []
        clinical_notes = patient_data.clinical_notes or []
        diagnoses = patient_data.diagnoses or []
        
        overview_data = {
            'patient_serial': patient.patient_serial_number,
            'full_name': f"{patient.first_name} {patient.last_name}".strip(),
            'age': self._calculate_age(patient.date_of_birth),
            'gender': patient.gender,
            'blood_type': patient.blood_type,
            'allergies': patient.allergies,
            'chronic_conditions': patient.chronic_conditions
        }
        
        latest_visit = visits[0] if visits else None
        if latest_visit:
            overview_data['latest_visit'] = {
                'visit_id': str(latest_visit.visit_id),
                'date': latest_visit.visit_date.isoformat() if latest_visit.visit_date else None,
                'type': latest_visit.visit_type,
                'chief_complaint': latest_visit.chief_complaint,
                'doctor': f"{latest_visit.doctor_first_name} {latest_visit.doctor_last_name}".strip(),
                'specialty': latest_visit.specialty,
                'status': latest_visit.status
            }
        else:
            overview_data['latest_visit'] = None
        
        latest_vital = vital_signs[0] if vital_signs else None
        if latest_vital:
            overview_data['latest_vitals'] = {
                'measured_at': latest_vital.measurement_time.isoformat() if latest_vital.measurement_time else None,
                'blood_pressure': f"{latest_vital.blood_pressure_systolic}/{latest_vital.blood_pressure_diastolic}" if latest_vital.blood_pressure_systolic and latest_vital.blood_pressure_diastolic else None,
                'heart_rate': latest_vital.heart_rate,
                'temperature': latest_vital.temperature,
                'oxygen_saturation': latest_vital.oxygen_saturation,
                'bmi': latest_vital.bmi,
                'pain_level': latest_vital.pain_level
            }
        else:
            overview_data['latest_vitals'] = None
        
        latest_lab = lab_results[0] if lab_results else None
        if latest_lab:
            overview_data['latest_lab'] = {
                'test_name': latest_lab.test_name,
                'result': latest_lab.result_value,
                'unit': latest_lab.unit,
                'reference_range': latest_lab.reference_range,
                'status': latest_lab.result_status,
                'date': latest_lab.tested_date.isoformat() if latest_lab.tested_date else None
            }
        else:
            overview_data['latest_lab'] = None
        
        active_medications = [
            {
                'name': med.medication_name,
                'dosage': med.dosage,
                'frequency': med.frequency,
                'reason': med.prescribed_for or ''
            }
            for med in medications
            if med.status == 'active' and 
               (not med.end_date or med.end_date >= self._get_current_date())
        ]
        overview_data['active_medications'] = active_medications
        
        active_diagnoses = [
            {
                'name': diag.diagnosis_name,
                'code': diag.diagnosis_code,
                'type': diag.diagnosis_type,
                'status': diag.status
            }
            for diag in diagnoses
            if diag.status in ['active', 'chronic']
        ]
        overview_data['active_diagnoses'] = active_diagnoses
        
        return overview_data
    
    def _calculate_age(self, date_of_birth) -> int:
        """Calculate age from date of birth"""
        if not date_of_birth:
            return 0

        from datetime import date

        if isinstance(date_of_birth, str):
            dob = date.fromisoformat(date_of_birth)
        else:
            dob = date_of_birth

        today = date.today()

        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    
    def _get_current_date(self):
        """Get current date for comparison"""
        from datetime import date

        return date.today()

agent_service = AgentService()