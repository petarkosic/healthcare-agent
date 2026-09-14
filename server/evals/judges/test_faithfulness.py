from evals.judges.faithfulness import judge_faithfulness

SOURCE = """
DEMOGRAPHICS: Jane Doe, 45yo Female
CURRENT VITALS: {'blood_pressure': '130/85', 'pain_level': 2}
ALLERGIES: None
"""


def test_faithfulness_passes_grounded_output():
    verdict = judge_faithfulness(
        source=SOURCE,
        output="Jane Doe, 45yo Female. Blood pressure is 130/85. Pain level 2. No known allergies.",
    )

    unsupported_or_contradicted = [c for c in verdict.claims if c.label != "supported"]
    assert not unsupported_or_contradicted, unsupported_or_contradicted


def test_faithfulness_flags_fabricated_claim():
    verdict = judge_faithfulness(
        source=SOURCE,
        output="Jane Doe, 45yo Female. Blood pressure is well controlled. Patient has a documented penicillin allergy.",
    )

    flagged = [c for c in verdict.claims if c.label != "supported"]
    assert flagged, "judge should have flagged the fabricated penicillin allergy claim"
