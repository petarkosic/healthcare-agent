from typing import Optional
from .base_repository import BaseRepository
from models.patients import PatientBase, PatientFullResponse, VisitResponse, VitalSignsResponse, MedicationResponse, LabResultResponse, ClinicalNoteResponse, DiagnosisResponse

class PatientRepository(BaseRepository):
    def __init__(self):
        super().__init__("patients")

    def get_patient_full(self, patient_serial_number: str) -> Optional[PatientFullResponse]:
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    WITH
                      visits_cte AS (
                        SELECT v.*, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialty
                        FROM visits v
                        JOIN doctors d ON v.doctor_serial_number = d.doctor_serial_number
                        WHERE v.patient_serial_number = %s
                        ORDER BY v.visit_date DESC
                      ),
                      vital_signs_cte AS (
                        SELECT vs.*, v.visit_date
                        FROM vital_signs vs
                        JOIN visits v ON vs.visit_id = v.visit_id
                        WHERE v.patient_serial_number = %s
                        ORDER BY vs.measurement_time DESC
                      ),
                      medications_cte AS (
                        SELECT m.*, d.first_name AS prescriber_first_name, d.last_name AS prescriber_last_name
                        FROM medications m
                        LEFT JOIN doctors d ON m.doctor_serial_number = d.doctor_serial_number
                        WHERE m.patient_serial_number = %s
                        ORDER BY m.created_at DESC, m.status
                      ),
                      lab_results_cte AS (
                        SELECT l.*, d.first_name AS ordering_doctor_first_name, d.last_name AS ordering_doctor_last_name
                        FROM lab_results l
                        LEFT JOIN doctors d ON l.ordering_doctors_serial_number = d.doctor_serial_number
                        WHERE l.patient_serial_number = %s
                        ORDER BY l.created_at DESC
                      ),
                      clinical_notes_cte AS (
                        SELECT cn.*, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, v.visit_date
                        FROM clinical_notes cn
                        JOIN doctors d ON cn.doctor_serial_number = d.doctor_serial_number
                        JOIN visits v ON cn.visit_id = v.visit_id
                        WHERE v.patient_serial_number = %s
                        ORDER BY cn.created_at DESC
                      ),
                      diagnoses_cte AS (
                        SELECT diag.*, d.first_name AS diagnosing_doctor_first_name, d.last_name AS diagnosing_doctor_last_name
                        FROM diagnoses diag
                        LEFT JOIN doctors d ON diag.diagnosing_doctors_serial_number = d.doctor_serial_number
                        WHERE diag.patient_serial_number = %s
                        ORDER BY diag.created_at DESC, diag.status
                      )
                    SELECT
                      row_to_json(p.*) AS patient,
                      COALESCE((SELECT json_agg(vc.*) FROM visits_cte vc),        '[]'::json) AS visits,
                      COALESCE((SELECT json_agg(vs.*) FROM vital_signs_cte vs),   '[]'::json) AS vital_signs,
                      COALESCE((SELECT json_agg(mc.*) FROM medications_cte mc),   '[]'::json) AS medications,
                      COALESCE((SELECT json_agg(lc.*) FROM lab_results_cte lc),   '[]'::json) AS lab_results,
                      COALESCE((SELECT json_agg(nc.*) FROM clinical_notes_cte nc),'[]'::json) AS clinical_notes,
                      COALESCE((SELECT json_agg(dc.*) FROM diagnoses_cte dc),     '[]'::json) AS diagnoses
                    FROM patients p
                    WHERE p.patient_serial_number = %s
                """, (patient_serial_number,) * 7)

                row = cur.fetchone()
                if not row:
                    return None

                patient_data, visits, vital_signs, medications, lab_results, clinical_notes, diagnoses = row

                return PatientFullResponse(
                    patient=PatientBase(**patient_data),
                    visits=[VisitResponse(**v) for v in visits],
                    vital_signs=[VitalSignsResponse(**v) for v in vital_signs],
                    medications=[MedicationResponse(**m) for m in medications],
                    lab_results=[LabResultResponse(**l) for l in lab_results],
                    clinical_notes=[ClinicalNoteResponse(**n) for n in clinical_notes],
                    diagnoses=[DiagnosisResponse(**d) for d in diagnoses],
                )

    def create_patient(self, data, conn=None) -> Optional[str]:
        return self._execute_insert(
            """
            INSERT INTO patients (
                first_name, last_name, date_of_birth, gender, blood_type,
                email, phone, address, emergency_contact_name, emergency_contact_phone,
                allergies, chronic_conditions
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING patient_serial_number
            """,
            (
                data.first_name, data.last_name, data.date_of_birth, data.gender,
                data.blood_type, data.email, data.phone, data.address,
                data.emergency_contact_name, data.emergency_contact_phone,
                data.allergies, data.chronic_conditions,
            ),
            conn=conn,
        )

    def get_patients(self, doctor_serial_number: str, limit: int = 100, offset: int = 0):
        return self._execute_query(
            """
            SELECT
                p.patient_serial_number,
                p.first_name || ' ' || p.last_name AS full_name,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) AS age,
                p.gender,
                COUNT(DISTINCT v.visit_id) AS total_visits,
                MAX(CASE WHEN v.status = 'completed' THEN v.visit_date END) AS last_visit_date,
                COUNT(DISTINCT m.medication_id) AS active_medications_count
            FROM patients p
            JOIN visits v ON p.patient_serial_number = v.patient_serial_number
            LEFT JOIN medications m ON p.patient_serial_number = m.patient_serial_number AND m.status = 'active'
            WHERE v.doctor_serial_number = %s
            GROUP BY p.patient_serial_number, p.first_name, p.last_name, p.date_of_birth, p.gender, p.created_at
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s
            """,
            (doctor_serial_number, limit, offset),
        )

    def search_by_serial(self, patient_serial_number: str, doctor_serial_number: str):
        return self._execute_query(
            """
            SELECT
                p.patient_serial_number,
                p.first_name || ' ' || p.last_name AS full_name,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) AS age,
                p.gender,
                COUNT(DISTINCT v.visit_id) AS total_visits,
                MAX(CASE WHEN v.status = 'completed' THEN v.visit_date END) AS last_visit_date,
                COUNT(DISTINCT m.medication_id) AS active_medications_count
            FROM patients p
            JOIN visits v ON p.patient_serial_number = v.patient_serial_number
            LEFT JOIN medications m ON p.patient_serial_number = m.patient_serial_number
                AND m.status = 'active'
            WHERE v.doctor_serial_number = %s
            AND p.patient_serial_number = %s
            GROUP BY p.patient_serial_number, p.first_name, p.last_name, p.date_of_birth, p.gender
            """,
            (doctor_serial_number, patient_serial_number),
        )

    def update_allergies(self, patient_serial_number: str, allergies: list[str]) -> bool:
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE patients SET allergies = %s WHERE patient_serial_number = %s",
                    (allergies, patient_serial_number)
                )

                conn.commit()
                
                return cur.rowcount > 0

patient_repository = PatientRepository()