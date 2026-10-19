import hashlib
import json
from pathlib import Path
from typing import Any, Callable

from repositories import patient_repository
from services import agent_service
from rag import rag_service as rag
from utils import cache

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def _cache_key(payload: dict[str, Any]) -> str:
    blob = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()[:16]


def cache_or_generate(
    namespace: str,
    key_payload: dict[str, Any],
    generate: Callable[[], dict[str, Any]],
    force_live: bool = False,
) -> dict[str, Any]:
    """Return a cached JSON fixture for (namespace, key_payload), or call
    `generate()` and cache its result.

    `generate` must return a JSON-serializable dict. Fixtures live at
    `fixtures/<namespace>/<hash>.json` and are meant to be committed to git.
    """
    fixture_dir = FIXTURES_DIR / namespace
    fixture_dir.mkdir(parents=True, exist_ok=True)
    fixture_path = fixture_dir / f"{_cache_key(key_payload)}.json"

    if fixture_path.exists() and not force_live:
        return json.loads(fixture_path.read_text(encoding="utf-8"))

    result = generate()
    fixture_path.write_text(json.dumps(result, indent=2, sort_keys=True), encoding="utf-8")

    return result


def resolve_patient_serial(patient_email: str) -> str:
    patient = patient_repository.get_patient_by_email(patient_email)

    if not patient:
        raise ValueError(f"No seeded patient with email {patient_email!r}")

    return patient.patient_serial_number


def generate_overview_case(case: dict, force_live: bool = False) -> dict:
    """Return the overview generation for a dataset case, from a cached
    fixture unless force_live. Cache key is the case_id (stable), not the
    patient_serial (regenerated on reseed)."""
    def _generate():
        patient_serial = resolve_patient_serial(case["patient_email"])
        return agent_service.get_or_generate_overview(patient_serial)

    return cache_or_generate(
        namespace="overview",
        key_payload={"case_id": case["case_id"]},
        generate=_generate,
        force_live=force_live,
    )


def build_case_source_text(case: dict) -> str:
    """Reproduce exactly what production sent as the prompt (facts + JSON-format
    instructions - the judge only extracts claims from the AI's output, so the
    instructions text here is harmless noise, not worth stripping out).
    Resolved live (cheap, no LLM call) - always reflects current DB state."""
    patient_serial = resolve_patient_serial(case["patient_email"])
    patient_data = agent_service.get_patient_overview_data(patient_serial)
    docs = rag.get_latest_note_chunks(patient_serial=patient_serial)

    return agent_service.build_prompt(patient_data, docs)


def expected_critical_findings(case: dict) -> list[str]:
    """Deterministic criticality rule - mirrors guardrails.clinical.apply_alert_floor
    but returns human-readable descriptions for the completeness judge to match
    against prose, plus the allergy check apply_alert_floor doesn't cover."""
    patient_serial = resolve_patient_serial(case["patient_email"])
    patient_data = agent_service.get_patient_overview_data(patient_serial)

    findings = []
    vitals = patient_data.get("latest_vitals") or {}
    lab = patient_data.get("latest_lab") or {}

    pain_level = vitals.get("pain_level")
    if pain_level is not None and pain_level >= 8:
        findings.append(f"severe pain (pain level {pain_level}/10)")

    bp = vitals.get("blood_pressure")
    if bp:
        try:
            systolic = int(str(bp).split("/")[0])
        except (ValueError, IndexError):
            systolic = None
        if systolic is not None and systolic >= 180:
            findings.append(f"hypertensive crisis range blood pressure ({bp})")

    if patient_data.get("allergies"):
        findings.append(f"documented allergies: {patient_data['allergies']}")

    if lab.get("status") == "critical":
        findings.append(f"critical lab result: {lab.get('test_name')} = {lab.get('result')}")

    return findings


def generate_medications_case(case: dict, force_live: bool = False) -> dict:
    """Return the medications generation for a dataset case, from a cached
    fixture unless force_live. Cache key is the case_id, same pattern as
    generate_overview_case."""
    def _generate():
        patient_serial = resolve_patient_serial(case["patient_email"])
        cache.set(f"overview:{patient_serial}", generate_overview_case(case))

        return agent_service.generate_medications_for_patient(patient_serial)

    return cache_or_generate(
        namespace="medications",
        key_payload={"case_id": case["case_id"]},
        generate=_generate,
        force_live=force_live,
    )


def build_medications_case_source_text(case: dict) -> str:
    """Reproduce exactly what production sent as the medications prompt
    (overview text + current meds + allergies + instructions), for judging
    against. Resolved live - always reflects current DB state."""
    patient_serial = resolve_patient_serial(case["patient_email"])
    overview_text = generate_overview_case(case)["ai_overview"]["overview"]

    return agent_service.build_medications_prompt(patient_serial, overview_text)


def generate_recommendations_case(case: dict, force_live: bool = False) -> dict:
    """Return the recommendations generation for a dataset case, from a cached
    fixture unless force_live. Same pattern as generate_medications_case,
    including the production-cache pre-seed to avoid a redundant overview call."""
    def _generate():
        patient_serial = resolve_patient_serial(case["patient_email"])
        cache.set(f"overview:{patient_serial}", generate_overview_case(case))
        return agent_service.generate_recommendations_for_patient(patient_serial)

    return cache_or_generate(
        namespace="recommendations",
        key_payload={"case_id": case["case_id"]},
        generate=_generate,
        force_live=force_live,
    )


def build_recommendations_case_source_text(case: dict) -> str:
    """Reproduce exactly what production sent as the recommendations prompt
    (overview text + instructions), for judging against. No DB-dependent
    formatting here (unlike medications), so this shell is hand-kept in sync
    with agent_service.generate_recommendations_for_patient's prompt rather
    than factored into a shared function."""
    overview_text = generate_overview_case(case)["ai_overview"]["overview"]

    return f"""
        Based on this overview, provide patient recommendations.

        <untrusted_overview>
        {overview_text}
        </untrusted_overview>

        Return only valid JSON with the following format:
        {{
            "recommendations": [
                {{
                    "recommendation": "string",
                    "reason": "string",
                    "priority": "string",
                    "follow_up": {{
                        "offset_days": "int",
                        "reason": "string"
                    }}
                }}
            ]
        }}
    """


def generate_note_summary_case(case: dict, force_live: bool = False) -> str:
    """Return the note-summary generation for a dataset case, from a cached
    fixture unless force_live. Unlike every other *_case function, this one
    has no DB dependency at all - note_text is supplied directly by the
    dataset, not looked up via a patient_serial."""
    def _generate():
        return {"summary": agent_service.generate_note_summary(case["note_text"])}

    result = cache_or_generate(
        namespace="note_summary",
        key_payload={"case_id": case["case_id"]},
        generate=_generate,
        force_live=force_live,
    )

    return result["summary"]

