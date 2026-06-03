import { AuthModal } from './components/AuthModal/AuthModal';
import LandingPage from './components/LandingPage/LandingPage';
import { useAppSelector } from './store/hooks';

function App() {
	const isModalOpen = useAppSelector((state) => state.auth.isModalOpen);

	return (
		<>
			<LandingPage />

			{isModalOpen && <AuthModal />}
		</>
	);
}

export default App;
