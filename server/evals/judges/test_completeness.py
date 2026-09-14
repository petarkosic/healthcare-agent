from evals.judges.completeness import judge_completeness


def test_completeness_passes_when_finding_mentioned():
    verdict = judge_completeness(
        output="Patient reports severe pain, rated 9/10, requiring immediate attention.",
        required_findings=["severe pain (pain level 9/10)"],
    )

    assert verdict.absent_count == 0
    assert verdict.passed is True


def test_completeness_flags_missing_finding():
    verdict = judge_completeness(
        output="Patient is doing well overall, minor complaints only.",
        required_findings=["documented allergies: ['Penicillin']"],
    )

    assert verdict.absent_count >= 1
    assert verdict.passed is False
