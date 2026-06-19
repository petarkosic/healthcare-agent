import io
import logging
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from repositories.clinical_notes_repository import clinical_note_repository
from repositories.diagnosis_repository import diagnosis_repository
from repositories.lab_result_repository import lab_result_repository
from repositories.medication_repository import medication_repository
from repositories.patient_repository import patient_repository
from repositories.visit_repository import visit_repository
from repositories.vital_signs_repository import vital_signs_repository

logger = logging.getLogger(__name__)

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_TEMPLATES_DIR)), autoescape=True)


def _fmt_date(value) -> str:
    if value is None:
        return ""

    if isinstance(value, str):
        return value

    return value.strftime("%B %d, %Y")


def _fmt_datetime(value) -> str:
    if value is None:
        return ""

    if isinstance(value, str):
        return value

    return value.strftime("%B %d, %Y at %I:%M %p")


_jinja_env.filters["fmt_date"] = _fmt_date
_jinja_env.filters["fmt_datetime"] = _fmt_datetime


class ReportService:
    def build_report_data(self, patient_serial: str, visit_id: str) -> dict:
        visit = visit_repository.get_visit_by_id(visit_id)
        if not visit:
            raise ValueError(f"Visit {visit_id} not found")

        if visit["patient_serial_number"] != patient_serial:
            raise ValueError(f"Visit {visit_id} does not belong to patient {patient_serial}")

        patient = patient_repository.get_patient_full(patient_serial)
        if not patient:
            raise ValueError(f"Patient {patient_serial} not found")

        vitals = vital_signs_repository.get_vitals_by_visit(visit_id)
        notes = clinical_note_repository.get_notes_by_visit(visit_id)
        diagnoses = diagnosis_repository.get_diagnoses_by_visit(visit_id)
        labs = lab_result_repository.get_labs_by_visit(visit_id)
        medications = medication_repository.get_patient_medications(
            patient_serial, status="active"
        )
        next_visit = visit_repository.get_next_scheduled_visit(patient_serial)

        return {
            "visit": visit,
            "patient": patient.patient,
            "vitals": vitals,
            "notes": notes,
            "diagnoses": diagnoses,
            "labs": labs,
            "medications": medications,
            "next_visit": next_visit,
            "generated_at": datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC"),
        }

    def render_pdf(self, report_data: dict) -> bytes:
        template = _jinja_env.get_template("visit_report.html")
        html_str = template.render(**report_data)
        pdf_bytes = HTML(string=html_str).write_pdf()
        
        return pdf_bytes


report_service = ReportService()
