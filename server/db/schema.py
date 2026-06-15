from sqlalchemy import (
    CheckConstraint, Column, Date, DateTime, DDL, Index,
    Integer, Numeric, String, Text, ForeignKey, ARRAY, event, text,
)
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Extensions + functions (must exist before tables that reference them)

event.listen(
    Base.metadata, "before_create",
    DDL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'),
)

event.listen(
    Base.metadata, "before_create",
    DDL("""
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
        $$ LANGUAGE plpgsql
    """),
)

event.listen(
    Base.metadata, "before_create",
    DDL("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP(0);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """),
)


# Tables

class Doctor(Base):
    __tablename__ = "doctors"
    __table_args__ = (
        Index(
            "idx_doctors_serial_covering",
            "doctor_serial_number",
            postgresql_include=["first_name", "last_name", "specialty"],
        ),
    )

    doctor_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    doctor_serial_number = Column(String(8), unique=True, nullable=False, server_default=text("generate_login_id('D')"))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True)
    phone = Column(String(20))
    password_hash = Column(String(255))
    google_access_token = Column(Text)
    google_refresh_token = Column(Text)
    google_token_expiry = Column(DateTime)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint("gender IN ('Male', 'Female')", name="patients_gender_check"),
        CheckConstraint(
            "blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')",
            name="patients_blood_type_check",
        ),
        Index("idx_patients_serial_number", "patient_serial_number"),
    )

    patient_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    patient_serial_number = Column(String(8), unique=True, nullable=False, server_default=text("generate_login_id('P')"))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20))
    blood_type = Column(String(5))
    email = Column(String(255), unique=True)
    phone = Column(String(20))
    address = Column(Text)
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))
    allergies = Column(ARRAY(Text))
    chronic_conditions = Column(ARRAY(Text))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


event.listen(
    Patient.__table__, "after_create",
    DDL("""
        CREATE TRIGGER update_patients_updated_at
            BEFORE UPDATE ON patients
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """),
)


class Visit(Base):
    __tablename__ = "visits"
    __table_args__ = (
        CheckConstraint(
            "visit_type IN ('checkup','followup','emergency','specialist','vaccination','routine','urgent_care','surgical','telehealth')",
            name="visits_visit_type_check",
        ),
        CheckConstraint(
            "status IN ('scheduled','in-progress','completed','cancelled','no-show')",
            name="visits_status_check",
        ),
        Index("idx_visits_patient", "patient_serial_number"),
        Index("idx_visits_date", "visit_date"),
        Index("idx_visits_doctors", "doctor_serial_number"),
        Index("idx_visits_patient_date", "patient_serial_number", "visit_date"),
    )

    visit_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    patient_serial_number = Column(
        String(8), ForeignKey("patients.patient_serial_number", ondelete="CASCADE"), nullable=False
    )
    doctor_serial_number = Column(
        String(8), ForeignKey("doctors.doctor_serial_number", ondelete="CASCADE"), nullable=False
    )
    visit_date = Column(DateTime, nullable=False)
    visit_type = Column(String(50), nullable=False)
    chief_complaint = Column(Text)
    status = Column(String(20), server_default=text("'completed'"))
    duration_minutes = Column(Integer)
    location = Column(String(100))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


event.listen(
    Visit.__table__, "after_create",
    DDL("""
        CREATE TRIGGER update_visits_updated_at
            BEFORE UPDATE ON visits
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """),
)


class VitalSign(Base):
    __tablename__ = "vital_signs"
    __table_args__ = (
        CheckConstraint("blood_pressure_systolic BETWEEN 50 AND 250", name="vital_signs_blood_pressure_systolic_check"),
        CheckConstraint("blood_pressure_diastolic BETWEEN 30 AND 150", name="vital_signs_blood_pressure_diastolic_check"),
        CheckConstraint("heart_rate BETWEEN 30 AND 250", name="vital_signs_heart_rate_check"),
        CheckConstraint("temperature BETWEEN 34 AND 43", name="vital_signs_temperature_check"),
        CheckConstraint("respiratory_rate BETWEEN 8 AND 60", name="vital_signs_respiratory_rate_check"),
        CheckConstraint("oxygen_saturation BETWEEN 70 AND 100", name="vital_signs_oxygen_saturation_check"),
        CheckConstraint("weight_kg > 0", name="vital_signs_weight_kg_check"),
        CheckConstraint("height_cm > 0", name="vital_signs_height_cm_check"),
        CheckConstraint("pain_level BETWEEN 0 AND 10", name="vital_signs_pain_level_check"),
        Index("idx_vitals_visit", "visit_id"),
        Index("idx_vitals_measurement_time", "measurement_time"),
    )

    vital_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.visit_id", ondelete="CASCADE"), nullable=False)
    measurement_time = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    heart_rate = Column(Integer)
    temperature = Column(Numeric(4, 2))
    respiratory_rate = Column(Integer)
    oxygen_saturation = Column(Numeric(4, 2))
    weight_kg = Column(Numeric(5, 2))
    height_cm = Column(Numeric(5, 2))
    bmi = Column(Numeric(5, 2))
    pain_level = Column(Integer)
    notes = Column(Text)


event.listen(
    VitalSign.__table__, "after_create",
    DDL("""
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
        $$ LANGUAGE plpgsql
    """),
)

event.listen(
    VitalSign.__table__, "after_create",
    DDL("""
        CREATE TRIGGER trigger_calculate_bmi
            BEFORE INSERT OR UPDATE ON vital_signs
            FOR EACH ROW
            EXECUTE FUNCTION calculate_bmi()
    """),
)


class Medication(Base):
    __tablename__ = "medications"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active','discontinued','completed','hold')",
            name="medications_status_check",
        ),
        Index("idx_medications_patient", "patient_serial_number"),
    )

    medication_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    patient_serial_number = Column(
        String(8), ForeignKey("patients.patient_serial_number", ondelete="CASCADE"), nullable=False
    )
    doctor_serial_number = Column(String(8), ForeignKey("doctors.doctor_serial_number"))
    medication_name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    status = Column(String(20), server_default=text("'active'"))
    prescribed_for = Column(Text)
    instructions = Column(Text)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


event.listen(
    Medication.__table__, "after_create",
    DDL("""
        CREATE TRIGGER update_medications_updated_at
            BEFORE UPDATE ON medications
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """),
)


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    __table_args__ = (
        CheckConstraint(
            "note_type IN ('soap_subjective','soap_objective','soap_assessment','soap_plan','progress_note','consult_note','discharge_summary','procedure_note')",
            name="clinical_notes_note_type_check",
        ),
        Index("idx_clinical_notes_visit", "visit_id"),
        Index("idx_clinical_notes_created", "created_at"),
    )

    note_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.visit_id", ondelete="CASCADE"), nullable=False)
    doctor_serial_number = Column(String(8), ForeignKey("doctors.doctor_serial_number"), nullable=False)
    note_type = Column(String(50), nullable=False)
    note_text = Column(Text, nullable=False)
    summary = Column(Text)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


event.listen(
    ClinicalNote.__table__, "after_create",
    DDL("""
        CREATE TRIGGER update_clinical_notes_updated_at
            BEFORE UPDATE ON clinical_notes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
    """),
)


class LabResult(Base):
    __tablename__ = "lab_results"
    __table_args__ = (
        CheckConstraint(
            "result_status IN ('normal','abnormal','critical','pending')",
            name="lab_results_result_status_check",
        ),
        Index("idx_lab_results_patient", "patient_serial_number"),
        Index("idx_lab_results_date", "tested_date"),
    )

    lab_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    patient_serial_number = Column(
        String(8), ForeignKey("patients.patient_serial_number", ondelete="CASCADE"), nullable=False
    )
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.visit_id"))
    test_name = Column(String(200), nullable=False)
    result_value = Column(String(100), nullable=False)
    unit = Column(String(50))
    reference_range = Column(String(100))
    result_status = Column(String(20))
    tested_date = Column(DateTime, nullable=False)
    received_date = Column(DateTime)
    ordering_doctors_serial_number = Column(String(8), ForeignKey("doctors.doctor_serial_number"))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    __table_args__ = (
        CheckConstraint(
            "diagnosis_type IN ('primary','secondary','chronic','acute')",
            name="diagnoses_diagnosis_type_check",
        ),
        CheckConstraint(
            "status IN ('active','resolved','chronic')",
            name="diagnoses_status_check",
        ),
        Index("idx_diagnoses_patient", "patient_serial_number"),
        Index("idx_diagnoses_status", "status"),
    )

    diagnosis_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    patient_serial_number = Column(
        String(8), ForeignKey("patients.patient_serial_number", ondelete="CASCADE"), nullable=False
    )
    visit_id = Column(UUID(as_uuid=True), ForeignKey("visits.visit_id"))
    diagnosis_code = Column(String(20))
    diagnosis_name = Column(String(200), nullable=False)
    diagnosis_type = Column(String(50))
    status = Column(String(20), server_default=text("'active'"))
    diagnosed_date = Column(Date, nullable=False)
    resolved_date = Column(Date)
    diagnosing_doctors_serial_number = Column(String(8), ForeignKey("doctors.doctor_serial_number"))
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("audit_logs_created_at_idx", "created_at"),
        Index("audit_logs_doctor_id_idx", "doctor_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    doctor_id = Column(String(20))
    doctor_name = Column(String(255))
    method = Column(String(10), nullable=False)
    path = Column(Text, nullable=False)
    status_code = Column(Integer, nullable=False)
    ip_address = Column(INET)
    duration_ms = Column(Integer)


event.listen(
    AuditLog.__table__, "after_create",
    DDL("""
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
        $$
    """),
)

event.listen(
    AuditLog.__table__, "after_create",
    DDL("""
        CREATE TRIGGER audit_logs_no_update
            BEFORE UPDATE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_deny_mutation()
    """),
)

event.listen(
    AuditLog.__table__, "after_create",
    DDL("""
        CREATE TRIGGER audit_logs_no_delete
            BEFORE DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_deny_mutation()
    """),
)


# Views (after all tables exist)

event.listen(
    Base.metadata, "after_create",
    DDL("""
        CREATE VIEW patient_summary AS
        SELECT
            p.patient_serial_number,
            p.first_name || ' ' || p.last_name AS full_name,
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) AS age,
            p.gender,
            p.blood_type,
            p.allergies,
            p.chronic_conditions,
            COUNT(DISTINCT v.visit_id) AS total_visits,
            MAX(v.visit_date) AS last_visit_date,
            COUNT(DISTINCT m.medication_id) AS active_medications_count
        FROM patients p
        LEFT JOIN visits v ON p.patient_serial_number = v.patient_serial_number
        LEFT JOIN medications m ON p.patient_serial_number = m.patient_serial_number AND m.status = 'active'
        GROUP BY
            p.patient_serial_number, p.first_name, p.last_name,
            p.date_of_birth, p.gender, p.blood_type, p.allergies, p.chronic_conditions
    """),
)

event.listen(
    Base.metadata, "after_create",
    DDL("""
        CREATE VIEW active_medications AS
        SELECT
            m.*,
            p.first_name || ' ' || p.last_name AS patient_name,
            prv.first_name || ' ' || prv.last_name AS doctor_name
        FROM medications m
        JOIN patients p ON m.patient_serial_number = p.patient_serial_number
        LEFT JOIN doctors prv ON m.doctor_serial_number = prv.doctor_serial_number
        WHERE m.status = 'active'
        AND (m.end_date IS NULL OR m.end_date >= CURRENT_DATE)
    """),
)

event.listen(
    Base.metadata, "after_create",
    DDL("""
        CREATE VIEW recent_visits_summary AS
        SELECT
            v.visit_id,
            v.visit_date,
            v.visit_type,
            v.chief_complaint,
            p.first_name || ' ' || p.last_name AS patient_name,
            prv.first_name || ' ' || prv.last_name AS doctors_name,
            vs.blood_pressure_systolic,
            vs.blood_pressure_diastolic,
            vs.heart_rate,
            vs.temperature,
            vs.oxygen_saturation
        FROM visits v
        JOIN patients p ON v.patient_serial_number = p.patient_serial_number
        JOIN doctors prv ON v.doctor_serial_number = prv.doctor_serial_number
        LEFT JOIN vital_signs vs ON v.visit_id = vs.visit_id
        ORDER BY v.visit_date DESC
    """),
)
