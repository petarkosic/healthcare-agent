import { createBrowserRouter } from 'react-router';
import App from '../App';
import PatientProfile from '../components/PatientProfile/PatientProfile';

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
	},
	{
		path: '/patients/:id',
		element: <PatientProfile />,
	},
]);

export default router;
