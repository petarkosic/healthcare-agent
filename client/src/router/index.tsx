import { createBrowserRouter, Outlet } from 'react-router';
import App from '../App';
import PatientProfile from '../components/PatientProfile/PatientProfile';
import { Navbar } from '../components/Navbar/Navbar';
import './layout.css';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { Patients } from '../components/Patients/Patients';

const router = createBrowserRouter([
	{
		path: '/',
		element: (
			<>
				<Navbar />
				<App />
			</>
		),
	},
	{
		path: '/',
		element: (
			<div className='app-layout'>
				<Navbar />
				<Outlet />
			</div>
		),
		children: [
			{
				path: '/patients',
				element: (
					<ProtectedRoute>
						<Patients />,
					</ProtectedRoute>
				),
			},
			{
				path: '/patients/:id',
				element: (
					<ProtectedRoute>
						<PatientProfile />
					</ProtectedRoute>
				),
			},
		],
	},
]);

export default router;
