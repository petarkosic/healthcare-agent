import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { TPatients } from '../../types/types';
import { getInitials } from '../../utils/utils';
import './Patients.css';
import { useAuth } from '../../context/Auth/AuthProvider';
import { API_BASE } from '../../lib/api';

export const Patients = () => {
	const [patients, setPatients] = useState<TPatients[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { doctorSerialNumber, token } = useAuth();

	const navigate = useNavigate();

	useEffect(() => {
		if (!doctorSerialNumber || !token) {
			setError('Authentication required');
			setLoading(false);
			return;
		}

		const controller = new AbortController();

		const fetchPatients = async () => {
			try {
				const url = `${API_BASE}/api/patients?doctor_serial_number=${encodeURIComponent(doctorSerialNumber)}`;

				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch: ${response.status}`);
				}

				const data: TPatients[] = await response.json();

				setPatients(data);
				setError(null);
			} catch (err) {
				if (err instanceof Error && err.name !== 'AbortError') {
					console.error('Error fetching patients:', err);

					setError('Failed to load patients. Please try again.');
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		fetchPatients();

		return () => controller.abort();
	}, [doctorSerialNumber, token]);

	const handlePatientClick = (patientId: number) => {
		navigate(`/patients/${patientId}`);
	};

	if (loading) return <div className='loading'>Loading patients...</div>;
	if (error) return <div className='error'>{error}</div>;

	return (
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
	);
};
