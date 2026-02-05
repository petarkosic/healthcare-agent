import { useState, useEffect } from 'react';
import './App.css';
import type { TPatients } from './types/types';
import { Patients } from './components/Patients/Patients';

function App() {
	const [patients, setPatients] = useState<TPatients[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('http://localhost:8000/api/patients')
			.then((response) => response.json())
			.then((data) => {
				setPatients(data);
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error fetching patients:', error);
				setLoading(false);
			});
	}, []);

	return (
		<div className='container'>
			<div className='header'>
				<h2>List of Patients</h2>
			</div>

			{loading ? (
				<div className='loading-state'>Loading patient records...</div>
			) : (
				<Patients patients={patients} />
			)}
		</div>
	);
}

export default App;
