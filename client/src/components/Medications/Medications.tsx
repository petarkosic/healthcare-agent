import { useState } from 'react';
import { useParams } from 'react-router';
import type { PatientFullResponse } from '../../types/types';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/Auth/AuthProvider';
import { API_BASE } from '../../lib/api';
import './Medications.css';

type MedicationsProps = {
	data: PatientFullResponse;
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	refetch: () => Promise<void>;
};

export const Medications = ({ data, setError, refetch }: MedicationsProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [form, setForm] = useState({
		medication_name: '',
		generic_name: '',
		dosage: '',
		frequency: '',
		start_date: '',
		prescribed_for: '',
		instructions: '',
		end_date: '',
		status: 'active',
	});

	const { id: patient_serial } = useParams();
	const { session } = useSession();
	const { doctorSerialNumber } = useAuth();

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const resetForm = () => {
		setForm({
			medication_name: '',
			generic_name: '',
			dosage: '',
			frequency: '',
			start_date: '',
			prescribed_for: '',
			instructions: '',
			end_date: '',
			status: 'active',
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${API_BASE}/api/patients/${patient_serial}/medications`,
				{
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...form,
						doctor_serial_number: doctorSerialNumber,
						end_date: form.end_date || null,
					}),
				},
			);

			if (!response.ok) {
				throw new Error('Failed to add medication');
			}

			await refetch();
			resetForm();
			setIsModalOpen(false);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className='card card-meds'>
				<div className='card-header-row'>
					<h3>Active Medications</h3>
					{doctorSerialNumber && session && (
						<button
							className='btn-primary'
							onClick={() => setIsModalOpen(true)}
						>
							Add Medication
						</button>
					)}
				</div>
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

			{isModalOpen && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Add Medication</h2>
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
								<label>Medication Name</label>
								<input
									name='medication_name'
									value={form.medication_name}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Generic Name</label>
								<input
									name='generic_name'
									value={form.generic_name}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Dosage</label>
								<input
									name='dosage'
									value={form.dosage}
									onChange={handleChange}
									placeholder='e.g. 10mg'
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Frequency</label>
								<input
									name='frequency'
									value={form.frequency}
									onChange={handleChange}
									placeholder='e.g. once daily'
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Start Date</label>
								<input
									type='date'
									name='start_date'
									value={form.start_date}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>End Date (optional)</label>
								<input
									type='date'
									name='end_date'
									value={form.end_date}
									onChange={handleChange}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Prescribed For</label>
								<input
									name='prescribed_for'
									value={form.prescribed_for}
									onChange={handleChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Instructions</label>
								<textarea
									name='instructions'
									value={form.instructions}
									onChange={handleChange}
									rows={3}
									required
									disabled={isSubmitting}
								/>
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
									<option value='hold'>Hold</option>
									<option value='discontinued'>Discontinued</option>
									<option value='completed'>Completed</option>
								</select>
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
									{isSubmitting ? 'Saving...' : 'Save Medication'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};
