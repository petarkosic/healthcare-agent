import { useState } from 'react';
import type { ChartData } from '../../../types/types';
import { Modal } from '../../Modal/Modal';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

const WIDTH = 280;
const HEIGHT = 160;
const EXPANDED_WIDTH = 560;
const EXPANDED_HEIGHT = 320;
const EXPANDED_WIDTH_SMALL = 300;
const EXPANDED_HEIGHT_SMALL = 220;
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
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

	const indexFromClientX = (clientX: number, svgEl: SVGSVGElement) => {
		const rect = svgEl.getBoundingClientRect();
		const xInViewBox = ((clientX - rect.left) / rect.width) * width;
		const i = Math.round(((xInViewBox - PADDING_LEFT) / plotWidth) * lastIndex);
		return Math.min(Math.max(i, 0), lastIndex);
	};

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width='100%'
			height={height}
			role='img'
			onMouseMove={(e) =>
				setHoverIndex(indexFromClientX(e.clientX, e.currentTarget))
			}
			onMouseLeave={() => setHoverIndex(null)}
			onClick={(e) => {
				const i = indexFromClientX(e.clientX, e.currentTarget);
				setActiveIndex(activeIndex === i ? null : i);
			}}
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

			{hoverIndex !== null && (
				<line
					className='ai-chat__chart-scanline'
					x1={xAt(hoverIndex)}
					x2={xAt(hoverIndex)}
					y1={PADDING_TOP}
					y2={height - PADDING_BOTTOM}
					pointerEvents='none'
				/>
			)}

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
							const isActive = activeIndex === i;
							return (
								<circle
									key={`${p.date}-${i}`}
									cx={x}
									cy={y}
									r={isActive ? 6 : 2.5}
									fill={color}
									className='ai-chat__chart-dot'
									pointerEvents='none'
								/>
							);
						})}
					</g>
				);
			})}

			{activeIndex !== null &&
				(() => {
					const rows = data.lines
						.map((line, lineIndex) => ({
							line,
							lineIndex,
							point: line.points[activeIndex],
						}))
						.filter((r) => r.point);

					if (rows.length === 0) return null;

					const headerText = formatDate(rows[0].point.date);
					const rowTexts = rows.map(
						(r) => `${r.line.name}: ${formatValue(r.point.value)}`,
					);

					const PAD_X = 10;
					const PAD_Y = 8;
					const ROW_H = 15;
					const SWATCH_GAP = 12;
					const longestChars = Math.max(
						headerText.length,
						...rowTexts.map((t) => t.length + 2),
					);
					const boxWidth = longestChars * 5.6 + PAD_X * 2 + SWATCH_GAP;
					const boxHeight = PAD_Y * 2 + ROW_H * (rows.length + 1);

					const x = xAt(activeIndex);

					const boxX = Math.min(
						Math.max(x - boxWidth / 2, PADDING_LEFT),
						width - PADDING_RIGHT - boxWidth,
					);
					const boxY = PADDING_TOP + (plotHeight - boxHeight) / 2;

					return (
						<g className='ai-chat__chart-callout' pointerEvents='none'>
							<rect
								x={boxX}
								y={boxY}
								width={boxWidth}
								height={boxHeight}
								rx={6}
								className='ai-chat__chart-callout-box'
							/>
							<text
								x={boxX + PAD_X}
								y={boxY + PAD_Y + ROW_H / 2}
								className='ai-chat__chart-callout-header'
							>
								{headerText}
							</text>
							{rows.map((r, i) => {
								const rowY = boxY + PAD_Y + ROW_H * (i + 1) + ROW_H / 2;
								const color = LINE_COLORS[r.lineIndex % LINE_COLORS.length];
								return (
									<g key={r.line.name}>
										<circle
											cx={boxX + PAD_X + 4}
											cy={rowY}
											r={3.5}
											fill={color}
										/>
										<text
											x={boxX + PAD_X + SWATCH_GAP}
											y={rowY}
											className='ai-chat__chart-callout-text'
										>
											{r.line.name}: {formatValue(r.point.value)}
										</text>
									</g>
								);
							})}
						</g>
					);
				})()}
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
	const isSmallScreen = useMediaQuery('(max-width: 640px)');

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
							width={isSmallScreen ? EXPANDED_WIDTH_SMALL : EXPANDED_WIDTH}
							height={isSmallScreen ? EXPANDED_HEIGHT_SMALL : EXPANDED_HEIGHT}
						/>
						<ChartLegend data={data} />
					</div>
				</Modal>
			)}
		</>
	);
};
