import pytest

from evals.datasets import load_cases
from evals.harness import generate_synthetic_medications_case
from evals.judges.faithfulness import judge_faithfulness
from guardrails.schemas import MedicationsOutput

CASES = load_cases("medications_cases.json")
CITATION_CASES = [c for c in CASES if c.get("required_citation")]


def _reasons_text(result: dict) -> str:
    meds = MedicationsOutput.model_validate(result).medications
    return "\n".join(c.reason for c in meds.prescribed_changes if c.reason)


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_medications_reason_faithfulness(case, force_live):
    result = generate_synthetic_medications_case(case, force_live=force_live)
    reasons = _reasons_text(result)
    if not reasons:
        pytest.skip("no prescribed changes to judge")

    verdict = judge_faithfulness(source=case["overview_text"], output=reasons)

    failed = [c for c in verdict.claims if c.label != "supported"]
    assert not failed, (
        f"{len(failed)} ungrounded claim(s) in medications reasoning:\n" +
        "\n".join(f"  [{c.label}] {c.claim!r} (evidence: {c.evidence})" for c in failed)
    )


@pytest.mark.parametrize("case", CITATION_CASES, ids=[c["case_id"] for c in CITATION_CASES])
def test_medications_cites_exact_value(case, force_live):
    result = generate_synthetic_medications_case(case, force_live=force_live)
    reasons = _reasons_text(result)

    assert case["required_citation"] in reasons, (
        f"expected exact value {case['required_citation']!r} cited in reasoning, got:\n{reasons}"
    )
