import { useState } from 'react';
import { VISIT_TYPES, type VisitType } from '../../types/enums';
import { formatDateTimeLocal } from '../../utils/utils';
import { useAppDispatch } from '../../store/hooks';
import { Modal } from '../Modal/Modal';
import { ensureGoogleConnected } from '../../store/googleCalendarSlice';
import { useScheduleFollowupMutation } from '../../store/api/agentsApi';
import './ScheduleVisitModal.css';

type ScheduleVisitModalProps = {
	patientSerial: string;
	onClose: () => void;
};

const SLOT_MINUTES = 30;

export const ScheduleVisitModal = ({
	patientSerial,
	onClose,
}: ScheduleVisitModalProps) => {
	const minDate = (() => {
		const d = new Date();

		d.setDate(d.getDate() + 1);

		return formatDateTimeLocal(d);
	})();

	const [visitDate, setVisitDate] = useState(minDate);
	const [visitType, setVisitType] = useState<VisitType>('followup');
	const [reason, setReason] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const [dateError, setDateError] = useState<string | null>(null);
	const [reasonError, setReasonError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const dispatch = useAppDispatch();
	const [scheduleFollowup] = useScheduleFollowupMutation();

	const handleConfirm = async () => {
		const start = new Date(visitDate);
		let hasError = false;

		if (!visitDate || Number.isNaN(start.getTime()) || start <= new Date()) {
			setDateError('Visit date and time must be in the future.');
			hasError = true;
		} else {
			setDateError(null);
		}

		if (reason.trim() === '') {
			setReasonError('Reason for the visit is required.');
			hasError = true;
		} else {
			setReasonError(null);
		}

		if (hasError) return;

		setApiError(null);
		setIsSubmitting(true);

		try {
			await dispatch(ensureGoogleConnected()).unwrap();

			const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

			const res = await scheduleFollowup({
				patient_serial_number: patientSerial,
				visit_date: start.toISOString().slice(0, 19),
				visit_type: visitType,
				summary: reason.trim(),
				start_time: start.toISOString(),
				end_time: end.toISOString(),
				description: reason.trim(),
			}).unwrap();

			if (res.success) {
				setDone(true);
			} else {
				throw new Error(res.error || 'Failed to schedule');
			}
		} catch (err) {
			const status = (err as { status?: number })?.status;
			const message = (err as { message?: string })?.message;

			setApiError(
				status === 429
					? 'Rate limit reached. Please wait a minute.'
					: message?.startsWith('Google') ||
						  message?.startsWith('Popup')
						? message
						: 'Failed to schedule visit. Please try again.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			title='Schedule Visit'
			onClose={onClose}
			disabled={isSubmitting}
		>
			<>
				{done ? (
					<div className='schedule-visit-success'>
						<span className='schedule-visit-success-icon'>✓</span>
						<div>
							<strong>Visit Scheduled Successfully</strong>
							<p>You will receive a confirmation shortly.</p>
						</div>
						<button className='btn-primary' onClick={onClose}>
							Close
						</button>
					</div>
				) : (
					<>
						<div className='schedule-visit-form'>
							<div>
								<label htmlFor='schedule-visit-date'>
									Visit date &amp; time
								</label>
								<input
									id='schedule-visit-date'
									type='datetime-local'
									value={visitDate}
									min={minDate}
									onChange={(e) => {
										setVisitDate(e.target.value);
										if (dateError) setDateError(null);
									}}
									disabled={isSubmitting}
								/>
								{dateError && (
									<p className='schedule-visit-field-error'>{dateError}</p>
								)}
							</div>
							<div>
								<label htmlFor='schedule-visit-type'>Visit type</label>
								<select
									id='schedule-visit-type'
									value={visitType}
									onChange={(e) =>
										setVisitType(e.target.value as VisitType)
									}
									disabled={isSubmitting}
								>
									{VISIT_TYPES.map((t) => (
										<option key={t} value={t}>
											{t.replace(/_/g, ' ')}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor='schedule-visit-reason'>Visit reason</label>
								<input
									id='schedule-visit-reason'
									type='text'
									placeholder='Reason for visit...'
									maxLength={200}
									value={reason}
									onChange={(e) => {
										setReason(e.target.value);
										if (reasonError) setReasonError(null);
									}}
									disabled={isSubmitting}
								/>
								{reasonError && (
									<p className='schedule-visit-field-error'>{reasonError}</p>
								)}
							</div>
						</div>
						<div className='modal-actions'>
							<button
								className='btn-secondary'
								onClick={onClose}
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								className='btn-primary'
								onClick={handleConfirm}
								disabled={isSubmitting || !visitDate}
							>
								{isSubmitting ? 'Scheduling…' : 'Confirm'}
							</button>
						</div>
					</>
				)}

				{apiError && <p className='modal-inline-error'>{apiError}</p>}
			</>
		</Modal>
	);
};
