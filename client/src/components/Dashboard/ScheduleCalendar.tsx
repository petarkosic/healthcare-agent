import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { ScheduleVisit } from '../../store/api/dashboardApi';

interface ScheduleCalendarProps {
	selectedDate: Date;
	onDateChange: (date: Date) => void;
	visits: ScheduleVisit[];
	isLoading: boolean;
}

const VISIT_TYPE_COLORS: Record<string, string> = {
	checkup: '#6366f1',
	followup: '#22c55e',
	emergency: '#ef4444',
	specialist: '#f97316',
	vaccination: '#0ea5e9',
	routine: '#8b5cf6',
	urgent_care: '#f43f5e',
	surgical: '#78716c',
	telehealth: '#14b8a6',
};

const STATUS_COLORS: Record<string, string> = {
	scheduled: '#6366f1',
	'in-progress': '#f59e0b',
	completed: '#22c55e',
	cancelled: '#ef4444',
	'no-show': '#f97316',
};

function formatTime(isoDate: string): string {
	return new Date(isoDate).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	});
}

export const ScheduleCalendar = ({
	selectedDate,
	onDateChange,
	visits,
	isLoading,
}: ScheduleCalendarProps) => {
	const dateLabel = selectedDate.toLocaleDateString([], {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});

	return (
		<div className='schedule-section'>
			<div className='calendar-wrapper'>
				<Calendar
					onChange={(val) => onDateChange(val as Date)}
					value={selectedDate}
				/>
			</div>

			<div className='day-detail'>
				<h3 className='day-detail-title'>{dateLabel}</h3>

				{isLoading ? (
					<p className='day-detail-empty'>Loading…</p>
				) : visits.length === 0 ? (
					<p className='day-detail-empty'>No visits scheduled.</p>
				) : (
					<ul className='visit-list'>
						{visits.map((v) => (
							<li key={v.visit_id} className='visit-item'>
								<span className='visit-time'>{formatTime(v.visit_date)}</span>
								<span
									className='visit-type-badge'
									style={{
										backgroundColor:
											VISIT_TYPE_COLORS[v.visit_type] ?? '#64748b',
									}}
								>
									{v.visit_type.replace(/_/g, ' ')}
								</span>
								<span className='visit-meta'>
									{v.duration_minutes}m &middot; {v.location}
								</span>
								<span
									className='visit-status'
									style={{ color: STATUS_COLORS[v.status] ?? '#64748b' }}
								>
									{v.status}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
