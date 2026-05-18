CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    doctor_id   VARCHAR(20),
    doctor_name VARCHAR(255),
    method      VARCHAR(10) NOT NULL,
    path        TEXT NOT NULL,
    status_code INT NOT NULL,
    ip_address  INET,
    duration_ms INT
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_doctor_id_idx  ON audit_logs (doctor_id);
