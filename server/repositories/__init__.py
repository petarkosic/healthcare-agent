from repositories.clinical_notes_repository import clinical_note_repository
from repositories.dashboard_repository import dashboard_repository
from repositories.diagnosis_repository import diagnosis_repository
from repositories.lab_result_repository import lab_result_repository
from repositories.medication_repository import medication_repository
from repositories.patient_repository import patient_repository
from repositories.vital_signs_repository import vital_signs_repository
from repositories.visit_repository import visit_repository

__all__ = [
    "clinical_note_repository",
    "dashboard_repository",
    "diagnosis_repository",
    "lab_result_repository",
    "medication_repository",
    "patient_repository",
    "vital_signs_repository",
    "visit_repository",
]
