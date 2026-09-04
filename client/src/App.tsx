import { Navigate } from 'react-router';
import { AuthModal } from './components/AuthModal/AuthModal';
import LandingPage from './pages/LandingPage/LandingPage';
import { useAppSelector } from './store/hooks';

function App() {
	const isModalOpen = useAppSelector((state) => state.auth.isModalOpen);
	const doctorSerialNumber = useAppSelector(
		(state) => state.auth.doctorSerialNumber,
	);

	if (doctorSerialNumber) return <Navigate to="/dashboard" replace />;

	return (
		<>
			<LandingPage />

			{isModalOpen && <AuthModal />}
		</>
	);
}

export default App;
