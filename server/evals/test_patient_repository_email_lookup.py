from repositories import patient_repository


def test_get_patient_by_email_returns_seeded_patient():
    patient = patient_repository.get_patient_by_email("priya.sharma@gmail.com")

    assert patient is not None
    assert patient.first_name == "Priya"
    assert patient.last_name == "Sharma"
    assert patient.patient_serial_number.startswith("P")


def test_get_patient_by_email_returns_none_for_unknown_email():
    assert patient_repository.get_patient_by_email("no-such-patient@example.com") is None
