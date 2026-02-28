import { useState } from 'react';
import type {
	Recommendation,
	RecommendationsResponse,
	ResponseData,
} from '../../types/types';
import './SidebarRecommendations.css';
import { formatDateTimeLocal } from '../../utils/utils';
import { useLocation } from 'react-router';

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
	const [selectedRecommendation, setSelectedRecommendation] =
		useState<Recommendation | null>(null);

	const location = useLocation();
	const patient_id = location.pathname.split('/')[2];

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
	};

	const handleConfirm = async () => {
		setIsLoading(true);

		try {
			const startDate = new Date(selectedDate);
			// Default 30 minutes duration for a visit
			const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

			const response = await fetch(
				'http://localhost:8000/api/agents/schedule-followup',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						summary: patient_id,
						start_time: startDate.toISOString(),
						end_time: endDate.toISOString(),
						description: selectedRecommendation?.reason,
					}),
				},
			);

			if (!response.ok) {
				throw new Error('Failed to add note');
			}

			await response.json();

			setViewMode('success');
		} catch (error) {
			console.error('Scheduling failed:', error);
			alert('Failed to schedule. Please try again.');
			setViewMode('card');
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
