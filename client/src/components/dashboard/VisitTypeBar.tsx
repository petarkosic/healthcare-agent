import type { BreakdownPoint } from '../../store/api/dashboardApi';
import type { VisitType } from '../../types/enums';

const TYPE_COLORS: Record<string, string> = {
	checkup: 'var(--vt-checkup)',
	followup: 'var(--vt-followup)',
	specialist: 'var(--vt-specialist)',
	vaccination: 'var(--vt-vaccination)',
	urgent_care: 'var(--vt-urgent)',
	emergency: 'var(--vt-emergency)',
	surgical: 'var(--vt-surgical)',
	telehealth: 'var(--vt-telehealth)',
	routine: 'var(--vt-routine)',
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
		<div className='card visit-mix-card'>
			<div className='visit-mix-head'>
				<span className='visit-mix-total u-mono'>
					{isLoading ? '—' : total}
				</span>
				<span className='visit-mix-desc'>
					{total === 1 ? 'Visit' : 'Visits'} last 90 days
				</span>
			</div>
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
