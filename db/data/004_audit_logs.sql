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

-- Block UPDATE always; block DELETE for records younger than 6 years (HIPAA minimum retention)
CREATE OR REPLACE FUNCTION audit_logs_deny_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'audit_logs is append-only — UPDATE forbidden';
    END IF;
    IF TG_OP = 'DELETE' THEN
        IF OLD.created_at > NOW() - INTERVAL '6 years' THEN
            RAISE EXCEPTION 'HIPAA retention policy — cannot delete audit records younger than 6 years';
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_deny_mutation();

CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_deny_mutation();
