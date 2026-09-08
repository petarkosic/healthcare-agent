import { useState } from 'react';
import type { ClinicalNote } from '../../../types/types';
import { formatDate } from '../../../utils/utils';
import { useParams } from 'react-router';
import { Modal } from '../../Modal/Modal';
import './Notes.css';
import { useAppSelector } from '../../../store/hooks';
import {
	useGetPatientQuery,
	useAddNoteMutation,
} from '../../../store/api/patientsApi';
import type { NoteType } from '../../../types/enums';

export const Notes = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
	const [newNoteType, setNewNoteType] = useState('progress_note');
	const [newNoteText, setNewNoteText] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	const { id: patient_serial } = useParams();
	const session = useAppSelector((state) => state.session.session);
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);

	const { data } = useGetPatientQuery(patient_serial!);
	const [addNote, { isLoading: isSubmitting }] = useAddNoteMutation();

	const handleAddNote = async (e: React.FormEvent) => {
		e.preventDefault();

		setLocalError(null);

		try {
			await addNote({
				patientId: patient_serial!,
				body: {
					visit_id: session!.visitId as string,
					note_type: newNoteType as NoteType,
					note_text: newNoteText,
				},
			}).unwrap();

			setNewNoteText('');
			setIsModalOpen(false);
		} catch {
			setLocalError('Failed to add note');
		}
	};

	if (!data) return null;

	return (
		<>
			{localError && <div className='error'>{localError}</div>}
			<div className='card card-notes'>
				<div className='card-header-row'>
					<h3>Clinical Notes</h3>
					{doctorSerialNumber && (
						<span
							className={!session ? 'btn-tooltip-wrap' : undefined}
							data-tooltip={
								!session ? 'Start a session to add notes' : undefined
							}
						>
							<button
								className='btn btn--ghost btn--sm'
								onClick={() => setIsModalOpen(true)}
								disabled={!session}
							>
								+ Add
							</button>
						</span>
					)}
				</div>
				<div className='notes-timeline'>
					{data.clinical_notes?.length > 0 ? (
						data.clinical_notes.map((note) => (
							<div
								key={note.note_id}
								className='note-entry'
								onClick={() => setSelectedNote(note)}
								style={{ cursor: 'pointer' }}
							>
								<div className='note-header'>
									<span
										className={`note-type-badge type-${note?.note_type?.split('_')[1] || 'generic'}`}
									>
										{note?.note_type?.replace(/_/g, ' ').toUpperCase()}
									</span>
									<span className='note-date'>
										{formatDate(note?.created_at)}
									</span>
								</div>
								<div className='note-author'>
									By Dr. {note?.doctor_first_name} {note?.doctor_last_name}
								</div>
								<div className='note-text'>{note?.note_text}</div>
							</div>
						))
					) : (
						<p className='empty-text'>No clinical notes available.</p>
					)}
				</div>
			</div>

			{isModalOpen && (
				<Modal
					title='Add Clinical Note'
					onClose={() => setIsModalOpen(false)}
					disabled={isSubmitting}
				>
					<form onSubmit={handleAddNote}>
						<div className='form-group'>
							<label htmlFor='note_type'>Note Type</label>
							<select
								id='note_type'
								value={newNoteType}
								onChange={(e) => setNewNoteType(e.target.value)}
								disabled={isSubmitting}
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
							<label htmlFor='note_text'>Note Details</label>
							<textarea
								id='note_text'
								rows={6}
								value={newNoteText}
								onChange={(e) => setNewNoteText(e.target.value)}
								placeholder='Enter clinical observations...'
								required
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
								{isSubmitting ? 'Saving...' : 'Save Note'}
							</button>
						</div>
					</form>
				</Modal>
			)}

			{selectedNote && (
				<Modal title='Note Details' onClose={() => setSelectedNote(null)}>
					<div className='modal-body'>
						<div className='note-header'>
							<span
								className={`note-type-badge type-${selectedNote?.note_type?.split('_')[1] || 'generic'}`}
							>
								{selectedNote?.note_type?.replace(/_/g, ' ').toUpperCase()}
							</span>
							<span className='note-date'>
								{formatDate(selectedNote?.created_at)}
							</span>
						</div>
						<div className='note-author' style={{ marginBottom: '1rem' }}>
							By Dr. {selectedNote?.doctor_first_name}{' '}
							{selectedNote?.doctor_last_name}
						</div>
						<div
							className='note-text'
							style={{
								width: '100%',
								whiteSpace: 'pre-wrap',
								maxHeight: '60vh',
								overflowY: 'auto',
							}}
						>
							{selectedNote?.note_text}
						</div>
					</div>
				</Modal>
			)}
		</>
	);
};
