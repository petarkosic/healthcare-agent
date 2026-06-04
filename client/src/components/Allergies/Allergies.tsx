import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppSelector } from '../../store/hooks';
import {
	useGetPatientQuery,
	useUpdateAllergiesMutation,
} from '../../store/api/patientsApi';
import './Allergies.css';

export const Allergies = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [draft, setDraft] = useState<string[]>([]);
	const [newEntry, setNewEntry] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	const { id: patient_serial } = useParams();
	const session = useAppSelector((state) => state.session.session);
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);

	const { data } = useGetPatientQuery(patient_serial!);
	const [updateAllergies, { isLoading: isSubmitting }] =
		useUpdateAllergiesMutation();

	const openModal = () => {
		setDraft([...(data?.patient.allergies ?? [])]);
		setNewEntry('');
		setIsModalOpen(true);
	};

	const addEntry = () => {
		const trimmed = newEntry.trim();
		if (!trimmed || draft.includes(trimmed)) return;

		setDraft((prev) => [...prev, trimmed]);
		setNewEntry('');
	};

	const removeEntry = (allergy: string) => {
		setDraft((prev) => prev.filter((a) => a !== allergy));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addEntry();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setLocalError(null);

		try {
			await updateAllergies({
				patientId: patient_serial!,
				allergies: draft,
			}).unwrap();

			setIsModalOpen(false);
		} catch {
			setLocalError('Failed to update allergies');
		}
	};

	if (!data) return null;

	return (
		<>
			{localError && <div className='error'>{localError}</div>}
			<div className='allergy-banner'>
				<div className='allergy-banner-content'>
					<strong>Known Allergies:</strong>{' '}
					{data.patient.allergies?.length
						? data.patient.allergies.join(', ')
						: 'None recorded'}
				</div>
				{doctorSerialNumber && (
					<span
						className={!session ? 'btn-tooltip-wrap' : undefined}
						data-tooltip={
							!session ? 'Start a session to update allergies' : undefined
						}
					>
						<button
							className='allergy-edit-btn'
							onClick={openModal}
							disabled={!session}
						>
							Edit
						</button>
					</span>
				)}
			</div>

			{isModalOpen && (
				<div
					className='modal-overlay'
					onClick={isSubmitting ? undefined : () => setIsModalOpen(false)}
				>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Edit Allergies</h2>
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
								<label>Current Allergies</label>
								<div className='allergy-chips'>
									{draft.length === 0 && (
										<span className='allergy-chips-empty'>None</span>
									)}
									{draft.map((allergy) => (
										<span key={allergy} className='allergy-chip'>
											{allergy}
											<button
												type='button'
												className='allergy-chip-remove'
												onClick={() => removeEntry(allergy)}
												disabled={isSubmitting}
											>
												&times;
											</button>
										</span>
									))}
								</div>
							</div>
							<div className='form-group'>
								<label>Add Allergy</label>
								<div className='allergy-input-row'>
									<input
										value={newEntry}
										onChange={(e) => setNewEntry(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder='e.g. Penicillin'
										disabled={isSubmitting}
									/>
									<button
										type='button'
										className='btn-secondary'
										onClick={addEntry}
										disabled={isSubmitting || !newEntry.trim()}
									>
										Add
									</button>
								</div>
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
									{isSubmitting ? 'Saving...' : 'Save Changes'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
};
