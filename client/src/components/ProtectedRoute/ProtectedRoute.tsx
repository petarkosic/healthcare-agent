import { Navigate } from 'react-router';
import { useAuth } from '../../context/Auth/AuthProvider';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { doctorSerialNumber, isLoading } = useAuth();

	if (isLoading) return null;

	if (!doctorSerialNumber) return <Navigate to='/' replace />;

	return <>{children}</>;
};
