import { ArrowIcon } from './ArrowIcon';

type FinalCtaProps = { onSignIn: () => void };

export const FinalCta = ({ onSignIn }: FinalCtaProps) => (
	<section className='lp-final'>
		<div className='lp-wrap'>
			<h2>See it running.</h2>
			<p>
				Open the demo as a doctor with a full panel of synthetic patients. No
				signup, nothing to install.
			</p>
			<div className='lp-final-row'>
				<button
					className='lp-btn lp-btn--primary lp-btn--lg'
					onClick={onSignIn}
				>
					Open the live demo
					<ArrowIcon />
				</button>
				<a
					href='https://github.com/petarkosic/healthcare-agent'
					target='_blank'
					rel='noreferrer'
					className='lp-btn lp-btn--outline lp-btn--lg'
				>
					View source
				</a>
			</div>
		</div>
	</section>
);
