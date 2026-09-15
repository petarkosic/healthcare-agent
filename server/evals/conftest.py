import pytest

from db.database import db_manager
from repositories import patient_repository, visit_repository, vital_signs_repository

CRITICAL_CASE_EMAIL = "michael.cooper@gmail.com"
CRITICAL_CASE_MARKER = "EVAL FIXTURE - do not delete - critical vitals case"


@pytest.fixture(scope="session", autouse=True)
def _open_db_pool():
    """pytest never runs FastAPI's lifespan (main.py), so the connection pool
    is never opened otherwise. Every repository call in this suite needs it."""
    db_manager.open()
    yield
    db_manager.close()


def pytest_addoption(parser):
    parser.addoption(
        "--live",
        action="store_true",
        default=False,
        help="Regenerate cached eval fixtures from live LLM calls instead of reusing them.",
    )


@pytest.fixture(scope="session")
def force_live(request) -> bool:
    return request.config.getoption("--live")


@pytest.fixture(scope="session", autouse=True)
def eval_critical_case_email(_open_db_pool):
    """Idempotently ensure one patient has a visit+vitals row crossing the
    alert-floor thresholds. Seeded vitals never reach these - the seed
    migration caps systolic BP at 151 - so this fixture creates the one row
    the suite needs. Depends on _open_db_pool explicitly since autouse
    fixture ordering isn't otherwise guaranteed."""
    patient = patient_repository.get_patient_by_email(CRITICAL_CASE_EMAIL)
    if not patient:
        raise RuntimeError(f"Expected seeded patient {CRITICAL_CASE_EMAIL!r} not found — is the dev DB seeded?")

    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT visit_id FROM visits WHERE patient_serial_number = %s AND chief_complaint = %s",
                (patient.patient_serial_number, CRITICAL_CASE_MARKER),
            )
            existing = cur.fetchone()
            if existing:
                return CRITICAL_CASE_EMAIL

            cur.execute("SELECT doctor_serial_number FROM doctors LIMIT 1")
            doctor_row = cur.fetchone()
            if not doctor_row:
                raise RuntimeError("No seeded doctor found — is the dev DB seeded?")
            doctor_serial = doctor_row[0]

    visit_id = visit_repository.create_visit(
        patient_serial_number=patient.patient_serial_number,
        doctor_serial_number=doctor_serial,
        visit_type="checkup",
        location="Clinic A",
        status="completed",
        chief_complaint=CRITICAL_CASE_MARKER,
    )
    vital_signs_repository.create_vital_signs(
        visit_id=visit_id,
        blood_pressure_systolic=185,
        blood_pressure_diastolic=110,
        heart_rate=98,
        temperature=37.0,
        oxygen_saturation=96.0,
        pain_level=9,
    )

    return CRITICAL_CASE_EMAIL
