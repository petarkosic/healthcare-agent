import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { openModal } from '../../store/authSlice';

const HeroSection: React.FC = () => {
	const dispatch = useAppDispatch();
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);
	const navigate = useNavigate();

	const handleDashboard = () => {
		if (doctorSerialNumber) {
			navigate('/patients');
		} else {
			dispatch(openModal());
		}
	};

	return (
		<section className='lp-hero'>
			<div className='lp-hero-inner'>
				<div className='lp-hero-badge'>
					<svg
						width='12'
						height='12'
						viewBox='0 0 24 24'
						fill='currentColor'
						aria-hidden='true'
					>
						<path d='M12 2a10 10 0 110 20A10 10 0 0112 2zm0 2a8 8 0 100 16A8 8 0 0012 4zm0 3a1 1 0 011 1v4h3a1 1 0 110 2h-4a1 1 0 01-1-1V8a1 1 0 011-1z' />
					</svg>
					For healthcare professionals
				</div>

				<h1 className='lp-hero-h1'>
					AI-assisted clinical decisions for every patient visit
				</h1>

				<p className='lp-hero-sub'>
					HealthAgent gives doctors a complete patient view — vitals, labs,
					medications, diagnoses — with an AI assistant that summarizes patient
					status and surfaces treatment recommendations in seconds.
				</p>

				<div className='lp-hero-actions'>
					<button
						onClick={handleDashboard}
						className='lp-btn lp-btn-primary lp-btn-lg'
					>
						Open Dashboard
					</button>
					<a href='#features' className='lp-btn lp-btn-outline lp-btn-lg'>
						Learn more
					</a>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
