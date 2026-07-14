from typing import Literal

# Mirrors CheckConstraints in db/schema.py — keep both in sync.
VisitType = Literal[
    'checkup', 'followup', 'emergency', 'specialist', 'vaccination',
    'routine', 'urgent_care', 'surgical', 'telehealth',
]
VisitStatus = Literal['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']
VisitLocation = Literal['Clinic', 'Hospital', 'Telehealth', 'Home Visit', 'Urgent Care']
MedicationStatus = Literal['active', 'discontinued', 'completed', 'hold']
ResultStatus = Literal['normal', 'abnormal', 'critical', 'pending']
DiagnosisType = Literal['primary', 'secondary', 'chronic', 'acute']
DiagnosisStatus = Literal['active', 'resolved', 'chronic']
NoteType = Literal[
    'soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan',
    'progress_note', 'consult_note', 'discharge_summary', 'procedure_note',
]
Gender = Literal['Male', 'Female']
BloodType = Literal['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
