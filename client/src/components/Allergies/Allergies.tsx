import { useState } from 'react';
import { useParams } from 'react-router';
import type { PatientFullResponse } from '../../types/types';
import { useSession } from '../../context/SessionContext';
import { API_BASE } from '../../lib/api';
import './Allergies.css';
import { useAuth } from '../../context/Auth/AuthProvider';

type AllergiesProps = {
	data: PatientFullResponse;
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	refetch: () => Promise<void>;
};

export const Allergies = ({ data, setError, refetch }: AllergiesProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [draft, setDraft] = useState<string[]>([]);
	const [newEntry, setNewEntry] = useState('');

	const { id: patient_serial } = useParams();
	const { session } = useSession();
	const { doctorSerialNumber } = useAuth();

	const openModal = () => {
		setDraft([...(data.patient.allergies ?? [])]);
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
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${API_BASE}/api/patients/${patient_serial}/allergies`,
				{
					method: 'PUT',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ allergies: draft }),
				},
			);

			if (!response.ok) throw new Error('Failed to update allergies');

			await refetch();
			setIsModalOpen(false);
		} catch (error) {
			setError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className='allergy-banner'>
				<span className='icon-alert'>⚠️</span>
				<div className='allergy-banner-content'>
					<strong>Known Allergies:</strong>{' '}
					{data.patient.allergies?.length
						? data.patient.allergies.join(', ')
						: 'None recorded'}
				</div>
				{doctorSerialNumber && (
					<span
						className={!session ? 'btn-tooltip-wrap' : undefined}
						data-tooltip={!session ? 'Start a session to update allergies' : undefined}
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
