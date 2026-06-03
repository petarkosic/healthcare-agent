import { useState } from 'react';
import { useParams } from 'react-router';
import type { Diagnosis } from '../../types/types';
import { useAppSelector } from '../../store/hooks';
import { formatDateOnly } from '../../utils/utils';
import {
	useGetPatientQuery,
	useAddDiagnosisMutation,
} from '../../store/api/patientsApi';
import './Diagnoses.css';

export const Diagnoses = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);
	const [form, setForm] = useState({
		diagnosis_code: '',
		diagnosis_name: '',
		diagnosis_type: 'primary',
		status: 'active',
		diagnosed_date: '',
		resolved_date: '',
	});

	const { id: patient_serial } = useParams();
	const session = useAppSelector((state) => state.session.session);
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);

	const { data } = useGetPatientQuery(patient_serial!);
	const [addDiagnosis, { isLoading: isSubmitting }] = useAddDiagnosisMutation();

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const resetForm = () => {
		setForm({
			diagnosis_code: '',
			diagnosis_name: '',
			diagnosis_type: 'primary',
			status: 'active',
			diagnosed_date: '',
			resolved_date: '',
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setLocalError(null);

		try {
			await addDiagnosis({
				patientId: patient_serial!,
				body: {
					...form,
					visit_id: session!.visitId,
					diagnosing_doctors_serial_number: doctorSerialNumber,
					resolved_date: form.resolved_date || null,
				},
			}).unwrap();
			resetForm();
			setIsModalOpen(false);
		} catch {
			setLocalError('Failed to add diagnosis');
		}
	};

	if (!data) return null;

	return (
		<>
			{localError && <div className='error'>{localError}</div>}
			<div className='card card-diagnoses'>
				<div className='card-header-row'>
					<h3>Diagnoses History</h3>
					{doctorSerialNumber && (
						<span
							className={!session ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={
								!session ? 'Start a session to add diagnoses' : undefined
							}
						>
							<button
								className='btn-primary'
								onClick={() => setIsModalOpen(true)}
								disabled={!session}
							>
								Add Diagnosis
							</button>
						</span>
					)}
				</div>
				{data.diagnoses.length > 0 ? (
					<ul className='diagnoses-list'>
						{data.diagnoses.map((diag: Diagnosis) => (
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
									<span>{formatDateOnly(diag.diagnosed_date)}</span>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className='empty-text'>No diagnoses recorded.</p>
				)}
			</div>

			{isModalOpen && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Add Diagnosis</h2>
							<button
								className='modal-close'
								onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
								disabled={isSubmitting}
							>
								&times;
							</button>
						</div>
						<form onSubmit={handleSubmit}>
							<div className='form-group'>
								<label>ICD-10 Code</label>
								<input
									name='diagnosis_code'
									value={form.diagnosis_code}
									onChange={handleChange}
									placeholder='e.g. E11.9'
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Diagnosis Name</label>
								<input
									name='diagnosis_name'
									value={form.diagnosis_name}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Type</label>
								<select
									name='diagnosis_type'
									value={form.diagnosis_type}
									onChange={handleChange}
									disabled={isSubmitting}
								>
									<option value='primary'>Primary</option>
									<option value='secondary'>Secondary</option>
									<option value='chronic'>Chronic</option>
									<option value='acute'>Acute</option>
								</select>
							</div>
							<div className='form-group'>
								<label>Status</label>
								<select
									name='status'
									value={form.status}
									onChange={handleChange}
									disabled={isSubmitting}
								>
									<option value='active'>Active</option>
									<option value='chronic'>Chronic</option>
									<option value='resolved'>Resolved</option>
								</select>
							</div>
							<div className='form-group'>
								<label>Diagnosed Date</label>
								<input
									type='date'
									name='diagnosed_date'
									value={form.diagnosed_date}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Resolved Date (optional)</label>
								<input
									type='date'
									name='resolved_date'
									value={form.resolved_date}
									onChange={handleChange}
									disabled={isSubmitting}
								/>
							</div>
							<div className='modal-actions'>
								<button
									type='button'
									className='btn-secondary'
									onClick={
										isSubmitting ? undefined : () => setIsModalOpen(false)
									}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type='submit'
									className='btn-primary'
									disabled={isSubmitting}
								>
									{isSubmitting ? 'Saving...' : 'Save Diagnosis'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};
