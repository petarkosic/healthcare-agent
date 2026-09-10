const CAPS = [
	{
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<rect
					x='3.5'
					y='3.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<rect
					x='13.5'
					y='3.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<rect
					x='13.5'
					y='13.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<rect
					x='3.5'
					y='13.5'
					width='7'
					height='7'
					rx='1.6'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
			</svg>
		),
		title: 'Dashboard',
		body: "Today's schedule, 90-day visit mix, lab alerts and top diagnoses at a glance.",
	},
	{
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<rect
					x='3.8'
					y='5'
					width='16.4'
					height='15'
					rx='2.4'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
				<path
					d='M3.8 9.5h16.4M8.5 3v4M15.5 3v4'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinecap='round'
				/>
			</svg>
		),
		title: 'Scheduling',
		body: 'Book or reschedule visits and push events to Google Calendar without leaving the chart.',
	},
	{
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<path
					d='M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2.5H4.4z'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinejoin='round'
				/>
				<path
					d='M10 19.5a2 2 0 0 0 4 0'
					stroke='currentColor'
					strokeWidth='1.6'
				/>
			</svg>
		),
		title: 'Lab alerting',
		body: 'Critical and abnormal results from the last 30 days surface on the dashboard.',
	},
	{
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<path
					d='M9 3h6M10.2 3v5.4L5.6 16.6A2 2 0 0 0 7.3 19.6h9.4a2 2 0 0 0 1.7-3L13.8 8.4V3'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinejoin='round'
				/>
			</svg>
		),
		title: 'Session-scoped edits',
		body: 'Notes, labs and vitals attach to the active visit, so the record stays coherent.',
	},
	{
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='1.7' />
				<path
					d='m20 20-3.5-3.5'
					stroke='currentColor'
					strokeWidth='1.7'
					strokeLinecap='round'
				/>
			</svg>
		),
		title: 'Fast patient search',
		body: 'Search by patient serial number.',
	},
	{
		icon: (
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<path
					d='M7 8h10M7 12h6M5 20l3-3h11a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinejoin='round'
				/>
			</svg>
		),
		title: 'Printable reports',
		body: 'Generate a clean visit report for any completed encounter.',
	},
];

export const Capabilities = () => (
	<section className='lp-caps'>
		<div className='lp-caps-head'>
			<span className='lp-eyebrow'>Also inside</span>
			<h2>Everything a shift needs.</h2>
			<p>The parts that don&rsquo;t make the headline but carry the day.</p>
		</div>
		<div className='lp-cap-grid'>
			{CAPS.map((c) => (
				<div key={c.title} className='lp-cap'>
					{c.icon}
					<h3>{c.title}</h3>
					<p>{c.body}</p>
				</div>
			))}
		</div>
	</section>
);
