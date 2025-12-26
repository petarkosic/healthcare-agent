import { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router';

interface Patients {
	patient_serial_number: number;
	full_name: string;
	age: number;
	gender: string;
	blood_type: string;
	alergies: string[];
	chronic_conditions: string[];
	total_visits: number;
	last_visit_date: string;
	active_medications_count: number;
}

function App() {
	const [patients, setPatients] = useState<Patients[]>([]);
	const [loading, setLoading] = useState(true);

	const navigate = useNavigate();

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

	// Helper function to get initials from full name
	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substring(0, 2)
			.toUpperCase();
	};

	const handlePatientClick = (patientId: number) => {
		navigate(`/patients/${patientId}`);
	};

	return (
		<div className='container'>
			<div className='header'>
				<h2>List of Patients</h2>
			</div>

			{loading ? (
				<div className='loading-state'>Loading patient records...</div>
			) : (
				<div className='patient-list'>
					{patients.map((patient) => (
						<article
							key={patient.patient_serial_number}
							className='patient-card'
							onClick={() => {
								handlePatientClick(patient.patient_serial_number);
							}}
						>
							<div className='identity'>
								<div className='avatar'>{getInitials(patient.full_name)}</div>
								<div className='info'>
									<h3>{patient.full_name}</h3>
									<span className='serial'>
										ID: #{patient.patient_serial_number}
									</span>
								</div>
							</div>

							<div className='vitals'>
								<div>
									{patient.age}y • {patient.gender}
								</div>
								<div className='blood-type'>{patient.blood_type}</div>
							</div>

							<div className='history'>
								<div className='tag-group'>
									<span className='tag-label'>Allergies:</span>
									{patient.alergies && patient.alergies.length > 0 ? (
										patient.alergies.map((allergy, index) => (
											<span key={index} className='tag allergy'>
												{allergy}
											</span>
										))
									) : (
										<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
											None known
										</span>
									)}
								</div>

								<div className='tag-group'>
									<span className='tag-label'>Conditions:</span>
									{patient.chronic_conditions &&
									patient.chronic_conditions.length > 0 ? (
										patient.chronic_conditions.map((condition, index) => (
											<span key={index} className='tag condition'>
												{condition}
											</span>
										))
									) : (
										<span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
											None reported
										</span>
									)}
								</div>
							</div>

							<div className='stats'>
								<div className='stat-item'>
									<span className='stat-val'>{patient.total_visits}</span>
									<span className='stat-lbl'>Visits</span>
								</div>
								<div className='stat-item'>
									<span className='stat-val'>
										{patient.active_medications_count}
									</span>
									<span className='stat-lbl'>Active Meds</span>
								</div>
								<div className='last-visit'>
									Last Visit:{' '}
									{new Date(patient.last_visit_date).toLocaleDateString()}
								</div>
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	);
}

export default App;
