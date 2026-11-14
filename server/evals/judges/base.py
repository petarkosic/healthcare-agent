import hashlib
import json
import os
from pathlib import Path
from typing import Type, TypeVar

from langfuse import observe
from pydantic import BaseModel, ValidationError

from utils import openai_client, LLM_MODEL_NAME

JUDGE_MODEL = os.getenv("JUDGE_MODEL", LLM_MODEL_NAME)

# Judge verdicts are cached next to the generation fixtures and meant to be
# committed, so the same (model, prompts, schema) always gives the same verdict
# and reruns cost nothing. Set JUDGE_NO_CACHE=1 (or pass pytest --live) to judge live.
JUDGE_CACHE_DIR = Path(__file__).parent.parent / "fixtures" / "judge"

V = TypeVar("V", bound=BaseModel)


class JudgeError(Exception):
    """Judge produced unusable output after retry. Distinct from a failing verdict."""


def _cache_enabled() -> bool:
    return os.getenv("JUDGE_NO_CACHE", "").lower() not in {"1", "true", "yes"}


def _cache_path(system_prompt: str, user_prompt: str, verdict_model: Type[V]) -> Path:
    # The verdict schema is part of the key so changing what the judge must
    # return (not just the prompt text) invalidates old entries.
    payload = {
        "model": JUDGE_MODEL,
        "system": system_prompt,
        "user": user_prompt,
        "schema": verdict_model.model_json_schema(),
    }
    blob = json.dumps(payload, sort_keys=True).encode("utf-8")
    return JUDGE_CACHE_DIR / f"{hashlib.sha256(blob).hexdigest()[:16]}.json"


@observe(as_type="evaluator")
def run_judge(system_prompt: str, user_prompt: str, verdict_model: Type[V], use_cache: bool = True) -> V:
    cache_path = _cache_path(system_prompt, user_prompt, verdict_model) if use_cache and _cache_enabled() else None

    if cache_path is not None and cache_path.exists():
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            return verdict_model.model_validate(cached["verdict"])
        except (json.JSONDecodeError, KeyError, ValidationError):
            pass  # unreadable entry: fall through and judge live, then overwrite it

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_error = None
    for _attempt in range(2):  # one retry on contract failure
        response = openai_client.chat.completions.create(
            model=JUDGE_MODEL,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content

        try:
            parsed = json.loads(raw)
            verdict = verdict_model.model_validate(parsed)
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": f"Your response failed validation: {e}. "
                           f"Return ONLY corrected JSON matching the required schema.",
            })
            continue

        if cache_path is not None:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_text(
                json.dumps({"judge_model": JUDGE_MODEL, "verdict": parsed}, indent=2, sort_keys=True),
                encoding="utf-8",
            )

        return verdict

    raise JudgeError(f"Judge output invalid after retry: {last_error}")
