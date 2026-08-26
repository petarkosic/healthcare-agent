import logging
from typing import Any, Type, TypeVar

from langfuse import observe
from pydantic import BaseModel, ValidationError

from guardrails.errors import GuardrailViolation
from guardrails.schemas import (
    MedicationsOutput,
    OverviewOutput,
    RecommendationsOutput,
)
from utils.openai_client import openai_client, LLM_MODEL_NAME

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

_MAX_ATTEMPTS = 2  # initial call + one corrective retry

# Shared by every JSON-producing endpoint.
_JSON_KWARGS: dict[str, Any] = {
    "response_format": {"type": "json_object"},
    "temperature": 0.0,
}


def _format_errors(exc: ValidationError) -> str:
    parts = []

    for error in exc.errors():
        location = ".".join(str(item) for item in error.get("loc", ())) or "(root)"
        parts.append(f"{location}: {error.get('msg', 'invalid')}")

    return "; ".join(parts) or str(exc)


@observe(as_type="span")
def generate_validated(
    *,
    messages: list[dict[str, Any]],
    model_cls: Type[T],
    context: str,
    **create_kwargs: Any,
) -> T:
    """Call the LLM and return output validated against `model_cls`.

    On a validation failure the specific errors are fed back to the model in one
    corrective retry. If that also fails, raises `GuardrailViolation` — callers
    must not fall back to returning unvalidated output.
    """
    attempt_messages = list(messages)

    for attempt in range(_MAX_ATTEMPTS):
        response = openai_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=attempt_messages,
            **create_kwargs,
        )

        raw = response.choices[0].message.content

        try:
            validated = model_cls.model_validate_json(raw or "")

            return validated
        except ValidationError as exc:
            errors = _format_errors(exc)
            is_last_attempt = attempt == _MAX_ATTEMPTS - 1

            if is_last_attempt:
                raise GuardrailViolation(context, errors) from exc

            attempt_messages = [
                *messages,
                {"role": "assistant", "content": raw or ""},
                {
                    "role": "user",
                    "content": (
                        "Your previous response failed validation with these errors:\n"
                        f"{errors}\n\n"
                        "Return only corrected JSON matching the required format. "
                        "Do not include any other keys, commentary, or explanation."
                    ),
                },
            ]

    # Unreachable: the final attempt either returns or raises above.
    raise GuardrailViolation(context, "exhausted attempts")


def generate_overview(*, messages: list[dict[str, Any]], patient_serial: str) -> dict:
    return generate_validated(
        messages=messages,
        model_cls=OverviewOutput,
        context=f"overview for patient {patient_serial}",
        **_JSON_KWARGS,
    ).model_dump()


def generate_recommendations(*, messages: list[dict[str, Any]], patient_serial: str) -> dict:
    return generate_validated(
        messages=messages,
        model_cls=RecommendationsOutput,
        context=f"recommendations for patient {patient_serial}",
        **_JSON_KWARGS,
    ).model_dump()


def generate_medications(*, messages: list[dict[str, Any]], patient_serial: str) -> dict:
    return generate_validated(
        messages=messages,
        model_cls=MedicationsOutput,
        context=f"medications for patient {patient_serial}",
        **_JSON_KWARGS,
    ).model_dump()