from typing import Dict, Any, Optional
from repositories.patient_repository import patient_repository
from repositories.visit_repository import visit_repository
from repositories.vital_signs_repository import vital_signs_repository
from repositories.lab_result_repository import lab_result_repository
from repositories.medication_repository import medication_repository
from repositories.diagnosis_repository import diagnosis_repository
from langfuse import observe

class AgentService:
    @observe()
    def get_patient_overview_data(self, patient_serial: str) -> Optional[Dict[str, Any]]:
        """
        Get patient overview data for AI processing.
        This replaces the complex postgres_query with a service method that uses repositories.
        """

        patient = patient_repository.get_patient(patient_serial)

        if not patient:
            return None

        overview_data = {
            'patient_serial': patient.patient_serial_number,
            'full_name': f"{patient.first_name} {patient.last_name}".strip(),
            'age': self._calculate_age(patient.date_of_birth),
            'gender': patient.gender,
            'blood_type': patient.blood_type,
            'allergies': patient.allergies,
            'chronic_conditions': patient.chronic_conditions
        }

        latest_visit = visit_repository.get_latest_visit(patient_serial)
        if latest_visit:
            overview_data['latest_visit'] = {
                'visit_id': str(latest_visit['visit_id']),
                'date': latest_visit['visit_date'].isoformat() if latest_visit['visit_date'] else None,
                'type': latest_visit['visit_type'],
                'chief_complaint': latest_visit['chief_complaint'],
                'doctor': f"{latest_visit['doctor_first_name']} {latest_visit['doctor_last_name']}".strip(),
                'specialty': latest_visit['specialty'],
                'status': latest_visit['status']
            }
        else:
            overview_data['latest_visit'] = None

        latest_vital = vital_signs_repository.get_latest_vital(patient_serial)
        if latest_vital:
            overview_data['latest_vitals'] = {
                'measured_at': latest_vital['measurement_time'].isoformat() if latest_vital['measurement_time'] else None,
                'blood_pressure': f"{latest_vital['blood_pressure_systolic']}/{latest_vital['blood_pressure_diastolic']}" if latest_vital['blood_pressure_systolic'] and latest_vital['blood_pressure_diastolic'] else None,
                'heart_rate': latest_vital['heart_rate'],
                'temperature': latest_vital['temperature'],
                'oxygen_saturation': latest_vital['oxygen_saturation'],
                'bmi': latest_vital['bmi'],
                'pain_level': latest_vital['pain_level']
            }
        else:
            overview_data['latest_vitals'] = None

        latest_lab = lab_result_repository.get_latest_lab(patient_serial)
        if latest_lab:
            overview_data['latest_lab'] = {
                'test_name': latest_lab['test_name'],
                'result': latest_lab['result_value'],
                'unit': latest_lab['unit'],
                'reference_range': latest_lab['reference_range'],
                'status': latest_lab['result_status'],
                'date': latest_lab['tested_date'].isoformat() if latest_lab['tested_date'] else None
            }
        else:
            overview_data['latest_lab'] = None

        medications = medication_repository.get_patient_medications(patient_serial, status="active")
        active_medications = [
            {
                'name': med['medication_name'],
                'dosage': med['dosage'],
                'frequency': med['frequency'],
                'reason': med['prescribed_for'] or ''
            }
            for med in medications
            if not med['end_date'] or med['end_date'] >= self._get_current_date()
        ]
        overview_data['active_medications'] = active_medications

        diagnoses = diagnosis_repository.get_patient_diagnoses(patient_serial, statuses=['active', 'chronic'])
        active_diagnoses = [
            {
                'name': diag['diagnosis_name'],
                'code': diag['diagnosis_code'],
                'type': diag['diagnosis_type'],
                'status': diag['status']
            }
            for diag in diagnoses
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