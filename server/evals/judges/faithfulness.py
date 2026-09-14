from typing import Literal

from pydantic import BaseModel, Field

from evals.judges.base import run_judge

SYSTEM = """You are a meticulous clinical documentation auditor. You verify whether generated text is supported by source medical data. You are strict: a claim is SUPPORTED only if the source data explicitly contains it, is a direct trivial restatement, or applies a well-established textbook clinical threshold directly to a value explicitly present in the source AND names that value in the claim. This applies equally whether the value falls inside or outside the normal range - e.g. ALL of these are SUPPORTED when the cited number is in the source: "blood pressure 145/91 is elevated", "heart rate 75 is within normal limits", "temperature 37.3°C is normal", "BMI 28.2 is in the overweight range". A characterization that does NOT name the specific value(s) it is based on (e.g. "vitals were stable") is UNSUPPORTED, even if every underlying value individually would have supported a cited claim - the claim must name what it judges. Any other clinical inference, however plausible, is UNSUPPORTED unless stated in the source. You never use outside medical knowledge to fill gaps beyond applying a threshold to an explicitly cited value."""


class ClaimVerdict(BaseModel):
    claim: str = Field(description="One atomic factual claim from the output")
    label: Literal["supported", "unsupported", "contradicted"]
    evidence: str = Field(description="Quote from source supporting/contradicting, or 'none'")


class FaithfulnessVerdict(BaseModel):
    claims: list[ClaimVerdict]
    unsupported_count: int
    contradicted_count: int
    passed: bool


PROMPT_TEMPLATE = """SOURCE DATA (ground truth):
<source>
{source}
</source>

GENERATED OUTPUT (to be audited):
<output>
{output}
</output>

Task:
1. Extract every atomic factual claim from the generated output. Atomic means one verifiable fact per claim ("BP is 150/95" and "BP is elevated" are two claims).
2. For each claim, label it:
   - "supported": source explicitly contains this fact
   - "unsupported": source neither contains nor contradicts it
   - "contradicted": source states something incompatible
3. Quote the exact source fragment as evidence, or "none".
4. Count unsupported and contradicted claims.
5. passed = true only if both counts are zero.

Ignore: formatting, hedging language, and generic advice with no factual content ("continue monitoring"). Judge facts only.

Return JSON: {{"claims": [{{"claim": str, "label": str, "evidence": str}}], "unsupported_count": int, "contradicted_count": int, "passed": bool}}
"""


def judge_faithfulness(source: str, output: str) -> FaithfulnessVerdict:
    return run_judge(
        SYSTEM,
        PROMPT_TEMPLATE.format(source=source, output=output),
        FaithfulnessVerdict,
    )
