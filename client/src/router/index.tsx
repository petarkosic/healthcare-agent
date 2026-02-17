import { createBrowserRouter, Outlet } from 'react-router';
import App from '../App';
import PatientProfile from '../components/PatientProfile/PatientProfile';
import { Navbar } from '../components/Navbar/Navbar';

const router = createBrowserRouter([
	{
		path: '/',
		element: (
			<>
				<Navbar />
				<Outlet />
			</>
		),
		children: [
			{
				path: '/',
				element: <App />,
			},
			{
				path: '/patients/:id',
				element: <PatientProfile />,
			},
		],
	},
]);

export default router;
