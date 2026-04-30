import { AuthModal } from './components/AuthModal/AuthModal';
import LandingPage from './components/LandingPage/LandingPage';
import { useAuth } from './context/Auth/AuthProvider';

function App() {
	const { isModalOpen } = useAuth();

	return (
		<>
			<LandingPage />

			{isModalOpen && <AuthModal />}
		</>
	);
}

export default App;
