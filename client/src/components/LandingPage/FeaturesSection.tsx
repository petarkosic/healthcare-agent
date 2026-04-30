const features = [
	{
		icon: (
			<svg
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='1.75'
				aria-hidden='true'
			>
				<path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' />
				<circle cx='9' cy='7' r='4' />
				<path d='M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' />
			</svg>
		),
		title: 'Patient Management',
		description:
			'Browse and search your full patient list. Open any patient to see their complete medical history — vitals, medications, allergies, lab results, diagnoses, and visit notes in one place.',
	},
	{
		icon: (
			<svg
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='1.75'
				aria-hidden='true'
			>
				<polyline points='22 12 18 12 15 21 9 3 6 12 2 12' />
			</svg>
		),
		title: 'Visit Session Tracking',
		description:
			'Start a timed visit session with a single click. Select visit type and location, track consultation duration, and log the chief complaint — all automatically saved to the patient record.',
	},
	{
		icon: (
			<svg
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='1.75'
				aria-hidden='true'
			>
				<path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' />
			</svg>
		),
		title: 'AI Clinical Assistant',
		description:
			"Open the AI sidebar on any patient to get an instant overview, flag potential medication interactions, and receive evidence-based treatment recommendations tailored to that patient's data.",
	},
];

const FeaturesSection: React.FC = () => {
	return (
		<section className='lp-features' id='features'>
			<div className='lp-inner'>
				<div className='lp-section-header'>
					<span className='lp-section-label'>Features</span>
					<h2 className='lp-section-title'>
						Everything you need during a consultation
					</h2>
					<p className='lp-section-sub'>
						Designed to reduce time spent looking up patient history so you can
						focus on care.
					</p>
				</div>

				<div className='lp-features-grid'>
					{features.map((f) => (
						<div key={f.title} className='lp-feature-card'>
							<div className='lp-feature-icon'>{f.icon}</div>
							<h3 className='lp-feature-title'>{f.title}</h3>
							<p className='lp-feature-desc'>{f.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default FeaturesSection;
