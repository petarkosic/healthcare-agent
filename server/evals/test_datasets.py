from evals.datasets import load_cases


def test_load_cases_returns_list_of_dicts():
    cases = load_cases("overview_cases.json")

    assert isinstance(cases, list)
    assert len(cases) >= 5
    for case in cases:
        assert "case_id" in case
        assert "patient_email" in case
        assert "description" in case


def test_case_ids_are_unique():
    cases = load_cases("overview_cases.json")
    ids = [c["case_id"] for c in cases]

    assert len(ids) == len(set(ids))
