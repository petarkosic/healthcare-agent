import pytest

from evals.datasets import load_cases
from evals.harness import build_case_source_text
from evals.judges.faithfulness import judge_faithfulness

LABELED_SET = load_cases("judge_labeled_set.json")
OVERVIEW_CASES = load_cases("overview_cases.json")


@pytest.fixture(scope="module")
def labeled_verdicts():
    """One judge_faithfulness call per labeled entry, shared by every test in
    this module - computing this twice (once per-case, once for the aggregate)
    doubles API calls for no benefit and risks tripping the provider's
    per-minute rate limit."""
    verdicts = {}
    for labeled_case in LABELED_SET:
        source_case = next(c for c in OVERVIEW_CASES if c["case_id"] == labeled_case["case_id"])
        source = build_case_source_text(source_case)
        verdicts[labeled_case["label_id"]] = judge_faithfulness(source=source, output=labeled_case["output_text"])
    return verdicts


@pytest.mark.parametrize("labeled_case", LABELED_SET, ids=[c["label_id"] for c in LABELED_SET])
def test_faithfulness_judge_per_case_accuracy(labeled_case, labeled_verdicts):
    verdict = labeled_verdicts[labeled_case["label_id"]]

    if labeled_case["is_clean"]:
        assert verdict.passed, f"false alarm on clean output: {[c.claim for c in verdict.claims if c.label != 'supported']}"
    else:
        assert not verdict.passed, f"missed planted fabrication: {labeled_case['planted_fabrication']}"


def test_faithfulness_judge_aggregate_catch_rate(labeled_verdicts):
    fabricated_cases = [c for c in LABELED_SET if not c["is_clean"]]
    assert fabricated_cases, "labeled set must include at least one planted fabrication"

    caught = sum(1 for c in fabricated_cases if not labeled_verdicts[c["label_id"]].passed)

    catch_rate = caught / len(fabricated_cases)
    assert catch_rate >= 0.9, f"faithfulness judge only caught {catch_rate:.0%} of planted fabrications (target: 90%)"
