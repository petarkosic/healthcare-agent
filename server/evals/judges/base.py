import json
import os
from typing import Type, TypeVar

from langfuse import observe
from pydantic import BaseModel, ValidationError

from utils.openai_client import openai_client, LLM_MODEL_NAME

JUDGE_MODEL = os.getenv("JUDGE_MODEL", LLM_MODEL_NAME)

V = TypeVar("V", bound=BaseModel)


class JudgeError(Exception):
    """Judge produced unusable output after retry. Distinct from a failing verdict."""


@observe(as_type="evaluator")
def run_judge(system_prompt: str, user_prompt: str, verdict_model: Type[V]) -> V:
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
            return verdict_model.model_validate(json.loads(raw))
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": f"Your response failed validation: {e}. "
                           f"Return ONLY corrected JSON matching the required schema.",
            })

    raise JudgeError(f"Judge output invalid after retry: {last_error}")
