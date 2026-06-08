import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from dotenv import load_dotenv
from langfuse import observe

from rag.rag_service import RAGService
from models.notes import Note
from models.patients import (
    AddDiagnosis,
    AddLabResult,
    AddVitalSigns,
    PatientFullResponse,
    SetVisit,
    UpdateVisit,
    CreatePatient,
    AddMedication,
    UpdateMedication,
    UpdateAllergies,
)
from utils.auth import get_current_doctor
from utils.authz import verify_patient_access
from utils.openai_client import openai_client
from services.patient_service import patient_service

logger = logging.getLogger(__name__)

load_dotenv()

rag = RAGService()

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)



@router.get("")
async def get_patients(doctor: dict = Depends(get_current_doctor)):
    try:
        patients = patient_service.get_patients(doctor_serial_number=doctor["serial"])

        return patients
    except Exception:
        logger.exception("Error fetching patients for doctor %s", doctor["serial"])
        raise HTTPException(status_code=500, detail="Error fetching patients")


@router.post("")
async def create_patient(
    patient: CreatePatient, doctor: dict = Depends(get_current_doctor)
):
    try:
        patient.doctor_serial_number = doctor["serial"]
        result = patient_service.create_patient(patient)

        return result
    except Exception:
        logger.exception("Error creating patient")
        raise HTTPException(status_code=500, detail="Error creating patient")


@router.get("/search")
async def search_patient(
    patient_serial_number: str = Query(...),
    doctor: dict = Depends(get_current_doctor),
):
    try:
        results = patient_service.search_patient_by_serial(
            patient_serial_number=patient_serial_number,
            doctor_serial_number=doctor["serial"],
        )

        return results
    except Exception:
        logger.exception("Error searching patient")
        raise HTTPException(status_code=500, detail="Error searching for patient")


@router.get("/{patient_serial}", response_model=PatientFullResponse)
async def get_patient(
    patient_serial: str,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        patient_data = patient_service.get_patient_full(patient_serial)

        if not patient_data:
            raise HTTPException(status_code=404, detail="Patient not found")

        return patient_data
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error fetching patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error fetching patient data")


@router.post("/{patient_serial}/notes")
@observe()
async def set_note(
    patient_serial: str,
    note: Note,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    if not note.visit_id or not note.note_type or not note.note_text:
        raise HTTPException(
            status_code=400,
            detail="Visit ID, note type, and note text are required",
        )

    note.doctor_serial_number = doctor["serial"]

    prompt = f"""
    Generate a concise medical summary of this clinical note:

    {note.note_text}

    Keep it brief and professional, focusing on key findings and recommendations.
    """

    try:
        rag.upsert_patient_note(
            patient_serial=str(patient_serial), note_summary=note.note_text
        )

        resp = openai_client.chat.completions.create(
            model="gemini-3.1-flash-lite",
            messages=[{"role": "user", "content": prompt}],
        )

        summary = resp.choices[0].message.content.strip()

    except Exception:
        logger.exception("Error generating note summary for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error generating summary")

    try:
        result = patient_service.add_clinical_note(
            visit_id=str(note.visit_id),
            doctor_serial_number=doctor["serial"],
            note_type=note.note_type,
            note_text=note.note_text,
            summary=summary,
        )

        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error adding note for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error adding note")


@router.post("/{patient_serial}/medications")
async def add_medication(
    patient_serial: str,
    medication: AddMedication,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        medication_data = medication.model_dump(exclude={"doctor_serial_number"})
        result = patient_service.add_medication(
            patient_serial_number=patient_serial,
            doctor_serial_number=doctor["serial"],
            medication_data=medication_data,
        )

        return result
    except Exception:
        logger.exception("Error adding medication for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error adding medication")


@router.put("/{patient_serial}/medications/{medication_id}")
async def update_medication(
    patient_serial: str,
    medication_id: str,
    payload: UpdateMedication,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        fields = {k: v for k, v in payload.model_dump().items() if v is not None}
        result = patient_service.update_medication(medication_id, patient_serial, fields)
        
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error updating medication %s", medication_id)
        raise HTTPException(status_code=500, detail="Error updating medication")


@router.delete("/{patient_serial}/medications/{medication_id}")
async def delete_medication(
    patient_serial: str,
    medication_id: str,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        result = patient_service.delete_medication(medication_id, patient_serial)
        
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error deleting medication %s", medication_id)
        raise HTTPException(status_code=500, detail="Error deleting medication")


@router.post("/{patient_serial}/vitals")
async def add_vitals(
    patient_serial: str,
    vitals: AddVitalSigns,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        vitals_data = vitals.model_dump(exclude={"visit_id"}, exclude_none=True)
        result = patient_service.add_vital_signs(
            visit_id=vitals.visit_id,
            vital_signs_data=vitals_data,
        )

        return result
    except Exception:
        logger.exception("Error adding vitals for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error adding vitals")


@router.post("/{patient_serial}/labs")
async def add_lab(
    patient_serial: str,
    lab: AddLabResult,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        lab_data = lab.model_dump(
            exclude={"visit_id", "ordering_doctors_serial_number"}
        )
        result = patient_service.add_lab_result(
            patient_serial_number=patient_serial,
            visit_id=lab.visit_id,
            lab_data={
                **lab_data,
                "ordering_doctors_serial_number": doctor["serial"],
            },
        )
        
        return result
    except Exception:
        logger.exception("Error adding lab result for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error adding lab result")


@router.post("/{patient_serial}/diagnoses")
async def add_diagnosis(
    patient_serial: str,
    diagnosis: AddDiagnosis,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        diagnosis_data = diagnosis.model_dump(
            exclude={"visit_id", "diagnosing_doctors_serial_number"}
        )
        result = patient_service.add_diagnosis(
            patient_serial_number=patient_serial,
            visit_id=diagnosis.visit_id,
            diagnosis_data={
                **diagnosis_data,
                "diagnosing_doctors_serial_number": doctor["serial"],
            },
        )

        return result
    except Exception:
        logger.exception("Error adding diagnosis for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error adding diagnosis")


@router.put("/{patient_serial}/allergies")
async def update_allergies(
    patient_serial: str,
    body: UpdateAllergies,
    doctor: dict = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    try:
        result = patient_service.update_allergies(
            patient_serial_number=patient_serial,
            allergies=body.allergies,
        )

        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error updating allergies for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error updating allergies")


@router.post("/visits")
async def set_visit(visit: SetVisit, doctor: dict = Depends(get_current_doctor)):
    try:
        visit.doctor_serial_number = doctor["serial"]
        result = patient_service.create_visit(visit)

        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error creating visit")
        raise HTTPException(status_code=500, detail="Error adding visit")


@router.put("/visits")
async def update_visit(visit: UpdateVisit, doctor: dict = Depends(get_current_doctor)):
    try:
        result = patient_service.update_visit(visit)
        
        return result
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error updating visit")
        raise HTTPException(status_code=500, detail="Error updating visit")
