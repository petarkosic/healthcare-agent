import type { ReactNode } from 'react';
import type { DashboardStats } from '../../store/api/dashboardApi';

interface KpiCardsProps {
	stats: DashboardStats | undefined;
	isLoading: boolean;
	children?: ReactNode;
}

const CARDS: { key: keyof DashboardStats; label: string }[] = [
	{ key: 'today_scheduled', label: 'Scheduled' },
	{ key: 'today_completed', label: 'Completed' },
	{ key: 'today_cancelled', label: 'Cancelled' },
	{ key: 'today_no_show', label: 'No-Show' },
	{ key: 'active_medications_total', label: 'Active Meds' },
	{ key: 'active_patients', label: 'Active Patients' },
	{ key: 'critical_labs_recent', label: 'Critical Labs' },
	{ key: 'upcoming_7_days', label: 'Next 7 Days' },
];

export const KpiCards = ({ stats, isLoading, children }: KpiCardsProps) => (
	<div className='kpi-cards'>
		{CARDS.map(({ key, label }) => (
			<div key={key} className='kpi-card'>
				<span className='kpi-value'>
					{isLoading ? '—' : (stats?.[key] ?? 0)}
				</span>
				<span className='kpi-label'>{label}</span>
			</div>
		))}
		{children}
	</div>
);
