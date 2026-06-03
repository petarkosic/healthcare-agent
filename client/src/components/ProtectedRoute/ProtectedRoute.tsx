import { Navigate } from 'react-router';
import { useAppSelector } from '../../store/hooks';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { doctorSerialNumber, isLoading } = useAppSelector((state) => state.auth);

	if (isLoading) return null;

	if (!doctorSerialNumber) return <Navigate to='/' replace />;

	return <>{children}</>;
};
