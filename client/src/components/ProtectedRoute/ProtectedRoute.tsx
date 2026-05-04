import { Navigate } from 'react-router';
import { useAuth } from '../../context/Auth/AuthProvider';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { token } = useAuth();

	if (!token) return <Navigate to='/' replace />;

	return <>{children}</>;
};
