import { CheckIcon } from './ArrowIcon';

const SparkleIcon = () => (
	<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
		<path
			d='M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 16l-1.8-4.5L5 9.7l5.2-1.8L12 3Z'
			stroke='currentColor'
			strokeWidth='1.5'
			strokeLinejoin='round'
		/>
	</svg>
);

const AiPanelMock = () => (
	<div className='lp-ai' aria-hidden='true'>
		<div className='lp-ai-h'>
			<SparkleIcon />
			AI Assistant
		</div>
		<div className='lp-ai-b'>
			<p className='lp-ai-ov'>
				47-year-old with essential hypertension, hyperlipidemia and type&nbsp;2
				diabetes. Last visit was a medication review; BP and lipids at target.
				Recent labs show potassium above range and HbA1c above the plan&rsquo;s
				goal.
			</p>
			<div className='lp-ai-crit'>
				<h4>Critical findings</h4>
				<ul>
					<li>
						Serum potassium 5.3&nbsp;mmol/L &mdash; above range; review ACE
						inhibitor dosing.
					</li>
					<li>
						HbA1c 6.4% &mdash; above target for this patient&rsquo;s plan.
					</li>
				</ul>
			</div>
			<ul className='lp-ai-q'>
				<li>Are you taking the ramipril every day, and any side effects?</li>
				<li>
					Any new leg swelling, breathlessness, or dizziness since the last
					visit?
				</li>
			</ul>
		</div>
		<div className='lp-ai-foot'>
			<div className='lp-ai-seg'>Recommendations</div>
			<div className='lp-ai-seg'>Medications</div>
		</div>
	</div>
);

const ChartMock = () => (
	<div className='lp-chart-mock' aria-hidden='true'>
		<div className='lp-cm'>
			<span className='lp-cm-t'>Vitals</span>
			<div className='lp-cm-g'>
				<i />
				<i />
				<i />
				<i />
				<i />
				<i />
			</div>
		</div>
		<div className='lp-cm'>
			<span className='lp-cm-t'>Medications</span>
			<div className='lp-cm-rows'>
				<i style={{ width: '90%' }} />
				<i style={{ width: '80%' }} />
				<i style={{ width: '85%' }} />
				<i style={{ width: '70%' }} />
			</div>
		</div>
		<div className='lp-cm'>
			<span className='lp-cm-t'>Lab results</span>
			<div className='lp-cm-rows'>
				<i style={{ width: '95%' }} />
				<i style={{ width: '88%' }} />
				<i style={{ width: '92%' }} />
			</div>
		</div>
		<div className='lp-cm'>
			<span className='lp-cm-t'>Diagnoses</span>
			<div className='lp-cm-rows'>
				<i style={{ width: '80%' }} />
				<i style={{ width: '75%' }} />
				<i style={{ width: '82%' }} />
			</div>
		</div>
		<div className='lp-cm lp-cm--full'>
			<span className='lp-cm-t'>Visit history</span>
			<div className='lp-cm-rows'>
				<i style={{ width: '100%' }} />
				<i style={{ width: '100%' }} />
				<i style={{ width: '100%' }} />
			</div>
		</div>
	</div>
);

const MedMock = () => (
	<div className='lp-med-mock' aria-hidden='true'>
		<div className='lp-med-t'>Suggested changes</div>
		<div className='lp-mm'>
			<div className='lp-mm-top'>
				<span className='lp-mm-act lp-mm-act--inc'>Increase</span>
				<span className='lp-mm-nm'>Lisinopril</span>
			</div>
			<div className='lp-mm-dose'>20 mg &middot; once daily</div>
			<div className='lp-mm-rsn'>
				Reason: elevated blood pressure at last two visits
			</div>
		</div>
		<div className='lp-mm'>
			<div className='lp-mm-top'>
				<span className='lp-mm-act lp-mm-act--add'>Add</span>
				<span className='lp-mm-nm'>Metformin</span>
			</div>
			<div className='lp-mm-dose'>500 mg &middot; twice daily</div>
			<div className='lp-mm-rsn'>
				Reason: HbA1c above target; first-line for type 2 diabetes
			</div>
		</div>
		<div className='lp-mm'>
			<div className='lp-mm-top'>
				<span className='lp-mm-act lp-mm-act--add'>Add</span>
				<span className='lp-mm-nm'>Empagliflozin</span>
			</div>
			<div className='lp-mm-dose'>10 mg &middot; once daily</div>
			<div className='lp-mm-rsn'>
				Reason: glycemic control with cardiovascular benefit
			</div>
		</div>
	</div>
);

type Row = {
	eyebrow: string;
	title: string;
	body: React.ReactNode;
	points: string[];
	visual: React.ReactNode;
	alt?: boolean;
};

const ROWS: Row[] = [
	{
		eyebrow: 'AI patient brief',
		title: 'A read on the patient, the moment you need one.',
		body: (
			<>
				Open the assistant during the visit for a plain-language take on where
				the patient stands: active problems, recent labs, and what can&rsquo;t
				wait. Chart something new and the next read reflects it.
			</>
		),
		points: [
			'Critical findings pulled to the top: out-of-range labs, interactions',
			'Suggested questions worth asking this patient',
			"Grounded in the patient's own history, not generic advice",
		],
		visual: <AiPanelMock />,
	},
	{
		eyebrow: 'The chart',
		title: 'The whole record, on one screen.',
		body: (
			<>
				Vitals, medications, clinical notes, labs, diagnoses and visit history
				sit together, no tab-hopping, no digging. An allergy banner stays pinned
				so it&rsquo;s never missed.
			</>
		),
		points: [
			'Six record sections in a single scannable grid',
			'Add a note, lab, med or diagnosis inline during a visit',
			'Printable visit report for every encounter',
		],
		visual: <ChartMock />,
		alt: true,
	},
	{
		eyebrow: 'Guardrailed suggestions',
		title: 'Medication ideas with real numbers and a safety net.',
		body: (
			<>
				When the assistant proposes a change it gives a concrete dose and
				frequency, matched to the patient&rsquo;s conditions and current meds.
				Every AI response is validated against a schema and a guardrail check
				before it reaches you.
			</>
		),
		points: [
			'Add / increase / continue / stop - each with a stated reason',
			'Prompt-injection defenses on all patient-derived text',
			'Traced end-to-end so every generation is auditable',
		],
		visual: <MedMock />,
	},
];

export const FeatureRows = () => (
	<>
		{ROWS.map((row, i) => (
			<section
				key={row.eyebrow}
				className={`lp-feat${row.alt ? ' lp-feat--alt' : ''}`}
				id={i === 0 ? 'features' : undefined}
			>
				<div className='lp-feat-grid'>
					<div className='lp-feat-copy'>
						<span className='lp-eyebrow'>{row.eyebrow}</span>
						<h2>{row.title}</h2>
						<p>{row.body}</p>
						<ul className='lp-pts'>
							{row.points.map((p) => (
								<li key={p}>
									<CheckIcon />
									{p}
								</li>
							))}
						</ul>
					</div>
					<div className='lp-feat-visual'>{row.visual}</div>
				</div>
			</section>
		))}
	</>
);
