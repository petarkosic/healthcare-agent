export type Error = {
	message: string;
};

export interface TPatients {
	patient_serial_number: number;
	full_name: string;
	age: number;
	gender: string;
	blood_type: string;
	allergies: string[];
	chronic_conditions: string[];
	total_visits: number;
	last_visit_date: string;
	active_medications_count: number;
}

interface PatientBase {
	address: string;
	allergies: string[];
	blood_type: string;
	chronic_conditions: string[];
	created_at: string;
	date_of_birth: string;
	email: string;
	emergency_contact_name: string;
	emergency_contact_phone: string;
	first_name: string;
	gender: string;
	last_name: string;
	patient_id: string;
	patient_serial_number: string;
	phone: string;
	updated_at: string;
}

export interface Visit {
	chief_complaint: string;
	created_at: string;
	doctor_first_name: string;
	doctor_last_name: string;
	doctor_serial_number: string;
	duration_minutes: number;
	location: string;
	patient_serial_number: string;
	specialty: string;
	status: string;
	updated_at: string;
	visit_date: string;
	visit_id: string;
	visit_type: string;
}

export interface VitalSigns {
	blood_pressure_diastolic: number;
	blood_pressure_systolic: number;
	bmi: number;
	heart_rate: number;
	height_cm: number;
	measurement_time: string;
	notes: string;
	oxygen_saturation: number;
	pain_level: number;
	respiratory_rate: number;
	temperature: number;
	visit_date: string;
	visit_id: string;
	vital_id: string;
	weight_kg: number;
}

interface Medication {
	created_at: string;
	doctor_serial_number: string;
	dosage: string;
	end_date: string;
	frequency: string;
	generic_name: string;
	instructions: string;
	medication_id: string;
	medication_name: string;
	patient_serial_number: string;
	prescribed_for: string;
	prescriber_first_name: string;
	prescriber_last_name: string;
	start_date: string;
	status: string;
	updated_at: string;
}

interface LabResult {
	created_at: string;
	lab_id: string;
	ordering_doctor_first_name: string;
	ordering_doctor_last_name: string;
	ordering_doctors_serial_number: string;
	patient_serial_number: string;
	received_date: string;
	reference_range: string;
	result_status: string;
	result_value: string;
	test_name: string;
	tested_date: string;
	unit: string;
	visit_id: string;
}

export interface Diagnosis {
	created_at: string;
	diagnosed_date: string;
	diagnosing_doctor_first_name: string;
	diagnosing_doctor_last_name: string;
	diagnosing_doctors_serial_number: string;
	diagnosis_code: string;
	diagnosis_id: string;
	diagnosis_name: string;
	diagnosis_type: string;
	patient_serial_number: string;
	resolved_date: string;
	status: string;
	visit_id: string;
}

export interface ClinicalNote {
	created_at: string;
	doctor_first_name: string;
	doctor_last_name: string;
	doctor_serial_number: string;
	note_id: string;
	note_text: string;
	note_type: string;
	summary: string;
	updated_at: string;
	visit_date: string;
	visit_id: string;
}

export interface PatientFullResponse {
	patient: PatientBase;
	visits: Visit[];
	vital_signs: VitalSigns[];
	medications: Medication[];
	lab_results: LabResult[];
	clinical_notes: ClinicalNote[];
	diagnoses: Diagnosis[];
}

interface AIOverview {
	critical_alerts: string[];
	overview: string;
	stability: string;
	suggested_questions: string[];
}

interface ActiveDiagnoses {
	code: string;
	name: string;
	type: string;
	status: string;
}

interface ActiveMedications {
	name: string;
	dosage: string;
	frequency: string;
	reason: string;
}

interface LatestLab {
	date: string;
	reference_range: string;
	result: string;
	status: string;
	test_name: string;
	unit: string;
}

interface LatestVisit {
	chief_complaint: string;
	date: string;
	doctor: string;
	specialty: string;
	status: string;
	type: string;
	visit_id: string;
}

interface LatestVitals {
	blood_pressure: string;
	bmi: number;
	heart_rate: number;
	measured_at: string;
	oxygen_saturation: number;
	pain_level: number;
	temperature: number;
}

interface RawData {
	active_diagnoses: ActiveDiagnoses[];
	active_medications: ActiveMedications[];
	alergies: string[];
	blood_type: string;
	chronic_conditions: string[];
	full_name: string;
	gender: string;
	latest_lab: LatestLab;
	latest_visit: LatestVisit;
	latest_vitals: LatestVitals;
	patient_serial_number: string;
}

export interface Overview {
	patient_serial: number;
	ai_overview: AIOverview;
	raw_data: RawData;
	chroma_sources: number;
}

export type Recommendation = {
	recommendation: string;
	reason: string;
	priority: string;
};

export type MedicationChange = {
	action: string;
	name: string;
	dosage: string;
	frequency: string;
	reason: string;
};

type CurrentMedication = {
	name: string;
	dosage: string;
	frequency: string;
};

export type RecommendationsResponse = {
	recommendations?: Recommendation[];
};

export type MedicationsResponse = {
	medications: {
		current_medications: CurrentMedication[];
		prescribed_changes: MedicationChange[];
	};
};

export type ResponseData = RecommendationsResponse | MedicationsResponse;
