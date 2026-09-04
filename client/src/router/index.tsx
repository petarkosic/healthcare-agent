import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import App from '../App';
import AppShell from '../components/AppShell/AppShell';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { PageLoader } from '../components/Spinner/PageLoader';

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Patients = lazy(() =>
	import('../pages/Patients/Patients').then((m) => ({ default: m.Patients })),
);
const AddPatient = lazy(() =>
	import('../pages/AddPatient/AddPatient').then((m) => ({
		default: m.AddPatient,
	})),
);
const PatientProfile = lazy(
	() => import('../pages/PatientProfile/PatientProfile'),
);
const NotFound = lazy(() => import('../pages/NotFound/NotFound'));

const withSuspense = (node: ReactNode) => (
	<Suspense fallback={<PageLoader />}>{node}</Suspense>
);

const router = createBrowserRouter([
	{ path: '/', element: <App /> },
	{
		path: '/',
		element: (
			<ProtectedRoute>
				<AppShell />
			</ProtectedRoute>
		),
		children: [
			{ path: 'dashboard', element: withSuspense(<Dashboard />) },
			{ path: 'patients', element: withSuspense(<Patients />) },
			{ path: 'patients/new', element: withSuspense(<AddPatient />) },
			{ path: 'patients/:id', element: withSuspense(<PatientProfile />) },
			{ path: '*', element: withSuspense(<NotFound />) },
		],
	},
	{ path: '*', element: withSuspense(<NotFound />) },
]);

export default router;
