import './LandingPage.css';
import { useAppDispatch } from '../../store/hooks';
import { openModal } from '../../store/authSlice';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { BrandMark } from '../../components/landing/ArrowIcon';
import { Hero } from '../../components/landing/Hero';
import { HonestyBand } from '../../components/landing/HonestyBand';
import { FeatureRows } from '../../components/landing/FeatureRows';
import { HowItWorks } from '../../components/landing/HowItWorks';
import { Capabilities } from '../../components/landing/Capabilities';
import { BuiltWith } from '../../components/landing/BuiltWith';
import { FinalCta } from '../../components/landing/FinalCta';

const LandingPage = () => {
	const dispatch = useAppDispatch();
	const signIn = () => dispatch(openModal());
	useDocumentTitle('Clinical workspace');

	return (
		<div className='landing'>
			<nav className='lp-nav'>
				<div className='lp-brand'>
					<BrandMark />
					MediFlow
				</div>
				<div className='lp-nav-mid'>
					<a href='#features'>Features</a>
					<a href='#how'>How it works</a>
					<a href='#tech'>Built with</a>
				</div>
				<div className='lp-nav-r'>
					<ThemeToggle className='lp-theme-toggle' />
					<button className='lp-btn lp-btn--primary' onClick={signIn}>
						Sign in
					</button>
				</div>
			</nav>

			<Hero onSignIn={signIn} />
			<HonestyBand />
			<FeatureRows />
			<HowItWorks />
			<Capabilities />
			<BuiltWith />
			<FinalCta onSignIn={signIn} />

			<footer className='lp-foot'>
				<div className='lp-wrap'>
					<span className='lp-foot-brand'>
						<BrandMark />
						MediFlow
					</span>
					<span>&copy; 2026</span>
				</div>
			</footer>
		</div>
	);
};

export default LandingPage;
