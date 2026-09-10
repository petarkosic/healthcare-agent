export const HonestyBand = () => (
	<div className='lp-band'>
		<div className='lp-wrap'>
			<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
				<path
					d='M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinejoin='round'
				/>
				<path
					d='M9 12l2 2 4-4'
					stroke='currentColor'
					strokeWidth='1.6'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			</svg>
			<span>
				<b>Not a certified EHR.</b> Every patient, visit and lab result is
				generated synthetic data. No real health information is ever entered.
			</span>
		</div>
	</div>
);
