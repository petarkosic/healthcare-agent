import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { formatDateOnly, getInitials } from '../../utils/utils';
import { Search } from '../../components/Search/Search';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './Patients.css';
import { useAppSelector } from '../../store/hooks';
import { useGetPatientsQuery } from '../../store/api/patientsApi';

const LockIcon = () => (
	<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
		<rect
			x='5'
			y='11'
			width='14'
			height='9'
			rx='2'
			stroke='currentColor'
			strokeWidth='1.7'
		/>
		<path
			d='M8 11V8a4 4 0 0 1 8 0v3'
			stroke='currentColor'
			strokeWidth='1.7'
		/>
	</svg>
);

export const Patients = () => {
	const session = useAppSelector((state) => state.session.session);
	const navigate = useNavigate();

	useDocumentTitle('Patients');

	const { data: patients, isLoading, error } = useGetPatientsQuery();

	useEffect(() => {
		import('../PatientProfile/PatientProfile');
	}, []);

	// Active-session patient floats to the top of the list.
	const orderedPatients = patients
		? [...patients].sort((a, b) => {
				const aActive =
					session?.patientSerialNumber === String(a.patient_serial_number);
				const bActive =
					session?.patientSerialNumber === String(b.patient_serial_number);
				return Number(bActive) - Number(aActive);
			})
		: patients;

	const handlePatientClick = (patientId: string) => {
		if (session && session.patientSerialNumber !== String(patientId)) return;

		navigate(`/patients/${patientId}`);
	};

	if (isLoading)
		return (
			<div className='patients-page'>
				<div className='patients-header'>
					<h1 className='patients-title'>My Patients</h1>
				</div>
				<div className='patient-list'>
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className='patient-card patient-card--skeleton'>
							<div className='identity'>
								<span className='skeleton patient-card__skel-avatar' />
								<div className='patient-card__skel-lines'>
									<span className='skeleton patient-card__skel-line' />
									<span className='skeleton patient-card__skel-line patient-card__skel-line--short' />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);

	if (error)
		return (
			<div className='patients-page'>
				<div className='error-state'>
					Failed to load patients. Please try again.
				</div>
			</div>
		);

	if (!patients?.length) {
		return (
			<div className='patients-page'>
				<div className='patients-empty'>
					<p className='patients-empty-msg'>No patients assigned yet.</p>
					{!session && (
						<Link to='/patients/new' className='btn btn--primary'>
							Add patient
						</Link>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className='patients-page'>
			<div className='patients-header'>
				<h1 className='patients-title'>
					My Patients <span>{patients.length}</span>
				</h1>
				{!session && (
					<Link to='/patients/new' className='btn btn--primary'>
						Add patient
					</Link>
				)}
			</div>

			<Search disabled={!!session} />

			<div className='patient-list'>
				{orderedPatients!.map((patient) => {
					const serial = String(patient.patient_serial_number);
					const isActive = session?.patientSerialNumber === serial;
					const isLocked = !!session && !isActive;

					return (
						<article
							key={patient.patient_serial_number}
							className={`patient-card${isActive ? ' patient-card--active' : ''}${isLocked ? ' patient-card--locked' : ''}`}
							data-locked-tip={
								isLocked
									? 'Session in progress — end current session first'
									: undefined
							}
							onClick={() => handlePatientClick(patient.patient_serial_number)}
						>
							<div className='identity'>
								<div className='patient-card__avatar'>
									{getInitials(patient.full_name)}
								</div>
								<div>
									<div className='patient-card__name'>
										{patient.full_name}
										{isActive && (
											<span className='patient-card__sess'>
												<span className='patient-card__sess-dot' />
												Session in progress
											</span>
										)}
									</div>
									<div className='patient-card__sub'>
										<span className='u-mono'>#{serial}</span>
										<span className='patient-card__sep' />
										<span>
											{patient.age}y &middot; {patient.gender}
										</span>
									</div>
								</div>
							</div>

							<div className='patient-card__stats'>
								{isLocked && (
									<div className='patient-card__lock'>
										<LockIcon />
										End current session to open
									</div>
								)}
								<div className='patient-card__stat'>
									<div className='patient-card__stat-n u-mono'>
										{patient.total_visits}
									</div>
									<div className='patient-card__stat-k'>Visits</div>
								</div>
								<div className='patient-card__stat'>
									<div className='patient-card__stat-n u-mono'>
										{patient.active_medications_count}
									</div>
									<div className='patient-card__stat-k'>Active meds</div>
								</div>
								<div className='patient-card__stat patient-card__stat--wide'>
									<div className='patient-card__stat-n u-mono'>
										{formatDateOnly(patient.last_visit_date)}
									</div>
									<div className='patient-card__stat-k'>Last visit</div>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</div>
	);
};
