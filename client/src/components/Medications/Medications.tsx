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

type MedicationRow = PatientFullResponse['medications'][number];

export const Medications = ({ data, setError, refetch }: MedicationsProps) => {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedMed, setSelectedMed] = useState<MedicationRow | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [editForm, setEditForm] = useState({
		dosage: '',
		frequency: '',
		end_date: '',
		status: 'active',
		prescribed_for: '',
		instructions: '',
	});
	const [addForm, setAddForm] = useState({
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

	const closeEditModal = () => {
		setSelectedMed(null);
		setConfirmingDelete(false);
	};

	const openEditModal = (med: MedicationRow) => {
		setSelectedMed(med);
		setEditForm({
			dosage: med.dosage,
			frequency: med.frequency,
			end_date: med.end_date ? med.end_date.split('T')[0] : '',
			status: med.status,
			prescribed_for: med.prescribed_for,
			instructions: med.instructions,
		});
	};

	const handleEditChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleAddChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const resetAddForm = () => {
		setAddForm({
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

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedMed) return;
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${API_BASE}/api/patients/${patient_serial}/medications/${selectedMed.medication_id}`,
				{
					method: 'PUT',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...editForm,
						end_date: editForm.end_date || null,
					}),
				},
			);

			if (!response.ok) throw new Error('Failed to update medication');

			await refetch();
			setSelectedMed(null);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedMed) return;
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${API_BASE}/api/patients/${patient_serial}/medications/${selectedMed.medication_id}`,
				{
					method: 'DELETE',
					credentials: 'include',
				},
			);

			if (!response.ok) throw new Error('Failed to delete medication');

			await refetch();
			closeEditModal();
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
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
						...addForm,
						doctor_serial_number: doctorSerialNumber,
						end_date: addForm.end_date || null,
					}),
				},
			);

			if (!response.ok) throw new Error('Failed to add medication');

			await refetch();
			resetAddForm();
			setIsAddModalOpen(false);
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
					{doctorSerialNumber && (
						<span
							className={!session ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={
								!session ? 'Start a session to add medications' : undefined
							}
						>
							<button
								className='btn-primary'
								onClick={() => setIsAddModalOpen(true)}
								disabled={!session}
							>
								Add Medication
							</button>
						</span>
					)}
				</div>
				<div className='meds-list'>
					{data.medications.filter((m) => m.status === 'active').length > 0 ? (
						data.medications
							.filter((m) => m.status === 'active')
							.map((med) => (
								<div
									key={med.medication_id}
									className='med-item med-item-clickable'
									onClick={() => openEditModal(med)}
								>
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
							))
					) : (
						<p className='empty-text'>No active medications.</p>
					)}
				</div>
			</div>

			{selectedMed && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : closeEditModal}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>
								{selectedMed.medication_name}
								{selectedMed.generic_name && (
									<span className='modal-generic'>
										{' '}
										({selectedMed.generic_name})
									</span>
								)}
							</h2>
							<button
								className='modal-close'
								onClick={isSubmitting ? undefined : closeEditModal}
								disabled={isSubmitting}
							>
								&times;
							</button>
						</div>
						{session ? (
							<form onSubmit={handleEditSubmit}>
								<div className='form-group'>
									<label>Dosage</label>
									<input
										name='dosage'
										value={editForm.dosage}
										onChange={handleEditChange}
										placeholder='e.g. 10mg'
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='form-group'>
									<label>Frequency</label>
									<input
										name='frequency'
										value={editForm.frequency}
										onChange={handleEditChange}
										placeholder='e.g. once daily'
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='form-group'>
									<label>Status</label>
									<select
										name='status'
										value={editForm.status}
										onChange={handleEditChange}
										disabled={isSubmitting}
									>
										<option value='active'>Active</option>
										<option value='hold'>Hold</option>
										<option value='discontinued'>Discontinued</option>
										<option value='completed'>Completed</option>
									</select>
								</div>
								<div className='form-group'>
									<label>End Date (optional)</label>
									<input
										type='date'
										name='end_date'
										value={editForm.end_date}
										onChange={handleEditChange}
										disabled={isSubmitting}
									/>
								</div>
								<div className='form-group'>
									<label>Prescribed For</label>
									<input
										name='prescribed_for'
										value={editForm.prescribed_for}
										onChange={handleEditChange}
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='form-group'>
									<label>Instructions</label>
									<textarea
										name='instructions'
										value={editForm.instructions}
										onChange={handleEditChange}
										rows={3}
										required
										disabled={isSubmitting}
									/>
								</div>
								<div className='modal-actions med-modal-actions'>
									{confirmingDelete ? (
										<div className='delete-confirm'>
											<span className='delete-confirm-text'>
												Remove this medication?
											</span>
											<div className='modal-actions-right'>
												<button
													type='button'
													className='btn-secondary'
													onClick={() => setConfirmingDelete(false)}
													disabled={isSubmitting}
												>
													Cancel
												</button>
												<button
													type='button'
													className='btn-danger'
													onClick={handleDelete}
													disabled={isSubmitting}
												>
													{isSubmitting ? 'Removing...' : 'Yes, Remove'}
												</button>
											</div>
										</div>
									) : (
										<>
											<button
												type='button'
												className='btn-danger'
												onClick={() => setConfirmingDelete(true)}
												disabled={isSubmitting}
											>
												Remove
											</button>
											<div className='modal-actions-right'>
												<button
													type='button'
													className='btn-secondary'
													onClick={isSubmitting ? undefined : closeEditModal}
													disabled={isSubmitting}
												>
													Cancel
												</button>
												<button
													type='submit'
													className='btn-primary'
													disabled={isSubmitting}
												>
													{isSubmitting ? 'Saving...' : 'Save Changes'}
												</button>
											</div>
										</>
									)}
								</div>
							</form>
						) : (
							<div className='modal-body med-readonly'>
								<div className='med-readonly-row'>
									<span className='med-readonly-label'>Dosage</span>
									<span>{selectedMed.dosage}</span>
								</div>
								<div className='med-readonly-row'>
									<span className='med-readonly-label'>Frequency</span>
									<span>{selectedMed.frequency}</span>
								</div>
								<div className='med-readonly-row'>
									<span className='med-readonly-label'>Status</span>
									<span>{selectedMed.status}</span>
								</div>
								{selectedMed.end_date && (
									<div className='med-readonly-row'>
										<span className='med-readonly-label'>End Date</span>
										<span>{selectedMed.end_date.split('T')[0]}</span>
									</div>
								)}
								<div className='med-readonly-row'>
									<span className='med-readonly-label'>Prescribed For</span>
									<span>{selectedMed.prescribed_for}</span>
								</div>
								<div className='med-readonly-row'>
									<span className='med-readonly-label'>Instructions</span>
									<span>{selectedMed.instructions}</span>
								</div>
								<div className='modal-actions'>
									<button
										className='btn-primary'
										onClick={() => setSelectedMed(null)}
									>
										Close
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{isAddModalOpen && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : () => setIsAddModalOpen(false)}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Add Medication</h2>
							<button
								className='modal-close'
								onClick={
									isSubmitting ? undefined : () => setIsAddModalOpen(false)
								}
								disabled={isSubmitting}
							>
								&times;
							</button>
						</div>
						<form onSubmit={handleAddSubmit}>
							<div className='form-group'>
								<label>Medication Name</label>
								<input
									name='medication_name'
									value={addForm.medication_name}
									onChange={handleAddChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Generic Name</label>
								<input
									name='generic_name'
									value={addForm.generic_name}
									onChange={handleAddChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Dosage</label>
								<input
									name='dosage'
									value={addForm.dosage}
									onChange={handleAddChange}
									placeholder='e.g. 10mg'
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Frequency</label>
								<input
									name='frequency'
									value={addForm.frequency}
									onChange={handleAddChange}
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
									value={addForm.start_date}
									onChange={handleAddChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>End Date (optional)</label>
								<input
									type='date'
									name='end_date'
									value={addForm.end_date}
									onChange={handleAddChange}
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Prescribed For</label>
								<input
									name='prescribed_for'
									value={addForm.prescribed_for}
									onChange={handleAddChange}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Instructions</label>
								<textarea
									name='instructions'
									value={addForm.instructions}
									onChange={handleAddChange}
									rows={3}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className='form-group'>
								<label>Status</label>
								<select
									name='status'
									value={addForm.status}
									onChange={handleAddChange}
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
										isSubmitting ? undefined : () => setIsAddModalOpen(false)
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
