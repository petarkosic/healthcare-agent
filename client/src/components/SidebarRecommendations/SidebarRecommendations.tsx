import { useState } from 'react';
import type {
	Recommendation,
	RecommendationsResponse,
	ResponseData,
} from '../../types/types';
import './SidebarRecommendations.css';
import { formatDateTimeLocal } from '../../utils/utils';
import { useLocation } from 'react-router';
import { useAppDispatch } from '../../store/hooks';
import { ensureGoogleConnected } from '../../store/googleCalendarSlice';
import { useScheduleFollowupMutation } from '../../store/api/agentsApi';

type SidebarRecommendationsProps = {
	data: ResponseData | null;
};

const isRecommendationsResponse = (
	data: ResponseData,
): data is RecommendationsResponse => {
	return 'recommendations' in data;
};

export const SidebarRecommendations = ({
	data,
}: SidebarRecommendationsProps) => {
	const [viewMode, setViewMode] = useState<'card' | 'schedule' | 'success'>(
		'card',
	);
	const [selectedDate, setSelectedDate] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [scheduleError, setScheduleError] = useState<string | null>(null);
	const [selectedRecommendation, setSelectedRecommendation] =
		useState<Recommendation | null>(null);

	const location = useLocation();
	const patient_id = location.pathname.split('/')[2];
	const dispatch = useAppDispatch();
	const [scheduleFollowup] = useScheduleFollowupMutation();

	if (!data || !isRecommendationsResponse(data)) return null;

	const handleViewModeChange = (item: Recommendation) => {
		setSelectedRecommendation(item);

		if (viewMode === 'card') {
			const suggestedDate = new Date();

			if (item?.follow_up?.offset_days) {
				suggestedDate.setDate(
					suggestedDate.getDate() + item.follow_up.offset_days,
				);
				// Format for datetime-local input: YYYY-MM-DDTHH:mm
				const formatted = formatDateTimeLocal(suggestedDate);

				setSelectedDate(formatted);
			}

			setViewMode('schedule');
		}
	};

	const handleCancel = () => {
		setViewMode('card');
		setSelectedRecommendation(null);
		setSelectedDate('');
		setScheduleError(null);
	};

	const handleConfirm = async () => {
		setIsLoading(true);

		try {
			await dispatch(ensureGoogleConnected()).unwrap();

			const startDate = new Date(selectedDate);
			const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

			const res = await scheduleFollowup({
				patient_serial_number: patient_id,
				visit_date: startDate.toISOString().slice(0, 19),
				visit_type: 'followup',
				summary: selectedRecommendation?.follow_up?.reason ?? '',
				start_time: startDate.toISOString(),
				end_time: endDate.toISOString(),
				description: selectedRecommendation?.reason || 'Follow-up appointment',
			}).unwrap();

			if (res.success) {
				setViewMode('success');
			} else {
				throw new Error(res.error || 'Failed to schedule');
			}
		} catch (error) {
			const status = (error as { status?: number })?.status;

			setScheduleError(
				status === 429
					? 'Rate limit reached. Please wait a minute.'
					: 'Failed to schedule. Please try again.',
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='recommendations-container'>
			<h4>Recommendations</h4>

			{viewMode == 'card' &&
				data?.recommendations?.map((item: Recommendation, index: number) => (
					<div className='recommendation-item' key={index}>
						<div className='recommendation-priority'>
							<div>
								Priority:{' '}
								<span className={`priority ${item.priority}`}>
									{item.priority}
								</span>
							</div>

							{item.follow_up && (
								<div className='follow-up'>
									<button onClick={() => handleViewModeChange(item)}>
										&#128197;
									</button>
								</div>
							)}
						</div>
						<div className='recommendation-text'>
							<strong>{item.recommendation}</strong>
						</div>
						<div className='recommendation-reason'>
							<em>Reason: {item.reason}</em>
						</div>
					</div>
				))}

			{viewMode === 'schedule' && data && (
				<div className='recommendation-item schedule-mode'>
					<div className='schedule-header'>
						<h5 className='schedule-title'>Confirm Follow-up Visit</h5>
					</div>

					<div className='schedule-body'>
						<label className='schedule-label' htmlFor='visit-datetime'>
							Select Date & Time
						</label>
						<input
							id='visit-datetime'
							type='datetime-local'
							className='schedule-datetime-input'
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
						/>

						<p className='schedule-suggestion'>
							<strong>Suggested:</strong>{' '}
							{selectedRecommendation?.follow_up?.offset_days} days from now
							<br />
							<em>{selectedRecommendation?.follow_up?.reason}</em>
						</p>

						{scheduleError && <p className='schedule-error'>{scheduleError}</p>}

						<div className='schedule-actions'>
							<button
								className='btn-confirm'
								onClick={handleConfirm}
								disabled={isLoading || !selectedDate}
							>
								{isLoading ? 'Scheduling...' : 'Confirm'}
							</button>
							<button
								className='btn-cancel'
								onClick={handleCancel}
								disabled={isLoading}
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{viewMode === 'success' && (
				<div className='recommendation-item success-mode'>
					<div className='success-content'>
						<span className='success-icon'>✓</span>
						<div className='success-text'>
							<strong>Visit Scheduled Successfully</strong>
							<p>You will receive a confirmation shortly.</p>
						</div>
					</div>
					<button className='btn-back' onClick={() => setViewMode('card')}>
						Back to Recommendations
					</button>
				</div>
			)}
		</div>
	);
};
