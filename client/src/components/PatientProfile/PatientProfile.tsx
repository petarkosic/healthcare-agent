import { useState, useEffect, useRef } from 'react';
import './PatientProfile.css';
import { useParams } from 'react-router';
import type { PatientFullResponse } from '../../types/types';
import { ProfileHeader } from '../ProfileHeader/ProfileHeader';
import { Allergies } from '../Allergies/Allergies';
import { Vitals } from '../Vitals/Vitals';
import { Medications } from '../Medications/Medications';
import { Notes } from '../Notes/Notes';
import { Labs } from '../Labs/Labs';
import { Diagnoses } from '../Diagnoses/Diagnoses';
import { Visits } from '../Visits/Visits';
import { Sidebar } from '../Sidebar/Sidebar';
import { API_BASE } from '../../lib/api';
import { useAuth } from '../../context/Auth/AuthProvider';
import { useSession } from '../../context/SessionContext';

function PatientProfile() {
	const [data, setData] = useState<PatientFullResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

	const [error, setError] = useState<string | null>('');

	const { id: patient_serial } = useParams();
	const { token } = useAuth();
	const { session } = useSession();

	// sentinel '__init__' on first run → records current visitId, skips fetch.
	// On subsequent runs, only fetches when visitId actually changed.
	// Survives StrictMode's double-invoke because the ref value persists across cleanup — second run sees same visitId, no change, no fetch.
	const prevVisitId = useRef<string | null | undefined>('__init__');

	const latestVitals = data?.vital_signs.length ? data.vital_signs[0] : null;

	const fetchPatient = async (signal?: AbortSignal) => {
		try {
			const response = await fetch(
				`${API_BASE}/api/patients/${patient_serial}`,
				{
					headers: { Authorization: `Bearer ${token}` },
					signal,
				},
			);

			if (!response.ok) {
				const errorData = await response.json();

				throw new Error(
					errorData.detail || `HTTP error! status: ${response.status}`,
				);
			}

			const result = await response.json();

			setData(result);
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;
			const err = error as Error;
			setError(err.message);
		}
	};

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		fetchPatient(controller.signal).finally(() => {
			if (!controller.signal.aborted) setLoading(false);
		});
		return () => controller.abort();
	}, [patient_serial]);

	useEffect(() => {
		const current = session?.visitId ?? null;
		if (prevVisitId.current === '__init__') {
			prevVisitId.current = current;
			return;
		}
		if (current !== prevVisitId.current) {
			prevVisitId.current = current;
			fetchPatient();
		}
	}, [session?.visitId]);

	if (loading)
		return <div className='loading-state'>Loading Patient Profile...</div>;

	if (error) return <div className='error-state'>{error}</div>;

	if (!data) return <div className='error-state'>Patient not found.</div>;

	return (
		<div className={`app-wrapper ${isAiSidebarOpen ? 'sidebar-open' : ''}`}>
			<div className='profile-container'>
				{!isAiSidebarOpen && (
					<button
						className='ai-toggle-btn'
						onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
						title={'Open AI Assistant'}
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

				<Allergies data={data} setError={setError} refetch={fetchPatient} />

				<div className='profile-grid'>
					<Vitals
						latestVitals={latestVitals}
						setError={setError}
						refetch={fetchPatient}
					/>

					<Medications data={data} setError={setError} refetch={fetchPatient} />

					<Notes data={data} setError={setError} refetch={fetchPatient} />

					<Labs data={data} setError={setError} refetch={fetchPatient} />

					<Diagnoses data={data} setError={setError} refetch={fetchPatient} />

					<Visits data={data} />
				</div>
			</div>

			<Sidebar
				isAiSidebarOpen={isAiSidebarOpen}
				setIsAiSidebarOpen={setIsAiSidebarOpen}
				setError={setError}
			/>
		</div>
	);
}

export default PatientProfile;
