import type { LabAlert } from '../../store/api/dashboardApi';
import { formatDateOnly } from '../../utils/utils';

interface Props {
	alerts: LabAlert[];
	isLoading: boolean;
}

const BADGE_CLASS: Record<string, string> = {
	critical: 'badge--danger',
	abnormal: 'badge--warn',
};

export const LabAlertsPanel = ({ alerts, isLoading }: Props) => (
	<div className="card alerts-panel">
		<div className="card__head">
			<h3 className="card__title">Lab alerts · last 30 days</h3>
		</div>
		{isLoading ? (
			<p className="chart-empty">Loading…</p>
		) : alerts.length === 0 ? (
			<p className="chart-empty">No critical or abnormal results.</p>
		) : (
			<ul className="alerts-list">
				{alerts.map((a) => (
					<li key={a.lab_id} className="alert-item">
						<span
							className={`badge ${BADGE_CLASS[a.result_status] ?? 'badge--neutral'}`}
						>
							{a.result_status}
						</span>
						<span className="alert-test">{a.test_name}</span>
						<span className="alert-value">
							{a.result_value}
							{a.unit ? ` ${a.unit}` : ''}
							{a.reference_range ? ` (ref: ${a.reference_range})` : ''}
						</span>
						<span className="alert-patient">{a.patient_name}</span>
						<span className="alert-date">{formatDateOnly(a.tested_date)}</span>
					</li>
				))}
			</ul>
		)}
	</div>
);
