import type { BreakdownPoint } from '../../store/api/dashboardApi';
import type { VisitType } from '../../types/enums';

const TYPE_COLORS: Record<string, string> = {
	checkup: '#2a78d6',
	followup: '#1baf7a',
	specialist: '#eda100',
	vaccination: '#008300',
	urgent_care: '#4a3aa7',
	emergency: '#e34948',
	surgical: '#e87ba4',
	telehealth: '#eb6834',
	routine: '#0f766e',
} satisfies Record<VisitType, string>;

interface Props {
	data: BreakdownPoint[];
	isLoading: boolean;
}

function toSegments(data: BreakdownPoint[]) {
	return [...data]
		.sort((a, b) => b.value - a.value)
		.map((d) => ({
			name: d.name,
			value: d.value,
			color: TYPE_COLORS[d.name],
		}));
}

export const VisitTypeBar = ({ data, isLoading }: Props) => {
	const total = data.reduce((sum, d) => sum + d.value, 0);
	const segments = toSegments(data);

	return (
		<div className='kpi-card kpi-card--wide'>
			<span className='kpi-value'>{isLoading ? '—' : total}</span>
			<span className='kpi-label'>Visits (last 90 days)</span>
			{!isLoading && total > 0 && (
				<>
					<div className='visit-type-bar'>
						{segments.map((s) => (
							<div
								key={s.name}
								className='visit-type-segment'
								style={{ flexGrow: s.value, background: s.color }}
								title={`${s.name.replace(/_/g, ' ')}: ${s.value}`}
							/>
						))}
					</div>
					<div className='visit-type-legend'>
						{segments.map((s) => (
							<span key={s.name} className='legend-item'>
								<i style={{ background: s.color }} />
								{s.name.replace(/_/g, ' ')}
							</span>
						))}
					</div>
				</>
			)}
		</div>
	);
};
