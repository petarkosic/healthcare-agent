from typing import Literal

from pydantic import BaseModel

from evals.judges.base import run_judge

SYSTEM = """You verify whether specific clinical findings are mentioned in a generated medical briefing. A finding counts as mentioned if it appears in any phrasing (paraphrase, abbreviation, or exact). It does not count if only a vaguely related topic appears."""


class FindingCheck(BaseModel):
    finding: str
    status: Literal["mentioned", "absent"]
    where: str


class CompletenessVerdict(BaseModel):
    findings: list[FindingCheck]
    absent_count: int
    passed: bool


PROMPT_TEMPLATE = """GENERATED BRIEFING:
<output>
{output}
</output>

REQUIRED FINDINGS (each must be mentioned somewhere in the briefing):
{findings_list}

For each required finding: is it mentioned in the briefing (any phrasing)? Quote where, or "none".

Return JSON: {{"findings": [{{"finding": str, "status": str, "where": str}}], "absent_count": int, "passed": bool}}
"""


def judge_completeness(output: str, required_findings: list[str]) -> CompletenessVerdict:
    findings_list = "\n".join(f"- {f}" for f in required_findings)

    return run_judge(
        SYSTEM,
        PROMPT_TEMPLATE.format(output=output, findings_list=findings_list),
        CompletenessVerdict,
    )
