import { useState } from 'react';
import type { Visit } from '../../types/types';
import {
	formatDateTimeLocal,
	secondsToRoundedMinutes,
} from '../../utils/utils';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { startSession, endSession } from '../../store/sessionSlice';
import { ensureGoogleConnected } from '../../store/googleCalendarSlice';
import { useUpdateVisitMutation } from '../../store/api/patientsApi';
import { useScheduleFollowupMutation } from '../../store/api/agentsApi';
import './VisitModal.css';

type VisitModalProps = {
	visit: Visit;
	onClose: () => void;
	doctorSerialNumber: string | null;
};

type View = 'details' | 'reschedule';

export const VisitModal = ({
	visit,
	onClose,
	doctorSerialNumber,
}: VisitModalProps) => {
	const minDate = (() => {
		const d = new Date();

		d.setDate(d.getDate() + 1);

		return formatDateTimeLocal(d);
	})();

	const [view, setView] = useState<View>('details');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const [rescheduleDate, setRescheduleDate] = useState(minDate);
	const [rescheduleReason, setRescheduleReason] = useState('');
	const [showStartForm, setShowStartForm] = useState(false);
	const [startType, setStartType] = useState(visit.visit_type || 'checkup');
	const [startLocation, setStartLocation] = useState(
		visit.location || 'Clinic',
	);
	const [showCompleteForm, setShowCompleteForm] = useState(false);
	const [complaintInput, setComplaintInput] = useState('');
	const [complaintError, setComplaintError] = useState('');

	const session = useAppSelector((state) => state.session.session);
	const elapsedTime = session
		? Math.floor((Date.now() - session.startTime) / 1000)
		: 0;
	const dispatch = useAppDispatch();

	const [updateVisit] = useUpdateVisitMutation();
	const [scheduleFollowup] = useScheduleFollowupMutation();

	const isActiveVisit = session?.visitId === visit.visit_id;

	const changeStatus = async (newStatus: string) => {
		setApiError(null);

		setIsSubmitting(true);

		try {
			await updateVisit({
				patientId: visit.patient_serial_number,
				body: {
					visit_id: visit.visit_id,
					status: newStatus,
					chief_complaint: visit.chief_complaint,
					duration_minutes: visit.duration_minutes || 30,
				},
			}).unwrap();

			if (newStatus === 'cancelled' && isActiveVisit) dispatch(endSession());

			onClose();
		} catch {
			setApiError('Failed to update visit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleStartVisit = async () => {
		setApiError(null);

		setIsSubmitting(true);

		try {
			await updateVisit({
				patientId: visit.patient_serial_number,
				body: {
					visit_id: visit.visit_id,
					status: 'in-progress',
					chief_complaint: visit.chief_complaint,
					duration_minutes: visit.duration_minutes || 30,
				},
			}).unwrap();

			dispatch(
				startSession({
					type: startType,
					location: startLocation,
					visitId: visit.visit_id,
					patientSerialNumber: visit.patient_serial_number,
				}),
			);

			setShowStartForm(false);

			onClose();
		} catch {
			setApiError('Failed to start visit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmComplete = async () => {
		if (complaintInput.trim() === '') {
			setComplaintError('Main complaint cannot be empty');

			return;
		}

		const duration = isActiveVisit
			? secondsToRoundedMinutes(elapsedTime)
			: visit.duration_minutes || 30;

		setApiError(null);

		setIsSubmitting(true);

		try {
			await updateVisit({
				patientId: visit.patient_serial_number,
				body: {
					visit_id: visit.visit_id,
					status: 'completed',
					chief_complaint: complaintInput,
					duration_minutes: duration,
				},
			}).unwrap();

			if (isActiveVisit) dispatch(endSession());

			onClose();
		} catch {
			setApiError('Failed to complete visit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReschedule = async () => {
		setApiError(null);

		setIsSubmitting(true);

		try {
			await dispatch(ensureGoogleConnected()).unwrap();

			const startTime = rescheduleDate + ':00';
			const endDate = new Date(rescheduleDate);
			endDate.setMinutes(endDate.getMinutes() + (visit.duration_minutes || 30));
			const endTime = formatDateTimeLocal(endDate) + ':00';

			await scheduleFollowup({
				patient_serial_number: visit.patient_serial_number,
				doctor_serial_number: doctorSerialNumber,
				visit_date: startTime,
				visit_type: visit.visit_type,
				summary: `${visit.visit_type} visit`,
				start_time: startTime,
				end_time: endTime,
				description: rescheduleReason || visit.chief_complaint || '',
			}).unwrap();

			onClose();
		} catch (err) {
			setApiError(
				err instanceof Error ? err.message : 'Failed to reschedule visit',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='modal-overlay' onClick={isSubmitting ? undefined : onClose}>
			<div className='modal-content' onClick={(e) => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>Visit Details</h2>
					<button
						className='modal-close'
						onClick={isSubmitting ? undefined : onClose}
						disabled={isSubmitting}
					>
						&times;
					</button>
				</div>

				{view === 'details' && (
					<>
						<div className='visit-details-grid'>
							<div className='visit-detail-item'>
								<span className='visit-detail-label'>Date</span>
								<span className='visit-detail-value'>
									{new Date(visit.visit_date).toLocaleString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
										timeZone: 'UTC',
									})}
								</span>
							</div>
							<div className='visit-detail-item'>
								<span className='visit-detail-label'>Type</span>
								<span
									className='visit-detail-value'
									style={{ textTransform: 'capitalize' }}
								>
									{visit.visit_type?.replace(/_/g, ' ')}
								</span>
							</div>
							<div className='visit-detail-item'>
								<span className='visit-detail-label'>Doctor</span>
								<span className='visit-detail-value'>
									{visit.doctor_first_name} {visit.doctor_last_name}
								</span>
							</div>
							<div className='visit-detail-item'>
								<span className='visit-detail-label'>Status</span>
								<span className={`status-badge status-${visit.status}`}>
									{visit.status}
								</span>
							</div>
							{visit.chief_complaint && (
								<div
									className='visit-detail-item'
									style={{ gridColumn: '1 / -1' }}
								>
									<span className='visit-detail-label'>Chief Complaint</span>
									<span className='visit-detail-value'>
										{visit.chief_complaint}
									</span>
								</div>
							)}
						</div>

						<div className='visit-actions'>
							{showCompleteForm ? (
								<div className='complete-form'>
									<div className='complete-form-input-wrapper'>
										<input
											type='text'
											placeholder='Main complaint...'
											value={complaintInput}
											onChange={(e) => {
												setComplaintInput(e.target.value);
												if (complaintError) setComplaintError('');
											}}
											className='complete-form-input'
											autoFocus
											disabled={isSubmitting}
										/>
										{complaintError && (
											<span className='complete-form-error'>
												{complaintError}
											</span>
										)}
									</div>
									<button
										className='btn-secondary'
										onClick={() => setShowCompleteForm(false)}
										disabled={isSubmitting}
									>
										Cancel
									</button>
									<button
										className='btn-success'
										onClick={handleConfirmComplete}
										disabled={isSubmitting}
									>
										{isSubmitting ? 'Saving…' : 'Save and Complete'}
									</button>
								</div>
							) : (
								<>
									{visit.status === 'scheduled' && (
										<>
											{showStartForm ? (
												<div className='complete-form'>
													<select
														className='complete-form-input'
														value={startType}
														onChange={(e) => setStartType(e.target.value)}
														disabled={isSubmitting}
													>
														{[
															'Checkup',
															'Followup',
															'Emergency',
															'Specialist',
															'Vaccination',
															'Routine',
															'Urgent Care',
															'Surgical',
															'Telehealth',
														].map((t) => (
															<option key={t} value={t}>
																{t.replace(/_/g, ' ')}
															</option>
														))}
													</select>
													<select
														className='complete-form-input'
														value={startLocation}
														onChange={(e) => setStartLocation(e.target.value)}
														disabled={isSubmitting}
													>
														{[
															'Clinic',
															'Hospital',
															'Telehealth',
															'Home Visit',
															'Urgent Care',
														].map((l) => (
															<option key={l} value={l}>
																{l}
															</option>
														))}
													</select>
													<button
														className='btn-secondary'
														onClick={() => setShowStartForm(false)}
														disabled={isSubmitting}
													>
														Cancel
													</button>
													<button
														className='btn-success'
														onClick={handleStartVisit}
														disabled={isSubmitting}
													>
														{isSubmitting ? 'Starting…' : 'Start Visit'}
													</button>
												</div>
											) : (
												<>
													<button
														className='btn-success'
														onClick={() => setShowStartForm(true)}
														disabled={isSubmitting}
													>
														Start Visit
													</button>
													<button
														className='btn-danger'
														onClick={() => changeStatus('cancelled')}
														disabled={isSubmitting}
													>
														Cancel
													</button>
													<button
														className='btn-secondary'
														onClick={() => changeStatus('no-show')}
														disabled={isSubmitting}
													>
														No-show
													</button>
												</>
											)}
										</>
									)}
									{visit.status === 'in-progress' && (
										<>
											<button
												className='btn-success'
												onClick={() => setShowCompleteForm(true)}
												disabled={isSubmitting}
											>
												Complete
											</button>
											<button
												className='btn-danger'
												onClick={() => changeStatus('cancelled')}
												disabled={isSubmitting}
											>
												Cancel
											</button>
										</>
									)}
									{(visit.status === 'cancelled' ||
										visit.status === 'no-show') && (
										<button
											className='btn-primary'
											onClick={() => {
												setView('reschedule');
												setApiError(null);
											}}
											disabled={isSubmitting}
										>
											Reschedule
										</button>
									)}
									{visit.status === 'completed' && (
										<p className='visit-readonly-msg'>
											This visit is completed and cannot be modified.
										</p>
									)}
								</>
							)}
						</div>
					</>
				)}

				{view === 'reschedule' && (
					<>
						<div className='reschedule-view'>
							<div>
								<label htmlFor='reschedule-date'>
									New visit date &amp; time
								</label>
								<input
									id='reschedule-date'
									type='datetime-local'
									value={rescheduleDate}
									min={minDate}
									onChange={(e) => setRescheduleDate(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							<div>
								<label htmlFor='reschedule-reason'>
									Visit reason (optional)
								</label>
								<input
									id='reschedule-reason'
									type='text'
									placeholder='Reason for visit...'
									value={rescheduleReason}
									onChange={(e) => setRescheduleReason(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>
						<div className='modal-actions'>
							<button
								className='btn-secondary'
								onClick={() => {
									setView('details');
									setApiError(null);
								}}
								disabled={isSubmitting}
							>
								Back
							</button>
							<button
								className='btn-primary'
								onClick={handleReschedule}
								disabled={isSubmitting || !rescheduleDate}
							>
								{isSubmitting ? 'Saving…' : 'Confirm Reschedule'}
							</button>
						</div>
					</>
				)}

				{apiError && (
					<p
						style={{
							padding: '0.75rem 1.5rem',
							color: '#dc2626',
							fontSize: '0.875rem',
							margin: 0,
						}}
					>
						{apiError}
					</p>
				)}
			</div>
		</div>
	);
};
