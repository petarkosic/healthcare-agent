import pytest

from evals.datasets import load_cases
from evals.harness import generate_medications_case, resolve_patient_serial
from guardrails.clinical import check_name_leak
from guardrails.schemas import MedicationsOutput
from repositories import patient_repository

CASES = load_cases("overview_cases.json")

# Both of these patients have a real, documented allergy in the seed data -
ALLERGY_CASE_IDS = {"seed-003-penicillin-allergy", "seed-004-penicillin-allergy-lupus"}
ALLERGY_CASES = [c for c in CASES if c["case_id"] in ALLERGY_CASE_IDS]


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_medications_output_matches_schema(case, force_live):
    result = generate_medications_case(case, force_live=force_live)

    MedicationsOutput.model_validate(result)


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_medications_does_not_leak_patient_name(case, force_live):
    result = generate_medications_case(case, force_live=force_live)
    serial = resolve_patient_serial(case["patient_email"])
    patient = patient_repository.get_patient(serial)

    medications = MedicationsOutput.model_validate(result)
    leaks = check_name_leak(medications, f"{patient.first_name} {patient.last_name}")

    assert not leaks, f"patient name leaked into medications output: {leaks}"


@pytest.mark.parametrize("case", ALLERGY_CASES, ids=[c["case_id"] for c in ALLERGY_CASES])
def test_medications_allergy_gate_holds_on_real_generation(case, force_live):
    """The actual point of this phase: exercise apply_allergy_gate against a
    real model generation for a patient with a documented allergy, not just
    a synthetic unit-test input."""
    serial = resolve_patient_serial(case["patient_email"])
    patient = patient_repository.get_patient(serial)
    allergies = [a.lower() for a in (patient.allergies or [])]

    result = generate_medications_case(case, force_live=force_live)
    medications = MedicationsOutput.model_validate(result)

    for change in medications.medications.prescribed_changes:
        drug_name = change.name.lower()
        matched = [a for a in allergies if a in drug_name]
        
        assert not matched, (
            f"allergy gate failed to withhold {change.name!r} — "
            f"matches patient allergy {matched} (patient: {patient.first_name} {patient.last_name})"
        )
