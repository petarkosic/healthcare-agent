import type { DashboardStats } from '../../store/api/dashboardApi';

interface KpiCardsProps {
	stats: DashboardStats | undefined;
	isLoading: boolean;
}

const CARDS: { key: keyof DashboardStats; label: string; color: string }[] = [
	{ key: 'today_scheduled', label: 'Scheduled', color: '#6366f1' },
	{ key: 'today_completed', label: 'Completed', color: '#22c55e' },
	{ key: 'today_cancelled', label: 'Cancelled', color: '#ef4444' },
	{ key: 'today_no_show', label: 'No-Show', color: '#f97316' },
	{ key: 'active_medications_total', label: 'Active Meds', color: '#0ea5e9' },
];

export const KpiCards = ({ stats, isLoading }: KpiCardsProps) => (
	<div className='kpi-cards'>
		{CARDS.map(({ key, label, color }) => (
			<div key={key} className='kpi-card' style={{ borderTopColor: color }}>
				<span className='kpi-value'>
					{isLoading ? '—' : (stats?.[key] ?? 0)}
				</span>
				<span className='kpi-label'>{label}</span>
			</div>
		))}
	</div>
);
