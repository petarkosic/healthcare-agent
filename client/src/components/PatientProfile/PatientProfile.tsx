import { useState, useEffect } from 'react';
import './PatientProfile.css';
import { useParams } from 'react-router';

type Error = {
	message: string;
};

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

interface Visit {
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

interface VitalSigns {
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

interface Diagnosis {
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

interface ClinicalNote {
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

interface PatientFullResponse {
	patient: PatientBase;
	visits: Visit[];
	vital_signs: VitalSigns[];
	medications: Medication[];
	lab_results: LabResult[];
	clinical_notes: ClinicalNote[];
	diagnoses: Diagnosis[];
}

function PatientProfile() {
	const [data, setData] = useState<PatientFullResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

	const [newNoteType, setNewNoteType] = useState('progress_note');
	const [newNoteText, setNewNoteText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>('');

	const { id: patient_serial } = useParams();

	useEffect(() => {
		const fetchPatient = async () => {
			try {
				const response = await fetch(
					`http://localhost:8000/api/patients/${patient_serial}`
				);

				if (!response.ok) {
					const errorData = await response.json();

					throw new Error(
						errorData.detail || `HTTP error! status: ${response.status}`
					);
				}

				const result = await response.json();

				setData(result);
			} catch (error) {
				const err = error as Error;

				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchPatient();
	}, [patient_serial]);

	const calculateAge = (dob: string) => {
		const diff = Date.now() - new Date(dob).getTime();
		const ageDate = new Date(diff);

		return Math.abs(ageDate.getUTCFullYear() - 1970);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleAddNote = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!data) {
			setError('Patient not found');
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(
				`http://localhost:8000/api/patients/${data.patient.patient_id}/notes`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						visit_id: data.clinical_notes[0]?.visit_id,
						note_type: newNoteType,
						note_text: newNoteText,
						doctor_serial_number: data.clinical_notes[0]?.doctor_serial_number,
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to add note');
			}

			const newNote = await response.json();

			setData((prevData) => {
				if (!prevData) return null;

				return {
					...prevData,
					clinical_notes: [newNote, ...prevData.clinical_notes],
				};
			});
		} catch (error) {
			setError(error as string);
		} finally {
			setIsSubmitting(false);
			setNewNoteText('');
			setIsModalOpen(false);
		}
	};

	const latestVitals = data?.vital_signs.length ? data.vital_signs[0] : null;

	if (loading)
		return <div className='loading-state'>Loading Patient Profile...</div>;

	if (error) return <div className='error-state'>{error}</div>;

	if (!data) return <div className='error-state'>Patient not found.</div>;

	return (
		<div className={`app-wrapper ${isAiSidebarOpen ? 'sidebar-open' : ''}`}>
			<div className='profile-container'>
				{!isAiSidebarOpen && (
					<button
						className='ai-toggle-btn'
						onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
						title={'Open AI Assistant'}
					>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
						</svg>
						<span>AI Assistant</span>
					</button>
				)}

				<div className='profile-header'>
					<div className='header-identity'>
						<h1>
							{data.patient.first_name} {data.patient.last_name}
						</h1>
						<div className='meta-tags'>
							<span className='tag tag-serial'>
								ID: {data.patient.patient_serial_number}
							</span>
							<span className='tag tag-gender'>{data.patient.gender}</span>
							<span className='tag tag-blood'>{data.patient.blood_type}</span>
							<span className='tag tag-age'>
								{calculateAge(data.patient.date_of_birth)} Years Old
							</span>
						</div>
					</div>
					<div className='header-contact'>
						<div>
							<small>Phone</small>
							<div>{data.patient.phone || 'N/A'}</div>
						</div>
						<div>
							<small>Email</small>
							<div>{data.patient.email || 'N/A'}</div>
						</div>
						<div>
							<small>Emergency Contact</small>
							<div>
								{data.patient.emergency_contact_name}
								<br />({data.patient.emergency_contact_phone})
							</div>
						</div>
					</div>
				</div>

				{data.patient.allergies && data.patient.allergies.length > 0 && (
					<div className='allergy-banner'>
						<span className='icon-alert'>⚠️</span>
						<div>
							<strong>Known Allergies:</strong>{' '}
							{data.patient.allergies.join(', ')}
						</div>
					</div>
				)}

				<div className='profile-grid'>
					<div className='card card-vitals'>
						<h3>Latest Vitals</h3>
						{latestVitals ? (
							<div className='vitals-grid'>
								<div className='vital-box'>
									<span className='label'>BP</span>
									<span className='value'>
										{latestVitals.blood_pressure_systolic}/
										{latestVitals.blood_pressure_diastolic}
									</span>
								</div>
								<div className='vital-box'>
									<span className='label'>HR</span>
									<span className='value'>
										{latestVitals.heart_rate} <small>bpm</small>
									</span>
								</div>
								<div className='vital-box'>
									<span className='label'>Temp</span>
									<span className='value'>
										{latestVitals.temperature} <small>°C</small>
									</span>
								</div>
								<div className='vital-box'>
									<span className='label'>BMI</span>
									<span className='value'>
										{latestVitals.bmi ? latestVitals.bmi.toFixed(1) : 'N/A'}
									</span>
								</div>
								<div className='vital-box'>
									<span className='label'>Weight</span>
									<span className='value'>
										{latestVitals.weight_kg} <small>kg</small>
									</span>
								</div>
							</div>
						) : (
							<p className='empty-text'>No vitals recorded.</p>
						)}
					</div>

					<div className='card card-meds'>
						<h3>Active Medications</h3>
						<div className='meds-list'>
							{data.medications
								.filter((m) => m.status === 'active')
								.map((med) => (
									<div key={med.medication_id} className='med-item'>
										<div className='med-main'>
											<strong>{med.medication_name}</strong>{' '}
											{med.generic_name && (
												<span className='generic'>({med.generic_name})</span>
											)}
										</div>
										<div className='med-dosage'>
											{med.dosage} • {med.frequency}
										</div>
									</div>
								))}
						</div>
					</div>

					<div className='card card-notes'>
						<div className='card-header-row'>
							<h3>Clinical Notes</h3>
							<button
								className='btn-primary'
								onClick={() => setIsModalOpen(true)}
							>
								+ New Note
							</button>
						</div>
						<div className='notes-timeline'>
							{data.clinical_notes.length > 0 ? (
								data.clinical_notes.map((note) => (
									<div key={note.note_id} className='note-entry'>
										<div className='note-header'>
											<span
												className={`note-type-badge type-${
													note?.note_type?.split('_')[1] || 'generic'
												}`}
											>
												{note?.note_type?.replace(/_/g, ' ').toUpperCase()}
											</span>
											<span className='note-date'>
												{formatDate(note.created_at)}
											</span>
										</div>
										<div className='note-author'>
											By Dr. {note.doctor_first_name} {note.doctor_last_name}
										</div>
										<div className='note-text'>{note.note_text}</div>
									</div>
								))
							) : (
								<p className='empty-text'>No clinical notes available.</p>
							)}
						</div>
					</div>

					<div className='card card-labs'>
						<div className='card-header-row'>
							<h3>Lab Results</h3>
						</div>
						<table className='mini-table'>
							<thead>
								<tr>
									<th>Test</th>
									<th>Result</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{data.lab_results.slice(0, 4).map((lab) => (
									<tr key={lab.lab_id}>
										<td>{lab.test_name}</td>
										<td>
											{lab.result_value} {lab.unit}
										</td>
										<td>
											<span
												className={`status-badge status-${lab.result_status}`}
											>
												{lab.result_status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className='card card-diagnoses'>
						<h3>Diagnoses History</h3>
						<ul className='diagnoses-list'>
							{data.diagnoses.map((diag) => (
								<li key={diag.diagnosis_id}>
									<div className='diag-header'>
										<strong>{diag.diagnosis_name}</strong>{' '}
										<span className='tag diag-code'>
											{diag.diagnosis_code || 'N/A'}
										</span>
									</div>
									<div className='diag-meta'>
										<span className={`status-badge status-${diag.status}`}>
											{diag.status}
										</span>
										<span>{formatDate(diag.diagnosed_date)}</span>
									</div>
								</li>
							))}
						</ul>
					</div>

					<div className='card card-visits full-width'>
						<h3>Visit History</h3>
						<table className='data-table'>
							<thead>
								<tr>
									<th>Date</th>
									<th>Type</th>
									<th>Doctor</th>
									<th>Chief Complaint</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{data.visits.map((visit) => (
									<tr key={visit.visit_id}>
										<td>{new Date(visit.visit_date).toLocaleString()}</td>
										<td style={{ textTransform: 'capitalize' }}>
											{visit?.visit_type?.replace('_', ' ')}
										</td>
										<td>
											{visit.doctor_first_name} {visit.doctor_last_name}
										</td>
										<td>{visit.chief_complaint || '-'}</td>
										<td>
											<span className={`status-badge status-${visit.status}`}>
												{visit.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{isModalOpen && (
					<div className='modal-overlay' onClick={() => setIsModalOpen(false)}>
						<div className='modal-content' onClick={(e) => e.stopPropagation()}>
							<div className='modal-header'>
								<h2>Add Clinical Note</h2>
								<button
									className='modal-close'
									onClick={() => setIsModalOpen(false)}
								>
									&times;
								</button>
							</div>
							<form onSubmit={handleAddNote}>
								<div className='form-group'>
									<label>Note Type</label>
									<select
										value={newNoteType}
										onChange={(e) => setNewNoteType(e.target.value)}
									>
										<option value='progress_note'>Progress Note</option>
										<option value='soap_subjective'>SOAP - Subjective</option>
										<option value='soap_objective'>SOAP - Objective</option>
										<option value='soap_assessment'>SOAP - Assessment</option>
										<option value='soap_plan'>SOAP - Plan</option>
										<option value='consult_note'>Consultation Note</option>
									</select>
								</div>
								<div className='form-group'>
									<label>Note Details</label>
									<textarea
										rows={6}
										value={newNoteText}
										onChange={(e) => setNewNoteText(e.target.value)}
										placeholder='Enter clinical observations...'
										required
									></textarea>
								</div>
								<div className='modal-actions'>
									<button
										type='button'
										className='btn-secondary'
										onClick={() => setIsModalOpen(false)}
									>
										Cancel
									</button>
									<button
										type='submit'
										className='btn-primary'
										disabled={isSubmitting}
									>
										{isSubmitting ? 'Saving...' : 'Save Note'}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>

			<div className={`ai-sidebar ${isAiSidebarOpen ? 'open' : ''}`}>
				<div className='ai-header'>
					<h3>AI Assistant</h3>
					<button
						className='ai-close-btn'
						onClick={() => setIsAiSidebarOpen(false)}
					>
						&times;
					</button>
				</div>
				<div className='ai-body'>
					<div className='ai-placeholder-content'>
						<div className='ai-message ai-ai'>
							<p>
								Hello! I'm ready to help analyze patient data or draft notes.
							</p>
						</div>
					</div>
				</div>
				<div className='ai-input-area'>
					<input type='text' placeholder='Ask AI Agent...' />
					<button className='ai-send-btn' disabled>
						<svg
							width='18'
							height='18'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
						>
							<line x1='22' y1='2' x2='11' y2='13'></line>
							<polygon points='22 2 15 22 11 13 2 9 22 2'></polygon>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

export default PatientProfile;
