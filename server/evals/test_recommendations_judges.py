import pytest

from evals.datasets import load_cases
from evals.harness import generate_synthetic_recommendations_case
from evals.judges.faithfulness import judge_faithfulness
from guardrails.schemas import RecommendationsOutput

CASES = load_cases("recommendations_cases.json")
CITATION_CASES = [c for c in CASES if c.get("required_citation")]


def _reasons_text(result: dict) -> str:
    recs = RecommendationsOutput.model_validate(result).recommendations
    lines = [r.reason for r in recs if r.reason]
    lines += [r.follow_up.reason for r in recs if r.follow_up and r.follow_up.reason]
    return "\n".join(lines)


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_recommendations_reason_faithfulness(case, force_live):
    result = generate_synthetic_recommendations_case(case, force_live=force_live)
    reasons = _reasons_text(result)
    if not reasons:
        pytest.skip("no recommendations to judge")

    verdict = judge_faithfulness(source=case["overview_text"], output=reasons)

    failed = [c for c in verdict.claims if c.label != "supported"]
    assert not failed, (
        f"{len(failed)} ungrounded claim(s) in recommendations reasoning:\n" +
        "\n".join(f"  [{c.label}] {c.claim!r} (evidence: {c.evidence})" for c in failed)
    )


@pytest.mark.parametrize("case", CITATION_CASES, ids=[c["case_id"] for c in CITATION_CASES])
def test_recommendations_cites_exact_value(case, force_live):
    result = generate_synthetic_recommendations_case(case, force_live=force_live)
    reasons = _reasons_text(result)

    assert case["required_citation"] in reasons, (
        f"expected exact value {case['required_citation']!r} cited in reasoning, got:\n{reasons}"
    )
