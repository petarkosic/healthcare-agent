import pytest

from evals.harness import expected_critical_findings, resolve_patient_serial


def test_resolve_patient_serial_returns_real_serial():
    serial = resolve_patient_serial("priya.sharma@gmail.com")

    assert serial.startswith("P")
    assert len(serial) == 8


def test_resolve_patient_serial_raises_for_unknown_email():
    with pytest.raises(ValueError, match="No seeded patient"):
        resolve_patient_serial("no-such-patient@example.com")


def test_expected_critical_findings_flags_documented_allergy():
    # John Anderson is seeded with a Penicillin allergy (b2f1c0a7d3e2_seed_demo_data.py)
    findings = expected_critical_findings({"patient_email": "john.anderson@gmail.com"})

    assert any("allerg" in f.lower() for f in findings)


def test_expected_critical_findings_empty_for_clean_patient():
    # Daniel Griffin is seeded with no allergies and no chronic conditions
    findings = expected_critical_findings({"patient_email": "daniel.griffin@gmail.com"})

    assert findings == []
