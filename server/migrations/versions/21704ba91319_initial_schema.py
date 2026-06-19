"""initial_schema

Revision ID: 21704ba91319
Revises:
Create Date: 2026-06-11 00:04:45.113080

"""
from typing import Sequence, Union

from alembic import op

revision: str = '21704ba91319'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- extensions -------------------------------------------------------
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # --- shared functions -------------------------------------------------
    op.execute("""
        CREATE OR REPLACE FUNCTION generate_login_id(prefix CHAR(1) DEFAULT 'P')
        RETURNS VARCHAR(8) AS $$
        DECLARE
            chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}';
            result text := '';
            i integer := 0;
        BEGIN
            result := prefix;
            FOR i IN 1..7 LOOP
                result := result || chars[ceil(61 * random())];
            END LOOP;
            RETURN result;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP(0);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # --- tables -----------------------------------------------------------
    op.execute("""
        CREATE TABLE patients (
            patient_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_serial_number   VARCHAR(8) UNIQUE NOT NULL DEFAULT generate_login_id('P'),
            first_name              VARCHAR(100) NOT NULL,
            last_name               VARCHAR(100) NOT NULL,
            date_of_birth           DATE NOT NULL,
            gender                  VARCHAR(20)  CONSTRAINT patients_gender_check     CHECK (gender IN ('Male', 'Female')),
            blood_type              VARCHAR(5)   CONSTRAINT patients_blood_type_check CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
            email                   VARCHAR(255) UNIQUE,
            phone                   VARCHAR(20),
            address                 TEXT,
            emergency_contact_name  VARCHAR(200),
            emergency_contact_phone VARCHAR(20),
            allergies               TEXT[],
            chronic_conditions      TEXT[],
            created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
        CREATE TABLE doctors (
            doctor_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            doctor_serial_number  VARCHAR(8) UNIQUE NOT NULL DEFAULT generate_login_id('D'),
            first_name            VARCHAR(100) NOT NULL,
            last_name             VARCHAR(100) NOT NULL,
            specialty             VARCHAR(100) NOT NULL,
            license_number        VARCHAR(50) UNIQUE NOT NULL,
            email                 VARCHAR(255) UNIQUE,
            phone                 VARCHAR(20),
            created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
        CREATE TABLE visits (
            visit_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_serial_number VARCHAR(8) NOT NULL REFERENCES patients(patient_serial_number) ON DELETE CASCADE,
            doctor_serial_number  VARCHAR(8) NOT NULL REFERENCES doctors(doctor_serial_number)  ON DELETE CASCADE,
            visit_date            TIMESTAMP NOT NULL,
            visit_type            VARCHAR(50) NOT NULL CONSTRAINT visits_visit_type_check CHECK (visit_type IN (
                                      'checkup', 'followup', 'emergency', 'specialist', 'vaccination',
                                      'routine', 'urgent_care', 'surgical', 'telehealth'
                                  )),
            chief_complaint       TEXT,
            status                VARCHAR(20) DEFAULT 'completed' CONSTRAINT visits_status_check CHECK (status IN (
                                      'scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'
                                  )),
            duration_minutes      INTEGER,
            location              VARCHAR(100),
            created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
        CREATE TABLE vital_signs (
            vital_id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            visit_id                  UUID NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
            measurement_time          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            blood_pressure_systolic   INTEGER      CONSTRAINT vital_signs_blood_pressure_systolic_check  CHECK (blood_pressure_systolic  BETWEEN 50  AND 250),
            blood_pressure_diastolic  INTEGER      CONSTRAINT vital_signs_blood_pressure_diastolic_check CHECK (blood_pressure_diastolic BETWEEN 30  AND 150),
            heart_rate                INTEGER      CONSTRAINT vital_signs_heart_rate_check               CHECK (heart_rate               BETWEEN 30  AND 250),
            temperature               DECIMAL(4,2) CONSTRAINT vital_signs_temperature_check              CHECK (temperature              BETWEEN 34  AND 43),
            respiratory_rate          INTEGER      CONSTRAINT vital_signs_respiratory_rate_check         CHECK (respiratory_rate         BETWEEN 8   AND 60),
            oxygen_saturation         DECIMAL(5,2) CONSTRAINT vital_signs_oxygen_saturation_check        CHECK (oxygen_saturation        BETWEEN 70  AND 100),
            weight_kg                 DECIMAL(5,2) CONSTRAINT vital_signs_weight_kg_check                CHECK (weight_kg > 0),
            height_cm                 DECIMAL(5,2) CONSTRAINT vital_signs_height_cm_check                CHECK (height_cm > 0),
            bmi                       DECIMAL(5,2),
            pain_level                INTEGER      CONSTRAINT vital_signs_pain_level_check               CHECK (pain_level               BETWEEN 0   AND 10),
            notes                     TEXT
        );
    """)

    op.execute("""
        CREATE TABLE medications (
            medication_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_serial_number VARCHAR(8) NOT NULL REFERENCES patients(patient_serial_number) ON DELETE CASCADE,
            doctor_serial_number  VARCHAR(8) REFERENCES doctors(doctor_serial_number),
            medication_name       VARCHAR(200) NOT NULL,
            generic_name          VARCHAR(200),
            dosage                VARCHAR(100) NOT NULL,
            frequency             VARCHAR(100) NOT NULL,
            start_date            DATE NOT NULL,
            end_date              DATE,
            status                VARCHAR(20) DEFAULT 'active' CONSTRAINT medications_status_check CHECK (status IN (
                                      'active', 'discontinued', 'completed', 'hold'
                                  )),
            prescribed_for        TEXT,
            instructions          TEXT,
            created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
        CREATE TABLE lab_results (
            lab_id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_serial_number            VARCHAR(8) NOT NULL REFERENCES patients(patient_serial_number) ON DELETE CASCADE,
            visit_id                         UUID REFERENCES visits(visit_id),
            test_name                        VARCHAR(200) NOT NULL,
            result_value                     VARCHAR(100) NOT NULL,
            unit                             VARCHAR(50),
            reference_range                  VARCHAR(100),
            result_status                    VARCHAR(20) CONSTRAINT lab_results_result_status_check CHECK (result_status IN (
                                                 'normal', 'abnormal', 'critical', 'pending'
                                             )),
            tested_date                      TIMESTAMP NOT NULL,
            received_date                    TIMESTAMP,
            ordering_doctors_serial_number   VARCHAR(8) REFERENCES doctors(doctor_serial_number),
            created_at                       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
        CREATE TABLE clinical_notes (
            note_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            visit_id             UUID NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
            doctor_serial_number VARCHAR(8) NOT NULL REFERENCES doctors(doctor_serial_number),
            note_type            VARCHAR(50) NOT NULL CONSTRAINT clinical_notes_note_type_check CHECK (note_type IN (
                                     'soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan',
                                     'progress_note', 'consult_note', 'discharge_summary', 'procedure_note'
                                 )),
            note_text            TEXT NOT NULL,
            summary              TEXT,
            created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
        CREATE TABLE diagnoses (
            diagnosis_id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            patient_serial_number            VARCHAR(8) NOT NULL REFERENCES patients(patient_serial_number) ON DELETE CASCADE,
            visit_id                         UUID REFERENCES visits(visit_id),
            diagnosis_code                   VARCHAR(20),
            diagnosis_name                   VARCHAR(200) NOT NULL,
            diagnosis_type                   VARCHAR(50) CONSTRAINT diagnoses_diagnosis_type_check CHECK (diagnosis_type IN (
                                                 'primary', 'secondary', 'chronic', 'acute'
                                             )),
            status                           VARCHAR(20) DEFAULT 'active' CONSTRAINT diagnoses_status_check CHECK (status IN (
                                                 'active', 'resolved', 'chronic'
                                             )),
            diagnosed_date                   DATE NOT NULL,
            resolved_date                    DATE,
            diagnosing_doctors_serial_number VARCHAR(8) REFERENCES doctors(doctor_serial_number),
            created_at                       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    op.execute("""
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
    """)

    # --- indexes ----------------------------------------------------------
    op.execute("CREATE INDEX idx_patients_serial_number    ON patients(patient_serial_number)")
    op.execute("CREATE INDEX idx_visits_patient            ON visits(patient_serial_number)")
    op.execute("CREATE INDEX idx_visits_date               ON visits(visit_date)")
    op.execute("CREATE INDEX idx_visits_doctors            ON visits(doctor_serial_number)")
    op.execute("CREATE INDEX idx_visits_patient_date       ON visits(patient_serial_number, visit_date DESC)")
    op.execute("CREATE INDEX idx_medications_patient       ON medications(patient_serial_number)")
    op.execute("CREATE INDEX idx_clinical_notes_visit      ON clinical_notes(visit_id)")
    op.execute("CREATE INDEX idx_clinical_notes_created    ON clinical_notes(created_at DESC)")
    op.execute("CREATE INDEX idx_vitals_visit              ON vital_signs(visit_id)")
    op.execute("CREATE INDEX idx_vitals_measurement_time   ON vital_signs(measurement_time DESC)")
    op.execute("CREATE INDEX idx_lab_results_patient       ON lab_results(patient_serial_number)")
    op.execute("CREATE INDEX idx_lab_results_date          ON lab_results(tested_date DESC)")
    op.execute("CREATE INDEX idx_diagnoses_patient         ON diagnoses(patient_serial_number)")
    op.execute("CREATE INDEX idx_diagnoses_status          ON diagnoses(status)")
    op.execute("CREATE INDEX audit_logs_created_at_idx     ON audit_logs(created_at DESC)")
    op.execute("CREATE INDEX audit_logs_doctor_id_idx      ON audit_logs(doctor_id)")
    op.execute("""
        CREATE INDEX idx_doctors_serial_covering
            ON doctors(doctor_serial_number)
            INCLUDE (first_name, last_name, specialty)
    """)

    # --- triggers ---------------------------------------------------------
    op.execute("""
        CREATE OR REPLACE FUNCTION calculate_bmi()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL AND NEW.height_cm > 0 THEN
                NEW.bmi = NEW.weight_kg / ((NEW.height_cm / 100) * (NEW.height_cm / 100));
            ELSE
                NEW.bmi = NULL;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER trigger_calculate_bmi
            BEFORE INSERT OR UPDATE ON vital_signs
            FOR EACH ROW EXECUTE FUNCTION calculate_bmi();
    """)
    op.execute("""
        CREATE TRIGGER update_patients_updated_at
            BEFORE UPDATE ON patients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_visits_updated_at
            BEFORE UPDATE ON visits
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_medications_updated_at
            BEFORE UPDATE ON medications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    op.execute("""
        CREATE TRIGGER update_clinical_notes_updated_at
            BEFORE UPDATE ON clinical_notes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    op.execute("""
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
    """)
    op.execute("""
        CREATE TRIGGER audit_logs_no_update
            BEFORE UPDATE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_deny_mutation();
    """)
    op.execute("""
        CREATE TRIGGER audit_logs_no_delete
            BEFORE DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_deny_mutation();
    """)

    # --- views ------------------------------------------------------------
    op.execute("""
        CREATE VIEW patient_summary AS
        SELECT
            p.patient_serial_number,
            p.first_name || ' ' || p.last_name AS full_name,
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) AS age,
            p.gender,
            p.blood_type,
            p.allergies,
            p.chronic_conditions,
            COUNT(DISTINCT v.visit_id)       AS total_visits,
            MAX(v.visit_date)                AS last_visit_date,
            COUNT(DISTINCT m.medication_id)  AS active_medications_count
        FROM patients p
        LEFT JOIN visits      v ON p.patient_serial_number = v.patient_serial_number
        LEFT JOIN medications m ON p.patient_serial_number = m.patient_serial_number AND m.status = 'active'
        GROUP BY p.patient_serial_number, p.first_name, p.last_name, p.date_of_birth,
                 p.gender, p.blood_type, p.allergies, p.chronic_conditions;
    """)

    op.execute("""
        CREATE VIEW active_medications AS
        SELECT
            m.*,
            p.first_name   || ' ' || p.last_name   AS patient_name,
            prv.first_name || ' ' || prv.last_name AS doctor_name
        FROM medications m
        JOIN  patients p   ON m.patient_serial_number = p.patient_serial_number
        LEFT JOIN doctors prv ON m.doctor_serial_number  = prv.doctor_serial_number
        WHERE m.status = 'active'
          AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE);
    """)

    op.execute("""
        CREATE VIEW recent_visits_summary AS
        SELECT
            v.visit_id,
            v.visit_date,
            v.visit_type,
            v.chief_complaint,
            p.first_name   || ' ' || p.last_name   AS patient_name,
            prv.first_name || ' ' || prv.last_name AS doctors_name,
            vs.blood_pressure_systolic,
            vs.blood_pressure_diastolic,
            vs.heart_rate,
            vs.temperature,
            vs.oxygen_saturation
        FROM visits v
        JOIN  patients    p  ON v.patient_serial_number = p.patient_serial_number
        JOIN  doctors     prv ON v.doctor_serial_number  = prv.doctor_serial_number
        LEFT JOIN vital_signs vs ON v.visit_id = vs.visit_id
        ORDER BY v.visit_date DESC;
    """)

    # --- doctors extras (003_alter_doctors, 006_google_oauth) -------------
    op.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS password_hash       VARCHAR(255)")
    op.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_access_token  TEXT")
    op.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_refresh_token TEXT")
    op.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS google_token_expiry  TIMESTAMP")


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS recent_visits_summary")
    op.execute("DROP VIEW IF EXISTS active_medications")
    op.execute("DROP VIEW IF EXISTS patient_summary")

    op.execute("DROP TABLE IF EXISTS audit_logs")
    op.execute("DROP FUNCTION IF EXISTS audit_logs_deny_mutation()")

    op.execute("DROP TABLE IF EXISTS diagnoses")
    op.execute("DROP TABLE IF EXISTS clinical_notes")
    op.execute("DROP TABLE IF EXISTS lab_results")
    op.execute("DROP TABLE IF EXISTS medications")
    op.execute("DROP TABLE IF EXISTS vital_signs")
    op.execute("DROP TABLE IF EXISTS visits")
    op.execute("DROP TABLE IF EXISTS doctors")
    op.execute("DROP TABLE IF EXISTS patients")

    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")
    op.execute("DROP FUNCTION IF EXISTS calculate_bmi()")
    op.execute("DROP FUNCTION IF EXISTS generate_login_id(CHAR)")
