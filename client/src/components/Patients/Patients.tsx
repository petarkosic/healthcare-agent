import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import type { TPatients } from '../../types/types';
import { getInitials } from '../../utils/utils';
import { Search } from '../Search/Search';
import './Patients.css';
import { useAuth } from '../../context/Auth/AuthProvider';
import { useSession } from '../../context/SessionContext';
import { API_BASE } from '../../lib/api';

export const Patients = () => {
	const [patients, setPatients] = useState<TPatients[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { doctorSerialNumber, token } = useAuth();
	const { session } = useSession();

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

	if (patients.length === 0) {
		return (
			<div className='patients-empty'>
				<p className='patients-empty-msg'>No patients assigned yet.</p>
				<Link to='/patients/new' className='btn-add-patient'>
					Add New Patient
				</Link>
			</div>
		);
	}

	return (
		<div className='patients-page'>
			<div className='patients-header'>
				<h2 className='patients-title'>My Patients</h2>
				<Link to='/patients/new' className='btn-add-patient'>
					Add New Patient
				</Link>
			</div>

			<Search />

			<div className='patient-list'>
				{patients.map((patient) => (
					<article
						key={patient.patient_serial_number}
						className={`patient-card${session?.patientSerialNumber === String(patient.patient_serial_number) ? ' patient-card--active' : ''}`}
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
								{session?.patientSerialNumber ===
									String(patient.patient_serial_number) && (
									<span className='session-active-badge'>
										Session in progress
									</span>
								)}
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
		</div>
	);
};
