from pydantic import BaseModel

from guardrails.schemas import MedicationsOutput, OverviewOutput

class Rejection(BaseModel):
    reason: str
    detail: str


def _normalize(name: str | None) -> str:
    return (name or "").strip().lower()


def apply_allergy_gate(
    medications: MedicationsOutput, allergies: list[str]
) -> tuple[MedicationsOutput, list[Rejection]]:
    """Drop any prescribed_changes[] entry naming a drug in the patient's allergy list."""
    normalized_allergies = [_normalize(a) for a in allergies if a]
    kept = []
    withheld = []

    for change in medications.medications.prescribed_changes:
        drug_name = _normalize(change.name)
        matched = next((a for a in normalized_allergies if a and a in drug_name), None)

        if matched:
            withheld.append(Rejection(
                reason="allergy",
                detail=f"{change.name} matches allergy '{matched}'",
            ))
        else:
            kept.append(change)

    medications.medications.prescribed_changes = kept

    return medications, withheld


def apply_referential_integrity(
    medications: MedicationsOutput, current_medication_names: set[str]
) -> tuple[MedicationsOutput, list[Rejection]]:
    """`action != "add"` requires the drug already in the patient's current
    medications (ground truth from the DB, not the model's own echoed list);
    `action == "add"` requires it not be there.
    """
    normalized_current = {_normalize(n) for n in current_medication_names}
    kept = []
    withheld = []

    for change in medications.medications.prescribed_changes:
        drug_name = _normalize(change.name)
        exists = drug_name in normalized_current
        valid = (change.action == "add" and not exists) or (change.action != "add" and exists)

        if valid:
            kept.append(change)
        else:
            withheld.append(Rejection(
                reason="referential_integrity",
                detail=f"action '{change.action}' on '{change.name}' inconsistent with current medications",
            ))

    medications.medications.prescribed_changes = kept

    return medications, withheld


def check_name_leak(output: BaseModel, full_name: str) -> list[str]:
    """Return which parts of the patient's name (if any) leaked into the output."""
    text = output.model_dump_json().lower()
    leaks = []

    for part in (full_name or "").split():
        normalized = _normalize(part)
        if normalized and normalized in text:
            leaks.append(part)

    return leaks


def apply_alert_floor(overview: OverviewOutput, patient_data: dict) -> OverviewOutput:
    """If vitals/labs cross a critical threshold, critical_alerts must be
    non-empty. Inject a deterministic alert if the model omitted it —
    backstop, not veto; never removes an alert the model already gave.
    """
    alerts = list(overview.critical_alerts)
    vitals = patient_data.get("latest_vitals") or {}
    lab = patient_data.get("latest_lab") or {}

    pain_level = vitals.get("pain_level")
    if pain_level is not None and pain_level >= 8 and not any("pain" in a.lower() for a in alerts):
        alerts.append(f"Pain level {pain_level}/10 — severe")

    bp = vitals.get("blood_pressure")
    if bp:
        try:
            systolic = int(str(bp).split("/")[0])
        except (ValueError, IndexError):
            systolic = None

        if systolic is not None and systolic >= 180 and not any(
            "blood pressure" in a.lower() or " bp " in f" {a.lower()} " for a in alerts
        ):
            alerts.append(f"Blood pressure {bp} — hypertensive crisis range")

    if lab.get("status") == "critical":
        test_name = (lab.get("test_name") or "").lower()
        if test_name and not any(test_name in a.lower() for a in alerts):
            unit = lab.get("unit") or ""
            alerts.append(f"Critical lab result: {lab.get('test_name')} = {lab.get('result')} {unit}".strip())

    overview.critical_alerts = alerts

    return overview
