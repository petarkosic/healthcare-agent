import pytest

from evals.datasets import load_cases
from evals.harness import build_case_source_text, expected_critical_findings, generate_overview_case
from evals.judges.completeness import judge_completeness
from evals.judges.faithfulness import judge_faithfulness

CASES = load_cases("overview_cases.json")


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_overview_faithfulness(case, force_live):
    result = generate_overview_case(case, force_live=force_live)
    source = build_case_source_text(case)

    verdict = judge_faithfulness(source=source, output=result["ai_overview"]["overview"])

    failed = [c for c in verdict.claims if c.label != "supported"]
    assert not failed, (
        f"{len(failed)} ungrounded claim(s):\n" +
        "\n".join(f"  [{c.label}] {c.claim!r} (evidence: {c.evidence})" for c in failed)
    )


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_overview_completeness(case, force_live):
    required = expected_critical_findings(case)
    if not required:
        pytest.skip("no critical findings expected for this case")

    result = generate_overview_case(case, force_live=force_live)
    full_text = result["ai_overview"]["overview"] + " " + " ".join(result["ai_overview"]["critical_alerts"])

    verdict = judge_completeness(output=full_text, required_findings=required)

    absent = [f.finding for f in verdict.findings if f.status == "absent"]
    assert not absent, f"critical findings missing from briefing: {absent}"
