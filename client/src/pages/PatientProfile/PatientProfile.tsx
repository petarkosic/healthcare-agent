import { useRef, useEffect } from 'react';
import './PatientProfile.css';
import { Link, useParams } from 'react-router';
import { ProfileHeader } from '../../components/patient/ProfileHeader/ProfileHeader';
import { Allergies } from '../../components/patient/Allergies/Allergies';
import { Vitals } from '../../components/patient/Vitals/Vitals';
import { Medications } from '../../components/patient/Medications/Medications';
import { Notes } from '../../components/patient/Notes/Notes';
import { Labs } from '../../components/patient/Labs/Labs';
import { Diagnoses } from '../../components/patient/Diagnoses/Diagnoses';
import { Visits } from '../../components/patient/Visits/Visits';
import { AIAssistant } from '../../components/patient/AIAssistant/AIAssistant';
import { PageLoader } from '../../components/Spinner/PageLoader';
import { useAppSelector } from '../../store/hooks';
import { useGetPatientQuery } from '../../store/api/patientsApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

function PatientProfile() {
	const { id: patient_serial } = useParams();
	const session = useAppSelector((state) => state.session.session);

	const { data, isLoading, error, refetch } = useGetPatientQuery(
		patient_serial!,
	);

	const prevVisitId = useRef<string | null | undefined>('__init__');

	useEffect(() => {
		const current = session?.visitId ?? null;

		if (prevVisitId.current === '__init__') {
			prevVisitId.current = current;

			return;
		}
		if (current !== prevVisitId.current) {
			prevVisitId.current = current;

			refetch();
		}
	}, [session?.visitId, refetch]);

	const patientName = data
		? `${data.patient.first_name} ${data.patient.last_name}`
		: 'Patient';

	useDocumentTitle(patientName);

	if (isLoading) return <PageLoader label='Loading patient profile…' />;

	if (error)
		return (
			<div className='error-state'>
				{'data' in error
					? ((error.data as { detail?: string })?.detail ??
						'Failed to load patient')
					: 'Failed to load patient'}
			</div>
		);

	if (!data) return <div className='error-state'>Patient not found.</div>;

	return (
		<div className='patient-profile'>
			<div className='breadcrumb'>
				<Link to='/patients'>Patients</Link>
				<svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
					<path
						d='M9 6l6 6-6 6'
						stroke='currentColor'
						strokeWidth='1.8'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</svg>
				<span className='breadcrumb__here'>{patientName}</span>
			</div>

			<ProfileHeader data={data} />

			<Allergies />

			<div className='patient-profile__layout'>
				<div className='patient-profile__grid'>
					<Vitals />
					<Medications />
					<Notes />
					<Labs />
					<Diagnoses />
					<Visits />
				</div>

				<div className='patient-profile__side'>
					<AIAssistant />
				</div>
			</div>
		</div>
	);
}

export default PatientProfile;
