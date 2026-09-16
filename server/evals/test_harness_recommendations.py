from evals.harness import build_recommendations_case_source_text, generate_recommendations_case


def test_generate_recommendations_case_returns_recommendations_shape():
    case = {"case_id": "seed-001-baseline-diabetes", "patient_email": "priya.sharma@gmail.com"}

    result = generate_recommendations_case(case, force_live=False)

    assert "recommendations" in result
    assert isinstance(result["recommendations"], list)


def test_build_recommendations_case_source_text_includes_overview():
    case = {"case_id": "seed-001-baseline-diabetes", "patient_email": "priya.sharma@gmail.com"}

    source = build_recommendations_case_source_text(case)

    assert "Return only valid JSON" in source

