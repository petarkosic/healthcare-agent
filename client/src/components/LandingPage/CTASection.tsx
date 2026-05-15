import { useNavigate } from 'react-router';
import { useAuth } from '../../context/Auth/AuthProvider';

const CTASection: React.FC = () => {
	const { doctorSerialNumber, openModal } = useAuth();
	const navigate = useNavigate();

	const handleDashboard = () => {
		if (doctorSerialNumber) {
			navigate('/patients');
		} else {
			openModal();
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
