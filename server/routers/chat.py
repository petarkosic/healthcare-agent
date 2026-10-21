import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from langfuse import observe, propagate_attributes

from models.agents import ChatRequest
from repositories import chat_repository
from services import chat_service
from utils import CurrentDoctor, get_current_doctor, limiter, verify_patient_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents/chat", tags=["chat"])

MAX_MESSAGES_PER_CONVERSATION = 40


@router.get("/{patient_serial}/conversations")
@observe()
def list_conversations(
    patient_serial: str,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    conversations, has_more = chat_repository.list_conversations(patient_serial, limit=limit, offset=offset)
    return {"conversations": conversations, "has_more": has_more}


@router.post("/{patient_serial}/conversations")
@observe()
@limiter.limit("10/minute")
def create_conversation(
    request: Request,
    patient_serial: str,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    conversation_id = chat_repository.create_conversation(patient_serial, doctor_id=doctor.serial)
    return {"conversation_id": conversation_id}


@router.delete("/{patient_serial}/conversations/{conversation_id}")
@observe()
def delete_conversation(
    patient_serial: str,
    conversation_id: str,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    deleted = chat_repository.soft_delete_conversation(patient_serial, conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}


@router.get("/{patient_serial}/conversations/{conversation_id}/messages")
@observe()
def list_messages(
    patient_serial: str,
    conversation_id: str,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    conversation = chat_repository.get_conversation(patient_serial, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return chat_repository.list_messages(conversation_id)


@router.post("/{patient_serial}/conversations/{conversation_id}/messages")
@observe()
@limiter.limit("10/minute")
def send_message(
    request: Request,
    patient_serial: str,
    conversation_id: str,
    body: ChatRequest,
    doctor: CurrentDoctor = Depends(get_current_doctor),
    _: None = Depends(verify_patient_access),
):
    conversation = chat_repository.get_conversation(patient_serial, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if chat_repository.count_messages(conversation_id) >= MAX_MESSAGES_PER_CONVERSATION:
        raise HTTPException(status_code=409, detail="This conversation has reached its message limit — start a new one")

    with propagate_attributes(
        user_id=doctor.serial,
        metadata={"patient_serial": patient_serial, "conversation_id": conversation_id},
        tags=["chat"],
    ):
        pass

    prior_messages = chat_repository.list_messages(conversation_id)
    history = [{"role": m["role"], "content": m["content"]} for m in prior_messages]

    chat_repository.add_message(conversation_id, role="user", content=body.message, tool_calls=[], chart_data=None)

    try:
        result = chat_service.answer_question(patient_serial, body.message, history)
    except Exception:
        logger.exception("Chat agent loop failed for patient %s", patient_serial)
        raise HTTPException(status_code=500, detail="Error generating chat response")

    message_id = chat_repository.add_message(
        conversation_id,
        role="assistant",
        content=result["answer"],
        tool_calls=result["tool_calls"],
        chart_data=result.get("chart_data"),
    )

    return {
        "id": message_id,
        "role": "assistant",
        "content": result["answer"],
        "tool_calls": result["tool_calls"],
        "chart_data": result.get("chart_data"),
    }
