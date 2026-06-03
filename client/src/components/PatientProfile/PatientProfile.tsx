import { useState, useRef, useEffect } from 'react';
import './PatientProfile.css';
import { useParams } from 'react-router';
import { ProfileHeader } from '../ProfileHeader/ProfileHeader';
import { Allergies } from '../Allergies/Allergies';
import { Vitals } from '../Vitals/Vitals';
import { Medications } from '../Medications/Medications';
import { Notes } from '../Notes/Notes';
import { Labs } from '../Labs/Labs';
import { Diagnoses } from '../Diagnoses/Diagnoses';
import { Visits } from '../Visits/Visits';
import { Sidebar } from '../Sidebar/Sidebar';
import { useAppSelector } from '../../store/hooks';
import { useGetPatientQuery } from '../../store/api/patientsApi';

function PatientProfile() {
	const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
	const [sidebarError, setSidebarError] = useState<string | null>(null);

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

	if (isLoading)
		return <div className='loading-state'>Loading Patient Profile...</div>;

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

	const sidebarOpen = !!session && isAiSidebarOpen;

	return (
		<div className={`app-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
			<div className='profile-container'>
				{!sidebarOpen && (
					<button
						className='ai-toggle-btn'
						onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
						disabled={!session}
						data-tooltip={
							!session ? 'Start a session to use AI Assistant' : undefined
						}
					>
						<svg
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'></path>
						</svg>
						<span>AI Assistant</span>
					</button>
				)}

				<ProfileHeader data={data} />

				<Allergies />

				<div className='profile-grid'>
					<Vitals />

					<Medications />

					<Notes />

					<Labs />

					<Diagnoses />

					<Visits />
				</div>
			</div>

			<Sidebar
				isAiSidebarOpen={sidebarOpen}
				setIsAiSidebarOpen={setIsAiSidebarOpen}
				setError={setSidebarError}
			/>
			{sidebarError && (
				<div
					className='error-state'
					style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}
				>
					{sidebarError}
				</div>
			)}
		</div>
	);
}

export default PatientProfile;
