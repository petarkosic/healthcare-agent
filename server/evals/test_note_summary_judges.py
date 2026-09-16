import pytest

from evals.datasets import load_cases
from evals.harness import generate_note_summary_case
from evals.judges.completeness import judge_completeness
from evals.judges.faithfulness import judge_faithfulness

CASES = load_cases("note_summary_cases.json")


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_note_summary_faithfulness(case, force_live):
    summary = generate_note_summary_case(case, force_live=force_live)

    verdict = judge_faithfulness(source=case["note_text"], output=summary)

    failed = [c for c in verdict.claims if c.label != "supported"]
    assert not failed, (
        f"{len(failed)} ungrounded claim(s) in note summary:\n" +
        "\n".join(f"  [{c.label}] {c.claim!r} (evidence: {c.evidence})" for c in failed)
    )


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_note_summary_completeness(case, force_live):
    summary = generate_note_summary_case(case, force_live=force_live)

    verdict = judge_completeness(output=summary, required_findings=[case["required_fact"]])

    absent = [f.finding for f in verdict.findings if f.status == "absent"]
    assert not absent, f"required fact missing from summary: {absent}"
