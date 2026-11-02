from datetime import date

import pytest

from evals.datasets import load_cases
from evals.harness import generate_medications_case, resolve_patient_serial
from guardrails.clinical import check_name_leak
from guardrails.schemas import MedicationsOutput
from repositories import medication_repository, patient_repository

CASES = load_cases("overview_cases.json")

_BLANK_VALUES = {"", "unknown", "n/a", "na", "tbd", "none"}

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


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_medications_referential_integrity_holds_on_real_generation(case, force_live):
    """Exercise apply_referential_integrity against a real generation: an
    'add' must name a drug not already on the patient's active medications;
    any other action must name one that is."""
    serial = resolve_patient_serial(case["patient_email"])
    active_medications = medication_repository.get_patient_medications(serial, status="active")
    current_names = {
        m["medication_name"].strip().lower() for m in active_medications
        if not m["end_date"] or m["end_date"] >= date.today()
    }

    result = generate_medications_case(case, force_live=force_live)
    medications = MedicationsOutput.model_validate(result)

    for change in medications.medications.prescribed_changes:
        exists = change.name.strip().lower() in current_names
        valid = (change.action == "add" and not exists) or (change.action != "add" and exists)

        assert valid, (
            f"referential integrity failed: action {change.action!r} on {change.name!r} "
            f"inconsistent with patient's current medications {sorted(current_names)}"
        )


@pytest.mark.parametrize("case", CASES, ids=[c["case_id"] for c in CASES])
def test_medications_never_return_blank_dosage_or_frequency(case, force_live):
    """The medications prompt explicitly forbids 'unknown', 'n/a', 'TBD', or
    an empty string for dosage/frequency - deterministic check, not a judge
    call, since this is a format rule, not a factual one."""
    result = generate_medications_case(case, force_live=force_live)
    medications = MedicationsOutput.model_validate(result)

    for change in medications.medications.prescribed_changes:
        assert change.dosage.strip().lower() not in _BLANK_VALUES, (
            f"blank/placeholder dosage {change.dosage!r} for {change.name!r} (action={change.action})"
        )
        assert change.frequency.strip().lower() not in _BLANK_VALUES, (
            f"blank/placeholder frequency {change.frequency!r} for {change.name!r} (action={change.action})"
        )
