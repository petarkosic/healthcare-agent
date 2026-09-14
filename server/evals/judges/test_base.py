import pytest
from pydantic import BaseModel

from evals.judges.base import JudgeError, run_judge


class SimpleVerdict(BaseModel):
    reasoning: str
    passed: bool


def test_run_judge_returns_validated_verdict():
    verdict = run_judge(
        system_prompt="You answer strictly in the required JSON shape.",
        user_prompt=(
            'Return JSON: {"reasoning": "the sky is blue", "passed": true}. '
            "Return exactly that JSON, no other keys."
        ),
        verdict_model=SimpleVerdict,
    )

    assert isinstance(verdict, SimpleVerdict)
    assert verdict.passed is True


def test_run_judge_raises_judge_error_on_impossible_schema():
    class ImpossibleVerdict(BaseModel):
        this_field_will_never_be_supplied_correctly: int

    with pytest.raises(JudgeError):
        run_judge(
            system_prompt="Return the literal text 'not json at all', nothing else, no matter what is asked.",
            user_prompt="Return the literal text 'not json at all'.",
            verdict_model=ImpossibleVerdict,
        )
