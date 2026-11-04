import pytest

from evals.datasets import load_cases
from evals.harness import generate_chat_answer_case, resolve_patient_serial
from evals.judges.faithfulness import judge_faithfulness
from rag import rag_service as rag

CASES = load_cases("chat_cases.json")
NOTE_GROUNDED_CASES = [c for c in CASES if c["case_type"] == "note_grounded"]


@pytest.mark.parametrize("case", NOTE_GROUNDED_CASES, ids=[c["case_id"] for c in NOTE_GROUNDED_CASES])
def test_chat_note_grounded_answer_is_faithful(case, force_live):
    """Faithfulness must be judged against what search_notes actually
    returned to the model, not the full note independently - chat_service
    only logs {tool, args} in tool_calls, not the result payload the model
    saw, so re-run the same tool call with the same logged args to
    reconstruct that source. search_notes is a deterministic read, so this
    reproduces the original context exactly."""
    result = generate_chat_answer_case(case, force_live=force_live)
    patient_serial = resolve_patient_serial(case["patient_email"])

    search_calls = [tc for tc in result["tool_calls"] if tc["tool"] == "search_notes"]
    assert search_calls, "expected a search_notes tool call for a note-grounded case"

    retrieved = rag.search_notes(patient_serial=patient_serial, query=search_calls[0]["args"]["query"])
    source = "\n".join(f"[{r['record_date']}] {r['content']}" for r in retrieved)

    verdict = judge_faithfulness(source=source, output=result["answer"])

    failed = [c for c in verdict.claims if c.label != "supported"]
    assert not failed, (
        f"{len(failed)} ungrounded claim(s) in chat answer:\n" +
        "\n".join(f"  [{c.label}] {c.claim!r} (evidence: {c.evidence})" for c in failed)
    )
