import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from rag.rag_service import rag_service as rag

logger = logging.getLogger(__name__)

_note_queue: asyncio.Queue = asyncio.Queue(maxsize=1_000)
_cc_queue: asyncio.Queue = asyncio.Queue(maxsize=1_000)


def enqueue_note_index(patient_serial: str, note_id: str, note_text: str, record_date: str) -> None:
    try:
        _note_queue.put_nowait((patient_serial, note_id, note_text, record_date))
    except asyncio.QueueFull:
        logger.warning("RAG index queue full - entry dropped for patient %s", patient_serial)


def _sync_note_index(patient_serial: str, note_id: str, note_text: str, record_date: str) -> None:
    rag.add_patient_note(patient_serial=patient_serial, note_id=note_id, note_summary=note_text, record_date=record_date)


async def note_index_worker() -> None:
    while True:
        patient_serial, note_id, note_text, record_date = await _note_queue.get()

        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _sync_note_index, patient_serial, note_id, note_text, record_date)
        except Exception:
            logger.exception("RAG note indexing failed for patient %s", patient_serial)
        finally:
            _note_queue.task_done()


def enqueue_chief_complaint_index(patient_serial: str, visit_id: str, chief_complaint: str, record_date: str) -> None:
    try:
        _cc_queue.put_nowait((patient_serial, visit_id, chief_complaint, record_date))
    except asyncio.QueueFull:
        logger.warning("Chief-complaint index queue full - entry dropped for patient %s", patient_serial)


def _sync_cc_index(patient_serial: str, visit_id: str, chief_complaint: str, record_date: str) -> None:
    rag.add_chief_complaint(patient_serial=patient_serial, visit_id=visit_id, chief_complaint=chief_complaint, record_date=record_date)


async def cc_index_worker() -> None:
    while True:
        patient_serial, visit_id, chief_complaint, record_date = await _cc_queue.get()
        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _sync_cc_index, patient_serial, visit_id, chief_complaint, record_date)
        except Exception:
            logger.exception("Chief-complaint indexing failed for patient %s", patient_serial)
        finally:
            _cc_queue.task_done()


@asynccontextmanager
async def rag_index_lifespan(app: FastAPI):
    worker_task = asyncio.create_task(note_index_worker())
    cc_worker_task = asyncio.create_task(cc_index_worker())

    try:
        yield
    finally:
        worker_task.cancel()
        cc_worker_task.cancel()
