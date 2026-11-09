import { useState } from 'react';
import type { ChartData } from '../../../types/types';
import { Modal } from '../../Modal/Modal';

const WIDTH = 280;
const HEIGHT = 160;
const EXPANDED_WIDTH = 560;
const EXPANDED_HEIGHT = 320;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 22;

const Y_TICKS = 4;

const LINE_COLORS = [
	'var(--chart-line-1)',
	'var(--chart-line-2)',
	'var(--chart-line-3)',
	'var(--chart-line-4)',
];

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});

const formatValue = (value: number) =>
	Number.isInteger(value) ? String(value) : value.toFixed(1);

const ChartSvg = ({
	data,
	width,
	height,
}: {
	data: ChartData;
	width: number;
	height: number;
}) => {
	const values = data.lines.flatMap((l) => l.points.map((p) => p.value));
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;

	const longestLine = data.lines.reduce((a, b) =>
		a.points.length >= b.points.length ? a : b,
	);
	const lastIndex = Math.max(longestLine.points.length - 1, 1);

	const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
	const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

	const xAt = (i: number) => PADDING_LEFT + (i / lastIndex) * plotWidth;
	const yAt = (value: number) =>
		PADDING_TOP + plotHeight - ((value - min) / range) * plotHeight;

	const yTicks = Array.from(
		{ length: Y_TICKS + 1 },
		(_, i) => min + (range * i) / Y_TICKS,
	);

	const lastDataIndex = longestLine.points.length - 1;
	const xTickIndexes = Array.from(
		new Set([0, Math.round(lastDataIndex / 2), lastDataIndex]),
	);

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width='100%'
			height={height}
			role='img'
		>
			{yTicks.map((tick) => (
				<g key={tick}>
					<line
						className='ai-chat__chart-gridline'
						x1={PADDING_LEFT}
						x2={width - PADDING_RIGHT}
						y1={yAt(tick)}
						y2={yAt(tick)}
					/>
					<text
						className='ai-chat__chart-tick'
						x={PADDING_LEFT - 6}
						y={yAt(tick)}
						textAnchor='end'
						dominantBaseline='middle'
					>
						{formatValue(tick)}
					</text>
				</g>
			))}

			<line
				className='ai-chat__chart-axis'
				x1={PADDING_LEFT}
				x2={PADDING_LEFT}
				y1={PADDING_TOP}
				y2={height - PADDING_BOTTOM}
			/>
			<line
				className='ai-chat__chart-axis'
				x1={PADDING_LEFT}
				x2={width - PADDING_RIGHT}
				y1={height - PADDING_BOTTOM}
				y2={height - PADDING_BOTTOM}
			/>

			{xTickIndexes.map((i, idx) => (
				<text
					key={i}
					className='ai-chat__chart-tick'
					x={xAt(i)}
					y={height - PADDING_BOTTOM + 14}
					textAnchor={
						idx === 0
							? 'start'
							: idx === xTickIndexes.length - 1
								? 'end'
								: 'middle'
					}
				>
					{formatDate(longestLine.points[i].date)}
				</text>
			))}

			{data.lines.map((line, lineIndex) => {
				const color = LINE_COLORS[lineIndex % LINE_COLORS.length];
				const points = line.points.map((p, i) => `${xAt(i)},${yAt(p.value)}`);

				return (
					<g key={line.name}>
						<polyline
							points={points.join(' ')}
							fill='none'
							stroke={color}
							strokeWidth={2}
						/>
						{line.points.map((p, i) => {
							const [x, y] = points[i].split(',');
							return (
								<g key={`${p.date}-${i}`} className='ai-chat__chart-point'>
									<circle
										cx={x}
										cy={y}
										r={8}
										fill='transparent'
										className='ai-chat__chart-hit'
									>
										<title>
											{line.name} — {formatDate(p.date)}: {formatValue(p.value)}
										</title>
									</circle>
									<circle
										cx={x}
										cy={y}
										r={2.5}
										fill={color}
										className='ai-chat__chart-dot'
									/>
								</g>
							);
						})}
					</g>
				);
			})}
		</svg>
	);
};

const ChartLegend = ({ data }: { data: ChartData }) => {
	if (data.lines.length < 2) return null;

	return (
		<ul className='ai-chat__chart-legend'>
			{data.lines.map((line, i) => (
				<li key={line.name}>
					<span
						className='ai-chat__chart-legend-swatch'
						style={{ background: LINE_COLORS[i % LINE_COLORS.length] }}
					/>
					{line.name}
				</li>
			))}
		</ul>
	);
};

export const ChatChart = ({ data }: { data: ChartData }) => {
	const [expanded, setExpanded] = useState(false);

	if (!data.lines?.length || data.lines.every((l) => l.points?.length === 0))
		return null;

	return (
		<>
			<figure className='ai-chat__chart' aria-label={data.label}>
				<ChartSvg data={data} width={WIDTH} height={HEIGHT} />
				<ChartLegend data={data} />
				<figcaption>
					{data.label}
					<button
						type='button'
						className='ai-chat__chart-expand'
						aria-label='Enlarge chart'
						onClick={() => setExpanded(true)}
					>
						⤢
					</button>
				</figcaption>
			</figure>
			{expanded && (
				<Modal
					title={data.label}
					onClose={() => setExpanded(false)}
					size='wide'
				>
					<div className='modal-body ai-chat__chart-modal-body'>
						<ChartSvg
							data={data}
							width={EXPANDED_WIDTH}
							height={EXPANDED_HEIGHT}
						/>
						<ChartLegend data={data} />
					</div>
				</Modal>
			)}
		</>
	);
};
