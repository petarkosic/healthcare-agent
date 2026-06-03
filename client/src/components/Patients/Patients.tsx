import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { getInitials } from '../../utils/utils';
import { Search } from '../Search/Search';
import './Patients.css';
import { useAppSelector } from '../../store/hooks';
import { useGetPatientsQuery } from '../../store/api/patientsApi';

export const Patients = () => {
	const session = useAppSelector((state) => state.session.session);
	const navigate = useNavigate();

	const { data: patients, isLoading, error } = useGetPatientsQuery();

	useEffect(() => {
		import('../PatientProfile/PatientProfile');
	}, []);

	const handlePatientClick = (patientId: number) => {
		navigate(`/patients/${patientId}`);
	};

	if (isLoading) return <div className='loading'>Loading patients...</div>;
	if (error)
		return (
			<div className='error'>Failed to load patients. Please try again.</div>
		);

	if (!patients?.length) {
		return (
			<div className='patients-empty'>
				<p className='patients-empty-msg'>No patients assigned yet.</p>
				{!session && (
					<Link to='/patients/new' className='btn-add-patient'>
						Add New Patient
					</Link>
				)}
			</div>
		);
	}

	return (
		<div className='patients-page'>
			<div className='patients-header'>
				<h2 className='patients-title'>My Patients</h2>
				{!session && (
					<Link to='/patients/new' className='btn-add-patient'>
						Add New Patient
					</Link>
				)}
			</div>

			<Search />

			<div className='patient-list'>
				{patients.map((patient) => (
					<article
						key={patient.patient_serial_number}
						className={`patient-card${session?.patientSerialNumber === String(patient.patient_serial_number) ? ' patient-card--active' : ''}`}
						onClick={() => handlePatientClick(patient.patient_serial_number)}
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
