export const VISIT_TYPES = [
	'checkup',
	'followup',
	'emergency',
	'specialist',
	'vaccination',
	'routine',
	'urgent_care',
	'surgical',
	'telehealth',
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_STATUSES = [
	'scheduled',
	'in-progress',
	'completed',
	'cancelled',
	'no-show',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_LOCATIONS = [
	'Clinic',
	'Hospital',
	'Telehealth',
	'Home Visit',
	'Urgent Care',
] as const;
export type VisitLocation = (typeof VISIT_LOCATIONS)[number];

export const MEDICATION_STATUSES = [
	'active',
	'discontinued',
	'completed',
	'hold',
] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export const RESULT_STATUSES = [
	'normal',
	'abnormal',
	'critical',
	'pending',
] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const DIAGNOSIS_TYPES = [
	'primary',
	'secondary',
	'chronic',
	'acute',
] as const;
export type DiagnosisType = (typeof DIAGNOSIS_TYPES)[number];

export const DIAGNOSIS_STATUSES = ['active', 'resolved', 'chronic'] as const;
export type DiagnosisStatus = (typeof DIAGNOSIS_STATUSES)[number];

export const GENDERS = ['Male', 'Female'] as const;
export type Gender = (typeof GENDERS)[number];

export const BLOOD_TYPES = [
	'A+',
	'A-',
	'B+',
	'B-',
	'AB+',
	'AB-',
	'O+',
	'O-',
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const NOTE_TYPES = [
	'soap_subjective',
	'soap_objective',
	'soap_assessment',
	'soap_plan',
	'progress_note',
	'consult_note',
	'discharge_summary',
	'procedure_note',
] as const;
export type NoteType = (typeof NOTE_TYPES)[number];
