import { useState } from 'react';
import type { ClinicalNote, PatientFullResponse } from '../../types/types';
import { formatDate } from '../../utils/utils';
import { useParams } from 'react-router';
import './Notes.css';

type NotesProps = {
	data: PatientFullResponse;
	setError: React.Dispatch<React.SetStateAction<string | null>>;
	setData: React.Dispatch<React.SetStateAction<PatientFullResponse | null>>;
};

export const Notes = ({ data, setError, setData }: NotesProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);

	const [newNoteType, setNewNoteType] = useState('progress_note');
	const [newNoteText, setNewNoteText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { id: patient_serial } = useParams();

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
				`http://localhost:8000/api/patients/${patient_serial}/notes`,
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
				},
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

	return (
		<>
			<div className='card card-notes'>
				<div className='card-header-row'>
					<h3>Clinical Notes</h3>
					<button className='btn-primary' onClick={() => setIsModalOpen(true)}>
						+ New Note
					</button>
				</div>
				<div className='notes-timeline'>
					{data?.clinical_notes?.length > 0 ? (
						data?.clinical_notes?.map((note) => (
							<div
								key={note.note_id}
								className='note-entry'
								onClick={() => setSelectedNote(note)}
								style={{ cursor: 'pointer' }}
							>
								<div className='note-header'>
									<span
										className={`note-type-badge type-${
											note?.note_type?.split('_')[1] || 'generic'
										}`}
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

			{selectedNote && (
				<div className='modal-overlay' onClick={() => setSelectedNote(null)}>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<div className='modal-header'>
							<h2>Note Details</h2>
							<button
								className='modal-close'
								onClick={() => setSelectedNote(null)}
							>
								&times;
							</button>
						</div>
						<div className='modal-body'>
							<div className='note-header'>
								<span
									className={`note-type-badge type-${
										selectedNote?.note_type?.split('_')[1] || 'generic'
									}`}
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
						<div className='modal-actions'>
							<button
								type='button'
								className='btn-primary'
								onClick={() => setSelectedNote(null)}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
