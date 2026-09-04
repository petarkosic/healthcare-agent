import type { DiagnosisPoint } from '../../store/api/dashboardApi';

interface Props {
	data: DiagnosisPoint[];
	isLoading: boolean;
}

export const TopDiagnosesChart = ({ data, isLoading }: Props) => {
	const max = data.reduce((m, d) => Math.max(m, d.patients), 0);

	return (
		<div className="card diagnoses-panel">
			<div className="card__head">
				<h3 className="card__title">Top diagnoses</h3>
			</div>
			{isLoading ? (
				<p className="chart-empty">Loading…</p>
			) : data.length === 0 ? (
				<p className="chart-empty">No active diagnoses.</p>
			) : (
				<ul className="diagnosis-list">
					{data.map((d) => (
						<li key={d.name} className="diagnosis-row">
							<div className="diagnosis-row__top">
								<span className="diagnosis-name">{d.name}</span>
								<span className="diagnosis-count">
									{d.patients} {d.patients === 1 ? 'patient' : 'patients'}
								</span>
							</div>
							<div className="diagnosis-track">
								<i
									style={{
										width: max ? `${(d.patients / max) * 100}%` : 0,
									}}
								/>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
