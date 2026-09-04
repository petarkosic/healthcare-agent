import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { openModal } from '../../store/authSlice';

const CTASection: React.FC = () => {
	const dispatch = useAppDispatch();
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);
	const navigate = useNavigate();

	const handleDashboard = () => {
		if (doctorSerialNumber) {
			navigate('/dashboard');
		} else {
			dispatch(openModal());
		}
	};

	return (
		<section className='lp-cta'>
			<h2 className='lp-cta-title'>Ready to get started?</h2>
			<p className='lp-cta-sub'>
				Open the dashboard and start exploring patient records with AI-powered
				clinical insights.
			</p>
			<div className='lp-cta-actions'>
				<button
					onClick={handleDashboard}
					className='lp-btn lp-btn-primary lp-btn-lg'
				>
					Open Dashboard
				</button>
			</div>
		</section>
	);
};

export default CTASection;
