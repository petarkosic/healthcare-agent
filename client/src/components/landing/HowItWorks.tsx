const STEPS = [
	{
		n: '1',
		title: 'Find the patient',
		body: 'Search your list by patient serial number and open the chart.',
	},
	{
		n: '2',
		title: 'Start the visit',
		body: 'One click starts a timed session - type, location, chief complaint - and it can drop the follow-up onto your Google Calendar.',
	},
	{
		n: '3',
		title: 'Read the brief, then act',
		body: 'The AI assistant summarizes and flags; you chart vitals, notes, meds and labs against the session.',
	},
];

export const HowItWorks = () => (
	<section className='lp-how' id='how'>
		<div className='lp-how-head'>
			<span className='lp-eyebrow'>How it works</span>
			<h2>Three steps from list to plan.</h2>
		</div>
		<div className='lp-steps'>
			{STEPS.map((s) => (
				<div key={s.n} className='lp-step'>
					<div className='lp-step-n'>{s.n}</div>
					<h3>{s.title}</h3>
					<p>{s.body}</p>
				</div>
			))}
		</div>
	</section>
);
