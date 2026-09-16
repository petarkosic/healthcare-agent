import pytest

from evals.datasets import load_cases
from evals.harness import generate_recommendations_case, resolve_patient_serial
from guardrails.clinical import check_name_leak
from guardrails.schemas import RecommendationsOutput
from repositories import patient_repository

CASES = load_cases("overview_cases.json")


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_recommendations_output_matches_schema(case, force_live):
    result = generate_recommendations_case(case, force_live=force_live)

    RecommendationsOutput.model_validate(result)


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_recommendations_does_not_leak_patient_name(case, force_live):
    result = generate_recommendations_case(case, force_live=force_live)
    serial = resolve_patient_serial(case["patient_email"])
    patient = patient_repository.get_patient(serial)

    recommendations = RecommendationsOutput.model_validate(result)
    leaks = check_name_leak(recommendations, f"{patient.first_name} {patient.last_name}")

    assert not leaks, f"patient name leaked into recommendations output: {leaks}"
