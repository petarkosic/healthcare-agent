import pytest

from evals.datasets import load_cases
from evals.harness import generate_overview_case, resolve_patient_serial
from guardrails.clinical import check_name_leak
from guardrails.schemas import OverviewOutput
from repositories.patient_repository import patient_repository

CASES = load_cases("overview_cases.json")


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_overview_output_matches_schema(case, force_live):
    result = generate_overview_case(case, force_live=force_live)

    # Re-validates the cached/fresh output against the same strict schema
    # generate_validated() already enforced at generation time - catches drift
    # if the schema or a fixture goes stale relative to each other.
    OverviewOutput.model_validate(result["ai_overview"])


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_overview_does_not_leak_patient_name(case, force_live):
    result = generate_overview_case(case, force_live=force_live)
    serial = resolve_patient_serial(case["patient_email"])
    patient = patient_repository.get_patient(serial)

    overview = OverviewOutput.model_validate(result["ai_overview"])
    leaks = check_name_leak(overview, f"{patient.first_name} {patient.last_name}")

    assert not leaks, f"patient name leaked into overview: {leaks}"


def test_critical_vitals_case_gets_alert_floor_injection(eval_critical_case_email, force_live):
    case = next(c for c in CASES if c["case_id"] == "eval-006-critical-vitals")
    result = generate_overview_case(case, force_live=force_live)

    alerts_text = " ".join(result["ai_overview"]["critical_alerts"]).lower()
    assert "pain" in alerts_text
    assert "blood pressure" in alerts_text or "hypertensive" in alerts_text
