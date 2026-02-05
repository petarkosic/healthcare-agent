import { useNavigate } from 'react-router';
import type { TPatients } from '../../types/types';
import { getInitials } from '../../utils/utils';
import './Patients.css';

type PatientsProps = {
	patients: TPatients[];
};

export const Patients = ({ patients }: PatientsProps) => {
	const navigate = useNavigate();

	const handlePatientClick = (patientId: number) => {
		navigate(`/patients/${patientId}`);
	};

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
						<div className='blood-type'>{patient.blood_type}</div>
					</div>

					<div className='history'>
						<div className='tag-group'>
							<span className='tag-label'>Allergies:</span>
							{patient.allergies && patient.allergies.length > 0 ? (
								patient.allergies.map((allergy: string, index: number) => (
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
								patient.chronic_conditions.map(
									(condition: string, index: number) => (
										<span key={index} className='tag condition'>
											{condition}
										</span>
									),
								)
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
	);
};
