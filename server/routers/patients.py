from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from langfuse import observe

from rag.rag_service import RAGService
from models.notes import Note
from models.patients import PatientFullResponse, SetVisit, UpdateVisit
from utils.openai_client import openai_client
from services.patient_service import patient_service


load_dotenv()

rag = RAGService()

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)

@router.get("/")
async def get_patients():
    try:
        patients = patient_service.get_patients()

        return patients
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching patients: {str(e)}"
        )



@router.get("/{patient_serial_number}", response_model=PatientFullResponse)
async def get_patient(patient_serial_number: str):
    try:
        patient_data = patient_service.get_patient_full(patient_serial_number)
        
        if not patient_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Patient with serial number {patient_serial_number} not found"
            )
        
        return patient_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching patient data: {str(e)}"
        )

@router.post("/{patient_serial}/notes", )
@observe()
async def set_note(patient_serial: str, note: Note):
    if not note.visit_id or not note.note_type or not note.note_text or not note.doctor_serial_number:
        raise HTTPException(
            status_code=400, 
            detail="Visit ID, Note type, note text, and doctor serial number are required"
        )

    prompt = f"""
    Generate a concise medical summary of this clinical note: 
    
    {note.note_text}
    
    Keep it brief and professional, focusing on key findings and recommendations.
    """

    try:
        rag.upsert_patient_note(
            patient_serial=str(patient_serial),
            note_summary=note.note_text
        )

        resp = openai_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        summary = resp.choices[0].message.content.strip()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )

    try:
        # Use the patient service to add the clinical note
        result = patient_service.add_clinical_note(
            visit_id=str(note.visit_id),
            doctor_serial_number=note.doctor_serial_number,
            note_type=note.note_type,
            note_text=note.note_text,
            summary=summary
        )
        
        return result
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error adding note: {str(e)}"
        )
    

@router.post('/visits')
async def set_visit(visit: SetVisit):
    try:
        # Use the patient service to create the visit
        result = patient_service.create_visit(visit)
        
        return result
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error adding visit: {str(e)}"
        )
    
@router.put('/visits')
async def update_visit(visit: UpdateVisit):
    try:
        # Use the patient service to update the visit
        result = patient_service.update_visit(visit)
        
        return result
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating visit: {str(e)}"
        )
    