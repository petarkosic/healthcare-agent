import type { LabAlert } from '../../store/api/dashboardApi';
import { formatDateOnly } from '../../utils/utils';

interface Props {
	alerts: LabAlert[];
	isLoading: boolean;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
	critical: { bg: '#fef2f2', color: '#dc2626' },
	abnormal: { bg: '#fffbeb', color: '#d97706' },
};

export const LabAlertsPanel = ({ alerts, isLoading }: Props) => (
	<div className='alerts-panel'>
		<h3 className='chart-title'>Lab Alerts - Last 30 Days</h3>
		{isLoading ? (
			<p className='chart-empty'>Loading…</p>
		) : alerts.length === 0 ? (
			<p className='chart-empty'>No critical or abnormal results.</p>
		) : (
			<ul className='alerts-list'>
				{alerts.map((a) => {
					const style = STATUS_STYLE[a.result_status];
					return (
						<li key={a.lab_id} className='alert-item'>
							<span
								className='alert-badge'
								style={{ background: style.bg, color: style.color }}
							>
								{a.result_status}
							</span>
							<span className='alert-test'>{a.test_name}</span>
							<span className='alert-value'>
								{a.result_value}
								{a.unit ? ` ${a.unit}` : ''}
								{a.reference_range ? ` (ref: ${a.reference_range})` : ''}
							</span>
							<span className='alert-patient'>{a.patient_name}</span>
							<span className='alert-date'>
								{formatDateOnly(a.tested_date)}
							</span>
						</li>
					);
				})}
			</ul>
		)}
	</div>
);
