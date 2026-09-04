import type { DiagnosisPoint } from '../../store/api/dashboardApi';

interface Props {
	data: DiagnosisPoint[];
	isLoading: boolean;
}

export const TopDiagnosesChart = ({ data, isLoading }: Props) => {
	return (
		<div className='diagnoses-panel'>
			<h3 className='chart-title'>Top Diagnoses</h3>
			{isLoading ? (
				<p className='chart-empty'>Loading…</p>
			) : data.length === 0 ? (
				<p className='chart-empty'>No active diagnoses.</p>
			) : (
				<ul className='diagnosis-list'>
					{data.map((d) => (
						<li key={d.name} className='diagnosis-row'>
							<span className='diagnosis-name'>{d.name}</span>
							<span className='diagnosis-count'>
								{d.patients} {d.patients === 1 ? 'patient' : 'patients'}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
