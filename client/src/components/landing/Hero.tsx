import { ArrowIcon } from './ArrowIcon';

type HeroProps = { onSignIn: () => void };

export const Hero = ({ onSignIn }: HeroProps) => {
	return (
		<header className='lp-hero'>
			<div className='lp-hero-grid'>
				<div>
					<h1>Spend the visit on the patient.</h1>
					<p className='lp-hero-sub'>
						MediFlow pulls the whole record together and puts an AI assistant in
						the room with you, so nothing slips and nothing slows you down.
					</p>
					<div className='lp-hero-cta'>
						<button
							className='lp-btn lp-btn--primary lp-btn--lg'
							onClick={onSignIn}
						>
							Open the live demo
							<ArrowIcon />
						</button>
					</div>
					<p className='lp-hero-note'>
						One click signs you in as a <b>demo doctor</b>. <br /> Everything
						runs on <b>synthetic patients</b>, no real health data.
					</p>
				</div>

				<div className='lp-hero-visual' aria-hidden='true'>
					<div className='lp-shot'>
						<div className='lp-shot-bar'>
							<i />
							<i />
							<i />
							<span className='lp-shot-url'>mediflow.com/dashboard</span>
						</div>
						<div className='lp-shot-body'>
							<div className='lp-shot-rail'>
								<i className='is-on' />
								<i />
								<i />
								<i />
								<i />
							</div>
							<div className='lp-shot-main'>
								<div className='lp-shot-kpis'>
									<div className='lp-shot-k'>
										<b>12</b>
										<span>Scheduled</span>
									</div>
									<div className='lp-shot-k'>
										<b>8</b>
										<span>Completed</span>
									</div>
									<div className='lp-shot-k'>
										<b className='is-danger'>3</b>
										<span>Critical labs</span>
									</div>
									<div className='lp-shot-k'>
										<b>27</b>
										<span>Next 7 days</span>
									</div>
								</div>
								<div className='lp-shot-card'>
									<div className='lp-shot-mix'>
										<i style={{ flex: 42, background: 'var(--vt-checkup)' }} />
										<i style={{ flex: 38, background: 'var(--vt-followup)' }} />
										<i
											style={{ flex: 19, background: 'var(--vt-specialist)' }}
										/>
										<i style={{ flex: 14, background: 'var(--vt-routine)' }} />
										<i style={{ flex: 12, background: 'var(--vt-urgent)' }} />
										<i
											style={{ flex: 9, background: 'var(--vt-telehealth)' }}
										/>
									</div>
									<div className='lp-shot-line' style={{ width: '60%' }} />
								</div>
								<div className='lp-shot-card'>
									<div className='lp-shot-alert'>
										<span className='lp-shot-badge'>Critical</span>
										Potassium 5.3 mmol/L &middot; Eleanor Whitfield
									</div>
									<div className='lp-shot-alert'>
										<span className='lp-shot-badge'>Critical</span>
										Troponin I 0.90 ng/mL &middot; Harold Baines
									</div>
									<div className='lp-shot-line' style={{ width: '75%' }} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};
