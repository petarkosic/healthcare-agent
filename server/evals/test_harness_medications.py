from evals.harness import build_medications_case_source_text, generate_medications_case


def test_generate_medications_case_returns_medications_shape():
    case = {"case_id": "seed-001-baseline-diabetes", "patient_email": "priya.sharma@gmail.com"}

    result = generate_medications_case(case, force_live=False)

    assert "medications" in result
    assert "current_medications" in result["medications"]
    assert "prescribed_changes" in result["medications"]


def test_build_medications_case_source_text_includes_allergies_and_meds():
    case = {"case_id": "seed-003-penicillin-allergy", "patient_email": "john.anderson@gmail.com"}

    source = build_medications_case_source_text(case)

    assert "Penicillin" in source
    assert "Current medications" in source
