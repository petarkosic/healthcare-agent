import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import App from '../App';
import { Navbar } from '../components/Navbar/Navbar';
import './layout.css';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';

const Patients = lazy(() =>
	import('../components/Patients/Patients').then((m) => ({
		default: m.Patients,
	})),
);
const AddPatient = lazy(() =>
	import('../components/AddPatient/AddPatient').then((m) => ({
		default: m.AddPatient,
	})),
);
const PatientProfile = lazy(
	() => import('../components/PatientProfile/PatientProfile'),
);

const RouteLoader = (
	<div className='route-loader'>
		<div className='route-loader-spinner' />
	</div>
);

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
						<Suspense fallback={RouteLoader}>
							<Patients />
						</Suspense>
					</ProtectedRoute>
				),
			},
			{
				path: '/patients/new',
				element: (
					<ProtectedRoute>
						<Suspense fallback={RouteLoader}>
							<AddPatient />
						</Suspense>
					</ProtectedRoute>
				),
			},
			{
				path: '/patients/:id',
				element: (
					<ProtectedRoute>
						<Suspense fallback={RouteLoader}>
							<PatientProfile />
						</Suspense>
					</ProtectedRoute>
				),
			},
		],
	},
]);

export default router;
