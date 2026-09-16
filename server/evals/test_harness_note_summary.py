from evals.harness import generate_note_summary_case


def test_generate_note_summary_case_returns_nonempty_string():
    case = {"case_id": "note-005-terse", "note_text": "Wellness check. No complaints. Vitals stable. RTC 1yr."}

    result = generate_note_summary_case(case, force_live=False)

    assert isinstance(result, str)
    assert len(result) > 0
