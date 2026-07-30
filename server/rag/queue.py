import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from rag.rag_service import rag_service as rag

logger = logging.getLogger(__name__)

_upsert_queue: asyncio.Queue = asyncio.Queue(maxsize=1_000)


def enqueue_note_upsert(patient_serial: str, note_text: str) -> None:
    try:
        _upsert_queue.put_nowait((patient_serial, note_text))
    except asyncio.QueueFull:
        logger.warning("RAG upsert queue full — entry dropped for patient %s", patient_serial)


def _sync_upsert(patient_serial: str, note_text: str) -> None:
    rag.upsert_patient_note(patient_serial=patient_serial, note_summary=note_text)


async def rag_upsert_worker() -> None:
    while True:
        patient_serial, note_text = await _upsert_queue.get()

        try:
            loop = asyncio.get_running_loop()

            await loop.run_in_executor(None, _sync_upsert, patient_serial, note_text)
        except Exception:
            logger.exception("RAG upsert failed for patient %s", patient_serial)
        finally:
            _upsert_queue.task_done()


@asynccontextmanager
async def rag_upsert_lifespan(app: FastAPI):
    worker_task = asyncio.create_task(rag_upsert_worker())

    try:
        yield
    finally:
        worker_task.cancel()
