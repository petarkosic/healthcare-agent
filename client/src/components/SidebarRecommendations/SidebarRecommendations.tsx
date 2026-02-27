import { useState } from 'react';
import type {
	Recommendation,
	RecommendationsResponse,
	ResponseData,
} from '../../types/types';
import './SidebarRecommendations.css';

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
	const [viewMode, setViewMode] = useState('card');
	const [selectedDate, setSelectedDate] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	if (!data || !isRecommendationsResponse(data)) return null;

	const handleViewModeChange = () => {
		if (viewMode === 'card') {
			if (data?.follow_up?.offset_days) {
				const suggestedDate = new Date();
				suggestedDate.setDate(
					suggestedDate.getDate() + data?.follow_up?.offset_days,
				);
				// Format for datetime-local input: YYYY-MM-DDTHH:mm
				const formatted = suggestedDate.toISOString().slice(0, 16);
				setSelectedDate(formatted);
				setViewMode('schedule');
			}
		}
	};

	const handleCancel = () => {
		setViewMode('card');
		setSelectedDate('');
	};

	const handleConfirm = async () => {
		setIsLoading(true);
		try {
			// TODO: Replace with actual API call

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

			{viewMode == 'card' && (
				{data?.recommendations?.map((item: Recommendation, index: number) => (	
				<div className='recommendation-item' key={index}>
					<div className='recommendation-priority'>
						<div>
							Priority:{' '}
							<span className={`priority ${item.priority}`}>
								{item.priority}
							</span>
						</div>

						{viewMode == 'card' && item.follow_up && (
							<div className='follow-up'>
								<button onClick={handleViewModeChange}>&#128197;</button>
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
			)}

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
							<strong>Suggested:</strong> {data.follow_up?.offset_days} days
							from now
							<br />
							<em>{data.follow_up?.reason}</em>
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
