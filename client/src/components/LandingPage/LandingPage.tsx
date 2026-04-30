import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import CTASection from './CTASection';
import './LandingPage.css';

const LandingPage: React.FC = () => {
	return (
		<div className='landing-page'>
			<main>
				<HeroSection />
				<FeaturesSection />
				<CTASection />
			</main>

			<footer className='lp-footer'>
				<div className='lp-footer-inner'>
					<span className='lp-footer-copy'>
						© {new Date().getFullYear()} HealthAgent
					</span>
				</div>
			</footer>
		</div>
	);
};

export default LandingPage;
