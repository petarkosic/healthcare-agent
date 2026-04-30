/c healthcare_agent

ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);