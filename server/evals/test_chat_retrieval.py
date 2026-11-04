from evals.conftest import CHAT_EVAL_EMAIL
from evals.harness import resolve_patient_serial
from rag import rag_service as rag


def test_search_notes_retrieves_seeded_note_for_a_paraphrased_query():
    """Retrieval, not generation - no LLM call. A paraphrase of the note's
    own wording ("dose lowered" vs the note's "reduce ... to a lower
    dose"), not an exact substring match, so this actually exercises
    semantic search rather than a keyword match that would pass even if
    the reranker were broken."""
    patient_serial = resolve_patient_serial(CHAT_EVAL_EMAIL)

    results = rag.search_notes(
        patient_serial=patient_serial,
        query="why was blood pressure medication dose lowered",
    )

    assert any("orthostatic hypotension" in r["content"] for r in results), (
        "seeded note not retrieved for a paraphrased query"
    )
