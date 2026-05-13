\c healthcare_agent

ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- default doctor doctor_serial_number hardcoded for testing purposes only
-- password is 123123123
UPDATE doctors SET password_hash = '$2b$10$jsU1EogKnBAb780EQNvCReE07NCwHxKZv4gS9BS8TPWW3nmL2ZonG' WHERE doctor_serial_number = 'Dsn90mA2';