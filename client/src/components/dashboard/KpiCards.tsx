import type { DashboardStats } from '../../store/api/dashboardApi';

interface KpiCardsProps {
	stats: DashboardStats | undefined;
	isLoading: boolean;
}

const CARDS: { key: keyof DashboardStats; label: string; alert?: boolean }[] =
	[
		{ key: 'today_scheduled', label: 'Scheduled today' },
		{ key: 'today_completed', label: 'Completed' },
		{ key: 'today_cancelled', label: 'Cancelled' },
		{ key: 'today_no_show', label: 'No-show' },
		{ key: 'active_medications_total', label: 'Active medications' },
		{ key: 'active_patients', label: 'Active patients' },
		{ key: 'critical_labs_recent', label: 'Critical labs · 7 days', alert: true },
		{ key: 'upcoming_7_days', label: 'Visits · next 7 days' },
	];

export const KpiCards = ({ stats, isLoading }: KpiCardsProps) => (
	<div className="kpi-cards">
		{CARDS.map(({ key, label, alert }) => (
			<div key={key} className={`kpi-card card${alert ? ' kpi-card--alert' : ''}`}>
				<span className="kpi-value">
					{isLoading ? '—' : (stats?.[key] ?? 0)}
				</span>
				<span className="kpi-label">{label}</span>
			</div>
		))}
	</div>
);
