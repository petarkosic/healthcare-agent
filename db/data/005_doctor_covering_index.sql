-- Covering index for doctor JOIN columns accessed in every patient query.
-- Eliminates heap fetches when joining doctors in get_patient_full CTEs and get_patients.

CREATE INDEX idx_doctors_serial_covering
    ON doctors(doctor_serial_number)
    INCLUDE (first_name, last_name, specialty);